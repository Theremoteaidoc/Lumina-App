import { useState, useEffect, useMemo } from 'react';
import { SKIN_QUESTIONS, BAUMANN_AXES } from '../data/appData';
import { computeBaumannCode, mapAxesToLegacySkinType, composeSkinTitle } from '../utils/baumann';
import { getCardGradient, getCardGradientActive } from '../utils/cardGradient';
import { getProfile, updateProfile } from '../utils/profile';

// Labels legibles para las preferencias seleccionadas (mostradas en el resultado)
const PREFERENCE_LABELS = {
  natural: '🌿 Naturales',
  pharmacy: '💊 Dermo-cosméticos',
  k_beauty: '✨ K-beauty',
  cruelty_free: '🐰 Cruelty-free',
  vegan: '🌱 Veganos',
  potent: '⚗️ Activos potentes',
  minimal: '🌸 Minimalistas',
  affordable: '💰 Económicos',
  derm_approved: '👩‍⚕️ Recomendados por derma',
  fragrance: '🌺 Fragancias',
  alcohol: '🍷 Alcohol',
  parabens_sulfates: '🧪 Parabenos / sulfatos',
  animal_tested: '🐭 Testeo animal',
  harsh_chemicals: '⚠️ Químicos agresivos',
  oily_texture: '💧 Texturas aceitosas',
  strong_actives: '🔬 Activos fuertes',
  synthetic: '🧬 Sintéticos',
};

// Etiquetas de eje mostradas en el desglose del resultado.
const AXIS_LABELS = {
  hydration: 'Hidratación',
  sensitivity: 'Sensibilidad',
  pigmentation: 'Pigmentación',
  firmness: 'Firmeza',
};

// Une varias listas quitando duplicados, preservando el orden de aparición.
function mergeUnique(lists) {
  return Array.from(new Set(lists.flat()));
}

