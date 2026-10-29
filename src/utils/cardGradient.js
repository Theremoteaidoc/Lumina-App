// Sequential gradient helper — produces a connected color cascade across N cards.
// Each card's lighter end is exactly the next card's darker start.

// Brand gradient endpoints (from approved palette)
const GRADIENT_START = { r: 250, g: 147, b: 165 }; // #FA93A5 — coral pink (darkest)
const GRADIENT_END   = { r: 255, g: 232, b: 238 }; // #FFE8EE — very light pink (lightest)

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function interpolate(start, end, t) {
  return {
    r: lerp(start.r, end.r, t),
    g: lerp(start.g, end.g, t),
    b: lerp(start.b, end.b, t),
  };
}

function rgb({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Returns a linear-gradient CSS string for the card at `index` out of `total`.
 * Card 0 starts at the darkest stop, card (total-1) ends at the lightest stop.
 * Each card's end color = next card's start color, creating a seamless cascade.
 *
 * @param {number} index - zero-based position of this card in the list
 * @param {number} total - total number of cards in the list
 * @param {number} [angle=135] - gradient angle in degrees
 * @returns {string} CSS linear-gradient value
 */
export function getCardGradient(index, total, angle = 135) {
  if (total <= 1) {
    return `linear-gradient(${angle}deg, ${rgb(GRADIENT_START)} 0%, ${rgb(GRADIENT_END)} 100%)`;
  }
  const t1 = index / total;
  const t2 = (index + 1) / total;
  const c1 = interpolate(GRADIENT_START, GRADIENT_END, t1);
  const c2 = interpolate(GRADIENT_START, GRADIENT_END, t2);
  return `linear-gradient(${angle}deg, ${rgb(c1)} 0%, ${rgb(c2)} 100%)`;
}

/**
 * Same as getCardGradient but for SELECTED/active state — more saturated tones.
 * Used when a card is currently selected (e.g., onboarding options).
 *
 * @param {number} index - zero-based position of this card in the list
 * @param {number} total - total number of cards in the list
 * @param {number} [angle=135] - gradient angle in degrees
 * @returns {string} CSS linear-gradient value
 */
export function getCardGradientActive(index, total, angle = 135) {
  const ACTIVE_START = { r: 234, g: 120, b: 138 }; // #EA788A — darker coral
  const ACTIVE_END   = { r: 255, g: 196, b: 209 }; // #FFC4D1 — palette light pink
  if (total <= 1) {
    return `linear-gradient(${angle}deg, ${rgb(ACTIVE_START)} 0%, ${rgb(ACTIVE_END)} 100%)`;
  }
  const t1 = index / total;
  const t2 = (index + 1) / total;
  const c1 = interpolate(ACTIVE_START, ACTIVE_END, t1);
  const c2 = interpolate(ACTIVE_START, ACTIVE_END, t2);
  return `linear-gradient(${angle}deg, ${rgb(c1)} 0%, ${rgb(c2)} 100%)`;
}
