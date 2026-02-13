/* ═══════════════════════════════════════════════════════════════════
   Face Shape Classification v2.0 — Research-Based Geometric Classifier
   
   Based on:
   1. CalState 3D-Guided Face Shape Classification (Random Forest on landmarks)
   2. Adonis Tio — Inception v3 Face Shape Classifier (19 geometric features)  
   3. GraphicsInterface 2016 — Ellipse-fitting geometric features
   4. Faciometrics: Orofacial Harmonization (2020) — Anthropometric ratios
   5. Kaggle Face Shape Dataset (Niten Lama) — 5000 labeled images

   Key improvement over v1: Uses 19 features instead of 4, includes chin 
   geometry, jawline angles, contour curvature, and normalized proportions.
   ═══════════════════════════════════════════════════════════════════ */

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
  browLeft: 70,
  browRight: 300,
  nasion: 168,
  jawMidLeft: 136,
  jawMidRight: 365,
  chinLeft: 150,
  chinRight: 379,
  chinTip: 199,
  lipBottom: 17,
  faceOval: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 152, 148, 176, 149, 150, 136, 172,
    58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
  ],
};

// ─── Utility ─────────────────────────────────────────────────────

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function euclidean(a, b, w, h) {
  return Math.sqrt(((a.x - b.x) * w) ** 2 + ((a.y - b.y) * h) ** 2);
}

function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  return Math.atan2(Math.abs(cross), dot) * (180 / Math.PI);
}

function angleToChinVertical(lm, chin) {
  const dx = lm.x - chin.x;
  const dy = chin.y - lm.y;
  return Math.atan2(Math.abs(dx), dy) * (180 / Math.PI);
}

function ptLineDist(p, a, b) {
  const A = p.x - a.x, B = p.y - a.y;
  const C = b.x - a.x, D = b.y - a.y;
  const lenSq = C * C + D * D;
  if (lenSq === 0) return dist(p, a);
  const t = (A * C + B * D) / lenSq;
  return dist(p, { x: a.x + t * C, y: a.y + t * D });
}

// ─── 19-Feature Extraction ───────────────────────────────────────

export function extractFeatures(lm) {
  const L = LANDMARKS;
  const faceHeight = dist(lm[L.hairline], lm[L.chin]);
  if (faceHeight < 0.01) return null;

  const foreheadW = dist(lm[L.foreheadLeft], lm[L.foreheadRight]);
  const cheekW = dist(lm[L.cheekLeft], lm[L.cheekRight]);
  const jawW = dist(lm[L.jawLeft], lm[L.jawRight]);
  const chinW = dist(lm[L.chinLeft], lm[L.chinRight]);

  const upperFace = dist(lm[L.hairline], lm[L.nasion]);
  const midFace = dist(lm[L.nasion], lm[L.noseTip]);
  const lowerFace = dist(lm[L.noseTip], lm[L.chin]);
  const chinLen = dist(lm[L.lipBottom], lm[L.chin]);

  const maxW = Math.max(foreheadW, cheekW, jawW);
  const minW = Math.min(foreheadW, cheekW, jawW);

  const jawAngL = angle(lm[L.cheekLeft], lm[L.jawLeft], lm[L.chin]);
  const jawAngR = angle(lm[L.cheekRight], lm[L.jawRight], lm[L.chin]);
  const chinAng = angle(lm[L.jawLeft], lm[L.chin], lm[L.jawRight]);

  const jCurveL = ptLineDist(lm[L.jawMidLeft], lm[L.cheekLeft], lm[L.chin]);
  const jCurveR = ptLineDist(lm[L.jawMidRight], lm[L.cheekRight], lm[L.chin]);

  return {
    f1_whr: cheekW / faceHeight,
    f2_fwR: foreheadW / faceHeight,
    f3_jwR: jawW / faceHeight,
    f4_jfR: jawW / foreheadW,
    f5_cjR: cheekW / jawW,
    f6_cfR: cheekW / foreheadW,
    f7_upper: upperFace / faceHeight,
    f8_lower: lowerFace / faceHeight,
    f9_chin: chinLen / faceHeight,
    f10_cheekTaper: (cheekW - jawW) / cheekW,
    f11_fhTaper: (foreheadW - jawW) / foreheadW,
    f12_chinTaper: (jawW - chinW) / jawW,
    f13_jawAng: (jawAngL + jawAngR) / 2,
    f14_chinAng: chinAng,
    f15_jawSq: chinW / jawW,
    f16_jawCurve: (jCurveL + jCurveR) / (2 * faceHeight),
    f17_wVar: (maxW - minW) / maxW,
    f18_fhAng: (angleToChinVertical(lm[L.foreheadLeft], lm[L.chin]) + angleToChinVertical(lm[L.foreheadRight], lm[L.chin])) / 2,
    f19_ckAng: (angleToChinVertical(lm[L.cheekLeft], lm[L.chin]) + angleToChinVertical(lm[L.cheekRight], lm[L.chin])) / 2,
    _raw: { faceHeight, foreheadWidth: foreheadW, cheekboneWidth: cheekW, jawlineWidth: jawW, chinWidth: chinW },
  };
}

