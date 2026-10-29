import { getProfile } from '../utils/profile';
import { FACE_DATA, COLORIMETRIA_RESULTS } from '../data/appData';
import { getCardGradient } from '../utils/cardGradient';
import { hairGlossCss } from '../utils/hairSwatch';

// ═══════════════════════════════════════════════
// Tu Lookbook — visual style recommender.
// 100% local: reads profile.faceShape / profile.colorSubtono and
// cross-references FACE_DATA / COLORIMETRIA_RESULTS (already baked knowledge).
// No network, no image generation.
// ═══════════════════════════════════════════════

// ─── Hair color name → representative hex swatch ────────────────────────────
// Covers every name currently used across COLORIMETRIA_RESULTS[*].recommendations.hair
const HAIR_COLOR_HEX = {
  // frío
  'Rubio platino': '#EAE0C8',
  'Rubio cenizo': '#C9BFA6',
  'Rubio ártico': '#E8E2D6',
  'Rubio plateado': '#D8D2C4',
  'Castaño cenizo': '#6B5847',
  'Espresso frío': '#3B2A22',
  'Chocolate frío': '#4A3528',
  'Negro azulado': '#1C1B22',
  'Borgoña': '#5C1A2E',
  'Caoba ciruela': '#5A2E3E',
  'Cereza profundo': '#6B1E2E',
  // cálido
  'Rubio dorado': '#D9A441',
  'Rubio miel': '#C68A3B',
  'Rubio caramelo': '#B87333',
  'Rubio mantequilla': '#E8C979',
  'Chocolate cálido': '#6B4226',
  'Caramelo': '#A9682F',
  'Mocha cálido': '#5C3A28',
  'Castaño cobrizo': '#8B4A2B',
  'Pelirrojo natural': '#B5541F',
  'Cobrizo': '#B5651D',
  'Auburn': '#8B3A2E',
  'Paprika': '#9C4222',
  // neutro
  'Rubio beige': '#D8C4A0',
  'Rubio sandy': '#CBA679',
  'Rubio neutro': '#D3BA92',
  'Rubio nude': '#DCC5A3',
  'Castaño medio': '#6F4E37',
  'Balayage equilibrado': '#8A6A4A',
  'Chocolate neutro': '#5A4030',
  'Rojo borgoña': '#6B1E2E',
  'Vino balanceado': '#5E2233',
};

// Fallback hex per group, used only if a name isn't in the map above.
const GROUP_FALLBACK_HEX = {
  blonde: '#D9BE8F',
  brown: '#6B4E3D',
  red: '#A94B2A',
};

function hairHex(name, group) {
  return HAIR_COLOR_HEX[name] || GROUP_FALLBACK_HEX[group];
}

const HAIR_GROUPS = [
  { key: 'blonde', label: 'Rubios', emoji: '🌾' },
  { key: 'brown', label: 'Castaños', emoji: '☕' },
  { key: 'red', label: 'Pelirrojos', emoji: '🔥' },
];

const SUBTONE_LABEL = { frio: 'frío', calido: 'cálido', neutro: 'neutro' };

// ─── Small building blocks ───────────────────────────────────────────────────

function SectionTitle({ emoji, children }) {
  return (
    <h3 className="font-display" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
      {emoji} {children}
    </h3>
  );
}

function HeroLine({ children }) {
  return (
    <p style={{ fontSize: 13.5, color: 'var(--text-light)', lineHeight: 1.5, marginBottom: 16 }}>
      {children}
    </p>
  );
}

// Glossy "hair strand" swatch — a tall rounded bar with a silky vertical
// gradient (light at top, base hex in the middle, deeper at the bottom) plus
// a soft diagonal shine, so it reads like a lock of hair rather than a paint chip.
function SwatchCard({ hex, name }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        className="card-hover"
        style={{
          width: 64, height: 88, borderRadius: '32px 32px 14px 14px',
          margin: '0 auto 8px',
          ...hairGlossCss(hex),
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 4px 14px rgba(130,98,110,0.22), inset 0 1px 0 rgba(255,255,255,0.5)',
        }}
      />
      <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 }}>
        {name}
      </span>
    </div>
  );
}

