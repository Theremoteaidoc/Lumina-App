import { useState, useRef } from 'react';
import { getProfile, updateProfile, clearProfile } from '../utils/profile';
import { getCardGradient } from '../utils/cardGradient';
import Icon from './Icon';

// ─── Avatar photo helpers ───────────────────────────────────────────────────

// Reads a File, crops it to a centered square, downsizes to `size`x`size`,
// and returns a compressed JPEG dataURL — small enough to live in localStorage.
function compressAvatarFile(file, size = 256, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const { naturalWidth: iw, naturalHeight: ih } = img;
        const side = Math.min(iw, ih);
        const sx = (iw - side) / 2;
        const sy = (ih - side) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

// ─── Reference data (mirrors OnboardingFlow) ───────────────────────────────

const AGE_RANGES = ['13-15', '16-18', '19-25', '26-35', '35+'];

const GOALS = [
  { value: 'skincare', emoji: '💧', label: 'Cuidar mi piel' },
  { value: 'colorimetry', emoji: '🎨', label: 'Encontrar mis colores' },
  { value: 'makeup', emoji: '💄', label: 'Aprender de maquillaje' },
  { value: 'selflove', emoji: '💕', label: 'Trabajar mi autoestima' },
  { value: 'face', emoji: '📸', label: 'Conocer mi rostro' },
  { value: 'explore', emoji: '✨', label: 'Solo explorar' },
];

const SKIN_TYPES = [
  { value: 'grasa', emoji: '💧', label: 'Grasa' },
  { value: 'seca', emoji: '🌵', label: 'Seca' },
  { value: 'mixta', emoji: '⚖️', label: 'Mixta' },
  { value: 'sensible', emoji: '🌸', label: 'Sensible' },
  { value: 'normal', emoji: '✨', label: 'Normal' },
  { value: 'desconocido', emoji: '🤔', label: 'No estoy segura' },
];

const CONCERNS = [
  { value: 'acne', emoji: '🔴', label: 'Acné / espinillas' },
  { value: 'dark_spots', emoji: '🌑', label: 'Manchas / hiperpigmentación' },
  { value: 'expression_lines', emoji: '〰️', label: 'Líneas de expresión' },
  { value: 'dryness', emoji: '🌬️', label: 'Resequedad / descamación' },
  { value: 'oiliness', emoji: '🌟', label: 'Brillo / poros visibles' },
  { value: 'sensitivity', emoji: '🤲', label: 'Sensibilidad / rojeces' },
  { value: 'none', emoji: '✋', label: 'Ninguna por ahora' },
];

const HAIR_COLORS = [
  { value: 'blonde', hex: '#E8C896', label: 'Rubio' },
  { value: 'light_brown', hex: '#A07856', label: 'Castaño claro' },
  { value: 'dark_brown', hex: '#5C3A21', label: 'Castaño oscuro' },
  { value: 'black', hex: '#1A0F0A', label: 'Negro' },
  { value: 'red', hex: '#A04020', label: 'Pelirrojo' },
  { value: 'other', hex: null, label: 'Otro' },
];

const EYE_COLORS = [
  { value: 'blue', hex: '#5B8DB8', label: 'Azul' },
  { value: 'green', hex: '#6B8E5A', label: 'Verde' },
  { value: 'hazel', hex: '#8B7355', label: 'Avellana' },
  { value: 'light_brown', hex: '#9C7858', label: 'Café claro' },
  { value: 'dark_brown', hex: '#4A2F1F', label: 'Café oscuro' },
  { value: 'black', hex: '#1A0F0A', label: 'Negro' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function labelFor(list, value) {
  return list.find((i) => i.value === value)?.label || value || '—';
}

function labelsFor(list, values = []) {
  if (!values.length) return '—';
  return values.map((v) => list.find((i) => i.value === v)?.label || v).join(', ');
}

function ageLabel(range) {
  return range ? `${range} años` : '—';
}

// ─── Sub-editors (inline) ──────────────────────────────────────────────────

function NameEditor({ value, onSave, onCancel }) {
  const [draft, setDraft] = useState(value || '');
  return (
    <div>
      <input
        type="text"
        value={draft}
        autoFocus
        maxLength={30}
        onChange={(e) => setDraft(e.target.value)}
        style={{
          display: 'block', width: '100%',
          background: 'var(--bg-soft)', border: '1.5px solid var(--pink)',
          borderRadius: 12, padding: '12px 14px',
          fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--text)',
          outline: 'none', marginBottom: 12,
        }}
      />
      <EditorActions onSave={() => onSave(draft.trim())} onCancel={onCancel} disabled={!draft.trim()} />
    </div>
  );
}

function SingleSelectEditor({ value, options, onSave, onCancel }) {
  const [draft, setDraft] = useState(value || '');
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDraft(opt.value)}
            style={{
              background: draft === opt.value ? 'var(--bg-soft)' : 'white',
              border: `1.5px solid ${draft === opt.value ? 'var(--pink)' : 'var(--border)'}`,
              borderRadius: 10, padding: '11px 14px',
              cursor: 'pointer', textAlign: 'left',
              fontSize: 14, color: 'var(--text)',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'all 0.15s ease',
              fontWeight: draft === opt.value ? 600 : 400,
            }}
          >
            {opt.emoji && <span>{opt.emoji}</span>}
            <span>{opt.label || opt.value}</span>
          </button>
        ))}
      </div>
      <EditorActions onSave={() => onSave(draft)} onCancel={onCancel} disabled={!draft} />
    </div>
  );
}

