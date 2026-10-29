/**
 * api/chat-gemini.js
 *
 * Vercel Serverless Function — Lumina chat via Google Gemini (FREE tier).
 * Also works in dev via the Vite API middleware in vite.config.js.
 *
 * POST /api/chat-gemini
 * Body: { messages: [{role, content}, ...], profile?: object, image?: string (base64, no data: prefix), imageMime?: 'image/jpeg'|'image/png'|'image/webp' }
 *
 * Returns:
 *   { ok: true, reply: string }                — success
 *   { ok: false, noKey: true }                 — no GEMINI_API_KEY configured (frontend falls back to local engine silently)
 *   { ok: false, error: string }               — genuine error (frontend falls back to local engine)
 *
 * Get a FREE key at: https://aistudio.google.com/apikey  (needs a Google account, no credit card)
 */

import { z } from 'zod';
import { LUMINA_PERSONALITY } from '../src/data/knowledge/personality.js';
import { findRelevantTopics, getSourceById } from '../src/data/knowledge/luminaContext.js';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

// Each Gemini model has its OWN separate free-tier daily quota
// (GenerateRequestsPerDayPerProjectPerModel-FreeTier). gemini-2.5-flash alone
// only gets 20 req/day and exhausts almost immediately, dropping the chat to
// the "estoy saturada" fallback. Instead of a single model, we try a chain of
// models in priority order — first one with quota left wins. This multiplies
// the effective daily budget instead of being capped by one model's 20/day.
//
// Order rationale (higher free quota / more reliable first, best quality last
// as a final-resort attempt since it has the smallest quota):
//   1-2. Confirmed higher free-tier quota (flash-lite ~most generous, 2.0-flash ~200/day)
//   3-4. "-latest" aliases, verified 200 OK against this project's key/quota pool
//   5.   gemini-2.5-flash — best quality, but only 20/day, so last resort
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];
const TIMEOUT_MS = 25_000;
const MAX_HISTORY_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 2000;
// ~4MB of base64 (base64 is ~4/3 the size of raw bytes, so this caps the
// original image at roughly 3MB — plenty after the frontend's own compression).
const MAX_IMAGE_BASE64_CHARS = 4 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Input schema
// ─────────────────────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(MAX_MESSAGE_CHARS),
      })
    )
    .min(1)
    .max(MAX_HISTORY_MESSAGES),
  profile: z
    .object({
      name: z.string().optional(),
      ageRange: z.string().optional(),
      goals: z.array(z.string()).optional(),
      skinType: z.string().optional(),
      concerns: z.array(z.string()).optional(),
      hairColor: z.string().optional(),
      eyeColor: z.string().optional(),
      faceShape: z.string().optional(),
      eyeShape: z.string().optional(),
      colorSubtono: z.string().optional(),
      colorCode: z.string().optional(),
      skinPreferences: z
        .object({ likes: z.array(z.string()).optional(), avoid: z.array(z.string()).optional() })
        .optional(),
    })
    .passthrough()
    .optional()
    .default({}),
  image: z.string().optional(),
  imageMime: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// System prompt (personality + conversation rules + profile injection)
// ─────────────────────────────────────────────────────────────────────────────

