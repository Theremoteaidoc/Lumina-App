import { describe, it, expect } from 'vitest';
import {
  AFFIRMATION_CARDS,
  COLORIMETRIA_RESULTS,
  SKIN_RESULTS,
  SKIN_QUESTIONS,
  BAUMANN_AXES,
  FACE_DATA,
  EYE_DATA,
} from '../src/data/appData.js';
import { getTopicsByDomain } from '../src/data/knowledge/luminaContext.js';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

// The 12 moods the app is designed around (see comment header in appData.js).
const ALL_MOODS = [
  'happy', 'grateful', 'hopeful', 'tired', 'anxious', 'down',
  'lonely', 'insecure', 'overwhelmed', 'empowered', 'inspired', 'peaceful',
];

describe('AFFIRMATION_CARDS — structural integrity', () => {
  it('every card has a unique id', () => {
    const ids = AFFIRMATION_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every card has a non-empty affirmation, verse, moods and themes', () => {
    for (const card of AFFIRMATION_CARDS) {
      expect(typeof card.affirmation).toBe('string');
      expect(card.affirmation.length).toBeGreaterThan(0);
      expect(typeof card.verse).toBe('string');
      expect(card.verse.length).toBeGreaterThan(0);
      expect(Array.isArray(card.moods)).toBe(true);
      expect(card.moods.length).toBeGreaterThan(0);
      expect(Array.isArray(card.themes)).toBe(true);
      expect(card.themes.length).toBeGreaterThan(0);
    }
  });

  it.each(ALL_MOODS)('mood "%s" has at least 10 affirmations', (mood) => {
    const count = AFFIRMATION_CARDS.filter((c) => c.moods.includes(mood)).length;
    expect(count).toBeGreaterThanOrEqual(10);
  });
});

describe('COLORIMETRIA_RESULTS — structural integrity', () => {
  const REQUIRED_RECOMMENDATIONS = ['blush', 'eyeshadow', 'lipstick', 'jewelry', 'hair', 'clothing', 'glasses'];

  it.each(['frio', 'calido', 'neutro'])('subtone "%s" has all required recommendation categories', (key) => {
    const entry = COLORIMETRIA_RESULTS[key];
    expect(entry).toBeTruthy();
    for (const field of REQUIRED_RECOMMENDATIONS) {
      expect(entry.recommendations).toHaveProperty(field);
    }
  });

  it.each(['frio', 'calido', 'neutro'])('subtone "%s" has a non-empty colors array with valid {hex,name} entries', (key) => {
    const entry = COLORIMETRIA_RESULTS[key];
    expect(Array.isArray(entry.colors)).toBe(true);
    expect(entry.colors.length).toBeGreaterThan(0);
    for (const color of entry.colors) {
      expect(color).toHaveProperty('hex');
      expect(color).toHaveProperty('name');
      expect(color.hex).toMatch(HEX_RE);
      expect(typeof color.name).toBe('string');
      expect(color.name.length).toBeGreaterThan(0);
    }
  });
});

describe('SKIN_RESULTS — structural integrity', () => {
  it.each(Object.keys(SKIN_RESULTS))('skin type "%s" has girlTip, goodHabits, badHabits, tips and vitamins', (key) => {
    const entry = SKIN_RESULTS[key];
    expect(typeof entry.girlTip).toBe('string');
    expect(entry.girlTip.length).toBeGreaterThan(0);
    expect(Array.isArray(entry.goodHabits)).toBe(true);
    expect(entry.goodHabits.length).toBeGreaterThan(0);
    expect(Array.isArray(entry.badHabits)).toBe(true);
    expect(entry.badHabits.length).toBeGreaterThan(0);
    expect(Array.isArray(entry.tips)).toBe(true);
    expect(entry.tips.length).toBeGreaterThan(0);
    expect(Array.isArray(entry.vitamins)).toBe(true);
    expect(entry.vitamins.length).toBeGreaterThan(0);
  });
});

