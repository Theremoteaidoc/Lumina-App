import { useState } from 'react';
import { COLORIMETRIA_QUESTIONS, COLORIMETRIA_RESULTS } from '../data/appData';

export default function ColorimetriaScreen({ onBack }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleNext = () => {
    const next = [...answers, selected];
    setAnswers(next);
    setSelected(null);
    if (current + 1 >= COLORIMETRIA_QUESTIONS.length) setShowResult(true);
    else setCurrent(current + 1);
  };

  if (showResult) {
    const counts = { frio: 0, calido: 0, neutro: 0 };
    answers.forEach(a => counts[a]++);
    const key = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const data = COLORIMETRIA_RESULTS[key];

    return (
      <div className="slide-in">
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>←</button>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Tu Colorimetría</h1>
        </div>
        <div style={{ padding: '0 20px 40px' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', textAlign: 'center', marginBottom: 8 }}>{data.title}</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>{data.desc}</p>
            <h4 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Colores que te Favorecen</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {data.colors.map((c, i) => (
                <div key={i} style={{ width: 48, height: 48, borderRadius: 12, background: c, border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              ))}
            </div>
            <h4 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Tips de Maquillaje</h4>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>{data.tips}</p>
          </div>
          <button className="btn-primary" onClick={onBack} style={{ marginTop: 20 }}>Volver a Tests</button>
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
          {current + 1 >= COLORIMETRIA_QUESTIONS.length ? 'Ver Resultado' : 'Siguiente'}
        </button>}
      </div>
    </div>
  );
}
