/**
 * luminaContext.js
 *
 * Helper de contexto para el chat de Lumina (Fase 3 — backend).
 * Proporciona todas las funciones necesarias para armar el request
 * a Claude API con perfil de usuaria inyectado y topics relevantes.
 *
 * USO EN BACKEND (serverless function):
 *   import { buildSystemPrompt, findRelevantTopics, getKnowledgeStats } from './luminaContext.js';
 *
 *   const systemPrompt = buildSystemPrompt(userProfile);
 *   const relevantTopics = findRelevantTopics(userMessage, { maxResults: 3 });
 *   // Inyectar topics como contexto adicional en el request a Claude
 *
 * NOTA: Este modulo importa los JSON directamente. En el backend de Vercel
 * (Node.js runtime) esta es la forma correcta. Si en algun momento se migra
 * a edge runtime (Cloudflare Workers), reemplazar los imports JSON con
 * fetch() desde un CDN o KV store.
 *
 * VERSION: 1.0 — Implementacion naive con keyword scoring.
 * VERSION 2.0 (futura): reemplazar findRelevantTopics con embeddings/vector search.
 */

import visagismData from './visagism.json' with { type: 'json' };
import colorTheoryData from './colorTheory.json' with { type: 'json' };
import skincareData from './skincare.json' with { type: 'json' };
import makeupData from './makeup.json' with { type: 'json' };
import trendsData from './trends.json' with { type: 'json' };
import sourcesData from './sources.json' with { type: 'json' };

import { LUMINA_PERSONALITY } from './personality.js';

// ─────────────────────────────────────────────
// Indice interno: todos los topics aplanados
// ─────────────────────────────────────────────

const ALL_TOPICS = [
  ...visagismData.topics.map((t) => ({ ...t, domain: 'visagism' })),
  ...colorTheoryData.topics.map((t) => ({ ...t, domain: 'colorTheory' })),
  ...skincareData.topics.map((t) => ({ ...t, domain: 'skincare' })),
  ...makeupData.topics.map((t) => ({ ...t, domain: 'makeup' })),
  ...trendsData.topics.map((t) => ({ ...t, domain: 'trends' })),
];

// Indice de fuentes por ID para lookup O(1)
const SOURCES_BY_ID = Object.fromEntries(
  sourcesData.sources.map((s) => [s.id, s])
);

// ─────────────────────────────────────────────
// Stopwords en espanol para tokenizacion
// ─────────────────────────────────────────────

const STOPWORDS_ES = new Set([
  'a', 'al', 'algo', 'algunas', 'algunos', 'ante', 'antes', 'como', 'con',
  'contra', 'cual', 'cuando', 'de', 'del', 'desde', 'donde', 'durante', 'e',
  'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'era', 'es', 'esa', 'esas',
  'ese', 'eso', 'esos', 'esta', 'estas', 'este', 'esto', 'estos', 'etc',
  'fue', 'hay', 'la', 'las', 'le', 'lo', 'los', 'me', 'mi', 'mis', 'muy',
  'no', 'nos', 'o', 'otra', 'otras', 'otro', 'otros', 'para', 'pero', 'por',
  'que', 'quien', 'quienes', 'se', 'si', 'sin', 'sobre', 'son', 'su', 'sus',
  'también', 'te', 'tengo', 'tiene', 'tienen', 'tus', 'un', 'una', 'unas',
  'uno', 'unos', 'y', 'ya', 'yo',
]);

/**
 * Tokeniza un string en lowercase, remueve stopwords y
 * devuelve un array de tokens limpios.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos para comparacion
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS_ES.has(t));
}

/**
 * Calcula el score de relevancia de un topic para un conjunto de tokens.
 * Pesos: title=3, applicable_user_scenarios=2, summary_es=1, key_findings_es=1
 * @param {Object} topic
 * @param {string[]} queryTokens
 * @returns {number}
 */
