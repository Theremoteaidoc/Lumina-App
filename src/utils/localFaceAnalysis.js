/* ═══════════════════════════════════════════════════════════════════
   localFaceAnalysis.js — Local "deep" facial analysis

   Replaces the old Claude Vision call (api/analyze-face.js) with a
   fully local, instant analysis built from:
     - faceResult  (src/utils/faceClassifier.js + faceShapeRules.js)
     - eyeResult   (src/utils/eyeClassifier.js)
     - FACE_DATA / EYE_DATA knowledge base (src/data/appData.js)

   No network, no API key. Output shape intentionally mirrors what
   Claude used to return so the "Detalles" tab render stays unchanged:

   {
     primaryShape, confidence, secondaryInfluences,
     summary, characteristics, recommendations, honesty_note
   }
   ═══════════════════════════════════════════════════════════════════ */

import { FACE_DATA, EYE_DATA } from '../data/appData';

// ─── Small formatting helpers ─────────────────────────────────────

function decap(s) {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function cheekVsJaw(cjr) {
  if (!cjr || Number.isNaN(cjr)) return '';
  if (cjr >= 1.05) return ` (tus pómulos son ~${cjr.toFixed(2)}× más anchos que tu mandíbula)`;
  if (cjr <= 0.95) return ` (tu mandíbula es ~${(1 / cjr).toFixed(2)}× más ancha que tus pómulos)`;
  return ' (pómulos y mandíbula tienen un ancho muy similar)';
}

function jawVsForehead(jfr) {
  if (!jfr || Number.isNaN(jfr)) return '';
  if (jfr >= 1.05) return ` (tu mandíbula es ~${jfr.toFixed(2)}× más ancha que tu frente)`;
  if (jfr <= 0.95) return ` (tu frente es ~${(1 / jfr).toFixed(2)}× más ancha que tu mandíbula)`;
  return ' (frente y mandíbula tienen un ancho similar)';
}

function getMetrics(faceResult) {
  const whr = parseFloat(faceResult?.whr);
  const jfr = parseFloat(faceResult?.jfr);
  const cjr = parseFloat(faceResult?.cjr);
  const f = faceResult?.features || {};
  return {
    whr: Number.isNaN(whr) ? 0.7 : whr,
    jfr: Number.isNaN(jfr) ? 1 : jfr,
    cjr: Number.isNaN(cjr) ? 1 : cjr,
    jawAngle: f.jawAngle,
    chinAngle: f.chinAngle,
    cheekTaper: f.cheekTaper,
    foreheadTaper: f.foreheadTaper,
    widthVariance: f.widthVariance,
  };
}

// ─── Confidence bucket ─────────────────────────────────────────────

function mapConfidence(conf) {
  if (conf === undefined || conf === null || Number.isNaN(conf)) return 'media';
  if (conf > 70) return 'alta';
  if (conf >= 40) return 'media';
  return 'baja';
}

// ─── Secondary influences (nearby shapes suggested by the metrics) ─

function computeSecondaryInfluences(faceResult) {
  const primary = faceResult?.shape;

  // Prefer the influences already computed by the geometric classifier
  // (faceShapeRules.js) — they come from the full scoring pass, not just
  // a couple of ad-hoc heuristics.
  if (Array.isArray(faceResult?.secondaryInfluences) && faceResult.secondaryInfluences.length > 0) {
    return faceResult.secondaryInfluences
      .filter((key) => key !== primary && FACE_DATA[key])
      .slice(0, 2)
      .map((key) => FACE_DATA[key].title);
  }

  const { whr, jfr, cjr, jawAngle } = getMetrics(faceResult);
  const candidates = [];

  // Forehead ≈ jaw width → could read as cuadrado (angular jaw) or redondo (soft jaw)
  if (jfr >= 0.92 && jfr <= 1.08) {
    const angular = typeof jawAngle === 'number' && jawAngle < 115;
    candidates.push(angular ? 'cuadrado' : 'redondo');
  }

  // Cheeks notably wider than jaw → corazon (if forehead also wide) or diamante
  if (cjr >= 1.15) {
    candidates.push(jfr < 0.85 ? 'corazon' : 'diamante');
  }

  // Low width/height ratio → alargado influence
  if (whr < 0.64) {
    candidates.push('alargado');
  }

  const unique = [...new Set(candidates)].filter((s) => s !== primary && FACE_DATA[s]);
  return unique.slice(0, 2).map((key) => FACE_DATA[key].title);
}

// ─── Summary (varied templates, warm Lumina voice) ─────────────────

function buildSummary(shape, name, faceData, eyeResult) {
  const subj = name ? `${name}, tu` : 'Tu';
  const title = faceData.title.toLowerCase();
  const templates = [
    `${subj} rostro es predominantemente ${title}. ${faceData.desc}`,
    `${subj} rostro tiene forma ${title}. ${faceData.desc}`,
    `Tus proporciones muestran un rostro de tipo ${title}. ${faceData.desc}`,
  ];
  let summary = templates[Math.floor(Math.random() * templates.length)];

  const eData = eyeResult?.shape ? EYE_DATA[eyeResult.shape] : null;
  if (eData) {
    summary += ` Además, tus ojos son ${eData.title.toLowerCase()} — ${decap(eData.desc)}`;
  }
  return summary;
}

// ─── Characteristics per zone, curated per shape ───────────────────

const SHAPE_CHARACTERISTICS = {
  ovalado: {
    frente: (m) => `Tu frente tiene un ancho equilibrado${jawVsForehead(m.jfr)}, sin ser la zona dominante del rostro.`,
    pomulos: (m) => `Los pómulos son la parte más ancha de tu rostro${cheekVsJaw(m.cjr)}, dándole a tu cara ese contorno suave característico del óvalo.`,
    mandibula: () => `Tu mandíbula se estrecha de forma gradual y suave respecto a los pómulos, sin ángulos marcados.`,
    menton: () => `El mentón es redondeado y proporcional, ni muy corto ni muy alargado.`,
    proporciones: (m) => `La relación ancho/alto de tu rostro (${m.whr.toFixed(2)}) cae en el rango equilibrado típico del rostro ovalado.`,
  },
  redondo: {
    frente: (m) => `Tu frente tiene un ancho similar al de tus mejillas${jawVsForehead(m.jfr)}, con líneas suaves y curvas.`,
    pomulos: (m) => `Tus pómulos son anchos y llenos${cheekVsJaw(m.cjr)}, aportando ese aspecto juvenil típico del rostro redondo.`,
    mandibula: () => `La mandíbula es suavemente curva, sin ángulos definidos, y de anchura similar a la frente.`,
    menton: () => `El mentón tiende a ser corto y redondeado.`,
    proporciones: (m) => `Tu ancho y tu largo facial son muy parecidos (ratio ${m.whr.toFixed(2)}), lo que da esa apariencia circular.`,
  },
  cuadrado: {
    frente: (m) => `Tu frente es ancha y de líneas rectas${jawVsForehead(m.jfr)}, casi del mismo ancho que tu mandíbula.`,
    pomulos: (m) => `Los pómulos tienen un ancho similar al resto del rostro${cheekVsJaw(m.cjr)}, sin ser el punto más ancho.`,
    mandibula: (m) => `Tu mandíbula es fuerte y angular${typeof m.jawAngle === 'number' ? ` (~${Math.round(m.jawAngle)}° en el ángulo mandibular)` : ''}, dándole estructura a tu rostro.`,
    menton: () => `El mentón es cuadrado o plano, en línea con el resto de la mandíbula.`,
    proporciones: () => `El ancho de tu rostro es muy similar en frente, pómulos y mandíbula — la firma del rostro cuadrado.`,
  },
  corazon: {
    frente: (m) => `Tu frente es la zona más ancha de tu rostro${jawVsForehead(m.jfr)}, un rasgo distintivo del rostro corazón.`,
    pomulos: (m) => `Los pómulos son prominentes${cheekVsJaw(m.cjr)} y acompañan la amplitud de la frente.`,
    mandibula: () => `Tu mandíbula se estrecha notablemente respecto a la frente y los pómulos.`,
    menton: () => `El mentón es delicado y algo puntiagudo, marcando el contraste con la parte superior del rostro.`,
    proporciones: () => `Hay una reducción progresiva de ancho de arriba hacia abajo — de la frente al mentón — típica del rostro corazón.`,
  },
  alargado: {
    frente: (m) => `Tu frente es alta${jawVsForehead(m.jfr)}, y contribuye a la sensación de longitud del rostro.`,
    pomulos: (m) => `Los pómulos son rectos y no sobresalen mucho respecto al resto del contorno${cheekVsJaw(m.cjr)}.`,
    mandibula: () => `La mandíbula es angosta y alargada, sin curvas pronunciadas.`,
    menton: () => `El mentón tiende a ser largo, sumando a la proporción vertical del rostro.`,
    proporciones: (m) => `Tu rostro es notablemente más largo que ancho (ratio ${m.whr.toFixed(2)}), la característica principal del rostro alargado.`,
  },
  diamante: {
    frente: (m) => `Tu frente es angosta en comparación con tus pómulos${jawVsForehead(m.jfr)}.`,
    pomulos: (m) => `Los pómulos son la zona claramente más ancha de tu rostro${cheekVsJaw(m.cjr)}, el rasgo definitorio del rostro diamante.`,
    mandibula: () => `La mandíbula se estrecha hacia un mentón definido, más angosta que los pómulos.`,
    menton: () => `El mentón suele ser puntiagudo o angosto, en contraste con el ancho de los pómulos.`,
    proporciones: () => `Frente y mandíbula son más angostas que los pómulos, creando ese contorno en forma de rombo.`,
  },
};

function buildCharacteristics(shape, metrics) {
  const zones = SHAPE_CHARACTERISTICS[shape] || SHAPE_CHARACTERISTICS.ovalado;
  return {
    frente: zones.frente(metrics),
    pomulos: zones.pomulos(metrics),
    mandibula: zones.mandibula(metrics),
    menton: zones.menton(metrics),
    proporciones: zones.proporciones(metrics),
  };
}

// ─── Recommendations — weave FACE_DATA arrays into prose ──────────

function buildRecommendations(faceData) {
  const [h1, h2, h3] = faceData.haircuts;
  const haircuts = `Te favorecen especialmente ${decap(h1)} y ${decap(h2)}.${
    h3 ? ` También puedes considerar ${decap(h3)}.` : ''
  }`;

  const [mk1, mk2] = faceData.makeup;
  const makeup = `En maquillaje, prueba con ${decap(mk1)}${mk2 ? `; también funciona bien ${decap(mk2)}` : ''}. Para el contorno: ${decap(faceData.contourZones)}`;

  const necklines = `Los escotes y cuellos que más te favorecen son ${faceData.necklines
    .slice(0, 3)
    .map(decap)
    .join(', ')}.`;

  return { haircuts, makeup, necklines };
}

// ─── Honesty note bank ─────────────────────────────────────────────

const HONESTY_NOTES = [
  'Recuerda que casi ningún rostro es una sola forma pura — el tuyo es una combinación única, y eso es justo lo bonito.',
  'Este análisis es orientativo: se basa en las proporciones detectadas en tu foto, no en una regla absoluta. Tu rostro es mucho más que una categoría.',
  'Ninguna clasificación captura toda tu belleza — úsalo como punto de partida, no como una etiqueta fija.',
];

// ─── Public API ─────────────────────────────────────────────────────

export function buildLocalFaceInsights(faceResult, eyeResult, profile = {}) {
  if (!faceResult?.shape || !FACE_DATA[faceResult.shape]) return null;

  const shape = faceResult.shape;
  const faceData = FACE_DATA[shape];
  const metrics = getMetrics(faceResult);

  return {
    primaryShape: shape,
    confidence: mapConfidence(faceResult.confidence),
    secondaryInfluences: computeSecondaryInfluences(faceResult),
    summary: buildSummary(shape, profile?.name, faceData, eyeResult),
    characteristics: buildCharacteristics(shape, metrics),
    recommendations: buildRecommendations(faceData),
    honesty_note: HONESTY_NOTES[Math.floor(Math.random() * HONESTY_NOTES.length)],
  };
}
