/* ═══════════════════════════════════════════════════════════════════
   Eye Shape Classification v3 — Geometric Scoring (MediaPipe Landmarks)

   Based on: "AI-Driven Makeup Suggestions Leveraging MediaPipe Face
   Landmarks For Eye Shape Detection" (Technomedia Journal, 2024)
   + "Eye-makeup Guidance System" (JAIST thesis)

   v3 FIX: v2 used a strict if/elif PRIORITY chain, which meant a face
   that was mildly hooded AND mildly upturned always resolved to
   whichever branch happened to be checked first — order bias, not
   geometry. Now every shape accumulates a SCORE from independent
   conditions (same pattern as faceShapeRules.js) and the highest
   score wins, with confidence derived from the margin to the runner-up.

   Distinguishes the 5 shapes that exist in EYE_DATA (src/data/appData.js):
     almendra   — almond, the common/balanced shape
     redondo    — round, wide open, circular
     rasgado    — upturned outer corner ("cat eye")
     caido      — downturned outer corner
     encapotado — hooded, brow presses on the lid
   ═══════════════════════════════════════════════════════════════════ */

// MediaPipe eye landmark indices
const RIGHT_EYE = {
  outline: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  innerCorner: 133,
  outerCorner: 33,
  upperLid1: 159,     // upper eyelid center (top of eye)
  upperLid2: 158,     // upper eyelid outer
  upperLid3: 160,     // upper eyelid inner
  lowerLid1: 145,     // lower eyelid center (bottom of eye)
  lowerLid2: 153,     // lower eyelid outer
  lowerLid3: 144,     // lower eyelid inner
  browCenter: 105,
  browInner: 70,
  browOuter: 46,
};

const LEFT_EYE = {
  outline: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  innerCorner: 362,
  outerCorner: 263,
  upperLid1: 386,
  upperLid2: 385,
  upperLid3: 387,
  lowerLid1: 374,
  lowerLid2: 380,
  lowerLid3: 373,
  browCenter: 334,
  browInner: 300,
  browOuter: 276,
};

const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * EAR (eye aspect ratio) — 3 vertical measurements averaged / horizontal.
 * Higher = more open/circular eye, lower = more elongated/almond eye.
 */
function calcEAR(lm, eye) {
  const v1 = dist(lm[eye.upperLid3], lm[eye.lowerLid3]);
  const v2 = dist(lm[eye.upperLid1], lm[eye.lowerLid1]);
  const v3 = dist(lm[eye.upperLid2], lm[eye.lowerLid2]);
  const h  = dist(lm[eye.innerCorner], lm[eye.outerCorner]);
  return h > 0 ? (v1 + v2 + v3) / (3 * h) : 0.25;
}

/**
 * Corner angle: inner→outer tilt in degrees.
 * Positive = outer corner higher (upturned/"rasgado"),
 * Negative = outer corner lower (downturned/"caido").
 */
function calcCornerAngle(lm, eye) {
  const inner = lm[eye.innerCorner];
  const outer = lm[eye.outerCorner];
  const dx = outer.x - inner.x;
  // MediaPipe Y goes DOWN, so inner.y - outer.y = positive when outer is higher
  const dy = inner.y - outer.y;
  return Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI);
}

/**
 * Hood score: brow-to-lid distance / eye opening height.
 * Lower = more hooded (brow sits closer to / presses on the lid).
 */
function calcHoodScore(lm, eye) {
  const browPt = lm[eye.browCenter];
  const upperLidPt = lm[eye.upperLid1];
  const lowerLidPt = lm[eye.lowerLid1];
  const eyeOpen = dist(upperLidPt, lowerLidPt);
  const browToLid = dist(browPt, upperLidPt);
  return eyeOpen > 0 ? browToLid / eyeOpen : 2;
}

/**
 * Classify eye shape — geometric SCORING (not a priority chain).
 * Each shape starts at 0 and only earns points from the specific
 * conditions that define it; almendra keeps a small baseline because
 * it is genuinely the most common eye shape worldwide, but it still
 * has to compete on score like everything else.
 */
