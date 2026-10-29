import { useState } from 'react';
import { IconBubble } from './Icon';
import { getCardGradient } from '../utils/cardGradient';

export default function MoreScreen({ onPremium, onNavigate }) {
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const items = [
    { label: 'Lumina Premium', icon: 'star',     action: onPremium },
    { label: 'Mi Perfil',      icon: 'user',     action: () => onNavigate && onNavigate('more', 'profile') },
    { label: 'Mis Resultados', icon: 'chart',    action: () => onNavigate && onNavigate('more', 'results') },
    { label: 'Ajustes',        icon: 'settings', action: () => showToast('Próximamente ✨') },
    { label: 'Sobre Lumina',   icon: 'info',     action: () => showToast('Próximamente ✨') },
  ];

  return (
    <div className="slide-in">
      <div style={{ padding: '16px 20px 8px' }}>
        <h1 className="font-display" style={{ fontSize: 24, color: 'var(--text)' }}>Más</h1>
      </div>
      <div style={{ padding: '12px 20px' }}>
        {items.map((item, i) => (
          <button key={i} onClick={item.action} style={{
            display: 'flex', alignItems: 'center', gap: 16, width: '100%',
            background: getCardGradient(i, items.length), border: '1px solid var(--border)', borderRadius: 16,
            padding: '14px 18px', marginBottom: 10, cursor: 'pointer',
            boxShadow: 'var(--shadow)', textAlign: 'left',
          }}>
            <IconBubble name={item.icon} size={44} variant="default" />
            <span className="font-display" style={{ fontSize: 16, color: 'var(--rose)' }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Toast notification */}
      {toast ? (
        <div style={{
          position: 'fixed',
          bottom: 'max(88px, calc(72px + env(safe-area-inset-bottom)))',
          left: '50%', transform: 'translateX(-50%)',
          background: 'var(--rose)', color: 'white',
          padding: '10px 20px', borderRadius: 20,
          fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(130,98,110,0.35)',
          zIndex: 300,
          animation: 'fadeIn 0.2s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      ) : null}
    </div>
  );
}
