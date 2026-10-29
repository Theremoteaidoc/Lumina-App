import { IconBubble } from './Icon';
import { getCardGradient } from '../utils/cardGradient';

export default function TestsScreen({ onNavigate }) {
  const tests = [
    { id: 'facial', title: 'Análisis Facial Pro', subtitle: 'Visagismo y Proporciones Reales', icon: 'face',
      desc: 'Escanea tu rostro con IA para descubrir tu forma facial y recibe recomendaciones personalizadas.' },
    { id: 'colorimetria', title: 'Colorimetría Personal', subtitle: 'Descubre tu Subtono', icon: 'palette',
      desc: 'Identifica si tu subtono es cálido, frío o neutro y conoce los colores que te favorecen.' },
    { id: 'skintest', title: 'Test de Tipo de Piel', subtitle: 'Conoce tu Piel', icon: 'droplet',
      desc: 'Identifica tu tipo de piel y recibe recomendaciones de cuidado y vitaminas.' },
  ];

  return (
    <div className="slide-in">
      <div style={{ padding: '16px 20px 8px' }}>
        <h1 className="font-display" style={{ fontSize: 24, color: 'var(--text)' }}>Tests</h1>
        <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 4 }}>
          Descubre lo que te hace única
        </p>
      </div>
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tests.map((t, idx) => (
          <button key={t.id} className="card-hover" onClick={() => onNavigate('tests', t.id)} style={{
            background: getCardGradient(idx, tests.length), border: '1px solid var(--border)', borderRadius: 20,
            padding: '22px 20px', cursor: 'pointer', textAlign: 'left',
            boxShadow: 'var(--shadow)', display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <IconBubble name={t.icon} size={48} variant="default" />
            <div>
              <h3 className="font-display" style={{ fontSize: 19, color: 'var(--rose)' }}>{t.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 2 }}>{t.subtitle}</p>
              <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 8, lineHeight: 1.5 }}>{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
