import { useState, useCallback } from 'react';
import { saveProfile } from '../utils/profile';
import { getCardGradient, getCardGradientActive } from '../utils/cardGradient';

// ─── Data constants ────────────────────────────────────────────────────────

const GOALS = [
  { value: 'skincare', emoji: '💧', label: 'Cuidar mi piel' },
  { value: 'colorimetry', emoji: '🎨', label: 'Encontrar mis colores' },
  { value: 'makeup', emoji: '💄', label: 'Aprender de maquillaje' },
  { value: 'selflove', emoji: '💕', label: 'Trabajar mi autoestima' },
  { value: 'face', emoji: '📸', label: 'Conocer mi rostro' },
  { value: 'explore', emoji: '✨', label: 'Solo explorar' },
];

const SKIN_TYPES = [
  { value: 'grasa', emoji: '💧', label: 'Grasa' },
  { value: 'seca', emoji: '🌵', label: 'Seca' },
  { value: 'mixta', emoji: '⚖️', label: 'Mixta' },
  { value: 'sensible', emoji: '🌸', label: 'Sensible' },
  { value: 'normal', emoji: '✨', label: 'Normal' },
  { value: 'desconocido', emoji: '🤔', label: 'No estoy segura' },
];

const CONCERNS = [
  { value: 'acne', emoji: '🔴', label: 'Acné / espinillas' },
  { value: 'dark_spots', emoji: '🌑', label: 'Manchas / hiperpigmentación' },
  { value: 'expression_lines', emoji: '〰️', label: 'Líneas de expresión' },
  { value: 'dryness', emoji: '🌬️', label: 'Resequedad / descamación' },
  { value: 'oiliness', emoji: '🌟', label: 'Brillo / poros visibles' },
  { value: 'sensitivity', emoji: '🤲', label: 'Sensibilidad / rojeces' },
  { value: 'none', emoji: '✋', label: 'Ninguna por ahora' },
];

const HAIR_COLORS = [
  { value: 'blonde', hex: '#E8C896', label: 'Rubio' },
  { value: 'light_brown', hex: '#A07856', label: 'Castaño claro' },
  { value: 'dark_brown', hex: '#5C3A21', label: 'Castaño oscuro' },
  { value: 'black', hex: '#1A0F0A', label: 'Negro' },
  { value: 'red', hex: '#A04020', label: 'Pelirrojo' },
  { value: 'other', hex: null, label: 'Otro' },
];

const EYE_COLORS = [
  { value: 'blue', hex: '#5B8DB8', label: 'Azul' },
  { value: 'green', hex: '#6B8E5A', label: 'Verde' },
  { value: 'hazel', hex: '#8B7355', label: 'Avellana' },
  { value: 'light_brown', hex: '#9C7858', label: 'Café claro' },
  { value: 'dark_brown', hex: '#4A2F1F', label: 'Café oscuro' },
  { value: 'black', hex: '#1A0F0A', label: 'Negro' },
];

const AGE_RANGES = ['13-15', '16-18', '19-25', '26-35', '35+'];

// ─── Total steps ───────────────────────────────────────────────────────────
const TOTAL_STEPS = 7;

// ─── Shared style helpers ──────────────────────────────────────────────────

