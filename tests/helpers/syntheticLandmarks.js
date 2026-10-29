// ─── Synthetic landmark generator for face/eye classifier tests ─────────────
//
// Builds a 478-point MediaPipe-shaped landmark array ({x,y,z} normalized
// 0..1 coordinates). Every point defaults to the dead-center dummy
// {x:0.5, y:0.5} so it can never accidentally win a "widest point at this
// y-level" search inside faceClassifier's dynamic width fallback — only the
// specific named indices we set on purpose (symmetric around x=0.5) carry
// real signal. This does not need to be anatomically perfect, only
// consistent enough that the resulting ratios land where the geometric
// rules in faceShapeRules.js / eyeClassifier.js expect them.

const TOTAL_LANDMARKS = 478;

function blankLandmarks() {
  return new Array(TOTAL_LANDMARKS).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0 }));
}

/**
 * Builds a synthetic 478-point landmark array for a given face geometry.
 * @param {object} p
 * @param {number} p.fW - forehead width (fraction of normalized width)
 * @param {number} p.cW - cheekbone width
 * @param {number} p.jW - jawline width
 * @param {number} p.chinW - chin width
 * @param {number} p.hairY - y of hairline (top of face)
 * @param {number} p.foreheadY - y of forehead landmarks
 * @param {number} p.cheekY - y of cheekbone landmarks
 * @param {number} p.jawY - y of jawline landmarks
 * @param {number} p.chinY - y of chin (bottom of face)
 * @param {number} [p.jawLeftBend=0] - shifts jawLeft/jawRight inward(+)/outward(-)
 *   from the straight fW/cW/jW column, which perturbs the cheek→jaw→chin
 *   angle used to detect a "soft" vs "angular" jawline.
 */
export function makeFaceLandmarks({
  fW, cW, jW, chinW,
  hairY, foreheadY, cheekY, jawY, chinY,
  jawLeftBend = 0,
}) {
  const lm = blankLandmarks();
  const set = (idx, x, y) => { lm[idx] = { x, y, z: 0 }; };

  set(10, 0.5, hairY); // hairline
  set(54, 0.5 - fW / 2, foreheadY); // foreheadLeft
  set(284, 0.5 + fW / 2, foreheadY); // foreheadRight
  set(234, 0.5 - cW / 2, cheekY); // cheekLeft
  set(454, 0.5 + cW / 2, cheekY); // cheekRight
  set(172, 0.5 - jW / 2 + jawLeftBend, jawY); // jawLeft
  set(397, 0.5 + jW / 2 - jawLeftBend, jawY); // jawRight
  set(152, 0.5, chinY); // chin
  set(1, 0.5, cheekY + 0.05); // noseTip (not read by the classifier rules)
  set(168, 0.5, foreheadY + 0.05); // nasion (not read by the classifier rules)
  set(17, 0.5, chinY - 0.03); // lipBottom (not read by the classifier rules)
  set(150, 0.5 - chinW / 2, (jawY + chinY) / 2); // chinLeft
  set(379, 0.5 + chinW / 2, (jawY + chinY) / 2); // chinRight
  set(136, 0.5 - (cW + jW) / 4, (cheekY + jawY) / 2); // jawMidLeft (curvature only, unused by rules)
  set(365, 0.5 + (cW + jW) / 4, (cheekY + jawY) / 2); // jawMidRight (curvature only, unused by rules)

  return lm;
}

