import { useState } from 'react';
import { getProfile } from '../utils/profile';
import { IconBubble } from './Icon';
import { getCardGradient } from '../utils/cardGradient';

// ─── Helper: time-based greeting ───────────────────────────────────────────
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Buenos días', emoji: '🌅' };
  if (hour >= 12 && hour < 19) return { text: 'Buenas tardes', emoji: '☀️' };
  return { text: 'Buenas noches', emoji: '🌙' };
}

// ─── Helper: contextual subtitle ────────────────────────────────────────────
function getContextualSubtitle(profile) {
  if (!profile) return '"Conocerte no es criticarte. Cuidarte no es compararte."';

  const skinType = profile.skinType;
  const concerns = profile.concerns || [];
  const goals = profile.goals || [];

  // Priority 1: known skin type
  if (skinType && skinType !== 'desconocido') {
    const skinLabel = {
      grasa: 'grasa',
      seca: 'seca',
      mixta: 'mixta',
      normal: 'normal',
      sensible: 'sensible',
    }[skinType] || skinType;
    return `¿Cómo está tu piel ${skinLabel} hoy?`;
  }

  // Priority 2: acne concern without skinType
  if (concerns.includes('acne')) {
    return 'Vamos por una piel más clara hoy 💪';
  }

  // Priority 3: selflove goal
  if (goals.includes('selflove')) {
    return 'Hoy también mereces tu cuidado 💕';
  }

  // Default
  return '"Conocerte no es criticarte. Cuidarte no es compararte."';
}

// ─── Helper: determine priority module IDs from goals ───────────────────────
function getPriorityModuleIds(goals) {
  if (!goals || goals.length === 0) return [];

  const seen = new Set();
  const priority = [];

  const goalMap = {
    skincare:    ['skintest'],
    colorimetry: ['colorimetria'],
    makeup:      ['colorimetria', 'facial'],
    selflove:    ['wellness'],
    face:        ['facial'],
    explore:     [],
  };

  for (const goal of goals) {
    const ids = goalMap[goal] || [];
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        priority.push(id);
      }
    }
  }

  return priority;
}

// ─── Helper: reorder modules putting priority ones first ────────────────────
function reorderModules(modules, priorityIds) {
  if (!priorityIds || priorityIds.length === 0) return modules;

  const prioritySet = new Set(priorityIds);
  const top = [];
  const rest = [];

  // Collect priority modules in the order they appear in priorityIds
  for (const id of priorityIds) {
    const mod = modules.find((m) => m.id === id);
    if (mod) top.push(mod);
  }

  // Remaining modules in their original order
  for (const mod of modules) {
    if (!prioritySet.has(mod.id)) rest.push(mod);
  }

  return [...top, ...rest];
}

// ─── Helper: featured card config from goals ────────────────────────────────
function getFeaturedCard(profile) {
  if (!profile) return null;
  const goals = profile.goals || [];
  if (goals.length === 0) return null;

  if (goals.includes('skincare') || (profile.concerns && profile.concerns.length > 0)) {
    return {
      icon: 'droplet',
      title: 'Cuida tu piel hoy',
      subtitle: 'Descubre tu tipo de piel y una rutina personalizada',
      target: 'tests',
      targetSub: 'skintest',
    };
  }

  if (goals.includes('colorimetry')) {
    return {
      icon: 'palette',
      title: 'Descubre tu paleta personal',
      subtitle: 'Conoce los colores que mejor realzan tu belleza',
      target: 'tests',
      targetSub: 'colorimetria',
    };
  }

  if (goals.includes('face') || goals.includes('makeup')) {
    return {
      icon: 'face',
      title: 'Conoce tu rostro',
      subtitle: 'Analiza tu forma de rostro y ojos para maquillarte mejor',
      target: 'tests',
      targetSub: 'facial',
    };
  }

  if (goals.includes('selflove') || goals.includes('explore')) {
    return {
      icon: 'heart',
      title: 'Tu momento de calma',
      subtitle: 'Afirmaciones y amor propio para empezar bien el día',
      target: 'wellness',
      targetSub: null,
    };
  }

  // Fallback
  return {
    icon: 'sparkle',
    title: 'Empieza por conocerte',
    subtitle: 'El test de colorimetría es el primer paso',
    target: 'tests',
    targetSub: 'colorimetria',
  };
}

