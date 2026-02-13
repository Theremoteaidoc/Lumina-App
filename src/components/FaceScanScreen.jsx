/* ═══════════════════════════════════════════════════════════════════
   FaceScanScreen v3 — Static Photo Capture
   
   Strategy: Live camera is ONLY a viewfinder. When user captures,
   we take a high-res still image and analyze it with MediaPipe in
   IMAGE mode (not VIDEO). This eliminates frame-to-frame variance.
   
   Flow: Intro → Camera viewfinder → Tap capture → Freeze + Analyze
   → Show photo with overlay + results
   ═══════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback } from 'react';
import { LANDMARKS, extractFeatures, classifyFaceShape, FACE_OVAL_INDICES } from '../utils/faceClassifier';
import { classifyEyeShape, EYE_LANDMARKS } from '../utils/eyeClassifier';
import { FACE_DATA, EYE_DATA, COMBINED_TIPS } from '../data/appData';

const C = {
  bg: '#0a0a0f',
  card: 'rgba(255,255,255,0.06)',
  accent: '#5cb185',
  accentSoft: 'rgba(92,177,133,0.15)',
  text: '#f0f0f0',
  textSoft: 'rgba(255,255,255,0.55)',
  pink: '#d4748c',
  gold: '#d4a373',
};

export default function FaceScanScreen({ onBack }) {
  // ─── State ───
  const [phase, setPhase] = useState('intro');
  // intro → scanning → analyzing → results
  const [facingMode, setFacingMode] = useState('user');
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceResult, setFaceResult] = useState(null);
  const [eyeResult, setEyeResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [resultsTab, setResultsTab] = useState('face');
  const [mpReady, setMpReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);    // dataURL of captured photo
  const [overlayPhoto, setOverlayPhoto] = useState(null);      // dataURL with measurement overlay
  const [analyzeStep, setAnalyzeStep] = useState('');          // analyzing phase text

  const videoRef = useRef(null);
  const canvasRef = useRef(null);     // live preview canvas
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const facingRef = useRef('user');   // track current facing for draw functions

  // Keep facingRef in sync
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

  // Switch MediaPipe mode between IMAGE and VIDEO
  const setMpMode = useCallback(async (mode) => {
    if (!landmarkerRef.current) return;
    try {
      await landmarkerRef.current.setOptions({ runningMode: mode });
    } catch (e) { console.warn('setOptions error', e); }
  }, []);

  // ─── Live preview loop (viewfinder only — lightweight face check) ───

  const startPreview = useCallback(async () => {
    // Switch to VIDEO mode for live preview
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

      // Draw grayscale mirrored video
      ctx.filter = 'grayscale(100%) contrast(1.05)';
      if (facingRef.current === 'user') {
        ctx.save(); ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0);
      }
      ctx.filter = 'none';

      // Lightweight face detection for guide feedback
      if (landmarkerRef.current) {
        try {
          const results = landmarkerRef.current.detectForVideo(video, performance.now());
          if (results.faceLandmarks?.[0]) {
            setFaceDetected(true);
            drawLiveOverlay(ctx, results.faceLandmarks[0], canvas.width, canvas.height);
          } else {
            setFaceDetected(false);
          }
        } catch (e) { /* skip frame */ }
      }

      // Always draw guide oval
      drawFaceGuide(ctx, canvas.width, canvas.height);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [setMpMode]);

  // ─── Face guide oval ───
  const drawFaceGuide = (ctx, w, h) => {
    const cx = w / 2, cy = h * 0.44;
    const rx = w * 0.28, ry = h * 0.38;

    ctx.strokeStyle = 'rgba(92,177,133,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner bracket marks
    const s = 16;
    ctx.strokeStyle = 'rgba(92,177,133,0.45)';
    ctx.lineWidth = 2.5;
    // Top-left
    ctx.beginPath(); ctx.moveTo(cx-rx, cy-ry+s); ctx.lineTo(cx-rx, cy-ry); ctx.lineTo(cx-rx+s, cy-ry); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(cx+rx-s, cy-ry); ctx.lineTo(cx+rx, cy-ry); ctx.lineTo(cx+rx, cy-ry+s); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(cx-rx, cy+ry-s); ctx.lineTo(cx-rx, cy+ry); ctx.lineTo(cx-rx+s, cy+ry); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(cx+rx-s, cy+ry); ctx.lineTo(cx+rx, cy+ry); ctx.lineTo(cx+rx, cy+ry-s); ctx.stroke();
  };

  // ─── Lightweight live overlay (just contour + eyes, no measurements) ───
  const drawLiveOverlay = (ctx, lm, w, h) => {
    const px = (idx) => {
      const p = lm[idx];
      const x = facingRef.current === 'user' ? (1 - p.x) * w : p.x * w;
      return { x, y: p.y * h };
    };

    // Face oval contour — thin, subtle
    ctx.strokeStyle = 'rgba(92,177,133,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < FACE_OVAL_INDICES.length; i++) {
      const p = px(FACE_OVAL_INDICES[i]);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Eye outlines — subtle
    const drawEye = (indices) => {
      ctx.strokeStyle = 'rgba(212,163,115,0.35)';
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

  // ─── CAPTURE — take high-res still and analyze ───

  const handleCapture = useCallback(async () => {
    if (!landmarkerRef.current || !videoRef.current) return;
    const video = videoRef.current;

    // 1. Stop the preview loop
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    // 2. Capture high-res still from video to an offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const offCtx = offscreen.getContext('2d');

    // Draw mirrored for front camera
    if (facingRef.current === 'user') {
      offCtx.save(); offCtx.scale(-1, 1);
      offCtx.drawImage(video, -offscreen.width, 0, offscreen.width, offscreen.height);
      offCtx.restore();
    } else {
      offCtx.drawImage(video, 0, 0);
    }

    // Save original photo
    const photoDataUrl = offscreen.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(photoDataUrl);

    // 3. Stop camera (free resources)
    stopCamera();

    // 4. Switch to analyzing phase
    setPhase('analyzing');
    setAnalyzeStep('Detectando rostro...');

    // Small delay so UI updates
    await new Promise(r => setTimeout(r, 100));

    // 5. Analyze the STILL image with MediaPipe IMAGE mode
    try {
      await setMpMode('IMAGE');
      await new Promise(r => setTimeout(r, 50));

      setAnalyzeStep('Mapeando 478 landmarks faciales...');
      const results = landmarkerRef.current.detect(offscreen);

      if (!results.faceLandmarks?.[0]) {
        setErrorMsg('No se detectó un rostro en la foto. Intenta de nuevo con mejor iluminación.');
        setPhase('scanning');
        startCamera(facingRef.current);
        return;
      }

      const lm = results.faceLandmarks[0];

      // 6. Quality checks
      setAnalyzeStep('Verificando calidad...');
      await new Promise(r => setTimeout(r, 200));

      const chin = lm[152];
      const forehead = lm[10];
      const faceH = Math.abs(chin.y - forehead.y);
      const faceCenter = (lm[234].x + lm[454].x) / 2;

      // Face too small?
      if (faceH < 0.15) {
        setErrorMsg('Tu rostro está muy lejos. Acércate más a la cámara.');
        setPhase('scanning');
        startCamera(facingRef.current);
        return;
      }
      // Face very off-center?
      if (Math.abs(faceCenter - 0.5) > 0.25) {
        setErrorMsg('Tu rostro está muy descentrado. Alinéalo dentro del óvalo.');
        setPhase('scanning');
        startCamera(facingRef.current);
        return;
      }

      // 7. Extract features & classify
      setAnalyzeStep('Analizando proporciones faciales...');
      await new Promise(r => setTimeout(r, 300));
      const features = extractFeatures(lm);
      if (!features) {
        setErrorMsg('No se pudieron extraer proporciones. Intenta de nuevo.');
        setPhase('scanning');
        startCamera(facingRef.current);
        return;
      }
      const faceRes = classifyFaceShape(features);
      setFaceResult(faceRes);

      setAnalyzeStep('Clasificando forma de ojos...');
      await new Promise(r => setTimeout(r, 200));
      const eyeRes = classifyEyeShape(lm);
      setEyeResult(eyeRes);

      // 8. Generate overlay image (photo + measurement lines)
      setAnalyzeStep('Generando visualización...');
      await new Promise(r => setTimeout(r, 150));
      const overlayUrl = drawResultOverlay(offscreen, lm, offscreen.width, offscreen.height);
      setOverlayPhoto(overlayUrl);

      // 9. Done!
      setPhase('results');
      setResultsTab('face');

    } catch (e) {
      console.error('Analysis error:', e);
      setErrorMsg('Error durante el análisis. Intenta de nuevo.');
      setPhase('scanning');
      startCamera(facingRef.current);
    }
  }, [stopCamera, setMpMode, startCamera]);

  // ─── Draw result overlay on captured photo ───
  const drawResultOverlay = (sourceCanvas, lm, w, h) => {
    const overlay = document.createElement('canvas');
    overlay.width = w;
    overlay.height = h;
    const ctx = overlay.getContext('2d');

    // Draw the original photo (already mirrored if needed)
    ctx.drawImage(sourceCanvas, 0, 0);

    // Apply slight darken for contrast
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, w, h);

    const px = (idx) => {
      const p = lm[idx];
      // Landmarks are in ORIGINAL image space (before mirror)
      // But our sourceCanvas is already mirrored, so we need to mirror landmark x too
      const x = facingRef.current === 'user' ? (1 - p.x) * w : p.x * w;
      return { x, y: p.y * h };
    };

    const L = LANDMARKS;

    // Face oval contour
    ctx.strokeStyle = 'rgba(92,177,133,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < FACE_OVAL_INDICES.length; i++) {
      const p = px(FACE_OVAL_INDICES[i]);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Measurement lines with labels
    const drawMeasure = (i1, i2, label, color) => {
      const a = px(i1), b = px(i2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);

      // Dots
      for (const p of [a, b]) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Label with background
      if (label) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 10;
        ctx.font = `bold ${Math.max(11, w * 0.018)}px system-ui`;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(mx - tw/2 - 5, my - 8, tw + 10, 16, 4);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mx, my);
      }
    };

    drawMeasure(L.foreheadLeft, L.foreheadRight, 'Frente', '#F2CC8F');
    drawMeasure(L.cheekLeft, L.cheekRight, 'Pómulos', '#7fd4a8');
    drawMeasure(L.jawLeft, L.jawRight, 'Mandíbula', '#d4748c');
    drawMeasure(L.hairline, L.chin, 'Largo', 'rgba(255,255,255,0.5)');

    // Eye outlines
    const drawEyeOverlay = (indices) => {
      ctx.strokeStyle = 'rgba(212,163,115,0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < indices.length; i++) {
        const p = px(indices[i]);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    };
    drawEyeOverlay(EYE_LANDMARKS.RIGHT_EYE.outline);
    drawEyeOverlay(EYE_LANDMARKS.LEFT_EYE.outline);

    return overlay.toDataURL('image/jpeg', 0.88);
  };

  // ─── Phase transitions ───

  const goToScanning = useCallback(async () => {
    setPhase('scanning');
    setErrorMsg(null);
    setFaceResult(null);
    setEyeResult(null);
    setCapturedPhoto(null);
    setOverlayPhoto(null);
    await loadMediaPipe();
    await startCamera(facingMode);
  }, [facingMode, startCamera, loadMediaPipe]);

  // Start preview loop when both ready
  useEffect(() => {
    if (phase === 'scanning' && cameraReady && mpReady) {
      startPreview();
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, cameraReady, mpReady, startPreview]);

  // Cleanup
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ═══════════════════════════════════════════════
  // RENDER — INTRO
  // ═══════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
        <Header onBack={onBack} title="Análisis Facial" />
        <div style={{ padding: '12px 24px', textAlign: 'center' }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%', background: C.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '16px auto 20px', fontSize: 42,
          }}>🪞</div>

          <h2 style={{ fontSize: 21, fontWeight: 700, marginBottom: 6 }}>Visagismo Inteligente</h2>
          <p style={{ color: C.textSoft, fontSize: 13, lineHeight: 1.6, maxWidth: 290, margin: '0 auto 28px' }}>
            Analizamos tu rostro y ojos con IA para darte recomendaciones personalizadas de maquillaje, cortes y más.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
            {[{ e: '📐', l: 'Forma del rostro' }, { e: '👁️', l: 'Forma de ojos' }, { e: '💄', l: 'Tips personalizados' }].map(({ e, l }) => (
              <div key={l} style={{ background: C.card, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                <span style={{ fontSize: 16 }}>{e}</span>{l}
              </div>
            ))}
          </div>

          <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', textAlign: 'left', marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: C.accent }}>📋 Para mejores resultados:</p>
            {[
              '💡 Buena iluminación frontal (sin sombras fuertes)',
              '📷 Mira directo a la cámara',
              '💇‍♀️ Retira el cabello de la frente y mandíbula',
              '😐 Expresión neutra, boca cerrada',
              '🚫 Sin lentes ni accesorios grandes',
            ].map((t, i) => (
              <p key={i} style={{ fontSize: 11.5, color: C.textSoft, marginBottom: 4, paddingLeft: 4 }}>{t}</p>
            ))}
          </div>

          {errorMsg && <p style={{ color: '#e74c3c', fontSize: 12, marginBottom: 14 }}>{errorMsg}</p>}

          <button onClick={goToScanning} style={{
            width: '100%', padding: '15px', borderRadius: 14,
            background: `linear-gradient(135deg, ${C.accent}, #3d9b6e)`,
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            Abrir Cámara ✨
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — SCANNING (viewfinder)
  // ═══════════════════════════════════════════════
  if (phase === 'scanning') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: C.text, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <video ref={videoRef} playsInline muted style={{
            position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0,
          }} />
          <canvas ref={canvasRef} style={{
            position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
          }} />

          {/* Status */}
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: faceDetected ? 'rgba(92,177,133,0.2)' : 'rgba(255,80,80,0.15)',
            border: `1px solid ${faceDetected ? 'rgba(92,177,133,0.4)' : 'rgba(255,80,80,0.3)'}`,
            borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 600,
            color: faceDetected ? '#7fd4a8' : '#ff9999',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}>
            {!cameraReady ? '⏳ Iniciando cámara...'
              : !mpReady ? '⏳ Cargando modelo IA...'
              : faceDetected ? '✓ Rostro detectado — ¡Toma la foto!'
              : '✗ Centra tu rostro en el óvalo'}
          </div>

          {/* Tip at bottom */}
          <div style={{
            position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center',
            fontSize: 10, color: 'rgba(255,255,255,0.35)', padding: '0 20px',
          }}>
            Mantén expresión neutra y buena iluminación
          </div>
        </div>

        {/* Controls bar */}
        <div style={{
          padding: '16px 20px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', background: 'rgba(0,0,0,0.9)', flexShrink: 0,
        }}>
          <button onClick={() => { stopCamera(); setPhase('intro'); }}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: C.textSoft,
              padding: '10px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', minWidth: 70 }}>
            ← Volver
          </button>

          {/* Capture button */}
          <button onClick={handleCapture} disabled={!faceDetected}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: faceDetected
                ? `linear-gradient(135deg, ${C.accent}, #3d9b6e)`
                : 'rgba(255,255,255,0.08)',
              border: `4px solid ${faceDetected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.12)'}`,
              cursor: faceDetected ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, transition: 'all 0.3s',
              boxShadow: faceDetected ? '0 0 24px rgba(92,177,133,0.35)' : 'none',
            }}>
            📸
          </button>

          <button onClick={toggleCamera}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: C.textSoft,
              padding: '10px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', minWidth: 70,
              display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            🔄 {facingMode === 'user' ? 'Trasera' : 'Frontal'}
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '6px 20px 14px', background: 'rgba(0,0,0,0.9)' }}>
            <p style={{ color: '#ff9999', fontSize: 11, textAlign: 'center' }}>{errorMsg}</p>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — ANALYZING (frozen photo + progress)
  // ═══════════════════════════════════════════════
  if (phase === 'analyzing') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: C.text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Show captured photo */}
        {capturedPhoto && (
          <div style={{ position: 'relative', width: '80%', maxWidth: 340, aspectRatio: '3/4', borderRadius: 18, overflow: 'hidden', marginBottom: 30 }}>
            <img src={capturedPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.05)' }} />
            {/* Scanning animation overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 0%, rgba(92,177,133,0.08) 50%, transparent 100%)',
              animation: 'scanLine 2s ease-in-out infinite',
            }} />
            <div style={{ position: 'absolute', inset: 0, border: `2px solid ${C.accent}40`, borderRadius: 18 }} />
          </div>
        )}

        {/* Analyzing spinner + text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 20, height: 20, border: `2px solid ${C.accent}40`,
            borderTopColor: C.accent, borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{analyzeStep}</span>
        </div>
        <p style={{ fontSize: 11, color: C.textSoft }}>Analizando foto estática de alta resolución</p>

        {/* CSS animations */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes scanLine {
            0%, 100% { transform: translateY(-100%); }
            50% { transform: translateY(100%); }
          }
        `}</style>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — RESULTS
  // ═══════════════════════════════════════════════
  const fData = faceResult ? FACE_DATA[faceResult.shape] : null;
  const eData = eyeResult ? EYE_DATA[eyeResult.shape] : null;
  const combinedKey = faceResult && eyeResult ? `${faceResult.shape}+${eyeResult.shape}` : null;
  const combinedTip = combinedKey ? COMBINED_TIPS[combinedKey] : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
        <span style={{ fontSize: 17, fontWeight: 600 }}>Tus Resultados</span>
        <div style={{ flex: 1 }} />
        <button onClick={goToScanning}
          style={{ background: C.card, border: 'none', color: C.accent, padding: '8px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>
          Repetir ↻
        </button>
      </div>

      {/* Photo with overlay */}
      {overlayPhoto && (
        <div style={{ margin: '0 20px 14px', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={overlayPhoto} alt="Análisis" style={{ width: '100%', display: 'block', filter: 'grayscale(80%) contrast(1.05)' }} />
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 14px' }}>
        {fData && (
          <SummaryCard
            emoji={fData.emoji} title={fData.title} conf={faceResult.confidence}
            color={C.accent} active={resultsTab === 'face'} onClick={() => setResultsTab('face')}
          />
        )}
        {eData && (
          <SummaryCard
            emoji={eData.emoji} title={eData.title} conf={eyeResult.confidence}
            color={C.pink} active={resultsTab === 'eyes'} onClick={() => setResultsTab('eyes')}
            subtitle={eyeResult.spacing !== 'proporcional' ? `Ojos ${eyeResult.spacing}` : null}
          />
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', margin: '0 20px 14px', background: C.card, borderRadius: 11, overflow: 'hidden' }}>
        {[
          { key: 'face', label: '📐 Rostro' },
          { key: 'eyes', label: '👁️ Ojos' },
          { key: 'combined', label: '✨ Combinado' },
        ].map(t => (
          <button key={t.key} onClick={() => setResultsTab(t.key)} style={{
            flex: 1, padding: '11px 6px', border: 'none',
            background: resultsTab === t.key ? C.accentSoft : 'transparent',
            color: resultsTab === t.key ? C.accent : C.textSoft,
            fontSize: 11.5, fontWeight: resultsTab === t.key ? 700 : 500, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* ═══ FACE ═══ */}
        {resultsTab === 'face' && fData && (<>
          <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.6, marginBottom: 16 }}>{fData.desc}</p>
          <Section title="💄 Maquillaje" items={fData.makeup} color={C.pink} />
          <Section title="✂️ Cortes de Cabello" items={fData.haircuts} color={C.gold} />
          <Section title="👔 Cuellos que Favorecen" items={fData.necklines} color={C.accent} />
          <InfoCard label="🎯 Dónde Aplicar Contorno" text={fData.contourZones} color={C.gold} />
          {faceResult && (
            <MetricsRow items={[
              { label: 'WHR', value: faceResult.whr, color: C.accent },
              { label: 'Jaw/Frente', value: faceResult.jfr, color: C.accent },
              { label: 'Cheek/Jaw', value: faceResult.cjr, color: C.accent },
            ]} />
          )}
        </>)}

        {/* ═══ EYES ═══ */}
        {resultsTab === 'eyes' && eData && (<>
          <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.6, marginBottom: 16 }}>{eData.desc}</p>
          <Section title="✏️ Delineador" items={eData.eyeliner} color={C.pink} />
          <Section title="🎨 Sombras" items={eData.eyeshadow} color={C.gold} />
          <Section title="💡 Tips Especiales" items={eData.tips} color={C.accent} />
          {eyeResult?.features && (<>
            <MetricsRow items={[
              { label: 'EAR', value: eyeResult.features.ear, color: C.pink },
              { label: 'Ángulo', value: `${eyeResult.features.cornerAngle}°`, color: C.pink },
              { label: 'Capucha', value: eyeResult.features.hoodScore, color: C.pink },
            ]} />
            {eyeResult.spacing !== 'proporcional' && (
              <InfoCard
                label={`👀 Ojos ${eyeResult.spacing}`}
                text={eyeResult.spacing === 'juntos'
                  ? 'Ilumina el lagrimal con shimmer claro y oscurece la esquina externa para crear separación visual.'
                  : 'Oscurece ligeramente el lagrimal y no extiendas el delineado demasiado hacia afuera.'}
                color={C.gold}
              />
            )}
          </>)}
        </>)}

        {/* ═══ COMBINED ═══ */}
        {resultsTab === 'combined' && fData && eData && (<>
          <div style={{
            background: `linear-gradient(135deg, ${C.accentSoft}, rgba(212,116,140,0.08))`,
            borderRadius: 14, padding: '16px', marginBottom: 14,
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              {fData.emoji} {fData.title} + {eData.emoji} {eData.title}
            </p>
            <p style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>
              {combinedTip || `Aplica las técnicas de contorno para tu rostro ${fData.title.toLowerCase()} y adapta el maquillaje de ojos para tus ojos ${eData.title.toLowerCase()}.`}
            </p>
          </div>

          <div style={{ background: C.card, borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 10 }}>💄 Tu Look Personalizado</p>
            <TipRow icon="📐" label="Contorno" text={fData.contourZones} />
            <TipRow icon="✏️" label="Delineador" text={eData.eyeliner[0]} />
            <TipRow icon="🎨" label="Sombras" text={eData.eyeshadow[0]} />
            <TipRow icon="✂️" label="Corte ideal" text={fData.haircuts[0]} />
            <TipRow icon="👔" label="Cuello" text={fData.necklines[0]} />
          </div>

          {eyeResult?.spacing !== 'proporcional' && (
            <InfoCard
              label={`👀 Tip para ojos ${eyeResult.spacing}`}
              text={eyeResult.spacing === 'juntos'
                ? 'Usa sombra clara en el lagrimal y oscura en la esquina externa.'
                : 'Oscurece ligeramente el lagrimal. No extiendas el delineado hacia afuera.'}
              color={C.gold}
            />
          )}
        </>)}
      </div>

      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 20px 0', lineHeight: 1.4 }}>
        Análisis basado en proporciones faciales y landmarks de IA. Los resultados son orientativos.
      </p>
    </div>
  );
}

// ─── Reusable Components ───

function Header({ onBack, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#f0f0f0', fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
      <span style={{ fontSize: 17, fontWeight: 600, color: '#f0f0f0' }}>{title}</span>
    </div>
  );
}

function SummaryCard({ emoji, title, conf, color, active, onClick, subtitle }) {
  return (
    <div onClick={onClick} style={{
      flex: '1 0 46%', background: 'rgba(255,255,255,0.06)', borderRadius: 14,
      padding: '14px 12px', textAlign: 'center', cursor: 'pointer',
      border: active ? `1px solid ${color}40` : '1px solid transparent', transition: 'border 0.2s',
    }}>
      <div style={{ fontSize: 32, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 10, color, marginTop: 3 }}>{conf}% confianza</div>
      {subtitle && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function Section({ title, items, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 13, padding: '13px 15px', marginBottom: 10 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{title}</p>
      {items.map((item, i) => (
        <p key={i} style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 3, paddingLeft: 4 }}>• {item}</p>
      ))}
    </div>
  );
}

function InfoCard({ label, text, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 13, padding: '12px 15px', marginTop: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 5 }}>{label}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function MetricsRow({ items }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 13, padding: '12px 15px', marginTop: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 8 }}>
        {items.map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipRow({ icon, label, text }) {
  return (
    <div style={{ display: 'flex', gap: 7, marginBottom: 8, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
      <div>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{label}: </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{text}</span>
      </div>
    </div>
  );
}
