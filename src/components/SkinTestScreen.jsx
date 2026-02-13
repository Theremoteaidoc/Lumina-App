import { useState } from 'react';
import { SKIN_QUESTIONS, SKIN_RESULTS } from '../data/appData';

export default function SkinTestScreen({ onBack }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleNext = () => {
    const next = [...answers, selected];
    setAnswers(next);
    setSelected(null);
    if (current + 1 >= SKIN_QUESTIONS.length) setShowResult(true);
    else setCurrent(current + 1);
  };

  if (showResult) {
    const counts = {};
    answers.forEach(a => counts[a] = (counts[a] || 0) + 1);
    const key = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const data = SKIN_RESULTS[key];

    return (
      <div className="slide-in">
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{data.title}</h1>
        </div>
        <div style={{ padding: '0 20px 40px' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 40 }}>{data.icon}</span>
              <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', marginTop: 8 }}>{data.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6, marginTop: 8 }}>{data.desc}</p>
            </div>

            <h4 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginTop: 20, marginBottom: 12 }}>🧴 Rutina Recomendada</h4>
            {data.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: 'var(--rose)',
                }}>{i + 1}</div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}

            <h4 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginTop: 20, marginBottom: 12 }}>💊 Vitaminas Sugeridas</h4>
            {data.vitamins.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-light)' }}>{v}</p>
              </div>
            ))}

            <div style={{ marginTop: 20, background: '#FFF9E6', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span>ℹ️</span>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text)', lineHeight: 1.5, fontStyle: 'italic' }}>
                Estas recomendaciones son orientativas y no reemplazan una consulta dermatológica profesional.
              </p>
            </div>
          </div>
          <button className="btn-primary" onClick={onBack} style={{ marginTop: 20 }}>Volver a Tests</button>
        </div>
      </div>
    );
  }

  const q = SKIN_QUESTIONS[current];

  return (
    <div className="slide-in">
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Test de Piel</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-light)' }}>Pregunta {current + 1} de {SKIN_QUESTIONS.length}</p>
        </div>
      </div>
      <div style={{ padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {SKIN_QUESTIONS.map((_, i) => (
            <div key={i} className={`progress-dot ${i === current ? 'active' : i < current ? 'done' : 'pending'}`} />
          ))}
        </div>
        <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 20, lineHeight: 1.4 }}>{q.question}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => (
              <button key={i} className={`option-btn ${selected === opt.value ? 'selected' : ''}`} onClick={() => setSelected(opt.value)}>
                {opt.text}
              </button>
            ))}
          </div>
        </div>
        {selected && <button className="btn-primary" onClick={handleNext} style={{ marginTop: 20 }}>
          {current + 1 >= SKIN_QUESTIONS.length ? 'Ver Resultado' : 'Siguiente'}
        </button>}
      </div>
    </div>
  );
}
