export default function TestsScreen({ onNavigate }) {
  const tests = [
    { id: 'facial', title: 'Análisis Facial Pro', subtitle: 'Visagismo y Proporciones Reales', emoji: '📸',
      desc: 'Escanea tu rostro con IA para descubrir tu forma facial y recibe recomendaciones personalizadas.' },
    { id: 'colorimetria', title: 'Colorimetría Personal', subtitle: 'Descubre tu Subtono', emoji: '🎨',
      desc: 'Identifica si tu subtono es cálido, frío o neutro y conoce los colores que te favorecen.' },
    { id: 'skintest', title: 'Test de Tipo de Piel', subtitle: 'Conoce tu Piel', emoji: '💧',
      desc: 'Identifica tu tipo de piel y recibe recomendaciones de cuidado y vitaminas.' },
  ];

  return (
    <div className="slide-in">
      <div style={{ padding: '16px 20px 8px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>Tests</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
          Descubre lo que te hace única
        </p>
      </div>
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tests.map((t) => (
          <button key={t.id} className="card-hover" onClick={() => onNavigate('tests', t.id)} style={{
            background: 'white', border: '1px solid var(--border)', borderRadius: 20,
            padding: '22px 20px', cursor: 'pointer', textAlign: 'left',
            boxShadow: 'var(--shadow)', display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: 'var(--bg-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{t.emoji}</div>
            <div>
              <h3 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)' }}>{t.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{t.subtitle}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-light)', marginTop: 8, lineHeight: 1.5 }}>{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
