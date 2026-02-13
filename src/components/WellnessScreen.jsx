import { useState } from 'react';
import { AFFIRMATION_CARDS } from '../data/appData';

export default function WellnessScreen() {
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState(null);

  const go = (dir) => {
    setAnim(dir);
    setTimeout(() => {
      setIdx((idx + (dir === 'next' ? 1 : -1) + AFFIRMATION_CARDS.length) % AFFIRMATION_CARDS.length);
      setAnim(null);
    }, 200);
  };

  const card = AFFIRMATION_CARDS[idx];

  return (
    <div className="slide-in">
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>✨</span>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Lumina</h1>
      </div>
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Amor Propio</h3>

        <div style={{
          background: 'white', borderRadius: 24, padding: '40px 28px',
          boxShadow: 'var(--shadow)', border: '1.5px solid var(--pink-light)',
          textAlign: 'center', minHeight: 320,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: anim ? 0.3 : 1, transform: anim ? `translateX(${anim === 'next' ? '-20px' : '20px'})` : 'none',
          transition: 'all 0.2s ease',
        }}>
          <div className="float" style={{ fontSize: 48, color: 'var(--pink-light)' }}>♥</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginTop: 20, marginBottom: 16 }}>
            {card.affirmation}
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-light)',
            fontStyle: 'italic', lineHeight: 1.6, maxWidth: 280,
          }}>{card.verse}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: '0 20px' }}>
          <button onClick={() => go('prev')} style={{
            width: 44, height: 44, borderRadius: '50%', background: 'white',
            border: '1px solid var(--border)', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)',
          }}>‹</button>
          <div style={{ display: 'flex', gap: 6 }}>
            {AFFIRMATION_CARDS.map((_, i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: i === idx ? 'var(--pink)' : 'var(--border)', transition: 'all 0.3s',
              }} />
            ))}
          </div>
          <button onClick={() => go('next')} style={{
            width: 44, height: 44, borderRadius: '50%', background: 'white',
            border: '1px solid var(--border)', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)',
          }}>›</button>
        </div>
      </div>
    </div>
  );
}
