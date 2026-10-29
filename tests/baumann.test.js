import { describe, it, expect } from 'vitest';
import { computeBaumannCode, mapAxesToLegacySkinType, composeSkinTitle } from '../src/utils/baumann.js';
import { SKIN_QUESTIONS, BAUMANN_AXES } from '../src/data/appData.js';

// Minimal fake question set mirroring the real SKIN_QUESTIONS shape,
// so this test doesn't depend on the exact wording in appData.js.
const HYDRATION_ONLY_QUESTIONS = [
  { axis: 'hydration', options: [{ value: 'O' }, { value: 'D' }] },
  { axis: 'hydration', options: [{ value: 'O' }, { value: 'D' }] },
  { axis: 'sensitivity', options: [{ value: 'S' }, { value: 'R' }] },
  { axis: 'sensitivity', options: [{ value: 'S' }, { value: 'R' }] },
  { axis: 'pigmentation', options: [{ value: 'P' }, { value: 'N' }] },
  { axis: 'pigmentation', options: [{ value: 'P' }, { value: 'N' }] },
  { multi: true, category: 'likes', options: [] },
  { multi: true, category: 'avoid', options: [] },
];

const WITH_FIRMNESS_QUESTIONS = [
  ...HYDRATION_ONLY_QUESTIONS.slice(0, 6),
  { axis: 'firmness', options: [{ value: 'W' }, { value: 'T' }] },
  { axis: 'firmness', options: [{ value: 'W' }, { value: 'T' }] },
  ...HYDRATION_ONLY_QUESTIONS.slice(6),
];

describe('computeBaumannCode', () => {
  it('produces a 3-letter code when no firmness questions are present (age-adaptive: under 26)', () => {
    const answers = ['O', 'O', 'S', 'R', 'N', 'N', [], []];
    const { code, axes } = computeBaumannCode(answers, HYDRATION_ONLY_QUESTIONS);
    expect(code).toHaveLength(3);
    expect(code).toBe('OSN');
    expect(axes).toEqual({ hydration: 'O', sensitivity: 'S', pigmentation: 'N', firmness: null });
  });

  it('produces a 4-letter code when firmness questions are present (age-adaptive: 26+)', () => {
    const answers = ['D', 'D', 'R', 'R', 'P', 'P', 'W', 'W', [], []];
    const { code, axes } = computeBaumannCode(answers, WITH_FIRMNESS_QUESTIONS);
    expect(code).toHaveLength(4);
    expect(code).toBe('DRPW');
    expect(axes.firmness).toBe('W');
  });

  it('takes the majority answer per axis', () => {
    // 2 votes for D, 1 vote for O within a 3-question hydration axis.
    const questions = [
      { axis: 'hydration', options: [{ value: 'O' }, { value: 'D' }] },
      { axis: 'hydration', options: [{ value: 'O' }, { value: 'D' }] },
      { axis: 'hydration', options: [{ value: 'O' }, { value: 'D' }] },
    ];
    const { axes } = computeBaumannCode(['O', 'D', 'D'], questions);
    expect(axes.hydration).toBe('D');
  });

  it('breaks ties using the canonical pole order (first pole wins)', () => {
    const questions = [
      { axis: 'hydration', options: [{ value: 'O' }, { value: 'D' }] },
      { axis: 'hydration', options: [{ value: 'O' }, { value: 'D' }] },
    ];
    const { axes } = computeBaumannCode(['O', 'D'], questions);
    expect(axes.hydration).toBe('O');
  });

  it('ignores multi-select (preference) answers when scoring', () => {
    const questions = [
      { axis: 'hydration', options: [{ value: 'O' }, { value: 'D' }] },
      { multi: true, category: 'likes', options: [] },
    ];
    const { axes } = computeBaumannCode(['O', ['natural', 'vegan']], questions);
    expect(axes.hydration).toBe('O');
  });

  it('works against the real SKIN_QUESTIONS export, filtered for a young user (no firmness)', () => {
    const youngQuestions = SKIN_QUESTIONS.filter((q) => q.axis !== 'firmness');
    const answers = youngQuestions.map((q) => (q.multi ? [] : q.options[0].value));
    const { code, axes } = computeBaumannCode(answers, youngQuestions);
    expect(code).toHaveLength(3);
    expect(axes.firmness).toBeNull();
  });

  it('works against the real SKIN_QUESTIONS export, unfiltered (26+ user, includes firmness)', () => {
    const answers = SKIN_QUESTIONS.map((q) => (q.multi ? [] : q.options[0].value));
    const { code, axes } = computeBaumannCode(answers, SKIN_QUESTIONS);
    expect(code).toHaveLength(4);
    expect(axes.firmness).not.toBeNull();
  });
});

describe('mapAxesToLegacySkinType — backward compatibility with chat / ResultsScreen', () => {
  it('maps sensitivity S to "sensible" regardless of hydration', () => {
    expect(mapAxesToLegacySkinType({ hydration: 'O', sensitivity: 'S' })).toBe('sensible');
    expect(mapAxesToLegacySkinType({ hydration: 'D', sensitivity: 'S' })).toBe('sensible');
  });

  it('maps hydration O (non-sensitive) to "grasa"', () => {
    expect(mapAxesToLegacySkinType({ hydration: 'O', sensitivity: 'R' })).toBe('grasa');
  });

  it('maps hydration D (non-sensitive) to "seca"', () => {
    expect(mapAxesToLegacySkinType({ hydration: 'D', sensitivity: 'R' })).toBe('seca');
  });

  it('only ever returns one of the 3 legacy keys the chat/ResultsScreen understand', () => {
    const legacyKeys = ['grasa', 'seca', 'sensible'];
    for (const hydration of ['O', 'D']) {
      for (const sensitivity of ['S', 'R']) {
        expect(legacyKeys).toContain(mapAxesToLegacySkinType({ hydration, sensitivity }));
      }
    }
  });
});

describe('composeSkinTitle', () => {
  it('composes a title from hydration alone', () => {
    const axes = { hydration: 'O', sensitivity: 'R', pigmentation: 'N', firmness: null };
    expect(composeSkinTitle(axes, BAUMANN_AXES)).toBe('Piel grasa');
  });

  it('composes a title combining hydration and sensitivity', () => {
    const axes = { hydration: 'O', sensitivity: 'S', pigmentation: 'N', firmness: null };
    expect(composeSkinTitle(axes, BAUMANN_AXES)).toBe('Piel grasa y sensible');
  });

  it('mentions pigmentation and firmness when applicable', () => {
    const axes = { hydration: 'D', sensitivity: 'S', pigmentation: 'P', firmness: 'W' };
    const title = composeSkinTitle(axes, BAUMANN_AXES);
    expect(title).toContain('seca');
    expect(title).toContain('sensible');
    expect(title).toContain('con tendencia a manchas');
    expect(title).toContain('con líneas de expresión');
  });
});
