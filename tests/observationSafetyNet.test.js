import { describe, it, expect } from 'vitest';
import {
  shapeFromObservations,
  reconcileShapeWithObservations,
} from '../api/analyze-face-gemini.js';

describe('shapeFromObservations — derives shape from Gemini\'s own observations', () => {
  it('pómulos widest + pointed chin + soft jaw → diamante', () => {
    expect(shapeFromObservations({ zonaMasAncha: 'pomulos', mandibula: 'suave', menton: 'puntiagudo' }))
      .toBe('diamante');
  });

  it('frente widest + pointed chin → corazon', () => {
    expect(shapeFromObservations({ zonaMasAncha: 'frente', mandibula: 'suave', menton: 'puntiagudo' }))
      .toBe('corazon');
  });

  it('angular jaw + non-pointed chin → cuadrado', () => {
    expect(shapeFromObservations({ zonaMasAncha: 'mandibula', mandibula: 'angulosa', menton: 'recto' }))
      .toBe('cuadrado');
  });

  it('tolerates accents and casing (Pómulos / Angulosa)', () => {
    expect(shapeFromObservations({ zonaMasAncha: 'Pómulos', mandibula: 'suave', menton: 'Puntiagudo' }))
      .toBe('diamante');
  });

  // Must NOT fire on shapes that depend on gradual / length nuances.
  it('round face (pómulos widest, soft jaw, rounded chin) → null (leave to model)', () => {
    expect(shapeFromObservations({ zonaMasAncha: 'pomulos', mandibula: 'suave', menton: 'redondeado' }))
      .toBeNull();
  });

  it('balanced/oval (equilibrado, soft jaw, straight chin) → null', () => {
    expect(shapeFromObservations({ zonaMasAncha: 'equilibrado', mandibula: 'suave', menton: 'recto' }))
      .toBeNull();
  });

  it('empty / missing observations → null', () => {
    expect(shapeFromObservations(null)).toBeNull();
    expect(shapeFromObservations({})).toBeNull();
  });
});

describe('reconcileShapeWithObservations — corrects the mislabel, keeps correct ones', () => {
  it('Kylie case: labeled ovalado but obs say diamante → corrected to diamante', () => {
    const a = {
      photoOk: true, primaryShape: 'ovalado', isAmbiguous: true, secondaryShape: 'cuadrado',
      summary: 'Tu rostro tiene proporciones equilibradas.',
      observations: { zonaMasAncha: 'pomulos', mandibula: 'suave', menton: 'puntiagudo' },
    };
    reconcileShapeWithObservations(a);
    expect(a.primaryShape).toBe('diamante');
    expect(a.secondaryShape).toBe('ovalado'); // original demoted
    expect(a.isAmbiguous).toBe(false);
    expect(a.summary).toBeNull();             // contradicting summary cleared
    expect(a._correctedByObservations).toEqual({ from: 'ovalado', to: 'diamante' });
  });

  it('Kourtney case: labeled ovalado but obs say corazon → corrected to corazon', () => {
    const a = {
      photoOk: true, primaryShape: 'ovalado',
      observations: { zonaMasAncha: 'frente', mandibula: 'suave', menton: 'puntiagudo' },
    };
    reconcileShapeWithObservations(a);
    expect(a.primaryShape).toBe('corazon');
  });

  it('does NOT touch a correct diamante (obs agree with label)', () => {
    const a = {
      photoOk: true, primaryShape: 'diamante', summary: 'keep me',
      observations: { zonaMasAncha: 'pomulos', mandibula: 'suave', menton: 'puntiagudo' },
    };
    reconcileShapeWithObservations(a);
    expect(a.primaryShape).toBe('diamante');
    expect(a.summary).toBe('keep me'); // untouched
    expect(a._correctedByObservations).toBeUndefined();
  });

  it('does NOT touch a correct oval (no clear observational signature)', () => {
    const a = {
      photoOk: true, primaryShape: 'ovalado', summary: 'keep me',
      observations: { zonaMasAncha: 'equilibrado', mandibula: 'suave', menton: 'recto' },
    };
    reconcileShapeWithObservations(a);
    expect(a.primaryShape).toBe('ovalado');
    expect(a.summary).toBe('keep me');
  });

  it('does NOT touch a correct round face', () => {
    const a = {
      photoOk: true, primaryShape: 'redondo',
      observations: { zonaMasAncha: 'pomulos', mandibula: 'suave', menton: 'redondeado' },
    };
    reconcileShapeWithObservations(a);
    expect(a.primaryShape).toBe('redondo');
  });

  it('skips correction entirely when photo was flagged unusable', () => {
    const a = {
      photoOk: false, primaryShape: 'ovalado',
      observations: { zonaMasAncha: 'pomulos', mandibula: 'suave', menton: 'puntiagudo' },
    };
    reconcileShapeWithObservations(a);
    expect(a.primaryShape).toBe('ovalado'); // untouched on bad photo
  });
});