export default function SkinTestScreen({ onBack }) {
  const ageRange = getProfile()?.ageRange;
  const includeFirmness = ageRange === '26-35' || ageRange === '35+';

  // Preguntas de eje (age-adaptive) + las 2 de preferencias, siempre al final.
  const questions = useMemo(
    () => SKIN_QUESTIONS.filter((q) => q.axis !== 'firmness' || includeFirmness),
    [includeFirmness]
  );

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedMulti, setSelectedMulti] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const q = questions[current];

  // ── Result calculation (also drives profile persistence) ────────────────
  const result = useMemo(() => {
    if (!showResult) return null;

    const { code, axes } = computeBaumannCode(answers, questions);
    const skinType = mapAxesToLegacySkinType(axes);
    const title = composeSkinTitle(axes, BAUMANN_AXES);

    // Desglose por eje: solo los ejes que realmente se respondieron.
    const breakdown = Object.keys(AXIS_LABELS)
      .filter((axis) => axes[axis])
      .map((axis) => ({
        axis,
        axisLabel: AXIS_LABELS[axis],
        letter: axes[axis],
        data: BAUMANN_AXES[axis][axes[axis]],
      }));

    const routine = mergeUnique(breakdown.map((b) => b.data.routine));
    const tips = mergeUnique(breakdown.map((b) => b.data.tips));
    const goodHabits = mergeUnique(breakdown.map((b) => b.data.goodHabits));
    const badHabits = mergeUnique(breakdown.map((b) => b.data.badHabits));

    // El girl tip destaca sensibilidad si aplica, si no, hidratación (el eje más presente).
    const girlTipAxis = axes.sensitivity === 'S' ? 'sensitivity' : 'hydration';
    const girlTip = BAUMANN_AXES[girlTipAxis][axes[girlTipAxis]]?.girlTip;

    // Extract preferences from multi-select answers
    const preferences = { likes: [], avoid: [] };
    questions.forEach((question, i) => {
      if (question.multi && question.category && Array.isArray(answers[i])) {
        preferences[question.category] = answers[i];
      }
    });

    return { code, axes, skinType, title, breakdown, routine, tips, goodHabits, badHabits, girlTip, preferences };
  }, [showResult, answers, questions]);

  useEffect(() => {
    if (showResult && result?.code) {
      updateProfile({
        skinBaumann: result.code,
        skinAxes: result.axes,
        skinType: result.skinType,
        skinPreferences: result.preferences,
        skinTestAt: new Date().toISOString(),
      });
    }
    // eslint-disable-next-line
  }, [showResult, result?.code]);

  const handleNext = () => {
    const answer = q.multi ? selectedMulti : selected;
    const next = [...answers, answer];
    setAnswers(next);
    setSelected(null);
    setSelectedMulti([]);
    if (current + 1 >= questions.length) setShowResult(true);
    else setCurrent(current + 1);
  };

  const toggleMulti = (value) => {
    setSelectedMulti((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // ── RESULT ─────────────────────────────────────────────────────────────
  if (showResult) {
    const { title, code, breakdown, routine, tips, goodHabits, badHabits, girlTip, preferences } = result;

    return (
      <div className="slide-in">
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
          <h1 className="font-display" style={{ fontSize: 22, color: 'var(--text)' }}>{title}</h1>
        </div>
        <div style={{ padding: '0 20px 40px' }}>
          {/* Result card — glass treatment */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,196,209,0.2))',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 20, padding: 24,
            boxShadow: '0 4px 24px rgba(250,147,165,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.6)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h3 className="font-display" style={{ fontSize: 24, color: 'var(--text)' }}>{title}</h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                letterSpacing: 1, color: 'var(--rose)', marginTop: 6,
              }}>
                CÓDIGO {code}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 8 }}>
                Basado en el sistema de tipos de piel de la Dra. Leslie Baumann
              </p>
            </div>

            {/* ── Desglose por eje ── */}
            {breakdown.map(({ axis, axisLabel, data }) => (
              <div key={axis} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                marginBottom: 14, padding: '10px 12px',
                background: 'var(--bg-soft)', borderRadius: 12,
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{data.icon}</span>
                <div>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                    letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--text-muted)',
                  }}>
                    {axisLabel}: {data.label}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5, marginTop: 4 }}>{data.desc}</p>
                </div>
              </div>
            ))}

            <h4 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginTop: 20, marginBottom: 12 }}>🧴 Rutina Recomendada</h4>
            {routine.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: 'var(--rose)',
                }}>{i + 1}</div>
                <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}

            <h4 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginTop: 20, marginBottom: 12 }}>💡 Tips Extra</h4>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
                <p style={{ fontSize: 14, color: 'var(--text-light)' }}>{tip}</p>
              </div>
            ))}

            <div style={{ marginTop: 20, background: '#FFF9E6', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span>ℹ️</span>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, fontStyle: 'italic' }}>
                Estas recomendaciones son orientativas y no reemplazan una consulta dermatológica profesional.
              </p>
            </div>
          </div>

          {/* ── Girl Tip card ── */}
          {girlTip && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(250,147,165,0.18), rgba(255,217,225,0.5))',
              border: '1px solid rgba(250,147,165,0.3)',
              borderRadius: 18,
              padding: '18px 20px',
              boxShadow: 'var(--shadow)',
              marginTop: 16,
            }}>
              <p className="font-display" style={{
                fontSize: 18, color: 'var(--rose)',
                marginBottom: 8, fontStyle: 'italic',
              }}>
                💋 Girl Tip de Lumina
              </p>
              <p style={{
                fontSize: 14, color: 'var(--text)',
                lineHeight: 1.7, fontStyle: 'italic',
              }}>
                "{girlTip}"
              </p>
            </div>
          )}

          {/* ── Buenos hábitos card ── */}
          {goodHabits.length > 0 && (
            <div style={{
              background: 'var(--gradient-card)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: '18px 20px',
              boxShadow: 'var(--shadow)',
              marginTop: 14,
            }}>
              <p className="font-display" style={{
                fontSize: 18, color: 'var(--rose)',
                marginBottom: 12, fontStyle: 'italic',
              }}>
                ✅ Hábitos que tu piel ama
              </p>
              {goodHabits.map((habit, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10,
                  marginBottom: i === goodHabits.length - 1 ? 0 : 10,
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    color: 'var(--green)', fontWeight: 700,
                    fontSize: 14, lineHeight: 1.5, flexShrink: 0,
                    marginTop: 1,
                  }}>✓</span>
                  <p style={{
                    fontSize: 13.5, color: 'var(--text)',
                    lineHeight: 1.55,
                  }}>{habit}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Malos hábitos card ── */}
          {badHabits.length > 0 && (
            <div style={{
              background: 'var(--gradient-card)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: '18px 20px',
              boxShadow: 'var(--shadow)',
              marginTop: 14,
            }}>
              <p className="font-display" style={{
                fontSize: 18, color: 'var(--rose)',
                marginBottom: 12, fontStyle: 'italic',
              }}>
                ⚠️ Hábitos que mejor evita
              </p>
              {badHabits.map((habit, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10,
                  marginBottom: i === badHabits.length - 1 ? 0 : 10,
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    color: '#C75B5B', fontWeight: 700,
                    fontSize: 14, lineHeight: 1.5, flexShrink: 0,
                    marginTop: 1,
                  }}>✗</span>
                  <p style={{
                    fontSize: 13.5, color: 'var(--text)',
                    lineHeight: 1.55,
                  }}>{habit}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Preferences card — only shown if user selected any ── */}
          {(preferences.likes.length > 0 || preferences.avoid.length > 0) && (
            <div style={{
              background: 'var(--gradient-card)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: '18px 20px',
              boxShadow: 'var(--shadow)',
              marginTop: 16,
            }}>
              <p className="font-display" style={{
                fontSize: 18, color: 'var(--rose)',
                marginBottom: 10, fontStyle: 'italic',
              }}>
                ✨ Tus Preferencias
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: 'var(--text-light)',
                lineHeight: 1.6, marginBottom: 14,
              }}>
                Cuando Lumina te sugiera productos en el chat o en futuras secciones, lo hará respetando esto:
              </p>

              {preferences.likes.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11, fontWeight: 600,
                    color: 'var(--text-muted)', letterSpacing: 0.8,
                    textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    Te gustan
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {preferences.likes.map((pref) => (
                      <span key={pref} style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                        padding: '5px 10px', borderRadius: 12,
                        background: 'var(--bg-soft)', color: 'var(--rose)',
                      }}>{PREFERENCE_LABELS[pref] || pref}</span>
                    ))}
                  </div>
                </div>
              )}

              {preferences.avoid.length > 0 && (
                <div>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11, fontWeight: 600,
                    color: 'var(--text-muted)', letterSpacing: 0.8,
                    textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    Prefieres evitar
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {preferences.avoid.map((pref) => (
                      <span key={pref} style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                        padding: '5px 10px', borderRadius: 12,
                        background: 'white', color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}>{PREFERENCE_LABELS[pref] || pref}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button className="btn-primary" onClick={onBack} style={{ marginTop: 20 }}>Volver a Tests</button>
        </div>
      </div>
    );
  }

  // ── QUIZ ──────────────────────────────────────────────────────────────
  const canContinue = q.multi
    ? (q.optional || selectedMulti.length > 0)
    : selected !== null;

  return (
    <div className="slide-in">
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Test de Piel</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-light)' }}>Pregunta {current + 1} de {questions.length}</p>
        </div>
      </div>
      <div style={{ padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {questions.map((_, i) => (
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
            {q.options.map((opt, i) => {
              const isSelected = q.multi
                ? selectedMulti.includes(opt.value)
                : selected === opt.value;
              return (
                <button
                  key={i}
                  className={`option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => q.multi ? toggleMulti(opt.value) : setSelected(opt.value)}
                  style={{
                    background: isSelected
                      ? getCardGradientActive(i, q.options.length)
                      : getCardGradient(i, q.options.length),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>{opt.text}</span>
                  {q.multi && (
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: isSelected ? 'var(--rose)' : 'white',
                      border: isSelected ? 'none' : '1.5px solid var(--border)',
                      color: 'white', fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {canContinue && <button className="btn-primary" onClick={handleNext} style={{ marginTop: 20 }}>
          {current + 1 >= questions.length ? 'Ver Resultado' : 'Siguiente'}
        </button>}
      </div>
    </div>
  );
}
