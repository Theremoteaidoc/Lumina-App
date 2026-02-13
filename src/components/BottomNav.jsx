export default function BottomNav({ tab, onTab }) {
  const items = [
    { id: 'home', label: 'HOME', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--rose)' : 'var(--text-muted)'} strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
    { id: 'tests', label: 'TESTS', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--rose)' : 'var(--text-muted)'} strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
    { id: 'wellness', label: 'BIENESTAR', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--rose)' : 'var(--text-muted)'} strokeWidth="1.8"><path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 0111.5 5.5l.5.5.5-.5a5 5 0 017 7.072z"/></svg> },
    { id: 'more', label: 'MÁS', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--rose)' : 'var(--text-muted)'} strokeWidth="1.8"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg> },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '10px 0 max(20px, env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {items.map(({ id, label, icon }) => (
        <button key={id} onClick={() => onTab(id)} style={{
          background: tab === id ? 'var(--bg-soft)' : 'transparent',
          border: 'none', borderRadius: 16, padding: '8px 16px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          {icon(tab === id)}
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: tab === id ? 600 : 400,
            color: tab === id ? 'var(--rose)' : 'var(--text-muted)', letterSpacing: 1,
          }}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
