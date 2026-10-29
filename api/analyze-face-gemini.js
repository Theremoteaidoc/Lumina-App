/**
 * api/analyze-face-gemini.js
 *
 * Vercel Serverless Function — Lumina facial analysis via Google Gemini VISION,
 * grounded in the curated visagism knowledge base. Gemini is the SOLE decision
 * maker for the shown result — this is a PURE vision analysis. No geometric
 * metrics/scores are sent to it (they used to bias/anchor its answer).
 * Also works in dev via the Vite API middleware in vite.config.js.
 *
 * POST /api/analyze-face-gemini
 * Body: {
 *   image: string (base64, no data: prefix),
 *   imageMime: 'image/jpeg'|'image/png'|'image/webp',
 *   profile?: { name?, ageRange?, ... },
 * }
 *
 * Returns:
 *   { ok: true, analysis: {...}, model: string }  — success
 *   { ok: false, noKey: true }                    — no GEMINI_API_KEY_FACE configured
 *   { ok: false, busy: true, error }               — every model in the chain was
 *                                                     saturated/rate-limited
 *   { ok: false, error }                           — genuine error
 *
 * NOTE: Gemini is now the ONLY brain behind the face-scan result. There is no
 * silent fallback to the geometric classifier — the frontend must show an
 * honest "couldn't analyze, try again" state on failure instead.
 *
 * IMPORTANT — this uses a SEPARATE Gemini API key (GEMINI_API_KEY_FACE) from
 * the chat (GEMINI_API_KEY), so face-scan traffic never eats into the chat's
 * free-tier daily quota (and vice versa).
 */

import { z } from 'zod';
import { LUMINA_PERSONALITY } from '../src/data/knowledge/personality.js';
import { getTopicsByDomain } from '../src/data/knowledge/luminaContext.js';
import { FACE_DATA } from '../src/data/appData.js';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

// Same model-fallback philosophy as api/chat-gemini.js — each model has its
// own free-tier daily quota bucket, so trying a chain multiplies the
// effective budget instead of being capped by a single model's limit.
// For FACE analysis we prioritize VISION QUALITY over quota (unlike the chat,
// which prioritizes quota). The most capable models go first; the "lite" model
// is a last resort because it discriminates face shapes poorly.
//
// ACCURACY-FIRST cascade (2026-08-31): face-shape discrimination is very
// model-sensitive. gemini-3.6-flash is the ONLY model validated to get the hard
// shapes right (square/heart/diamond) — it "acertó en todas" on the test set.
// gemini-3.5-flash responds fast but confuses those same hard shapes, so it must
// NOT lead. Order = best classifier first; faster-but-weaker models only as
// fallback when the good ones are down; flash-lite DEAD LAST (avoids hard fail).
// Note: a saturated model returns 503 instantly, so leading with 3.6 costs
// nothing when it's busy — we just fall through fast.
const GEMINI_MODELS = [
  'gemini-3.6-flash',        // PROVEN accurate on hard shapes — always prefer it
  'gemini-3.7-flash',        // newest/best quality; tried next if 3.6 is down
  'gemini-3-flash-preview',  // gen-3 quality fallback
  'gemini-2.5-flash',        // solid fallback, usually available
  'gemini-3.5-flash',        // gen-3 but weaker on square/heart/diamond — low
  'gemini-flash-latest',     // rolling alias to a current flash
  'gemini-2.5-flash-lite',   // LAST resort only (weak) — prevents a total failure
];
const TIMEOUT_MS = 45_000; // face vision on the best model can be slow; give it room before falling to a weaker model
// ~4MB of base64 (base64 is ~4/3 the size of raw bytes, so this caps the
// original image at roughly 3MB — plenty after the frontend's own compression).
const MAX_IMAGE_BASE64_CHARS = 4 * 1024 * 1024;

const VALID_FACE_SHAPES = Object.keys(FACE_DATA); // ovalado, redondo, cuadrado, alargado, corazon, diamante

// ─────────────────────────────────────────────────────────────────────────────
// Input schema
// ─────────────────────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  image: z.string().min(100, 'image must be a non-empty base64 string'),
  imageMime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  // Legacy fields — no longer read or forwarded to Gemini (pure vision analysis
  // now), but accepted (and ignored) so older cached frontend builds don't 400.
  metrics: z.record(z.string(), z.any()).optional(),
  geometricShape: z.string().optional(),
  geometricScores: z.record(z.string(), z.any()).optional(),
  profile: z
    .object({
      name: z.string().optional(),
      ageRange: z.string().optional(),
    })
    .passthrough()
    .optional()
    .default({}),
});

