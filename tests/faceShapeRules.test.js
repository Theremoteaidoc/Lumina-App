// ─── Tests for src/utils/faceShapeRules.js (FROZEN — read-only) ─────────────
// This file only imports and validates the frozen face-analysis module. It
// does not modify it. Any bug found here is reported, not fixed.
import { describe, it, expect } from 'vitest';
import { classifyFaceShapeGeometric } from '../src/utils/faceShapeRules.js';
import { extractFeatures } from '../src/utils/faceClassifier.js';
import { makeFaceLandmarks, FACE_SHAPE_PARAMS } from './helpers/syntheticLandmarks.js';

function classify(shapeName) {
  const lm = makeFaceLandmarks(FACE_SHAPE_PARAMS[shapeName]);
  const features = extractFeatures(lm, 1);
  return classifyFaceShapeGeometric(features);
}

describe('classifyFaceShapeGeometric — classifies each synthetic shape correctly', () => {
  it('classifies round-face geometry as "redondo"', () => {
    const r = classify('redondo');
    expect(r.shape).toBe('redondo');
  });

  it('classifies square-face geometry as "cuadrado"', () => {
    const r = classify('cuadrado');
    expect(r.shape).toBe('cuadrado');
  });

  it('classifies oblong-face geometry as "alargado"', () => {
    const r = classify('alargado');
    expect(r.shape).toBe('alargado');
  });

  it('classifies heart-face geometry as "corazon"', () => {
    const r = classify('corazon');
    expect(r.shape).toBe('corazon');
  });

  it('classifies diamond-face geometry as "diamante"', () => {
    const r = classify('diamante');
    expect(r.shape).toBe('diamante');
  });

  it('classifies oval-face geometry as "ovalado"', () => {
    const r = classify('ovalado');
    expect(r.shape).toBe('ovalado');
  });
});

describe('classifyFaceShapeGeometric — does NOT default/bias to "ovalado"', () => {
  // Regression guard for the historical bug this module was written to fix
  // (see file header: "systematically over-predicted ovalado").
  it.each(['redondo', 'cuadrado', 'alargado', 'corazon', 'diamante'])(
    'a clear "%s" geometry is never misclassified as "ovalado"',
    (shapeName) => {
      const r = classify(shapeName);
      expect(r.shape).not.toBe('ovalado');
    }
  );
});

describe('classifyFaceShapeGeometric — response shape', () => {
  it('returns shape, confidence, scores, secondaryInfluences and metrics for a valid input', () => {
    const r = classify('ovalado');
    expect(r).toHaveProperty('shape');
    expect(r).toHaveProperty('confidence');
    expect(typeof r.confidence).toBe('number');
    expect(r).toHaveProperty('scores');
    expect(Object.keys(r.scores).sort()).toEqual(
      ['alargado', 'corazon', 'cuadrado', 'diamante', 'ovalado', 'redondo'].sort()
    );
    expect(r).toHaveProperty('secondaryInfluences');
    expect(Array.isArray(r.secondaryInfluences)).toBe(true);
    expect(r).toHaveProperty('metrics');
    expect(r.metrics).toHaveProperty('lengthWidthRatio');
    expect(r.metrics).toHaveProperty('jawForeheadRatio');
    expect(r.metrics).toHaveProperty('cheekJawRatio');
    expect(r.metrics).toHaveProperty('jawAngle');
    expect(r.metrics).toHaveProperty('widestZone');
  });

  it('confidence is always within [0, 100]', () => {
    for (const shapeName of Object.keys(FACE_SHAPE_PARAMS)) {
      const r = classify(shapeName);
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(100);
    }
  });
});

describe('classifyFaceShapeGeometric — never crashes on incomplete/missing input', () => {
  it('handles a completely null features object', () => {
    expect(() => classifyFaceShapeGeometric(null)).not.toThrow();
    const r = classifyFaceShapeGeometric(null);
    expect(r.shape).toBeNull();
    expect(r.confidence).toBe(0);
  });

  it('handles an empty features object (no _raw)', () => {
    expect(() => classifyFaceShapeGeometric({})).not.toThrow();
    const r = classifyFaceShapeGeometric({});
    expect(r.shape).toBeNull();
    expect(r.confidence).toBe(0);
  });

  it('handles a features object with zeroed/partial _raw widths', () => {
    const r = classifyFaceShapeGeometric({ _raw: { faceHeight: 0, foreheadWidth: 0, cheekboneWidth: 0, jawlineWidth: 0 } });
    expect(r.shape).toBeNull();
    expect(r.confidence).toBe(0);
  });

  it('handles undefined derived-ratio fields gracefully (falls back to raw-computed ratios)', () => {
    const r = classifyFaceShapeGeometric({
      _raw: { faceHeight: 0.6, foreheadWidth: 0.4, cheekboneWidth: 0.45, jawlineWidth: 0.38 },
    });
    expect(() => r).not.toThrow();
    expect(typeof r.shape).toBe('string');
  });
});
