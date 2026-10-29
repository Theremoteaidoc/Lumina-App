import { useState, useRef, useEffect } from 'react';
import { getProfile } from '../utils/profile';
import { COLORIMETRIA_RESULTS } from '../data/appData';
import { hairGlossCss, drawHairGlossRect, roundRectPath } from '../utils/hairSwatch';

// ═══════════════════════════════════════════════
// Mi Tablero de Looks — free-form collage/moodboard editor.
// 100% local: photos + boards live only in localStorage (compressed).
// Nothing leaves the device until the girl taps "Compartir" herself.
// ═══════════════════════════════════════════════

const BOARDS_KEY = 'lumina_collages';
const DRAFT_KEY = 'lumina_collage_draft';
const MAX_IMAGES = 20;
const MAX_IMG_DIM = 800;
const JPEG_QUALITY = 0.7;

// Export/reference resolution — a vertical "story" canvas (4:5-ish, tall).
const EXPORT_W = 1080;
const EXPORT_H = 1350;

const MIN_SIZE_PCT = 8;
const MAX_SIZE_PCT = 95;

// ─── Fonts available for text elements (diverse on purpose) ─────────────────
// Loaded via the Google Fonts @import in global.css.
const COLLAGE_FONTS = [
  { name: 'Manuscrita', fontFamily: "'Dancing Script', cursive" },
  { name: 'Impacto', fontFamily: "'Bebas Neue', sans-serif" },
  { name: 'A mano', fontFamily: "'Caveat', cursive" },
  { name: 'Elegante', fontFamily: "'Playfair Display', Georgia, serif" },
  { name: 'Clásica', fontFamily: "'Cormorant Garamond', Georgia, serif" },
  { name: 'Moderna', fontFamily: "'Quicksand', sans-serif" },
  { name: 'Limpia', fontFamily: "'DM Sans', sans-serif" },
];

const TEXT_COLORS = [
  '#5A3D4A', '#82626E', '#B5707E', '#E8A0B4',
  '#FFFFFF', '#3B2A22', '#2E4057', '#5C1A2E',
];

const FRAME_OPTIONS = [
  { id: 'none', label: 'Sin marco' },
  { id: 'white', label: 'Blanco fino' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'rounded', label: 'Redondeado' },
  { id: 'vintage', label: 'Película' },
  { id: 'scrapbook', label: 'Scrapbook' },
];

const BACKGROUND_OPTIONS = [
  { id: 'cream', label: 'Crema', css: '#FFF6F8', canvasFill: (ctx, w, h) => fillSolid(ctx, w, h, '#FFF6F8') },
  { id: 'white', label: 'Blanco', css: '#FFFFFF', canvasFill: (ctx, w, h) => fillSolid(ctx, w, h, '#FFFFFF') },
  { id: 'blush', label: 'Rosa suave', css: '#FFD9E1', canvasFill: (ctx, w, h) => fillSolid(ctx, w, h, '#FFD9E1') },
  { id: 'mauve', label: 'Malva', css: '#EFDEE2', canvasFill: (ctx, w, h) => fillSolid(ctx, w, h, '#EFDEE2') },
  {
    id: 'sunset', label: 'Atardecer',
    css: 'linear-gradient(160deg, #FFC4D1 0%, #FFF6F8 100%)',
    canvasFill: (ctx, w, h) => fillGradient(ctx, w, h, '#FFC4D1', '#FFF6F8'),
  },
  {
    id: 'dawn', label: 'Amanecer',
    css: 'linear-gradient(160deg, #E8D5C4 0%, #FFF6F8 100%)',
    canvasFill: (ctx, w, h) => fillGradient(ctx, w, h, '#E8D5C4', '#FFF6F8'),
  },
];