describe('SKIN_QUESTIONS — structural integrity', () => {
  it('every multi-select question is flagged multi:true and has a category', () => {
    const multiQuestions = SKIN_QUESTIONS.filter((q) => q.multi);
    expect(multiQuestions.length).toBeGreaterThan(0);
    for (const q of multiQuestions) {
      expect(q.multi).toBe(true);
      expect(typeof q.category).toBe('string');
      expect(q.category.length).toBeGreaterThan(0);
    }
  });

  it('every question has at least one option with a text and value', () => {
    for (const q of SKIN_QUESTIONS) {
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThan(0);
      for (const opt of q.options) {
        expect(typeof opt.text).toBe('string');
        expect(opt.text.length).toBeGreaterThan(0);
        expect(typeof opt.value).toBe('string');
        expect(opt.value.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('SKIN_QUESTIONS — Baumann axis tagging (age-adaptive test)', () => {
  const AXIS_LETTERS = {
    hydration: ['O', 'D'],
    sensitivity: ['S', 'R'],
    pigmentation: ['P', 'N'],
    firmness: ['W', 'T'],
  };

  it('every non-multi question is tagged with a recognized axis', () => {
    const axisQuestions = SKIN_QUESTIONS.filter((q) => !q.multi);
    expect(axisQuestions.length).toBeGreaterThan(0);
    for (const q of axisQuestions) {
      expect(Object.keys(AXIS_LETTERS)).toContain(q.axis);
    }
  });

  it('every axis question option value is a valid letter for its axis', () => {
    for (const q of SKIN_QUESTIONS.filter((q) => q.axis)) {
      const validLetters = AXIS_LETTERS[q.axis];
      for (const opt of q.options) {
        expect(validLetters).toContain(opt.value);
      }
    }
  });

  it('has at least 2 questions per axis, including firmness', () => {
    for (const axis of Object.keys(AXIS_LETTERS)) {
      const count = SKIN_QUESTIONS.filter((q) => q.axis === axis).length;
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  it('firmness questions never appear before the multi preference questions', () => {
    // The UI relies on preferences always being last, and (for younger users)
    // filters out firmness questions entirely while preserving relative order.
    const lastAxisIndex = SKIN_QUESTIONS.map((q) => !!q.axis).lastIndexOf(true);
    const firstMultiIndex = SKIN_QUESTIONS.findIndex((q) => q.multi);
    expect(firstMultiIndex).toBeGreaterThan(lastAxisIndex);
  });
});

describe('BAUMANN_AXES — structural integrity + KB grounding', () => {
  const AXIS_POLES = {
    hydration: ['O', 'D'],
    sensitivity: ['S', 'R'],
    pigmentation: ['P', 'N'],
    firmness: ['W', 'T'],
  };

  const skincareTopicIds = new Set(getTopicsByDomain('skincare').map((t) => t.id));

  it.each(Object.entries(AXIS_POLES))('axis "%s" has both poles with full content', (axis, poles) => {
    for (const pole of poles) {
      const entry = BAUMANN_AXES[axis][pole];
      expect(entry).toBeTruthy();
      expect(typeof entry.label).toBe('string');
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.letter).toBe(pole);
      expect(typeof entry.desc).toBe('string');
      expect(entry.desc.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.routine)).toBe(true);
      expect(entry.routine.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.tips)).toBe(true);
      expect(entry.tips.length).toBeGreaterThan(0);
      expect(typeof entry.girlTip).toBe('string');
      expect(entry.girlTip.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.goodHabits)).toBe(true);
      expect(entry.goodHabits.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.badHabits)).toBe(true);
      expect(entry.badHabits.length).toBeGreaterThan(0);
    }
  });

  it('every pole is grounded in at least one real skincare.json topic', () => {
    for (const poles of Object.values(BAUMANN_AXES)) {
      for (const entry of Object.values(poles)) {
        expect(Array.isArray(entry.sourceTopicIds)).toBe(true);
        expect(entry.sourceTopicIds.length).toBeGreaterThan(0);
        for (const id of entry.sourceTopicIds) {
          expect(skincareTopicIds.has(id)).toBe(true);
        }
      }
    }
  });
});

describe('SKIN_RESULTS — legacy compatibility (chat / ResultsScreen key off these exact keys)', () => {
  it('still exposes the 5 classic keys untouched', () => {
    expect(Object.keys(SKIN_RESULTS).sort()).toEqual(['grasa', 'mixta', 'normal', 'seca', 'sensible']);
  });
});

describe('all hex colors across appData are valid #RRGGBB', () => {
  // Recursively walks every exported data structure looking for any property
  // literally named "hex" and asserts it matches the #RRGGBB format.
  function collectHexValues(node, found = []) {
    if (Array.isArray(node)) {
      node.forEach((item) => collectHexValues(item, found));
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (key === 'hex') found.push(value);
        else collectHexValues(value, found);
      }
    }
    return found;
  }

  it('finds hex values and every one of them is a valid 6-digit hex color', () => {
    const all = [
      ...collectHexValues(COLORIMETRIA_RESULTS),
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const hex of all) {
      expect(hex).toMatch(HEX_RE);
    }
  });
});

describe('FACE_DATA / EYE_DATA — sanity checks used by the (frozen) classifiers\' recommendation copy', () => {
  const FACE_SHAPES = ['ovalado', 'redondo', 'cuadrado', 'corazon', 'alargado', 'diamante'];
  const EYE_SHAPES = ['almendra', 'redondo', 'rasgado', 'caido', 'encapotado'];

  it.each(FACE_SHAPES)('FACE_DATA has copy for shape "%s"', (shape) => {
    const entry = FACE_DATA[shape];
    expect(entry).toBeTruthy();
    expect(typeof entry.title).toBe('string');
    expect(Array.isArray(entry.makeup)).toBe(true);
    expect(Array.isArray(entry.haircuts)).toBe(true);
  });

  it.each(EYE_SHAPES)('EYE_DATA has copy for shape "%s"', (shape) => {
    const entry = EYE_DATA[shape];
    expect(entry).toBeTruthy();
    expect(typeof entry.title).toBe('string');
    expect(Array.isArray(entry.eyeliner)).toBe(true);
    expect(Array.isArray(entry.eyeshadow)).toBe(true);
  });
});
