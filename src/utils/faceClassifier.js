/* ═══════════════════════════════════════════════════════════════════
   Face Shape Classification v5.0 — Geometric Rules (visagism-anchored)

   Corrected landmark indices using FACE_OVAL contour.
   Classification via classifyFaceShapeGeometric() in faceShapeRules.js —
   100% local geometric rules anchored in
   src/data/knowledge/visagism.json, no ML model, no network.

   v5 replaces the old Random Forest (hybridClassifier.js, ~734KB,
   trained on a small Kaggle dataset) which systematically over-
   predicted "ovalado". hybridClassifier.js is kept on disk as dead
   code for reference but is no longer imported anywhere.
   ═══════════════════════════════════════════════════════════════════ */

import { classifyFaceShapeGeometric } from './faceShapeRules.js';

// Kept as a no-op for backward compatibility — nothing lazy-loads the
// Random Forest anymore, so this simply resolves immediately.
export async function loadHybridClassifier() {
  return Promise.resolve();
}

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
  
  // FOREHEAD zone - temple to temple (true forehead width)
  // Landmarks 54/284 are at the temporal region, above the eyebrows
  foreheadLeft: 54,      // Left temple
  foreheadRight: 284,    // Right temple
  
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

export function extractFeatures(lm, aspect = 1) {
  const L = LANDMARKS;

  // ─── ASPECT-RATIO CORRECTION (root fix) ───────────────────────────
  // MediaPipe returns x normalized by image WIDTH and y by image HEIGHT.
  // On a non-square image those axes are NOT in the same unit, so mixing
  // horizontal widths with vertical height (e.g. length/width ratio) is
  // distorted — which made every real face collapse toward "ovalado".
  // Scaling x by aspect (imgW/imgH) puts both axes in "height units" so all
  // distances and ratios become geometrically correct.
  const A = lm.map((p) => ({ x: p.x * aspect, y: p.y, z: p.z }));

  const faceHeight = dist(A[L.hairline], A[L.chin]);
  if (faceHeight < 0.01) return null;

  // Use boundary points for width measurements
  const foreheadW = dist(A[L.foreheadLeft], A[L.foreheadRight]);
  const cheekW = dist(A[L.cheekLeft], A[L.cheekRight]);
  const jawW = dist(A[L.jawLeft], A[L.jawRight]);
  const chinW = dist(A[L.chinLeft], A[L.chinRight]);

  // Dynamic width measurement as fallback/validation
  const hairY = A[L.hairline].y;
  const chinY = A[L.chin].y;
  const range = chinY - hairY;

  // Try dynamic measurement at each zone (on aspect-corrected coords)
  const dynForehead = findWidthAtLevel(A, hairY + range * 0.25, range * 0.08);
  const dynCheek = findWidthAtLevel(A, hairY + range * 0.45, range * 0.08);
  const dynJaw = findWidthAtLevel(A, hairY + range * 0.75, range * 0.08);

  // Use the wider of fixed or dynamic measurement (boundary should be wider)
  const fW = dynForehead ? Math.max(foreheadW, dynForehead.width) : foreheadW;
  const cW = dynCheek ? Math.max(cheekW, dynCheek.width) : cheekW;
  const jW = dynJaw ? Math.max(jawW, dynJaw.width) : jawW;

  // Vertical proportions
  const upperFace = dist(A[L.hairline], A[L.nasion]);
  const lowerFace = dist(A[L.noseTip], A[L.chin]);
  const chinLen = dist(A[L.lipBottom], A[L.chin]);
  const maxW = Math.max(fW, cW, jW);
  const minW = Math.min(fW, cW, jW);

  // Jawline angles (on aspect-corrected coords so angles are true)
  const jawAngL = angle(A[L.cheekLeft], A[L.jawLeft], A[L.chin]);
  const jawAngR = angle(A[L.cheekRight], A[L.jawRight], A[L.chin]);
  const chinAng = angle(A[L.jawLeft], A[L.chin], A[L.jawRight]);

  // Jaw curvature
  const jCurveL = ptLineDist(A[L.jawMidLeft], A[L.cheekLeft], A[L.chin]);
  const jCurveR = ptLineDist(A[L.jawMidRight], A[L.cheekRight], A[L.chin]);

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

// ═══════════════════════════════════════════════════════════════════
// CLASSIFIER v5 — Geometric rules (visagism-anchored, 100% local)
// ═══════════════════════════════════════════════════════════════════

// Kept `async` so existing `await classifyFaceShape(...)` call sites
// (e.g. FaceScanScreen.jsx) keep working unchanged — there is no
// dynamic import to await anymore, it just resolves immediately.
export async function classifyFaceShape(input) {
  let f;
  if (input.f1_whr !== undefined) {
    f = input;
  } else {
    const { faceLength: fh, foreheadWidth: fw, cheekboneWidth: cw, jawlineWidth: jw } = input;
    const h = fh || 1;
    const chinW = cw * 0.85; // no dedicated chin measurement in this legacy input shape
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
      _raw: { faceHeight: h, foreheadWidth: fw, cheekboneWidth: cw, jawlineWidth: jw, chinWidth: chinW },
    };
  }

  const result = classifyFaceShapeGeometric(f);

  // Shape the output to match what FaceScanScreen.jsx / localFaceAnalysis.js
  // already expect from the old hybrid classifier (shape, confidence,
  // whr/jfr/cjr strings, features{...}), plus the new transparency fields.
  return {
    shape: result.shape,
    confidence: result.confidence,
    scores: result.scores,
    allScores: result.scores, // backward-compat alias
    secondaryInfluences: result.secondaryInfluences,
    metrics: result.metrics,
    whr: (f.f1_whr || 0).toFixed(3),
    jfr: (f.f4_jfR || 0).toFixed(3),
    cjr: (f.f5_cjR || 0).toFixed(3),
    features: {
      whr: f.f1_whr, cheekTaper: f.f10_cheekTaper,
      foreheadTaper: f.f11_fhTaper, jawAngle: f.f13_jawAng,
      chinAngle: f.f14_chinAng, widthVariance: f.f17_wVar,
    },
  };
}
