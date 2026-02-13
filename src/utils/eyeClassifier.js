/* ═══════════════════════════════════════════════════════════════════
   Eye Shape Classification — MediaPipe Landmarks
   
   Based on: "AI-Driven Makeup Suggestions Leveraging MediaPipe Face
   Landmarks For Eye Shape Detection" (Technomedia Journal, 2024)
   
   Features used:
   1. EAR (Eye Aspect Ratio) — height/width ratio of eye opening
   2. Eye Corner Angle — tilt of outer corner (up/down/straight)
   3. Iris Visibility — how much white shows around iris
   4. Eye Openness — crease visibility (hooded detection)
   
   Classifications: almendra, redondo, rasgado, caido, encapotado
   ═══════════════════════════════════════════════════════════════════ */

// MediaPipe eye landmark indices
const RIGHT_EYE = {
  // Outline points (upper + lower lid)
  outline: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  // Key 6 points for EAR (like the academic paper)
  innerCorner: 133,    // p1 — inner canthus
  outerCorner: 33,     // p4 — outer canthus
  upperLid1: 159,      // p2 — upper eyelid center
  upperLid2: 158,      // p3 — upper eyelid outer
  lowerLid1: 145,      // p5 — lower eyelid center
  lowerLid2: 153,      // p6 — lower eyelid outer
  // Brow point (for hooded detection)
  browCenter: 105,
};

const LEFT_EYE = {
  outline: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  innerCorner: 362,
  outerCorner: 263,
  upperLid1: 386,
  upperLid2: 385,
  lowerLid1: 374,
  lowerLid2: 380,
  browCenter: 334,
};

// Iris landmarks (indices 468-477, need refine_landmarks=true)
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];

function d(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Calculate Eye Aspect Ratio (EAR)
 * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
 * Higher EAR = more open/round eye
 * Lower EAR = narrower/more almond eye
 */
function calcEAR(lm, eye) {
  const A = d(lm[eye.upperLid1], lm[eye.lowerLid1]); // vertical 1
  const B = d(lm[eye.upperLid2], lm[eye.lowerLid2]); // vertical 2
  const C = d(lm[eye.innerCorner], lm[eye.outerCorner]); // horizontal
  return C > 0 ? (A + B) / (2 * C) : 0.25;
}

/**
 * Calculate outer corner angle (tilt)
 * Positive = upturned, Negative = downturned, ~0 = straight
 */
function calcCornerAngle(lm, eye) {
  const inner = lm[eye.innerCorner];
  const outer = lm[eye.outerCorner];
  const dx = outer.x - inner.x;
  const dy = outer.y - inner.y;
  // Angle in degrees — negative dy means outer corner is higher (upturned)
  return Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
}

/**
 * Detect hooded eyes by measuring lid-to-brow distance
 * If brow is very close to upper lid, the eye is hooded
 */
function calcHoodedScore(lm, eye) {
  const browPt = lm[eye.browCenter];
  const upperLidPt = lm[eye.upperLid1];
  const eyeHeight = d(lm[eye.upperLid1], lm[eye.lowerLid1]);
  const browToLid = d(browPt, upperLidPt);
  // Ratio of brow-to-lid distance vs eye height
  // Lower ratio = more hooded
  return eyeHeight > 0 ? browToLid / eyeHeight : 2;
}

/**
 * Classify eye shape from MediaPipe landmarks
 * @param {Array} lm - 478 MediaPipe landmarks
 * @returns {Object} { shape, shapeName, features, confidence }
 */
export function classifyEyeShape(lm) {
  if (!lm || lm.length < 468) return null;

  // Calculate features for both eyes
  const earR = calcEAR(lm, RIGHT_EYE);
  const earL = calcEAR(lm, LEFT_EYE);
  const ear = (earR + earL) / 2;

  const angleR = calcCornerAngle(lm, RIGHT_EYE);
  const angleL = calcCornerAngle(lm, LEFT_EYE);
  const cornerAngle = (angleR + angleL) / 2;

  const hoodR = calcHoodedScore(lm, RIGHT_EYE);
  const hoodL = calcHoodedScore(lm, LEFT_EYE);
  const hoodScore = (hoodR + hoodL) / 2;

  // Eye width ratio (width / face width approximation)
  const eyeWidthR = d(lm[RIGHT_EYE.innerCorner], lm[RIGHT_EYE.outerCorner]);
  const eyeWidthL = d(lm[LEFT_EYE.innerCorner], lm[LEFT_EYE.outerCorner]);
  
  // Distance between eyes (for close-set / wide-set)
  const interEye = d(lm[RIGHT_EYE.innerCorner], lm[LEFT_EYE.innerCorner]);
  const avgEyeWidth = (eyeWidthR + eyeWidthL) / 2;
  const eyeSpacingRatio = avgEyeWidth > 0 ? interEye / avgEyeWidth : 1;

  // === Classification scoring ===
  const scores = {
    almendra: 0,    // Almond — balanced, slightly tapered
    redondo: 0,     // Round — high EAR, open
    rasgado: 0,     // Upturned — high corner angle
    caido: 0,       // Downturned — low corner angle
    encapotado: 0,  // Hooded — low hood score
  };

  // ALMOND: moderate EAR (0.22-0.32), slight upward tilt, visible crease
  if (ear >= 0.20 && ear <= 0.32) scores.almendra += 3;
  if (cornerAngle >= -3 && cornerAngle <= 8) scores.almendra += 2;
  if (hoodScore >= 1.2) scores.almendra += 2;

  // ROUND: high EAR (>0.30), more circular opening
  if (ear > 0.30) scores.redondo += 4;
  if (ear > 0.35) scores.redondo += 2;
  if (cornerAngle >= -4 && cornerAngle <= 4) scores.redondo += 2;
  if (hoodScore >= 1.3) scores.redondo += 1;

  // UPTURNED (rasgado): high positive corner angle
  if (cornerAngle > 6) scores.rasgado += 4;
  if (cornerAngle > 10) scores.rasgado += 2;
  if (ear >= 0.20 && ear <= 0.32) scores.rasgado += 2;

  // DOWNTURNED (caído): negative corner angle
  if (cornerAngle < -3) scores.caido += 4;
  if (cornerAngle < -6) scores.caido += 2;
  if (ear >= 0.20 && ear <= 0.30) scores.caido += 2;

  // HOODED (encapotado): low brow-to-lid ratio
  if (hoodScore < 1.1) scores.encapotado += 4;
  if (hoodScore < 0.9) scores.encapotado += 2;
  if (ear < 0.26) scores.encapotado += 2;

  // Find winner
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [shape, topScore] = sorted[0];
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
  const confidence = Math.min(Math.round((topScore / total) * 100), 90);

  return {
    shape,
    confidence,
    allScores: Object.fromEntries(sorted),
    features: {
      ear: ear.toFixed(3),
      cornerAngle: cornerAngle.toFixed(1),
      hoodScore: hoodScore.toFixed(2),
      eyeSpacing: eyeSpacingRatio.toFixed(2),
    },
    // Spacing classification (secondary trait)
    spacing: eyeSpacingRatio < 0.85 ? 'juntos' : eyeSpacingRatio > 1.15 ? 'separados' : 'proporcional',
  };
}

// Export landmark indices for overlay drawing
export const EYE_LANDMARKS = {
  RIGHT_EYE,
  LEFT_EYE,
  LEFT_IRIS,
  RIGHT_IRIS,
};
