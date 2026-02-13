export default function PremiumModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '28px 28px 0 0', padding: '32px 24px 40px',
        width: '100%', maxWidth: 430,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 40 }}>⭐</span>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginTop: 10 }}>Lumina Premium</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-light)', marginTop: 8 }}>
            Desbloquea todo el potencial de tu belleza
          </p>
        </div>

        {['Análisis facial ilimitados', 'Recomendaciones avanzadas de maquillaje', 'Paletas de color personalizadas', 'Chat con Lumina sin límites', 'Contenido exclusivo de bienestar'].map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text)' }}>{b}</p>
          </div>
        ))}

        <div style={{ background: 'var(--bg-soft)', borderRadius: 16, padding: '16px 20px', textAlign: 'center', margin: '20px 0' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--rose)' }}>$5.99<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-light)' }}>/mes</span></p>
        </div>

        <button className="btn-primary">Comenzar Prueba Gratis</button>
        <button onClick={onClose} style={{
          width: '100%', padding: 14, background: 'none', border: 'none',
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--text-muted)',
          cursor: 'pointer', marginTop: 8,
        }}>Tal Vez Luego</button>
      </div>
    </div>
  );
}
