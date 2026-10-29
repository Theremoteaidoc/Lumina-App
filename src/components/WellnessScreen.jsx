import { useState, useEffect, useCallback } from 'react';
import { AFFIRMATION_CARDS } from '../data/appData';
import { getProfile } from '../utils/profile';
import { getCardGradient } from '../utils/cardGradient';

// ─── Constants ─────────────────────────────────────────────────────────────

const MOOD_KEY = 'lumina_last_mood';
const FAVORITES_KEY = 'lumina_favorite_affirmations';
const MOOD_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const MOODS = [
  { id: 'happy',       emoji: '😊',  label: 'Feliz' },
  { id: 'grateful',    emoji: '🙏',  label: 'Agradecida' },
  { id: 'hopeful',     emoji: '✨',  label: 'Esperanzada' },
  { id: 'tired',       emoji: '😴',  label: 'Cansada' },
  { id: 'anxious',     emoji: '😰',  label: 'Ansiosa' },
  { id: 'down',        emoji: '🌧️',  label: 'Apagada' },
  { id: 'lonely',      emoji: '🌙',  label: 'Sola' },
  { id: 'insecure',    emoji: '😶‍🌫️', label: 'Insegura' },
  { id: 'overwhelmed', emoji: '🌊',  label: 'Abrumada' },
  { id: 'empowered',   emoji: '🔥',  label: 'Poderosa' },
  { id: 'inspired',    emoji: '💫',  label: 'Inspirada' },
  { id: 'peaceful',    emoji: '🌿',  label: 'En paz' },
];

const MOOD_HEADER = {
  happy:       'Para celebrar que estás',
  grateful:    'Para celebrar que estás',
  hopeful:     'Para alimentar tu esperanza',
  tired:       'Para cuando estás',
  anxious:     'Para cuando estás',
  down:        'Para cuando estás',
  lonely:      'Para cuando te sientes',
  insecure:    'Para cuando te sientes',
  overwhelmed: 'Para cuando te sientes',
  empowered:   'Para celebrar que estás',
  inspired:    'Para celebrar que estás',
  peaceful:    'Para celebrar que estás',
};

