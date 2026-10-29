// ═══════════════════════════════════════════════
// hairSwatch — shared "glossy hair strand" swatch look.
// Used by LookbookScreen (CSS) and CollageScreen (CSS + canvas export)
// so both render the exact same silky gradient + diagonal shine.
// ═══════════════════════════════════════════════

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// amt in [0,1] — mixes hex toward white (lighten) or black (darken)
export function lighten(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({
    r: r + (255 - r) * amt,
    g: g + (255 - g) * amt,
    b: b + (255 - b) * amt,
  });
}

export function darken(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r * (1 - amt), g: g * (1 - amt), b: b * (1 - amt) });
}

// CSS background for the glossy hair-strand look: a diagonal shine layered
// over a vertical light→dark gradient. Multiple backgrounds are stacked via
// comma-separated gradients — no extra DOM nodes needed.
export function hairGlossCss(hex) {
  const top = lighten(hex, 0.4);
  const bottom = darken(hex, 0.3);
  return {
    backgroundImage: `linear-gradient(120deg, transparent 38%, rgba(255,255,255,0.5) 50%, transparent 62%), linear-gradient(180deg, ${top} 0%, ${hex} 55%, ${bottom} 100%)`,
  };
}

// Draws the same glossy strand look onto a canvas 2D context, clipped to a
// rounded rect at (x, y, w, h). Used by the collage export so PNG shares
// look identical to what the girl saw while editing.
export function drawHairGlossRect(ctx, hex, x, y, w, h, radius) {
  const top = lighten(hex, 0.4);
  const bottom = darken(hex, 0.3);

  ctx.save();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  const base = ctx.createLinearGradient(x, y, x, y + h);
  base.addColorStop(0, top);
  base.addColorStop(0.55, hex);
  base.addColorStop(1, bottom);
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);

  const shine = ctx.createLinearGradient(x, y, x + w * 0.55, y + h);
  shine.addColorStop(0.34, 'rgba(255,255,255,0)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.45)');
  shine.addColorStop(0.66, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(x, y, w, h);

  ctx.restore();
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
