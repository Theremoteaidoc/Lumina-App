import { useState, useEffect, useRef, useMemo } from 'react';
import { COLORIMETRIA_QUESTIONS, COLORIMETRIA_RESULTS } from '../data/appData';
import { getCardGradient, getCardGradientActive } from '../utils/cardGradient';
import { updateProfile } from '../utils/profile';

// ─── Shared card shell ───────────────────────────────────────────────────────
function RecoCard({ emoji, title, children }) {
  return (
    <div style={{
      background: 'var(--gradient-card)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      padding: '18px 20px',
      boxShadow: 'var(--shadow)',
      marginBottom: 14,
    }}>
      <p className="font-display" style={{
        fontSize: 18,
        color: 'var(--rose)',
        marginBottom: 10,
        fontStyle: 'italic',
      }}>
        {emoji} {title}
      </p>
      {children}
    </div>
  );
}

// ─── Swatch circle + label ────────────────────────────────────────────────────
function Swatch({ hex, name }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: hex,
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 9, color: 'var(--text-muted)',
        textAlign: 'center', lineHeight: 1.3,
        maxWidth: 44,
      }}>
        {name}
      </span>
    </div>
  );
}

// ─── Sub-desc text ─────────────────────────────────────────────────────────────
function SubDesc({ text }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 13, color: 'var(--text-light)',
      lineHeight: 1.6, marginBottom: 10,
    }}>
      {text}
    </p>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ label, variant = 'favor' }) {
  const isFavor = variant === 'favor';
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 11,
      padding: '5px 10px',
      borderRadius: 12,
      lineHeight: 1.4,
      background: isFavor ? 'var(--bg-soft)' : 'white',
      color: isFavor ? 'var(--rose)' : 'var(--text-muted)',
      border: isFavor ? 'none' : '1px solid var(--border)',
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Pill group row (scrollable) ──────────────────────────────────────────────
function PillRow({ label, items, variant }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11, fontWeight: 600,
        color: 'var(--text-muted)', letterSpacing: 0.8,
        textTransform: 'uppercase', marginBottom: 7,
      }}>
        {label}
      </p>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
      }}>
        {items.map((item, i) => (
          <Pill key={i} label={item} variant={variant} />
        ))}
      </div>
    </div>
  );
}

// ─── Sub-section separator ────────────────────────────────────────────────────
function SubSep() {
  return <div style={{ borderTop: '1px solid rgba(229,152,155,0.18)', margin: '14px 0' }} />;
}

// ─── Sub-section header ───────────────────────────────────────────────────────
function SubHead({ label }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 11, fontWeight: 600,
      color: 'var(--text-muted)', letterSpacing: 0.8,
      textTransform: 'uppercase', marginBottom: 8,
    }}>
      {label}
    </p>
  );
}

