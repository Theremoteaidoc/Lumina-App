/* ═══════════════════════════════════════════════════════════════════
   Face Shape Classification v4.0 — Hybrid ML + Rules
   
   Corrected landmark indices using FACE_OVAL contour.
   Classification via hybrid system: Random Forest (trained on 5000 faces
   from Kaggle Face Shape Dataset) + rule-based disambiguation.
   ═══════════════════════════════════════════════════════════════════ */

// Import the trained hybrid classifier
import { classifyFaceShape as hybridClassify } from './hybridClassifier.js';

// ─── MediaPipe FACE_OVAL contour (official from FACEMESH_FACE_OVAL) ──
// These are the points that trace the actual face boundary
export const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

// Split into LEFT side and RIGHT side of face contour
// Right side (from forehead going down on person's right = image left):
// 10 → 338 → 297 → 332 → 284 → 251 → 389 → 356 → 454 → 323 → 361 → 288 → 397 → 365 → 379 → 378 → 400 → 377 → 152
// Left side (from forehead going down on person's left = image right):
// 10 → 109 → 67 → 103 → 54 → 21 → 162 → 127 → 234 → 93 → 132 → 58 → 172 → 136 → 150 → 149 → 176 → 148 → 152

// Key boundary landmarks for measurements
export const LANDMARKS = {
  // TOP of face (hairline approximation)
  hairline: 10,
  
  // FOREHEAD zone - widest boundary points at forehead level
  // Using points roughly at eyebrow height on the face boundary
  foreheadLeft: 21,      // Left face boundary at forehead level
  foreheadRight: 251,    // Right face boundary at forehead level
  
  // CHEEKBONE zone - widest boundary points at cheek level
  // These are the true zygomatic arch points on the face contour
  cheekLeft: 234,        // Left face boundary at cheekbone (widest)
  cheekRight: 454,       // Right face boundary at cheekbone (widest)
  
  // JAWLINE zone - boundary points at jaw angle
  jawLeft: 172,          // Left gonion (jaw angle on boundary)  
  jawRight: 397,         // Right gonion (jaw angle on boundary)
  
  // CHIN
  chin: 152,             // Menton (bottom of chin on boundary)
  
  // Internal reference points (for vertical measurements & angles)
  noseTip: 1,
  nasion: 168,           // Bridge of nose
  lipBottom: 17,
  chinLeft: 150,         // Left chin boundary
  chinRight: 379,        // Right chin boundary
  jawMidLeft: 136,       // Mid-jawline left
  jawMidRight: 365,      // Mid-jawline right
  
  // Face oval for drawing
  faceOval: FACE_OVAL_INDICES,
};

// ─── Utility functions ───────────────────────────────────────────

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

function ptLineDist(p, a, b) {
  const C = b.x - a.x, D = b.y - a.y;
  const lenSq = C * C + D * D;
  if (lenSq === 0) return dist(p, a);
  const t = ((p.x - a.x) * C + (p.y - a.y) * D) / lenSq;
  return dist(p, { x: a.x + t * C, y: a.y + t * D });
}

// ─── Dynamic width measurement at a given Y level ────────────────
// Instead of relying on fixed landmark pairs, find the widest
// horizontal span of the face contour at each vertical zone

function findWidthAtLevel(lm, yLevel, tolerance) {
  // Find all FACE_OVAL points near the given Y level
  const candidates = FACE_OVAL_INDICES
    .map(idx => ({ idx, x: lm[idx].x, y: lm[idx].y }))
    .filter(p => Math.abs(p.y - yLevel) < tolerance);
  
  if (candidates.length < 2) return null;
  
  let leftMost = candidates[0], rightMost = candidates[0];
  for (const p of candidates) {
    if (p.x < leftMost.x) leftMost = p;
    if (p.x > rightMost.x) rightMost = p;
  }
  
  return {
    width: rightMost.x - leftMost.x,
    leftIdx: leftMost.idx,
    rightIdx: rightMost.idx,
    leftPt: lm[leftMost.idx],
    rightPt: lm[rightMost.idx],
  };
}

// ─── 19-Feature Extraction with corrected landmarks ──────────────