const CHAT_RULES = `

═══════════════════════════════════════════════
MODO CONVERSACIÓN (CHAT)
═══════════════════════════════════════════════

Estás en un chat con la usuaria, como mensajes con una hermana mayor sabia:

- Respuestas BREVES por defecto: 1-4 oraciones. Solo extiende a 6-8 si de verdad hace falta.
- Texto plano conversacional. NADA de JSON, nada de markdown pesado, nada de listas con viñetas largas.
- Usa el nombre de la usuaria cuando suene natural, no en cada mensaje.
- NO empieces cada mensaje con "¡Hola!" o "¡Qué buena pregunta!". Fluye como una conversación real.
- Si la usuaria tiene perfil (tipo de piel, subtono, forma de rostro, preocupaciones, preferencias de productos), ÚSALO como contexto silencioso — no lo recites de vuelta. Si ya hizo un test, NO la invites a hacerlo otra vez; usa su resultado directamente.
- Respeta las preferencias de producto: si la usuaria evita fragancias/activos fuertes/testeo animal, NUNCA se los sugieras.
- Guardrail de edad: si es menor (13-17), no recomiendes retinol/vitamina C concentrada/AHA-BHA fuertes como antiedad.
- Mantén tu personalidad: cálida, sabia, directa, espiritualidad sutil solo cuando el contexto lo invite. NO frases motivacionales genéricas vacías.
- Si detectas señales de autolesión, trastorno alimentario, dismorfia severa o petición de cirugía siendo menor: interrumpe el tema de belleza y redirige con cariño a apoyo profesional o a un adulto de confianza. Para crisis, menciona la Línea de la Vida en México: 800 911 2000, y sugiere buscar la línea local si está en otro país.
- Frecuentemente termina con una pregunta o invitación para seguir la conversación. Un emoji ocasional está bien (no en cada mensaje).

═══════════════════════════════════════════════
TUS FUENTES DE INFORMACIÓN
═══════════════════════════════════════════════

Tienes DOS fuentes de verdad, úsalas y cítalas:

1. BASE DE CONOCIMIENTO CURADA (abajo, si aparece): fuentes académicas y clínicas verificadas — guías de la AAD (American Academy of Dermatology), estudios de PubMed, libros de referencia de colorimetría y visagismo. Es tu fuente PRINCIPAL para ciencia de la piel, colorimetría, visagismo y maquillaje. Es confiable y revisada.

2. BÚSQUEDA WEB EN VIVO (Google Search): para tendencias actuales, artículos de revistas (Vogue, Allure, Byrdie), eventos recientes y lo que está de moda. Cuando necesites algo actual o una opinión de un medio específico, búscalo.

REGLAS DE CITACIÓN (muy importante):
- Cuando la usuaria pregunte "¿de dónde sacas esto?" o "¿qué fuente?", NUNCA respondas vago tipo "no es de una sola fuente" o "de mi conocimiento general". SÉ ESPECÍFICA: nombra la organización, el estudio, el libro o el medio concreto.
- Para temas de ciencia/piel/color: cita las fuentes curadas por su nombre (ej. "según las guías de la AAD 2024" o "Carole Jackson en Color Me Beautiful").
- Para tendencias/opiniones de medios: si buscaste en la web, menciona el medio y el artículo que encontraste (ej. "Vogue publicó en 2026 que...").
- Si de verdad no tienes una fuente confiable para algo, dilo con honestidad y sugiere no tomarlo como definitivo.
- No inventes fuentes ni cites estudios que no aparecen en tu base curada ni en tu búsqueda.

═══════════════════════════════════════════════
CUANDO LA USUARIA SUBE UNA FOTO
═══════════════════════════════════════════════
- Analiza con calidez y de forma útil: colores, combinaciones, maquillaje, forma, estilo, ingredientes de una etiqueta, etc.
- Conecta con su perfil (subtono, tipo de piel, forma de rostro) cuando aplique.
- NUNCA califiques su atractivo con números ni juzgues su cuerpo. Nada de "del 1 al 10". Enfócate en estilo, color, técnica — no en si es "bonita".
- Sé alentadora y honesta a la vez: puedes sugerir mejoras con tacto ("este tono te ilumina; si quieres aún más contraste, prueba...").
- Si la foto muestra algo preocupante (señales de autolesión, angustia evidente, contenido inapropiado), deja el tema de belleza y responde con cuidado, redirigiendo a apoyo si aplica (igual que tus otras reglas de seguridad).
- Si no puedes ver bien la foto o está borrosa, dilo y pide otra con mejor luz.`;