export function classifyEyeShape(lm) {
  if (!lm || lm.length < 468) return null;

  // Average features from both eyes
  const ear = (calcEAR(lm, RIGHT_EYE) + calcEAR(lm, LEFT_EYE)) / 2;
  const cornerAngle = (calcCornerAngle(lm, RIGHT_EYE) + calcCornerAngle(lm, LEFT_EYE)) / 2;
  const hoodScore = (calcHoodScore(lm, RIGHT_EYE) + calcHoodScore(lm, LEFT_EYE)) / 2;

  // Eye spacing
  const eyeWidthR = dist(lm[RIGHT_EYE.innerCorner], lm[RIGHT_EYE.outerCorner]);
  const eyeWidthL = dist(lm[LEFT_EYE.innerCorner], lm[LEFT_EYE.outerCorner]);
  const interEye = dist(lm[RIGHT_EYE.innerCorner], lm[LEFT_EYE.innerCorner]);
  const avgEyeWidth = (eyeWidthR + eyeWidthL) / 2;
  const eyeSpacingRatio = avgEyeWidth > 0 ? interEye / avgEyeWidth : 1;

  const scores = { almendra: 0, redondo: 0, rasgado: 0, caido: 0, encapotado: 0 };

  // ── ENCAPOTADO (hooded) — brow presses close to the lid ─────────────
  if (hoodScore < 0.85) scores.encapotado += 5;
  else if (hoodScore < 1.05) scores.encapotado += 3;
  else if (hoodScore < 1.20) scores.encapotado += 1;

  // ── RASGADO (upturned / cat-eye) — outer corner clearly higher ──────
  if (cornerAngle > 10) scores.rasgado += 5;
  else if (cornerAngle > 6) scores.rasgado += 3;
  else if (cornerAngle > 3) scores.rasgado += 1;

  // ── CAIDO (downturned) — outer corner clearly lower ─────────────────
  if (cornerAngle < -8) scores.caido += 5;
  else if (cornerAngle < -4) scores.caido += 3;
  else if (cornerAngle < -2) scores.caido += 1;

  // ── REDONDO (round) — wide open, close to circular, little tilt ────
  if (ear > 0.36) scores.redondo += 5;
  else if (ear > 0.32) scores.redondo += 3;
  if (Math.abs(cornerAngle) < 5) scores.redondo += 2;
  if (hoodScore >= 1.2) scores.redondo += 1; // lid fully visible reinforces "round & open"

  // ── ALMENDRA (almond) — the balanced, most common shape ─────────────
  // Small baseline reflecting real-world prevalence, PERO tiene que
  // competir: cualquier forma con condiciones marcadas (arriba) puede
  // superarla sin problema.
  scores.almendra += 1;
  if (ear >= 0.24 && ear <= 0.33) scores.almendra += 3;       // medium opening
  if (cornerAngle >= 1 && cornerAngle <= 7) scores.almendra += 3; // slight natural uptilt
  if (hoodScore >= 1.15) scores.almendra += 2;                // lid visible, not hooded

  // ── Rank + confidence ────────────────────────────────────────────────
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [shape, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;
  const marginRatio = topScore > 0 ? (topScore - secondScore) / topScore : 0;
  const confidence = Math.min(90, Math.max(40, Math.round(40 + marginRatio * 50)));

  return {
    shape,
    confidence,
    scores,
    allScores: scores, // kept for backward compatibility
    features: {
      ear: ear.toFixed(3),
      cornerAngle: cornerAngle.toFixed(1),
      hoodScore: hoodScore.toFixed(2),
      eyeSpacing: eyeSpacingRatio.toFixed(2),
    },
    spacing: eyeSpacingRatio < 0.85 ? 'juntos' : eyeSpacingRatio > 1.15 ? 'separados' : 'proporcional',
  };
}

export const EYE_LANDMARKS = {
  RIGHT_EYE,
  LEFT_EYE,
  LEFT_IRIS,
  RIGHT_IRIS,
};
