// ─── plan.js — Mi Plan Lumina ────────────────────────────────────────────────
// All localStorage access is guarded so SSR/test environments don't crash.

const PLAN_KEY = 'lumina_plan';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD for a given Date (or today if omitted). */
function toDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns YYYY-MM-DD for yesterday. */
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

/** Simple deterministic seed from a date string (for daily activity selection). */
function dateSeed(dateStr) {
  return dateStr.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

/** Seeded shuffle — returns a new array in a deterministic order for a given seed. */
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Activity pool ────────────────────────────────────────────────────────────

const ACTIVITY_POOL = [
  // ─── skin (11) ───
  {
    id: 'skin_cleanse',
    title: 'Limpia tu rostro',
    desc: 'Un momento para ti: limpieza suave mañana y noche.',
    emoji: '🧼',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_spf',
    title: 'Ponte SPF hoy',
    desc: 'Tu piel del futuro te lo agradecerá. ¡SPF 30 mínimo!',
    emoji: '🌞',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_hydrate',
    title: 'Hidrata tu piel',
    desc: 'Aplica tu crema favorita con un mini masaje circular.',
    emoji: '💧',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_water',
    title: 'Bebe un vaso de agua',
    desc: 'La hidratación empieza desde adentro. Tu piel te lo nota.',
    emoji: '🥤',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_lips',
    title: 'Cuida tus labios',
    desc: 'Un poco de bálsamo y listo. Los labios también son piel.',
    emoji: '💋',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_no_touch',
    title: 'Día sin tocarte la cara',
    desc: 'Menos manos en el rostro = menos granitos. Tú puedes.',
    emoji: '🙅‍♀️',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_pillowcase',
    title: 'Cambia tu funda de almohada',
    desc: 'Una funda limpia es de las mejores rutinas anti-acné que existen.',
    emoji: '🛏️',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_mask',
    title: 'Ponte una mascarilla',
    desc: '15 minutos de mimo para tu piel. Bonus si es con música.',
    emoji: '🧖‍♀️',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_neck',
    title: 'No olvides tu cuello',
    desc: 'Lleva tu crema y tu SPF hasta el cuello. Suele quedar olvidado.',
    emoji: '🧴',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_night_routine',
    title: 'Rutina de noche completa',
    desc: 'Desmaquilla, limpia e hidrata antes de dormir. Tu piel se repara de noche.',
    emoji: '🌙',
    category: 'skin',
    goalsRelated: ['skincare'],
  },
  {
    id: 'skin_check',
    title: 'Observa tu piel sin juzgarla',
    desc: 'Un minuto frente al espejo notando cómo está hoy, con cariño.',
    emoji: '🔍',
    category: 'skin',
    goalsRelated: ['skincare', 'selflove'],
  },

  // ─── color (8) ───
  {
    id: 'color_palette',
    title: 'Revisa tu paleta de colores',
    desc: 'Abre tu test de colorimetría y recuerda qué tonos te favorecen.',
    emoji: '🎨',
    category: 'color',
    goalsRelated: ['colorimetry', 'makeup'],
  },
  {
    id: 'color_try',
    title: 'Prueba un color nuevo',
    desc: 'Ponte un accesorio o prenda de tu estación. ¿Cómo te hace sentir?',
    emoji: '🌈',
    category: 'color',
    goalsRelated: ['colorimetry', 'makeup'],
  },
  {
    id: 'color_study',
    title: 'Explora tu colorimetría',
    desc: 'Busca una inspiración visual de tu estación de color favorita.',
    emoji: '✨',
    category: 'color',
    goalsRelated: ['colorimetry'],
  },
  {
    id: 'color_outfit',
    title: 'Arma un outfit de tu paleta',
    desc: 'Elige un look de hoy con tus colores ganadores. Te vas a sentir radiante.',
    emoji: '👗',
    category: 'color',
    goalsRelated: ['colorimetry'],
  },
  {
    id: 'color_nails',
    title: 'Uñas de tu subtono',
    desc: 'Píntate las uñas de un tono de tu paleta. Detalle chiquito, efecto grande.',
    emoji: '💅',
    category: 'color',
    goalsRelated: ['colorimetry'],
  },
  {
    id: 'color_accessory',
    title: 'Suma un accesorio de color',
    desc: 'Un arete, una diadema, un pañuelo de tu paleta. Ilumina el rostro.',
    emoji: '💍',
    category: 'color',
    goalsRelated: ['colorimetry'],
  },
  {
    id: 'color_inspo',
    title: 'Guarda una inspo de color',
    desc: 'Encuentra una foto que ame tu paleta y guárdala para tus looks.',
    emoji: '📌',
    category: 'color',
    goalsRelated: ['colorimetry', 'explore'],
  },
  {
    id: 'color_metals',
    title: 'Juega con tu metal',
    desc: '¿Plata u oro? Pruébate el que va con tu subtono y nota la diferencia.',
    emoji: '⚜️',
    category: 'color',
    goalsRelated: ['colorimetry'],
  },

  // ─── face (7) ───
  {
    id: 'face_analysis',
    title: 'Haz tu análisis facial',
    desc: 'Dedica 2 minutos a explorar los rasgos únicos de tu rostro.',
    emoji: '📸',
    category: 'face',
    goalsRelated: ['face', 'makeup'],
  },
  {
    id: 'face_mirror',
    title: 'Sonríete al espejo',
    desc: 'Una sonrisa genuina frente al espejo. Cuéntate algo bonito.',
    emoji: '🪞',
    category: 'face',
    goalsRelated: ['face', 'selflove'],
  },
  {
    id: 'face_brows',
    title: 'Peina tus cejas',
    desc: 'Con un cepillito hacia arriba. Enmarcan tu mirada al instante.',
    emoji: '🖌️',
    category: 'face',
    goalsRelated: ['face', 'makeup'],
  },
  {
    id: 'face_massage',
    title: 'Masaje facial de 2 minutos',
    desc: 'Movimientos suaves hacia afuera. Relaja y activa la circulación.',
    emoji: '💆‍♀️',
    category: 'face',
    goalsRelated: ['face', 'selflove'],
  },
  {
    id: 'face_features',
    title: 'Nombra 3 rasgos que amas',
    desc: 'Tus ojos, tu sonrisa, tus pecas... 3 cosas de tu cara que te gustan.',
    emoji: '💖',
    category: 'face',
    goalsRelated: ['face', 'selflove'],
  },
  {
    id: 'face_cold',
    title: 'Refresca tu rostro',
    desc: 'Agua fría o una cuchara fría bajo los ojos. Despierta y desinflama.',
    emoji: '🥄',
    category: 'face',
    goalsRelated: ['face'],
  },
  {
    id: 'face_selfie',
    title: 'Selfie sin filtros',
    desc: 'Una foto tuya tal cual eres hoy. Sin retoques. Así de linda.',
    emoji: '🤳',
    category: 'face',
    goalsRelated: ['face', 'selflove'],
  },

  // ─── wellness (12) ───
  {
    id: 'wellness_affirmation',
    title: 'Lee tu afirmación del día',
    desc: 'Abre la sección de Bienestar y deja que las palabras calen.',
    emoji: '💕',
    category: 'wellness',
    goalsRelated: ['selflove', 'explore'],
  },
  {
    id: 'wellness_breathe',
    title: 'Respira profundo',
    desc: 'Inhala 4 segundos, aguanta 4, exhala 4. Cinco veces. Listo.',
    emoji: '🌬️',
    category: 'wellness',
    goalsRelated: ['selflove'],
  },
  {
    id: 'wellness_journal',
    title: 'Escribe algo positivo de ti',
    desc: 'Una sola frase de algo que te gusta de ti misma hoy.',
    emoji: '📓',
    category: 'wellness',
    goalsRelated: ['selflove'],
  },
  {
    id: 'wellness_checkin',
    title: 'Check-in de ánimo',
    desc: 'Abre Bienestar y elige cómo te sientes hoy. Sin juicios.',
    emoji: '🌸',
    category: 'wellness',
    goalsRelated: ['selflove', 'explore'],
  },
  {
    id: 'wellness_gratitude',
    title: 'Escribe 3 cosas que agradeces',
    desc: 'Grandes o pequeñas. El agua caliente cuenta, el sol cuenta.',
    emoji: '🙏',
    category: 'wellness',
    goalsRelated: ['selflove'],
  },
  {
    id: 'wellness_dance',
    title: 'Baila tu canción favorita',
    desc: 'Súbele el volumen y muévete. Nadie te está mirando.',
    emoji: '🎶',
    category: 'wellness',
    goalsRelated: ['selflove'],
  },
  {
    id: 'wellness_compliment',
    title: 'Hazle un cumplido a alguien',
    desc: 'Alegrar a otra persona también te llena a ti. Pruébalo.',
    emoji: '🫶',
    category: 'wellness',
    goalsRelated: ['selflove'],
  },
  {
    id: 'wellness_boundary',
    title: 'Di "no" a algo que te agota',
    desc: 'Poner un límite hoy es cuidarte. No le debes un sí a todo.',
    emoji: '✋',
    category: 'wellness',
    goalsRelated: ['selflove'],
  },
  {
    id: 'wellness_rest',
    title: 'Date permiso de descansar',
    desc: 'Sin culpa. Descansar también es productivo. Tu cuerpo lo pide.',
    emoji: '😌',
    category: 'wellness',
    goalsRelated: ['selflove'],
  },
  {
    id: 'wellness_mirror_words',
    title: 'Dite algo bonito al espejo',
    desc: 'En voz alta, mirándote a los ojos. Raro al inicio, poderoso después.',
    emoji: '🗣️',
    category: 'wellness',
    goalsRelated: ['selflove'],
  },
  {
    id: 'wellness_goal',
    title: 'Escribe una meta pequeña',
    desc: 'Algo que quieras lograr esta semana. Chiquito y real.',
    emoji: '🎯',
    category: 'wellness',
    goalsRelated: ['selflove', 'explore'],
  },
  {
    id: 'wellness_declutter',
    title: 'Ordena un rincón pequeño',
    desc: 'Tu escritorio, un cajón, tu mesita. Espacio limpio, mente ligera.',
    emoji: '🧹',
    category: 'wellness',
    goalsRelated: ['selflove'],
  },

  // ─── general (10) ───
  {
    id: 'general_walk',
    title: 'Camina 10 minutos al sol',
    desc: 'Luz natural, vitamina D y un momento para ti sola.',
    emoji: '🌤️',
    category: 'general',
    goalsRelated: [],
  },
  {
    id: 'general_break',
    title: 'Break sin pantallas',
    desc: '10 minutos lejos del móvil. Mira por la ventana o estira.',
    emoji: '🧘',
    category: 'general',
    goalsRelated: [],
  },
  {
    id: 'general_connect',
    title: 'Llama a alguien que quieres',
    desc: 'Un mensajito o llamada a quien te haga reír.',
    emoji: '💌',
    category: 'general',
    goalsRelated: [],
  },
  {
    id: 'general_smile',
    title: 'Sonríe de verdad',
    desc: 'Busca algo que te alegre hoy: música, meme, memoria bonita.',
    emoji: '😊',
    category: 'general',
    goalsRelated: [],
  },
  {
    id: 'general_sleep',
    title: 'Duerme temprano hoy',
    desc: 'Tu piel y tu ánimo se reparan mientras duermes. Apunta a 8 horas.',
    emoji: '💤',
    category: 'general',
    goalsRelated: [],
  },
  {
    id: 'general_stretch',
    title: 'Estírate 5 minutos',
    desc: 'Cuello, hombros, espalda. Suelta la tensión del día.',
    emoji: '🤸‍♀️',
    category: 'general',
    goalsRelated: [],
  },
  {
    id: 'general_bed',
    title: 'Haz tu cama con cariño',
    desc: 'Empezar el día con un pequeño logro cambia todo. En serio.',
    emoji: '🛌',
    category: 'general',
    goalsRelated: [],
  },
  {
    id: 'general_nourish',
    title: 'Come algo que te nutra',
    desc: 'Una fruta, algo verde, algo real. Tu cuerpo trabaja para ti.',
    emoji: '🍓',
    category: 'general',
    goalsRelated: [],
  },
  {
    id: 'general_offline',
    title: '1 hora sin redes sociales',
    desc: 'Menos comparación, más tú. Regálate una hora de paz.',
    emoji: '📵',
    category: 'general',
    goalsRelated: [],
  },
  {
    id: 'general_read',
    title: 'Lee algo que te guste',
    desc: '10 minutos de un libro, un cómic, lo que sea. Descansa la mente.',
    emoji: '📖',
    category: 'general',
    goalsRelated: [],
  },
];

// ─── Goal → category mapping ──────────────────────────────────────────────────

const GOAL_CATEGORY_MAP = {
  skincare:    'skin',
  colorimetry: 'color',
  makeup:      'color',
  face:        'face',
  selflove:    'wellness',
  explore:     'wellness',
};

// ─── Achievement definitions ──────────────────────────────────────────────────

/** Tier names, indexed 1..4 (0 = not achieved yet). */
export const TIERS = ['Bronce', 'Plata', 'Oro', 'Diamante'];

/** Tier emoji, keyed by tier index (1..4). */
export const TIER_EMOJI = { 1: '🥉', 2: '🥈', 3: '🥇', 4: '💎' };

const ALL_CATEGORIES = ['skin', 'color', 'face', 'wellness', 'general'];

export const ACHIEVEMENTS = [
  {
    id: 'constancia',
    label: 'Constancia',
    emoji: '🏆',
    desc: 'Días totales completados',
    metric: 'days',
    thresholds: [7, 14, 30, 60],
  },
  {
    id: 'racha',
    label: 'Racha de Fuego',
    emoji: '🔥',
    desc: 'Tu racha más larga',
    metric: 'longestStreak',
    thresholds: [3, 7, 14, 30],
  },
  {
    id: 'exploradora',
    label: 'Exploradora',
    emoji: '🌟',
    desc: 'Ciclos de todas las áreas',
    metric: 'explorerCycles',
    thresholds: [1, 3, 6, 10],
  },
  {
    id: 'dedicacion',
    label: 'Dedicación',
    emoji: '⭐',
    desc: 'Misiones completadas',
    metric: 'totalCompletions',
    thresholds: [10, 30, 60, 120],
  },
  {
    id: 'coleccionista',
    label: 'Coleccionista',
    emoji: '🗂️',
    desc: 'Misiones distintas probadas',
    metric: 'distinctActivities',
    thresholds: [10, 20, 35, 48],
  },
  {
    id: 'alma_calma',
    label: 'Alma en Calma',
    emoji: '🕊️',
    desc: 'Momentos de bienestar',
    metric: 'wellnessCount',
    thresholds: [5, 15, 30, 60],
  },
];

/** Reads the current value of a metric from a plan, defaulting missing fields to 0/[]. */
function metricValue(plan, metric) {
  switch (metric) {
    case 'days': return (plan.completedDays || []).length;
    case 'distinctActivities': return (plan.distinctActivities || []).length;
    case 'longestStreak': return plan.longestStreak || 0;
    case 'explorerCycles': return plan.explorerCycles || 0;
    case 'totalCompletions': return plan.totalCompletions || 0;
    case 'wellnessCount': return plan.wellnessCount || 0;
    default: return 0;
  }
}

/**
 * Returns the display status of an achievement for a given plan.
 * Tier is permanent — it's the max of the persisted tier and whatever the
 * current metric value would earn (defensive, in case storage is stale).
 * @param {object} ach - one of ACHIEVEMENTS
 * @param {object} [plan] - optional plan (defaults to reading storage)
 */
export function getAchievementStatus(ach, plan = getPlan()) {
  const value = metricValue(plan, ach.metric);
  const storedTier = plan.achievementTiers?.[ach.id] || 0;
  let earnedTier = 0;
  for (let i = 0; i < ach.thresholds.length; i++) {
    if (value >= ach.thresholds[i]) earnedTier = i + 1;
  }
  const tier = Math.max(storedTier, earnedTier);
  const tierName = tier > 0 ? TIERS[tier - 1] : null;
  const isMax = tier >= ach.thresholds.length;
  const nextThreshold = isMax ? null : ach.thresholds[tier];
  return { tier, tierName, tierEmoji: TIER_EMOJI[tier] || null, value, nextThreshold, isMax };
}

// ─── Default plan structure ───────────────────────────────────────────────────

function defaultPlan() {
  return {
    streak: 0,
    lastCompletionDate: null,
    completedDays: [],
    todayCompletions: [],
    todayDate: toDateStr(),
    unlockedAchievements: [],
    categoriesCompleted: [],
    totalCompletions: 0,
    longestStreak: 0,
    explorerCycles: 0,
    cycleCategories: [],
    distinctActivities: [],
    wellnessCount: 0,
    achievementTiers: {},
  };
}

// ─── Exported: getPlan ────────────────────────────────────────────────────────

export function getPlan() {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return defaultPlan();
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing keys from older schema versions
    return { ...defaultPlan(), ...parsed };
  } catch {
    return defaultPlan();
  }
}

