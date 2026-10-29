import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getLuminaReply } from '../src/utils/luminaChat.js';

// Math.random is mocked to 0 for the whole file so every `pick(arr)` call
// deterministically resolves to arr[0] — this lets us assert on exact
// template text instead of just "some non-empty string".
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLuminaReply — intent detection', () => {
  it('detects a greeting ("holiii")', () => {
    const r = getLuminaReply('holiii', null, []);
    expect(r.text).toBe('Hola — ¿qué te ronda la mente hoy?');
  });

  it('detects a greeting phrase ("ke onda")', () => {
    const r = getLuminaReply('ke onda', null, []);
    expect(r.text).toBe('Hola — ¿qué te ronda la mente hoy?');
  });

  it('detects thanks ("grax")', () => {
    const r = getLuminaReply('grax', null, []);
    expect(r.text).toBe('Con todo gusto, para eso estoy.');
  });

  it('detects a farewell ("byee")', () => {
    const r = getLuminaReply('byee', null, []);
    expect(r.text).toBe('Cuídate mucho — aquí estaré cuando quieras volver.');
  });

  it('detects casual laughter ("jajaja")', () => {
    const r = getLuminaReply('jajaja', null, []);
    expect(r.text).toBe('Jaja me encanta esa energía ✨ ¿en qué te ayudo?');
  });

  it('detects colorimetría intent ("q colores me van?")', () => {
    const r = getLuminaReply('q colores me van?', null, []);
    expect(r.text).toMatch(/colorimetr/i);
  });

  it('detects skin intent ("tengo barros")', () => {
    const r = getLuminaReply('tengo barros', null, []);
    expect(r.text).toMatch(/piel|limpiador|hidratante/i);
  });

  it('detects an emotional message ("me siento re mal")', () => {
    const r = getLuminaReply('me siento re mal', null, []);
    // Emotional replies always weave in an affirmation card wrapped in quotes.
    expect(r.text).toMatch(/"/);
    expect(r.text.length).toBeGreaterThan(20);
  });

  it('detects a self-harm safety signal ("quiero morir") and includes a help line', () => {
    const r = getLuminaReply('quiero morir', null, []);
    expect(r.text).toMatch(/línea de la vida/i);
    expect(r.text).toMatch(/800 911 2000/);
  });

  it('falls back gracefully on gibberish ("asdfgh")', () => {
    const r = getLuminaReply('asdfgh', null, []);
    expect(r.text).toBe(
      'Creo que no entendí del todo eso — ¿me lo cuentas de otra forma? Se me da bien hablar de piel, colores, maquillaje, forma de rostro, y también acompañarte en los días difíciles.'
    );
  });
});

describe('getLuminaReply — robustness (never throws)', () => {
  const badInputs = ['', '   ', null, undefined, '😀😀😀🔥✨', 'a'.repeat(5000), 123, {}, []];

  it.each(badInputs)('does not throw and returns a valid reply for input %p', (input) => {
    let result;
    expect(() => { result = getLuminaReply(input, null, []); }).not.toThrow();
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    expect(typeof result.delayMs).toBe('number');
    expect(result.delayMs).toBeGreaterThan(0);
  });

  it('never throws even when profile/history are malformed', () => {
    expect(() => getLuminaReply('hola', 'not-an-object', 'not-an-array')).not.toThrow();
    expect(() => getLuminaReply('hola', undefined, undefined)).not.toThrow();
  });
});

describe('getLuminaReply — always returns the expected shape', () => {
  it('returns { text: non-empty string, delayMs: number }', () => {
    const r = getLuminaReply('hola', null, []);
    expect(r).toEqual(
      expect.objectContaining({
        text: expect.any(String),
        delayMs: expect.any(Number),
      })
    );
    expect(r.text.length).toBeGreaterThan(0);
  });
});

describe('getLuminaReply — profile awareness', () => {
  it('does NOT invite to the colorimetría test when the profile already has a colorSubtono', () => {
    const profile = { colorSubtono: 'frio', colorCode: 'F1' };
    const r = getLuminaReply('q colores me van?', profile, []);
    expect(r.text).not.toMatch(/haz(te)? el test de colorimetr/i);
    expect(r.text).not.toMatch(/hiciste el test de colorimetr/i);
    expect(r.text).toMatch(/frio/i);
  });
});
