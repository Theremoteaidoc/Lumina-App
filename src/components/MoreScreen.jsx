export default function MoreScreen({ onPremium }) {
  return (
    <div className="slide-in">
      <div style={{ padding: '16px 20px 8px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>Más</h1>
      </div>
      <div style={{ padding: '12px 20px' }}>
        {[
          { label: 'Lumina Premium', emoji: '⭐', action: onPremium },
          { label: 'Mi Perfil', emoji: '👤' },
          { label: 'Mis Resultados', emoji: '📊' },
          { label: 'Ajustes', emoji: '⚙️' },
          { label: 'Sobre Lumina', emoji: 'ℹ️' },
        ].map((item, i) => (
          <button key={i} onClick={item.action} style={{
            display: 'flex', alignItems: 'center', gap: 16, width: '100%',
            background: 'white', border: '1px solid var(--border)', borderRadius: 16,
            padding: '16px 18px', marginBottom: 10, cursor: 'pointer',
            boxShadow: 'var(--shadow)', textAlign: 'left',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: 'var(--bg-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>{item.emoji}</div>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text)', fontWeight: 500 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