const MOOD_LABEL_PHRASE = {
  happy:       'Feliz',
  grateful:    'Agradecida',
  hopeful:     '',
  tired:       'Cansada',
  anxious:     'Ansiosa',
  down:        'Apagada',
  lonely:      'Sola',
  insecure:    'Insegura',
  overwhelmed: 'Abrumada',
  empowered:   'Poderosa',
  inspired:    'Inspirada',
  peaceful:    'En paz',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function loadSavedMood() {
  try {
    const raw = localStorage.getItem(MOOD_KEY);
    if (!raw) return null;
    const { mood, ts } = JSON.parse(raw);
    if (Date.now() - ts < MOOD_TTL_MS) return mood;
    return null;
  } catch {
    return null;
  }
}

function saveMood(mood) {
  try {
    localStorage.setItem(MOOD_KEY, JSON.stringify({ mood, ts: Date.now() }));
  } catch { /* storage full — not critical */ }
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch { /* storage full */ }
}

function buildPool(mood, profile) {
  // 1. Filter cards that include this mood
  let pool = AFFIRMATION_CARDS.filter(c => c.moods.includes(mood));

  // 2. Profile-based prioritization (sort, not exclude)
  if (profile) {
    const wantsIdentity = Array.isArray(profile.goals) && profile.goals.includes('selflove');
    const wantsSkin =
      Array.isArray(profile.concerns) &&
      profile.concerns.some(c => ['acne', 'dryness', 'oiliness', 'sensitivity'].includes(c));

    pool.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (wantsIdentity) {
        if (a.themes.includes('identity')) scoreA += 2;
        if (b.themes.includes('identity')) scoreB += 2;
      }
      if (wantsSkin) {
        if (a.themes.includes('skin')) scoreA += 1;
        if (b.themes.includes('skin')) scoreB += 1;
      }
      return scoreB - scoreA; // higher score first
    });
  }

  // 3. Fallback: if less than 3 results, use the whole deck
  if (pool.length < 3) {
    pool = [...AFFIRMATION_CARDS];
  }

  return pool;
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function WellnessScreen() {
  const [mood, setMood] = useState(null);          // selected mood id or null
  const [viewState, setViewState] = useState('loading'); // 'loading' | 'picker' | 'cards'
  const [transitioning, setTransitioning] = useState(false);

  const [pool, setPool] = useState([]);
  const [idx, setIdx] = useState(0);
  const [cardAnim, setCardAnim] = useState(null);  // 'next' | 'prev' | null

  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState(null);        // string | null

  // On mount: check localStorage for a recent mood
  useEffect(() => {
    const saved = loadSavedMood();
    const favs = loadFavorites();
    setFavorites(favs);
    if (saved) {
      const profile = getProfile();
      setMood(saved);
      setPool(buildPool(saved, profile));
      setViewState('cards');
    } else {
      setViewState('picker');
    }
  }, []);

  // Select mood from picker
  const selectMood = useCallback((moodId) => {
    if (transitioning) return;
    setTransitioning(true);
    const profile = getProfile();
    const newPool = buildPool(moodId, profile);
    saveMood(moodId);

    // Short fade-out, then switch view
    setTimeout(() => {
      setMood(moodId);
      setPool(newPool);
      setIdx(0);
      setViewState('cards');
      setTransitioning(false);
    }, 220);
  }, [transitioning]);

  // Back to picker
  const goToPicker = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setMood(null);
      setViewState('picker');
      setTransitioning(false);
    }, 220);
  }, [transitioning]);

  // Navigate cards
  const go = useCallback((dir) => {
    if (cardAnim) return;
    setCardAnim(dir);
    setTimeout(() => {
      setIdx(prev => (prev + (dir === 'next' ? 1 : -1) + pool.length) % pool.length);
      setCardAnim(null);
    }, 200);
  }, [cardAnim, pool.length]);

  // Favorites toggle
  const toggleFavorite = useCallback((cardId) => {
    setFavorites(prev => {
      const next = prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId];
      saveFavorites(next);
      setToast(prev.includes(cardId) ? 'Quitada de favoritas' : 'Guardada ✨');
      setTimeout(() => setToast(null), 2200);
      return next;
    });
  }, []);

  const card = pool[idx] || null;
  const moodMeta = MOODS.find(m => m.id === mood);

  // ─── View: Picker ─────────────────────────────────────────────────────

  if (viewState === 'picker' || viewState === 'loading') {
    return (
      <div className="slide-in" style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.22s ease' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Lumina</h1>
        </div>
        <div style={{ padding: '0 20px 32px' }}>
          <h3 className="font-display" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 28 }}>Amor Propio</h3>

          {/* Mood question */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 26,
              fontWeight: 600,
              color: 'var(--text)',
              lineHeight: 1.3,
              marginBottom: 8,
            }}>
              ¿Cómo te sientes hoy?
            </h2>
            <p style={{
              fontSize: 15,
              color: 'var(--text-light)',
              fontWeight: 400,
            }}>
              Elige el estado que más se acerca a ti
            </p>
          </div>

          {/* 3x2 mood grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
          }}>
            {MOODS.map((m, mIdx) => (
              <button
                key={m.id}
                className="card-hover"
                onClick={() => selectMood(m.id)}
                style={{
                  background: getCardGradient(mIdx, MOODS.length),
                  border: '1.5px solid var(--border)',
                  borderRadius: 16,
                  padding: '18px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow)',
                  minHeight: 88,
                }}
              >
                <span style={{ fontSize: 36, lineHeight: 1 }}>{m.emoji}</span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--rose)',
                }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── View: Affirmation cards ───────────────────────────────────────────

  const moodHeaderText = mood
    ? MOOD_HEADER[mood] + (MOOD_LABEL_PHRASE[mood] ? ' ' + MOOD_LABEL_PHRASE[mood] : '')
    : '';

  return (
    <div
      className="slide-in"
      style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.22s ease' }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>✨</span>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Lumina</h1>
      </div>

      <div style={{ padding: '0 20px 32px' }}>
        <h3 className="font-display" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 16 }}>Amor Propio</h3>

        {/* Mood sub-header + change button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <span style={{
            fontSize: 14,
            color: 'var(--text-light)',
            fontStyle: 'italic',
          }}>
            {moodMeta ? moodMeta.emoji + ' ' : ''}{moodHeaderText}
          </span>
          <button
            onClick={goToPicker}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--rose)',
              fontWeight: 500,
              padding: '6px 0 6px 12px',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Cambiar &rsaquo;
          </button>
        </div>

        {/* Affirmation card — glass treatment */}
        {card && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,196,209,0.2))',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 24,
            padding: '40px 28px 32px',
            boxShadow: '0 4px 24px rgba(250,147,165,0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.65)',
            textAlign: 'center',
            minHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: cardAnim ? 0.3 : 1,
            transform: cardAnim
              ? `translateX(${cardAnim === 'next' ? '-20px' : '20px'})`
              : 'none',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}>
            <div className="float" style={{ fontSize: 48, color: 'var(--pink-light)' }}>♥</div>
            <h2 className="font-display" style={{
              fontSize: 24,
              color: 'var(--text)',
              lineHeight: 1.4,
              marginTop: 20,
              marginBottom: 16,
            }}>
              {card.affirmation}
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 17,
              color: 'var(--pink-dark)',
              fontStyle: 'italic',
              fontWeight: 500,
              lineHeight: 1.55,
              letterSpacing: 0.2,
              maxWidth: 300,
              marginBottom: 24,
              padding: '0 8px',
            }}>
              {card.verse}
            </p>

            {/* Favorite button */}
            <button
              onClick={() => toggleFavorite(card.id)}
              style={{
                background: favorites.includes(card.id)
                  ? 'var(--bg-soft)'
                  : 'transparent',
                border: `1.5px solid ${favorites.includes(card.id) ? 'var(--pink)' : 'var(--border)'}`,
                borderRadius: 20,
                padding: '8px 18px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                color: favorites.includes(card.id) ? 'var(--rose)' : 'var(--text-light)',
                transition: 'all 0.2s ease',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {favorites.includes(card.id) ? 'Favorita' : 'Guardar como favorita'}{' '}
              {favorites.includes(card.id) ? '✓' : '💕'}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
          padding: '0 20px',
        }}>
          <button
            onClick={() => go('prev')}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'white',
              border: '1px solid var(--border)',
              cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow)',
            }}
          >
            ‹
          </button>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {pool.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === idx ? 18 : 6,
                  height: 6,
                  borderRadius: i === idx ? 3 : '50%',
                  background: i === idx ? 'var(--pink)' : 'var(--border)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          <button
            onClick={() => go('next')}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'white',
              border: '1px solid var(--border)',
              cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow)',
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(80px + var(--safe-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--text)',
          color: 'white',
          fontSize: 14,
          fontWeight: 500,
          padding: '10px 22px',
          borderRadius: 20,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(63,42,51,0.35)',
          animation: 'fadeIn 0.2s ease',
          zIndex: 999,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
