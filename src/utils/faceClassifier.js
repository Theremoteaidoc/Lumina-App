/* ═══════════════════════════════════════════════════════════
   Face Shape Classification Algorithm
   
   Sources:
   - Faciometrics: Orofacial Harmonization (2020) — WHR ratios
   - CalState 3D-Guided Face Shape Classification thesis
   - Philip Hallawell Visagismo method
   ═══════════════════════════════════════════════════════════ */

// MediaPipe 478-point Face Mesh landmark indices
export const LANDMARKS = {
  foreheadLeft: 54,
  foreheadRight: 284,
  cheekLeft: 234,
  cheekRight: 454,
  jawLeft: 172,
  jawRight: 397,
  hairline: 10,
  chin: 152,
  noseTip: 1,
  faceOval: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 152, 148, 176, 149, 150, 136, 172,
    58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
  ],
};

export function euclidean(a, b, w, h) {
  return Math.sqrt(
    Math.pow((a.x - b.x) * w, 2) + Math.pow((a.y - b.y) * h, 2)
  );
}

export function getMeasurements(landmarks, videoW, videoH) {
  return {
    faceLength: euclidean(landmarks[LANDMARKS.hairline], landmarks[LANDMARKS.chin], videoW, videoH),
    foreheadWidth: euclidean(landmarks[LANDMARKS.foreheadLeft], landmarks[LANDMARKS.foreheadRight], videoW, videoH),
    cheekboneWidth: euclidean(landmarks[LANDMARKS.cheekLeft], landmarks[LANDMARKS.cheekRight], videoW, videoH),
    jawlineWidth: euclidean(landmarks[LANDMARKS.jawLeft], landmarks[LANDMARKS.jawRight], videoW, videoH),
  };
}

export function classifyFaceShape(m) {
  const { faceLength, foreheadWidth, cheekboneWidth, jawlineWidth } = m;
  const widest = Math.max(foreheadWidth, cheekboneWidth, jawlineWidth);
  const whr = cheekboneWidth / faceLength;
  const jfr = jawlineWidth / foreheadWidth;

  const scores = { ovalado: 0, redondo: 0, cuadrado: 0, corazon: 0, alargado: 0, diamante: 0 };

  // OVAL
  if (whr >= 0.62 && whr <= 0.78) scores.ovalado += 2;
  if (cheekboneWidth >= foreheadWidth * 0.98 && cheekboneWidth >= jawlineWidth) scores.ovalado += 2;
  if (jawlineWidth < foreheadWidth && jawlineWidth > foreheadWidth * 0.72) scores.ovalado += 1;
  if (jfr >= 0.75 && jfr <= 0.95) scores.ovalado += 1;

  // ROUND
  if (whr >= 0.82) scores.redondo += 3;
  const allSimilar =
    Math.abs(foreheadWidth - cheekboneWidth) / widest < 0.1 &&
    Math.abs(cheekboneWidth - jawlineWidth) / widest < 0.12;
  if (allSimilar) scores.redondo += 2;
  if (jfr >= 0.9 && jfr <= 1.05) scores.redondo += 1;

  // SQUARE
  if (whr >= 0.78 && whr <= 0.95) scores.cuadrado += 1;
  if (jfr >= 0.88) scores.cuadrado += 2;
  if (allSimilar) scores.cuadrado += 1;
  if (jawlineWidth / cheekboneWidth > 0.88) scores.cuadrado += 2;

  // HEART
  if (foreheadWidth >= cheekboneWidth * 0.95) scores.corazon += 2;
  if (jawlineWidth < foreheadWidth * 0.78) scores.corazon += 3;
  if (whr >= 0.65 && whr <= 0.82) scores.corazon += 1;

  // OBLONG
  if (whr < 0.65) scores.alargado += 3;
  if (whr < 0.60) scores.alargado += 2;
  if (Math.abs(foreheadWidth - jawlineWidth) / widest < 0.15) scores.alargado += 1;

  // DIAMOND
  if (cheekboneWidth > foreheadWidth * 1.1 && cheekboneWidth > jawlineWidth * 1.1) scores.diamante += 3;
  if (foreheadWidth < cheekboneWidth * 0.85) scores.diamante += 2;
  if (jawlineWidth < cheekboneWidth * 0.85) scores.diamante += 1;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [shape, score] = sorted[0];
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = total > 0 ? Math.min(Math.round((score / total) * 100), 96) : 0;

  return {
    shape,
    confidence,
    whr: whr.toFixed(3),
    jfr: jfr.toFixed(3),
    cjr: (cheekboneWidth / jawlineWidth).toFixed(3),
    allScores: Object.fromEntries(sorted),
  };
}
