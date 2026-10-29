/**
 * api/analyze-face.js
 *
 * Vercel Serverless Function — Lumina facial analysis via Claude vision.
 * Also works in dev via the Vite API middleware in vite.config.js.
 *
 * POST /api/analyze-face
 * Body: { image: string (base64, no data URL prefix), mimeType: string, profile?: object }
 *
 * Returns: { ok: true, analysis: {...}, usage: {...} }
 *
 * Security notes (coordinate with lumina-security agent before launch):
 *  - Image is held in memory only, never written to disk or logged.
 *  - Only the classification result and token counts are logged — no PII.
 *  - profile.name is used in the prompt but never logged.
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { LUMINA_PERSONALITY } from '../src/data/knowledge/personality.js';
import { getTopicsByDomain } from '../src/data/knowledge/luminaContext.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB post-base64
const TIMEOUT_MS = 30_000;

// ─────────────────────────────────────────────────────────────────────────────
// Input schema (validated at the API boundary)
// ─────────────────────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  image: z.string().min(100, 'image must be a non-empty base64 string'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  profile: z
    .object({
      name: z.string().optional(),
      ageRange: z.string().optional(),
      goals: z.array(z.string()).optional(),
      skinType: z.string().optional(),
      concerns: z.array(z.string()).optional(),
      hairColor: z.string().optional(),
      eyeColor: z.string().optional(),
    })
    .optional()
    .default({}),
});

// ─────────────────────────────────────────────────────────────────────────────
// System prompt (built once at module load — cached across warm invocations)
// ─────────────────────────────────────────────────────────────────────────────

function buildFaceAnalysisSystem() {
  const visagismTopics = getTopicsByDomain('visagism');
  const visagismContext = visagismTopics
    .map(
      (t) =>
        `${t.title}: ${t.summary_es}\nClaves: ${(t.key_findings_es || []).join('; ')}`
    )
    .join('\n\n');

  return `${LUMINA_PERSONALITY}

═══════════════════════════════════════════════
PROTOCOLO ESPECÍFICO DE ANÁLISIS FACIAL
═══════════════════════════════════════════════

Estás analizando una foto facial de una usuaria. Tu trabajo es:

1. Identificar la forma facial DOMINANTE entre: ovalado, redondo, cuadrado, corazon, diamante, alargado, triangulo. SIEMPRE elige una, aunque la realidad sea híbrida — es la categoría más cercana.

2. Identificar las INFLUENCIAS SECUNDARIAS — qué otras formas tiene mezcladas, porque casi ningún rostro es 100% una sola categoría.

3. Describir CARACTERÍSTICAS específicas: frente, pómulos, mandíbula, mentón, proporciones.

4. Dar RECOMENDACIONES concretas: cortes de pelo, técnicas de maquillaje, escotes que favorecen.

CONOCIMIENTO BASE DE VISAGISMO (úsalo como referencia):

${visagismContext}

═══════════════════════════════════════════════
FORMATO DE RESPUESTA (OBLIGATORIO)
═══════════════════════════════════════════════

Responde ÚNICAMENTE con JSON válido, sin texto antes o después, sin markdown wrappers. Estructura:

{
  "primaryShape": "ovalado" | "redondo" | "cuadrado" | "corazon" | "diamante" | "alargado" | "triangulo",
  "confidence": "alta" | "media" | "baja",
  "secondaryInfluences": ["formas que también están presentes, ordenadas por relevancia"],
  "summary": "1-2 oraciones describiendo el rostro de forma natural y cálida, usando el nombre si está en el perfil",
  "characteristics": {
    "frente": "descripción específica observada en esta foto",
    "pomulos": "descripción específica",
    "mandibula": "descripción específica",
    "menton": "descripción específica",
    "proporciones": "descripción de las proporciones generales (alargado vs ancho)"
  },
  "recommendations": {
    "haircuts": "2-3 oraciones sobre cortes recomendados",
    "makeup": "2-3 oraciones sobre técnicas de maquillaje (contorno, blush placement, etc.)",
    "necklines": "1-2 oraciones sobre escotes y accesorios que favorecen"
  },
  "honesty_note": "una oración explicando que la mayoría de los rostros son híbridos y por qué tu categorización es solo orientativa"
}

NO incluyas Markdown. NO incluyas \`\`\`json wrappers. SOLO el JSON puro.`;
}

const FACE_ANALYSIS_SYSTEM = buildFaceAnalysisSystem();

// ─────────────────────────────────────────────────────────────────────────────
// Required-field validation for Claude's JSON response
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['primaryShape', 'summary', 'characteristics', 'recommendations'];

function validateAnalysisShape(obj) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj)) return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Method guard
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
    return;
  }

  // API key guard — fail fast with a clear developer message
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[analyze-face] ANTHROPIC_API_KEY is not set.');
    res.status(500).json({
      ok: false,
      error:
        'Configura ANTHROPIC_API_KEY en .env.local. Lee .env.local.example para instrucciones.',
    });
    return;
  }

  // Parse + validate body
  let parsed;
  try {
    const result = RequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        ok: false,
        error: 'Invalid request body.',
        detail: result.error.flatten().fieldErrors,
      });
      return;
    }
    parsed = result.data;
  } catch (err) {
    res.status(400).json({ ok: false, error: 'Could not parse request body as JSON.' });
    return;
  }

  // Image size guard (base64 string length approximates byte size)
  if (parsed.image.length > MAX_IMAGE_BYTES) {
    res.status(413).json({
      ok: false,
      error: `Image too large. Maximum is ${MAX_IMAGE_BYTES / 1024 / 1024} MB (base64).`,
    });
    return;
  }

  // Build a safe log-friendly profile (no name, no PII)
  const logProfile = {
    ageRange: parsed.profile?.ageRange,
    hasGoals: !!(parsed.profile?.goals?.length),
    skinType: parsed.profile?.skinType,
    hasConcerns: !!(parsed.profile?.concerns?.length),
  };

  console.log(`[analyze-face] ${new Date().toISOString()} — request received`, logProfile);

  // Call Claude with a timeout race
  const anthropic = new Anthropic();

  const claudeRequest = anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: FACE_ANALYSIS_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: parsed.mimeType,
              data: parsed.image,
            },
          },
          {
            type: 'text',
            text: `Analiza este rostro siguiendo el protocolo. Perfil de la usuaria: ${JSON.stringify(parsed.profile)}`,
          },
        ],
      },
    ],
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
  );

  let response;
  try {
    response = await Promise.race([claudeRequest, timeoutPromise]);
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      console.error('[analyze-face] Claude request timed out after 30s');
      res.status(504).json({ ok: false, error: 'El análisis tardó demasiado. Inténtalo de nuevo.' });
      return;
    }

    // Anthropic SDK throws APIError for 4xx/5xx from their side
    if (err.status) {
      console.error(`[analyze-face] Anthropic API error — status ${err.status}:`, err.message);
      res.status(502).json({
        ok: false,
        error: 'Servicio de análisis temporalmente no disponible. Inténtalo en unos momentos.',
      });
      return;
    }

    console.error('[analyze-face] Unexpected error during Claude call:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
    return;
  }

  // Parse Claude's JSON response
  const rawText = response.content?.[0]?.text ?? '';
  let analysis;
  try {
    analysis = JSON.parse(rawText);
  } catch (parseErr) {
    console.error('[analyze-face] Failed to parse Claude JSON response:', parseErr.message, '| Raw:', rawText.slice(0, 300));
    res.status(502).json({
      ok: false,
      error: 'Respuesta de Claude no parseable. Inténtalo de nuevo.',
    });
    return;
  }

  // Validate required fields in Claude's response
  if (!validateAnalysisShape(analysis)) {
    console.error('[analyze-face] Claude response missing required fields. Keys received:', Object.keys(analysis));
    res.status(502).json({
      ok: false,
      error: 'Respuesta de Claude incompleta. Inténtalo de nuevo.',
    });
    return;
  }

  const usage = {
    input_tokens: response.usage?.input_tokens ?? 0,
    output_tokens: response.usage?.output_tokens ?? 0,
    cache_creation_input_tokens: response.usage?.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: response.usage?.cache_read_input_tokens ?? 0,
  };

  console.log(`[analyze-face] ${new Date().toISOString()} — success`, {
    primaryShape: analysis.primaryShape,
    confidence: analysis.confidence,
    usage,
  });

  res.status(200).json({ ok: true, analysis, usage });
}