function scoreTopicForQuery(topic, queryTokens) {
  if (!queryTokens.length) return 0;

  const titleTokens = tokenize(topic.title || '');
  const summaryTokens = tokenize(topic.summary_es || '');
  const scenariosText = (topic.applicable_user_scenarios || []).join(' ');
  const scenarioTokens = tokenize(scenariosText);
  const findingsText = (topic.key_findings_es || []).join(' ');
  const findingsTokens = tokenize(findingsText);

  let score = 0;
  for (const qt of queryTokens) {
    if (titleTokens.includes(qt)) score += 3;
    if (scenarioTokens.includes(qt)) score += 2;
    if (summaryTokens.includes(qt)) score += 1;
    if (findingsTokens.includes(qt)) score += 1;
  }
  return score;
}

// ─────────────────────────────────────────────
// Funciones exportadas
// ─────────────────────────────────────────────

/**
 * Construye el system prompt completo con el perfil de la usuaria
 * inyectado al final del LUMINA_PERSONALITY base.
 *
 * @param {Object|null} profile — Perfil del usuario desde Supabase/localStorage
 *   {
 *     name?: string,
 *     ageRange?: string,          // ej. '13-15', '16-18', '19-25', '26+'
 *     goals?: string[],           // ej. ['skincare', 'makeup', 'selflove']
 *     skinType?: string,          // ej. 'grasa', 'seca', 'mixta', 'normal', 'sensible'
 *     concerns?: string[],        // ej. ['acne', 'manchas', 'poros']
 *     hairColor?: string,
 *     eyeColor?: string,
 *     faceShape?: string,         // resultado del scan
 *     colorSeason?: string,       // resultado del test de colorimetria
 *   }
 * @returns {string} System prompt completo listo para Claude API
 */
export function buildSystemPrompt(profile) {
  if (!profile || Object.keys(profile).length === 0) {
    return LUMINA_PERSONALITY;
  }

  const lines = ['\n\n---\n\n# USUARIA ACTUAL\n'];

  if (profile.name) {
    lines.push(`Nombre: ${profile.name}`);
  }
  if (profile.ageRange) {
    lines.push(`Rango de edad: ${profile.ageRange}`);
    if (profile.ageRange === '13-15' || profile.ageRange === '16-18') {
      lines.push(
        'IMPORTANTE: Esta usuaria es menor de edad. Aplica todas las restricciones de contenido para adolescentes descritas en tu personalidad. Guardrail AAD 2024 activo: no recomendar retinoides cosméticos, vitamina C concentrada ni AHA/BHA fuertes sin indicación médica.'
      );
    }
  }
  if (profile.goals && profile.goals.length) {
    lines.push(`Objetivos declarados: ${profile.goals.join(', ')}`);
  }
  if (profile.skinType) {
    lines.push(`Tipo de piel: ${profile.skinType}`);
  }
  if (profile.concerns && profile.concerns.length) {
    lines.push(`Preocupaciones de piel: ${profile.concerns.join(', ')}`);
  }
  if (profile.hairColor) {
    lines.push(`Color de cabello: ${profile.hairColor}`);
  }
  if (profile.eyeColor) {
    lines.push(`Color de ojos: ${profile.eyeColor}`);
  }
  if (profile.faceShape) {
    lines.push(`Forma de rostro (resultado del scan): ${profile.faceShape}`);
  }
  if (profile.colorSeason) {
    lines.push(`Estación de color (resultado del test): ${profile.colorSeason}`);
  }

  lines.push(
    '\nUsa esta información de forma natural en la conversación. No la recites como lista; téjela en tus respuestas cuando sea relevante.'
  );

  return LUMINA_PERSONALITY + lines.join('\n');
}

/**
 * Busca topics relevantes para una query de usuario.
 * Implementacion v1: keyword scoring naive.
 * Para v2: reemplazar con embeddings + vector similarity.
 *
 * @param {string} query — Texto del mensaje del usuario
 * @param {Object} options
 *   @param {number} [options.maxResults=5] — Maximo de topics a retornar
 *   @param {string[]|null} [options.domains=null] — Filtrar por dominio(s).
 *     Valores validos: 'visagism', 'colorTheory', 'skincare', 'makeup', 'trends'
 * @returns {Array<{...topic, domain: string, score: number}>}
 *   Array de topics ordenados por score descendente, score > 0
 */
