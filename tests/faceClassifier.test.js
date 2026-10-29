// ─── Tests for src/utils/faceClassifier.js (FROZEN — read-only) ─────────────
// This file only imports and validates the frozen face-analysis module. It
// does not modify it. Any bug found here is reported, not fixed.
import { describe, it, expect } from 'vitest';
import { extractFeatures } from '../src/utils/faceClassifier.js';
import { classifyFaceShapeGeometric } from '../src/utils/faceShapeRules.js';
import { makeFaceLandmarks, FACE_SHAPE_PARAMS } from './helpers/syntheticLandmarks.js';

// A simple, deliberately non-square synthetic face used to isolate the
// aspect-ratio correction from the rest of the shape-scoring logic.
// hairline/chin share x=0.5 so faceHeight is a pure vertical distance,
// unaffected by the aspect scaling applied to x.
function makeSimpleFace() {
  return makeFaceLandmarks({
    fW: 0.30, cW: 0.36, jW: 0.28, chinW: 0.10,
    hairY: 0.20, foreheadY: 0.32, cheekY: 0.45, jawY: 0.60, chinY: 0.80,
  });
}

describe('extractFeatures — aspect-ratio correction (the historical root-cause bug)', () => {
  it('produces a plausible length/width ratio (>1) for a normal face at aspect=1', () => {
    const lm = makeSimpleFace();
    const f = extractFeatures(lm, 1);
    expect(f).not.toBeNull();
    const lwr = f._raw.faceHeight / Math.max(f._raw.foreheadWidth, f._raw.cheekboneWidth, f._raw.jawlineWidth);
    expect(lwr).toBeGreaterThan(1);
  });

  it('scales the raw x-based widths linearly with the aspect parameter, while faceHeight (y-only) stays constant', () => {
    const lm = makeSimpleFace();
    const heights = [];
    const cheekWidths = [];
    for (const aspect of [0.5, 1, 1.5, 2]) {
      const f = extractFeatures(lm, aspect);
      heights.push(f._raw.faceHeight);
      cheekWidths.push(f._raw.cheekboneWidth);
    }
    // faceHeight is purely a y-distance (hairline/chin share x), so it must
    // not change when aspect changes.
    for (const h of heights) {
      expect(h).toBeCloseTo(heights[0], 5);
    }
    // Widths are x-distances, so they must scale linearly with aspect.
    expect(cheekWidths[1] / cheekWidths[0]).toBeCloseTo(1 / 0.5, 2); // aspect 1 vs 0.5
    expect(cheekWidths[2] / cheekWidths[0]).toBeCloseTo(1.5 / 0.5, 2); // aspect 1.5 vs 0.5
    expect(cheekWidths[3] / cheekWidths[0]).toBeCloseTo(2 / 0.5, 2); // aspect 2 vs 0.5
  });

  it('changes lengthWidthRatio correctly as aspect changes (ratio shrinks as aspect grows, since width grows)', () => {
    const lm = makeSimpleFace();
    const ratios = [0.5, 1, 1.5, 2].map((aspect) => {
      const f = extractFeatures(lm, aspect);
      return f._raw.faceHeight / Math.max(f._raw.foreheadWidth, f._raw.cheekboneWidth, f._raw.jawlineWidth);
    });
    // Monotonically decreasing as aspect increases (wider image → relatively wider face → smaller ratio).
    expect(ratios[1]).toBeLessThan(ratios[0]);
    expect(ratios[2]).toBeLessThan(ratios[1]);
    expect(ratios[3]).toBeLessThan(ratios[2]);
  });

  it('an un-corrected aspect (default=1) still returns internally consistent feature ratios', () => {
    const lm = makeSimpleFace();
    const f = extractFeatures(lm); // aspect defaults to 1
    expect(f.f1_whr).toBeCloseTo(f._raw.cheekboneWidth / f._raw.faceHeight, 5);
    expect(f.f4_jfR).toBeCloseTo(f._raw.jawlineWidth / f._raw.foreheadWidth, 5);
  });
});

describe('extractFeatures — feeds classifyFaceShapeGeometric correctly end-to-end', () => {
  it.each(Object.keys(FACE_SHAPE_PARAMS))('produces valid, classifiable features for the "%s" synthetic face', (shapeName) => {
    const lm = makeFaceLandmarks(FACE_SHAPE_PARAMS[shapeName]);
    const f = extractFeatures(lm, 1);
    expect(f).not.toBeNull();
    expect(f._raw.faceHeight).toBeGreaterThan(0);
    const result = classifyFaceShapeGeometric(f);
    expect(result.shape).toBe(shapeName);
  });
});

describe('extractFeatures — degenerate input', () => {
  it('returns null when the face height collapses to ~0 (hairline and chin coincide)', () => {
    const lm = makeFaceLandmarks({
      ...FACE_SHAPE_PARAMS.ovalado,
      hairY: 0.5, chinY: 0.5,
    });
    const f = extractFeatures(lm, 1);
    expect(f).toBeNull();
  });
});
