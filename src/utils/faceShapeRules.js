/* ═══════════════════════════════════════════════════════════════════
   Face Shape Classification — Geometric Rules Engine
   100% local. No network, no ML model, no Random Forest.

   Replaces hybridClassifier.js (Random Forest trained on a small
   Kaggle dataset that systematically over-predicted "ovalado").
   Every shape starts at score 0 and only earns points when its
   specific geometric conditions are met — nothing wins "by default".

   Anchored in src/data/knowledge/visagism.json:
   - topic `vis_measuring_face_shape`: classification uses bicigomatic
     (cheekbone), bigonial (jaw), forehead width + total face height;
     practical rule "largo ≈ ancho → redonda/cuadrada; largo ≈ 1.5×
     ancho → oval/alargada".
   - topic `vis_face_shapes_overview`: each shape is defined by the
     RELATION between forehead/cheekbone/jaw widths + height; most
     real faces are hybrids, so we report primary + secondary
     influences instead of forcing a single pure category.

   Input: the feature object produced by `extractFeatures(lm)` in
   faceClassifier.js (f1_whr … f19, plus `_raw` with raw widths).
   ═══════════════════════════════════════════════════════════════════ */

const SHAPES = ['ovalado', 'redondo', 'cuadrado', 'alargado', 'corazon', 'diamante'];

function safeNum(n, fallback = 0) {
  return typeof n === 'number' && !Number.isNaN(n) ? n : fallback;
}

/**
 * Determine which of the 3 horizontal zones (forehead / cheekbones /
 * jaw) is the widest, and how "flat" the distribution is.
 */
function widestZoneOf(fW, cW, jW) {
  const max = Math.max(fW, cW, jW);
  if (max === cW) return 'pomulos';
  if (max === fW) return 'frente';
  return 'mandibula';
}

/**
 * Main entry point — geometric, rule-based face shape classification.
 * Never crashes on incomplete input; returns a safe low-confidence
 * result instead.
 */
