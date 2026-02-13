export default function HomeScreen({ onNavigate, onPremium }) {
  const modules = [
    { id: 'facial', label: 'ANÁLISIS FACIAL', emoji: '📸', gradient: false },
    { id: 'colorimetria', label: 'COLORIMETRÍA', emoji: '🎨', gradient: false },
    { id: 'skintest', label: 'TEST DE PIEL', emoji: '💧', gradient: true },
    { id: 'wellness', label: 'AMOR PROPIO', emoji: '💕', gradient: true },
    { id: 'community', label: 'COMUNIDAD', emoji: '👥', gradient: true },
    { id: 'chat', label: 'HABLAR CON LUMINA', emoji: '💬', gradient: false },
  ];

  return (
    <div className="slide-in">
      {/* Header */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Lumina</h1>
        </div>
        <button onClick={onPremium} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}>⭐</button>
      </div>

      {/* Greeting */}
      <div style={{ textAlign: 'center', padding: '20px 24px 8px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 600, color: 'var(--text)' }}>Hola, Valery</h2>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-light)',
          fontStyle: 'italic', marginTop: 8, lineHeight: 1.5,
        }}>"Conocerte no es criticarte. Cuidarte no es compararte."</p>
      </div>

      {/* Module grid */}
      <div style={{ padding: '20px 20px' }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Tu Camino de Hoy</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {modules.map((mod) => (
            <button key={mod.id} className="card-hover" onClick={() => {
              if (mod.id === 'wellness') onNavigate('wellness');
              else if (mod.id === 'community') return;
              else if (mod.id === 'chat') onNavigate('home', 'chat');
              else onNavigate('tests', mod.id);
            }} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '24px 16px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: mod.gradient ? 'linear-gradient(135deg, var(--pink-light), var(--pink))' : 'var(--bg-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>{mod.emoji}</div>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                color: 'var(--text)', letterSpacing: 0.8, textAlign: 'center', lineHeight: 1.3,
              }}>{mod.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