function savePlan(plan) {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  } catch { /* storage full — silent */ }
}

// ─── Exported: getEffectiveStreak ─────────────────────────────────────────────

/**
 * Returns the streak as it should be DISPLAYED right now.
 * A streak is only "alive" if the last completion was today or yesterday.
 * If the user missed a full day (last completion is 2+ days ago), the streak
 * is considered broken and this returns 0 — even though the stored value is
 * still the old number (it only gets rewritten on the next completion).
 * @param {object} [plan] - optional plan (defaults to reading storage)
 * @returns {number}
 */
export function getEffectiveStreak(plan = getPlan()) {
  if (!plan.lastCompletionDate) return 0;
  const today = toDateStr();
  const yesterday = yesterdayStr();
  if (plan.lastCompletionDate === today || plan.lastCompletionDate === yesterday) {
    return plan.streak || 0;
  }
  return 0; // gap of 2+ days → streak broken
}

// ─── Exported: syncStreak ─────────────────────────────────────────────────────

/**
 * Persists a broken streak so storage stays honest (streak → 0 when the user
 * missed a full day). Safe to call on screen mount. Also clears the stale
 * todayCompletions if the stored day isn't today. Returns the fresh plan.
 * @returns {object} the (possibly updated) plan
 */
export function syncStreak() {
  const plan = getPlan();
  const today = toDateStr();
  let changed = false;

  // If a new day started, last day's completions no longer count as "today".
  if (plan.todayDate !== today) {
    plan.todayCompletions = [];
    plan.todayDate = today;
    changed = true;
  }

  // If the streak is broken (no completion today or yesterday), zero it out.
  const effective = getEffectiveStreak(plan);
  if (plan.streak !== effective && effective === 0) {
    plan.streak = 0;
    changed = true;
  }

  if (changed) savePlan(plan);
  return plan;
}