const styles = {
  screen: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
  },
  progressBar: {
    display: 'flex',
    gap: 4,
    padding: '14px 24px 0',
  },
  progressSegment: (filled) => ({
    flex: 1,
    height: 3,
    borderRadius: 2,
    background: filled ? 'var(--pink)' : 'var(--border)',
    transition: 'background 0.35s ease',
  }),
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 20,
    color: 'var(--text-light)',
    padding: '8px 0 8px 4px',
    minWidth: 44,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    letterSpacing: 0,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px 0',
  },
  content: {
    flex: 1,
    padding: '28px 28px 0',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30,
    fontWeight: 500,
    fontStyle: 'italic',
    color: 'var(--text)',
    lineHeight: 1.2,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: 'var(--text-light)',
    lineHeight: 1.5,
    marginBottom: 28,
  },
  footer: {
    padding: '24px 28px 40px',
    paddingBottom: 'max(40px, calc(28px + env(safe-area-inset-bottom)))',
  },
  optionBtn: (selected) => ({
    background: selected ? 'var(--gradient-card-hover)' : 'var(--gradient-card)',
    border: `1.5px solid ${selected ? 'var(--pink)' : 'var(--border)'}`,
    borderRadius: 14,
    padding: '15px 18px',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 15,
    color: 'var(--rose)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  }),
  gridOption: (selected) => ({
    background: selected ? 'var(--gradient-card-hover)' : 'var(--gradient-card)',
    border: `1.5px solid ${selected ? 'var(--pink)' : 'var(--border)'}`,
    borderRadius: 14,
    padding: '16px 12px',
    cursor: 'pointer',
    fontSize: 14,
    color: 'var(--rose)',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    textAlign: 'center',
    lineHeight: 1.3,
  }),
  emojiCircle: {
    fontSize: 24,
    lineHeight: 1,
  },
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const legacyName = localStorage.getItem('lumina_username') || '';

  const [data, setData] = useState({
    name: legacyName,
    ageRange: '',
    goals: [],
    skinType: '',
    concerns: [],
    hairColor: '',
    eyeColor: '',
    notificationsEnabled: true,
  });

  const goTo = useCallback((nextStep) => {
    setAnimKey((k) => k + 1);
    setStep(nextStep);
  }, []);

  const goBack = () => goTo(step - 1);

  const update = (partial) => setData((d) => ({ ...d, ...partial }));

  // ── Progress bar ───────────────────────────────────────────────────────

  const renderProgress = (currentStep) => {
    if (currentStep === 0) return null;
    return (
      <div style={styles.progressBar}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={styles.progressSegment(i < currentStep)} />
        ))}
      </div>
    );
  };

  // ── Back button ───────────────────────────────────────────────────────

  const renderBackBtn = () => (
    <div style={styles.headerRow}>
      <button style={styles.backBtn} onClick={goBack} aria-label="Atrás">
        ←
      </button>
    </div>
  );

  // ── Step 0: Bienvenida ─────────────────────────────────────────────────

  const renderStep0 = () => (
    <div style={styles.screen} className="slide-in">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div className="float" style={{ fontSize: 64, marginBottom: 24 }}>✨</div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 40, fontWeight: 600, color: 'var(--text)',
          marginBottom: 8, textAlign: 'center',
        }}>Lumina</h1>
        <h2 className="font-display" style={{
          fontSize: 26, color: 'var(--rose)',
          marginBottom: 28, textAlign: 'center',
        }}>Hola, soy Lumina</h2>
        <p style={{
          fontSize: 16, color: 'var(--text-light)',
          textAlign: 'center', lineHeight: 1.7, maxWidth: 320,
        }}>
          Te voy a hacer algunas preguntas para conocerte mejor. Solo toma un minuto y todo se queda en tu teléfono.
        </p>
      </div>
      <div style={styles.footer}>
        <button className="btn-primary" onClick={() => goTo(1)}>
          Empecemos ✨
        </button>
      </div>
    </div>
  );

  // ── Step 1: Nombre ─────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div style={styles.screen} className="slide-in">
      {renderProgress(1)}
      {renderBackBtn()}
      <div style={styles.content}>
        <h2 style={styles.title}>¿Cómo te llamas?</h2>
        <p style={styles.subtitle}>Para hablarte por tu nombre</p>
        <input
          type="text"
          value={data.name}
          onChange={(e) => update({ name: e.target.value.slice(0, 30) })}
          placeholder="Tu nombre..."
          autoFocus
          style={{
            display: 'block',
            width: '100%',
            background: 'white',
            border: '1.5px solid var(--border)',
            borderRadius: 16,
            padding: '18px 20px',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 24,
            fontWeight: 500,
            color: 'var(--text)',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--pink)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
        />
      </div>
      <div style={styles.footer}>
        <button
          className="btn-primary"
          disabled={data.name.trim().length === 0}
          onClick={() => goTo(2)}
        >
          Continuar
        </button>
      </div>
    </div>
  );

  // ── Step 2: Edad ───────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div style={styles.screen} className="slide-in">
      {renderProgress(2)}
      {renderBackBtn()}
      <div style={{ ...styles.content, overflowY: 'auto' }}>
        <h2 style={styles.title}>¿En qué rango de edad estás?</h2>
        <p style={styles.subtitle}>Para mostrarte contenido apropiado</p>
        <div style={{ flex: 1 }}>
          {AGE_RANGES.map((range, idx) => (
            <button
              key={range}
              style={{
                ...styles.optionBtn(data.ageRange === range),
                background: data.ageRange === range
                  ? getCardGradientActive(idx, AGE_RANGES.length)
                  : getCardGradient(idx, AGE_RANGES.length),
              }}
              onClick={() => update({ ageRange: range })}
            >
              <span style={{ fontSize: 16 }}>
                {range === '13-15' ? '🌱' : range === '16-18' ? '🌸' : range === '19-25' ? '💫' : range === '26-35' ? '✨' : '🌟'}
              </span>
              <span style={{ fontWeight: data.ageRange === range ? 600 : 400 }}>{range} años</span>
            </button>
          ))}
        </div>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11, color: 'var(--text-muted)',
          lineHeight: 1.5, marginTop: 16, marginBottom: 8,
        }}>
          Lumina requiere tener al menos 13 años. Al continuar confirmas tu edad.
        </p>

      </div>
      <div style={styles.footer}>
        <button
          className="btn-primary"
          disabled={!data.ageRange}
          onClick={() => goTo(3)}
        >
          Continuar
        </button>
      </div>
    </div>
  );

  // ── Step 3: Goals ──────────────────────────────────────────────────────

  const toggleGoal = (value) => {
    const current = data.goals;
    if (current.includes(value)) {
      update({ goals: current.filter((g) => g !== value) });
    } else {
      if (current.length >= 3) return;
      update({ goals: [...current, value] });
    }
  };

  const renderStep3 = () => (
    <div style={styles.screen} className="slide-in">
      {renderProgress(3)}
      {renderBackBtn()}
      <div style={{ ...styles.content, overflowY: 'auto' }}>
        <h2 style={styles.title}>¿Qué te trae a Lumina?</h2>
        <p style={styles.subtitle}>Elige hasta 3 — no te preocupes, podrás cambiarlo después</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {GOALS.map((g, idx) => {
            const selected = data.goals.includes(g.value);
            const maxed = data.goals.length >= 3 && !selected;
            return (
              <button
                key={g.value}
                style={{
                  ...styles.gridOption(selected),
                  background: selected
                    ? getCardGradientActive(idx, GOALS.length)
                    : getCardGradient(idx, GOALS.length),
                  opacity: maxed ? 0.45 : 1,
                  cursor: maxed ? 'not-allowed' : 'pointer',
                }}
                onClick={() => !maxed && toggleGoal(g.value)}
              >
                <span style={styles.emojiCircle}>{g.emoji}</span>
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>
        {data.goals.length >= 3 && (
          <p style={{
            fontSize: 13, color: 'var(--rose)',
            textAlign: 'center', marginTop: 12,
          }}>
            Máximo 3 metas seleccionadas
          </p>
        )}
      </div>
      <div style={styles.footer}>
        <button
          className="btn-primary"
          disabled={data.goals.length === 0}
          onClick={() => goTo(4)}
        >
          Continuar
        </button>
      </div>
    </div>
  );

  // ── Step 4: Tipo de piel ───────────────────────────────────────────────

  const renderStep4 = () => (
    <div style={styles.screen} className="slide-in">
      {renderProgress(4)}
      {renderBackBtn()}
      <div style={{ ...styles.content, overflowY: 'auto' }}>
        <h2 style={styles.title}>¿Cómo describirías tu piel?</h2>
        <p style={styles.subtitle}>Esto personaliza nuestras recomendaciones</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SKIN_TYPES.map((s, idx) => (
            <button
              key={s.value}
              style={{
                ...styles.gridOption(data.skinType === s.value),
                background: data.skinType === s.value
                  ? getCardGradientActive(idx, SKIN_TYPES.length)
                  : getCardGradient(idx, SKIN_TYPES.length),
              }}
              onClick={() => update({ skinType: s.value })}
            >
              <span style={styles.emojiCircle}>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={styles.footer}>
        <button
          className="btn-primary"
          disabled={!data.skinType}
          onClick={() => goTo(5)}
        >
          Continuar
        </button>
      </div>
    </div>
  );

  // ── Step 5: Concerns ───────────────────────────────────────────────────

  const toggleConcern = (value) => {
    const current = data.concerns;
    if (value === 'none') {
      update({ concerns: current.includes('none') ? [] : ['none'] });
      return;
    }
    const withoutNone = current.filter((c) => c !== 'none');
    if (withoutNone.includes(value)) {
      update({ concerns: withoutNone.filter((c) => c !== value) });
    } else {
      update({ concerns: [...withoutNone, value] });
    }
  };

  const renderStep5 = () => (
    <div style={styles.screen} className="slide-in">
      {renderProgress(5)}
      {renderBackBtn()}
      <div style={{ ...styles.content, overflowY: 'auto' }}>
        <h2 style={styles.title}>¿Tienes alguna preocupación específica?</h2>
        <p style={styles.subtitle}>Selecciona las que apliquen, o ninguna</p>
        <div style={{ flex: 1 }}>
          {CONCERNS.map((c, idx) => {
            const selected = data.concerns.includes(c.value);
            const noneSelected = data.concerns.includes('none') && c.value !== 'none';
            return (
              <button
                key={c.value}
                style={{
                  ...styles.optionBtn(selected),
                  background: selected
                    ? getCardGradientActive(idx, CONCERNS.length)
                    : getCardGradient(idx, CONCERNS.length),
                  opacity: noneSelected ? 0.4 : 1,
                  cursor: noneSelected ? 'not-allowed' : 'pointer',
                }}
                onClick={() => !noneSelected && toggleConcern(c.value)}
              >
                <span style={{ fontSize: 16 }}>{c.emoji}</span>
                <span style={{ fontWeight: selected ? 600 : 400 }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={styles.footer}>
        <button className="btn-primary" onClick={() => goTo(6)}>
          Continuar
        </button>
      </div>
    </div>
  );

  // ── Step 6: Pelo + Ojos ────────────────────────────────────────────────

  const ColorSwatch = ({ item, selected, onSelect, index, total }) => (
    <button
      onClick={() => onSelect(item.value)}
      style={{
        background: selected
          ? getCardGradientActive(index, total)
          : getCardGradient(index, total),
        border: `1.5px solid ${selected ? 'var(--pink)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '10px 8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s ease',
        minHeight: 72,
        justifyContent: 'center',
      }}
    >
      {item.hex ? (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: item.hex,
          border: '2px solid rgba(0,0,0,0.1)',
          flexShrink: 0,
        }} />
      ) : (
        <span style={{ fontSize: 22 }}>🎨</span>
      )}
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11, color: 'var(--rose)',
        lineHeight: 1.2, textAlign: 'center',
        fontWeight: selected ? 600 : 400,
      }}>
        {item.label}
      </span>
    </button>
  );

  const renderStep6 = () => (
    <div style={styles.screen} className="slide-in">
      {renderProgress(6)}
      {renderBackBtn()}
      <div style={{ ...styles.content, overflowY: 'auto' }}>
        <h2 style={styles.title}>Tu color natural de pelo y ojos</h2>
        <p style={styles.subtitle}>Para tu análisis de colorimetría</p>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11, fontWeight: 600, color: 'var(--text-light)',
          letterSpacing: 1, textTransform: 'uppercase',
          marginBottom: 12,
        }}>Pelo</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
          {HAIR_COLORS.map((item, idx) => (
            <ColorSwatch
              key={item.value}
              item={item}
              selected={data.hairColor === item.value}
              onSelect={(v) => update({ hairColor: v })}
              index={idx}
              total={HAIR_COLORS.length}
            />
          ))}
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11, fontWeight: 600, color: 'var(--text-light)',
          letterSpacing: 1, textTransform: 'uppercase',
          marginBottom: 12,
        }}>Ojos</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {EYE_COLORS.map((item, idx) => (
            <ColorSwatch
              key={item.value}
              item={item}
              selected={data.eyeColor === item.value}
              onSelect={(v) => update({ eyeColor: v })}
              index={idx}
              total={EYE_COLORS.length}
            />
          ))}
        </div>
      </div>
      <div style={styles.footer}>
        <button
          className="btn-primary"
          disabled={!data.hairColor || !data.eyeColor}
          onClick={() => goTo(7)}
        >
          Continuar
        </button>
      </div>
    </div>
  );

  // ── Step 7: Privacidad + final ─────────────────────────────────────────

  const handleComplete = () => {
    const profile = {
      ...data,
      name: data.name.trim(),
      onboardingCompleted: true,
      completedAt: new Date().toISOString(),
    };
    saveProfile(profile);
    localStorage.removeItem('lumina_username');
    onComplete();
  };

  const renderStep7 = () => (
    <div style={styles.screen} className="slide-in">
      {renderProgress(7)}
      <div style={{ flex: 1, padding: '32px 28px 0' }}>
        <h2 style={{ ...styles.title, marginTop: 8 }}>Tu privacidad importa</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
          {[
            { emoji: '📷', text: 'Tus fotos nunca salen de tu teléfono' },
            { emoji: '🔒', text: 'Solo guardamos lo que tú decides' },
            { emoji: '🔔', text: 'Las notificaciones son opcionales' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 16,
              background: 'white', borderRadius: 16, padding: '16px 18px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}>
              <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1.3 }}>{item.emoji}</span>
              <p style={{
                fontSize: 15, color: 'var(--text)', lineHeight: 1.5,
              }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Notifications toggle */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '16px 18px',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16,
        }}>
          <p style={{
            fontSize: 15, color: 'var(--text)', lineHeight: 1.4, flex: 1,
          }}>
            Recordatorios diarios de afirmación
          </p>
          <button
            role="switch"
            aria-checked={data.notificationsEnabled}
            onClick={() => update({ notificationsEnabled: !data.notificationsEnabled })}
            style={{
              width: 'var(--toggle-width)',
              height: 'var(--toggle-height)',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: data.notificationsEnabled ? 'var(--pink)' : 'var(--border)',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.25s ease',
              padding: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: '50%',
              left: data.notificationsEnabled ? 'calc(100% - var(--toggle-knob) - 3px)' : '3px',
              transform: 'translateY(-50%)',
              width: 'var(--toggle-knob)',
              height: 'var(--toggle-knob)',
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              transition: 'left 0.25s ease',
              display: 'block',
            }} />
          </button>
        </div>
      </div>

      <div style={styles.footer}>
        <button className="btn-primary" onClick={handleComplete}>
          Listo, vamos ✨
        </button>
      </div>
    </div>
  );

  // ── Router ─────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return renderStep0();
    }
  };

  return (
    <div key={animKey} style={{ width: '100%', maxWidth: 430, margin: '0 auto', overflowX: 'hidden' }}>
      {renderStep()}
    </div>
  );
}
