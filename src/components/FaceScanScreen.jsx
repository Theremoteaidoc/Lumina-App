/* ═══════════════════════════════════════════════════════════════════
   FaceScanScreen — Visagismo Analysis
   
   Features:
   - Front/back camera toggle
   - Grayscale scanning mode with live overlay
   - Face shape classification (hybrid ML + rules)
   - Eye shape classification (EAR + corner angle + hooded detection)
   - Combined face + eye makeup recommendations
   ═══════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback } from 'react';
import { LANDMARKS, extractFeatures, classifyFaceShape, FACE_OVAL_INDICES } from '../utils/faceClassifier';
import { classifyEyeShape, EYE_LANDMARKS } from '../utils/eyeClassifier';
import { FACE_DATA, EYE_DATA, COMBINED_TIPS } from '../data/appData';

// ─── Styling constants ───

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

const SHAPE_NAMES = {
  ovalado: 'Ovalado', redondo: 'Redondo', cuadrado: 'Cuadrado',
  corazon: 'Corazón', alargado: 'Alargado', diamante: 'Diamante',
};

const EYE_NAMES = {
  almendra: 'Almendra', redondo: 'Redondos', rasgado: 'Rasgados',
  caido: 'Caídos', encapotado: 'Encapotados',
};

export default function FaceScanScreen({ onBack }) {
  // ─── State ───
  const [phase, setPhase] = useState('intro'); // intro | scanning | results
  const [facingMode, setFacingMode] = useState('user'); // user | environment
  const [cameraReady, setCameraReady] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [faceResult, setFaceResult] = useState(null);
  const [eyeResult, setEyeResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [resultsTab, setResultsTab] = useState('face'); // face | eyes | combined

  // ─── Refs ───
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const samplesRef = useRef([]);

  // ─── Camera management ───

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async (facing) => {
    stopCamera();
    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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

  // ─── MediaPipe Loader ───

  const loadMediaPipe = useCallback(async () => {
    if (landmarkerRef.current) return;
    try {
      // Wait for CDN-loaded globals
      if (!window.FilesetResolver || !window.FaceLandmarker) {
        await new Promise((resolve) => {
          if (window.FilesetResolver) return resolve();
          window.addEventListener('mediapipe-ready', resolve, { once: true });
          // Timeout after 15s
          setTimeout(resolve, 15000);
        });
      }

      if (!window.FilesetResolver || !window.FaceLandmarker) {
        throw new Error('MediaPipe not loaded');
      }

      const vision = await window.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );
      const fl = await window.FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
      landmarkerRef.current = fl;
    } catch (e) {
      console.error('MediaPipe load error:', e);
      setErrorMsg('Error cargando el modelo de detección facial. Recarga la página.');
    }
  }, []);

  // MediaPipe loads from CDN in index.html

  // ─── Scanning loop ───

  const startScanning = useCallback(async () => {
    setPhase('scanning');
    setScanProgress(0);
    setFaceResult(null);
    setEyeResult(null);
    samplesRef.current = [];
    setErrorMsg(null);

    await startCamera(facingMode);
    await loadMediaPipe();

    if (!landmarkerRef.current) {
      setErrorMsg('No se pudo cargar el modelo. Intenta recargar la página.');
      return;
    }

    const SAMPLE_COUNT = 20;
    const SAMPLE_INTERVAL = 150; // ms between samples
    let sampleIdx = 0;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !landmarkerRef.current || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw grayscale video
      ctx.filter = 'grayscale(100%)';
      if (facingMode === 'user') {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0);
      }
      ctx.filter = 'none';

      // Run face landmark detection
      try {
        const results = landmarkerRef.current.detectForVideo(video, performance.now());
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const lm = results.faceLandmarks[0];
          drawOverlay(ctx, lm, canvas.width, canvas.height);

          // Collect samples
          if (sampleIdx < SAMPLE_COUNT) {
            const feats = extractFeatures(lm);
            if (feats) {
              const eyeRes = classifyEyeShape(lm);
              samplesRef.current.push({ features: feats, eye: eyeRes });
              sampleIdx++;
              setScanProgress(Math.round((sampleIdx / SAMPLE_COUNT) * 100));
            }
          }

          // Done sampling
          if (sampleIdx >= SAMPLE_COUNT) {
            finishAnalysis();
            return;
          }
        }
      } catch (e) {
        // Frame processing error — skip
      }

      rafRef.current = requestAnimationFrame(processFrame);
    };

    // Wait for camera to be ready then start
    const waitForVideo = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        processFrame();
      } else {
        setTimeout(waitForVideo, 100);
      }
    };
    waitForVideo();
  }, [facingMode, startCamera, loadMediaPipe]);

  const finishAnalysis = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stopCamera();

    const samples = samplesRef.current;
    if (samples.length === 0) {
      setErrorMsg('No se detectó un rostro. Intenta con mejor iluminación.');
      setPhase('intro');
      return;
    }

    // Average features across samples for stability
    const avgFeatures = {};
    const keys = Object.keys(samples[0].features);
    for (const k of keys) {
      const vals = samples.map(s => s.features[k]).filter(v => typeof v === 'number' && !isNaN(v));
      avgFeatures[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }

    // Face shape from averaged features
    const faceRes = classifyFaceShape(avgFeatures);
    setFaceResult(faceRes);

    // Eye shape — majority vote from samples
    const eyeVotes = {};
    for (const s of samples) {
      if (s.eye) {
        eyeVotes[s.eye.shape] = (eyeVotes[s.eye.shape] || 0) + 1;
      }
    }
    const topEye = Object.entries(eyeVotes).sort((a, b) => b[1] - a[1])[0];
    if (topEye) {
      // Get the features from the most recent matching sample
      const bestSample = samples.reverse().find(s => s.eye?.shape === topEye[0]);
      setEyeResult({
        shape: topEye[0],
        confidence: Math.min(Math.round((topEye[1] / samples.length) * 100), 90),
        features: bestSample?.eye?.features || {},
        spacing: bestSample?.eye?.spacing || 'proporcional',
      });
    }

    setPhase('results');
  }, [stopCamera]);

  // ─── Draw overlay on scanning canvas ───

  const drawOverlay = (ctx, lm, w, h) => {
    const L = LANDMARKS;

    // Convert normalized landmark to pixel
    const px = (idx) => {
      const p = lm[idx];
      const x = facingMode === 'user' ? (1 - p.x) * w : p.x * w;
      return { x, y: p.y * h };
    };

    // Face oval (subtle green outline)
    ctx.strokeStyle = 'rgba(92,177,133,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < FACE_OVAL_INDICES.length; i++) {
      const p = px(FACE_OVAL_INDICES[i]);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Measurement lines
    const drawLine = (idx1, idx2, label, color) => {
      const a = px(idx1);
      const b = px(idx2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots at endpoints
      for (const p of [a, b]) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Label
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(label, mx, my - 6);
    };

    drawLine(L.foreheadLeft, L.foreheadRight, 'Frente', '#F2CC8F');
    drawLine(L.cheekLeft, L.cheekRight, 'Pómulos', C.accent);
    drawLine(L.jawLeft, L.jawRight, 'Mandíbula', C.pink);
    drawLine(L.hairline, L.chin, 'Largo', 'rgba(255,255,255,0.4)');

    // Eye outlines
    const drawEye = (indices, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < indices.length; i++) {
        const p = px(indices[i]);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.stroke();
    };

    drawEye(EYE_LANDMARKS.RIGHT_EYE.outline, 'rgba(212,116,140,0.6)');
    drawEye(EYE_LANDMARKS.LEFT_EYE.outline, 'rgba(212,116,140,0.6)');
  };

  // ─── Cleanup ───
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ═══════════════════════════════════════════════
  // RENDER — INTRO PHASE
  // ═══════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Análisis Facial</span>
        </div>

        <div style={{ padding: '20px 24px', textAlign: 'center' }}>
          {/* Icon */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%', background: C.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '20px auto 24px', fontSize: 48,
          }}>
            🪞
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Visagismo Inteligente</h2>
          <p style={{ color: C.textSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 32, maxWidth: 300, margin: '0 auto 32px' }}>
            Analizaremos la forma de tu rostro y tus ojos usando inteligencia artificial para darte recomendaciones personalizadas de maquillaje.
          </p>

          {/* What we'll analyze */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { emoji: '📐', label: 'Forma del rostro' },
              { emoji: '👁️', label: 'Forma de ojos' },
              { emoji: '💄', label: 'Tips de maquillaje' },
            ].map(({ emoji, label }) => (
              <div key={label} style={{
                background: C.card, borderRadius: 14, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
              }}>
                <span style={{ fontSize: 18 }}>{emoji}</span>
                {label}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div style={{
            background: C.card, borderRadius: 16, padding: '18px 20px',
            textAlign: 'left', marginBottom: 28,
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: C.accent }}>📋 Para mejores resultados:</p>
            {[
              'Buena iluminación frontal, sin sombras fuertes',
              'Mira directamente a la cámara',
              'Retira el cabello de la frente si es posible',
              'Expresión neutra, boca cerrada',
            ].map((tip, i) => (
              <p key={i} style={{ fontSize: 12, color: C.textSoft, marginBottom: 4, paddingLeft: 8 }}>
                • {tip}
              </p>
            ))}
          </div>

          {errorMsg && (
            <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 16 }}>{errorMsg}</p>
          )}

          <button
            onClick={startScanning}
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 14,
              background: `linear-gradient(135deg, ${C.accent}, #3d9b6e)`,
              color: '#fff', border: 'none', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
          >
            Iniciar Escaneo ✨
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — SCANNING PHASE
  // ═══════════════════════════════════════════════
  if (phase === 'scanning') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: C.text, position: 'relative' }}>
        {/* Camera feed with canvas overlay */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#111' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover', opacity: 0,
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Face guide oval */}
          {!cameraReady && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: C.textSoft, fontSize: 14,
            }}>
              Iniciando cámara...
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div style={{
          padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button onClick={() => { stopCamera(); setPhase('intro'); }}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: C.text, padding: '10px 18px', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>
            ← Cancelar
          </button>

          {/* Camera toggle */}
          <button onClick={toggleCamera}
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', color: C.text,
              width: 46, height: 46, borderRadius: '50%', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title={facingMode === 'user' ? 'Cambiar a cámara trasera' : 'Cambiar a cámara frontal'}
          >
            🔄
          </button>

          <div style={{ fontSize: 13, color: C.textSoft, minWidth: 80, textAlign: 'right' }}>
            {facingMode === 'user' ? '📱 Frontal' : '📷 Trasera'}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '0 20px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 6,
            overflow: 'hidden', marginBottom: 8,
          }}>
            <div style={{
              width: `${scanProgress}%`, height: '100%', borderRadius: 8,
              background: `linear-gradient(90deg, ${C.accent}, #3d9b6e)`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <p style={{ fontSize: 12, color: C.textSoft, textAlign: 'center' }}>
            {scanProgress < 100 ? `Analizando... ${scanProgress}%` : 'Procesando resultados...'}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER — RESULTS PHASE
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
        <span style={{ fontSize: 17, fontWeight: 600 }}>Resultados</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => { setPhase('intro'); }}
          style={{ background: C.card, border: 'none', color: C.accent, padding: '8px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}>
          Repetir ↻
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, padding: '4px 20px 16px', overflow: 'auto' }}>
        {/* Face shape card */}
        {faceResult && fData && (
          <div style={{
            flex: '1 0 48%', background: C.card, borderRadius: 16, padding: '16px 14px',
            textAlign: 'center', border: resultsTab === 'face' ? `1px solid ${C.accent}40` : '1px solid transparent',
            cursor: 'pointer', transition: 'border 0.2s',
          }} onClick={() => setResultsTab('face')}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>{fData.emoji}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{fData.title}</div>
            <div style={{ fontSize: 11, color: C.accent, marginTop: 4 }}>
              {faceResult.confidence}% confianza
            </div>
          </div>
        )}

        {/* Eye shape card */}
        {eyeResult && eData && (
          <div style={{
            flex: '1 0 48%', background: C.card, borderRadius: 16, padding: '16px 14px',
            textAlign: 'center', border: resultsTab === 'eyes' ? `1px solid ${C.pink}40` : '1px solid transparent',
            cursor: 'pointer', transition: 'border 0.2s',
          }} onClick={() => setResultsTab('eyes')}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>{eData.emoji}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{eData.title}</div>
            <div style={{ fontSize: 11, color: C.pink, marginTop: 4 }}>
              {eyeResult.confidence}% confianza
              {eyeResult.spacing !== 'proporcional' && (
                <span style={{ color: C.textSoft }}> · Ojos {eyeResult.spacing}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab selector */}
      <div style={{
        display: 'flex', gap: 0, margin: '0 20px 16px', background: C.card,
        borderRadius: 12, overflow: 'hidden',
      }}>
        {[
          { key: 'face', label: '📐 Rostro' },
          { key: 'eyes', label: '👁️ Ojos' },
          { key: 'combined', label: '✨ Combinado' },
        ].map(t => (
          <button key={t.key} onClick={() => setResultsTab(t.key)}
            style={{
              flex: 1, padding: '12px 8px', border: 'none',
              background: resultsTab === t.key ? C.accentSoft : 'transparent',
              color: resultsTab === t.key ? C.accent : C.textSoft,
              fontSize: 12, fontWeight: resultsTab === t.key ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ FACE TAB ═══ */}
      {resultsTab === 'face' && fData && (
        <div style={{ padding: '0 20px' }}>
          <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.6, marginBottom: 20 }}>
            {fData.desc}
          </p>

          <ResultSection title="💄 Maquillaje" items={fData.makeup} color={C.pink} />
          <ResultSection title="✂️ Cortes de Cabello" items={fData.haircuts} color={C.gold} />
          <ResultSection title="👔 Cuellos que Favorecen" items={fData.necklines} color={C.accent} />

          <div style={{
            background: C.card, borderRadius: 14, padding: '14px 16px', marginTop: 12,
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.gold, marginBottom: 6 }}>🎯 Dónde Aplicar Contorno</p>
            <p style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{fData.contourZones}</p>
          </div>

          {/* Measurements */}
          {faceResult && (
            <div style={{
              background: C.card, borderRadius: 14, padding: '14px 16px', marginTop: 12,
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, marginBottom: 8 }}>📊 Medidas detectadas</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'WHR', value: faceResult.whr },
                  { label: 'Jaw/Frente', value: faceResult.jfr },
                  { label: 'Cheek/Jaw', value: faceResult.cjr },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: C.textSoft }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ EYES TAB ═══ */}
      {resultsTab === 'eyes' && eData && (
        <div style={{ padding: '0 20px' }}>
          <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.6, marginBottom: 20 }}>
            {eData.desc}
          </p>

          <ResultSection title="✏️ Delineador" items={eData.eyeliner} color={C.pink} />
          <ResultSection title="🎨 Sombras" items={eData.eyeshadow} color={C.gold} />
          <ResultSection title="💡 Tips Especiales" items={eData.tips} color={C.accent} />

          {/* Eye metrics */}
          {eyeResult?.features && (
            <div style={{
              background: C.card, borderRadius: 14, padding: '14px 16px', marginTop: 12,
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, marginBottom: 8 }}>📊 Métricas del ojo</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'EAR', value: eyeResult.features.ear },
                  { label: 'Ángulo', value: `${eyeResult.features.cornerAngle}°` },
                  { label: 'Capucha', value: eyeResult.features.hoodScore },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.pink }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: C.textSoft }}>{m.label}</div>
                  </div>
                ))}
              </div>
              {eyeResult.spacing !== 'proporcional' && (
                <p style={{ fontSize: 11, color: C.gold, textAlign: 'center', marginTop: 8 }}>
                  👀 Tus ojos están ligeramente {eyeResult.spacing === 'juntos' ? 'juntos' : 'separados'}
                  {eyeResult.spacing === 'juntos'
                    ? ' — ilumina el lagrimal y oscurece la esquina externa'
                    : ' — oscurece el lagrimal y no alargues demasiado el delineado'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ COMBINED TAB ═══ */}
      {resultsTab === 'combined' && fData && eData && (
        <div style={{ padding: '0 20px' }}>
          <div style={{
            background: `linear-gradient(135deg, ${C.accentSoft}, rgba(212,116,140,0.1))`,
            borderRadius: 16, padding: '18px 16px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: C.text }}>
              {fData.emoji} {fData.title} + {eData.emoji} {eData.title}
            </p>
            {combinedTip ? (
              <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>{combinedTip}</p>
            ) : (
              <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>
                Para tu combinación de {fData.title.toLowerCase()} con {eData.title.toLowerCase()},
                aplica las técnicas de contorno para tu tipo de rostro y adapta el maquillaje de ojos
                según la forma específica de tus ojos.
              </p>
            )}
          </div>

          {/* Quick combined tips */}
          <div style={{ background: C.card, borderRadius: 14, padding: '16px', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 10 }}>💄 Tu Look Personalizado</p>

            <TipRow icon="📐" label="Contorno" text={fData.contourZones} />
            <TipRow icon="✏️" label="Delineador" text={eData.eyeliner[0]} />
            <TipRow icon="🎨" label="Sombras" text={eData.eyeshadow[0]} />
            <TipRow icon="✂️" label="Corte ideal" text={fData.haircuts[0]} />
            <TipRow icon="👔" label="Cuello" text={fData.necklines[0]} />
          </div>

          {/* Eye spacing extra tip */}
          {eyeResult?.spacing !== 'proporcional' && (
            <div style={{
              background: C.card, borderRadius: 14, padding: '14px 16px',
            }}>
              <p style={{ fontSize: 12, color: C.gold, lineHeight: 1.5 }}>
                👀 Tip extra para ojos {eyeResult.spacing}: {eyeResult.spacing === 'juntos'
                  ? 'Usa sombra clara en el lagrimal para abrir y oscura en la esquina externa. Lleva las cejas ligeramente hacia afuera.'
                  : 'Oscurece ligeramente el lagrimal para acercar visualmente. No extiendas el delineado demasiado hacia afuera.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center',
        padding: '24px 20px 0', lineHeight: 1.4,
      }}>
        Análisis basado en proporciones faciales y landmarks MediaPipe.
        Los resultados son orientativos para mejorar tus técnicas de maquillaje.
      </p>
    </div>
  );
}

// ─── Helper components ───

function ResultSection({ title, items, color }) {
  return (
    <div style={{
      background: C.card, borderRadius: 14, padding: '14px 16px', marginBottom: 12,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>{title}</p>
      {items.map((item, i) => (
        <p key={i} style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.5, marginBottom: 4, paddingLeft: 6 }}>
          • {item}
        </p>
      ))}
    </div>
  );
}

function TipRow({ icon, label, text }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textSoft }}>{label}: </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{text}</span>
      </div>
    </div>
  );
}
