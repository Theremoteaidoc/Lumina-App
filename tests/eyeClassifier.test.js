// ─── Tests for src/utils/eyeClassifier.js (FROZEN — read-only) ─────────────
// This file only imports and validates the frozen face-analysis module. It
// does not modify it. Any bug found here is reported, not fixed.
import { describe, it, expect } from 'vitest';
import { classifyEyeShape } from '../src/utils/eyeClassifier.js';
import { makeEyeLandmarks, EYE_SHAPE_PARAMS } from './helpers/syntheticLandmarks.js';

const VALID_SHAPES = ['almendra', 'redondo', 'rasgado', 'caido', 'encapotado'];

describe('classifyEyeShape — classifies each synthetic eye geometry correctly', () => {
  it.each(Object.keys(EYE_SHAPE_PARAMS))('classifies "%s" geometry correctly', (shapeName) => {
    const lm = makeEyeLandmarks(EYE_SHAPE_PARAMS[shapeName]);
    const r = classifyEyeShape(lm);
    expect(r.shape).toBe(shapeName);
  });
});

describe('classifyEyeShape — response shape', () => {
  it('returns a valid EYE_DATA shape, a confidence, scores and features', () => {
    const lm = makeEyeLandmarks(EYE_SHAPE_PARAMS.almendra);
    const r = classifyEyeShape(lm);
    expect(VALID_SHAPES).toContain(r.shape);
    expect(typeof r.confidence).toBe('number');
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(100);
    expect(r.scores).toBeTruthy();
    expect(Object.keys(r.scores).sort()).toEqual([...VALID_SHAPES].sort());
    expect(r.features).toHaveProperty('ear');
    expect(r.features).toHaveProperty('cornerAngle');
    expect(r.features).toHaveProperty('hoodScore');
    expect(['juntos', 'separados', 'proporcional']).toContain(r.spacing);
  });
});

describe('classifyEyeShape — never crashes on incomplete/missing input', () => {
  it('returns null for a null landmark array', () => {
    expect(() => classifyEyeShape(null)).not.toThrow();
    expect(classifyEyeShape(null)).toBeNull();
  });

  it('returns null for an undefined landmark array', () => {
    expect(() => classifyEyeShape(undefined)).not.toThrow();
    expect(classifyEyeShape(undefined)).toBeNull();
  });

  it('returns null when there are fewer than 468 landmarks', () => {
    const shortLm = new Array(10).fill({ x: 0.5, y: 0.5, z: 0 });
    expect(() => classifyEyeShape(shortLm)).not.toThrow();
    expect(classifyEyeShape(shortLm)).toBeNull();
  });

  it('does not crash on a full-length but degenerate (all-identical-point) landmark array', () => {
    const degenerate = new Array(478).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0 }));
    expect(() => classifyEyeShape(degenerate)).not.toThrow();
    const r = classifyEyeShape(degenerate);
    expect(VALID_SHAPES).toContain(r.shape);
  });
});
