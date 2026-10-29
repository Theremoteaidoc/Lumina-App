import { useState } from 'react';
import Icon, { IconBubble } from './Icon';

export default function PremiumModal({ onClose }) {
  const [toast, setToast] = useState('');

  const handleStartTrial = () => {
    setToast('Pronto disponible 🚀');
    setTimeout(() => {
      setToast('');
      onClose();
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderRadius: '28px 28px 0 0',
        border: '1px solid rgba(255,255,255,0.6)',
        padding: 'max(32px, env(safe-area-inset-top, 32px)) 24px max(40px, env(safe-area-inset-bottom)) 24px',
        width: '100%', maxWidth: 430,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <IconBubble name="star" size={64} variant="premium" iconSize={30} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>Lumina Premium</h2>
          <p style={{ fontSize: 15, color: 'var(--text-light)', marginTop: 8 }}>
            Desbloquea todo el potencial de tu belleza
          </p>
        </div>

        {['Análisis facial ilimitados', 'Recomendaciones avanzadas de maquillaje', 'Paletas de color personalizadas', 'Chat con Lumina sin límites', 'Contenido exclusivo de bienestar'].map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <Icon name="check" size={18} color="var(--green)" strokeWidth={2.2} />
            <p style={{ fontSize: 15, color: 'var(--text)' }}>{b}</p>
          </div>
        ))}

        <div style={{ background: 'var(--bg-soft)', borderRadius: 16, padding: '16px 20px', textAlign: 'center', margin: '20px 0' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--rose)' }}>
            $5.99<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-light)' }}>/mes</span>
          </p>
        </div>

        <button className="btn-primary" onClick={handleStartTrial}>Comenzar Prueba Gratis</button>
        <button onClick={onClose} style={{
          width: '100%', padding: 14, background: 'none', border: 'none',
          fontSize: 15, color: 'var(--text-muted)',
          cursor: 'pointer', marginTop: 8,
        }}>Tal Vez Luego</button>

        {/* Toast inside modal */}
        {toast ? (
          <div style={{
            marginTop: 12, textAlign: 'center',
            background: 'var(--bg-soft)', borderRadius: 12,
            padding: '10px 16px',
            fontSize: 14, fontWeight: 600, color: 'var(--rose)',
          }}>
            {toast}
          </div>
        ) : null}
      </div>
    </div>
  );
}
