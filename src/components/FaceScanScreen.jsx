import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { LANDMARKS, getMeasurements, extractFeatures, classifyFaceShape } from '../utils/faceClassifier';
import { FACE_DATA } from '../data/appData';

export default function FaceScanScreen({ onBack }) {
  const [phase, setPhase] = useState('intro');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [frames, setFrames] = useState([]);
  const [showMesh, setShowMesh] = useState(true);

  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const landmarkerRef = useRef(null);
  const framesRef = useRef([]);

  useEffect(() => { framesRef.current = frames; }, [frames]);

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => () => {
    stopCamera();
    if (landmarkerRef.current) landmarkerRef.current.close();
  }, [stopCamera]);

  const drawOverlay = useCallback((landmarks, canvas, video) => {
    const ctx = canvas.getContext('2d');
    const w = video.videoWidth, h = video.videoHeight;
    canvas.width = w; canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    if (!showMesh) return;

    // Draw face oval contour
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(92,177,133,0.5)';
    ctx.lineWidth = 1.5;
    LANDMARKS.faceOval.forEach((idx, i) => {
      const p = landmarks[idx];
      if (i === 0) ctx.moveTo(p.x * w, p.y * h);
      else ctx.lineTo(p.x * w, p.y * h);
    });
    ctx.closePath(); ctx.stroke();
    
    // Draw face oval points with index labels (debug)
    LANDMARKS.faceOval.forEach((idx) => {
      const p = landmarks[idx];
      ctx.beginPath(); ctx.fillStyle = 'rgba(92,177,133,0.4)';
      ctx.arc(p.x * w, p.y * h, 2, 0, Math.PI * 2); ctx.fill();
    });

    const drawLine = (i1, i2, color, label) => {
      const p1 = landmarks[i1], p2 = landmarks[i2];
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.moveTo(p1.x * w, p1.y * h); ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke(); ctx.setLineDash([]);
      // Draw endpoint dots with index numbers
      [{ p: p1, idx: i1 }, { p: p2, idx: i2 }].forEach(({ p, idx }) => {
        ctx.beginPath(); ctx.fillStyle = color;
        ctx.arc(p.x * w, p.y * h, 5, 0, Math.PI * 2); ctx.fill();
        // Show landmark index for debug
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(idx, p.x * w, p.y * h - 8);
      });
      if (label) {
        const mx = ((p1.x + p2.x) / 2) * w, my = ((p1.y + p2.y) / 2) * h - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(mx - 32, my - 9, 64, 16);
        ctx.fillStyle = 'white'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(label, mx, my + 3);
      }
    };

    drawLine(LANDMARKS.foreheadLeft, LANDMARKS.foreheadRight, '#E8B931', 'Frente');
    drawLine(LANDMARKS.cheekLeft, LANDMARKS.cheekRight, '#5CB185', 'Pómulos');
    drawLine(LANDMARKS.jawLeft, LANDMARKS.jawRight, '#E8A0B4', 'Mandíbula');
    drawLine(LANDMARKS.hairline, LANDMARKS.chin, 'rgba(255,255,255,0.4)', 'Largo');
  }, [showMesh]);

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const lm = landmarkerRef.current;
    const canvas = overlayRef.current;
    if (!video || !lm || !canvas || video.readyState < 2) {
      animRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    const results = lm.detectForVideo(video, performance.now());
    if (results.faceLandmarks?.length > 0) {
      const pts = results.faceLandmarks[0];
      drawOverlay(pts, canvas, video);
      const m = getMeasurements(pts, video.videoWidth, video.videoHeight);
      const feat = extractFeatures(pts);
      setFrames(prev => { const n = [...prev, { m, feat, lm: pts }]; if (n.length > 30) n.shift(); return n; });
      setDebugInfo({
        whr: feat ? feat.f1_whr.toFixed(3) : (m.cheekboneWidth / m.faceLength).toFixed(3),
        fw: m.foreheadWidth.toFixed(0), cw: m.cheekboneWidth.toFixed(0),
        jw: m.jawlineWidth.toFixed(0), fl: m.faceLength.toFixed(0),
      });
      setStatus('Rostro detectado ✓ Mantén la posición...');
    } else {
      setStatus('Buscando rostro... Mira directo a la cámara');
    }
    animRef.current = requestAnimationFrame(detectLoop);
  }, [drawOverlay]);

  const startScanning = async () => {
    setPhase('scanning');
    setFrames([]);
    setStatus('Cargando modelo de IA...');
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO', numFaces: 1,
      });
      landmarkerRef.current = landmarker;
      setStatus('Iniciando cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await new Promise(r => { videoRef.current.onloadedmetadata = () => { videoRef.current.play(); r(); }; });
      setStatus('Detectando rostro...');
      setTimeout(detectLoop, 300);
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + (err.name === 'NotAllowedError' ? 'Permite el acceso a la cámara en ajustes' : err.message));
    }
  };

  const analyze = () => {
    if (framesRef.current.length < 10) { setStatus('Necesito más datos. Mantén la posición...'); return; }
    setPhase('analyzing');
    const frames = framesRef.current;
    
    // Average all 19 features across collected frames for stability
    const validFeats = frames.filter(fr => fr.feat !== null).map(fr => fr.feat);
    
    if (validFeats.length >= 5) {
      // Use full 19-feature classification (v2)
      const featureKeys = Object.keys(validFeats[0]).filter(k => !k.startsWith('_'));
      const avgFeat = {};
      for (const key of featureKeys) {
        avgFeat[key] = validFeats.reduce((sum, f) => sum + f[key], 0) / validFeats.length;
      }
      // Keep raw from last frame for display
      avgFeat._raw = validFeats[validFeats.length - 1]._raw;
      const res = classifyFaceShape(avgFeat);
      setTimeout(() => { stopCamera(); setResult(res); setPhase('result'); }, 1200);
    } else {
      // Fallback to basic measurements if features failed
      const f = frames.map(fr => fr.m);
      const avg = {
        faceLength: f.reduce((s, x) => s + x.faceLength, 0) / f.length,
        foreheadWidth: f.reduce((s, x) => s + x.foreheadWidth, 0) / f.length,
        cheekboneWidth: f.reduce((s, x) => s + x.cheekboneWidth, 0) / f.length,
        jawlineWidth: f.reduce((s, x) => s + x.jawlineWidth, 0) / f.length,
      };
      const res = classifyFaceShape(avg);
      setTimeout(() => { stopCamera(); setResult(res); setPhase('result'); }, 1200);
    }
  };

  /* ═══════════ RESULT SCREEN ═══════════ */
  if (phase === 'result' && result) {
    const data = FACE_DATA[result.shape];
    return (
      <div className="slide-in" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { setPhase('intro'); setResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Tu Resultado</h1>
        </div>
        <div style={{ padding: '0 20px 40px' }}>
          {/* Main result card */}
          <div style={{ background: 'white', borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', marginBottom: 16 }}>
            <span style={{ fontSize: 48 }}>{data.emoji}</span>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginTop: 12 }}>{data.title}</h2>
            <div style={{ display: 'inline-flex', gap: 6, marginTop: 10, background: 'var(--bg-soft)', borderRadius: 20, padding: '6px 16px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--rose)', fontWeight: 600 }}>{result.confidence}% confianza</span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6, marginTop: 16 }}>{data.desc}</p>
            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 20, background: 'var(--cream)', borderRadius: 16, padding: 16 }}>
              {[{ l: 'WHR', v: result.whr, d: 'Ancho/Alto' }, { l: 'JFR', v: result.jfr, d: 'Mandíb/Frente' }, { l: 'CJR', v: result.cjr, d: 'Pómulo/Mandíb' }].map((m, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--rose)' }}>{m.v}</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{m.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation sections */}
          {[
            { title: '💄 Maquillaje & Contorno', items: data.makeup, note: data.contourZones },
            { title: '✂️ Cortes de Cabello', items: data.haircuts },
            { title: '👗 Escotes Favorables', items: data.necklines },
          ].map((sec, si) => (
            <div key={si} style={{ background: 'white', borderRadius: 20, padding: 22, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>{sec.title}</h3>
              {sec.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pink)', marginTop: 7, flexShrink: 0 }} />
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
              {sec.note && (
                <div style={{ background: 'var(--bg-soft)', borderRadius: 12, padding: '10px 14px', marginTop: 12 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--rose)', fontStyle: 'italic', lineHeight: 1.5 }}>💡 {sec.note}</p>
                </div>
              )}
            </div>
          ))}

          <button className="btn-outline" onClick={() => { setPhase('intro'); setResult(null); setFrames([]); }} style={{ marginTop: 8 }}>Repetir Escaneo</button>
          <button className="btn-primary" onClick={onBack} style={{ marginTop: 10 }}>Volver a Tests</button>
        </div>
      </div>
    );
  }

  /* ═══════════ SCANNING SCREEN ═══════════ */
  if (phase === 'scanning' || phase === 'analyzing') {
    const progress = Math.min((frames.length / 30) * 100, 100);
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 430, margin: '0 auto' }}>
          {/* Top buttons */}
          <button onClick={() => { stopCamera(); setPhase('intro'); }} style={{
            position: 'absolute', top: 16, left: 16, zIndex: 20, background: 'rgba(0,0,0,0.5)',
            border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: 'white', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
          <button onClick={() => setShowMesh(!showMesh)} style={{
            position: 'absolute', top: 16, right: 16, zIndex: 20, background: 'rgba(0,0,0,0.5)',
            border: 'none', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: 'white', fontSize: 11,
          }}>{showMesh ? 'Ocultar' : 'Mostrar'} líneas</button>

          {/* Camera viewport */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', overflow: 'hidden', background: '#111' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'grayscale(100%) contrast(1.1)', transform: 'scaleX(-1)',
            }} />
            <canvas ref={overlayRef} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              transform: 'scaleX(-1)', pointerEvents: 'none',
            }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{
                width: '62%', aspectRatio: '3/4', borderRadius: '50%',
                border: `2px ${frames.length > 10 ? 'solid' : 'dashed'} ${frames.length > 10 ? 'rgba(92,177,133,0.5)' : 'rgba(232,160,180,0.35)'}`,
                transition: 'border 0.5s',
              }} />
            </div>
          </div>

          {/* Bottom panel */}
          <div style={{ padding: '20px 20px 40px' }}>
            <p style={{ color: frames.length > 10 ? '#5CB185' : 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginBottom: 14, fontWeight: 500 }}>
              {status}
            </p>
            {debugInfo && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 14 }}>
                {[
                  { l: 'WHR', v: debugInfo.whr }, { l: 'Frente', v: debugInfo.fw },
                  { l: 'Pómulo', v: debugInfo.cw }, { l: 'Mandíb.', v: debugInfo.jw },
                  { l: 'Largo', v: debugInfo.fl },
                ].map((d, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: 'white', fontWeight: 600 }}>{d.v}</p>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{d.l}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, height: 6, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{
                width: `${progress}%`, height: '100%', borderRadius: 8, transition: 'width 0.3s',
                background: progress >= 100 ? 'linear-gradient(90deg,#5CB185,#4CAF50)' : 'linear-gradient(90deg,var(--pink-light),var(--pink))',
              }} />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 14 }}>
              {frames.length < 30 ? `${frames.length}/30 frames` : '✓ Listo para analizar'}
            </p>
            <button onClick={analyze} disabled={frames.length < 10 || phase === 'analyzing'} style={{
              width: '100%', padding: 16, borderRadius: 16, border: 'none',
              background: frames.length >= 10 ? 'linear-gradient(135deg,var(--pink-light),var(--pink))' : 'rgba(255,255,255,0.1)',
              color: frames.length >= 10 ? 'white' : 'rgba(255,255,255,0.3)',
              fontSize: 15, fontWeight: 500, cursor: frames.length >= 10 ? 'pointer' : 'default',
              opacity: phase === 'analyzing' ? 0.6 : 1,
            }}>
              {phase === 'analyzing' ? 'Analizando...' : 'Analizar Mi Rostro'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ INTRO SCREEN ═══════════ */
  return (
    <div className="slide-in" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Análisis Facial Pro</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-light)' }}>Visagismo con IA</p>
        </div>
      </div>
      <div style={{ padding: '0 20px 40px' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
          <div style={{ background: '#FFF9E6', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 18 }}>ℹ️</span>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
              Lumina usa <strong>inteligencia artificial (MediaPipe)</strong> para detectar 478 puntos de tu rostro
              en tiempo real y clasificar tu forma facial por proporciones antropométricas.
            </p>
          </div>

          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14, letterSpacing: 0.5 }}>CÓMO FUNCIONA</h3>
          {[
            { s: '1', t: 'La cámara se abre en escala de grises para mejor detección' },
            { s: '2', t: 'La IA detecta 478 puntos de tu rostro en tiempo real' },
            { s: '3', t: 'Se miden 4 distancias: frente, pómulos, mandíbula y largo' },
            { s: '4', t: 'Un algoritmo clasifica tu forma de rostro por proporciones' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: 'var(--bg-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--rose)',
              }}>{item.s}</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5 }}>{item.t}</p>
            </div>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0 20px' }} />

          <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14, letterSpacing: 0.5 }}>ANTES DE EMPEZAR</h3>
          {[
            { icon: '☀️', t: 'Luz natural frontal' },
            { icon: '👁️', t: 'Cámara a nivel de ojos' },
            { icon: '💇‍♀️', t: 'Cara despejada (cabello atrás)' },
            { icon: '😐', t: 'Expresión neutra, boca cerrada' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'var(--bg-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{r.icon}</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{r.t}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--cream)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
            🔒 Todo el procesamiento ocurre en tu dispositivo. Ninguna imagen se envía a servidores.
          </p>
        </div>

        <button className="btn-primary" onClick={startScanning} style={{ marginTop: 20 }}>
          Comenzar Escaneo Facial
        </button>
      </div>
    </div>
  );
}