// ─── Clothing swatches (color only, no name labels) ──────────────────────────
function ClothingSwatches({ label, items, muted = false }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11, fontWeight: 600,
        color: 'var(--text-muted)', letterSpacing: 0.8,
        textTransform: 'uppercase', marginBottom: 9,
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item, i) => (
          <div
            key={i}
            title={item.name}
            aria-label={item.name}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: item.hex,
              border: '2px solid white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              opacity: muted ? 0.5 : 1,
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ColorimetriaScreen({ onBack }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const scrollRef = useRef(null);

  // ── Result calculation (also drives profile persistence) ────────────────
  const result = useMemo(() => {
    if (!showResult) return null;
    const counts = { frio: 0, calido: 0, neutro: 0 };
    answers.forEach(a => counts[a]++);
    const key = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const data = COLORIMETRIA_RESULTS[key];
    const rec = data.recommendations;

    const CODE_MAP = {
      frio:   { code: 'C-2', label: 'Subtono Frío' },
      calido: { code: 'W-2', label: 'Subtono Cálido' },
      neutro: { code: 'N-2', label: 'Subtono Neutro' },
    };
    const myCode = CODE_MAP[key];

    return { key, data, rec, myCode };
  }, [showResult, answers]);

  useEffect(() => {
    if (showResult && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [showResult]);

  useEffect(() => {
    if (showResult && result?.key) {
      updateProfile({
        colorSubtono: result.key,
        colorCode: result.myCode.code,
        colorTestAt: new Date().toISOString(),
      });
    }
    // eslint-disable-next-line
  }, [showResult, result?.key]);

  const handleNext = () => {
    const next = [...answers, selected];
    setAnswers(next);
    setSelected(null);
    if (current + 1 >= COLORIMETRIA_QUESTIONS.length) setShowResult(true);
    else setCurrent(current + 1);
  };

  if (showResult) {
    const { data, rec, myCode } = result;

    return (
      <div className="slide-in" ref={scrollRef} style={{ overflowY: 'auto', height: '100%' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
          <h1 className="font-display" style={{ fontSize: 22, color: 'var(--text)' }}>Tu Colorimetría</h1>
        </div>
        <div style={{ padding: '0 20px 40px' }}>

          {/* ── Result card — glass treatment ─────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,196,209,0.2))',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 20, padding: 24,
            boxShadow: '0 4px 24px rgba(250,147,165,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.6)',
            marginBottom: 16,
          }}>
            <h3 className="font-display" style={{ fontSize: 24, color: 'var(--text)', textAlign: 'center', marginBottom: 8 }}>{data.title}</h3>
            <p style={{ fontSize: 15, color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>{data.desc}</p>

            {/* Personal color code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11, fontWeight: 600,
                color: 'var(--text-muted)', letterSpacing: 1.2,
                textTransform: 'uppercase', marginBottom: 10,
              }}>
                Tu código personal
              </p>
              <div style={{
                background: 'var(--bg-soft)',
                borderRadius: 20,
                padding: '14px 36px',
                border: '1.5px solid var(--border)',
              }}>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 28, fontWeight: 700,
                  color: 'var(--rose)',
                  letterSpacing: 4,
                }}>
                  {myCode.code}
                </span>
              </div>
              <p style={{
                fontSize: 13, color: 'var(--text-light)',
                marginTop: 8, letterSpacing: 0.3,
              }}>
                {myCode.label}
              </p>
            </div>

            <h4 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Colores que te Favorecen</h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              {data.colors.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  width: 60, gap: 6,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: c.hex,
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10, color: 'var(--text-light)',
                    textAlign: 'center', lineHeight: 1.3,
                    wordBreak: 'break-word',
                  }}>
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 1. Tu Maquillaje ─────────────────────────────────────────── */}
          <RecoCard emoji="💄" title="Tu Maquillaje">
            {/* Blush */}
            <SubHead label="Rubor" />
            <SubDesc text={rec.blush.desc} />
            <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
              {rec.blush.swatches.map((s, i) => <Swatch key={i} hex={s.hex} name={s.name} />)}
            </div>

            <SubSep />

            {/* Eyeshadow */}
            <SubHead label="Sombras de Ojos" />
            <SubDesc text={rec.eyeshadow.desc} />
            <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
              {rec.eyeshadow.swatches.map((s, i) => <Swatch key={i} hex={s.hex} name={s.name} />)}
            </div>

            <SubSep />

            {/* Lipstick */}
            <SubHead label="Labial" />
            <SubDesc text={rec.lipstick.desc} />
            <div style={{ display: 'flex', gap: 12 }}>
              {rec.lipstick.swatches.map((s, i) => <Swatch key={i} hex={s.hex} name={s.name} />)}
            </div>
          </RecoCard>

          {/* ── 2. Tu Joyería ───────────────────────────────────────────── */}
          <RecoCard emoji="💍" title="Tu Joyería">
            <SubDesc text={rec.jewelry.desc} />
            <PillRow label="Te favorecen" items={rec.jewelry.favor} variant="favor" />
            <PillRow label="Mejor evita" items={rec.jewelry.avoid} variant="avoid" />
          </RecoCard>

          {/* ── 3. Tu Cabello ───────────────────────────────────────────── */}
          <RecoCard emoji="💇" title="Tu Cabello">
            <SubDesc text={rec.hair.desc} />

            <SubHead label="🌾 Rubios" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {rec.hair.blonde.map((t, i) => <Pill key={i} label={t} variant="favor" />)}
            </div>

            <SubHead label="☕ Castaños" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {rec.hair.brown.map((t, i) => <Pill key={i} label={t} variant="favor" />)}
            </div>

            <SubHead label="🔥 Pelirrojos" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {rec.hair.red.map((t, i) => <Pill key={i} label={t} variant="favor" />)}
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.55)',
              borderRadius: 10,
              padding: '10px 12px',
              border: '1px solid var(--border)',
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, color: 'var(--text-muted)',
                fontStyle: 'italic', lineHeight: 1.5,
              }}>
                ⚠️ {rec.hair.avoid}
              </p>
            </div>
          </RecoCard>

          {/* ── 4. Ropa que te Ilumina ──────────────────────────────────── */}
          <RecoCard emoji="👗" title="Ropa que te Ilumina">
            <SubDesc text={rec.clothing.desc} />
            <ClothingSwatches label="Tus colores" items={rec.clothing.favor} />
            <ClothingSwatches label="Mejor evita" items={rec.clothing.avoid} muted />
          </RecoCard>

          {/* ── 5. Tus Lentes / Marcos ──────────────────────────────────── */}
          <RecoCard emoji="👓" title="Tus Lentes y Marcos">
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, color: 'var(--text-light)',
              lineHeight: 1.6,
            }}>
              {rec.glasses.desc}
            </p>
          </RecoCard>

          {/* ── 6. El Resumen de Lumina ─────────────────────────────────── */}
          <RecoCard emoji="✨" title="El Resumen de Lumina">
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 14, fontStyle: 'italic',
              color: 'var(--text-light)', lineHeight: 1.7,
            }}>
              "{data.tips}"
            </p>
          </RecoCard>

          <button className="btn-primary" onClick={onBack} style={{ marginTop: 6 }}>Volver a Tests</button>
        </div>
      </div>
    );
  }

  const q = COLORIMETRIA_QUESTIONS[current];

  return (
    <div className="slide-in">
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Colorimetría</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-light)' }}>Pregunta {current + 1} de {COLORIMETRIA_QUESTIONS.length}</p>
        </div>
      </div>
      <div style={{ padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {COLORIMETRIA_QUESTIONS.map((_, i) => (
            <div key={i} className={`progress-dot ${i === current ? 'active' : i < current ? 'done' : 'pending'}`} />
          ))}
        </div>
        <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: q.hint ? 8 : 20, lineHeight: 1.4 }}>{q.question}</h3>
          {q.hint && (
            <p style={{
              fontSize: 12.5, fontStyle: 'italic', color: 'var(--text-light)',
              lineHeight: 1.5, marginBottom: 20,
            }}>
              ✨ {q.hint}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`option-btn ${selected === opt.value ? 'selected' : ''}`}
                onClick={() => setSelected(opt.value)}
                style={{
                  background: selected === opt.value
                    ? getCardGradientActive(i, q.options.length)
                    : getCardGradient(i, q.options.length),
                }}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
        {selected && <button className="btn-primary" onClick={handleNext} style={{ marginTop: 20 }}>
          {current + 1 >= COLORIMETRIA_QUESTIONS.length ? 'Ver Resultado' : 'Siguiente'}
        </button>}
      </div>
    </div>
  );
}
