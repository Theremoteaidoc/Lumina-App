import { useState, useEffect, useRef, useCallback } from 'react';
import { getProfile } from '../utils/profile';
import { getLuminaReply } from '../utils/luminaChat';
import Icon from './Icon';

const IMG_CONSENT_KEY = 'lumina_img_consent';

// Mensajes amables cuando hay foto pero Gemini (la única IA con visión) no
// está disponible — nunca mandamos la imagen al motor local, que la ignoraría
// y respondería de forma confusa.
const NO_VISION_REPLIES = [
  'Para ver tus fotos necesito estar conectada con mi IA 🌸. Ese modo no está disponible ahora mismo, pero cuéntame con palabras y te ayudo igual.',
  'Justo ahora no puedo abrir imágenes — mi lado con visión está desconectado 🌸. Descríbeme lo que quieres saber y lo vemos juntas.',
  'Mmm, no logro conectarme con mi IA para mirar fotos en este momento. Si me cuentas con palabras qué tienes en mente, te doy una mano igual 🌸.',
];

// Cuando Gemini existe (hay llave) pero está saturado/con mucha demanda (429/503).
// NO caemos al motor local (que perdería el hilo de la conversación) — pedimos
// reintentar, así conservamos toda la charla y Gemini la recuerda al reintentar.
const BUSY_REPLIES = [
  'Uf, estoy con muchísima demanda en este momento 🌸 Dame unos segundos y vuelve a mandarme tu mensaje, que sí quiero seguir contigo.',
  'Mi IA va lenta ahorita por mucha demanda. Espera un momentito y pregúntame de nuevo lo mismo, ¿va? 🌸',
  'Estoy un poco saturada justo ahora — intenta otra vez en unos segundos y te respondo bien 🌸.',
];

// Initial greeting personalized by the profile (no name → generic warm opener)
function buildGreeting(profile) {
  const name = profile?.name;
  if (name) {
    return `Hola ${name} 🌸 — ¿qué te ronda la mente hoy?`;
  }
  return 'Hola 🌸 — soy Lumina. Cuéntame qué te trae por acá hoy.';
}

// Session flag: once Gemini reports "no key", stop trying it and go straight to
// the local engine for the rest of the session (avoids a pointless round-trip each message).
let geminiUnavailable = false;