function buildProfileBlock(profile) {
  const p = profile || {};
  const lines = [];
  if (p.name) lines.push(`Nombre: ${p.name}`);
  if (p.ageRange) lines.push(`Edad: ${p.ageRange}`);
  if (p.goals?.length) lines.push(`Metas: ${p.goals.join(', ')}`);
  if (p.skinType) lines.push(`Tipo de piel: ${p.skinType}`);
  if (p.concerns?.length) lines.push(`Preocupaciones: ${p.concerns.join(', ')}`);
  if (p.colorSubtono) lines.push(`Subtono (resultado del test): ${p.colorSubtono} (${p.colorCode || ''})`);
  if (p.faceShape) lines.push(`Forma de rostro (resultado del test): ${p.faceShape}`);
  if (p.eyeShape) lines.push(`Forma de ojos: ${p.eyeShape}`);
  if (p.hairColor) lines.push(`Color de cabello: ${p.hairColor}`);
  if (p.eyeColor) lines.push(`Color de ojos: ${p.eyeColor}`);
  if (p.skinPreferences?.likes?.length) lines.push(`Le gustan productos: ${p.skinPreferences.likes.join(', ')}`);
  if (p.skinPreferences?.avoid?.length) lines.push(`Prefiere evitar: ${p.skinPreferences.avoid.join(', ')}`);
  if (!lines.length) return 'La usuaria aún no ha completado su perfil ni los tests.';
  return lines.join('\n');
}

/**
 * Formatea los topics relevantes de la base de conocimiento curada,
 * incluyendo sus fuentes resueltas (título, autores, año, tipo), para
 * que Gemini pueda citarlas por nombre en vez de hablar en genérico.
 */