function AgeEditor({ value, onSave, onCancel }) {
  const opts = AGE_RANGES.map((r) => ({ value: r, label: `${r} años` }));
  return <SingleSelectEditor value={value} options={opts} onSave={onSave} onCancel={onCancel} />;
}

function MultiSelectEditor({ value = [], options, max, onSave, onCancel }) {
  const [draft, setDraft] = useState([...value]);

  const toggle = (v) => {
    if (v === 'none') {
      setDraft(draft.includes('none') ? [] : ['none']);
      return;
    }
    const withoutNone = draft.filter((x) => x !== 'none');
    if (withoutNone.includes(v)) {
      setDraft(withoutNone.filter((x) => x !== v));
    } else {
      if (max && withoutNone.length >= max) return;
      setDraft([...withoutNone, v]);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {options.map((opt) => {
          const selected = draft.includes(opt.value);
          const noneActive = draft.includes('none') && opt.value !== 'none';
          const maxed = max && draft.filter((x) => x !== 'none').length >= max && !selected;
          const disabled = noneActive || (maxed && opt.value !== 'none');
          return (
            <button
              key={opt.value}
              onClick={() => !disabled && toggle(opt.value)}
              style={{
                background: selected ? 'var(--bg-soft)' : 'white',
                border: `1.5px solid ${selected ? 'var(--pink)' : 'var(--border)'}`,
                borderRadius: 10, padding: '11px 14px',
                cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
                fontSize: 14, color: 'var(--text)',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: disabled ? 0.4 : 1,
                transition: 'all 0.15s ease',
                fontWeight: selected ? 600 : 400,
              }}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
      <EditorActions onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  );
}

function ColorSwatchEditor({ value, options, onSave, onCancel }) {
  const [draft, setDraft] = useState(value || '');
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {options.map((item) => (
          <button
            key={item.value}
            onClick={() => setDraft(item.value)}
            style={{
              background: draft === item.value ? 'var(--bg-soft)' : 'white',
              border: `1.5px solid ${draft === item.value ? 'var(--pink)' : 'var(--border)'}`,
              borderRadius: 10, padding: '10px 6px',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              transition: 'all 0.15s ease',
              minHeight: 64,
            }}
          >
            {item.hex ? (
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: item.hex, border: '2px solid rgba(0,0,0,0.1)',
              }} />
            ) : (
              <span style={{ fontSize: 20 }}>🎨</span>
            )}
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 11,
              color: 'var(--text)', textAlign: 'center', lineHeight: 1.2,
              fontWeight: draft === item.value ? 600 : 400,
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
      <EditorActions onSave={() => onSave(draft)} onCancel={onCancel} disabled={!draft} />
    </div>
  );
}

function ToggleEditor({ value, label, onSave, onCancel }) {
  const [draft, setDraft] = useState(!!value);
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 16, padding: '12px 0',
      }}>
        <span style={{ fontSize: 15, color: 'var(--text)' }}>{label}</span>
        <button
          role="switch"
          aria-checked={draft}
          onClick={() => setDraft(!draft)}
          style={{
            width: 'var(--toggle-width)', height: 'var(--toggle-height)',
            borderRadius: 999, border: 'none', cursor: 'pointer',
            background: draft ? 'var(--pink)' : 'var(--border)',
            position: 'relative', flexShrink: 0,
            transition: 'background 0.25s ease', padding: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: '50%',
            left: draft ? 'calc(100% - var(--toggle-knob) - 3px)' : '3px',
            transform: 'translateY(-50%)',
            width: 'var(--toggle-knob)', height: 'var(--toggle-knob)',
            borderRadius: '50%', background: 'white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'left 0.25s ease', display: 'block',
          }} />
        </button>
      </div>
      <EditorActions onSave={() => onSave(draft)} onCancel={onCancel} />
    </div>
  );
}

function EditorActions({ onSave, onCancel, disabled = false }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={onSave}
        disabled={disabled}
        style={{
          flex: 1, background: 'linear-gradient(135deg, var(--pink-light) 0%, var(--pink) 100%)',
          border: 'none', borderRadius: 12, padding: '12px',
          color: 'white',
          fontSize: 14, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1, transition: 'all 0.2s ease',
        }}
      >
        Guardar
      </button>
      <button
        onClick={onCancel}
        style={{
          flex: 1, background: 'white', border: '1.5px solid var(--border)',
          borderRadius: 12, padding: '12px',
          color: 'var(--text-light)',
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
        }}
      >
        Cancelar
      </button>
    </div>
  );
}

// ─── ProfileCard ───────────────────────────────────────────────────────────

function ProfileCard({ emoji, label, displayValue, editingKey, fieldKey, onEdit, children, index, total }) {
  const isEditing = editingKey === fieldKey;
  return (
    <div style={{
      background: isEditing ? 'var(--bg-card)' : getCardGradient(index, total),
      border: '1px solid var(--border)',
      borderRadius: 18, padding: '18px 18px',
      boxShadow: 'var(--shadow)', marginBottom: 12,
      transition: 'background 0.25s ease, box-shadow 0.2s ease',
    }}>
      <div
        style={{ cursor: isEditing ? 'default' : 'pointer' }}
        onClick={() => !isEditing && onEdit(fieldKey)}
      >
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11, fontWeight: 600, color: 'var(--text-light)',
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
        }}>
          {emoji} {label}
        </p>
        {!isEditing && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="font-display" style={{ fontSize: 19, color: 'var(--text)', lineHeight: 1.3 }}>
              {displayValue}
            </p>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>›</span>
          </div>
        )}
      </div>
      {isEditing && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function ProfileScreen({ onBack }) {
  const [profile, setProfile] = useState(() => getProfile() || {});
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const avatarInputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleAvatarTap = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reelegir la misma foto después
    if (!file) return;
    try {
      const dataUrl = await compressAvatarFile(file);
      const updated = { ...profile, avatar: dataUrl };
      setProfile(updated);
      updateProfile({ avatar: dataUrl });
      showToast('Foto actualizada ✨');
    } catch {
      // Si falla la lectura de la imagen, no rompemos nada — se mantiene la inicial.
      showToast('No se pudo cargar la foto');
    }
  };

  const handleRemoveAvatar = () => {
    const updated = { ...profile, avatar: null };
    setProfile(updated);
    updateProfile({ avatar: null });
    showToast('Foto quitada');
  };

  const handleSave = (field, value) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    updateProfile({ [field]: value });
    setEditing(null);
    showToast('Guardado ✨');
  };

  const handleEdit = (field) => setEditing(field);
  const handleCancel = () => setEditing(null);

  const handleReset = () => {
    const confirmed = window.confirm(
      '¿Segura que quieres restablecer el onboarding? Perderás tu perfil actual.'
    );
    if (confirmed) {
      clearProfile();
      window.location.reload();
    }
  };

  const initials = profile.name?.trim()?.[0]?.toUpperCase() || '?';

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
          Mi Perfil
        </h1>
      </div>

      <div style={{ padding: '0 20px 60px' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <input
            type="file"
            accept="image/*"
            ref={avatarInputRef}
            style={{ display: 'none' }}
            onChange={handleAvatarSelect}
          />
          <button
            onClick={handleAvatarTap}
            aria-label={profile.avatar ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
            style={{
              position: 'relative', width: 96, height: 96, borderRadius: '50%',
              background: profile.avatar ? 'none' : 'linear-gradient(135deg, var(--pink-light) 0%, var(--pink) 100%)',
              border: 'none', padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(130,98,110,0.25)',
            }}
          >
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Tu foto de perfil"
                style={{
                  width: 96, height: 96, borderRadius: '50%',
                  objectFit: 'cover', display: 'block',
                }}
              />
            ) : (
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 42, fontWeight: 600, color: 'white', lineHeight: 1,
              }}>
                {initials}
              </span>
            )}
            {/* Camera affordance */}
            <span style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 30, height: 30, borderRadius: '50%',
              background: 'white', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(130,98,110,0.25)',
            }}>
              <Icon name="camera" size={14} color="var(--rose)" />
            </span>
          </button>
          <p style={{
            fontSize: 14, color: 'var(--text-light)',
            marginTop: 12, letterSpacing: 0.2,
          }}>
            Tu espacio en Lumina
          </p>
          {profile.avatar ? (
            <button
              onClick={handleRemoveAvatar}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6,
                textDecoration: 'underline', padding: '6px 4px', minHeight: 30,
              }}
            >
              Quitar foto
            </button>
          ) : null}
        </div>

        {/* Profile fields */}
        <ProfileCard
          emoji="👤" label="Nombre"
          displayValue={profile.name || '—'}
          editingKey={editing} fieldKey="name"
          onEdit={handleEdit}
          index={0} total={8}
        >
          <NameEditor
            value={profile.name}
            onSave={(v) => handleSave('name', v)}
            onCancel={handleCancel}
          />
        </ProfileCard>

        <ProfileCard
          emoji="🎂" label="Edad"
          displayValue={ageLabel(profile.ageRange)}
          editingKey={editing} fieldKey="ageRange"
          onEdit={handleEdit}
          index={1} total={8}
        >
          <AgeEditor
            value={profile.ageRange}
            onSave={(v) => handleSave('ageRange', v)}
            onCancel={handleCancel}
          />
        </ProfileCard>

        <ProfileCard
          emoji="✨" label="Tus metas"
          displayValue={labelsFor(GOALS, profile.goals)}
          editingKey={editing} fieldKey="goals"
          onEdit={handleEdit}
          index={2} total={8}
        >
          <MultiSelectEditor
            value={profile.goals}
            options={GOALS}
            max={3}
            onSave={(v) => handleSave('goals', v)}
            onCancel={handleCancel}
          />
        </ProfileCard>

        <ProfileCard
          emoji="💧" label="Tipo de piel"
          displayValue={labelFor(SKIN_TYPES, profile.skinType)}
          editingKey={editing} fieldKey="skinType"
          onEdit={handleEdit}
          index={3} total={8}
        >
          <SingleSelectEditor
            value={profile.skinType}
            options={SKIN_TYPES}
            onSave={(v) => handleSave('skinType', v)}
            onCancel={handleCancel}
          />
        </ProfileCard>

        <ProfileCard
          emoji="🔍" label="Preocupaciones"
          displayValue={labelsFor(CONCERNS, profile.concerns)}
          editingKey={editing} fieldKey="concerns"
          onEdit={handleEdit}
          index={4} total={8}
        >
          <MultiSelectEditor
            value={profile.concerns}
            options={CONCERNS}
            onSave={(v) => handleSave('concerns', v)}
            onCancel={handleCancel}
          />
        </ProfileCard>

        <ProfileCard
          emoji="🎨" label="Color de pelo"
          displayValue={labelFor(HAIR_COLORS, profile.hairColor)}
          editingKey={editing} fieldKey="hairColor"
          onEdit={handleEdit}
          index={5} total={8}
        >
          <ColorSwatchEditor
            value={profile.hairColor}
            options={HAIR_COLORS}
            onSave={(v) => handleSave('hairColor', v)}
            onCancel={handleCancel}
          />
        </ProfileCard>

        <ProfileCard
          emoji="👁️" label="Color de ojos"
          displayValue={labelFor(EYE_COLORS, profile.eyeColor)}
          editingKey={editing} fieldKey="eyeColor"
          onEdit={handleEdit}
          index={6} total={8}
        >
          <ColorSwatchEditor
            value={profile.eyeColor}
            options={EYE_COLORS}
            onSave={(v) => handleSave('eyeColor', v)}
            onCancel={handleCancel}
          />
        </ProfileCard>

        <ProfileCard
          emoji="🔔" label="Notificaciones"
          displayValue={profile.notificationsEnabled ? 'Activadas' : 'Desactivadas'}
          editingKey={editing} fieldKey="notificationsEnabled"
          onEdit={handleEdit}
          index={7} total={8}
        >
          <ToggleEditor
            value={profile.notificationsEnabled}
            label="Recordatorios diarios de afirmación"
            onSave={(v) => handleSave('notificationsEnabled', v)}
            onCancel={handleCancel}
          />
        </ProfileCard>

        {/* Reset button */}
        <div style={{ marginTop: 28, paddingBottom: 8 }}>
          <button
            onClick={handleReset}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 14, padding: '13px 20px',
              width: '100%', cursor: 'pointer',
              fontSize: 14, color: 'var(--text-muted)',
              fontWeight: 400, transition: 'all 0.2s ease',
            }}
          >
            Restablecer onboarding
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
    </div>
  );
}
