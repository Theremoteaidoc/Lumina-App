// ═══════════════════════════════════════════════════════════════
// LUMINA CHAT ENGINE — 100% local, sin API externa
// Versión: 1.0
//
// Motor de respuestas basado en reglas + retrieval sobre la base de
// conocimiento local (src/data/knowledge/*.json y src/data/appData.js).
// No hace fetch, no depende de red, no puede lanzar (siempre atrapa
// sus propios errores y devuelve algo).
// ═══════════════════════════════════════════════════════════════

import { AFFIRMATION_CARDS, FACE_DATA } from '../data/appData.js';
import visagismData from '../data/knowledge/visagism.json' with { type: 'json' };
import colorTheoryData from '../data/knowledge/colorTheory.json' with { type: 'json' };
import skincareData from '../data/knowledge/skincare.json' with { type: 'json' };
import makeupData from '../data/knowledge/makeup.json' with { type: 'json' };

// ───────────────────────── utilidades de texto ─────────────────────────

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos/diacríticos
    // colapsa letras repetidas 3+ veces a 1: "holiii"→"holi", "graciaaas"→"gracias",
    // "siiii"→"si". Se aplica también sobre el lexicón (ver KEYWORDS), así que el
    // matching queda parejo aunque distorsione palabras con dobles legítimas.
    .replace(/(.)\1{2,}/g, '$1');
}

// Distancia de edición (Levenshtein) simple, sin dependencias, para tolerar
// errores de tipeo/variantes de una letra en palabras cortas ("byee" ~ "bye").
function levenshtein(a, b) {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  const dp = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) dp[j] = j;
  for (let i = 1; i <= al; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= bl; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[bl];
}

// Detecta risas tipo "jaja", "jejeje", "hahaha", "jsjs" que no se colapsan con
// el paso de arriba (las letras alternan, no se repiten en fila).
function isLaughter(normText) {
  const compact = normText.replace(/[^a-z]/g, '');
  if (compact.length < 2) return false;
  if (/^(ja|je|ji|jo|ju|ha|he|hi|ho|hu|aj|eh|xd)+$/.test(compact)) return true;
  if (/^(js)+$/.test(compact)) return true;
  if (/^lol+$/.test(compact)) return true;
  return false;
}

// Palabras funcionales que no aportan señal para el retrieval de topics.
const STOPWORDS = new Set([
  'de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'es', 'mi', 'me', 'tu', 'te', 'se', 'no', 'si', 'por', 'para', 'con', 'del',
  'al', 'lo', 'le', 'les', 'como', 'que', 'tengo', 'tiene', 'tienes', 'hay',
  'soy', 'eres', 'esta', 'estoy', 'estas', 'pero', 'muy', 'mas', 'ya', 'eso',
  'esto', 'ese', 'esa', 'esos', 'esas', 'su', 'sus', 'sobre', 'entre', 'sin',
  'todo', 'toda', 'todos', 'todas', 'yo', 'ella', 'el', 'ellos', 'ellas',
  'nos', 'fue', 'ser', 'estar', 'hace', 'hacer', 'puedo', 'puede', 'quiero',
  'quieres', 'porque', 'cuando', 'donde', 'cual', 'cuales', 'aqui', 'ahi',
  'alli', 'algo', 'nada', 'unas', 'unos', 'este', 'esta',
]);