// ─── Exported: getTodayActivities ─────────────────────────────────────────────

/**
 * Returns 3-4 activities for today, deterministic per date.
 * @param {object|null} profile - lumina profile object
 */
export function getTodayActivities(profile) {
  const today = toDateStr();
  const seed = dateSeed(today);

  // Determine preferred category from profile goals
  const goals = profile?.goals || [];
  let preferredCategory = null;
  for (const goal of goals) {
    if (GOAL_CATEGORY_MAP[goal]) {
      preferredCategory = GOAL_CATEGORY_MAP[goal];
      break;
    }
  }

  // Split pool into buckets
  const preferred = preferredCategory
    ? ACTIVITY_POOL.filter(a => a.category === preferredCategory)
    : [];
  const general = ACTIVITY_POOL.filter(a => a.category === 'general');
  const other = ACTIVITY_POOL.filter(
    a => a.category !== preferredCategory && a.category !== 'general'
  );

  // Shuffle each bucket with same daily seed (different sub-seed per bucket)
  const shuffledPreferred = seededShuffle(preferred, seed);
  const shuffledGeneral = seededShuffle(general, seed + 7);
  const shuffledOther = seededShuffle(other, seed + 13);

  const selected = [];

  // Slot 1: one from preferred category (if any)
  if (shuffledPreferred.length > 0) {
    selected.push(shuffledPreferred[0]);
  }

  // Slot 2: one general — always
  if (shuffledGeneral.length > 0) {
    selected.push(shuffledGeneral[0]);
  }

  // Slots 3-4: fill from other (up to 2, avoid duplicates)
  const usedIds = new Set(selected.map(a => a.id));
  for (const act of shuffledOther) {
    if (selected.length >= 4) break;
    if (!usedIds.has(act.id)) {
      selected.push(act);
      usedIds.add(act.id);
    }
  }

  // If still short (e.g. no preferred), fill from general pool second slot
  for (const act of shuffledGeneral.slice(1)) {
    if (selected.length >= 4) break;
    if (!usedIds.has(act.id)) {
      selected.push(act);
      usedIds.add(act.id);
    }
  }

  // Guarantee at least 3
  if (selected.length < 3) {
    for (const act of ACTIVITY_POOL) {
      if (selected.length >= 3) break;
      if (!usedIds.has(act.id)) {
        selected.push(act);
        usedIds.add(act.id);
      }
    }
  }

  return selected.slice(0, 4);
}

