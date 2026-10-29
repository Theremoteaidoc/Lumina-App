/**
 * api/chat.js
 *
 * Vercel Serverless Function — Lumina conversational chat via Claude API.
 * Also works in dev via the Vite API middleware in vite.config.js.
 *
 * POST /api/chat
 * Body: { messages: [{role, content}, ...], profile?: object }
 *
 * Returns: { ok: true, reply: string, usage: {...} }
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { LUMINA_PERSONALITY } from '../src/data/knowledge/personality.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 30_000;
const MAX_HISTORY_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 2000;

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
    })
    .optional()
    .default({}),
});

// ─────────────────────────────────────────────────────────────────────────────
// Base system prompt (cacheable across requests)
// ─────────────────────────────────────────────────────────────────────────────

const CHAT_SYSTEM = `${LUMINA_PERSONALITY}

═══════════════════════════════════════════════
MODO CONVERSACIÓN
═══════════════════════════════════════════════

Estás en un chat con la usuaria. Responde de forma natural y cálida, como mensajes de WhatsApp con una hermana mayor sabia:

- Mantén tus respuestas BREVES por defecto: 1-4 oraciones. Sólo extiende a 6-8 si la pregunta realmente requiere explicación.
- NO uses formato JSON. NO uses markdown excesivo. Texto plano, conversacional.
- Usa el nombre de la usuaria cuando lo sepas, pero NO en cada mensaje — solo cuando suena natural.
- Si tiene perfil (skinType, concerns, goals), conéctalo a tu respuesta cuando sea relevante. Pero NO recites su perfil de regreso — úsalo como contexto silencioso.
- Mantén tu personalidad: cálida, sabia, directa, espiritual sutil. NO digas frases motivacionales genéricas tipo "tú puedes".
- NO empieces con "¡Hola!" o "¡Qué buena pregunta!" en cada respuesta — repetir saludos rompe el flujo conversacional.
- Pregunta de regreso cuando ayude a profundizar (no siempre, pero sí frecuentemente).
- Si la pregunta queda fuera de tu conocimiento de belleza/autocuidado/visagismo/colorimetría, sé honesta — no inventes.
- Recuerda los SAFETY_REDIRECTS de tu personalidad: si detectas dismorfia, trastornos alimentarios, autolesión, cirugía estética en menores, redirige con cariño a apoyo profesional.

Termina cada respuesta con un toque que invite a seguir conversando cuando sea apropiado — una pregunta, una observación, un emoji ocasional (no en cada mensaje).`;

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[chat] ANTHROPIC_API_KEY is not set.');
    res.status(500).json({
      ok: false,
      error:
        'Configura ANTHROPIC_API_KEY en .env.local. Lee .env.local.example para instrucciones.',
    });
    return;
  }

  // Parse + validate
  let parsed;
  try {
    const result = RequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        ok: false,
        error: 'Mensaje inválido.',
        detail: result.error.flatten().fieldErrors,
      });
      return;
    }
    parsed = result.data;
  } catch {
    res.status(400).json({ ok: false, error: 'No se pudo leer el cuerpo de la petición.' });
    return;
  }

  // Safe log (no message content, no PII)
  console.log(`[chat] ${new Date().toISOString()} — request received`, {
    messageCount: parsed.messages.length,
    lastRole: parsed.messages[parsed.messages.length - 1]?.role,
    ageRange: parsed.profile?.ageRange,
    hasSkinType: !!parsed.profile?.skinType,
  });

  const anthropic = new Anthropic();

  // Profile injection — small, per-user, NOT cached
  const profileSummary = JSON.stringify(parsed.profile);

  const claudeRequest = anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: CHAT_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: `Perfil de la usuaria con quien hablas ahora: ${profileSummary}`,
      },
    ],
    messages: parsed.messages,
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
  );

  let response;
  try {
    response = await Promise.race([claudeRequest, timeoutPromise]);
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      console.error('[chat] Claude request timed out after 30s');
      res.status(504).json({ ok: false, error: 'Lumina tardó demasiado en responder. Inténtalo de nuevo.' });
      return;
    }

    if (err.status) {
      console.error(`[chat] Anthropic API error — status ${err.status}:`, err.message);
      res.status(502).json({
        ok: false,
        error: 'Lumina está temporalmente no disponible. Inténtalo en unos momentos.',
      });
      return;
    }

    console.error('[chat] Unexpected error during Claude call:', err);
    res.status(500).json({ ok: false, error: 'Error interno. Inténtalo de nuevo.' });
    return;
  }

  const reply = response.content?.[0]?.text?.trim() ?? '';

  if (!reply) {
    console.error('[chat] Claude returned empty content.');
    res.status(502).json({ ok: false, error: 'Lumina no envió respuesta. Inténtalo de nuevo.' });
    return;
  }

  const usage = {
    input_tokens: response.usage?.input_tokens ?? 0,
    output_tokens: response.usage?.output_tokens ?? 0,
    cache_creation_input_tokens: response.usage?.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: response.usage?.cache_read_input_tokens ?? 0,
  };

  console.log(`[chat] ${new Date().toISOString()} — success`, { usage, replyLength: reply.length });

  res.status(200).json({ ok: true, reply, usage });
}