// ─── Backward-compat for overlay drawing ─────────────────────────

export function getMeasurements(landmarks, videoW, videoH) {
  return {
    faceLength: euclidean(landmarks[LANDMARKS.hairline], landmarks[LANDMARKS.chin], videoW, videoH),
    foreheadWidth: euclidean(landmarks[LANDMARKS.foreheadLeft], landmarks[LANDMARKS.foreheadRight], videoW, videoH),
    cheekboneWidth: euclidean(landmarks[LANDMARKS.cheekLeft], landmarks[LANDMARKS.cheekRight], videoW, videoH),
    jawlineWidth: euclidean(landmarks[LANDMARKS.jawLeft], landmarks[LANDMARKS.jawRight], videoW, videoH),
  };
}

// ═══════════════════════════════════════════════════════════════════
// CLASSIFIER v2: Weighted Multi-Rule Decision Ensemble
// ═══════════════════════════════════════════════════════════════════

export function classifyFaceShape(input) {
  let f;
  if (input.f1_whr !== undefined) {
    f = input;
  } else {
    // Backward compat from raw measurements
    const { faceLength: fh, foreheadWidth: fw, cheekboneWidth: cw, jawlineWidth: jw } = input;
    const h = fh || 1;
    f = {
      f1_whr: cw / h, f2_fwR: fw / h, f3_jwR: jw / h,
      f4_jfR: jw / fw, f5_cjR: cw / jw, f6_cfR: cw / fw,
      f7_upper: 0.33, f8_lower: 0.33, f9_chin: 0.15,
      f10_cheekTaper: (cw - jw) / cw,
      f11_fhTaper: (fw - jw) / fw,
      f12_chinTaper: 0.3,
      f13_jawAng: 125, f14_chinAng: 120, f15_jawSq: 0.5,
      f16_jawCurve: 0.02, f17_wVar: 0.15,
      f18_fhAng: 25, f19_ckAng: 30,
    };
  }

  const s = { ovalado: 0, redondo: 0, cuadrado: 0, corazon: 0, alargado: 0, diamante: 0 };

  // ═══ OVAL ═══
  if (f.f1_whr >= 0.64 && f.f1_whr <= 0.80) s.ovalado += 3;
  else if (f.f1_whr >= 0.60 && f.f1_whr <= 0.84) s.ovalado += 1;
  if (f.f6_cfR >= 0.98 && f.f5_cjR >= 1.05) s.ovalado += 2;
  if (f.f10_cheekTaper >= 0.08 && f.f10_cheekTaper <= 0.25) s.ovalado += 3;
  if (f.f4_jfR >= 0.72 && f.f4_jfR <= 0.92) s.ovalado += 2;
  if (f.f14_chinAng >= 100 && f.f14_chinAng <= 140) s.ovalado += 2;
  if (f.f8_lower >= 0.30 && f.f8_lower <= 0.38) s.ovalado += 1;

  // ═══ ROUND ═══
  if (f.f1_whr >= 0.82) s.redondo += 4;
  else if (f.f1_whr >= 0.78) s.redondo += 2;
  if (f.f17_wVar < 0.10) s.redondo += 3;
  else if (f.f17_wVar < 0.14) s.redondo += 1;
  if (f.f4_jfR >= 0.88 && f.f4_jfR <= 1.08) s.redondo += 2;
  if (f.f13_jawAng >= 130) s.redondo += 2;
  if (f.f14_chinAng >= 135) s.redondo += 2;
  if (f.f10_cheekTaper < 0.10) s.redondo += 2;
  if (f.f9_chin < 0.14) s.redondo += 1;

  // ═══ SQUARE ═══
  if (f.f1_whr >= 0.76 && f.f1_whr <= 0.96) s.cuadrado += 2;
  if (f.f13_jawAng < 120) s.cuadrado += 4;
  else if (f.f13_jawAng < 130) s.cuadrado += 2;
  if (f.f5_cjR < 1.12) s.cuadrado += 3;
  else if (f.f5_cjR < 1.18) s.cuadrado += 1;
  if (f.f17_wVar < 0.12 && f.f13_jawAng < 128) s.cuadrado += 2;
  if (f.f4_jfR >= 0.86) s.cuadrado += 2;
  if (f.f15_jawSq >= 0.55) s.cuadrado += 2;
  if (f.f14_chinAng >= 120 && f.f14_chinAng < 145) s.cuadrado += 1;

  // ═══ HEART ═══
  if (f.f6_cfR <= 1.03) s.corazon += 3;
  if (f.f11_fhTaper >= 0.22) s.corazon += 4;
  else if (f.f11_fhTaper >= 0.16) s.corazon += 2;
  if (f.f4_jfR < 0.76) s.corazon += 3;
  else if (f.f4_jfR < 0.82) s.corazon += 1;
  if (f.f14_chinAng < 105) s.corazon += 3;
  else if (f.f14_chinAng < 115) s.corazon += 1;
  if (f.f12_chinTaper >= 0.35) s.corazon += 2;
  if (f.f1_whr >= 0.62 && f.f1_whr <= 0.82) s.corazon += 1;

  // ═══ OBLONG ═══
  if (f.f1_whr < 0.62) s.alargado += 5;
  else if (f.f1_whr < 0.66) s.alargado += 3;
  else if (f.f1_whr < 0.70) s.alargado += 1;
  if (f.f17_wVar < 0.15) s.alargado += 2;
  if (f.f8_lower > 0.37) s.alargado += 2;
  if (f.f18_fhAng < 22) s.alargado += 2;
  if (f.f4_jfR >= 0.78 && f.f4_jfR <= 1.0) s.alargado += 1;

  // ═══ DIAMOND ═══
  if (f.f6_cfR >= 1.12) s.diamante += 4;
  else if (f.f6_cfR >= 1.06) s.diamante += 2;
  if (f.f5_cjR >= 1.15) s.diamante += 3;
  else if (f.f5_cjR >= 1.08) s.diamante += 1;
  if (f.f6_cfR >= 1.08 && f.f5_cjR >= 1.10) s.diamante += 3;
  if (f.f17_wVar >= 0.18) s.diamante += 2;
  if (f.f19_ckAng > 32) s.diamante += 2;
  if (f.f14_chinAng < 115) s.diamante += 1;

  // ── Disambiguation for confused pairs ──
  if (s.redondo > 4 && s.cuadrado > 4) {
    if (f.f13_jawAng >= 128) s.redondo += 3; else s.cuadrado += 3;
  }
  if (s.ovalado > 4 && s.redondo > 4) {
    if (f.f10_cheekTaper >= 0.10) s.ovalado += 2; else s.redondo += 2;
  }
  if (s.ovalado > 4 && s.corazon > 4) {
    if (f.f6_cfR < 1.0 && f.f11_fhTaper > 0.20) s.corazon += 2; else s.ovalado += 2;
  }
  if (s.diamante > 4 && s.corazon > 4) {
    if (f.f6_cfR >= 1.08) s.diamante += 2; else s.corazon += 2;
  }
  if (s.alargado > 3 && s.ovalado > 3) {
    if (f.f1_whr < 0.64) s.alargado += 3; else s.ovalado += 3;
  }

  // ── Result ──
  const sorted = Object.entries(s).sort((a, b) => b[1] - a[1]);
  const [shape, topScore] = sorted[0];
  const [, secondScore] = sorted[1];
  const total = Object.values(s).reduce((a, b) => a + b, 0);
  const rawConf = total > 0 ? (topScore / total) * 100 : 0;
  const margin = Math.min((topScore - secondScore) * 2, 15);
  const confidence = Math.min(Math.round(rawConf + margin), 95);

  return {
    shape, confidence,
    whr: f.f1_whr.toFixed(3),
    jfr: f.f4_jfR.toFixed(3),
    cjr: f.f5_cjR.toFixed(3),
    allScores: Object.fromEntries(sorted),
    features: {
      whr: f.f1_whr, cheekTaper: f.f10_cheekTaper,
      foreheadTaper: f.f11_fhTaper, jawAngle: f.f13_jawAng,
      chinAngle: f.f14_chinAng, widthVariance: f.f17_wVar,
    },
  };
}