function fillSolid(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

function fillGradient(ctx, w, h, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function getBackground(id) {
  return BACKGROUND_OPTIONS.find((b) => b.id === id) || BACKGROUND_OPTIONS[0];
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function slug(str) {
  return (str || 'tablero')
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'tablero';
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function loadBoards() {
  try {
    const raw = localStorage.getItem(BOARDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistBoards(list) {
  try {
    localStorage.setItem(BOARDS_KEY, JSON.stringify(list));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

// ─── Image compression: file → capped-size JPEG dataURL ─────────────────────
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      let w = iw;
      let h = ih;
      if (Math.max(w, h) > MAX_IMG_DIM) {
        const scale = MAX_IMG_DIM / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), aspect: iw / ih });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Element factories ────────────────────────────────────────────────────────

function newImageElement(dataUrl, aspect, index) {
  const w = 42;
  const h = clamp((w * (EXPORT_W / EXPORT_H)) / (aspect || 1), 14, 88);
  return {
    id: uid(),
    type: 'image',
    src: dataUrl,
    x: clamp(10 + (index % 4) * 7, 0, 100 - w),
    y: clamp(10 + (index % 4) * 7, 0, 100 - h),
    w, h, rotation: 0, frame: 'none',
  };
}

function newTextElement(index) {
  return {
    id: uid(),
    type: 'text',
    x: 18 + (index % 3) * 5,
    y: 30 + (index % 3) * 5,
    w: 62, h: 14, rotation: 0,
    text: 'Toca «Editar texto»',
    font: COLLAGE_FONTS[0].fontFamily,
    color: '#5A3D4A',
    fontSize: 6.5, // percentage of canvas HEIGHT
  };
}

function newSwatchElement(hex, name, index) {
  return {
    id: uid(),
    type: 'swatch',
    x: 22 + (index % 3) * 5,
    y: 25 + (index % 3) * 5,
    w: 18, h: 26, rotation: 0,
    hex, name,
  };
}

function newBoard(index) {
  return {
    id: uid(),
    name: `Mi look ${index + 1}`,
    date: new Date().toISOString(),
    background: 'cream',
    elements: [],
  };
}

// ─── Frame geometry — shared by CSS preview and canvas export so both match ──
function computeFrameBox(frameKey, w, h) {
  const minSide = Math.min(w, h);
  switch (frameKey) {
    case 'white':
      return {
        padTop: w * 0.035, padRight: w * 0.035, padBottom: w * 0.035, padLeft: w * 0.035,
        bg: '#FFFFFF', outerRadius: minSide * 0.05, innerRadius: Math.max(0, minSide * 0.05 - w * 0.035),
        filter: null, tape: false, shadow: true,
      };
    case 'polaroid':
      return {
        padTop: w * 0.05, padRight: w * 0.05, padBottom: h * 0.16, padLeft: w * 0.05,
        bg: '#FFFFFF', outerRadius: minSide * 0.015, innerRadius: 0,
        filter: null, tape: false, shadow: true,
      };
    case 'rounded':
      return {
        padTop: 0, padRight: 0, padBottom: 0, padLeft: 0,
        bg: null, outerRadius: minSide * 0.16, innerRadius: minSide * 0.16,
        filter: null, tape: false, shadow: false,
      };
    case 'vintage':
      return {
        padTop: w * 0.045, padRight: w * 0.045, padBottom: w * 0.045, padLeft: w * 0.045,
        bg: '#171311', outerRadius: minSide * 0.015, innerRadius: 0,
        filter: 'sepia(0.3) contrast(1.08) saturate(0.9)', tape: false, shadow: true,
      };
    case 'scrapbook':
      return {
        padTop: w * 0.055, padRight: w * 0.055, padBottom: w * 0.055, padLeft: w * 0.055,
        bg: '#FFFFFF', outerRadius: minSide * 0.025, innerRadius: 0,
        filter: null, tape: true, shadow: true,
      };
    default: // 'none'
      return {
        padTop: 0, padRight: 0, padBottom: 0, padLeft: 0,
        bg: null, outerRadius: 0, innerRadius: 0,
        filter: null, tape: false, shadow: false,
      };
  }
}

// ─── Canvas text word-wrap (respects manual line breaks too) ────────────────
function wrapCanvasText(ctx, text, maxWidth) {
  const paragraphs = String(text || '').split('\n');
  const lines = [];
  for (const para of paragraphs) {
    if (para === '') { lines.push(''); continue; }
    const words = para.split(' ');
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
  }
  return lines.length ? lines : [''];
}

function primaryFamily(fontFamilyCss) {
  const first = String(fontFamilyCss).split(',')[0].trim();
  return first.replace(/^['"]|['"]$/g, '');
}

// ─── Export: draw the whole board onto a high-res canvas → PNG dataURL ──────
async function exportBoardToDataUrl(board) {
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext('2d');

  // Preload custom fonts so text renders correctly instead of falling back.
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
      const usedFamilies = new Set(
        board.elements.filter((e) => e.type === 'text').map((e) => primaryFamily(e.font))
      );
      await Promise.all(
        [...usedFamilies].map((fam) => document.fonts.load(`600 60px "${fam}"`).catch(() => {}))
      );
    }
  } catch {
    // fallback fonts render fine if this fails
  }

  getBackground(board.background).canvasFill(ctx, EXPORT_W, EXPORT_H);

  for (const el of board.elements) {
    const x = (el.x / 100) * EXPORT_W;
    const y = (el.y / 100) * EXPORT_H;
    const w = (el.w / 100) * EXPORT_W;
    const h = (el.h / 100) * EXPORT_H;
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);

    if (el.type === 'image') {
      await drawImageElementToCanvas(ctx, el, w, h);
    } else if (el.type === 'text') {
      drawTextElementToCanvas(ctx, el, w, h);
    } else if (el.type === 'swatch') {
      drawHairGlossRect(ctx, el.hex, 0, 0, w, h, Math.min(w, h) * 0.28);
    }

    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

async function drawImageElementToCanvas(ctx, el, w, h) {
  const box = computeFrameBox(el.frame, w, h);

  if (box.bg) {
    ctx.save();
    if (box.shadow) {
      ctx.shadowColor = 'rgba(60,30,40,0.35)';
      ctx.shadowBlur = Math.max(w, h) * 0.04;
      ctx.shadowOffsetY = Math.max(w, h) * 0.015;
    }
    roundRectPath(ctx, 0, 0, w, h, box.outerRadius);
    ctx.fillStyle = box.bg;
    ctx.fill();
    ctx.restore();
  }

  const ix = box.padLeft;
  const iy = box.padTop;
  const iw = Math.max(1, w - box.padLeft - box.padRight);
  const ih = Math.max(1, h - box.padTop - box.padBottom);

  try {
    const img = await loadImage(el.src);
    ctx.save();
    roundRectPath(ctx, ix, iy, iw, ih, box.innerRadius);
    ctx.clip();
    if (box.filter) ctx.filter = box.filter;
    const iwImg = img.naturalWidth || img.width;
    const ihImg = img.naturalHeight || img.height;
    const scale = Math.max(iw / iwImg, ih / ihImg);
    const dw = iwImg * scale;
    const dh = ihImg * scale;
    ctx.drawImage(img, ix + (iw - dw) / 2, iy + (ih - dh) / 2, dw, dh);
    ctx.restore();
  } catch {
    roundRectPath(ctx, ix, iy, iw, ih, box.innerRadius);
    ctx.fillStyle = '#F2D9DE';
    ctx.fill();
  }

  if (box.tape) {
    ctx.save();
    ctx.translate(w / 2, 0);
    ctx.rotate(-0.06);
    ctx.fillStyle = 'rgba(255, 214, 224, 0.85)';
    ctx.fillRect(-w * 0.14, -h * 0.035, w * 0.28, h * 0.07);
    ctx.restore();
  }
}

function drawTextElementToCanvas(ctx, el, w, h) {
  const fontSizePx = (el.fontSize / 100) * EXPORT_H;
  ctx.fillStyle = el.color;
  ctx.font = `600 ${fontSizePx}px ${el.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrapCanvasText(ctx, el.text, w * 0.92);
  const lineHeight = fontSizePx * 1.18;
  let ly = h / 2 - (lineHeight * (lines.length - 1)) / 2;
  for (const line of lines) {
    ctx.fillText(line, w / 2, ly);
    ly += lineHeight;
  }
}

// ═══════════════════════════════════════════════
// UI pieces
// ═══════════════════════════════════════════════

function ImageElementContent({ el, wPx, hPx }) {
  const box = computeFrameBox(el.frame, wPx, hPx);
  return (
    <div style={{
      width: '100%', height: '100%', boxSizing: 'border-box', position: 'relative',
      background: box.bg || 'transparent',
      borderRadius: box.outerRadius,
      boxShadow: box.shadow ? '0 6px 16px rgba(60,30,40,0.28)' : 'none',
      padding: `${box.padTop}px ${box.padRight}px ${box.padBottom}px ${box.padLeft}px`,
    }}>
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: box.innerRadius }}>
        <img
          src={el.src}
          draggable={false}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: box.filter || 'none', display: 'block' }}
        />
      </div>
      {box.tape && (
        <div style={{
          position: 'absolute', top: -hPx * 0.02, left: '50%',
          transform: 'translateX(-50%) rotate(-3.5deg)',
          width: wPx * 0.28, height: hPx * 0.07,
          background: 'rgba(255,214,224,0.85)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      )}
    </div>
  );
}

function TextElementContent({ el, canvasHeightPx }) {
  const fontSizePx = (el.fontSize / 100) * canvasHeightPx;
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: el.font, color: el.color, fontSize: `${fontSizePx}px`, fontWeight: 600,
      textAlign: 'center', lineHeight: 1.18, wordBreak: 'break-word',
      whiteSpace: 'pre-wrap', padding: 4, userSelect: 'none', boxSizing: 'border-box',
    }}>
      {el.text || 'Toca «Editar texto»'}
    </div>
  );
}

function SwatchElementContent({ el }) {
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: '22% 22% 10% 10%',
      ...hairGlossCss(el.hex),
      border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: '0 4px 12px rgba(130,98,110,0.25)',
      boxSizing: 'border-box',
    }} />
  );
}

function ElementView({ el, selected, canvasSize, onPointerDownMove, onPointerDownResize }) {
  const wPx = (el.w / 100) * canvasSize.w;
  const hPx = (el.h / 100) * canvasSize.h;

  return (
    <div
      onPointerDown={(e) => onPointerDownMove(e, el)}
      style={{
        position: 'absolute',
        left: `${el.x}%`, top: `${el.y}%`,
        width: `${el.w}%`, height: `${el.h}%`,
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: 'center center',
        touchAction: 'none', cursor: 'grab', boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        outline: selected ? '2px dashed var(--pink)' : 'none', outlineOffset: 3,
      }}>
        {el.type === 'image' && <ImageElementContent el={el} wPx={wPx} hPx={hPx} />}
        {el.type === 'text' && <TextElementContent el={el} canvasHeightPx={canvasSize.h} />}
        {el.type === 'swatch' && <SwatchElementContent el={el} />}

        {selected && (
          <div
            onPointerDown={(e) => { e.stopPropagation(); onPointerDownResize(e, el); }}
            style={{
              position: 'absolute', right: -12, bottom: -12,
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--pink)', border: '3px solid white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              touchAction: 'none', cursor: 'nwse-resize',
            }}
          />
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({ label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, minHeight: 40, padding: '8px 12px', borderRadius: 12,
      border: '1px solid var(--border)', background: 'white',
      color: danger ? '#B5455A' : 'var(--text)', fontSize: 13, fontWeight: 500,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

function ElementToolbar({
  el, onRotate, onFront, onBack, onDelete, onDeselect,
  onFrameChange, onFontChange, onColorChange, onSizeChange, onEditText,
}) {
  if (!el) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      borderTop: '1px solid var(--border)',
      padding: '10px 14px',
    }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: el.type === 'swatch' ? 0 : 10 }}>
        <ToolbarBtn label="⟲ 15°" onClick={() => onRotate(-15)} />
        <ToolbarBtn label="⟳ 15°" onClick={() => onRotate(15)} />
        <ToolbarBtn label="⬆ Frente" onClick={onFront} />
        <ToolbarBtn label="⬇ Atrás" onClick={onBack} />
        <ToolbarBtn label="🗑️ Borrar" onClick={onDelete} danger />
        <ToolbarBtn label="✕" onClick={onDeselect} />
      </div>

      {el.type === 'image' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {FRAME_OPTIONS.map((f) => (
            <button key={f.id} onClick={() => onFrameChange(f.id)} style={{
              flexShrink: 0, padding: '7px 12px', borderRadius: 12,
              border: el.frame === f.id ? '1.5px solid var(--pink)' : '1px solid var(--border)',
              background: el.frame === f.id ? 'var(--gradient-card-hover)' : 'white',
              fontSize: 12, color: 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{f.label}</button>
          ))}
        </div>
      )}

      {el.type === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            <ToolbarBtn label="✏️ Editar texto" onClick={onEditText} />
            <ToolbarBtn label="A−" onClick={() => onSizeChange(-0.6)} />
            <ToolbarBtn label="A+" onClick={() => onSizeChange(0.6)} />
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {COLLAGE_FONTS.map((f) => (
              <button key={f.name} onClick={() => onFontChange(f.fontFamily)} style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 12,
                border: el.font === f.fontFamily ? '1.5px solid var(--pink)' : '1px solid var(--border)',
                background: 'white', fontFamily: f.fontFamily, fontSize: 15,
                color: 'var(--text)', cursor: 'pointer',
              }}>{f.name}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {TEXT_COLORS.map((c) => (
              <button key={c} onClick={() => onColorChange(c)} aria-label={c} style={{
                flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                background: c, border: el.color === c ? '2.5px solid var(--pink)' : '1px solid rgba(0,0,0,0.12)',
                cursor: 'pointer',
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BoardCard({ board, onOpen, onDelete }) {
  const firstImage = board.elements.find((e) => e.type === 'image');
  const imgCount = board.elements.filter((e) => e.type === 'image').length;
  const bgOpt = getBackground(board.background);
  return (
    <div
      className="card-hover"
      onClick={() => onOpen(board)}
      style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: 18,
        overflow: 'hidden', boxShadow: 'var(--shadow)', cursor: 'pointer', position: 'relative',
      }}
    >
      <div style={{ aspectRatio: '4 / 5', background: bgOpt.css, overflow: 'hidden' }}>
        {firstImage && (
          <img src={firstImage.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <p className="font-display" style={{ fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{board.name}</p>
        <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
          {imgCount} foto{imgCount !== 1 ? 's' : ''} · {formatDate(board.date)}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(board.id); }}
        aria-label="Borrar tablero"
        style={{
          position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', fontSize: 14,
        }}
      >🗑️</button>
    </div>
  );
}

function EmptyBoardsState({ onCreateNew }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,196,209,0.25))',
      backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.6)', borderRadius: 24, padding: '36px 24px', textAlign: 'center',
      boxShadow: '0 4px 24px rgba(250,147,165,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
    }}>
      <span style={{ fontSize: 44, display: 'block', marginBottom: 14 }}>🖼️</span>
      <h2 className="font-display" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>
        Tu primer tablero te espera
      </h2>
      <p style={{ fontSize: 13.5, color: 'var(--text-light)', lineHeight: 1.5, marginBottom: 22 }}>
        Combina fotos, texto y tus colores favoritos para armar el look que más te representa.
      </p>
      <button onClick={onCreateNew} className="btn-primary">Crear mi primer tablero</button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════

export default function CollageScreen({ onBack }) {
  const profile = getProfile() || {};
  const colorInfo = profile.colorSubtono ? COLORIMETRIA_RESULTS[profile.colorSubtono] : null;

  const [subView, setSubView] = useState('list'); // 'list' | 'editor'
  const [boards, setBoards] = useState([]);
  const [draftBoard, setDraftBoard] = useState(null);
  const [activeBoard, setActiveBoard] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editingTextOpen, setEditingTextOpen] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');
  const [canvasSize, setCanvasSize] = useState({ w: 1, h: 1 });

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  // Load saved boards + any recovery draft once on mount.
  useEffect(() => {
    setBoards(loadBoards());
    setDraftBoard(loadDraft());
  }, []);

  // Lightweight autosave of the board in progress, so closing mid-edit
  // doesn't lose work. The real "save" is still the explicit button.
  useEffect(() => {
    if (subView !== 'editor' || !activeBoard) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(activeBoard));
      } catch {
        // storage full — the draft is just a convenience, ignore silently
      }
    }, 600);
    return () => clearTimeout(t);
  }, [activeBoard, subView]);

  // Track the actual rendered canvas size (px) to convert pointer deltas to %
  // and to size fonts/frames correctly at any viewport width.
  useEffect(() => {
    if (subView !== 'editor' || !containerRef.current) return;
    const node = containerRef.current;
    const update = () => {
      const rect = node.getBoundingClientRect();
      setCanvasSize({ w: rect.width || 1, h: rect.height || 1 });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', update);
    };
  }, [subView, activeBoard?.id]);

  const selectedEl = activeBoard?.elements.find((e) => e.id === selectedId) || null;
  const editingEl = editingTextOpen && selectedEl?.type === 'text' ? selectedEl : null;

  // ── List view actions ──────────────────────────────────────────────────
  const createNewBoard = () => {
    const board = newBoard(boards.length);
    setActiveBoard(board);
    setSelectedId(null);
    setSubView('editor');
  };

  const openBoard = (board) => {
    setActiveBoard(board);
    setSelectedId(null);
    setSubView('editor');
  };

  const deleteBoard = (id) => {
    if (!window.confirm('¿Borrar este tablero? No se puede deshacer.')) return;
    const next = boards.filter((b) => b.id !== id);
    persistBoards(next);
    setBoards(next);
  };

  const resumeDraft = () => {
    if (!draftBoard) return;
    setActiveBoard(draftBoard);
    setSelectedId(null);
    setSubView('editor');
  };

  const discardDraft = () => {
    clearDraft();
    setDraftBoard(null);
  };

  // ── Editor: element mutation helpers ───────────────────────────────────
  const updateElement = (id, patch) => {
    setActiveBoard((prev) => prev
      ? { ...prev, elements: prev.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)) }
      : prev);
  };

  const addTextElement = () => {
    if (!activeBoard) return;
    const el = newTextElement(activeBoard.elements.length);
    setActiveBoard((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
    setShowPalette(false);
  };

  const addSwatchElement = (hex, name) => {
    if (!activeBoard) return;
    const el = newSwatchElement(hex, name, activeBoard.elements.length);
    setActiveBoard((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
  };

  const handleAddPhotosChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !activeBoard) return;

    const currentCount = activeBoard.elements.filter((el) => el.type === 'image').length;
    const capacity = MAX_IMAGES - currentCount;
    if (capacity <= 0) {
      showToast('Máximo 20 fotos por tablero 🌸');
      return;
    }
    const toProcess = files.slice(0, capacity);
    const overflow = files.length > toProcess.length;

    const newEls = [];
    let cursor = currentCount;
    for (const file of toProcess) {
      try {
        const { dataUrl, aspect } = await compressImageFile(file);
        newEls.push(newImageElement(dataUrl, aspect, cursor));
        cursor++;
      } catch {
        // skip files that fail to decode
      }
    }

    if (newEls.length) {
      setActiveBoard((prev) => ({ ...prev, elements: [...prev.elements, ...newEls] }));
      setSelectedId(newEls[newEls.length - 1].id);
    }
    if (overflow) showToast('Máximo 20 fotos por tablero 🌸 — agregué las primeras.');
  };

  const handleRotate = (delta) => {
    if (!selectedId) return;
    setActiveBoard((prev) => (prev
      ? { ...prev, elements: prev.elements.map((el) => (el.id === selectedId ? { ...el, rotation: (el.rotation + delta + 360) % 360 } : el)) }
      : prev));
  };

  const handleFront = () => {
    setActiveBoard((prev) => {
      if (!prev) return prev;
      const idx = prev.elements.findIndex((e) => e.id === selectedId);
      if (idx === -1 || idx === prev.elements.length - 1) return prev;
      const el = prev.elements[idx];
      const rest = prev.elements.filter((_, i) => i !== idx);
      return { ...prev, elements: [...rest, el] };
    });
  };

  const handleBack = () => {
    setActiveBoard((prev) => {
      if (!prev) return prev;
      const idx = prev.elements.findIndex((e) => e.id === selectedId);
      if (idx <= 0) return prev;
      const el = prev.elements[idx];
      const rest = prev.elements.filter((_, i) => i !== idx);
      return { ...prev, elements: [el, ...rest] };
    });
  };

  const handleDeleteSelected = () => {
    setActiveBoard((prev) => (prev ? { ...prev, elements: prev.elements.filter((e) => e.id !== selectedId) } : prev));
    setSelectedId(null);
    setEditingTextOpen(false);
  };

  const handleFrameChange = (frameId) => updateElement(selectedId, { frame: frameId });
  const handleFontChange = (fontFamily) => updateElement(selectedId, { font: fontFamily });
  const handleColorChange = (color) => updateElement(selectedId, { color });
  const handleSizeChange = (delta) => {
    setActiveBoard((prev) => (prev
      ? { ...prev, elements: prev.elements.map((el) => (el.id === selectedId ? { ...el, fontSize: clamp(el.fontSize + delta, 3, 14) } : el)) }
      : prev));
  };

  // ── Pointer-based drag (move) and resize — mouse + touch via Pointer Events ──
  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dxPct = ((e.clientX - d.startClientX) / d.rectW) * 100;
    const dyPct = ((e.clientY - d.startClientY) / d.rectH) * 100;
    setActiveBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        elements: prev.elements.map((el) => {
          if (el.id !== d.id) return el;
          if (d.mode === 'move') {
            return {
              ...el,
              x: clamp(d.startX + dxPct, 0, Math.max(0, 100 - el.w)),
              y: clamp(d.startY + dyPct, 0, Math.max(0, 100 - el.h)),
            };
          }
          // Images resize with LOCKED aspect ratio (scale w & h together) so
          // photos never get squashed. Since w/h are % of a fixed-size canvas,
          // keeping their ratio constant keeps the visual proportion constant.
          if (el.type === 'image') {
            const scaleW = (d.startW + dxPct) / d.startW;
            const scaleH = (d.startH + dyPct) / d.startH;
            let scale = (scaleW + scaleH) / 2; // respond to both drag axes
            // Clamp scale so neither dimension leaves its valid bounds.
            const maxScale = Math.min(
              Math.min(MAX_SIZE_PCT, 100 - el.x) / d.startW,
              Math.min(MAX_SIZE_PCT, 100 - el.y) / d.startH,
            );
            const minScale = Math.max(MIN_SIZE_PCT / d.startW, MIN_SIZE_PCT / d.startH);
            scale = clamp(scale, minScale, Math.max(minScale, maxScale));
            return { ...el, w: d.startW * scale, h: d.startH * scale };
          }
          // Text / swatches keep free resize (their proportion doesn't matter).
          return {
            ...el,
            w: clamp(d.startW + dxPct, MIN_SIZE_PCT, Math.min(MAX_SIZE_PCT, 100 - el.x)),
            h: clamp(d.startH + dyPct, MIN_SIZE_PCT, Math.min(MAX_SIZE_PCT, 100 - el.y)),
          };
        }),
      };
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const startDrag = (mode, el, e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      mode, id: el.id,
      startClientX: e.clientX, startClientY: e.clientY,
      startX: el.x, startY: el.y, startW: el.w, startH: el.h,
      rectW: rect.width, rectH: rect.height,
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleSelectMovePointerDown = (e, el) => {
    e.stopPropagation();
    setSelectedId(el.id);
    startDrag('move', el, e);
  };

  const handleResizePointerDown = (e, el) => {
    startDrag('resize', el, e);
  };

  const handleCanvasBackgroundPointerDown = (e) => {
    if (e.target === containerRef.current) {
      setSelectedId(null);
      setEditingTextOpen(false);
    }
  };

  // ── Save / Share ────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!activeBoard) return;
    const board = { ...activeBoard, date: new Date().toISOString() };
    const list = loadBoards();
    const idx = list.findIndex((b) => b.id === board.id);
    const nextList = idx === -1 ? [...list, board] : list.map((b) => (b.id === board.id ? board : b));
    const result = persistBoards(nextList);
    if (!result.ok) {
      showToast('Tu tablero pesa demasiado 😔 elimina alguna foto para guardarlo');
      return;
    }
    setBoards(nextList);
    setActiveBoard(board);
    clearDraft();
    setDraftBoard(null);
    showToast('¡Tablero guardado! 🌸');
  };

  const handleShare = async () => {
    if (!activeBoard) return;
    setExporting(true);
    try {
      const dataUrl = await exportBoardToDataUrl(activeBoard);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${slug(activeBoard.name)}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: activeBoard.name,
          text: 'Mi Tablero de Looks — hecho con Lumina 🌸',
        });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${slug(activeBoard.name)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Imagen guardada — compártela desde tu galería 🌸');
      }
    } catch {
      // cancelled share or export failure — no error UI needed for cancel,
      // but let her know if the export itself failed.
      showToast('No se pudo crear la imagen. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => (subView === 'editor' ? setSubView('list') : onBack())}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: 'var(--text)', padding: '4px 8px 4px 0',
            minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', flexShrink: 0,
          }}
        >
          ←
        </button>
        {subView === 'editor' && activeBoard ? (
          <input
            value={activeBoard.name}
            onChange={(e) => setActiveBoard((prev) => ({ ...prev, name: e.target.value }))}
            className="font-display"
            style={{
              flex: 1, fontSize: 20, color: 'var(--text)', border: 'none',
              background: 'transparent', outline: 'none', minWidth: 0,
            }}
          />
        ) : (
          <h1 className="font-display" style={{ fontSize: 24, color: 'var(--text)' }}>
            Mis Tableros de Looks
          </h1>
        )}
      </div>

      {subView === 'list' && (
        <div style={{ padding: '4px 20px 40px', overflowY: 'auto', flex: 1 }} className="slide-in">
          {draftBoard && (
            <div style={{
              background: 'rgba(255,255,255,0.6)', border: '1px dashed var(--border)',
              borderRadius: 16, padding: '12px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>📝</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 600 }}>Tienes un tablero sin guardar</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-light)', lineHeight: 1.3 }}>
                  "{draftBoard.name}" — continúa donde te quedaste.
                </p>
              </div>
              <button onClick={resumeDraft} style={{
                flexShrink: 0, background: 'var(--pink)', color: 'white', border: 'none',
                borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Continuar</button>
              <button onClick={discardDraft} aria-label="Descartar borrador" style={{
                flexShrink: 0, background: 'none', border: 'none', fontSize: 16,
                color: 'var(--text-muted)', cursor: 'pointer', minWidth: 32, minHeight: 32,
              }}>✕</button>
            </div>
          )}

          {boards.length === 0 ? (
            <EmptyBoardsState onCreateNew={createNewBoard} />
          ) : (
            <>
              <button
                onClick={createNewBoard}
                className="card-hover"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.5)', border: '1px dashed var(--border)',
                  borderRadius: 16, padding: '14px 16px', marginBottom: 18,
                  fontSize: 14, fontWeight: 600, color: 'var(--rose)', cursor: 'pointer', minHeight: 44,
                }}
              >
                ➕ Nuevo tablero
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {boards.map((b) => (
                  <BoardCard key={b.id} board={b} onOpen={openBoard} onDelete={deleteBoard} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {subView === 'editor' && activeBoard && (
        <>
          {/* Add buttons + background picker */}
          <div style={{ padding: '0 20px 8px', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
            <button onClick={() => fileInputRef.current?.click()} style={pillBtnStyle}>➕ Foto</button>
            <button onClick={addTextElement} style={pillBtnStyle}>➕ Texto</button>
            {colorInfo && (
              <button onClick={() => setShowPalette((v) => !v)} style={{
                ...pillBtnStyle,
                border: showPalette ? '1.5px solid var(--pink)' : pillBtnStyle.border,
              }}>🎨 Mi paleta</button>
            )}
          </div>
          <input
            type="file" accept="image/*" multiple ref={fileInputRef}
            style={{ display: 'none' }} onChange={handleAddPhotosChange}
          />

          <div style={{ padding: '0 20px 8px', display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>Fondo</span>
            {BACKGROUND_OPTIONS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setActiveBoard((prev) => ({ ...prev, background: bg.id }))}
                aria-label={bg.label}
                style={{
                  width: 26, height: 26, borderRadius: '50%', background: bg.css, flexShrink: 0,
                  border: activeBoard.background === bg.id ? '2.5px solid var(--pink)' : '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {showPalette && colorInfo && (
            <div style={{ padding: '0 20px 8px', display: 'flex', gap: 10, overflowX: 'auto', flexShrink: 0 }}>
              {colorInfo.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => addSwatchElement(c.hex, c.name)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, textAlign: 'center', padding: 0 }}
                >
                  <div style={{
                    width: 40, height: 56, borderRadius: '18px 18px 8px 8px', margin: '0 auto 4px',
                    ...hairGlossCss(c.hex),
                    border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 2px 8px rgba(130,98,110,0.2)',
                  }} />
                  <span style={{ fontSize: 9.5, color: 'var(--text-light)' }}>{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Canvas */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 20px 8px', minHeight: 0, overflow: 'hidden' }}>
            <div
              ref={containerRef}
              onPointerDown={handleCanvasBackgroundPointerDown}
              style={{
                // Drive size by WIDTH only; height derives from the 4:5 ratio.
                // (Setting both width AND height to 100% makes the browser ignore
                // aspectRatio, so the board stretched when the bottom toolbars
                // appeared/disappeared, squashing the photos.)
                width: '100%', maxWidth: 340, height: 'auto', maxHeight: '100%',
                aspectRatio: '4 / 5', margin: 'auto',
                background: getBackground(activeBoard.background).css,
                borderRadius: 18, position: 'relative', overflow: 'hidden',
                touchAction: 'none', boxShadow: 'var(--shadow-hover)', border: '1px solid var(--border)',
              }}
            >
              {activeBoard.elements.map((el) => (
                <ElementView
                  key={el.id}
                  el={el}
                  selected={el.id === selectedId}
                  canvasSize={canvasSize}
                  onPointerDownMove={handleSelectMovePointerDown}
                  onPointerDownResize={handleResizePointerDown}
                />
              ))}
              {activeBoard.elements.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    Agrega fotos, texto o colores de tu paleta para empezar tu tablero 🌸
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Element toolbar */}
          {selectedEl && (
            <div style={{ flexShrink: 0 }}>
              <ElementToolbar
                el={selectedEl}
                onRotate={handleRotate}
                onFront={handleFront}
                onBack={handleBack}
                onDelete={handleDeleteSelected}
                onDeselect={() => { setSelectedId(null); setEditingTextOpen(false); }}
                onFrameChange={handleFrameChange}
                onFontChange={handleFontChange}
                onColorChange={handleColorChange}
                onSizeChange={handleSizeChange}
                onEditText={() => setEditingTextOpen(true)}
              />
            </div>
          )}

          {/* Save / Share */}
          <div style={{
            padding: '12px 20px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
            background: 'white', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0,
          }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={handleSave} disabled={exporting}>
              💾 Guardar
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleShare} disabled={exporting}>
              {exporting ? 'Creando…' : '📤 Compartir'}
            </button>
          </div>
        </>
      )}

      {/* Text edit bottom sheet */}
      {editingEl && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setEditingTextOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="slide-in"
            style={{
              width: '100%', maxWidth: 430, background: 'white', borderRadius: '24px 24px 0 0',
              padding: '20px 20px max(20px, env(safe-area-inset-bottom))',
            }}
          >
            <p className="font-display" style={{ fontSize: 18, marginBottom: 10, color: 'var(--text)' }}>Editar texto</p>
            <textarea
              autoFocus
              value={editingEl.text}
              onChange={(e) => updateElement(editingEl.id, { text: e.target.value })}
              rows={3}
              style={{
                width: '100%', border: '1px solid var(--border)', borderRadius: 14, padding: 12,
                fontSize: 16, fontFamily: editingEl.font, color: editingEl.color, resize: 'none', boxSizing: 'border-box',
              }}
            />
            <button className="btn-primary" style={{ marginTop: 14 }} onClick={() => setEditingTextOpen(false)}>
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast ? (
        <div style={{
          position: 'fixed', bottom: 'max(88px, calc(72px + env(safe-area-inset-bottom)))',
          left: '50%', transform: 'translateX(-50%)',
          background: 'var(--rose)', color: 'white', padding: '10px 20px', borderRadius: 20,
          fontSize: 13.5, fontWeight: 600, boxShadow: '0 4px 20px rgba(130,98,110,0.35)',
          zIndex: 300, animation: 'fadeIn 0.2s ease', textAlign: 'center', maxWidth: '85%',
        }}>
          {toast}
        </div>
      ) : null}
    </div>
  );
}

const pillBtnStyle = {
  flexShrink: 0, padding: '9px 14px', borderRadius: 14,
  border: '1px solid var(--border)', background: 'white',
  fontSize: 13, fontWeight: 600, color: 'var(--rose)', cursor: 'pointer', minHeight: 40,
};
