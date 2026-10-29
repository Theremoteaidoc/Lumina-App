// ═══════════════════════════════════════════════
// RETRATO LUMINA — genera una imagen "story" vertical (1080×1920)
// con Canvas API nativa (sin librerías). Todo ocurre en el dispositivo,
// nada se sube a ningún servidor.
// ═══════════════════════════════════════════════

import { FACE_DATA, COLORIMETRIA_RESULTS, SKIN_RESULTS } from '../data/appData';

const W = 1080;
const H = 1920;

const FONT_TITLE = "'Cormorant Garamond', Georgia, serif";

// ─── Helpers ────────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draws `img` clipped into a circle centered at (cx, cy) with radius r,
// covering the circle (crop to center, like CSS object-fit: cover).
function drawCircleImage(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const size = r * 2;
  const scale = Math.max(size / iw, size / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = cx - dw / 2;
  const dy = cy - dh / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Word-wraps `text` to fit within `maxWidth`, using the font currently set on ctx.
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawSparkles(ctx) {
  const points = [
    [110, 90, 5], [960, 130, 4], [90, 260, 3], [990, 300, 5],
    [70, 1700, 4], [1000, 1680, 3], [140, 1780, 5], [950, 1760, 4],
    [60, 950, 3], [1010, 900, 4],
  ];
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  points.forEach(([x, y, s]) => {
    ctx.beginPath();
    ctx.moveTo(x, y - s * 2);
    ctx.lineTo(x + s * 0.6, y - s * 0.6);
    ctx.lineTo(x + s * 2, y);
    ctx.lineTo(x + s * 0.6, y + s * 0.6);
    ctx.lineTo(x, y + s * 2);
    ctx.lineTo(x - s * 0.6, y + s * 0.6);
    ctx.lineTo(x - s * 2, y);
    ctx.lineTo(x - s * 0.6, y - s * 0.6);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

// ─── Main export ────────────────────────────────────────────────────────────

export async function generarRetrato(profile = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fonts: best effort — if it fails, canvas falls back to Georgia/serif anyway.
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
      await Promise.all([
        document.fonts.load('600 72px "Cormorant Garamond"'),
        document.fonts.load('italic 500 40px "Cormorant Garamond"'),
      ]);
    }
  } catch {
    // ignore — fallback fonts will render
  }

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#FFC4D1');
  bg.addColorStop(0.5, '#FFD9E1');
  bg.addColorStop(1, '#FFF6F8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Decorative inner border ──
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  roundRect(ctx, 34, 34, W - 68, H - 68, 60);
  ctx.stroke();
  ctx.restore();

  drawSparkles(ctx);

  // ── Title ──
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#82626E';
  ctx.font = `italic 600 62px ${FONT_TITLE}`;
  ctx.fillText('✨ Mi Retrato Lumina', W / 2, 150);

  // ── Avatar ──
  const avatarCx = W / 2;
  const avatarCy = 340;
  const avatarR = 150;

  // White border ring
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR + 8, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  let avatarLoaded = false;
  if (profile.avatar) {
    try {
      const img = await loadImage(profile.avatar);
      drawCircleImage(ctx, img, avatarCx, avatarCy, avatarR);
      avatarLoaded = true;
    } catch {
      avatarLoaded = false;
    }
  }

  if (!avatarLoaded) {
    const grad = ctx.createLinearGradient(
      avatarCx - avatarR, avatarCy - avatarR,
      avatarCx + avatarR, avatarCy + avatarR
    );
    grad.addColorStop(0, '#FA93A5');
    grad.addColorStop(1, '#FFC4D1');
    ctx.beginPath();
    ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    const initial = profile.name?.trim()?.[0]?.toUpperCase() || '✨';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 140px ${FONT_TITLE}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, avatarCx, avatarCy + 12);
  }

  // ── Name ──
  const name = profile.name?.trim();
  let nameBottomY = avatarCy + avatarR + 40;
  if (name) {
    ctx.fillStyle = '#3F2A33';
    ctx.font = `600 76px ${FONT_TITLE}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, W / 2, nameBottomY + 40);
    nameBottomY += 90;
  }

  // ── Result cards (only the ones that exist) ──
  const faceInfo = profile.faceShape ? FACE_DATA[profile.faceShape] : null;
  const colorInfo = profile.colorSubtono ? COLORIMETRIA_RESULTS[profile.colorSubtono] : null;
  const skinInfo = profile.skinType ? SKIN_RESULTS[profile.skinType] : null;

  const cardX = 120;
  const cardW = 840;
  const cardGap = 24;
  const simpleCardH = 130;
  const colorCardH = 210;

  const cards = [];
  if (faceInfo) cards.push({ type: 'simple', h: simpleCardH, text: `📸 ${faceInfo.title}` });
  if (colorInfo) cards.push({ type: 'color', h: colorCardH, info: colorInfo });
  if (skinInfo) cards.push({ type: 'simple', h: simpleCardH, text: `${skinInfo.icon} ${skinInfo.title}` });

  const bandTop = nameBottomY + 30;
  const bandBottom = 1560;
  const totalCardsH = cards.reduce((sum, c) => sum + c.h, 0) + cardGap * Math.max(0, cards.length - 1);
  let cardY = bandTop + Math.max(0, (bandBottom - bandTop - totalCardsH) / 2);

  cards.forEach((card) => {
    roundRect(ctx, cardX, cardY, cardW, card.h, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();

    if (card.type === 'simple') {
      ctx.fillStyle = '#3F2A33';
      ctx.font = `600 46px ${FONT_TITLE}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.text, W / 2, cardY + card.h / 2);
    } else if (card.type === 'color') {
      const { info } = card;
      const codeText = profile.colorCode ? `  ·  ${profile.colorCode}` : '';
      ctx.fillStyle = '#3F2A33';
      ctx.font = `600 46px ${FONT_TITLE}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🎨 ${info.title}${codeText}`, W / 2, cardY + 62);

      const swatches = (info.colors || []).slice(0, 5);
      const swatchR = 22;
      const swatchGap = 26;
      const totalSwatchW = swatches.length * (swatchR * 2) + (swatches.length - 1) * swatchGap;
      let sx = W / 2 - totalSwatchW / 2 + swatchR;
      const sy = cardY + card.h - 56;
      swatches.forEach((c) => {
        ctx.beginPath();
        ctx.arc(sx, sy, swatchR, 0, Math.PI * 2);
        ctx.fillStyle = c.hex;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
        sx += swatchR * 2 + swatchGap;
      });
    }

    cardY += card.h + cardGap;
  });

  // ── Lema (word-wrapped) ──
  ctx.fillStyle = '#82626E';
  ctx.font = `italic 500 44px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const phraseLines = wrapText(
    ctx,
    'Conocerte no es criticarte. Cuidarte no es compararte.',
    780
  );
  const lineHeight = 58;
  let phraseY = 1650;
  phraseLines.forEach((line) => {
    ctx.fillText(line, W / 2, phraseY);
    phraseY += lineHeight;
  });

  // ── Footer ──
  ctx.fillStyle = '#9F838E';
  ctx.font = `34px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('hecho con Lumina 🌸', W / 2, 1850);

  return canvas.toDataURL('image/png');
}