// ─────────────────────────────────────────────────────────────────────────────
// System prompt — grounded EXCLUSIVELY in the curated visagism knowledge base
// ─────────────────────────────────────────────────────────────────────────────

function buildVisagismContext() {
  const topics = getTopicsByDomain('visagism');
  return topics
    .map((t) => {
      const findings = (t.key_findings_es || []).slice(0, 3).join('; ');
      return `### ${t.title}\n${t.summary_es || ''}${findings ? `\nHallazgos clave: ${findings}` : ''}`;
    })
    .join('\n\n');
}

function buildSystemPrompt() {
  const visagismContext = buildVisagismContext();

  return `${LUMINA_PERSONALITY}

═══════════════════════════════════════════════
MÓDULO DE ANÁLISIS FACIAL (VISIÓN PURA)
═══════════════════════════════════════════════

Eres el módulo de análisis facial de Lumina. Tu conocimiento se basa EXCLUSIVAMENTE en esta base curada de visagismo:

${visagismContext}

Vas a analizar una foto de rostro. Este es un análisis de VISIÓN PURO — no se te da ninguna medición geométrica previa. Tu ojo es la ÚNICA fuente. Llega a tu propia conclusión mirando la foto con cuidado.

MÉTODO OBLIGATORIO (sigue estos pasos antes de decidir):
1. Observa la RELACIÓN largo/ancho del rostro: ¿la cara es claramente más larga que ancha (~1.5x o más), o casi tan ancha como larga (~1.0-1.3)?
2. Identifica la ZONA MÁS ANCHA: ¿la frente, los pómulos, o la mandíbula? Esto es DECISIVO.
3. Observa la MANDÍBULA: ¿angulosa y marcada, o suave y redondeada?
4. Observa el MENTÓN: ¿puntiagudo/estrecho, o recto/ancho?

LA MANDÍBULA ES EL RASGO MÁS DECISIVO — obsérvala con MUCHO cuidado:
- ¿Tiene ESQUINAS/ÁNGULOS marcados y definidos en el gonion (donde la mandíbula se dobla hacia la oreja)? → señal FUERTE de CUADRADO.
- ¿Es redondeada y sin ángulos visibles? → redondo/ovalado.
- ¿Se afina claramente hacia un mentón PUNTIAGUDO y estrecho? → corazón.
Una mandíbula fuerte, ancha y bien definida indica CUADRADO aunque la frente parezca algo ancha. NO leas una mandíbula marcada como "suave".

CRITERIOS DE CADA FORMA (elige la que mejor calce con lo observado):
- REDONDO: largo ≈ ancho (cara casi circular), mandíbula SUAVE y redondeada, pómulos la zona más ancha, mejillas llenas, sin ángulos marcados.
- CUADRADO: mandíbula ANGULAR, fuerte y definida (esquinas visibles), frente ≈ pómulos ≈ mandíbula (anchuras similares), mentón más bien recto o ancho. Puede ser corto o medio de largo.
- ALARGADO: cara claramente MÁS LARGA que ancha (≥1.5x), las tres anchuras parecidas, frente alta.
- CORAZON: la FRENTE es la zona MÁS ANCHA, la mandíbula es ESTRECHA y se afina a un mentón claramente PUNTIAGUDO. La mandíbula NO es fuerte ni angular — si lo es, es cuadrado, no corazón.
- DIAMANTE: los PÓMULOS son claramente la zona más ancha, con frente Y mandíbula más estrechas; mentón angosto.
- OVALADO: SOLO si el rostro está genuinamente EQUILIBRADO — más largo que ancho (~1.4-1.6x), pómulos ligeramente la zona más ancha, frente apenas más ancha que la mandíbula, mandíbula suave, estrechamiento gradual y armónico.

DISTINCIÓN CLAVE CUADRADO vs CORAZÓN (se confunden mucho): ambos pueden tener la frente ancha. La diferencia está en la MANDÍBULA y el MENTÓN: CUADRADO = mandíbula fuerte/angular + mentón recto o ancho. CORAZÓN = mandíbula que se afina + mentón puntiagudo y estrecho. Si la mandíbula se ve marcada y definida → CUADRADO.

DISTINCIÓN CLAVE DIAMANTE vs CORAZÓN (la más difícil — hazla con MUCHO cuidado): AMBAS tienen mentón puntiagudo y mandíbula estrecha. La ÚNICA diferencia es la ZONA MÁS ANCHA:
- CORAZÓN: la FRENTE es lo más ancho de todo el rostro; los pómulos NO sobresalen más que la frente.
- DIAMANTE: los PÓMULOS son el punto MÁS ANCHO, y la FRENTE es ESTRECHA (más angosta que los pómulos). El rostro se ve como un rombo: angosto arriba, ancho en medio, angosto abajo.
Antes de decidir entre estas dos, compara con cuidado el ancho de los HUESOS: ¿el punto más ancho está a la altura de la frente/sienes, o a la altura de los pómulos (bajo los ojos)?
CUIDADO CON EL PELO: un nacimiento de pelo alto, el cabello recogido, o entradas pueden hacer que la frente PAREZCA más ancha de lo que el hueso realmente es. Fíjate en el ancho ÓSEO de las sienes, no en dónde empieza el pelo. Si los pómulos claramente proyectan hacia afuera más que las sienes → DIAMANTE, aunque la frente se vea despejada.

REGLA CRÍTICA: NO uses "ovalado" por defecto cuando dudes — es la forma más sobre-diagnosticada. Comprométete con lo que observas: frente más ancha con mentón puntiagudo → corazón; mandíbula angular/fuerte → cuadrado; pómulos los más anchos con frente y mandíbula estrechas → diamante; cara muy redonda → redondo.

CALIDAD DE FOTO — evalúa PRIMERO: para un análisis confiable necesitas una foto FRONTAL, con la mandíbula y las sienes VISIBLES (cabello recogido/despejado) y buena luz. Si el cabello tapa los lados del rostro o la mandíbula, si la cara está girada/de perfil, o si hay poca luz para ver los contornos → pon "photoOk": false y describe el problema en "photoIssue". En ese caso, igual da tu mejor estimación de forma pero con confianza "baja". Una mandíbula tapada por cabello es la causa #1 de error — sé estricta.

AMBIGÜEDAD — sé honesta sobre tu certeza:
- Si el rostro encaja CLARAMENTE en una forma → "isAmbiguous": false, "secondaryShape": null, "confidence": "alta". Comprométete con esa forma.
- Si el rostro está genuinamente ENTRE dos formas (proporciones ~50/50, o una segunda forma es NOTORIAMENTE visible) → "isAmbiguous": true, "secondaryShape": la otra forma, "confidence": "media" o "baja".
- NO marques ambiguo por costumbre. La mayoría de rostros tienen una forma dominante clara. Solo marca ambiguo cuando de verdad no puedas decidir o la segunda forma sea muy evidente.

Otras reglas:
- Casi ningún rostro es una forma pura — lista influencias secundarias reales.
- Básate en la base de conocimiento de arriba. No inventes.
- Considera la edad del perfil (rasgos adolescentes en desarrollo).
- NUNCA califiques el atractivo ni compares — describe proporciones, no jerarquías de belleza.

Responde SOLO JSON válido, sin markdown, sin \`\`\`json wrappers, con esta estructura exacta. Rellena "observations" PRIMERO (te obliga a razonar antes de clasificar):
{
  "photoOk": true | false,
  "photoIssue": "descripción corta del problema si photoOk es false (ej. 'el cabello cubre la mandíbula', 'la foto está de perfil, no de frente', 'poca luz') o null si photoOk es true",
  "observations": {
    "largoVsAncho": "descripción de la relación (ej. 'claramente más larga que ancha, ~1.5x')",
    "zonaMasAncha": "frente" | "pomulos" | "mandibula" | "equilibrado",
    "mandibula": "angulosa" | "suave",
    "menton": "puntiagudo" | "recto" | "redondeado"
  },
  "primaryShape": "ovalado" | "redondo" | "cuadrado" | "alargado" | "corazon" | "diamante",
  "confidence": "alta" | "media" | "baja",
  "isAmbiguous": true | false,
  "secondaryShape": "ovalado" | "redondo" | "cuadrado" | "alargado" | "corazon" | "diamante" | null,
  "summary": "1-2 oraciones cálidas describiendo el rostro, usa el nombre si está en el perfil",
  "characteristics": {
    "frente": "...",
    "pomulos": "...",
    "mandibula": "...",
    "menton": "...",
    "proporciones": "..."
  }
}`;
}