// ─── Exported: markActivityCompleted ─────────────────────────────────────────

/**
 * Marks an activity as completed.
 * Returns info about a newly leveled-up achievement ({ id, label, tierName }), or null.
 * @param {string} activityId
 * @param {string} category
 */
export function markActivityCompleted(activityId, category) {
  const plan = getPlan();
  const today = toDateStr();

  // Detect day change — reset today's completions
  if (plan.todayDate !== today) {
    plan.todayCompletions = [];
    plan.todayDate = today;
  }

  const wasEmpty = plan.todayCompletions.length === 0;

  // Add activity if not already there
  if (!plan.todayCompletions.includes(activityId)) {
    plan.todayCompletions.push(activityId);

    // ── Lifetime metrics — only counted the first time this activity is
    // completed TODAY (a toggle-off/on within the same day won't double count).
    plan.totalCompletions = (plan.totalCompletions || 0) + 1;

    if (!plan.distinctActivities) plan.distinctActivities = [];
    if (!plan.distinctActivities.includes(activityId)) {
      plan.distinctActivities.push(activityId);
    }

    if (category === 'wellness') {
      plan.wellnessCount = (plan.wellnessCount || 0) + 1;
    }

    // Explorer cycle: accumulate categories, complete a cycle when all 5 are hit.
    if (!plan.cycleCategories) plan.cycleCategories = [];
    if (category && !plan.cycleCategories.includes(category)) {
      plan.cycleCategories.push(category);
      if (ALL_CATEGORIES.every(c => plan.cycleCategories.includes(c))) {
        plan.explorerCycles = (plan.explorerCycles || 0) + 1;
        plan.cycleCategories = [];
      }
    }
  }

  // Streak logic — only triggered by the first completion of the day
  if (wasEmpty) {
    const yesterday = yesterdayStr();
    if (!plan.lastCompletionDate) {
      // First ever completion
      plan.streak = 1;
    } else if (plan.lastCompletionDate === yesterday) {
      // Consecutive day
      plan.streak = (plan.streak || 0) + 1;
    } else if (plan.lastCompletionDate === today) {
      // Already counted today (defensive, shouldn't reach here given wasEmpty check)
    } else {
      // Gap of more than 1 day — reset streak
      plan.streak = 1;
    }
    plan.lastCompletionDate = today;

    if (!plan.completedDays.includes(today)) {
      plan.completedDays.push(today);
    }

    plan.longestStreak = Math.max(plan.longestStreak || 0, plan.streak || 0);
  }

  // Track category (legacy field, kept for backward-compat — no longer drives logic)
  if (category && !plan.categoriesCompleted.includes(category)) {
    plan.categoriesCompleted.push(category);
  }

  // Recalculate achievement tiers — permanent, never decreases.
  if (!plan.achievementTiers) plan.achievementTiers = {};
  let leveledUp = null;
  for (const ach of ACHIEVEMENTS) {
    const value = metricValue(plan, ach.metric);
    let earnedTier = 0;
    for (let i = 0; i < ach.thresholds.length; i++) {
      if (value >= ach.thresholds[i]) earnedTier = i + 1;
    }
    const current = plan.achievementTiers[ach.id] || 0;
    if (earnedTier > current) {
      plan.achievementTiers[ach.id] = earnedTier;
      if (!leveledUp) leveledUp = { id: ach.id, label: ach.label, tierName: TIERS[earnedTier - 1] };
    }
  }

  savePlan(plan);

  return leveledUp;
}

