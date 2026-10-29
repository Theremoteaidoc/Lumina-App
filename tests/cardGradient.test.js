import { describe, it, expect } from 'vitest';
import { getCardGradient, getCardGradientActive } from '../src/utils/cardGradient.js';

const GRADIENT_RE = /^linear-gradient\(\d+deg, rgb\(\d+, \d+, \d+\) 0%, rgb\(\d+, \d+, \d+\) 100%\)$/;

function stops(css) {
  const matches = [...css.matchAll(/rgb\((\d+), (\d+), (\d+)\)/g)];
  return matches.map(([, r, g, b]) => `rgb(${r}, ${g}, ${b})`);
}

describe('getCardGradient', () => {
  it('returns a valid CSS linear-gradient string', () => {
    const css = getCardGradient(0, 4);
    expect(css).toMatch(GRADIENT_RE);
  });

  it('cascades: the end color of card N matches the start color of card N+1', () => {
    const total = 5;
    for (let i = 0; i < total - 1; i++) {
      const [, endOfCurrent] = stops(getCardGradient(i, total));
      const [startOfNext] = stops(getCardGradient(i + 1, total));
      expect(endOfCurrent).toBe(startOfNext);
    }
  });

  it('handles total = 1 without crashing, returning a valid gradient', () => {
    const css = getCardGradient(0, 1);
    expect(css).toMatch(GRADIENT_RE);
  });

  it('handles total = 0 without crashing, returning a valid gradient', () => {
    const css = getCardGradient(0, 0);
    expect(css).toMatch(GRADIENT_RE);
  });

  it('respects a custom angle', () => {
    const css = getCardGradient(0, 3, 90);
    expect(css.startsWith('linear-gradient(90deg,')).toBe(true);
  });
});

describe('getCardGradientActive', () => {
  it('returns a valid CSS linear-gradient string and cascades like the non-active variant', () => {
    const total = 3;
    expect(getCardGradientActive(0, total)).toMatch(GRADIENT_RE);
    for (let i = 0; i < total - 1; i++) {
      const [, endOfCurrent] = stops(getCardGradientActive(i, total));
      const [startOfNext] = stops(getCardGradientActive(i + 1, total));
      expect(endOfCurrent).toBe(startOfNext);
    }
  });

  it('handles total = 1 without crashing', () => {
    expect(getCardGradientActive(0, 1)).toMatch(GRADIENT_RE);
  });
});