// Tuned so each shape wins its intended classification in faceShapeRules.js
// AND lands on a realistic length/width ratio (lwr = faceHeight / widest
// zone) for that shape — not just whatever ratio happened to satisfy the
// old (buggy) scoring. Verified against the real classifier + reference
// lwr bands from src/data/knowledge/visagism.json's rule of thumb ("largo
// ≈ ancho → redonda/cuadrada; largo ≈ 1.5× ancho → oval/alargada"):
//   redondo  lwr ≈ 1.05–1.25 (short, soft jaw, cheeks mildly widest)
//   cuadrado lwr ≈ 1.10–1.30 (short, angular jaw, widths near-equal)
//   corazon  lwr ≈ 1.30–1.50 (forehead widest, narrow pointed chin)
//   diamante lwr ≈ 1.35–1.55 (cheeks dramatically widest, cfR/cjR ≥ ~1.2)
//   ovalado  lwr ≈ 1.42–1.60 (balanced, cheeks mildly widest, soft jaw)
//   alargado lwr ≈ 1.60–1.90 (long, widths near-equal)
export const FACE_SHAPE_PARAMS = {
  redondo: { fW: 0.42, cW: 0.44, jW: 0.40, chinW: 0.32, hairY: 0.200, foreheadY: 0.327, cheekY: 0.428, jawY: 0.580, chinY: 0.706, jawLeftBend: 0 },
  cuadrado: { fW: 0.44, cW: 0.44, jW: 0.43, chinW: 0.40, hairY: 0.180, foreheadY: 0.323, cheekY: 0.437, jawY: 0.608, chinY: 0.750, jawLeftBend: -0.02 },
  alargado: { fW: 0.34, cW: 0.35, jW: 0.33, chinW: 0.26, hairY: 0.050, foreheadY: 0.213, cheekY: 0.343, jawY: 0.538, chinY: 0.700, jawLeftBend: 0 },
  corazon: { fW: 0.46, cW: 0.42, jW: 0.28, chinW: 0.12, hairY: 0.150, foreheadY: 0.313, cheekY: 0.443, jawY: 0.638, chinY: 0.800, jawLeftBend: 0 },
  diamante: { fW: 0.34, cW: 0.46, jW: 0.34, chinW: 0.14, hairY: 0.100, foreheadY: 0.263, cheekY: 0.393, jawY: 0.588, chinY: 0.750, jawLeftBend: 0 },
  ovalado: { fW: 0.38, cW: 0.40, jW: 0.34, chinW: 0.22, hairY: 0.100, foreheadY: 0.245, cheekY: 0.361, jawY: 0.535, chinY: 0.680, jawLeftBend: -0.01 },
};

/**
 * Builds a synthetic 478-point landmark array with a single pair of eyes
 * (RIGHT_EYE + LEFT_EYE indices from eyeClassifier.js) shaped to hit a
 * target EAR / corner-angle / hood-score combination.
 * @param {object} p
 * @param {number} p.eyeWidth - inner→outer corner distance
 * @param {number} p.eyeOpen - upper↔lower lid distance (controls EAR)
 * @param {number} p.tiltOffset - >0 upturned outer corner (rasgado), <0 downturned (caido)
 * @param {number} p.hoodGap - brow→upper-lid distance (small = hooded)
 */
export function makeEyeLandmarks({ eyeWidth, eyeOpen, tiltOffset, hoodGap }) {
  const lm = blankLandmarks();
  const set = (idx, x, y) => { lm[idx] = { x, y, z: 0 }; };

  function buildEye(baseX, cfg) {
    const { innerCorner, outerCorner, upperLid1, upperLid2, upperLid3, lowerLid1, lowerLid2, lowerLid3, browCenter } = cfg;
    const midY = 0.5;
    set(innerCorner, baseX, midY);
    set(outerCorner, baseX - eyeWidth, midY - tiltOffset);
    set(upperLid3, baseX - eyeWidth * 0.25, midY - eyeOpen / 2);
    set(lowerLid3, baseX - eyeWidth * 0.25, midY + eyeOpen / 2);
    set(upperLid1, baseX - eyeWidth * 0.5, midY - eyeOpen / 2);
    set(lowerLid1, baseX - eyeWidth * 0.5, midY + eyeOpen / 2);
    set(upperLid2, baseX - eyeWidth * 0.75, midY - eyeOpen / 2);
    set(lowerLid2, baseX - eyeWidth * 0.75, midY + eyeOpen / 2);
    set(browCenter, baseX - eyeWidth * 0.5, midY - eyeOpen / 2 - hoodGap);
  }

  const RIGHT = { innerCorner: 133, outerCorner: 33, upperLid1: 159, upperLid2: 158, upperLid3: 160, lowerLid1: 145, lowerLid2: 153, lowerLid3: 144, browCenter: 105 };
  const LEFT = { innerCorner: 362, outerCorner: 263, upperLid1: 386, upperLid2: 385, upperLid3: 387, lowerLid1: 374, lowerLid2: 380, lowerLid3: 373, browCenter: 334 };

  buildEye(0.5, RIGHT);
  buildEye(1.5, LEFT); // separate x-space; each eye's metrics are computed independently then averaged

  return lm;
}

// Tuned so each shape wins its intended classification in eyeClassifier.js.
export const EYE_SHAPE_PARAMS = {
  almendra: { eyeWidth: 0.12, eyeOpen: 0.032, tiltOffset: 0.012, hoodGap: 0.04 },
  redondo: { eyeWidth: 0.12, eyeOpen: 0.05, tiltOffset: 0.002, hoodGap: 0.06 },
  rasgado: { eyeWidth: 0.12, eyeOpen: 0.035, tiltOffset: 0.03, hoodGap: 0.04 },
  caido: { eyeWidth: 0.12, eyeOpen: 0.035, tiltOffset: -0.03, hoodGap: 0.04 },
  encapotado: { eyeWidth: 0.12, eyeOpen: 0.035, tiltOffset: 0, hoodGap: 0.02 },
};
