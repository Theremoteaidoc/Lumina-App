// ═══════════════════════════════════════════════
// BAUMANN SKIN TYPE — pure helpers (age-adaptive)
//
// The Baumann Skin Type Indicator (BSTI, Dra. Leslie Baumann, 2008) scores
// skin across independent binary axes instead of a single 5-way bucket:
//   hydration:   O (oleosa/grasa)      vs D (seca)
//   sensitivity: S (sensible)          vs R (resistente)
//   pigmentation:P (pigmentada)        vs N (no pigmentada)
//   firmness:    W (arrugas)           vs T (tersa)   — only shown 26+
//
// These helpers are intentionally pure (no DOM, no localStorage) so they're
// easy to unit test from tests/baumann.test.js.
// ═══════════════════════════════════════════════

const AXIS_ORDER = ['hydration', 'sensitivity', 'pigmentation', 'firmness'];

// Canonical pole order per axis — the first pole listed wins ties.
const AXIS_POLES = {
  hydration: ['O', 'D'],
  sensitivity: ['S', 'R'],
  pigmentation: ['P', 'N'],
  firmness: ['W', 'T'],
};

/**
 * Computes the Baumann-style code + per-axis result from a set of answers.
 * Only questions carrying a recognized `axis` field are scored — multi-select
 * preference questions (no `axis`) are ignored automatically.
 * Age-adaptive: if none of the given `questions` belong to the 'firmness'
 * axis (i.e. they were filtered out for a younger user), `axes.firmness` is
 * `null` and the returned `code` has 3 letters instead of 4.
 *
 * @param {Array<string|string[]>} answers - answers parallel to `questions`
 * @param {Array<{axis?: string}>} questions - question defs actually shown to the user
 * @returns {{ code: string, axes: { hydration: string|null, sensitivity: string|null, pigmentation: string|null, firmness: string|null } }}
 */
export function computeBaumannCode(answers, questions) {
  const counts = { hydration: {}, sensitivity: {}, pigmentation: {}, firmness: {} };

  questions.forEach((q, i) => {
    if (!q.axis || !AXIS_POLES[q.axis]) return;
    const answer = answers[i];
    if (typeof answer !== 'string') return;
    counts[q.axis][answer] = (counts[q.axis][answer] || 0) + 1;
  });

  const axes = {};
  for (const axis of AXIS_ORDER) {
    const poles = AXIS_POLES[axis];
    const axisCounts = counts[axis];
    const totalAnswers = poles.reduce((sum, p) => sum + (axisCounts[p] || 0), 0);
    if (totalAnswers === 0) {
      axes[axis] = null;
      continue;
    }
    axes[axis] = poles.reduce(
      (best, pole) => ((axisCounts[pole] || 0) > (axisCounts[best] || 0) ? pole : best),
      poles[0]
    );
  }

  const code = AXIS_ORDER
    .filter((axis) => axes[axis])
    .map((axis) => axes[axis])
    .join('');

  return { code, axes };
}

/**
 * Maps the new Baumann axes to the legacy 5-way `skinType` key
 * ('grasa' | 'seca' | 'sensible' | 'mixta' | 'normal') so the chat
 * (luminaChat.js) and ResultsScreen.jsx — which both key off
 * `profile.skinType` with those exact strings — keep working unchanged.
 * This is an accepted approximation, not a lossless mapping.
 *
 * @param {{ hydration: string|null, sensitivity: string|null }} axes
 * @returns {'grasa'|'seca'|'sensible'}
 */
export function mapAxesToLegacySkinType(axes) {
  if (axes.sensitivity === 'S') return 'sensible';
  return axes.hydration === 'O' ? 'grasa' : 'seca';
}

function joinEs(parts) {
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
}

/**
 * Composes a friendly Spanish title from the computed axes, e.g.
 * "Piel grasa y sensible" or "Piel seca, con tendencia a manchas".
 *
 * @param {{ hydration: string|null, sensitivity: string|null, pigmentation: string|null, firmness: string|null }} axes
 * @param {Object} baumannAxesData - the BAUMANN_AXES export from appData.js
 * @returns {string}
 */
export function composeSkinTitle(axes, baumannAxesData) {
  const parts = [];
  if (axes.hydration) parts.push(baumannAxesData.hydration[axes.hydration].label.toLowerCase());
  if (axes.sensitivity === 'S') parts.push('sensible');
  if (axes.pigmentation === 'P') parts.push('con tendencia a manchas');
  if (axes.firmness === 'W') parts.push('con líneas de expresión');
  if (parts.length === 0) return 'Tu tipo de piel';
  return `Piel ${joinEs(parts)}`;
}