export function extractFeatures(lm) {
  const L = LANDMARKS;
  const faceHeight = dist(lm[L.hairline], lm[L.chin]);
  if (faceHeight < 0.01) return null;

  // Use boundary points for width measurements
  const foreheadW = dist(lm[L.foreheadLeft], lm[L.foreheadRight]);
  const cheekW = dist(lm[L.cheekLeft], lm[L.cheekRight]);
  const jawW = dist(lm[L.jawLeft], lm[L.jawRight]);
  const chinW = dist(lm[L.chinLeft], lm[L.chinRight]);
  
  // Dynamic width measurement as fallback/validation
  const hairY = lm[L.hairline].y;
  const chinY = lm[L.chin].y;
  const range = chinY - hairY;
  
  // Try dynamic measurement at each zone
  const dynForehead = findWidthAtLevel(lm, hairY + range * 0.25, range * 0.08);
  const dynCheek = findWidthAtLevel(lm, hairY + range * 0.45, range * 0.08);
  const dynJaw = findWidthAtLevel(lm, hairY + range * 0.75, range * 0.08);
  
  // Use the wider of fixed or dynamic measurement (boundary should be wider)
  const fW = dynForehead ? Math.max(foreheadW, dynForehead.width) : foreheadW;
  const cW = dynCheek ? Math.max(cheekW, dynCheek.width) : cheekW;
  const jW = dynJaw ? Math.max(jawW, dynJaw.width) : jawW;

  // Vertical proportions
  const upperFace = dist(lm[L.hairline], lm[L.nasion]);
  const lowerFace = dist(lm[L.noseTip], lm[L.chin]);
  const chinLen = dist(lm[L.lipBottom], lm[L.chin]);
  const maxW = Math.max(fW, cW, jW);
  const minW = Math.min(fW, cW, jW);

  // Jawline angles
  const jawAngL = angle(lm[L.cheekLeft], lm[L.jawLeft], lm[L.chin]);
  const jawAngR = angle(lm[L.cheekRight], lm[L.jawRight], lm[L.chin]);
  const chinAng = angle(lm[L.jawLeft], lm[L.chin], lm[L.jawRight]);

  // Jaw curvature
  const jCurveL = ptLineDist(lm[L.jawMidLeft], lm[L.cheekLeft], lm[L.chin]);
  const jCurveR = ptLineDist(lm[L.jawMidRight], lm[L.cheekRight], lm[L.chin]);

  return {
    f1_whr: cW / faceHeight,
    f2_fwR: fW / faceHeight,
    f3_jwR: jW / faceHeight,
    f4_jfR: jW / fW,
    f5_cjR: cW / jW,
    f6_cfR: cW / fW,
    f7_upper: upperFace / faceHeight,
    f8_lower: lowerFace / faceHeight,
    f9_chin: chinLen / faceHeight,
    f10_cheekTaper: (cW - jW) / cW,
    f11_fhTaper: (fW - jW) / fW,
    f12_chinTaper: jW > 0 ? (jW - chinW) / jW : 0.3,
    f13_jawAng: (jawAngL + jawAngR) / 2,
    f14_chinAng: chinAng,
    f15_jawSq: jW > 0 ? chinW / jW : 0.5,
    f16_jawCurve: (jCurveL + jCurveR) / (2 * faceHeight),
    f17_wVar: maxW > 0 ? (maxW - minW) / maxW : 0.15,
    f18_fhAng: 25, // Placeholder — complex to compute from normalized coords
    f19_ckAng: 30, // Placeholder
    _raw: { faceHeight, foreheadWidth: fW, cheekboneWidth: cW, jawlineWidth: jW, chinWidth: chinW },
    _dynPoints: { dynForehead, dynCheek, dynJaw },
  };
}

// ─── Backward compat: getMeasurements ────────────────────────────
// Used by FaceScanScreen overlay drawing

export function getMeasurements(landmarks, videoW, videoH) {
  const L = LANDMARKS;
  return {
    faceLength: euclidean(landmarks[L.hairline], landmarks[L.chin], videoW, videoH),
    foreheadWidth: euclidean(landmarks[L.foreheadLeft], landmarks[L.foreheadRight], videoW, videoH),
    cheekboneWidth: euclidean(landmarks[L.cheekLeft], landmarks[L.cheekRight], videoW, videoH),
    jawlineWidth: euclidean(landmarks[L.jawLeft], landmarks[L.jawRight], videoW, videoH),
  };
}

// ═══════════════════════════════════════════════════════════════════
// CLASSIFIER v4 — Hybrid (ML trained on 5000 faces + rule-based)
// ═══════════════════════════════════════════════════════════════════

export function classifyFaceShape(input) {
  let f;
  if (input.f1_whr !== undefined) {
    f = input;
  } else {
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

  // Use hybrid ML + rules classifier
  return hybridClassify(f);
}