export function classifyFaceShapeGeometric(features) {
  const empty = {
    shape: null,
    confidence: 0,
    scores: Object.fromEntries(SHAPES.map((s) => [s, 0])),
    secondaryInfluences: [],
    metrics: {
      lengthWidthRatio: null,
      jawForeheadRatio: null,
      cheekJawRatio: null,
      jawAngle: null,
      widestZone: null,
    },
  };

  if (!features) return empty;

  const raw = features._raw || {};
  const faceHeight = safeNum(raw.faceHeight, 0);
  const fW = safeNum(raw.foreheadWidth, 0);
  const cW = safeNum(raw.cheekboneWidth, 0);
  const jW = safeNum(raw.jawlineWidth, 0);

  if (faceHeight <= 0 || fW <= 0 || cW <= 0 || jW <= 0) return empty;

  const maxWidth = Math.max(fW, cW, jW);
  const minWidth = Math.min(fW, cW, jW);

  // ── Derived ratios (prefer values already computed by extractFeatures,
  //    fall back to computing them from raw widths) ────────────────────
  const lwr = faceHeight / maxWidth; // length/width — vis_measuring_face_shape rule of thumb
  const jfR = safeNum(features.f4_jfR, jW / fW);           // jaw / forehead
  const cjR = safeNum(features.f5_cjR, cW / jW);           // cheek / jaw
  const cfR = safeNum(features.f6_cfR, cW / fW);           // cheek / forehead
  const cheekTaper = safeNum(features.f10_cheekTaper, (cW - jW) / cW); // cheek→jaw taper
  const fhTaper = safeNum(features.f11_fhTaper, (fW - jW) / fW);      // forehead→jaw taper
  const jawSq = safeNum(features.f15_jawSq, 0.5);           // chin/jaw — near 1 = blunt chin
  const wVar = safeNum(features.f17_wVar, (maxWidth - minWidth) / maxWidth); // width spread
  const jawAngle = safeNum(features.f13_jawAng, 122);       // higher = softer/rounder jaw
  const chinAngle = safeNum(features.f14_chinAng, 122);     // lower = pointier chin

  const widestZone = widestZoneOf(fW, cW, jW);
  const jawIsSoft = jawAngle >= 124;      // rounded gonion
  const jawIsAngular = jawAngle <= 120;   // marked, stronger gonion (loosened from 114)
  const chinIsPointed = chinAngle < 112;
  const chinIsBlunt = chinAngle >= 128;
  const widthsAreSimilar = wVar < 0.10;   // forehead ≈ cheek ≈ jaw

  // ── Length is the single most reliable discriminator ─────────────────
  // (vis_measuring_face_shape: "largo ≈ ancho → redonda/cuadrada; largo ≈
  //  1.5× ancho → oval/alargada"). A face as wide as it is tall CANNOT be
  //  oval or oblong, no matter how soft the jaw — so length gates those.
  const isShort = lwr < 1.32;             // as wide as tall → round / square land
  const isLong  = lwr >= 1.5;             // clearly longer than wide → oblong / long-oval

  const scores = { ovalado: 0, redondo: 0, cuadrado: 0, alargado: 0, corazon: 0, diamante: 0 };

  // ── OVALADO ──────────────────────────────────────────────────────────
  // Balanced AND longer than wide. GATED on length: a short face never
  // scores as oval (this was the core bug — oval used to steal round and
  // square faces via shared soft-jaw / cheek-widest points).
  if (!isShort) {
    if (lwr >= 1.35 && lwr <= 1.65) scores.ovalado += 4;
    else scores.ovalado += 1;                              // medium/long but off ideal band
    if (widestZone === 'pomulos') scores.ovalado += 2;
    if (jfR <= 0.95) scores.ovalado += 1;                  // forehead a bit wider than jaw
    if (jawIsSoft) scores.ovalado += 2;
    if (cheekTaper >= 0.05 && cheekTaper <= 0.22) scores.ovalado += 2; // gentle, not extreme
  }

  // ── REDONDO ──────────────────────────────────────────────────────────
  // Short + soft jaw + cheekbones widest. Defined by fullness, NOT by the
  // three widths being near-identical (round faces have real cheek
  // prominence), so width-similarity is a bonus, not a requirement.
  if (isShort) scores.redondo += 5;
  if (widestZone === 'pomulos') scores.redondo += 2;
  if (jawIsSoft) scores.redondo += 4;                      // soft jaw is redondo's signature
  if (chinIsBlunt || chinAngle >= 120) scores.redondo += 1;
  if (widthsAreSimilar) scores.redondo += 1;               // bonus only

  // ── CUADRADO ─────────────────────────────────────────────────────────
  // Short + strong/angular jaw + widths close together + straight chin.
  if (isShort) scores.cuadrado += 4;
  if (jawIsAngular) scores.cuadrado += 4;                  // strong (not only razor-sharp) jaw
  if (widthsAreSimilar) scores.cuadrado += 2;
  if (jfR >= 0.90) scores.cuadrado += 2;                   // jaw nearly as wide as forehead
  if (chinAngle >= 122) scores.cuadrado += 1;              // fairly flat/straight chin
  if (widestZone !== 'pomulos') scores.cuadrado += 2;      // square rarely reads cheek-dominant

  // ── ALARGADO (oblongo) ───────────────────────────────────────────────
  // Long + the three widths similar (no taper story).
  if (isLong) scores.alargado += 5;
  if (widthsAreSimilar) scores.alargado += 3;
  if (jfR >= 0.88 && jfR <= 1.12) scores.alargado += 2;
  if (cfR >= 0.88 && cfR <= 1.12) scores.alargado += 2;

  // ── CORAZON ──────────────────────────────────────────────────────────
  // Forehead the clearly widest zone, jaw/chin narrow and tapered to a
  // pointed chin. Length-independent (heart can be short or medium).
  if (widestZone === 'frente') scores.corazon += 4;
  if (jfR <= 0.82) scores.corazon += 4;      // jaw much narrower than forehead
  if (fhTaper >= 0.16) scores.corazon += 3;  // strong forehead→jaw taper
  if (chinIsPointed) scores.corazon += 2;
  if (cfR <= 1.05) scores.corazon += 1;      // forehead not eclipsed by cheeks

  // ── DIAMANTE ─────────────────────────────────────────────────────────
  // Cheekbones clearly the widest zone, with BOTH forehead and jaw
  // narrower than the cheeks. Thresholds loosened so real diamond faces
  // fire (they were under-scoring and losing to cuadrado).
  // Diamond needs cheeks CLEARLY the widest — dramatically wider than both
  // forehead and jaw. Thresholds set high enough to separate a true diamond
  // (cheeks ~20%+ wider) from a round face with mild cheek prominence.
  if (widestZone === 'pomulos') scores.diamante += 3;
  if (cfR >= 1.18) scores.diamante += 4;     // cheeks clearly wider than forehead
  if (cjR >= 1.18) scores.diamante += 4;     // cheeks clearly wider than jaw
  if (jfR >= 0.85 && jfR <= 1.15) scores.diamante += 1; // forehead ≈ jaw (both narrow vs cheeks)
  if (jawSq < 0.78) scores.diamante += 1;    // narrow chin relative to jaw

  // ── Fold "triángulo" (pear: jaw widest) into the closest FACE_DATA
  // category — no dedicated triangle copy ships yet.
  if (widestZone === 'mandibula') {
    if (jawIsAngular) scores.cuadrado += 2;
    else if (jawIsSoft) scores.redondo += 1;
  }

  // ── Rank + confidence ────────────────────────────────────────────────
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  let [topShape, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  let confidence;
  if (topScore <= 0) {
    // Nothing fired — genuinely ambiguous geometry. Neutral fallback,
    // reported with low confidence rather than silently picking oval.
    topShape = 'ovalado';
    confidence = 30;
  } else {
    const marginRatio = (topScore - secondScore) / topScore; // 0 (tie) .. 1 (no runner-up)
    confidence = Math.round(35 + marginRatio * 60);
    confidence = Math.min(95, Math.max(35, confidence));
  }

  const secondaryInfluences = sorted
    .filter(([shape, score]) => shape !== topShape && topScore > 0 && score >= topScore * 0.7 && score > 0)
    .slice(0, 2)
    .map(([shape]) => shape);

  return {
    shape: topShape,
    confidence,
    scores,
    secondaryInfluences,
    metrics: {
      lengthWidthRatio: Number(lwr.toFixed(3)),
      jawForeheadRatio: Number(jfR.toFixed(3)),
      cheekJawRatio: Number(cjR.toFixed(3)),
      jawAngle: Number(jawAngle.toFixed(1)),
      widestZone,
    },
  };
}