function buildKnowledgeBlock(topics) {
  if (!topics || !topics.length) return '';

  const lines = [
    '\n\n═══════════════════════════════════════════════',
    'BASE DE CONOCIMIENTO CURADA — RELEVANTE PARA ESTA CONSULTA',
    '═══════════════════════════════════════════════',
    'Los siguientes temas y sus fuentes verificadas aplican a la pregunta actual de la usuaria. Fundamenta tu respuesta en ellos y cita las fuentes por su nombre cuando corresponda.\n',
  ];

  for (const topic of topics) {
    lines.push(`### ${topic.title}`);
    if (topic.summary_es) lines.push(`Resumen: ${topic.summary_es}`);
    if (topic.key_findings_es?.length) {
      lines.push('Hallazgos clave:');
      for (const finding of topic.key_findings_es.slice(0, 2)) {
        lines.push(`- ${finding}`);
      }
    }
    const sources = (topic.source_ids || [])
      .map((sid) => getSourceById(sid))
      .filter(Boolean);
    if (sources.length) {
      lines.push('Fuentes:');
      for (const s of sources) {
        const authors = s.authors?.length ? s.authors.join(', ') : 'Autor no especificado';
        lines.push(`- ${s.title} (${authors}, ${s.year ?? 's.f.'}) — ${s.type}`);
      }
    }
    if (topic.safety_notes_es?.length) {
      lines.push('NOTAS DE SEGURIDAD (obligatorias en tu respuesta si aplica):');
      for (const note of topic.safety_notes_es) {
        lines.push(`- ${note}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Extrae hasta 3 títulos únicos de las fuentes web usadas por Google Search
 * grounding, para mostrarlas como footer discreto en la respuesta.
 */
function buildGroundingFooter(candidate) {
  const chunks = candidate?.groundingMetadata?.groundingChunks;
  if (!chunks?.length) return '';

  const titles = [];
  for (const chunk of chunks) {
    const title = chunk?.web?.title;
    if (title && !titles.includes(title)) titles.push(title);
    if (titles.length >= 3) break;
  }
  if (!titles.length) return '';

  return `\n\n🔎 Fuentes: ${titles.join(', ')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini call with model fallback chain
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RETRY_503_MS = 1500; // short backoff for transient overload before retrying the SAME model

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
        console.error(`[chat-gemini] ${model} fetch error (attempt ${attempt + 1}):`, err?.message);
        break; // network/abort error with this model → try next model
      }
      clearTimeout(timeout);

      if (res.ok) return { ok: true, data, model };

      lastStatus = res.status;
      console.error(`[chat-gemini] ${model} → ${res.status} (attempt ${attempt + 1}):`, JSON.stringify(data)?.slice(0, 200));

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
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
    return;
  }

  // No key → tell the frontend to fall back to the local engine (not an error the user sees)
  if (!process.env.GEMINI_API_KEY) {
    res.status(200).json({ ok: false, noKey: true });
    return;
  }

  let parsed;
  try {
    const result = RequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ ok: false, error: 'Mensaje inválido.' });
      return;
    }
    parsed = result.data;
  } catch {
    res.status(400).json({ ok: false, error: 'No se pudo leer la petición.' });
    return;
  }

  // Defense in depth: the frontend already compresses images before sending,
  // but never trust the client — reject oversized payloads outright.
  if (parsed.image && parsed.image.length > MAX_IMAGE_BASE64_CHARS) {
    res.status(413).json({ ok: false, error: 'La imagen es muy grande.' });
    return;
  }
  if (parsed.image && !parsed.imageMime) {
    res.status(400).json({ ok: false, error: 'Falta el tipo de imagen (imageMime).' });
    return;
  }

  const lastUserMsg = [...parsed.messages].reverse().find((m) => m.role === 'user')?.content || '';
  const relevantTopics = findRelevantTopics(lastUserMsg, { maxResults: 4 });
  const knowledgeBlock = buildKnowledgeBlock(relevantTopics);

  const systemPrompt =
    LUMINA_PERSONALITY +
    CHAT_RULES +
    knowledgeBlock +
    `\n\n═══════════════════════════════════════════════\nPERFIL DE LA USUARIA ACTUAL\n═══════════════════════════════════════════════\n${buildProfileBlock(parsed.profile)}`;

  // Gemini uses roles "user" and "model" (assistant → model)
  const contents = parsed.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // If the user attached a photo, append it as an inline_data part on the
  // LAST user turn (the message it belongs to), alongside its text.
  if (parsed.image && parsed.imageMime) {
    for (let i = contents.length - 1; i >= 0; i--) {
      if (contents[i].role === 'user') {
        contents[i].parts.push({
          inline_data: { mime_type: parsed.imageMime, data: parsed.image },
        });
        break;
      }
    }
  }

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    tools: [{ google_search: {} }],
    generationConfig: {
      // gemini-2.5-flash "thinks" before answering, and those thinking tokens
      // count against maxOutputTokens — leaving too little for the reply and
      // truncating it mid-sentence. Chat doesn't need deep reasoning, so we
      // disable thinking (thinkingBudget: 0) and give the reply room to finish.
      maxOutputTokens: 2048,
      temperature: 0.85,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: [
      // Keep Gemini's own safety on but not so aggressive it blocks beauty/skin talk
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  // Try each model in GEMINI_MODELS in order (see fallback chain above) instead
  // of a single model + retry — this multiplies the effective free daily quota
  // since each model has its own separate quota bucket.
  const result = await callGeminiWithFallback(body, process.env.GEMINI_API_KEY);

  if (!result.ok) {
    // Every model in the chain failed. 429s (quota) and 503s (overload) are
    // both possible across the chain → report "busy" so the frontend keeps
    // the conversation and asks the user to retry (never drops to the
    // memoryless local engine mid-chat). Other errors → generic.
    const RETRY_STATUSES = new Set([429, 503]);
    const busy = RETRY_STATUSES.has(result.lastStatus);
    res.status(busy ? 503 : 502).json({
      ok: false,
      busy,
      error: busy
        ? 'Lumina está con mucha demanda ahora mismo.'
        : 'Gemini no disponible.',
    });
    return;
  }

  const { data, model: usedModel } = result;
  const candidate = data?.candidates?.[0];
  const rawReply = candidate?.content?.parts?.map((p) => p.text).join('').trim() ?? '';

  if (!rawReply) {
    console.error('[chat-gemini] Empty reply. Finish reason:', candidate?.finishReason);
    res.status(502).json({ ok: false, error: 'Respuesta vacía. Usando modo local.' });
    return;
  }

  let groundingFooter = '';
  try {
    groundingFooter = buildGroundingFooter(candidate);
  } catch (err) {
    console.error('[chat-gemini] grounding footer error (ignored):', err?.message);
  }

  const reply = rawReply + groundingFooter;

  console.log(`[chat-gemini] ${new Date().toISOString()} — success (model=${usedModel}, ${reply.length} chars, topics=${relevantTopics.length}, grounded=${!!groundingFooter})`);
  res.status(200).json({ ok: true, reply });
}
