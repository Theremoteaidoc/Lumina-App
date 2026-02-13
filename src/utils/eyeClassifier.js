/* ═══════════════════════════════════════════════════════════════════
   Eye Shape Classification v2 — MediaPipe Landmarks
   
   Based on: "AI-Driven Makeup Suggestions Leveraging MediaPipe Face
   Landmarks For Eye Shape Detection" (Technomedia Journal, 2024)
   + "Eye-makeup Guidance System" (JAIST thesis)
   
   v2 FIX: Almond was always winning because its scoring ranges
   overlapped with every other shape. Now uses PRIORITY-BASED
   exclusive classification — checks distinctive shapes first,
   almendra is the fallback for "normal" eyes.
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
 * EAR — 3 vertical measurements averaged / horizontal
 */
function calcEAR(lm, eye) {
  const v1 = dist(lm[eye.upperLid3], lm[eye.lowerLid3]);
  const v2 = dist(lm[eye.upperLid1], lm[eye.lowerLid1]);
  const v3 = dist(lm[eye.upperLid2], lm[eye.lowerLid2]);
  const h  = dist(lm[eye.innerCorner], lm[eye.outerCorner]);
  return h > 0 ? (v1 + v2 + v3) / (3 * h) : 0.25;
}

/**
 * Corner angle: inner→outer tilt in degrees
 * Positive = upturned, Negative = downturned
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
 * Hood score: brow-to-lid distance / eye opening height
 * Lower = more hooded
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
 * Classify eye shape — PRIORITY-BASED exclusive logic
 * Checks most distinctive shapes first, almendra is fallback
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

  // ═══ PRIORITY CLASSIFICATION ═══
  // Most eyes are almendra (almond) — this is the natural default.
  // Other shapes require STRONG, distinctive features to override.
  // Thresholds are intentionally high to avoid false classifications.
  let shape = 'almendra';
  let confidence = 50;

  // 1️⃣ ENCAPOTADO (hooded) — brow presses on lid
  if (hoodScore < 0.9) {
    shape = 'encapotado';
    confidence = 80;
  } else if (hoodScore < 1.15 && ear < 0.24) {
    shape = 'encapotado';
    confidence = 60;
  }

  // 2️⃣ RASGADO (upturned) — VERY noticeable upward tilt
  // Normal almond eyes often have 2-7° uptilt — that's NOT rasgado
  // Rasgado needs 10°+ to be visually obvious
  else if (cornerAngle > 12) {
    shape = 'rasgado';
    confidence = Math.min(60 + Math.round(cornerAngle), 85);
  } else if (cornerAngle > 9 && ear < 0.28) {
    shape = 'rasgado';
    confidence = 55;
  }

  // 3️⃣ CAÍDO (downturned) — strong negative angle
  else if (cornerAngle < -6) {
    shape = 'caido';
    confidence = Math.min(55 + Math.round(Math.abs(cornerAngle) * 2), 85);
  } else if (cornerAngle < -4 && ear >= 0.24) {
    shape = 'caido';
    confidence = 50;
  }

  // 4️⃣ REDONDO (round) — clearly open, circular eyes
  else if (ear > 0.34 && Math.abs(cornerAngle) < 6) {
    shape = 'redondo';
    confidence = Math.min(55 + Math.round((ear - 0.30) * 200), 85);
  } else if (ear > 0.38) {
    shape = 'redondo';
    confidence = 70;
  }

  // 5️⃣ ALMENDRA (almond) — the natural default
  // Most people have almond eyes. This is not a "leftover" category,
  // it's the most common shape worldwide.
  else {
    shape = 'almendra';
    const earOk = ear >= 0.20 && ear <= 0.34;
    const angleOk = Math.abs(cornerAngle) <= 9;
    const hoodOk = hoodScore >= 1.15;
    confidence = 45 + [earOk, angleOk, hoodOk].filter(Boolean).length * 14;
  }

  return {
    shape,
    confidence,
    allScores: { [shape]: confidence },
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
