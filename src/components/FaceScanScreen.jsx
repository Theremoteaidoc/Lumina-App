/* ═══════════════════════════════════════════════════════════════════
   FaceScanScreen v4 — Migrated to Lumina design system

   Phase palettes:
   - intro     → light (var(--bg), var(--text), var(--bg-card))
   - scanning  → dark camera UI, pink accents replacing green
   - analyzing → light bg, pink spinner
   - results   → fully light, card-based like ColorimetriaScreen
   ═══════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback } from 'react';
import { LANDMARKS, extractFeatures, classifyFaceShape, loadHybridClassifier, FACE_OVAL_INDICES } from '../utils/faceClassifier';
import { EYE_LANDMARKS } from '../utils/eyeClassifier';
import { FACE_DATA } from '../data/appData';
import { getProfile, updateProfile } from '../utils/profile';

// Same localStorage key the chat already uses for "may I send your photo to
// Google's Gemini AI" consent — one consent flag shared across the app.
// Gemini is now the SOLE decision-maker for face-scan results, so this
// consent is required before every scan (not just an optional upgrade).
const IMG_CONSENT_KEY = 'lumina_img_consent';

function decap(s) {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// "Rostro Ovalado" → "Ovalado" — used to compose the "Principalmente X, con
// rasgos de Y" ambiguous headline without repeating the word "Rostro" twice.
function stripRostroPrefix(title) {
  return (title || '').replace(/^Rostro\s+/i, '');
}

// Mirrors buildRecommendations() in localFaceAnalysis.js so a Gemini-sourced
// analysis renders identically (same prose shape) as a local one in the
// "Detalles" tab — only the source of the primaryShape differs.
function buildRecommendationsFromFaceData(faceData) {
  const [h1, h2, h3] = faceData.haircuts;
  const haircuts = `Te favorecen especialmente ${decap(h1)} y ${decap(h2)}.${
    h3 ? ` También puedes considerar ${decap(h3)}.` : ''
  }`;
  const [mk1, mk2] = faceData.makeup;
  const makeup = `En maquillaje, prueba con ${decap(mk1)}${mk2 ? `; también funciona bien ${decap(mk2)}` : ''}. Para el contorno: ${decap(faceData.contourZones)}`;
  const necklines = `Los escotes y cuellos que más te favorecen son ${faceData.necklines
    .slice(0, 3)
    .map(decap)
    .join(', ')}.`;
  return { haircuts, makeup, necklines };
}

// Camera-only accent colors used in canvas drawing (scanning phase stays dark)
const CAM = {
  oval: 'rgba(250,147,165,0.35)',    // --pink with alpha, for live overlay
  corner: 'rgba(250,147,165,0.55)',  // --pink stronger, for guide corners
  eyeLine: 'rgba(130,98,110,0.35)',  // --rose with alpha
  detected: 'rgba(250,147,165,0.2)',
  detectedBorder: 'rgba(250,147,165,0.4)',
  notDetected: 'rgba(255,80,80,0.15)',
  notDetectedBorder: 'rgba(255,80,80,0.3)',
};

export default function FaceScanScreen({ onBack }) {
  const [phase, setPhase] = useState('intro');
  const [facingMode, setFacingMode] = useState('user');
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceResult, setFaceResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [resultsTab, setResultsTab] = useState('face');
  const [mpReady, setMpReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [overlayPhoto, setOverlayPhoto] = useState(null);
  const [analyzeStep, setAnalyzeStep] = useState('');
  // Gemini is the SOLE decision-maker now — this holds its full analysis
  // object (primaryShape, confidence, isAmbiguous, secondaryShape, eyeShape,
  // summary, characteristics...) once a scan succeeds with photoOk === true.
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);
  // Gemini's response when it judged the photo unusable (photoOk === false).
  const [photoIssueData, setPhotoIssueData] = useState(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const facingRef = useRef('user');
  const fileInputRef = useRef(null);
  const pendingActionRef = useRef(null); // 'camera' | 'upload' — what to do after consent
  // Retained from the last capture so "Reintentar" doesn't need a recapture.
  const lastImageBase64Ref = useRef(null);
  const lastProfileRef = useRef(null);

  useEffect(() => { facingRef.current = facingMode; }, [facingMode]);

  // ─── Camera ───

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    setFaceDetected(false);
  }, []);

  const startCamera = useCallback(async (facing) => {
    stopCamera();
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (e) {
      console.error('Camera error:', e);
      setErrorMsg('No se pudo acceder a la cámara. Revisa los permisos.');
    }
  }, [stopCamera]);

  const toggleCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (phase === 'scanning') startCamera(next);
  }, [facingMode, phase, startCamera]);

  // ─── MediaPipe ───

  const loadMediaPipe = useCallback(async () => {
    if (landmarkerRef.current) { setMpReady(true); return; }
    try {
      if (!window.FilesetResolver || !window.FaceLandmarker) {
        await new Promise(r => {
          if (window.FilesetResolver) return r();
          window.addEventListener('mediapipe-ready', r, { once: true });
          setTimeout(r, 15000);
        });
      }
      if (!window.FilesetResolver) throw new Error('MediaPipe not loaded');

      const vision = await window.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );
      landmarkerRef.current = await window.FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
      });
      setMpReady(true);
    } catch (e) {
      console.error('MediaPipe error:', e);
      setErrorMsg('Error cargando modelo facial. Recarga la página.');
    }
  }, []);

  const setMpMode = useCallback(async (mode) => {
    if (!landmarkerRef.current) return;
    try { await landmarkerRef.current.setOptions({ runningMode: mode }); } catch (e) { /* */ }
  }, []);

  // ─── Live preview loop ───

  const startPreview = useCallback(async () => {
    await setMpMode('VIDEO');
    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw grayscale (mirrored for front camera)
      ctx.filter = 'grayscale(100%) contrast(1.05)';
      if (facingRef.current === 'user') {
        ctx.save(); ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0);
      }
      ctx.filter = 'none';

      // Face detection for feedback — use VIDEO mode on raw video
      if (landmarkerRef.current) {
        try {
          const results = landmarkerRef.current.detectForVideo(video, performance.now());
          if (results.faceLandmarks?.[0]) {
            setFaceDetected(true);
            drawLiveOverlay(ctx, results.faceLandmarks[0], canvas.width, canvas.height, facingRef.current === 'user');
          } else {
            setFaceDetected(false);
          }
        } catch (e) { /* skip */ }
      }

      drawFaceGuide(ctx, canvas.width, canvas.height);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [setMpMode]);

  // ─── Face guide oval (pink accents) ───
  const drawFaceGuide = (ctx, w, h) => {
    const cx = w / 2, cy = h * 0.44, rx = w * 0.28, ry = h * 0.38;
    ctx.strokeStyle = CAM.oval;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Corner brackets
    const s = 16;
    ctx.strokeStyle = CAM.corner;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx-rx, cy-ry+s); ctx.lineTo(cx-rx, cy-ry); ctx.lineTo(cx-rx+s, cy-ry); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+rx-s, cy-ry); ctx.lineTo(cx+rx, cy-ry); ctx.lineTo(cx+rx, cy-ry+s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-rx, cy+ry-s); ctx.lineTo(cx-rx, cy+ry); ctx.lineTo(cx-rx+s, cy+ry); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+rx-s, cy+ry); ctx.lineTo(cx+rx, cy+ry); ctx.lineTo(cx+rx, cy+ry-s); ctx.stroke();
  };

  // ─── Live overlay — pink accent lines ───
  const drawLiveOverlay = (ctx, lm, w, h, mirrored) => {
    const px = (idx) => {
      const p = lm[idx];
      const x = mirrored ? (1 - p.x) * w : p.x * w;
      return { x, y: p.y * h };
    };
    // Face oval — thin subtle pink
    ctx.strokeStyle = CAM.oval;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < FACE_OVAL_INDICES.length; i++) {
      const p = px(FACE_OVAL_INDICES[i]);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
    // Eyes
    const drawEye = (indices) => {
      ctx.strokeStyle = CAM.eyeLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < indices.length; i++) {
        const p = px(indices[i]);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    };
    drawEye(EYE_LANDMARKS.RIGHT_EYE.outline);
    drawEye(EYE_LANDMARKS.LEFT_EYE.outline);
  };

  // ═══════════════════════════════════════════════
  // GEMINI FACE ANALYSIS — the SOLE decision-maker for the shown result.
  // Pure vision call (no geometric metrics sent). No silent fallback to the
  // geometric classifier on failure — the user sees an honest retry state.
  // ═══════════════════════════════════════════════

  const runGeminiFaceAnalysis = useCallback(async (imageBase64, profile) => {
    try {
      const res = await fetch('/api/analyze-face-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          imageMime: 'image/jpeg',
          profile: { name: profile?.name, ageRange: profile?.ageRange },
        }),
      });
      const data = await res.json().catch(() => null);
      const hasValidShape = data?.analysis?.primaryShape && FACE_DATA[data.analysis.primaryShape];

      if (data?.ok && data.analysis && (hasValidShape || data.analysis.photoOk === false)) {
        const a = data.analysis;

        if (a.photoOk === false) {
          // Gemini flagged the photo as unusable (may or may not include a
          // best-effort guess) — don't show a shape as the headline result,
          // ask for a better photo instead.
          setPhotoIssueData(a);
          setPhase('photoIssue');
          return;
        }

        a._model = data.model; // TEMP DEBUG: which cascade model actually answered
        setGeminiAnalysis(a);

        updateProfile({
          faceShape: a.primaryShape,
          ...(a.isAmbiguous && a.secondaryShape && FACE_DATA[a.secondaryShape]
            ? { faceShapeSecondary: a.secondaryShape }
            : {}),
          faceScanAt: new Date().toISOString(),
        });

        setPhase('results');
        setResultsTab('face');
      } else {
        // noKey / busy / invalid JSON — no geometric fallback. Be honest.
        setPhase('geminiError');
      }
    } catch (e) {
      console.error('Gemini face analysis error:', e);
      setPhase('geminiError');
    }
  }, []);

  // "Reintentar" on the error screen — reuses the already-captured photo
  // instead of forcing the user to retake/reselect it.
  const retryGeminiAnalysis = useCallback(() => {
    if (!lastImageBase64Ref.current) { setPhase('intro'); return; }
    setPhase('analyzing');
    setAnalyzeStep('Analizando tu rostro con IA... ✨');
    runGeminiFaceAnalysis(lastImageBase64Ref.current, lastProfileRef.current || {});
  }, [runGeminiFaceAnalysis]);

  // ═══════════════════════════════════════════════
  // ANALYZE
  // ═══════════════════════════════════════════════

  const analyzeImage = useCallback(async (imageCanvas, isFromCamera) => {
    setPhase('analyzing');
    setAnalyzeStep('Detectando rostro...');
    setErrorMsg(null);

    // Reset analysis state for new scan
    setGeminiAnalysis(null);
    setPhotoIssueData(null);

    // Capture photo for display (higher quality)
    setCapturedPhoto(imageCanvas.toDataURL('image/jpeg', 0.88));

    await new Promise(r => setTimeout(r, 100));

    try {
      await setMpMode('IMAGE');
      await new Promise(r => setTimeout(r, 50));

      setAnalyzeStep('Mapeando 478 landmarks faciales...');

      const results = landmarkerRef.current.detect(imageCanvas);

      if (!results.faceLandmarks?.[0]) {
        setErrorMsg('No se detectó un rostro. Intenta con mejor iluminación y el rostro descubierto.');
        setPhase('intro');
        return;
      }

      const lm = results.faceLandmarks[0];

      setAnalyzeStep('Verificando calidad...');
      await new Promise(r => setTimeout(r, 200));

      const faceH = Math.abs(lm[152].y - lm[10].y);
      const faceCenter = (lm[234].x + lm[454].x) / 2;

      if (faceH < 0.12) {
        setErrorMsg('El rostro está muy lejos. Acércate más o usa una foto más cercana.');
        setPhase('intro');
        return;
      }
      if (Math.abs(faceCenter - 0.5) > 0.28) {
        setErrorMsg('El rostro está muy descentrado. Centra el rostro en la imagen.');
        setPhase('intro');
        return;
      }

      setAnalyzeStep('Analizando proporciones faciales...');
      await new Promise(r => setTimeout(r, 300));
      // Pass image aspect ratio so widths (x) and height (y) are comparable —
      // MediaPipe normalizes x by width and y by height separately.
      const aspect = imageCanvas.width / imageCanvas.height;
      const features = extractFeatures(lm, aspect);
      if (!features) {
        setErrorMsg('No se pudieron extraer proporciones faciales. Intenta con otra foto.');
        setPhase('intro');
        return;
      }
      // Geometric classification is kept ONLY for the live overlay drawing
      // and the raw ratio readouts (MetricsRow) — it no longer decides the
      // shown face/eye shape. Gemini is the sole decision-maker (see below).
      const faceRes = await classifyFaceShape(features);
      setFaceResult(faceRes);

      setAnalyzeStep('Generando visualización...');
      await new Promise(r => setTimeout(r, 150));
      setOverlayPhoto(drawResultOverlay(imageCanvas, lm, imageCanvas.width, imageCanvas.height));

      // Gemini is mandatory and is the sole source of the shown result — wait
      // for it here (spinner stays up) instead of flashing a geometric guess.
      setAnalyzeStep('Analizando tu rostro con IA... ✨');
      const profile = getProfile() || {};
      const imgBase64 = imageCanvas.toDataURL('image/jpeg', 0.8).replace(/^data:image\/jpeg;base64,/, '');
      lastImageBase64Ref.current = imgBase64;
      lastProfileRef.current = profile;
      await runGeminiFaceAnalysis(imgBase64, profile);
    } catch (e) {
      console.error('Analysis error:', e);
      setErrorMsg('Error durante el análisis. Intenta de nuevo.');
      setPhase('intro');
    }
  }, [setMpMode, runGeminiFaceAnalysis]);

  // ─── Camera capture ───

  const handleCapture = useCallback(async () => {
    if (!landmarkerRef.current || !videoRef.current) return;
    const video = videoRef.current;

    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    const offscreen = document.createElement('canvas');
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const ctx = offscreen.getContext('2d');

    if (facingRef.current === 'user') {
      ctx.save(); ctx.scale(-1, 1);
      ctx.drawImage(video, -offscreen.width, 0, offscreen.width, offscreen.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0);
    }

    stopCamera();
    await analyzeImage(offscreen, true);
  }, [stopCamera, analyzeImage]);

  // ─── File upload ───

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    await loadMediaPipe();

    const img = new Image();
    img.src = URL.createObjectURL(file);

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    });

    const maxDim = 1280;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    offscreen.getContext('2d').drawImage(img, 0, 0, w, h);

    URL.revokeObjectURL(img.src);
    await analyzeImage(offscreen, false);
  }, [loadMediaPipe, analyzeImage]);

  // ─── Result overlay drawing ───
  const drawResultOverlay = (sourceCanvas, lm, w, h) => {
    const overlay = document.createElement('canvas');
    overlay.width = w;
    overlay.height = h;
    const ctx = overlay.getContext('2d');

    ctx.drawImage(sourceCanvas, 0, 0);

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, w, h);

    const px = (idx) => {
      const p = lm[idx];
      return { x: p.x * w, y: p.y * h };
    };

    const L = LANDMARKS;

    // Smooth face contour using Catmull-Rom spline (passes through every landmark
     // but with smooth curves between them — natural face shape instead of jagged polygon)
    const ovalPts = FACE_OVAL_INDICES.map(px);
    ctx.strokeStyle = 'rgba(250,147,165,0.55)';
    ctx.lineWidth = Math.max(1.5, w * 0.002);
    ctx.beginPath();
    ctx.moveTo(ovalPts[0].x, ovalPts[0].y);
    for (let i = 0; i < ovalPts.length; i++) {
      const p0 = ovalPts[(i - 1 + ovalPts.length) % ovalPts.length];
      const p1 = ovalPts[i];
      const p2 = ovalPts[(i + 1) % ovalPts.length];
      const p3 = ovalPts[(i + 2) % ovalPts.length];
      // Catmull-Rom → cubic Bezier conversion (tension = 0.5)
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.closePath();
    ctx.stroke();

    const fontSize = Math.max(12, Math.round(w * 0.02));
    const dotR = Math.max(3, w * 0.004);
    const lineW = Math.max(1.5, w * 0.002);

    // Shared drawing primitive — works with pixel coords already computed
    const drawLineSegment = (ax, ay, bx, by, label, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.setLineDash([]);

      for (const [px2, py2] of [[ax, ay], [bx, by]]) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px2, py2, dotR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (label) {
        const mx = (ax + bx) / 2, my = (ay + by) / 2 - fontSize * 0.8;
        ctx.font = `bold ${fontSize}px system-ui`;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        const pad = 5;
        ctx.beginPath();
        ctx.roundRect(mx - tw/2 - pad, my - fontSize/2 - 2, tw + pad*2, fontSize + 4, 4);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mx, my);
      }
    };

    // Landmark-index based wrapper (fallback path)
    const drawMeasure = (i1, i2, label, color) => {
      const a = px(i1), b = px(i2);
      drawLineSegment(a.x, a.y, b.x, b.y, label, color);
    };

    // ── Anatomic Y anchors (landmark-based, face-shape-invariant) ──
    const noseBridgeY = lm[6].y;   // nose bridge (between eyes)
    const noseTipY   = lm[1].y;    // nose tip
    const lowerLipY  = lm[14].y;   // lower lip bottom edge
    const chinY      = lm[152].y;  // chin (lowest face point)

    // Forehead: extrapolate above the eyebrows (MediaPipe has no landmarks above brows)
    const faceH = Math.abs(lm[152].y - lm[10].y) || 1;
    const browTopY = Math.min(
      lm[55].y, lm[65].y, lm[52].y, lm[53].y, lm[46].y,      // right brow top arc
      lm[285].y, lm[295].y, lm[282].y, lm[283].y, lm[276].y  // left brow top arc
    );
    const foreheadY = browTopY - faceH * 0.10;  // 10% of face height above brows

    // Three measurement levels — anatomically correct for any face shape
    const cheekY    = (noseBridgeY + noseTipY) / 2; // cheekbone level, below eyes
    const jawY      = (lowerLipY + chinY) / 2;    // jaw/maxilla, below lips

    // Find leftmost and rightmost face oval X coordinates near a target Y
    const findHorizontalSpan = (targetY) => {
      const tolerance = faceH * 0.06;
      const all = FACE_OVAL_INDICES.map(idx => ({
        x: lm[idx].x,
        y: lm[idx].y,
        dy: Math.abs(lm[idx].y - targetY),
      }));
      let inRange = all.filter(p => p.dy < tolerance);
      if (inRange.length < 2) {
        inRange = [...all].sort((a, b) => a.dy - b.dy).slice(0, 6);
      }
      let leftX = Infinity, rightX = -Infinity;
      for (const p of inRange) {
        if (p.x < leftX) leftX = p.x;
        if (p.x > rightX) rightX = p.x;
      }
      if (leftX === Infinity) return null;
      return { leftX, rightX };
    };

    // Draw a guaranteed-horizontal measure line at anatomic Y level
    const drawHorizontalMeasure = (targetY, label, color) => {
      const span = findHorizontalSpan(targetY);
      if (!span) return;
      drawLineSegment(
        span.leftX * w, targetY * h,
        span.rightX * w, targetY * h,
        label, color
      );
    };

    // Forehead width uses temple landmarks directly (face oval narrows above brows)
    drawLineSegment(
      lm[54].x * w, foreheadY * h,
      lm[284].x * w, foreheadY * h,
      'Frente', '#F2CC8F'
    );
    drawHorizontalMeasure(cheekY,    'Pómulos',    '#7fd4a8');
    drawHorizontalMeasure(jawY,      'Mandíbula',  '#FA93A5');

    // Vertical hairline→chin reference line (kept as-is)
    drawMeasure(L.hairline, L.chin, '', 'rgba(255,255,255,0.4)');

    const drawEyeOvl = (indices) => {
      ctx.strokeStyle = 'rgba(130,98,110,0.6)';
      ctx.lineWidth = Math.max(1, w * 0.0015);
      ctx.beginPath();
      for (let i = 0; i < indices.length; i++) {
        const p = px(indices[i]);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    };
    drawEyeOvl(EYE_LANDMARKS.RIGHT_EYE.outline);
    drawEyeOvl(EYE_LANDMARKS.LEFT_EYE.outline);

    return overlay.toDataURL('image/jpeg', 0.88);
  };

  // ─── Phase transitions ───

  const goToScanning = useCallback(async () => {
    setPhase('scanning');
    setErrorMsg(null);
    setFaceResult(null);
    setCapturedPhoto(null);
    setOverlayPhoto(null);
    await loadMediaPipe();
    loadHybridClassifier(); // fire-and-forget: preload while user positions face
    await startCamera(facingMode);
  }, [facingMode, startCamera, loadMediaPipe]);

  useEffect(() => {
    if (phase === 'scanning' && cameraReady && mpReady) startPreview();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, cameraReady, mpReady, startPreview]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ─── Photo → Gemini consent gate ───
  // Gemini analyzes every scan now, so the "may I send your photo to Google's
  // AI" consent is required before EITHER the camera or the file picker opens
  // (not just as a later opt-in). Shares the same localStorage flag as the chat.
  const requestPhotoAction = useCallback((action) => {
    const hasConsent = (() => {
      try { return localStorage.getItem(IMG_CONSENT_KEY) === 'true'; } catch { return false; }
    })();
    if (hasConsent) {
      if (action === 'camera') goToScanning();
      else fileInputRef.current?.click();
      return;
    }
    pendingActionRef.current = action;
    setShowConsentModal(true);
  }, [goToScanning]);

  const acceptImgConsent = useCallback(() => {
    try { localStorage.setItem(IMG_CONSENT_KEY, 'true'); } catch { /* ignore */ }
    setShowConsentModal(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action === 'camera') goToScanning();
    else if (action === 'upload') fileInputRef.current?.click();
  }, [goToScanning]);

  const declineImgConsent = useCallback(() => {
    setShowConsentModal(false);
    pendingActionRef.current = null;
    setErrorMsg('El análisis facial necesita tu permiso para enviar la foto a la IA. Sin ese permiso no podemos continuar. 🌸');
  }, []);

  // ═══════════════════════════════════════════════
  // RENDER — INTRO (light palette)
  // ═══════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div className="slide-in" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <Header onBack={onBack} title="Análisis Facial" />
        <div style={{ padding: '12px 24px', textAlign: 'center' }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'var(--bg-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '16px auto 20px', fontSize: 42,
          }}>🪞</div>

          <h2 style={{ fontSize: 21, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Visagismo Inteligente</h2>
          <p style={{ color: 'var(--text-light)', fontSize: 14, lineHeight: 1.6, maxWidth: 290, margin: '0 auto 28px' }}>
            Analizamos tu rostro con IA para darte recomendaciones personalizadas de maquillaje, cortes y más.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
            {[{ e: '📐', l: 'Forma del rostro' }, { e: '💄', l: 'Tips personalizados' }].map(({ e, l }) => (
              <div key={l} style={{
                background: 'var(--bg-card)', borderRadius: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 7, fontSize: 12,
                border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
                color: 'var(--text)',
              }}>
                <span style={{ fontSize: 16 }}>{e}</span>{l}
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-card)', borderRadius: 14, padding: '16px 18px',
            textAlign: 'left', marginBottom: 24, border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--rose)' }}>
              Para mejores resultados:
            </p>
            {[
              '💡 Buena iluminación frontal (sin sombras)',
              '📷 Mira directo a la cámara',
              '💇‍♀️ Retira el cabello de la frente y mandíbula',
              '😐 Expresión neutra, boca cerrada',
              '🚫 Sin lentes ni accesorios grandes',
            ].map((t, i) => (
              <p key={i} style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4, paddingLeft: 4 }}>{t}</p>
            ))}
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            }}>
              <p style={{ color: '#c0392b', fontSize: 12, margin: 0 }}>⚠️ {errorMsg}</p>
            </div>
          )}

          <button onClick={() => requestPhotoAction('camera')} className="btn-primary" style={{ marginBottom: 10 }}>
            📸 Tomar Foto
          </button>

          <button onClick={() => requestPhotoAction('upload')} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
            🖼️ Subir Foto de Galería
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>

        {/* ── Aviso de privacidad de fotos — requerido antes de cada escaneo ── */}
        {showConsentModal && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}
            onClick={declineImgConsent}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="slide-in"
              style={{
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                borderRadius: '28px 28px 0 0',
                border: '1px solid rgba(255,255,255,0.6)',
                padding: '32px 24px max(32px, env(safe-area-inset-bottom))',
                width: '100%', maxWidth: 430, textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌸</div>
              <h2 className="font-display" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 10 }}>
                Sobre tu foto
              </h2>
              <p style={{ fontSize: 14.5, color: 'var(--text-light)', lineHeight: 1.6, marginBottom: 24 }}>
                Para el análisis facial, tu foto se envía a la IA de Google (Gemini) que la observa y la descarta — no se guarda en ningún lado. Es la única forma de darte un resultado preciso. Tú decides si compartirla.
              </p>
              <button className="btn-primary" onClick={acceptImgConsent}>Entendido, continuar</button>
              <button
                onClick={declineImgConsent}
                style={{
                  width: '100%', padding: 14, background: 'none', border: 'none',
                  fontSize: 14.5, color: 'var(--text-muted)',
                  cursor: 'pointer', marginTop: 4,
                }}
              >
                Ahora no
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — SCANNING (dark camera UI, pink accents)
  // ═══════════════════════════════════════════════
  if (phase === 'scanning') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: '#f0f0f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <video ref={videoRef} playsInline muted style={{
            position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0,
          }} />
          <canvas ref={canvasRef} style={{
            position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
          }} />

          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: faceDetected ? CAM.detected : CAM.notDetected,
            border: `1px solid ${faceDetected ? CAM.detectedBorder : CAM.notDetectedBorder}`,
            borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 600,
            color: faceDetected ? '#FA93A5' : '#ff9999',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', /* scanning UI label - keeps DM Sans */
          }}>
            {!cameraReady ? '⏳ Iniciando cámara...'
              : !mpReady ? '⏳ Cargando modelo IA...'
              : faceDetected ? '✓ Rostro detectado — ¡Toma la foto!'
              : '✗ Centra tu rostro en el óvalo'}
          </div>

          <div style={{
            position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center',
            fontSize: 10, color: 'rgba(255,255,255,0.35)', padding: '0 20px',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Mantén expresión neutra y buena iluminación
          </div>
        </div>

        <div style={{
          padding: '16px 20px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', background: 'rgba(0,0,0,0.9)', flexShrink: 0,
        }}>
          <button onClick={() => { stopCamera(); setPhase('intro'); }}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.55)',
              padding: '10px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', minWidth: 70,
              fontFamily: "'DM Sans', sans-serif",
            }}>
            ← Volver
          </button>

          <button onClick={handleCapture} disabled={!faceDetected}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: faceDetected
                ? 'linear-gradient(135deg, var(--pink-light), var(--pink))'
                : 'rgba(255,255,255,0.08)',
              border: `4px solid ${faceDetected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.12)'}`,
              cursor: faceDetected ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, transition: 'all 0.3s',
              boxShadow: faceDetected ? '0 0 24px rgba(250,147,165,0.45)' : 'none',
            }}>
            📸
          </button>

          <button onClick={toggleCamera}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.55)',
              padding: '10px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', minWidth: 70,
              display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
              fontFamily: "'DM Sans', sans-serif",
            }}>
            🔄 {facingMode === 'user' ? 'Trasera' : 'Frontal'}
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '6px 20px 14px', background: 'rgba(0,0,0,0.9)' }}>
            <p style={{ color: '#ff9999', fontSize: 11, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>{errorMsg}</p>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — ANALYZING (light bg, pink spinner)
  // ═══════════════════════════════════════════════
  if (phase === 'analyzing') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {capturedPhoto && (
          <div style={{ position: 'relative', width: '75%', maxWidth: 320, borderRadius: 18, overflow: 'hidden', marginBottom: 30 }}>
            <img src={capturedPhoto} alt="" style={{ width: '100%', display: 'block', filter: 'grayscale(100%) contrast(1.05)' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 0%, rgba(250,147,165,0.08) 50%, transparent 100%)',
              animation: 'scanLine 2s ease-in-out infinite',
            }} />
            <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(250,147,165,0.4)', borderRadius: 18 }} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 20, height: 20, border: '2px solid rgba(250,147,165,0.3)',
            borderTopColor: 'var(--pink)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>{analyzeStep}</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: "'DM Sans', sans-serif" }}>Analizando imagen de alta resolución</p>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes scanLine { 0%,100% { transform: translateY(-100%); } 50% { transform: translateY(100%); } }
        `}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — PHOTO ISSUE (Gemini flagged photoOk: false)
  // ═══════════════════════════════════════════════
  if (phase === 'photoIssue') {
    return (
      <div className="slide-in" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <Header onBack={onBack} title="Análisis Facial" />
        <div style={{ padding: '4px 24px 24px', textAlign: 'center' }}>
          {capturedPhoto && (
            <img src={capturedPhoto} alt="" style={{
              width: 130, height: 130, borderRadius: 20, objectFit: 'cover',
              margin: '4px auto 20px', display: 'block', border: '1px solid var(--border)',
              filter: 'grayscale(30%)',
            }} />
          )}
          <div style={{ fontSize: 38, marginBottom: 10 }}>🌸</div>
          <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
            Para un análisis preciso necesito una mejor foto
          </h2>
          {photoIssueData?.photoIssue && (
            <p style={{ fontSize: 13.5, color: 'var(--rose)', lineHeight: 1.6, marginBottom: 18, fontWeight: 600 }}>
              {photoIssueData.photoIssue}
            </p>
          )}

          <div style={{
            background: 'var(--bg-card)', borderRadius: 14, padding: '16px 18px',
            textAlign: 'left', marginBottom: 24, border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--rose)' }}>
              Tips para tu próxima foto:
            </p>
            {[
              '💇‍♀️ Recoge el cabello para despejar mandíbula y sienes',
              '📷 Toma la foto de frente, mirando a la cámara',
              '💡 Busca buena luz, sin sombras fuertes',
            ].map((t, i) => (
              <p key={i} style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4, paddingLeft: 4 }}>{t}</p>
            ))}
          </div>

          <button onClick={goToScanning} className="btn-primary" style={{ marginBottom: 10 }}>
            📸 Tomar otra foto
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          }}>
            🖼️ Subir otra foto
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — GEMINI ERROR (no silent geometric fallback — be honest)
  // ═══════════════════════════════════════════════
  if (phase === 'geminiError') {
    return (
      <div className="slide-in" style={{
        minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 28px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🌸</div>
        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
          No pude completar el análisis con IA
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6, marginBottom: 26, maxWidth: 300 }}>
          Revisa tu conexión e intenta de nuevo en unos segundos.
        </p>
        <button onClick={retryGeminiAnalysis} className="btn-primary" style={{ marginBottom: 10, maxWidth: 260, width: '100%' }}>
          ↻ Reintentar
        </button>
        <button
          onClick={() => { setPhase('intro'); setErrorMsg(null); }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13.5, cursor: 'pointer', padding: 10 }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — RESULTS (fully light)
  // ═══════════════════════════════════════════════

  // Gemini is the SOLE decision-maker for the shown result — geometry
  // (faceResult/eyeResult) is only used above for the overlay drawing and
  // the raw ratio readouts (MetricsRow) further down.
  const primaryShape = geminiAnalysis?.primaryShape;
  const fData = primaryShape ? FACE_DATA[primaryShape] : null;
  const isAmbiguous = !!(geminiAnalysis?.isAmbiguous && geminiAnalysis?.secondaryShape && FACE_DATA[geminiAnalysis.secondaryShape]);
  const secondaryFaceData = isAmbiguous ? FACE_DATA[geminiAnalysis.secondaryShape] : null;

  // Shape for the "Detalles" tab — same prose shape the old local/Gemini
  // ensemble produced, sourced entirely from Gemini's response now.
  const detailsAnalysis = (fData && geminiAnalysis) ? {
    primaryShape,
    confidence: geminiAnalysis.confidence || 'media',
    secondaryInfluences: isAmbiguous ? [stripRostroPrefix(secondaryFaceData.title)] : [],
    summary: geminiAnalysis.summary,
    characteristics: geminiAnalysis.characteristics || {},
    recommendations: buildRecommendationsFromFaceData(fData),
  } : null;

  const resetToIntro = () => {
    setPhase('intro');
    setErrorMsg(null);
    setGeminiAnalysis(null);
    setPhotoIssueData(null);
  };

  return (
    <div className="slide-in" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 40 }}>
      {/* Header — matches ColorimetriaScreen pattern */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 20, cursor: 'pointer', padding: 4 }}>←</button>
        <h1 className="font-display" style={{ fontSize: 22, color: 'var(--text)' }}>Tus Resultados</h1>
        <div style={{ flex: 1 }} />
        <button onClick={resetToIntro}
          style={{
            background: 'var(--bg-soft)', border: '1px solid var(--border)',
            color: 'var(--rose)', padding: '8px 14px', borderRadius: 10,
            fontSize: 13, cursor: 'pointer',
          }}>
          Repetir ↻
        </button>
      </div>

      {/* Before / After slider */}
      {capturedPhoto && overlayPhoto && (
        <div style={{ margin: '0 20px 14px' }}>
          <BeforeAfterSlider before={capturedPhoto} after={overlayPhoto} />
        </div>
      )}

      {/* Ambiguous-shape headline — only shown when Gemini genuinely wasn't
          sure between two shapes. A confident result just shows "Rostro X"
          via the SummaryCard title below, no extra headline needed. */}
      {isAmbiguous && (
        <div style={{ margin: '0 20px 14px', padding: '14px 16px', background: 'var(--bg-soft)', borderRadius: 14, textAlign: 'center' }}>
          <p className="font-display" style={{ fontSize: 16, color: 'var(--rose)', margin: 0 }}>
            Principalmente {stripRostroPrefix(fData.title)}, con rasgos de {stripRostroPrefix(secondaryFaceData.title)}
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 14px' }}>
        {fData && (
          <SummaryCard emoji={fData.emoji} title={fData.title}
            color="var(--rose)" active={resultsTab === 'face'} onClick={() => setResultsTab('face')} />
        )}
      </div>

      {/* ⚠️ TEMP DEBUG — quitar después. Muestra qué vio y decidió el modelo. */}
      {geminiAnalysis && (
        <div style={{
          margin: '0 20px 14px', padding: '10px 12px', borderRadius: 10,
          background: '#fff5f8', border: '1px dashed #e6a5b8',
          fontFamily: 'monospace', fontSize: 11, color: '#7a4a58', lineHeight: 1.6,
          wordBreak: 'break-word',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>🔧 DEBUG (temporal)</div>
          <div>modelo: {geminiAnalysis._model || '?'}</div>
          <div>zona más ancha: {geminiAnalysis.observations?.zonaMasAncha || '?'}</div>
          <div>mandíbula: {geminiAnalysis.observations?.mandibula || '?'}</div>
          <div>mentón: {geminiAnalysis.observations?.menton || '?'}</div>
          <div>largo/ancho: {geminiAnalysis.observations?.largoVsAncho || '?'}</div>
          <div>forma final: {geminiAnalysis.primaryShape}{geminiAnalysis.secondaryShape ? ` (2ª: ${geminiAnalysis.secondaryShape})` : ''}</div>
          <div>corregido por red: {geminiAnalysis._correctedByObservations
            ? `SÍ (${geminiAnalysis._correctedByObservations.from}→${geminiAnalysis._correctedByObservations.to})`
            : 'no'}</div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', margin: '0 20px 14px', background: 'var(--bg-soft)', borderRadius: 11, overflow: 'hidden' }}>
        {[
          { key: 'face', label: '📐 Rostro' },
          { key: 'details', label: '🔍 Detalles' },
        ].map(t => (
          <button key={t.key} onClick={() => setResultsTab(t.key)} style={{
            flex: 1, padding: '11px 4px', border: 'none',
            background: resultsTab === t.key ? 'var(--bg-card)' : 'transparent',
            color: resultsTab === t.key ? 'var(--rose)' : 'var(--text-light)',
            fontSize: 10.5, fontWeight: resultsTab === t.key ? 700 : 500, cursor: 'pointer',
            boxShadow: resultsTab === t.key ? 'var(--shadow)' : 'none',
            borderRadius: resultsTab === t.key ? 9 : 0,
            transition: 'all 0.2s',
            position: 'relative',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>
        {resultsTab === 'face' && fData && (<>
          <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6, marginBottom: 16 }}>{fData.desc}</p>
          <Section title="💄 Maquillaje" items={fData.makeup} color="var(--rose)" />
          <Section title="✂️ Cortes de Cabello" items={fData.haircuts} color="var(--gold)" />
          <Section title="👔 Cuellos que Favorecen" items={fData.necklines} color="var(--pink)" />
          <InfoCard label="🎯 Dónde Aplicar Contorno" text={fData.contourZones} color="var(--gold)" />
          {faceResult && (
            <MetricsRow items={[
              { label: 'WHR', value: faceResult.whr, color: 'var(--rose)' },
              { label: 'Jaw/Frente', value: faceResult.jfr, color: 'var(--rose)' },
              { label: 'Cheek/Jaw', value: faceResult.cjr, color: 'var(--rose)' },
            ]} />
          )}
          {detailsAnalysis && (
            <button onClick={() => setResultsTab('details')} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: 'linear-gradient(135deg, rgba(250,147,165,0.12), rgba(130,98,110,0.08))',
              border: '1px solid rgba(250,147,165,0.35)',
              borderRadius: 10, padding: '10px 14px', marginTop: 12,
              cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <span style={{ fontSize: 12, color: 'var(--rose)', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                Análisis detallado disponible — toca para ver Detalles
              </span>
              <span style={{ marginLeft: 'auto', color: 'var(--rose)', fontSize: 14 }}>›</span>
            </button>
          )}
        </>)}

        {resultsTab === 'details' && (
          <DeepAnalysisTab analysis={detailsAnalysis} />
        )}
      </div>

      <p style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 20px 0', lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" /* legal fine print */ }}>
        Análisis basado en proporciones faciales y landmarks de IA. Los resultados son orientativos.
      </p>
    </div>
  );
}

// ─── Mini Components (light palette) ───

function Header({ onBack, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
      <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
    </div>
  );
}

function SummaryCard({ emoji, title, color, active, onClick, subtitle }) {
  return (
    <div onClick={onClick} style={{
      flex: '1 0 46%', background: 'var(--bg-card)', borderRadius: 14,
      padding: '14px 12px', textAlign: 'center', cursor: 'pointer',
      border: active ? `1px solid var(--pink)` : '1px solid var(--border)',
      boxShadow: active ? 'var(--shadow-hover)' : 'var(--shadow)',
      transition: 'border 0.2s, box-shadow 0.2s',
    }}>
      <div style={{ fontSize: 32, marginBottom: 4 }}>{emoji}</div>
      <div className="font-display" style={{ fontSize: 14, color: 'var(--text)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</div>}
    </div>
  );
}

function Section({ title, items, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 13, padding: '13px 15px', marginBottom: 10,
      border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 8 }}>{title}</p>
      {items.map((item, i) => (
        <p key={i} style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5, marginBottom: 3, paddingLeft: 4 }}>• {item}</p>
      ))}
    </div>
  );
}

function InfoCard({ label, text, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 13, padding: '12px 15px', marginTop: 10,
      border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 5 }}>{label}</p>
      <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function MetricsRow({ items }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 13, padding: '12px 15px', marginTop: 10,
      border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 8 }}>
        {items.map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DeepAnalysisTab ───
// Renders loading / populated states for the local "Detalles" tab.
// Analysis is built entirely on-device (no network) from MediaPipe metrics
// + the FACE_DATA/EYE_DATA knowledge base — it never fails.

const CHAR_ICONS = {
  frente:       '📏',
  pomulos:      '◉',
  mandibula:    '◻',
  menton:       '▽',
  proporciones: '↕',
};

function DeepAnalysisTab({ analysis }) {
  if (!analysis) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
          El análisis detallado aparecerá aquí automáticamente.
        </p>
      </div>
    );
  }

  const { summary, characteristics = {}, secondaryInfluences = [], recommendations = {}, confidence } = analysis;

  return (
    <div>
      {/* ── Header badge + summary ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: 'var(--rose)', color: '#fff',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            ANÁLISIS DETALLADO
          </span>
          <span style={{
            background: 'rgba(250,147,165,0.15)',
            border: '1px solid rgba(250,147,165,0.4)',
            color: 'var(--rose)',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 10, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            ✨ Análisis con IA
          </span>
          {confidence && (
            <span style={{
              fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif",
            }}>
              Confianza: {confidence}
            </span>
          )}
        </div>
        {summary && (
          <p className="font-display" style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
            {summary}
          </p>
        )}
      </div>

      {/* ── Caracteristicas del rostro ── */}
      {Object.keys(characteristics).length > 0 && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 13, padding: '14px 15px',
          marginBottom: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--rose)', marginBottom: 10, fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.02em' }}>
            Caracteristicas de tu rostro
          </p>
          {[
            { key: 'frente',       label: 'Frente' },
            { key: 'pomulos',      label: 'Pomulos' },
            { key: 'mandibula',    label: 'Mandibula' },
            { key: 'menton',       label: 'Menton' },
            { key: 'proporciones', label: 'Proporciones' },
          ].filter(({ key }) => characteristics[key]).map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{CHAR_ICONS[key]}</span>
              <div>
                <span className="font-display" style={{
                  fontSize: 12, color: 'var(--text)',
                  display: 'block', marginBottom: 1,
                }}>{label}</span>
                <span style={{
                  fontSize: 12, color: 'var(--text-light)', lineHeight: 1.5,
                  fontFamily: "'Cormorant Garamond', serif",
                }}>{characteristics[key]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Influencias secundarias ── */}
      {secondaryInfluences.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 13, padding: '14px 15px',
          marginBottom: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4, fontFamily: "'Cormorant Garamond', serif" }}>
            Influencias secundarias
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-light)', fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>
            Tu rostro tambien tiene rasgos de:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {secondaryInfluences.map((inf, i) => (
              <span key={i} style={{
                background: 'var(--bg-soft)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '5px 12px',
                fontSize: 12, color: 'var(--text)',
                fontFamily: "'Cormorant Garamond', serif",
              }}>{inf}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Recomendaciones personalizadas ── */}
      {(recommendations.haircuts || recommendations.makeup || recommendations.necklines) && (
        <div style={{ marginBottom: 12 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10,
            fontFamily: "'Cormorant Garamond', serif",
          }}>
            Recomendaciones personalizadas
          </p>
          {[
            { emoji: '✂️', label: 'Cortes que te favorecen', key: 'haircuts' },
            { emoji: '💄', label: 'Tu maquillaje ideal',     key: 'makeup' },
            { emoji: '👔', label: 'Escotes y accesorios',    key: 'necklines' },
          ].filter(({ key }) => recommendations[key]).map(({ emoji, label, key }) => (
            <div key={key} style={{
              background: 'var(--bg-card)', borderRadius: 13, padding: '13px 15px',
              marginBottom: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
            }}>
              <p style={{
                fontSize: 13, fontWeight: 700, color: 'var(--rose)', marginBottom: 6,
                fontFamily: "'Cormorant Garamond', serif",
              }}>
                {emoji} {label}
              </p>
              <p style={{
                fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6, margin: 0,
                fontFamily: "'Cormorant Garamond', serif",
              }}>
                {recommendations[key]}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// ─── BeforeAfterSlider ───
// Local component: stacks capturedPhoto (before) under overlayPhoto (after),
// clips the after layer with a draggable vertical divider.
function BeforeAfterSlider({ before, after }) {
  const [position, setPosition] = useState(50); // 0–100, percentage from left
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const animRef = useRef(null);

  // ── Native touch listener for scroll prevention (passive:false required on iOS) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onNativeTouchMove = (e) => {
      if (isDragging) e.preventDefault();
    };
    el.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onNativeTouchMove);
  }, [isDragging]);

  // ── Entry animation: 50 → 0 → 100 → 50 in ~1.5 s ──
  useEffect(() => {
    const DURATION = 1500; // ms total
    // Keyframes: [time(0-1), position(0-100)]
    const keyframes = [
      [0,    50],
      [0.25,  0],   // sweep left → full overlay visible
      [0.65, 100],  // sweep right → full original visible
      [1,    50],   // settle to center
    ];

    const lerp = (a, b, t) => a + (b - a) * t;

    const interpolate = (progress) => {
      for (let i = 1; i < keyframes.length; i++) {
        const [t0, v0] = keyframes[i - 1];
        const [t1, v1] = keyframes[i];
        if (progress <= t1) {
          const localT = (progress - t0) / (t1 - t0);
          // ease-in-out within segment
          const eased = localT < 0.5
            ? 2 * localT * localT
            : -1 + (4 - 2 * localT) * localT;
          return lerp(v0, v1, eased);
        }
      }
      return 50;
    };

    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      setPosition(interpolate(progress));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []); // only on mount

  // ── Shared drag logic ──
  const getPositionFromEvent = useCallback((clientX) => {
    if (!containerRef.current) return 50;
    const rect = containerRef.current.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    return Math.max(0, Math.min(100, raw));
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    // Stop entry animation if still running
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition(getPositionFromEvent(e.clientX));
  }, [isDragging, getPositionFromEvent]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events
  const handleTouchStart = useCallback((e) => {
    // Stop entry animation if still running
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition(getPositionFromEvent(touch.clientX));
  }, [isDragging, getPositionFromEvent]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const labelStyle = {
    position: 'absolute',
    top: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#fff',
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
    pointerEvents: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        cursor: isDragging ? 'col-resize' : 'default',
        touchAction: 'none',        // prevent scroll hijack on iOS
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* ── LAYER 1: original photo (behind) ── */}
      <img
        src={before}
        alt="Original"
        draggable={false}
        style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
      />

      {/* ── LAYER 2: overlay photo, clipped to left portion ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `inset(0 ${100 - position}% 0 0)`,
          WebkitClipPath: `inset(0 ${100 - position}% 0 0)`,
        }}
      >
        <img
          src={after}
          alt="Análisis"
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
        />
      </div>

      {/* ── Divider line ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${position}%`,
          transform: 'translateX(-50%)',
          width: 2,
          background: 'rgba(255,255,255,0.9)',
          boxShadow: '0 0 6px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Drag handle ── */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'absolute',
          top: '50%',
          left: `${position}%`,
          transform: 'translate(-50%, -50%)',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#fff',
          border: '2px solid var(--pink)',
          boxShadow: 'var(--shadow-hover)',
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          zIndex: 10,
          touchAction: 'none',
        }}
      >
        {/* Left arrow chevron */}
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
          <path d="M6 2L2 6L6 10" stroke="var(--rose)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {/* Right arrow chevron */}
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
          <path d="M2 2L6 6L2 10" stroke="var(--rose)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* ── Labels ── */}
      <span style={{ ...labelStyle, left: 10 }}>ANÁLISIS</span>
      <span style={{ ...labelStyle, right: 10 }}>ANTES</span>
    </div>
  );
}