// ─── Default module list (canonical order) ──────────────────────────────────
const DEFAULT_MODULES = [
  { id: 'facial',       label: 'Análisis Facial',   icon: 'face'    },
  { id: 'colorimetria', label: 'Colorimetría',      icon: 'palette' },
  { id: 'skintest',     label: 'Test de Piel',      icon: 'droplet' },
  { id: 'lookbook',     label: 'Tu Lookbook',       icon: 'hair'    },
  { id: 'collage',      label: 'Tablero de Looks',  icon: 'image'   },
  { id: 'wellness',     label: 'Amor Propio',       icon: 'heart'   },
  { id: 'community',    label: 'Comunidad',         icon: 'users',   soon: true },
  { id: 'chat',         label: 'Hablar con Lumina', icon: 'chat'    },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function HomeScreen({ onNavigate, onPremium }) {
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const profile = getProfile();

  // Greeting
  const { text: greetingText, emoji: greetingEmoji } = getTimeGreeting();
  const displayName = profile?.name || localStorage.getItem('lumina_username') || 'bella';
  const greeting = `${greetingText}, ${displayName} ${greetingEmoji}`;

  // Subtitle
  const subtitle = getContextualSubtitle(profile);

  // Modules (reordered)
  const goals = profile?.goals || [];
  const priorityIds = getPriorityModuleIds(goals);
  const modules = reorderModules(DEFAULT_MODULES, priorityIds);
  const prioritySet = new Set(priorityIds);

  // Featured card
  const featuredCard = getFeaturedCard(profile);

  const handleModulePress = (mod) => {
    if (mod.id === 'wellness') onNavigate('wellness');
    else if (mod.id === 'community') showToast('Próximamente ✨');
    else if (mod.id === 'chat') onNavigate('home', 'chat');
    else if (mod.id === 'lookbook') onNavigate('home', 'lookbook');
    else if (mod.id === 'collage') onNavigate('home', 'collage');
    else onNavigate('tests', mod.id);
  };

  const handleFeaturedPress = () => {
    if (!featuredCard) return;
    if (featuredCard.targetSub) onNavigate(featuredCard.target, featuredCard.targetSub);
    else onNavigate(featuredCard.target);
  };

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
        <h2 className="font-display" style={{ fontSize: 28, color: 'var(--text)', lineHeight: 1.2 }}>{greeting}</h2>
        <p style={{
          fontSize: 15, color: 'var(--text-light)',
          fontStyle: subtitle.startsWith('"') ? 'italic' : 'normal',
          marginTop: 8, lineHeight: 1.5,
        }}>{subtitle}</p>
      </div>

      {/* Featured card — only when profile has goals */}
      {featuredCard && (
        <div style={{ padding: '16px 20px 0' }}>
          <button
            className="card-hover"
            onClick={handleFeaturedPress}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,196,209,0.3))',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 20,
              padding: '18px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 4px 20px rgba(250,147,165,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
              textAlign: 'left',
              minHeight: 120,
            }}
          >
            {/* Icon bubble */}
            <IconBubble name={featuredCard.icon} size={56} variant="pink" />

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 19,
                fontWeight: 600,
                color: 'var(--text)',
                lineHeight: 1.2,
                marginBottom: 4,
              }}>{featuredCard.title}</p>
              <p style={{
                fontSize: 13,
                color: 'var(--text-light)',
                lineHeight: 1.4,
              }}>{featuredCard.subtitle}</p>
            </div>

            {/* Arrow hint */}
            <div style={{
              fontSize: 18,
              color: 'var(--rose)',
              flexShrink: 0,
              fontWeight: 600,
            }}>›</div>
          </button>
        </div>
      )}

      {/* Module grid */}
      <div style={{ padding: '20px 20px' }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Tu Camino de Hoy</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {modules.map((mod, idx) => {
            const isPriority = prioritySet.has(mod.id) && !mod.soon;
            return (
              <button key={mod.id} className="card-hover" onClick={() => handleModulePress(mod)} style={{
                position: 'relative',
                background: getCardGradient(idx, modules.length), border: '1px solid var(--border)',
                borderRadius: 20, padding: '24px 16px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                boxShadow: 'var(--shadow)',
              }}>
                {/* PRONTO badge for community */}
                {mod.soon && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'var(--pink)', color: 'white',
                    fontSize: 8, fontWeight: 700,
                    padding: '3px 6px', borderRadius: 6,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: 0.5,
                  }}>PRONTO</div>
                )}
                {/* PARA TI badge for priority modules */}
                {isPriority && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'var(--pink)', color: 'white',
                    fontSize: 8, fontWeight: 600,
                    padding: '2px 6px', borderRadius: 6,
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: 0.5,
                  }}>PARA TI</div>
                )}
                <IconBubble
                  name={mod.icon}
                  size={52}
                  variant="default"
                />
                <span className="font-display" style={{
                  fontSize: 17,
                  color: 'var(--rose)', textAlign: 'center', lineHeight: 1.2,
                }}>{mod.label}</span>
              </button>
            );
          })}
        </div>
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
