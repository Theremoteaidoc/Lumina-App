/* ═══════════════════════════════════════════════════════════════════
   FaceScanScreen v2 — Manual Capture Mode
   
   Flow: Intro → Camera (live with guide lines) → User taps capture
   → Quick 5-sample burst → Results with face + eye analysis
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
  const [phase, setPhase] = useState('intro');
  const [facingMode, setFacingMode] = useState('user');
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [faceResult, setFaceResult] = useState(null);
  const [eyeResult, setEyeResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [resultsTab, setResultsTab] = useState('face');
  const [mpReady, setMpReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastLandmarksRef = useRef(null);

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
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
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
    startCamera(next);
  }, [facingMode, startCamera]);

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
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      setMpReady(true);
    } catch (e) {
      console.error('MediaPipe error:', e);
      setErrorMsg('Error cargando modelo facial. Recarga la página.');
    }
  }, []);

  // ─── Live preview loop (draws guide + detects face but doesn't classify) ───

  const startPreview = useCallback(() => {
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

      // Draw grayscale video (mirrored for front camera)
      ctx.filter = 'grayscale(100%) contrast(1.05)';
      if (facingMode === 'user') {
        ctx.save(); ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0);
      }
      ctx.filter = 'none';

      // Try face detection if MediaPipe ready
      if (landmarkerRef.current) {
        try {
          const results = landmarkerRef.current.detectForVideo(video, performance.now());
          if (results.faceLandmarks?.[0]) {
            lastLandmarksRef.current = results.faceLandmarks[0];
            setFaceDetected(true);
            drawLandmarkOverlay(ctx, results.faceLandmarks[0], canvas.width, canvas.height);
          } else {
            lastLandmarksRef.current = null;
            setFaceDetected(false);
          }
        } catch (e) { /* skip frame */ }
      }

      // Always draw face guide oval
      drawFaceGuide(ctx, canvas.width, canvas.height);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [facingMode]);

  // ─── Draw face guide (always visible) ───

  const drawFaceGuide = (ctx, w, h) => {
    const cx = w / 2;
    const cy = h * 0.44;
    const rx = w * 0.28;
    const ry = h * 0.38;

    ctx.strokeStyle = 'rgba(92,177,133,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner marks
    const markSize = 14;
    ctx.strokeStyle = 'rgba(92,177,133,0.5)';
    ctx.lineWidth = 2.5;
    const corners = [
      [cx - rx, cy - ry], [cx + rx, cy - ry],
      [cx - rx, cy + ry], [cx + rx, cy + ry],
    ];
    for (const [x, y] of corners) {
      ctx.beginPath();
      // Horizontal mark
      ctx.moveTo(x < cx ? x : x - markSize, y < cy ? y : y);
      ctx.lineTo(x < cx ? x + markSize : x, y < cy ? y : y);
      // Vertical mark
      ctx.moveTo(x, y < cy ? y : y - markSize);
      ctx.lineTo(x, y < cy ? y + markSize : y);
      ctx.stroke();
    }
  };

  // ─── Draw landmarks overlay (when face detected) ───

  const drawLandmarkOverlay = (ctx, lm, w, h) => {
    const L = LANDMARKS;
    const px = (idx) => {
      const p = lm[idx];
      const x = facingMode === 'user' ? (1 - p.x) * w : p.x * w;
      return { x, y: p.y * h };
    };

    // Face oval contour
    ctx.strokeStyle = 'rgba(92,177,133,0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < FACE_OVAL_INDICES.length; i++) {
      const p = px(FACE_OVAL_INDICES[i]);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Measurement lines
    const drawLine = (i1, i2, label, color) => {
      const a = px(i1), b = px(i2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
      for (const p of [a, b]) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.font = 'bold 9px system-ui';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(label, (a.x + b.x) / 2, (a.y + b.y) / 2 - 6);
    };

    drawLine(L.foreheadLeft, L.foreheadRight, 'Frente', '#F2CC8F');
    drawLine(L.cheekLeft, L.cheekRight, 'Pómulos', '#5cb185');
    drawLine(L.jawLeft, L.jawRight, 'Mandíbula', '#d4748c');
    drawLine(L.hairline, L.chin, '', 'rgba(255,255,255,0.25)');

    // Eye outlines
    const drawEyeOutline = (indices, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < indices.length; i++) {
        const p = px(indices[i]);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    };
    drawEyeOutline(EYE_LANDMARKS.RIGHT_EYE.outline, 'rgba(212,163,115,0.5)');
    drawEyeOutline(EYE_LANDMARKS.LEFT_EYE.outline, 'rgba(212,163,115,0.5)');
  };

  // ─── Capture (manual trigger — takes 5 rapid samples) ───

  const handleCapture = useCallback(async () => {
    if (!landmarkerRef.current || !videoRef.current || capturing) return;
    setCapturing(true);

    const samples = [];
    const video = videoRef.current;

    // Take 5 samples over ~500ms for stability
    for (let i = 0; i < 5; i++) {
      try {
        const results = landmarkerRef.current.detectForVideo(video, performance.now());
        if (results.faceLandmarks?.[0]) {
          const lm = results.faceLandmarks[0];
          const feats = extractFeatures(lm);
          const eye = classifyEyeShape(lm);
          if (feats) samples.push({ features: feats, eye });
        }
      } catch (e) { /* skip */ }
      if (i < 4) await new Promise(r => setTimeout(r, 100));
    }

    if (samples.length === 0) {
      setErrorMsg('No se detectó un rostro. Asegúrate de estar bien iluminada y centrada.');
      setCapturing(false);
      return;
    }

    // Stop camera
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    stopCamera();

    // Average face features
    const avgFeatures = {};
    const keys = Object.keys(samples[0].features);
    for (const k of keys) {
      const vals = samples.map(s => s.features[k]).filter(v => typeof v === 'number' && !isNaN(v));
      avgFeatures[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    setFaceResult(classifyFaceShape(avgFeatures));

    // Eye shape — majority vote
    const eyeVotes = {};
    for (const s of samples) {
      if (s.eye) eyeVotes[s.eye.shape] = (eyeVotes[s.eye.shape] || 0) + 1;
    }
    const topEye = Object.entries(eyeVotes).sort((a, b) => b[1] - a[1])[0];
    if (topEye) {
      const best = [...samples].reverse().find(s => s.eye?.shape === topEye[0]);
      setEyeResult({
        shape: topEye[0],
        confidence: Math.min(Math.round((topEye[1] / samples.length) * 100), 90),
        features: best?.eye?.features || {},
        spacing: best?.eye?.spacing || 'proporcional',
      });
    }

    setCapturing(false);
    setPhase('results');
  }, [capturing, stopCamera]);

  // ─── Phase transitions ───

  const goToScanning = useCallback(async () => {
    setPhase('scanning');
    setErrorMsg(null);
    setFaceResult(null);
    setEyeResult(null);
    await startCamera(facingMode);
    await loadMediaPipe();
  }, [facingMode, startCamera, loadMediaPipe]);

  // Start preview loop when camera + mediapipe both ready
  useEffect(() => {
    if (phase === 'scanning' && cameraReady && mpReady) {
      startPreview();
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, cameraReady, mpReady, startPreview]);

  // Cleanup on unmount
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
          <p style={{ color: C.textSoft, fontSize: 13, lineHeight: 1.6, marginBottom: 28, maxWidth: 290, margin: '0 auto 28px' }}>
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
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: C.accent }}>📋 Para mejores resultados:</p>
            {['Buena iluminación frontal', 'Mira directo a la cámara', 'Retira el cabello de la frente', 'Expresión neutra, boca cerrada'].map((t, i) => (
              <p key={i} style={{ fontSize: 11, color: C.textSoft, marginBottom: 3, paddingLeft: 6 }}>• {t}</p>
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
  // RENDER — SCANNING (live camera + guide lines + capture button)
  // ═══════════════════════════════════════════════
  if (phase === 'scanning') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: C.text, display: 'flex', flexDirection: 'column' }}>
        {/* Camera view */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <video ref={videoRef} playsInline muted style={{
            position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0,
          }} />
          <canvas ref={canvasRef} style={{
            position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
          }} />

          {/* Status badge */}
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: faceDetected ? 'rgba(92,177,133,0.25)' : 'rgba(255,80,80,0.2)',
            border: `1px solid ${faceDetected ? 'rgba(92,177,133,0.5)' : 'rgba(255,80,80,0.4)'}`,
            borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 600,
            color: faceDetected ? '#7fd4a8' : '#ff9999',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          }}>
            {!cameraReady ? '⏳ Iniciando...' : !mpReady ? '⏳ Cargando modelo...' : faceDetected ? '✓ Rostro detectado' : '✗ Centra tu rostro en el óvalo'}
          </div>

          {/* Instructions at bottom of camera */}
          <div style={{
            position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center',
            fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '0 20px',
          }}>
            Centra tu rostro dentro del óvalo guía
          </div>
        </div>

        {/* Controls */}
        <div style={{
          padding: '16px 20px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', background: 'rgba(0,0,0,0.85)',
          flexShrink: 0,
        }}>
          {/* Cancel */}
          <button onClick={() => { stopCamera(); setPhase('intro'); }}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: C.textSoft,
              padding: '10px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', minWidth: 70,
            }}>
            ← Volver
          </button>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={!faceDetected || capturing}
            style={{
              width: 68, height: 68, borderRadius: '50%',
              background: faceDetected && !capturing
                ? `linear-gradient(135deg, ${C.accent}, #3d9b6e)`
                : 'rgba(255,255,255,0.12)',
              border: `3px solid ${faceDetected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)'}`,
              cursor: faceDetected && !capturing ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, transition: 'all 0.3s',
              opacity: capturing ? 0.5 : 1,
              boxShadow: faceDetected ? '0 0 20px rgba(92,177,133,0.3)' : 'none',
            }}
          >
            {capturing ? '⏳' : '📸'}
          </button>

          {/* Camera toggle */}
          <button onClick={toggleCamera}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: C.textSoft,
              padding: '10px 16px', borderRadius: 10, fontSize: 12, cursor: 'pointer', minWidth: 70,
              display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
            }}>
            🔄 {facingMode === 'user' ? 'Trasera' : 'Frontal'}
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '8px 20px 16px', background: 'rgba(0,0,0,0.85)' }}>
            <p style={{ color: '#ff9999', fontSize: 11, textAlign: 'center' }}>{errorMsg}</p>
          </div>
        )}
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
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
        <span style={{ fontSize: 17, fontWeight: 600 }}>Tus Resultados</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => { setPhase('intro'); }}
          style={{ background: C.card, border: 'none', color: C.accent, padding: '8px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>
          Repetir ↻
        </button>
      </div>

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

      {/* Tab bar */}
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

      {/* TAB CONTENT */}
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
                  : 'Oscurece ligeramente el lagrimal y no extiendas el delineado demasiado hacia afuera.'
                }
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
                ? 'Usa sombra clara en el lagrimal y oscura en la esquina externa. Lleva las cejas ligeramente hacia afuera.'
                : 'Oscurece ligeramente el lagrimal. No extiendas demasiado el delineado hacia afuera.'}
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

// ─── Reusable mini-components ───

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
      border: active ? `1px solid ${color}40` : '1px solid transparent',
      transition: 'border 0.2s',
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