// Elegant text-only card for a haircut recommendation — no illustration,
// just font-display typography carrying the idea.
function HaircutCard({ text, index, total }) {
  const isAvoid = /^evitar/i.test(text.trim());

  if (isAvoid) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.5)',
        border: '1px dashed var(--border)',
        borderRadius: 16,
        padding: '14px 16px',
        opacity: 0.75,
      }}>
        <span style={{
          fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)',
          letterSpacing: 0.5, textTransform: 'uppercase',
        }}>A evitar</span>
        <p className="font-display" style={{ fontSize: 16, color: 'var(--text-light)', lineHeight: 1.4, marginTop: 4 }}>
          {text.replace(/^evitar\s*/i, '')}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: getCardGradient(index, total),
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '16px 18px',
      boxShadow: 'var(--shadow)',
    }}>
      <p className="font-display" style={{ fontSize: 18, color: 'var(--text)', lineHeight: 1.35 }}>
        {text}
      </p>
    </div>
  );
}

// Featured CTA — jumps to the free-form collage/moodboard editor.
function CollageCTA({ onTap }) {
  return (
    <button
      onClick={onTap}
      className="card-hover"
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,196,209,0.3))',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.6)',
        borderRadius: 20,
        padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', textAlign: 'left',
        boxShadow: '0 4px 20px rgba(250,147,165,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
        marginBottom: 24, minHeight: 44,
      }}
    >
      <span style={{ fontSize: 30, flexShrink: 0 }}>🎨</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-display" style={{ fontSize: 18, color: 'var(--text)', lineHeight: 1.2, marginBottom: 2 }}>
          Crea tu Tablero de Looks
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--text-light)', lineHeight: 1.4 }}>
          Arma tu propio moodboard con fotos, texto y tus colores favoritos.
        </p>
      </div>
      <span style={{ fontSize: 18, color: 'var(--rose)', fontWeight: 600, flexShrink: 0 }}>›</span>
    </button>
  );
}

function EmptyState({ onNavigate }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,196,209,0.25))',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.6)',
      borderRadius: 24,
      padding: '32px 24px',
      textAlign: 'center',
      boxShadow: '0 4px 24px rgba(250,147,165,0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
    }}>
      <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>💇‍♀️</span>
      <h2 className="font-display" style={{ fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>
        Para armar tu lookbook necesito conocerte primero ✨
      </h2>
      <p style={{ fontSize: 13.5, color: 'var(--text-light)', lineHeight: 1.5, marginBottom: 22 }}>
        Haz el Análisis Facial y la Colorimetría para descubrir los cortes y tonos que más te favorecen.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => onNavigate('tests', 'facial')}
          style={{
            background: 'linear-gradient(135deg, var(--pink-light) 0%, var(--pink) 100%)',
            border: 'none', borderRadius: 14, padding: '14px',
            color: 'white', fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
            minHeight: 44,
          }}
        >
          📸 Hacer Análisis Facial
        </button>
        <button
          onClick={() => onNavigate('tests', 'colorimetria')}
          style={{
            background: 'white', border: '1.5px solid var(--border)', borderRadius: 14,
            padding: '14px', color: 'var(--text)', fontSize: 14.5, fontWeight: 500,
            cursor: 'pointer', minHeight: 44,
          }}
        >
          🎨 Hacer Colorimetría
        </button>
      </div>
    </div>
  );
}