const FACE_ANALYSIS_SYSTEM = buildSystemPrompt();

// ─────────────────────────────────────────────────────────────────────────────
// Gemini call with model fallback chain (adapted from api/chat-gemini.js)
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RETRY_503_MS = 1500;

/**
 * Tries each model in GEMINI_MODELS in order until one succeeds.
 * - 200 OK              → return immediately with that model's data.
 * - 429 (daily quota)   → quota doesn't refill in seconds, so move to the NEXT model right away.
 * - 503 (transient)     → retry the SAME model once after a short backoff, then move on.
 * - network/other error → move to the next model.
 * Returns { ok: true, data, model } or { ok: false, lastStatus }.
 */
async function callGeminiWithFallback(body, apiKey) {
  let lastStatus = 0;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      let res, data;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        data = await res.json();
      } catch (err) {
        clearTimeout(timeout);
        console.error(`[analyze-face-gemini] ${model} fetch error (attempt ${attempt + 1}):`, err?.message);
        break; // network/abort error with this model → try next model
      }
      clearTimeout(timeout);

      if (res.ok) return { ok: true, data, model };

      lastStatus = res.status;
      console.error(`[analyze-face-gemini] ${model} → ${res.status} (attempt ${attempt + 1}):`, JSON.stringify(data)?.slice(0, 200));

      if (res.status === 503 && attempt === 0) {
        await sleep(RETRY_503_MS);
        continue; // retry the same model once
      }
      break; // 429 (quota) or any other error, or out of 503 retries → next model
    }
  }

  return { ok: false, lastStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// Response parsing / validation
// ─────────────────────────────────────────────────────────────────────────────

function extractJson(rawText) {
  if (!rawText) return null;
  // Strip ```json ... ``` or ``` ... ``` wrappers if Gemini adds them anyway.
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Last resort: try to find the outermost { ... } block.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Observation-based safety net
//
// Gemini reliably FILLS the structured `observations` (its direct visual read of
// widest zone / jaw / chin), but sometimes mislabels `primaryShape` — most often
// defaulting to "ovalado" even when its own observations describe a
// diamante/corazon/cuadrado. This net derives the shape the observations point to
// and, when it CLEARLY contradicts the label, corrects it (demoting the model's
// original label to a secondary influence). It fires ONLY on unambiguous
// observational signatures, so it never invents a shape the model didn't describe
// — verified to leave correct classifications untouched (see reconcile trace).
// ─────────────────────────────────────────────────────────────────────────────
export function shapeFromObservations(obs) {
  if (!obs || typeof obs !== 'object') return null;
  const zona = String(obs.zonaMasAncha || '').toLowerCase();
  const mand = String(obs.mandibula || '').toLowerCase();
  const ment = String(obs.menton || '').toLowerCase();

  const jawAngular  = mand.includes('angul');                       // "angulosa"
  const chinPointed = ment.includes('punt');                        // "puntiagudo"
  const foreheadWidest = zona.includes('frente');
  const cheeksWidest   = zona.includes('pomulo') || zona.includes('pómulo');

  // CORAZÓN: la frente es lo más ancho + mentón puntiagudo (mandíbula que se afina).
  if (foreheadWidest && chinPointed && !jawAngular) return 'corazon';
  // DIAMANTE: pómulos lo más ancho + mentón puntiagudo/angosto + mandíbula NO fuerte.
  if (cheeksWidest && chinPointed && !jawAngular) return 'diamante';
  // CUADRADO: mandíbula angular/fuerte + mentón NO puntiagudo (recto/ancho).
  if (jawAngular && !chinPointed) return 'cuadrado';
  // redondo / alargado / ovalado dependen de matices largo-vs-ancho (texto libre)
  // y estrechamientos graduales — se dejan al criterio del modelo, no se fuerzan.
  return null;
}

export function reconcileShapeWithObservations(obj) {
  if (!obj || obj.photoOk === false || !obj.primaryShape) return;
  const derived = shapeFromObservations(obj.observations);
  if (!derived || derived === obj.primaryShape) return;

  // The model's OWN observations clearly point to `derived` but it labeled
  // something else — trust the observation-backed shape. Keep the original label
  // as a secondary influence and null the free-text summary (it described the old
  // shape and would now contradict the corrected headline; the UI renders the
  // summary only when present, and the shape-appropriate description still shows).
  const original = obj.primaryShape;
  obj.primaryShape = derived;
  obj.secondaryShape = original;
  obj.isAmbiguous = false;
  obj.summary = null;
  obj._correctedByObservations = { from: original, to: derived };
}

function validateAnalysis(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.photoOk !== 'boolean') obj.photoOk = true; // tolerant default

  if (!obj.primaryShape || !VALID_FACE_SHAPES.includes(obj.primaryShape)) {
    // A valid primaryShape is required UNLESS Gemini flagged the photo as
    // unusable (photoOk: false) and truly couldn't even guess (e.g. a blank/
    // unreadable image) — the frontend never shows primaryShape in that case,
    // it only needs photoIssue, so don't hard-fail the whole response.
    if (obj.photoOk === false) {
      obj.primaryShape = null;
    } else {
      return false;
    }
  }
  if (obj.secondaryShape && (!VALID_FACE_SHAPES.includes(obj.secondaryShape) || obj.secondaryShape === obj.primaryShape)) {
    // Not fatal — an invalid/self-referential secondary shape just means "not ambiguous".
    obj.secondaryShape = null;
    obj.isAmbiguous = false;
  }
  if (typeof obj.isAmbiguous !== 'boolean') obj.isAmbiguous = false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
    return;
  }

  // No key → tell the frontend Gemini isn't configured (not an error the user sees
  // raw — the frontend shows a "try again later" honest state).
  // Uses a SEPARATE key (GEMINI_API_KEY_FACE) from the chat's GEMINI_API_KEY.
  if (!process.env.GEMINI_API_KEY_FACE) {
    res.status(200).json({ ok: false, noKey: true });
    return;
  }

  let parsed;
  try {
    const result = RequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ ok: false, error: 'Petición inválida.', detail: result.error.flatten().fieldErrors });
      return;
    }
    parsed = result.data;
  } catch {
    res.status(400).json({ ok: false, error: 'No se pudo leer la petición.' });
    return;
  }

  // Defense in depth: the frontend already compresses images before sending,
  // but never trust the client — reject oversized payloads outright.
  if (parsed.image.length > MAX_IMAGE_BASE64_CHARS) {
    res.status(413).json({ ok: false, error: 'La imagen es muy grande.' });
    return;
  }

  // Pure vision analysis — NO geometric metrics are sent. Gemini is the sole
  // decision maker; giving it pre-computed ratios used to bias/anchor its answer.
  const userText = `Analiza la foto siguiendo el MÉTODO paso a paso. Tu conclusión debe basarse ÚNICAMENTE en lo que VES en la imagen. Perfil: ${JSON.stringify({
    name: parsed.profile?.name,
    ageRange: parsed.profile?.ageRange,
  })}. Devuelve el JSON con photoOk y observations primero, luego la clasificación.`;

  const body = {
    system_instruction: { parts: [{ text: FACE_ANALYSIS_SYSTEM }] },
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: parsed.imageMime, data: parsed.image } },
          { text: userText },
        ],
      },
    ],
    generationConfig: {
      // This is a hard visual discrimination task (e.g. diamante vs corazón) —
      // thinking is ON so Gemini actually reasons through the MÉTODO steps
      // before committing to a shape, instead of pattern-matching lazily.
      maxOutputTokens: 2048,
      temperature: 0.4,
      thinkingConfig: { thinkingBudget: 1024 },
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const result = await callGeminiWithFallback(body, process.env.GEMINI_API_KEY_FACE);

  if (!result.ok) {
    const RETRY_STATUSES = new Set([429, 503]);
    const busy = RETRY_STATUSES.has(result.lastStatus);
    res.status(busy ? 503 : 502).json({
      ok: false,
      busy,
      error: busy
        ? 'El análisis con IA está con mucha demanda ahora mismo.'
        : 'Gemini no disponible.',
    });
    return;
  }

  const { data, model: usedModel } = result;
  const candidate = data?.candidates?.[0];
  const rawText = candidate?.content?.parts?.map((p) => p.text).join('').trim() ?? '';

  const analysis = extractJson(rawText);

  if (!validateAnalysis(analysis)) {
    console.error('[analyze-face-gemini] Invalid/unparseable analysis. Finish reason:', candidate?.finishReason, '| Raw:', rawText.slice(0, 300));
    res.status(502).json({ ok: false, error: 'Respuesta de IA no válida.' });
    return;
  }

  // Safety net: correct the label when Gemini's own observations contradict it.
  reconcileShapeWithObservations(analysis);

  const corr = analysis._correctedByObservations;
  console.log(`[analyze-face-gemini] SUCCESS model=${usedModel} photoOk=${analysis.photoOk} shape=${analysis.primaryShape} isAmbiguous=${analysis.isAmbiguous} secondaryShape=${analysis.secondaryShape}${corr ? ` [CORREGIDO por observaciones: ${corr.from}→${corr.to}]` : ''}`);
  res.status(200).json({ ok: true, analysis, model: usedModel });
}