// Hybrid reply: try Gemini (free AI) first; on any failure or missing key,
// fall back to the local knowledge-base engine. The user never sees an error —
// Lumina always answers.
//
// `image` (optional): { base64, mime } — when present, ONLY Gemini can analyze
// it (the local engine is rule-based text matching and has no vision). If
// Gemini is unavailable in that case, we do NOT fall back to local (it would
// confusingly ignore the photo) — we return a warm "no vision right now" reply.
async function getHybridReply(text, profile, history, image) {
  let transientFail = false; // Gemini existe pero falló esta vez (saturado/red)

  if (!geminiUnavailable) {
    try {
      // El historial (`history`) ya incluye el mensaje actual del usuario como
      // último elemento, así que NO lo volvemos a concatenar (eso duplicaba el
      // turno y rompía la alternancia user/model que Gemini espera).
      const apiMessages = history
        .slice(1) // salta el saludo inicial de la UI
        .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.apiText || m.text || '📷' }));

      const body = { messages: apiMessages, profile };
      if (image) {
        body.image = image.base64;
        body.imageMime = image.mime;
      }

      const res = await fetch('/api/chat-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data?.noKey) {
        geminiUnavailable = true; // no hay llave — no reintentar en toda la sesión
      } else if (res.ok && data?.ok && data.reply) {
        return { text: data.reply, source: 'gemini' };
      } else {
        // Hay llave pero Gemini falló (saturado, cuota, etc.)
        transientFail = true;
      }
    } catch {
      transientFail = true;
    }
  }

  // Con llave pero fallo momentáneo → pedir reintento SIN perder el hilo.
  // (No usamos el local, que no recuerda la conversación.)
  if (transientFail) {
    return { text: pick(BUSY_REPLIES), source: 'busy' };
  }

  // Sin llave y con foto → solo Gemini ve imágenes.
  if (image) {
    return { text: pick(NO_VISION_REPLIES), source: 'no-vision' };
  }

  // Sin llave, texto → motor local (modo esperado, siempre funciona).
  const local = getLuminaReply(text, profile, history);
  return { text: local.text, source: 'local' };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ChatScreen({ onBack }) {
  const profile = getProfile() || {};
  const [msgs, setMsgs] = useState([
    { from: 'lumina', text: buildGreeting(profile) },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // { dataUrl, base64, mime } o null
  const [showImgConsent, setShowImgConsent] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive or typing indicator toggles
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [msgs, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    const image = pendingImage;
    if ((!text && !image) || loading) return;

    // Texto que le mandamos a Gemini para dar contexto cuando la usuaria solo
    // adjunta una foto sin escribir nada — pero la burbuja del usuario NO
    // muestra este placeholder, solo la imagen.
    const textForApi = text || (image ? '¿Qué opinas de esto?' : '');

    const userMsg = { from: 'user', text, apiText: textForApi, image: image?.dataUrl };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setPendingImage(null);
    setLoading(true);

    // Híbrido: Gemini (IA gratis) si hay llave; si no, motor local (o aviso
    // amable si hay foto). Nunca falla.
    const started = Date.now();
    const { text: replyText } = await getHybridReply(
      textForApi,
      profile,
      newMsgs,
      image ? { base64: image.base64, mime: image.mime } : null
    );

    // Mantén un mínimo de "escribiendo" para que no se sienta brusco cuando la
    // respuesta llega muy rápido (local instantáneo o Gemini veloz).
    const elapsed = Date.now() - started;
    const minTyping = 500;
    const wait = Math.max(0, minTyping - elapsed);

    setTimeout(() => {
      setMsgs((prev) => [...prev, { from: 'lumina', text: replyText }]);
      setLoading(false);
    }, wait);
  }, [input, loading, msgs, profile, pendingImage]);

  const handleCameraTap = useCallback(() => {
    if (loading) return;
    const hasConsent = localStorage.getItem(IMG_CONSENT_KEY) === 'true';
    if (hasConsent) {
      fileInputRef.current?.click();
    } else {
      setShowImgConsent(true);
    }
  }, [loading]);

  const acceptImgConsent = useCallback(() => {
    localStorage.setItem(IMG_CONSENT_KEY, 'true');
    setShowImgConsent(false);
    fileInputRef.current?.click();
  }, []);

  const handleImageSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reelegir la misma imagen después
    if (!file) return;

    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = url;
      });

      const maxDim = 1024;
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      setPendingImage({ dataUrl, base64, mime: 'image/jpeg' });
    } catch {
      // Si algo falla leyendo la imagen, simplemente no seteamos preview —
      // la usuaria puede intentar de nuevo.
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10,
        background: 'white', borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: 'var(--text)',
        }}>←</button>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--pink-light), var(--pink))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: 'white',
        }}>✨</div>
        <div>
          <h1 className="font-display" style={{ fontSize: 19, color: 'var(--text)' }}>Lumina</h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11, color: loading ? 'var(--pink-dark)' : 'var(--green)',
            letterSpacing: 0.2, fontStyle: loading ? 'italic' : 'normal',
          }}>
            {loading ? 'Escribiendo…' : 'En línea'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 16px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 10,
          }}>
            <div style={{
              maxWidth: '82%', padding: '12px 16px', borderRadius: 18,
              background: m.from === 'user'
                ? 'linear-gradient(135deg, var(--pink-light), var(--pink))'
                : 'white',
              color: m.from === 'user' ? 'white' : 'var(--text)',
              fontSize: 14, lineHeight: 1.55,
              boxShadow: m.from === 'lumina' ? 'var(--shadow)' : 'none',
              borderBottomRightRadius: m.from === 'user' ? 4 : 18,
              borderBottomLeftRadius: m.from === 'lumina' ? 4 : 18,
              wordBreak: 'break-word',
            }}>
              {m.image ? (
                <img
                  src={m.image}
                  alt="Foto enviada"
                  style={{
                    display: 'block', maxWidth: '100%', width: 200,
                    borderRadius: 12, marginBottom: m.text ? 8 : 0,
                    objectFit: 'cover',
                  }}
                />
              ) : null}
              {m.text ? renderRichText(m.text) : null}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{
              padding: '14px 18px', borderRadius: 18,
              background: 'white',
              boxShadow: 'var(--shadow)',
              borderBottomLeftRadius: 4,
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              <Dot delay={0} />
              <Dot delay={150} />
              <Dot delay={300} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: 'white', borderTop: '1px solid var(--border)',
      }}>
        {/* Preview de la imagen pendiente de enviar */}
        {pendingImage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
              <img
                src={pendingImage.dataUrl}
                alt="Vista previa"
                style={{
                  width: 60, height: 60, borderRadius: 14, objectFit: 'cover',
                  border: '1px solid var(--border)',
                }}
              />
              <button
                onClick={() => setPendingImage(null)}
                aria-label="Quitar imagen"
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--rose)', color: 'white', border: '2px solid white',
                  fontSize: 12, lineHeight: 1, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-light)' }}>Lista para enviar 🌸</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <button
            onClick={handleCameraTap}
            disabled={loading}
            aria-label="Adjuntar foto"
            style={{
              width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--rose)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              flexShrink: 0,
            }}
          >
            <Icon name="camera" size={20} color="var(--rose)" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={loading ? 'Lumina está pensando…' : 'Escríbele a Lumina…'}
            disabled={loading}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 24,
              border: '1px solid var(--border)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, outline: 'none',
              background: 'var(--bg)',
              opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={send}
            disabled={loading || (!input.trim() && !pendingImage)}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              background: (!input.trim() && !pendingImage) || loading
                ? 'var(--border)'
                : 'linear-gradient(135deg, var(--pink-light), var(--pink))',
              color: 'white', fontSize: 18,
              cursor: (!input.trim() && !pendingImage) || loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s ease',
              flexShrink: 0,
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Aviso de privacidad de fotos — una sola vez */}
      {showImgConsent && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={() => setShowImgConsent(false)}
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
              Sobre tus fotos
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--text-light)', lineHeight: 1.6, marginBottom: 24 }}>
              Cuando subes una foto, Lumina la analiza con IA para darte tips personalizados. Tu foto NO se guarda en ningún lado — se usa solo para responderte y se descarta. Tú decides qué compartir.
            </p>
            <button className="btn-primary" onClick={acceptImgConsent}>Entendido, continuar</button>
            <button
              onClick={() => setShowImgConsent(false)}
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

      {/* Animated typing dots */}
      <style>{`
        @keyframes dotPulse {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%',
      background: 'var(--rose)',
      animation: `dotPulse 1.2s ${delay}ms infinite ease-in-out`,
      display: 'inline-block',
    }} />
  );
}

// ─── Renderizador ligero de Markdown para las respuestas de Lumina ───
// Gemini a veces devuelve **negrita**, *cursiva*, `código` y viñetas "* " / "- ".
// Convertimos eso a JSX real (sin librerías, sin dangerouslySetInnerHTML).

// Convierte los marcadores inline de una línea (negrita/cursiva/código) en nodos JSX.
function renderInline(text, keyPrefix) {
  // Tokeniza por **negrita**, *cursiva* o _cursiva_, y `código`.
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (!part) return null;
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} style={{
          background: 'var(--bg-soft)', borderRadius: 5,
          padding: '1px 5px', fontSize: '0.9em',
        }}>{part.slice(1, -1)}</code>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function renderRichText(text) {
  const lines = String(text || '').split('\n');
  return lines.map((line, i) => {
    // Viñeta: "* algo", "- algo" o "• algo"
    const bulletMatch = line.match(/^\s*[*\-•]\s+(.*)$/);
    if (bulletMatch) {
      return (
        <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0' }}>
          <span style={{ color: 'var(--pink)', flexShrink: 0 }}>•</span>
          <span>{renderInline(bulletMatch[1], `l${i}`)}</span>
        </div>
      );
    }
    // Línea normal (respeta líneas vacías como espacio)
    return (
      <div key={i} style={{ minHeight: line.trim() === '' ? '0.6em' : undefined }}>
        {renderInline(line, `l${i}`)}
      </div>
    );
  });
}