function CompleteMeCTA({ label, onTap }) {
  return (
    <button
      onClick={onTap}
      className="card-hover"
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.5)',
        border: '1px dashed var(--border)',
        borderRadius: 16, padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', marginBottom: 28,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rose)' }}>Descúbrelo →</span>
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function LookbookScreen({ onBack, onNavigate }) {
  const profile = getProfile() || {};
  const faceShape = profile.faceShape;
  const colorSubtono = profile.colorSubtono;

  const faceInfo = faceShape ? FACE_DATA[faceShape] : null;
  const colorInfo = colorSubtono ? COLORIMETRIA_RESULTS[colorSubtono] : null;
  const hairRec = colorInfo?.recommendations?.hair;

  const hasNothing = !faceInfo && !colorInfo;

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
          Tu Lookbook
        </h1>
      </div>

      <div style={{ padding: '4px 20px 60px' }}>
        <CollageCTA onTap={() => onNavigate('home', 'collage')} />

        {hasNothing && <EmptyState onNavigate={onNavigate} />}

        {/* ── Colores para ti ── */}
        {colorInfo && hairRec && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitle emoji="🎨">Colores para ti</SectionTitle>
            <HeroLine>
              Según tu subtono {SUBTONE_LABEL[colorSubtono] || colorSubtono}, estos tonos te iluminan.
            </HeroLine>

            {HAIR_GROUPS.map((group) => {
              const names = hairRec[group.key];
              if (!names || names.length === 0) return null;
              return (
                <div key={group.key} style={{ marginBottom: 16 }}>
                  <p style={{
                    fontSize: 12.5, fontWeight: 600, color: 'var(--rose)',
                    marginBottom: 8, letterSpacing: 0.2,
                  }}>
                    {group.emoji} {group.label}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                    {names.map((name) => (
                      <SwatchCard
                        key={name}
                        hex={hairHex(name, group.key)}
                        name={name}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {hairRec.avoid && (
              <p style={{
                fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
                background: 'rgba(255,255,255,0.5)', border: '1px dashed var(--border)',
                borderRadius: 14, padding: '10px 14px', marginTop: 6,
              }}>
                ⚠️ {hairRec.avoid}
              </p>
            )}
          </div>
        )}

        {!colorInfo && faceInfo && (
          <CompleteMeCTA
            label="Aún no tienes tu Colorimetría — descubre tus tonos de cabello ideales."
            onTap={() => onNavigate('tests', 'colorimetria')}
          />
        )}

        {/* ── Cortes para ti ── */}
        {faceInfo && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle emoji="✂️">Cortes para ti</SectionTitle>
            <HeroLine>
              Con tu rostro {faceInfo.title.replace(/^Rostro\s+/i, '')}, estos cortes te favorecen.
            </HeroLine>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {faceInfo.haircuts.map((cut, i) => (
                <HaircutCard key={cut} text={cut} index={i} total={faceInfo.haircuts.length} />
              ))}
            </div>
          </div>
        )}

        {!faceInfo && colorInfo && (
          <CompleteMeCTA
            label="Aún no tienes tu Análisis Facial — descubre los cortes ideales para tu rostro."
            onTap={() => onNavigate('tests', 'facial')}
          />
        )}

        {/* ── Escotes y accesorios ── */}
        {faceInfo && faceInfo.necklines && faceInfo.necklines.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle emoji="✨">Escotes y accesorios</SectionTitle>
            <HeroLine>Estos escotes acompañan mejor la línea de tu rostro.</HeroLine>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {faceInfo.necklines.map((n) => {
                const isAvoid = /^evitar/i.test(n.trim());
                return (
                  <span key={n} style={{
                    fontSize: 12.5, fontWeight: 500,
                    color: isAvoid ? 'var(--text-muted)' : 'var(--rose)',
                    background: isAvoid ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.65)',
                    border: isAvoid ? '1px dashed var(--border)' : '1px solid var(--border)',
                    borderRadius: 20, padding: '7px 14px',
                    opacity: isAvoid ? 0.8 : 1,
                  }}>
                    {isAvoid ? `🚫 ${n.replace(/^evitar\s*/i, '')}` : n}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Cierre ── */}
        {!hasNothing && (
          <p style={{
            fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
            textAlign: 'center', padding: '8px 12px 0',
          }}>
            Estas sugerencias se basan en tu forma de rostro y tu colorimetría. Son una guía — el mejor estilo es el que te haga sentir tú 🌸.
          </p>
        )}
      </div>
    </div>
  );
}