function tokenize(normText) {
  return normText
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

// Coincidencia por palabra completa (evita falsos positivos tipo "hi" dentro de "hijo").
function hasKeyword(normText, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(normText);
}

function hasAnyKeyword(normText, list) {
  return list.some((kw) => hasKeyword(normText, kw));
}

// Puntúa un intent contra el mensaje: match exacto de token = 2, match difuso
// (edit distance <= 1, solo para tokens del usuario de hasta 6 caracteres) = 1,
// frase completa encontrada en el texto = 3. Así un mensaje corto e informal
// como "holi" o "byee" puede seguir ganando el intent correcto sin match exacto.
// Importante: se itera por TOKEN del usuario (no por keyword del lexicón) y cada
// token aporta como máximo una vez, para que un solo "hola" no infle el puntaje
// por parecerse difusamente a varias keywords similares de la misma lista
// ("hola" ~ "ola" ~ "holi" ~ "holu" no deben sumar 4 veces).
function scoreIntent(normText, tokens, def) {
  if (!def) return 0;
  const words = def.words || [];
  let score = 0;
  for (const tok of tokens) {
    if (words.includes(tok)) {
      score += 2;
      continue;
    }
    if (tok.length <= 6) {
      for (const kw of words) {
        if (Math.abs(tok.length - kw.length) <= 1 && levenshtein(tok, kw) <= 1) {
          score += 1;
          break;
        }
      }
    }
  }
  for (const ph of def.phrases || []) {
    if (hasKeyword(normText, ph)) score += 3;
  }
  return score;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lowerFirst(str) {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function firstSentences(text, maxSentences = 2) {
  if (!text) return '';
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, maxSentences).join(' ');
}

// ───────────────────────── resultados de tests guardados en el perfil ─────────────────────────

/**
 * Extrae en un solo lugar qué tests ya hizo la usuaria y sus resultados,
 * para que cada intent sepa si puede hablar "sabiendo" o debe invitar al test.
 * Todos los campos son opcionales — maneja siempre el caso ausente.
 */
function getKnownResults(profile) {
  return {
    hasFace: !!profile?.faceShape,
    hasColor: !!profile?.colorSubtono,
    hasSkin: !!profile?.skinType,
    faceShape: profile?.faceShape || null,
    eyeShape: profile?.eyeShape || null,
    colorSubtono: profile?.colorSubtono || null,
    colorCode: profile?.colorCode || null,
    skinType: profile?.skinType || null,
    prefs: profile?.skinPreferences || { likes: [], avoid: [] },
  };
}

// Construye una mención breve y natural de lo que ya sabemos de la usuaria,
// para usar de vez en cuando en saludo/fallback — nunca en cada mensaje.
function buildKnownMention(known) {
  const bits = [];
  if (known.hasColor) bits.push(`tu subtono ${known.colorSubtono}`);
  if (known.hasFace) {
    const fd = FACE_DATA[known.faceShape];
    bits.push(`tu rostro ${fd ? fd.title.toLowerCase() : known.faceShape}`);
  }
  if (known.hasSkin) bits.push(`tu piel ${known.skinType}`);
  if (!bits.length) return '';
  const joined = bits.length === 1
    ? bits[0]
    : `${bits.slice(0, -1).join(', ')} y ${bits[bits.length - 1]}`;
  return pick([
    `Por cierto, con ${joined} tienes muchísimo con qué jugar.`,
    `Ah, y ya conozco ${joined} — te puedo dar tips bien concretos cuando quieras.`,
    `De paso: tengo guardado ${joined}, así que puedo ser bien específica si lo necesitas.`,
  ]);
}

// Notas de preferencias de producto (skinPreferences) para tejerlas en el consejo.
function prefsNote(prefs) {
  const notes = [];
  const avoid = prefs?.avoid || [];
  const likes = prefs?.likes || [];
  if (avoid.includes('fragrance')) notes.push('sin fragancia');
  if (avoid.includes('alcohol')) notes.push('sin alcohol');
  if (avoid.includes('strong_actives') || avoid.includes('harsh_chemicals')) notes.push('sin activos agresivos');
  if (avoid.includes('parabens_sulfates')) notes.push('sin parabenos ni sulfatos');
  if (likes.includes('natural')) notes.push('con ingredientes naturales');
  if (likes.includes('minimal')) notes.push('en rutinas minimalistas');
  if (likes.includes('k_beauty')) notes.push('estilo K-beauty');
  return notes;
}

// ───────────────────────── retrieval sobre knowledge base ─────────────────────────

function countOccurrences(haystackNorm, needle) {
  if (!needle) return 0;
  return haystackNorm.split(needle).length - 1;
}

// Cuenta cuántos tokens distintos de la consulta aparecen en el texto (presencia
// binaria por token, no ocurrencias totales) — evita que un texto largo gane solo
// por repetir la misma palabra varias veces.
function scoreTextAgainstTokens(text, tokens) {
  if (!text) return 0;
  const norm = normalize(text);
  let score = 0;
  for (const t of tokens) {
    if (countOccurrences(norm, t) > 0) score += 1;
  }
  return score;
}

/**
 * Retrieval simple por keyword scoring sobre los topics de un dominio.
 * título peso 3, summary_es peso 1, cada key_finding_es peso 1.
 */
function findTopic(topics, tokens) {
  if (!tokens.length) return null;
  let best = null;
  let bestScore = 0;
  for (const topic of topics) {
    const titleScore = scoreTextAgainstTokens(topic.title, tokens) * 3;
    const summaryScore = scoreTextAgainstTokens(topic.summary_es, tokens);
    const findingsScore = (topic.key_findings_es || []).reduce(
      (s, kf) => s + scoreTextAgainstTokens(kf, tokens),
      0
    );
    const total = titleScore + summaryScore + findingsScore;
    if (total > bestScore) {
      bestScore = total;
      best = topic;
    }
  }
  return bestScore > 0 ? best : null;
}

// ═══════════════════════════════════════════════════════════════
// 1. SAFETY — máxima prioridad
// ═══════════════════════════════════════════════════════════════

const SELF_HARM_PATTERNS = [
  'hacerme dano', 'me hago dano', 'lastimarme', 'me lastimo', 'cortarme',
  'me corto', 'desaparecer', 'no quiero vivir', 'no quiero estar aqui',
  'quiero morir', 'quiero morirme', 'me quiero morir', 'no vale la pena vivir',
  'acabar con todo', 'pienso en hacerme algo', 'quiero acabar con esto',
  'ya no aguanto vivir', 'no quiero seguir aqui',
];

const EATING_DISORDER_PATTERNS = [
  'no como', 'vomito', 'me provoco el vomito', 'vomito despues de comer',
  'dejar de comer', 'no merezco comer', 'uso laxantes',
  'cuento calorias obsesivamente', 'no como nada',
];

const DYSMORPHIA_PATTERNS = [
  'odio mi cara', 'soy horrible', 'me da asco verme', 'no me soporto',
  'no me reconozco', 'me veo horrible', 'me veo monstruosa',
  'no soporto verme al espejo', 'no me gusta nada de mi cara',
  'me da ansiedad verme',
];

function detectSafety(normText) {
  if (hasAnyKeyword(normText, SELF_HARM_PATTERNS)) return 'self_harm';
  if (hasAnyKeyword(normText, EATING_DISORDER_PATTERNS)) return 'eating_disorder';
  // combinaciones con contexto (para evitar falsos positivos con palabras sueltas)
  if (hasKeyword(normText, 'gorda') && hasAnyKeyword(normText, ['dieta', 'peso', 'adelgazar', 'calorias'])) {
    return 'eating_disorder';
  }
  if (hasKeyword(normText, 'ayuno') && hasAnyKeyword(normText, ['extremo', 'dias seguidos', 'todo el dia'])) {
    return 'eating_disorder';
  }
  if (hasAnyKeyword(normText, DYSMORPHIA_PATTERNS)) return 'dysmorphia';
  return null;
}

function safetyReply(kind, profile) {
  const name = profile?.name;
  const namePart = name ? `, ${name}` : '';

  if (kind === 'self_harm') {
    const openings = [
      `Lo que me acabas de contar me importa más que cualquier otra cosa de esta conversación${namePart}.`,
      `Quiero detenerme aquí un momento porque esto es serio${namePart}, y me importa de verdad.`,
      `Gracias por decírmelo${namePart} — sé que no es fácil, y te escucho.`,
    ];
    return `${pick(openings)} No estás sola en esto. Por favor, habla ahora mismo con alguien de confianza: un adulto, un familiar, una persona cercana. Si sientes que necesitas ayuda inmediata, en México puedes llamar a la Línea de la Vida: 800 911 2000, disponible las 24 horas y totalmente gratis. Si estás en otro país, busca "línea de crisis" + tu país — siempre hay alguien del otro lado dispuesto a escucharte. ¿Hay alguien a quien puedas llamar o buscar ahora mismo?`;
  }

  if (kind === 'eating_disorder') {
    const openings = [
      `Pausemos un momento${namePart}, porque lo que me cuentas me importa mucho más que cualquier consejo de belleza.`,
      `Quiero ser honesta contigo${namePart}: esto va más allá de lo que yo puedo acompañar bien.`,
    ];
    return `${pick(openings)} Lo que describes merece la atención de alguien especializado — un psicólogo o un médico de confianza pueden ayudarte de una forma que yo no puedo. Pedir ayuda no es debilidad, es cuidarte de verdad. Si estás en México, la Línea de la Vida (800 911 2000, 24 horas, gratuita) también puede orientarte. ¿Tienes a alguien cercano — un adulto, un familiar — con quien puedas hablar de esto hoy?`;
  }

  // dysmorphia
  const openings = [
    `Lo que sientes es real, y me importa que me lo hayas contado${namePart}.`,
    `Quiero recibir esto con cuidado${namePart}, porque suena a algo que pesa de verdad.`,
  ];
  return `${pick(openings)} Cuando verse al espejo se vuelve algo tan doloroso, eso va más allá de lo que el maquillaje o una rutina pueden arreglar — y mereces hablar con alguien que pueda acompañarte de verdad, como un psicólogo o un adulto de confianza. No estás exagerando ni eres dramática por sentir esto. ¿Hay alguien así en tu vida ahora mismo?`;
}

// ═══════════════════════════════════════════════════════════════
// 2. EMOCIONAL / amor propio
// ═══════════════════════════════════════════════════════════════

const MOOD_KEYWORDS = [
  ['down', [
    'triste', 'tristeza', 'llorar', 'llorando', 'lloro', 'deprimida', 'mal',
    'bajon', 'desanimada', 'apagada', 'vacia', 'perdida', 'confundida',
  ]],
  ['lonely', ['sola', 'solita', 'sole']],
  ['anxious', ['ansiosa', 'estresada', 'nerviosa', 'ansiedad', 'estres']],
  ['insecure', ['insegura', 'fea']],
  ['tired', ['cansada', 'agotada', 'harta']],
  ['overwhelmed', ['abrumada', 'agobiada']],
  ['happy', ['feliz', 'contenta']],
];

// Nota: "me odio" puede ser señal de dismorfia si va acompañado de más contexto
// (ver DYSMORPHIA_PATTERNS, que se evalúa ANTES y tiene prioridad dura sobre esto).
const EMOTIONAL_EXTRA_PHRASES = [
  'nadie me quiere', 'no puedo', 'me siento', 'no me gusto', 'me comparo', 'me odio',
];

function detectMood(normText) {
  for (const [mood, words] of MOOD_KEYWORDS) {
    if (hasAnyKeyword(normText, words)) return mood;
  }
  if (hasKeyword(normText, 'nadie me quiere')) return 'lonely';
  if (hasKeyword(normText, 'no puedo')) return 'overwhelmed';
  return null;
}

function isEmotionalIntent(normText) {
  return detectMood(normText) !== null || hasAnyKeyword(normText, EMOTIONAL_EXTRA_PHRASES);
}

const EMOTION_OPENERS = {
  down: [
    'Siento que estés pasando por un momento así.',
    'Gracias por contarme cómo te sientes — no es poca cosa decirlo en voz alta.',
    'Lo que sientes tiene espacio aquí, sin apuros.',
  ],
  lonely: [
    'La soledad pesa distinto a otras cosas, y quiero que sepas que aquí te escucho.',
    'Sentirte sola es de las cosas más difíciles de cargar — gracias por decírmelo.',
  ],
  anxious: [
    'Esa sensación puede ser agotadora, de verdad.',
    'Respira un momento — lo que sientes es válido, y esto va a pasar.',
  ],
  insecure: [
    'Sentirte insegura no dice nada sobre tu valor real, aunque ahora mismo no lo sientas así.',
    'Esa vocecita que compara y duda le pasa a todas, y aun así no tiene la última palabra.',
  ],
  tired: [
    'Suena a que necesitas un respiro de verdad.',
    'El cansancio así, hasta los huesos, merece que lo tomes en serio.',
  ],
  overwhelmed: [
    'Cuando todo se siente como demasiado, hasta respirar cuesta — te entiendo.',
    'Suena a que traes muchas cosas encima ahora mismo.',
  ],
  happy: [
    'Me encanta leer eso — se nota tu energía incluso en el mensaje.',
    'Qué lindo que te sientas así, disfrútalo.',
  ],
};

const EMOTION_CLOSERS = [
  '¿Quieres contarme un poco más de lo que está pasando?',
  'Si quieres seguimos hablando de esto, aquí estoy.',
  '¿Te gustaría ver la sección de Amor Propio? Tiene más momentos como este.',
  '¿Qué más traes en la cabeza hoy?',
];

function emotionalReply(mood, profile) {
  const name = profile?.name;
  const opener = pick(EMOTION_OPENERS[mood] || EMOTION_OPENERS.down);
  const pool = AFFIRMATION_CARDS.filter((c) => c.moods.includes(mood));
  const card = pool.length ? pick(pool) : pick(AFFIRMATION_CARDS);
  const namePart = name ? `${name}, ` : '';
  const closer = pick(EMOTION_CLOSERS);
  return `${opener} ${namePart}quiero dejarte algo:\n\n"${card.affirmation}"\n${card.verse}\n\n${closer}`;
}

// ═══════════════════════════════════════════════════════════════
// 3. COLORIMETRÍA
// ═══════════════════════════════════════════════════════════════

const COLOR_KEYWORDS = [
  'color', 'colores', 'subtono', 'tono', 'paleta', 'frio', 'calido', 'calida',
  'neutro', 'combinar', 'combina', 'ropa', 'vestir', 'outfit', 'estacion',
  'temporada', 'warm', 'cool',
];
const COLOR_PHRASES = ['que me queda', 'que me favorece', 'que me luce'];
const COLOR_FIT_WORDS = ['queda', 'favorece', 'combina', 'combinar', 'ponerme', 'usar'];

// Respuestas genéricas para cuando NO conocemos el subtono todavía.
const QUICK_COLOR_ANSWERS = {
  negro: 'El negro es de los pocos colores casi universales: en subtono frío o neutro funciona sin esfuerzo, y en subtono cálido se puede suavizar acercándolo a la cara con un tono cálido cerca (dorado, coral, terracota).',
  blanco: 'El blanco puro suele favorecer más a subtonos fríos y neutros; si tu subtono es cálido, un blanco roto o marfil normalmente te sienta mejor que el blanco frío puro.',
  dorado: 'El dorado es territorio cálido por excelencia: si tu subtono es cálido, te va a iluminar. Si es frío, la plata suele ganarle la partida.',
  plateado: 'La plata es aliada de los subtonos fríos. Si tu subtono es cálido, el oro normalmente arma mejor con tu piel.',
  rojo: 'Hay rojo para todas: los rojos con base azulada (cereza, vino) favorecen subtono frío, y los rojos anaranjados (ladrillo, tomate) favorecen subtono cálido.',
};

// Respuestas concretas para las mismas prendas/colores, ya sabiendo el subtono real.
const QUICK_COLOR_BY_SUBTONE = {
  negro: {
    frio: 'te sienta de maravilla prácticamente sin esfuerzo.',
    calido: 'te queda bien, pero se suaviza más si acercas a la cara algo cálido — dorado, coral o terracota.',
    neutro: 'es un comodín que casi siempre te va a funcionar.',
  },
  blanco: {
    frio: 'el blanco puro es de tus mejores aliados.',
    calido: 'mejor un blanco roto o marfil que el blanco puro helado, que se ve más duro en tu piel.',
    neutro: 'tanto el blanco puro como el marfil te funcionan bien, tienes margen.',
  },
  dorado: {
    frio: 'no es tu mejor opción — la plata te va a favorecer más cerca de la cara.',
    calido: 'es territorio tuyo: te va a iluminar la piel.',
    neutro: 'te funciona, aunque también puedes jugar con plata sin ningún problema.',
  },
  plateado: {
    frio: 'es tu metal ganador.',
    calido: 'el oro normalmente le gana la partida en tu piel.',
    neutro: 'te funciona igual que el oro — aquí tienes libertad total.',
  },
  rojo: {
    frio: 'los rojos con base azulada como cereza o vino son los tuyos.',
    calido: 'los rojos anaranjados como ladrillo o tomate te favorecen más.',
    neutro: 'casi cualquier rojo equilibrado, ni muy azulado ni muy anaranjado, te queda bien.',
  },
};

// Tips rápidos por subtono para dar consejo concreto sin necesidad de retrieval.
const SUBTONE_TIPS = {
  frio: {
    favorecen: ['zafiro', 'esmeralda', 'magenta', 'plata', 'blanco puro', 'negro'],
    evitan: ['coral', 'mostaza', 'naranja', 'beige cálido'],
  },
  calido: {
    favorecen: ['terracota', 'mostaza', 'oro', 'oliva', 'durazno', 'marfil'],
    evitan: ['rosa frío', 'gris azulado', 'magenta'],
  },
  neutro: {
    favorecen: ['rosa palo', 'azul polvo', 'salvia', 'taupe', 'mauve'],
    evitan: ['neones', 'naranja saturado'],
  },
};

function colorimetriaReply(normText, tokens, profile, known) {
  const quickKey = Object.keys(QUICK_COLOR_ANSWERS).find((k) => hasKeyword(normText, k));
  const parts = [];

  if (known.hasColor) {
    const subtono = known.colorSubtono;
    const tip = SUBTONE_TIPS[subtono];
    const codePart = known.colorCode ? ` (${known.colorCode})` : '';

    if (quickKey && QUICK_COLOR_BY_SUBTONE[quickKey]?.[subtono]) {
      parts.push(`Con tu subtono ${subtono}${codePart}, el ${quickKey} ${QUICK_COLOR_BY_SUBTONE[quickKey][subtono]}`);
    } else if (tip) {
      parts.push(pick([
        `Como tu subtono es ${subtono}${codePart}, los tonos que de verdad te van a lucir son ${tip.favorecen.slice(0, 3).join(', ')} — esos son tus básicos ganadores.`,
        `Tu resultado marca subtono ${subtono}${codePart}, así que colores como ${tip.favorecen.slice(0, 3).join(', ')} van a hacer que tu piel se vea luminosa.`,
      ]));
      parts.push(`Y mejor evita ${tip.evitan.slice(0, 2).join(' y ')}, que suelen apagarte un poco.`);
    } else {
      parts.push(`Ya sé que tu subtono es ${subtono}${codePart} — esa es tu brújula base para elegir cualquier color.`);
    }
  } else {
    if (quickKey) {
      parts.push(QUICK_COLOR_ANSWERS[quickKey]);
    } else {
      const topic = findTopic(colorTheoryData.topics, tokens);
      if (topic) {
        parts.push(firstSentences(topic.summary_es, 2));
      } else {
        parts.push('La colorimetría personal parte de tu subtono — cálido, frío o neutro — y es la base que decide qué colores hacen que tu piel se vea luminosa en vez de apagada.');
      }
    }
    parts.push(pick([
      '¿Ya hiciste el test de Colorimetría en la app? Te da un resultado personalizado en minutos.',
      'Dentro de Lumina tienes un test de Colorimetría que te dice exactamente tu subtono — vale la pena hacerlo.',
    ]));
  }

  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════════
// 4. PIEL / skincare
// ═══════════════════════════════════════════════════════════════

const SKIN_KEYWORDS = [
  'piel', 'cutis', 'acne', 'grano', 'granos', 'granito', 'espinilla', 'espinillas',
  'barro', 'barros', 'grasa', 'grasosa', 'seca', 'reseca', 'mixta', 'poros',
  'rutina', 'skincare', 'hidratar', 'crema', 'limpiar', 'limpiador', 'sol', 'spf',
  'protector', 'bloqueador', 'manchas', 'sensible', 'rojez', 'rojeces', 'retinol',
  'niacinamida', 'acido', 'exfoliar', 'sebo', 'brillo',
];
const SKIN_PHRASES = ['puntos negros'];

const TEEN_RESTRICTED_TOPIC_IDS = new Set([
  'skin_active_retinoids', 'skin_active_vitamin_c', 'skin_active_aha',
]);

// Guardrail AAD para menores de 16: nunca depender solo del retrieval —
// si menciona explícitamente uno de estos activos, el guardrail SIEMPRE aplica,
// gane o no el topic correspondiente en el keyword scoring.
const TEEN_RESTRICTED_ACTIVE_KEYWORDS = [
  'retinol', 'retinoide', 'retinoico', 'tretinoina', 'vitamina c',
  'acido glicolico', 'glicolico', 'aha',
];

// Topics de activos "fuertes" que hay que esquivar cuando la usuaria marcó
// en sus preferencias de piel que prefiere evitarlos (independiente de su edad).
const STRONG_ACTIVE_TOPIC_IDS = new Set([
  'skin_active_retinoids', 'skin_active_vitamin_c', 'skin_active_aha',
  'skin_active_salicylic_bha', 'skin_active_benzoyl_peroxide',
]);

// Base rápida por tipo de piel, para cuando no hay topic de retrieval o
// cuando el topic encontrado hay que descartarlo por preferencias.
const SKIN_TYPE_TIPS = {
  grasa: 'un limpiador en gel sin aceite, hidratante ligero y niacinamida para regular el sebo sin resecarte',
  seca: 'un limpiador cremoso sin sulfatos, e hidratante rico con ceramidas y ácido hialurónico',
  mixta: 'limpiador suave, hidratante ligero en la zona T y algo más nutritivo en las mejillas',
  normal: 'limpiador suave e hidratante ligero, solo para mantener el equilibrio que ya tienes',
  sensible: 'limpiador sin fragancia, hidratante con ceramidas, y probar cualquier producto nuevo primero en una zona pequeña',
};

function skincareReply(normText, tokens, profile, known) {
  let topic = findTopic(skincareData.topics, tokens);
  const isYoung = profile?.ageRange === '13-15' || profile?.ageRange === '16-18';
  const mentionsRestrictedActive = hasAnyKeyword(normText, TEEN_RESTRICTED_ACTIVE_KEYWORDS);
  const topicIsRestrictedForTeen = topic && TEEN_RESTRICTED_TOPIC_IDS.has(topic.id);

  if (isYoung && (mentionsRestrictedActive || topicIsRestrictedForTeen)) {
    const base = 'A tu edad, la Academia Americana de Dermatología no recomienda activos como retinol, vitamina C concentrada o ácidos exfoliantes fuertes como antiedad — tu piel no los necesita todavía y solo la van a irritar. Si el tema es acné, el ácido salicílico en baja concentración sí es apto.';
    const routine = known.hasSkin
      ? `Para tu piel ${known.skinType}, lo que de verdad hace la diferencia a tu edad es ${SKIN_TYPE_TIPS[known.skinType] || 'limpiador suave, hidratante y protector solar SPF 30+'}, todos los días.`
      : 'Lo que de verdad hace la diferencia a tu edad es limpiador suave, hidratante y protector solar SPF 30+, todos los días.';
    return `${base} ${routine} ¿Quieres que hablemos de tu rutina actual?`;
  }

  // Guardrail de preferencias: si marcó que prefiere evitar activos fuertes / químicos
  // agresivos, no le recomendamos ese topic aunque haya ganado el retrieval.
  const avoidsStrong = known.prefs.avoid.includes('strong_actives') || known.prefs.avoid.includes('harsh_chemicals');
  let skippedStrongTopic = false;
  if (avoidsStrong && topic && STRONG_ACTIVE_TOPIC_IDS.has(topic.id)) {
    topic = null;
    skippedStrongTopic = true;
  }

  const parts = [pick(['Vamos por partes.', 'Aquí te va algo concreto.', 'Esto es lo que de verdad ayuda.'])];

  if (known.hasSkin) {
    parts.push(`Para tu piel ${known.skinType}, ${SKIN_TYPE_TIPS[known.skinType] || 'lo esencial es limpiador suave, hidratante acorde y protector solar'} es la base.`);
  }

  if (topic) {
    parts.push(firstSentences(topic.summary_es, 2));
    if (topic.key_findings_es?.length) {
      parts.push(pick([
        `Algo que vale la pena saber: ${lowerFirst(pick(topic.key_findings_es))}`,
        `Un dato clave: ${lowerFirst(pick(topic.key_findings_es))}`,
      ]));
    }
    if (topic.safety_notes_es?.length) {
      parts.push(`Eso sí: ${lowerFirst(pick(topic.safety_notes_es))}`);
    }
  } else if (!known.hasSkin) {
    parts.push('La base que nunca falla es: limpiador suave, hidratante acorde a tu tipo de piel y protector solar todos los días.');
  }

  if (skippedStrongTopic) {
    parts.push('Y como prefieres evitar activos fuertes, mejor nos vamos por algo suave como niacinamida antes que ácidos exfoliantes o peróxido de benzoilo — funciona bien y tu piel lo tolera mejor.');
  }

  const notes = prefsNote(known.prefs);
  if (notes.length && !skippedStrongTopic) {
    parts.push(`Y como prefieres productos ${notes.join(', ')}, busca justo eso en la etiqueta.`);
  }

  parts.push(pick([
    '¿Quieres que profundicemos en algún paso?',
    '¿Cuál de esos pasos sientes que ya tienes cubierto?',
  ]));

  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════════
// 5. MAQUILLAJE
// ═══════════════════════════════════════════════════════════════

const MAKEUP_KEYWORDS = [
  'maquillaje', 'makeup', 'base', 'corrector', 'labial', 'lipstick', 'gloss',
  'sombra', 'sombras', 'rubor', 'blush', 'chapas', 'delineador', 'delineado',
  'cejas', 'contorno', 'iluminador', 'highlighter', 'pestanas', 'mascara',
  'rimel', 'brocha', 'esponja', 'look', 'glam',
];

// Tonos de labial y sombra sugeridos según subtono — para cruzar maquillaje con colorimetría.
const MAKEUP_BY_SUBTONE = {
  frio: { lips: 'berries, ciruela y vino', eyes: 'plateado, malva y lavanda' },
  calido: { lips: 'terracota, coral y ladrillo', eyes: 'dorado, cobre y bronce' },
  neutro: { lips: 'rosa nude y malva', eyes: 'taupe, champán y bronce suave' },
};

function makeupReply(normText, tokens, profile, known) {
  const topic = findTopic(makeupData.topics, tokens);
  const parts = [pick(['Vamos con esto.', 'Aquí un tip real.', 'Esto te va a servir.'])];

  if (topic) {
    parts.push(firstSentences(topic.summary_es, 2));
    if (topic.key_findings_es?.length) {
      parts.push(`Tip extra: ${lowerFirst(pick(topic.key_findings_es))}`);
    }
  } else {
    parts.push('Con maquillaje, capas finas siempre le ganan a una capa gruesa — eso hace la diferencia entre un look natural y uno que se ve "puesto".');
  }

  if (known.hasFace && FACE_DATA[known.faceShape]) {
    const fd = FACE_DATA[known.faceShape];
    if (hasKeyword(normText, 'contorno') && fd.contourZones) {
      parts.push(`Para tu rostro ${fd.title.toLowerCase()}, en contorno: ${lowerFirst(fd.contourZones)}`);
    } else {
      parts.push(`Para tu rostro ${fd.title.toLowerCase()}, ${lowerFirst(pick(fd.makeup))}.`);
    }
  }

  if (known.hasColor && MAKEUP_BY_SUBTONE[known.colorSubtono]) {
    const tone = MAKEUP_BY_SUBTONE[known.colorSubtono];
    if (hasAnyKeyword(normText, ['labial', 'labios'])) {
      parts.push(`En labial, con tu subtono ${known.colorSubtono} los tonos ${tone.lips} son un acierto seguro.`);
    } else if (hasAnyKeyword(normText, ['sombra', 'ojos'])) {
      parts.push(`En sombras, tu subtono ${known.colorSubtono} luce mejor con ${tone.eyes}.`);
    } else {
      parts.push(`Con tu subtono ${known.colorSubtono}, en labios busca ${tone.lips}, y en sombras ${tone.eyes}.`);
    }
  }

  parts.push(pick([
    '¿Quieres que te cuente más sobre alguna técnica específica?',
    '¿Hay algo puntual que quieras dominar — ojos, labios, base?',
  ]));

  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════════
// 6. ROSTRO / VISAGISMO
// ═══════════════════════════════════════════════════════════════

const FACE_KEYWORDS = [
  'rostro', 'cara', 'carita', 'visagismo', 'corte', 'cabello', 'pelo',
  'peinado', 'flequillo', 'fleco', 'escote', 'cuello',
];
const FACE_PHRASES = [
  'forma de cara', 'corte de pelo', 'corte de cabello', 'que corte',
  'cejas para mi cara', 'mi tipo de cara',
];

function visagismReply(tokens, profile, known) {
  const topic = findTopic(visagismData.topics, tokens);
  const parts = [];

  if (known.hasFace && FACE_DATA[known.faceShape]) {
    const fd = FACE_DATA[known.faceShape];
    const recommend = fd.haircuts.filter((h) => !/^evitar/i.test(h));
    const avoidCut = fd.haircuts.find((h) => /^evitar/i.test(h));
    parts.push(`Con tu rostro ${fd.title.toLowerCase()} ${fd.emoji || ''}, ${lowerFirst(pick(recommend.length ? recommend : fd.haircuts))} suele quedarte muy bien.`.replace(/\s+/g, ' ').trim());
    if (avoidCut) parts.push(`Y en corte, mejor ${lowerFirst(avoidCut)}.`);
    parts.push(fd.desc);
    const necklineOptions = (fd.necklines || []).filter((n) => !/^evitar/i.test(n));
    if (necklineOptions.length) {
      parts.push(`Bonus de escotes: el ${lowerFirst(pick(necklineOptions))} también te favorece.`);
    }
  } else if (topic) {
    parts.push(firstSentences(topic.summary_es, 2));
    parts.push(pick([
      '¿Ya hiciste el Análisis Facial en la app? Con tu forma de rostro exacta te puedo dar tips mucho más precisos.',
      'Si te haces el escaneo facial de Lumina, puedo darte recomendaciones hechas justo para tu forma de rostro.',
    ]));
  } else {
    parts.push('El visagismo estudia las proporciones de tu rostro para saber qué cortes, cejas o maquillaje armonizan mejor con tu forma natural — no hay formas "buenas" o "malas", solo las tuyas.');
    parts.push('¿Ya hiciste el Análisis Facial en la app? Ahí puedes descubrir tu forma de rostro.');
  }

  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════════
// 7-10. Saludo / gracias / despedida / quién eres
// ═══════════════════════════════════════════════════════════════

// Nota: tras normalize() colapsar 3+ repetidas, "holiii"→"holi" y "holaaaa"→"hola",
// así que basta con tener las formas base — no hace falta listar cada alargamiento.
// Sí se listan variantes con 1-2 repeticiones ("holaa", "buenass") que no colapsan.
const GREETING_KEYWORDS = [
  'hola', 'ola', 'holi', 'holis', 'holii', 'holu', 'hey', 'ey', 'buenas',
  'wenas', 'buenass', 'buenos', 'sup', 'hello', 'hi', 'saludos', 'quiubo', 'epale',
];
const GREETING_PHRASES = [
  'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'q tal', 'ke tal',
  'que onda', 'ke onda', 'q onda', 'hey lumi', 'que hubo',
];

const GREETING_TEMPLATES = [
  (name) => `Hola${name ? ' ' + name : ''} — ¿qué te ronda la mente hoy?`,
  (name) => `Hey${name ? ' ' + name : ''}, qué gusto verte por aquí. ¿En qué te ayudo?`,
  (name) => `Buenas${name ? ', ' + name : ''} ✨ ¿Qué necesitas hoy: piel, color, maquillaje, o solo platicar?`,
  (name) => `Hola${name ? ' ' + name : ''}, aquí estoy. Cuéntame qué traes.`,
];

function greetingReply(profile, known) {
  const base = pick(GREETING_TEMPLATES)(profile?.name);
  const hasAnyResult = known.hasFace || known.hasColor || known.hasSkin;
  // Solo de vez en cuando referenciamos lo que ya sabemos — no en cada saludo.
  if (hasAnyResult && Math.random() < 0.35) {
    const mention = buildKnownMention(known);
    if (mention) return `${base} ${mention}`;
  }
  return base;
}

const THANKS_KEYWORDS = ['gracias', 'grax', 'gracia', 'graciass', 'ty', 'thanks', 'thx'];
const THANKS_PHRASES = ['te pasaste', 'mil gracias', 'muchas gracias'];
const THANKS_TEMPLATES = [
  'Con todo gusto, para eso estoy.',
  'Siempre es un placer — para lo que necesites, aquí ando.',
  'Me alegra poder ayudarte.',
];
function thanksReply() {
  return pick(THANKS_TEMPLATES);
}

const FAREWELL_KEYWORDS = ['adios', 'adio', 'chao', 'chau', 'bye', 'byee', 'bai', 'cuidate'];
const FAREWELL_PHRASES = ['hasta luego', 'nos vemos', 'hasta pronto', 'me voy', 'hasta la proxima'];
const FAREWELL_TEMPLATES = [
  'Cuídate mucho — aquí estaré cuando quieras volver.',
  'Nos vemos pronto. Fue lindo hablar contigo hoy.',
  'Que tengas un lindo resto de día. Vuelve cuando quieras.',
];
function farewellReply() {
  return pick(FAREWELL_TEMPLATES);
}

const WHOAMI_KEYWORDS = ['robot'];
const WHOAMI_PHRASES = [
  'quien eres', 'que eres', 'k eres', 'ke eres', 'que haces', 'como funcionas',
  'eres real', 'eres una ia', 'eres ia', 'eres humana', 'eres un bot', 'eres robot',
  'quien te hizo', 'como te llamas',
];
function whoAmIReply() {
  return 'Soy Lumina, tu compañera de belleza y autocuidado dentro de esta app — creada por Valery. Sí, soy una especie de IA, pero corro completamente en tu dispositivo, sin conexión a internet: funciono con reglas y una base de conocimiento curada sobre visagismo, colorimetría y dermatología. Cuando el tema es emocional trato de escucharte de verdad, aunque para momentos difíciles siempre te voy a invitar a hablar con una persona real.';
}

// ═══════════════════════════════════════════════════════════════
// 10.5 CASUAL / RELLENO — mensajes cortos que no son ninguna categoría real
// (risas, "ok", mensajes vacíos o solo signos) pero que igual merecen una
// respuesta cálida en vez de romper hacia el fallback genérico.
// ═══════════════════════════════════════════════════════════════

const CASUAL_ACK_WORDS = ['ok', 'okay', 'oki', 'vale', 'sale', 'va', 'dale', 'listo'];
const CASUAL_KEYWORDS = [...CASUAL_ACK_WORDS, 'jaja', 'jeje', 'jsjs', 'lol', 'xd', 'haha'];

// Detecta el "sabor" del mensaje casual para elegir la plantilla adecuada.
// null = no es casual (deja que compita el scoring normal).
function detectCasualKind(normText, tokens) {
  const lettersOnly = normText.replace(/[^a-z]/g, '');
  if (!lettersOnly) return 'blank'; // vacío, solo signos/emojis/números
  if (isLaughter(normText)) return 'laugh';
  // Mensajes de una sola palabra corta tipo "si"/"no"/"ya" — se comprueban sobre
  // el texto crudo porque "si"/"no" son stopwords y tokenize() los descarta.
  const trimmed = normText.trim();
  if (!/\s/.test(trimmed) && trimmed.length <= 6 && [...CASUAL_ACK_WORDS, 'si', 'no', 'ya'].includes(trimmed)) {
    return 'ack';
  }
  if (tokens.length > 0 && tokens.length <= 2 && hasAnyKeyword(normText, CASUAL_ACK_WORDS)) return 'ack';
  return null;
}

const CASUAL_TEMPLATES = {
  laugh: [
    'Jaja me encanta esa energía ✨ ¿en qué te ayudo?',
    'Jajaja se contagia tu buena onda. ¿Qué te gustaría ver hoy: piel, color, maquillaje, rostro?',
    'Jeje, me sacaste una sonrisa. ¿Qué traes en mente?',
  ],
  ack: [
    'Va, aquí sigo si se te ocurre algo más.',
    'Perfecto. ¿Hay algo más en lo que te pueda ayudar?',
    'Anotado. Cuéntame si quieres profundizar en algo.',
  ],
  blank: [
    '¿Qué necesitas? Puedo ayudarte con piel, color, maquillaje, forma de rostro, o simplemente platicar.',
    'Cuéntame qué traes en mente — piel, color, maquillaje, rostro, ¡o lo que sea!',
    'Te leo. ¿Sobre qué quieres hablar hoy?',
  ],
};

function casualReply(kind) {
  return pick(CASUAL_TEMPLATES[kind] || CASUAL_TEMPLATES.ack);
}

// ═══════════════════════════════════════════════════════════════
// Scoring de intents "de contenido" — compiten entre sí, gana el mayor.
// Solo si TODOS quedan en 0 se dispara el fallback.
// ═══════════════════════════════════════════════════════════════

const INTENT_ORDER = ['color', 'skin', 'makeup', 'face', 'greeting', 'thanks', 'farewell', 'whoami', 'casual'];

const INTENT_DEFS = {
  color: { words: COLOR_KEYWORDS, phrases: COLOR_PHRASES },
  skin: { words: SKIN_KEYWORDS, phrases: SKIN_PHRASES },
  makeup: { words: MAKEUP_KEYWORDS, phrases: [] },
  face: { words: FACE_KEYWORDS, phrases: FACE_PHRASES },
  greeting: { words: GREETING_KEYWORDS, phrases: GREETING_PHRASES },
  thanks: { words: THANKS_KEYWORDS, phrases: THANKS_PHRASES },
  farewell: { words: FAREWELL_KEYWORDS, phrases: FAREWELL_PHRASES },
  whoami: { words: WHOAMI_KEYWORDS, phrases: WHOAMI_PHRASES },
  casual: { words: CASUAL_KEYWORDS, phrases: [] },
};

function computeIntentScores(normText, tokens, casualKind) {
  const scores = {};
  for (const id of INTENT_ORDER) {
    scores[id] = scoreIntent(normText, tokens, INTENT_DEFS[id]);
  }
  // Bonus: preguntas concretas tipo "¿el negro me queda?" sin decir "color" explícito.
  const quickKeys = Object.keys(QUICK_COLOR_ANSWERS);
  if (hasAnyKeyword(normText, quickKeys) && hasAnyKeyword(normText, COLOR_FIT_WORDS)) {
    scores.color += 4;
  }
  if (casualKind) scores.casual += 5;
  return scores;
}

function pickBestIntent(scores) {
  let bestId = null;
  let bestScore = 0;
  for (const id of INTENT_ORDER) {
    const sc = scores[id] || 0;
    if (sc > bestScore) {
      bestScore = sc;
      bestId = id;
    }
  }
  return bestId;
}

// ═══════════════════════════════════════════════════════════════
// 11. FALLBACK — solo cuando de verdad ningún intent puntuó nada.
// ═══════════════════════════════════════════════════════════════

const FALLBACK_TEMPLATES = [
  'Creo que no entendí del todo eso — ¿me lo cuentas de otra forma? Se me da bien hablar de piel, colores, maquillaje, forma de rostro, y también acompañarte en los días difíciles.',
  'No estoy segura de haber captado bien tu pregunta. Puedo ayudarte con colorimetría, cuidado de piel, maquillaje, tu forma de rostro, o simplemente escucharte si el día viene pesado. ¿Por dónde quieres ir?',
  'No quiero inventarte una respuesta a algo que no entendí bien. Cuéntamelo distinto, o dime si quieres hablar de piel, color, maquillaje, rostro, o de cómo te sientes hoy.',
];
const FALLBACK_KNOWN_EXTRAS = [
  'Ya conozco algunos de tus resultados — ¿quieres que te arme un look con eso, o prefieres hablar de otra cosa?',
  'Tengo guardados tus resultados de los tests — puedo usarlos si quieres consejos más precisos.',
];

function fallbackReply(known) {
  const base = pick(FALLBACK_TEMPLATES);
  if (known && (known.hasFace || known.hasColor || known.hasSkin)) {
    return `${base} ${pick(FALLBACK_KNOWN_EXTRAS)}`;
  }
  return base;
}

// ═══════════════════════════════════════════════════════════════
// Motor principal
// ═══════════════════════════════════════════════════════════════

/**
 * Genera la respuesta de Lumina de forma 100% local, sin red.
 *
 * @param {string} userText - Mensaje del usuario.
 * @param {Object|null} profile - Perfil desde getProfile() (puede ser null).
 * @param {Array} history - Historial de mensajes {from, text} (reservado para uso futuro).
 * @returns {{ text: string, delayMs: number }}
 */
export function getLuminaReply(userText, profile, history) {
  try {
    const safeProfile = profile || {};
    const known = getKnownResults(safeProfile);
    const raw = String(userText || '').trim();
    const normText = normalize(raw);
    const tokens = tokenize(normText);

    let text;

    // Orden de prioridad: SAFETY (dura) → EMOCIONAL (dura) → scoring entre
    // los intents de contenido/social (gana el de mayor puntaje) → fallback
    // (solo si absolutamente todos los scores quedan en 0).
    const safetyKind = detectSafety(normText);
    if (safetyKind) {
      text = safetyReply(safetyKind, safeProfile);
    } else if (isEmotionalIntent(normText)) {
      const mood = detectMood(normText) || 'down';
      text = emotionalReply(mood, safeProfile);
    } else {
      const casualKind = detectCasualKind(normText, tokens);
      const scores = computeIntentScores(normText, tokens, casualKind);
      const bestId = pickBestIntent(scores);

      switch (bestId) {
        case 'color':
          text = colorimetriaReply(normText, tokens, safeProfile, known);
          break;
        case 'skin':
          text = skincareReply(normText, tokens, safeProfile, known);
          break;
        case 'makeup':
          text = makeupReply(normText, tokens, safeProfile, known);
          break;
        case 'face':
          text = visagismReply(tokens, safeProfile, known);
          break;
        case 'greeting':
          text = greetingReply(safeProfile, known);
          break;
        case 'thanks':
          text = thanksReply();
          break;
        case 'farewell':
          text = farewellReply();
          break;
        case 'whoami':
          text = whoAmIReply();
          break;
        case 'casual':
          text = casualReply(casualKind || 'ack');
          break;
        default:
          text = fallbackReply(known);
      }
    }

    if (!text) text = fallbackReply(known);

    // Simula tiempo de "escritura" proporcional al largo de la respuesta.
    const delayMs = Math.min(1600, Math.max(600, 500 + text.length * 6));

    return { text, delayMs };
  } catch (err) {
    // El motor local NUNCA debe explotar la UI — siempre responde algo.
    console.error('luminaChat error:', err);
    return {
      text: 'Se me cruzaron los cables un segundo — ¿me repites lo que me decías?',
      delayMs: 800,
    };
  }
}