// ─── Exported: unmarkActivityCompleted ───────────────────────────────────────

/**
 * Removes an activity from today's completions (toggle off).
 * Does NOT reduce the streak — once earned, it stays.
 * @param {string} activityId
 */
export function unmarkActivityCompleted(activityId) {
  const plan = getPlan();
  const today = toDateStr();

  if (plan.todayDate !== today) {
    plan.todayCompletions = [];
    plan.todayDate = today;
  }

  plan.todayCompletions = plan.todayCompletions.filter(id => id !== activityId);
  savePlan(plan);
}

// ─── Exported: getWeekDays ────────────────────────────────────────────────────

const DAY_INITIALS_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/**
 * Returns 7 day objects for the current Mon–Sun week.
 */
export function getWeekDays() {
  const plan = getPlan();
  const completedSet = new Set(plan.completedDays);
  const today = toDateStr();

  // Find Monday of the current week
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toDateStr(d);
    const isToday = dateStr === today;
    const isPast = dateStr < today;
    const isFuture = dateStr > today;
    // Map JS day index (0=Sun..6=Sat) to ES initial array
    const initial = DAY_INITIALS_ES[d.getDay()];
    days.push({
      date: dateStr,
      dayLabel: initial,
      dayNum: d.getDate(),
      isToday,
      isPast,
      isFuture,
      isCompleted: completedSet.has(dateStr),
    });
  }
  return days;
}
