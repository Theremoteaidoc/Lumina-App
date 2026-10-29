import { useState } from 'react';
import { getProfile } from '../utils/profile';
import { FACE_DATA, COLORIMETRIA_RESULTS, SKIN_RESULTS, AFFIRMATION_CARDS } from '../data/appData';
import { getPlan, getEffectiveStreak, ACHIEVEMENTS, getAchievementStatus, TIER_EMOJI } from '../utils/plan';
import { getCardGradient } from '../utils/cardGradient';
import { generarRetrato } from '../utils/retratoCanvas';

const FAVORITES_KEY = 'lumina_favorite_affirmations';

const SUBTONE_LABELS = {
  frio: 'Subtono Frío',
  calido: 'Subtono Cálido',
  neutro: 'Subtono Neutro',
};

// Mirrors SkinTestScreen.jsx PREFERENCE_LABELS
const PREFERENCE_LABELS = {
  natural: '🌿 Naturales',
  pharmacy: '💊 Dermo-cosméticos',
  k_beauty: '✨ K-beauty',
  cruelty_free: '🐰 Cruelty-free',
  vegan: '🌱 Veganos',
  potent: '⚗️ Activos potentes',
  minimal: '🌸 Minimalistas',
  affordable: '💰 Económicos',
  derm_approved: '👩‍⚕️ Recomendados por derma',
  fragrance: '🌺 Fragancias',
  alcohol: '🍷 Alcohol',
  parabens_sulfates: '🧪 Parabenos / sulfatos',
  animal_tested: '🐭 Testeo animal',
  harsh_chemicals: '⚠️ Químicos agresivos',
  oily_texture: '💧 Texturas aceitosas',
  strong_actives: '🔬 Activos fuertes',
  synthetic: '🧬 Sintéticos',
};

function loadFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('es', { day: 'numeric', month: 'long' });
  } catch {
    return null;
  }
}

// ─── Test card (shared shell for the 3 test summaries) ─────────────────────
function TestCard({ index, total, onTap, children }) {
  return (
    <button
      className="card-hover"
      onClick={onTap}
      style={{
        width: '100%',
        background: getCardGradient(index, total),
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '16px 18px',
        marginBottom: 12,
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: 'var(--shadow)',
        display: 'block',
      }}
    >
      {children}
    </button>
  );
}

function EmptyTestCard({ emoji, label, index, total, onTap }) {
  return (
    <TestCard index={index} total={total} onTap={onTap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 26, opacity: 0.5 }}>{emoji}</span>
          <span className="font-display" style={{ fontSize: 17, color: 'var(--text)' }}>{label}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rose)', flexShrink: 0 }}>
          Descúbrelo →
        </span>
      </div>
    </TestCard>
  );
}

function DateLine({ text }) {
  if (!text) return null;
  return (
    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
      Hecho el {text}
    </p>
  );
}

// ─── Retrato preview modal ──────────────────────────────────────────────────