export function findRelevantTopics(query, options = {}) {
  const { maxResults = 5, domains = null } = options;

  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  let pool = ALL_TOPICS;
  if (domains && domains.length) {
    pool = pool.filter((t) => domains.includes(t.domain));
  }

  const scored = pool
    .map((topic) => ({
      ...topic,
      score: scoreTopicForQuery(topic, queryTokens),
    }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored;
}

/**
 * Obtiene un topic especifico por ID, con sus fuentes resueltas
 * (objetos completos en lugar de solo IDs).
 *
 * @param {string} topicId — ID del topic, ej. 'skin_teen_basic_routine'
 * @returns {Object|null} Topic con campo sources: [...fuentes completas] o null
 */
export function getTopicById(topicId) {
  const topic = ALL_TOPICS.find((t) => t.id === topicId);
  if (!topic) return null;

  const resolvedSources = (topic.source_ids || [])
    .map((sid) => SOURCES_BY_ID[sid])
    .filter(Boolean);

  return { ...topic, sources: resolvedSources };
}

/**
 * Obtiene todos los topics de un dominio especifico.
 *
 * @param {'visagism'|'colorTheory'|'skincare'|'makeup'|'trends'} domain
 * @returns {Array} Topics del dominio, con campo domain anadido
 */
export function getTopicsByDomain(domain) {
  return ALL_TOPICS.filter((t) => t.domain === domain);
}

/**
 * Obtiene una fuente por ID.
 *
 * @param {string} sourceId — ej. 'skin_2024_011'
 * @returns {Object|null}
 */
export function getSourceById(sourceId) {
  return SOURCES_BY_ID[sourceId] || null;
}

/**
 * Estadisticas de la base de conocimiento.
 * Util para debug y para mostrar en la UI:
 * "Lumina ha sido entrenada con 90 temas de 102 fuentes verificadas."
 *
 * @returns {{
 *   totalTopics: number,
 *   totalSources: number,
 *   byDomain: Record<string, {topics: number, sources: number}>,
 *   lastUpdated: string
 * }}
 */
export function getKnowledgeStats() {
  const byDomain = {};
  for (const domainKey of ['visagism', 'colorTheory', 'skincare', 'makeup', 'trends']) {
    byDomain[domainKey] = {
      topics: ALL_TOPICS.filter((t) => t.domain === domainKey).length,
      sources: sourcesData.by_domain[domainKey] || 0,
    };
  }

  return {
    totalTopics: ALL_TOPICS.length,
    totalSources: sourcesData.total_sources,
    byDomain,
    lastUpdated: sourcesData.last_updated,
  };
}

/**
 * Formatea un conjunto de topics relevantes como bloque de contexto
 * para inyectar en el prompt del usuario (no en el system prompt).
 * El backend lo anada como mensaje de sistema justo antes del mensaje
 * del usuario para que Claude tenga el contexto fresco.
 *
 * @param {Array} topics — Output de findRelevantTopics()
 * @returns {string} Bloque de texto listo para inyectar
 */
export function formatTopicsAsContext(topics) {
  if (!topics || !topics.length) return '';

  const lines = [
    '## Contexto de base de conocimiento relevante para esta consulta\n',
    'Los siguientes temas de la base de conocimiento son relevantes. Úsalos para fundamentar tu respuesta. Si alguno tiene safety_notes_es, esas notas son obligatorias en tu respuesta.\n',
  ];

  for (const topic of topics) {
    lines.push(`### ${topic.title} (${topic.domain})`);
    lines.push(`**Resumen:** ${topic.summary_es}`);
    if (topic.key_findings_es && topic.key_findings_es.length) {
      lines.push('**Hallazgos clave:**');
      for (const finding of topic.key_findings_es) {
        lines.push(`- ${finding}`);
      }
    }
    if (topic.safety_notes_es && topic.safety_notes_es.length) {
      lines.push('**NOTAS DE SEGURIDAD (obligatorias en tu respuesta):**');
      for (const note of topic.safety_notes_es) {
        lines.push(`- ${note}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