function RetratoModal({ dataUrl, onShare, onSave, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 24, padding: 20,
          width: '100%', maxWidth: 380,
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--bg-soft)', border: 'none', cursor: 'pointer',
            fontSize: 16, color: 'var(--text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>

        <h3 className="font-display" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 14, textAlign: 'center' }}>
          Tu Retrato Lumina
        </h3>

        <img
          src={dataUrl}
          alt="Tu retrato Lumina"
          style={{
            display: 'block', margin: '0 auto 18px',
            maxHeight: '60vh', maxWidth: '100%',
            borderRadius: 16, boxShadow: '0 6px 24px rgba(130,98,110,0.25)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onShare}
            style={{
              background: 'linear-gradient(135deg, var(--pink-light) 0%, var(--pink) 100%)',
              border: 'none', borderRadius: 14, padding: '14px',
              color: 'white', fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
              minHeight: 44,
            }}
          >
            📤 Compartir
          </button>
          <button
            onClick={onSave}
            style={{
              background: 'white', border: '1.5px solid var(--border)', borderRadius: 14,
              padding: '14px', color: 'var(--text)', fontSize: 14.5, fontWeight: 500,
              cursor: 'pointer', minHeight: 44,
            }}
          >
            💾 Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function ResultsScreen({ onBack, onNavigate }) {
  const [profile] = useState(() => getProfile() || {});
  const [plan] = useState(() => getPlan());
  const [toast, setToast] = useState('');
  const [retratoLoading, setRetratoLoading] = useState(false);
  const [retratoUrl, setRetratoUrl] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleCompartirRetrato = async () => {
    const hasAnyResult = !!(profile.faceShape || profile.colorSubtono || profile.skinType);
    if (!hasAnyResult) {
      showToast('Haz al menos un test para crear tu retrato ✨');
      return;
    }
    setRetratoLoading(true);
    setToast('Creando tu retrato... ✨');
    try {
      const dataUrl = await generarRetrato(profile);
      setRetratoUrl(dataUrl);
    } catch {
      showToast('No se pudo crear el retrato');
    } finally {
      setRetratoLoading(false);
      setToast('');
    }
  };

  const handleDownloadRetrato = () => {
    if (!retratoUrl) return;
    const a = document.createElement('a');
    a.href = retratoUrl;
    a.download = 'mi-retrato-lumina.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareRetrato = async () => {
    if (!retratoUrl) return;
    try {
      const res = await fetch(retratoUrl);
      const blob = await res.blob();
      const file = new File([blob], 'mi-retrato-lumina.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi Retrato Lumina',
          text: 'Mi retrato de belleza con Lumina 🌸',
        });
      } else {
        handleDownloadRetrato();
        showToast('Imagen guardada — compártela desde tu galería 🌸');
      }
    } catch {
      // La usuaria canceló el share nativo — no mostramos error.
    }
  };

  const initials = profile.name?.trim()?.[0]?.toUpperCase() || null;

  // ── Header summary line ──
  const summaryParts = [];
  if (profile.faceShape && FACE_DATA[profile.faceShape]) {
    summaryParts.push(FACE_DATA[profile.faceShape].title);
  }
  if (profile.colorSubtono && SUBTONE_LABELS[profile.colorSubtono]) {
    summaryParts.push(SUBTONE_LABELS[profile.colorSubtono]);
  }
  if (profile.skinType && SKIN_RESULTS[profile.skinType]) {
    summaryParts.push(SKIN_RESULTS[profile.skinType].title);
  }
  const summaryLine = summaryParts.length
    ? summaryParts.join(' · ')
    : 'Empieza a descubrirte con los tests ✨';

  // ── Achievements with tier > 0 ──
  const earnedAchievements = ACHIEVEMENTS
    .map((ach) => ({ ach, status: getAchievementStatus(ach, plan) }))
    .filter(({ status }) => status.tier > 0);

  // ── Favorite affirmations ──
  const favoriteIds = loadFavoriteIds();
  const favoriteCards = favoriteIds
    .map((id) => AFFIRMATION_CARDS.find((c) => c.id === id))
    .filter(Boolean);
  const visibleFavorites = favoriteCards.slice(0, 5);
  const extraFavorites = favoriteCards.length - visibleFavorites.length;

  const streak = getEffectiveStreak(plan);
  const totalDays = (plan.completedDays || []).length;
  const totalMissions = plan.totalCompletions || 0;
  const pathEmpty = streak === 0 && totalDays === 0 && totalMissions === 0;

  const faceScanDate = formatDate(profile.faceScanAt);
  const colorTestDate = formatDate(profile.colorTestAt);
  const skinTestDate = formatDate(profile.skinTestAt);

  const colorInfo = profile.colorSubtono ? COLORIMETRIA_RESULTS[profile.colorSubtono] : null;
  const skinInfo = profile.skinType ? SKIN_RESULTS[profile.skinType] : null;
  const faceInfo = profile.faceShape ? FACE_DATA[profile.faceShape] : null;

  const skinLikes = (profile.skinPreferences?.likes || []).slice(0, 3);

  return (
    <div className="slide-in" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: 'var(--text)', padding: '4px 8px 4px 0',
            minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center',
          }}
        >
          ←
        </button>
        <h1 className="font-display" style={{ fontSize: 24, color: 'var(--text)' }}>
          Mis Resultados
        </h1>
      </div>

      <div style={{ padding: '4px 20px 60px' }}>

        {/* ── Section 1: Hero card ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,196,209,0.25))',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: 24,
          padding: '28px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(250,147,165,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
          marginBottom: 28,
        }}>
          <div style={{
            width: 84, height: 84, borderRadius: '50%', margin: '0 auto 14px',
            background: profile.avatar ? 'none' : 'linear-gradient(135deg, var(--pink-light) 0%, var(--pink) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(130,98,110,0.25)', overflow: 'hidden',
          }}>
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Tu foto de perfil"
                style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
              />
            ) : initials ? (
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 36, fontWeight: 600, color: 'white', lineHeight: 1,
              }}>
                {initials}
              </span>
            ) : (
              <span style={{ fontSize: 36, lineHeight: 1 }}>🌸</span>
            )}
          </div>
          <h2 className="font-display" style={{ fontSize: 26, color: 'var(--text)', marginBottom: 8 }}>
            {profile.name?.trim() || 'Tu Retrato Lumina'}
          </h2>
          <p style={{
            fontSize: 13.5, color: 'var(--rose)', fontWeight: 500,
            lineHeight: 1.5, padding: '0 6px',
          }}>
            {summaryLine}
          </p>
        </div>

        {/* ── Section 2: Tus Tests ── */}
        <h3 className="font-display" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 12 }}>
          Tus Tests
        </h3>

        {/* Análisis Facial */}
        {faceInfo ? (
          <TestCard index={0} total={3} onTap={() => onNavigate('tests', 'facial')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 30 }}>{faceInfo.emoji}</span>
              <div style={{ flex: 1 }}>
                <p className="font-display" style={{ fontSize: 17, color: 'var(--text)' }}>
                  {faceInfo.title}
                </p>
                <DateLine text={faceScanDate} />
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
            </div>
          </TestCard>
        ) : (
          <EmptyTestCard
            emoji="📸" label="Análisis Facial"
            index={0} total={3}
            onTap={() => onNavigate('tests', 'facial')}
          />
        )}

        {/* Colorimetría */}
        {colorInfo ? (
          <TestCard index={1} total={3} onTap={() => onNavigate('tests', 'colorimetria')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 30 }}>🎨</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="font-display" style={{ fontSize: 17, color: 'var(--text)' }}>
                  {SUBTONE_LABELS[profile.colorSubtono]}
                  {profile.colorCode ? ` · ${profile.colorCode}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {colorInfo.colors.slice(0, 5).map((c) => (
                    <div key={c.hex} title={c.name} style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: c.hex, border: '2px solid white',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)', flexShrink: 0,
                    }} />
                  ))}
                </div>
                <DateLine text={colorTestDate} />
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
            </div>
          </TestCard>
        ) : (
          <EmptyTestCard
            emoji="🎨" label="Colorimetría"
            index={1} total={3}
            onTap={() => onNavigate('tests', 'colorimetria')}
          />
        )}

        {/* Tipo de Piel */}
        {skinInfo ? (
          <TestCard index={2} total={3} onTap={() => onNavigate('tests', 'skintest')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 30 }}>{skinInfo.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="font-display" style={{ fontSize: 17, color: 'var(--text)' }}>
                  {skinInfo.title}
                </p>
                {skinLikes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                    {skinLikes.map((pref) => (
                      <span key={pref} style={{
                        fontSize: 10.5, color: 'var(--rose)', background: 'rgba(255,255,255,0.55)',
                        border: '1px solid var(--border)', borderRadius: 20,
                        padding: '3px 9px', whiteSpace: 'nowrap',
                      }}>
                        {PREFERENCE_LABELS[pref] || pref}
                      </span>
                    ))}
                  </div>
                )}
                <DateLine text={skinTestDate} />
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
            </div>
          </TestCard>
        ) : (
          <EmptyTestCard
            emoji="💧" label="Tipo de Piel"
            index={2} total={3}
            onTap={() => onNavigate('tests', 'skintest')}
          />
        )}

        {/* ── Section 3: Tu Camino ── */}
        <h3 className="font-display" style={{ fontSize: 20, color: 'var(--text)', margin: '24px 0 12px' }}>
          Tu Camino
        </h3>
        <div style={{
          background: 'var(--gradient-card)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: '20px',
          boxShadow: 'var(--shadow)',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--rose)' }}>
                {streak} 🔥
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                Racha actual
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--rose)' }}>
                {plan.longestStreak || 0}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                Racha máxima
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--rose)' }}>
                {totalDays}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                Días activos
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--rose)' }}>
                {totalMissions}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                Misiones
              </p>
            </div>
          </div>

          {earnedAchievements.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {earnedAchievements.map(({ ach, status }) => (
                <span key={ach.id} style={{
                  fontSize: 12, color: 'var(--text)', background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.7)', borderRadius: 20,
                  padding: '6px 12px', fontWeight: 500,
                }}>
                  {ach.emoji} {ach.label} {TIER_EMOJI[status.tier]}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center' }}>
              Completa misiones en tu Plan para ganar logros ✨
            </p>
          )}

          {pathEmpty && (
            <button
              onClick={() => onNavigate('plan')}
              style={{
                marginTop: 16, width: '100%',
                background: 'linear-gradient(135deg, var(--pink-light) 0%, var(--pink) 100%)',
                border: 'none', borderRadius: 14, padding: '13px',
                color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Empieza tu Plan de hoy
            </button>
          )}
        </div>

        {/* ── Section 4: Tus Favoritas ── */}
        <h3 className="font-display" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 12 }}>
          Tus Afirmaciones Favoritas
        </h3>

        {visibleFavorites.length > 0 ? (
          <div style={{ marginBottom: 28 }}>
            {visibleFavorites.map((card, i) => (
              <div key={card.id} style={{
                background: getCardGradient(i, visibleFavorites.length),
                border: '1px solid var(--border)', borderRadius: 16,
                padding: '16px 18px', marginBottom: 10,
              }}>
                <p className="font-display" style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.4 }}>
                  {card.affirmation}
                </p>
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 13, color: 'var(--pink-dark)', fontStyle: 'italic',
                  marginTop: 8, lineHeight: 1.5,
                }}>
                  {card.verse}
                </p>
              </div>
            ))}
            {extraFavorites > 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                y {extraFavorites} más...
              </p>
            )}
          </div>
        ) : (
          <div style={{
            background: 'var(--gradient-card)', border: '1px solid var(--border)',
            borderRadius: 18, padding: '22px 20px', textAlign: 'center', marginBottom: 28,
          }}>
            <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, marginBottom: 14 }}>
              Aún no has guardado afirmaciones. Encuéntralas en Bienestar 💕
            </p>
            <button
              onClick={() => onNavigate('wellness')}
              style={{
                background: 'white', border: '1.5px solid var(--pink)', borderRadius: 20,
                padding: '10px 20px', fontSize: 13.5, fontWeight: 600, color: 'var(--rose)',
                cursor: 'pointer', minHeight: 44,
              }}
            >
              Ir a Bienestar
            </button>
          </div>
        )}

        {/* ── Section 5: Acciones ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => onNavigate('more', 'profile')}
            style={{
              background: 'linear-gradient(135deg, var(--pink-light) 0%, var(--pink) 100%)',
              border: 'none', borderRadius: 14, padding: '14px',
              color: 'white', fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
              minHeight: 44,
            }}
          >
            ✏️ Editar mi perfil
          </button>
          <button
            onClick={handleCompartirRetrato}
            disabled={retratoLoading}
            style={{
              background: 'white', border: '1.5px solid var(--border)', borderRadius: 14,
              padding: '14px', color: 'var(--text)', fontSize: 14.5, fontWeight: 500,
              cursor: retratoLoading ? 'default' : 'pointer', minHeight: 44,
              opacity: retratoLoading ? 0.7 : 1,
            }}
          >
            {retratoLoading ? 'Creando tu retrato... ✨' : '📤 Compartir mi retrato'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div style={{
          position: 'fixed',
          bottom: 'max(40px, calc(24px + env(safe-area-inset-bottom)))',
          left: '50%', transform: 'translateX(-50%)',
          background: 'var(--rose)', color: 'white',
          padding: '10px 20px', borderRadius: 20,
          fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(130,98,110,0.35)',
          zIndex: 300, animation: 'fadeIn 0.2s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      ) : null}

      {retratoUrl ? (
        <RetratoModal
          dataUrl={retratoUrl}
          onShare={handleShareRetrato}
          onSave={handleDownloadRetrato}
          onClose={() => setRetratoUrl(null)}
        />
      ) : null}
    </div>
  );
}
