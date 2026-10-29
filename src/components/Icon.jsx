// Icon.jsx — Custom SVG icon system for Lumina
// All icons: 24x24 viewBox, stroke-based, strokeWidth 1.6, rounded caps/joins

export default function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.6 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (name) {
    case 'face':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="10.5" r="1" fill={color} stroke="none" />
          <circle cx="15" cy="10.5" r="1" fill={color} stroke="none" />
          <path d="M9 14.5c.8 1.2 2 2 3 2s2.2-.8 3-2" />
        </svg>
      );

    case 'palette':
      return (
        <svg {...props}>
          <path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 1.12 5.26 2.93 7.07A10 10 0 0022 12c0-5.52-4.48-10-10-10z" />
          <circle cx="7" cy="11" r="1.5" fill={color} stroke="none" />
          <circle cx="11" cy="7.5" r="1.5" fill={color} stroke="none" />
          <circle cx="16" cy="9" r="1.5" fill={color} stroke="none" />
          <path d="M14 18c0 1.1.9 2 2 2h.5c.83 0 1.5-.67 1.5-1.5v-.5" />
        </svg>
      );

    case 'droplet':
      return (
        <svg {...props}>
          <path d="M12 3L5.5 10.5a7 7 0 1013 0L12 3z" />
        </svg>
      );

    case 'heart':
      return (
        <svg {...props}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      );

    case 'users':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2 21c0-4 3.13-7 7-7s7 3 7 7" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M20 21c0-2.76-1.64-5.13-4-6.32" />
        </svg>
      );

    case 'chat':
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );

    case 'user':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8" />
        </svg>
      );

    case 'chart':
      return (
        <svg {...props}>
          <rect x="3" y="14" width="4" height="7" rx="1" />
          <rect x="10" y="9" width="4" height="12" rx="1" />
          <rect x="17" y="4" width="4" height="17" rx="1" />
        </svg>
      );

    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );

    case 'info':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="8" strokeWidth={2.5} />
          <line x1="12" y1="12" x2="12" y2="16" />
        </svg>
      );

    case 'star':
      return (
        <svg {...props}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );

    case 'check':
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );

    case 'chevron-right':
      return (
        <svg {...props}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      );

    case 'chevron-left':
      return (
        <svg {...props}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      );

    case 'cake':
      return (
        <svg {...props}>
          <path d="M20 17H4v-5a4 4 0 014-4h8a4 4 0 014 4v5z" />
          <path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" />
          <path d="M8 8V6" />
          <path d="M12 8V5" />
          <path d="M16 8V6" />
          <path d="M8 5c0-1 .5-2 1-2s1 1 1 2" />
          <path d="M12 4c0-1 .5-2 1-2s1 1 1 2" />
          <path d="M16 5c0-1 .5-2 1-2s1 1 1 2" />
        </svg>
      );

    case 'sparkle':
      return (
        <svg {...props}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <path d="M12 8l1.5 3.5L17 13l-3.5 1.5L12 18l-1.5-3.5L7 13l3.5-1.5L12 8z" />
        </svg>
      );

    case 'eye':
      return (
        <svg {...props}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case 'hair':
      return (
        <svg {...props}>
          <path d="M4 6c2-2 4-3 8-3s6 1 8 3" />
          <path d="M5 10c1.5-3 3.5-4 7-4s5.5 1 7 4" />
          <path d="M6 15c1-3 2.5-5 6-5s5 2 6 5" />
          <path d="M8 21c.5-2 1.5-4 4-4s3.5 2 4 4" />
        </svg>
      );

    case 'bell':
      return (
        <svg {...props}>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );

    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );

    case 'flame':
      return (
        <svg {...props}>
          <path d="M8.5 14.5A4.5 4.5 0 0013 19c2.76 0 5-2.24 5-5 0-4-3.5-7-5-9-1 2.5-4.5 5.5-4.5 9.5z" />
          <path d="M10 17c0 1.66 1.34 3 3 3" />
        </svg>
      );

    case 'trophy':
      return (
        <svg {...props}>
          <path d="M6 9H3V4h18v5h-3" />
          <path d="M6 4v5a6 6 0 0012 0V4" />
          <path d="M12 15v4" />
          <path d="M8 21h8" />
          <line x1="12" y1="15" x2="12" y2="19" />
        </svg>
      );

    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );

    case 'camera':
      return (
        <svg {...props}>
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );

    case 'image':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );

    case 'back-arrow':
      return (
        <svg {...props}>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      );

    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

// ─── IconBubble — glass container wrapping an Icon ─────────────────────────

export function IconBubble({ name, size = 52, variant = 'default', iconSize, iconColor }) {
  const resolvedIconSize = iconSize || Math.round(size * 0.46);

  const containerStyles = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  if (variant === 'premium') {
    Object.assign(containerStyles, {
      background: 'linear-gradient(135deg, var(--rose), var(--pink))',
      border: '1px solid rgba(255,255,255,0.4)',
      boxShadow: '0 4px 20px rgba(130,98,110,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
    });
  } else if (variant === 'pink') {
    Object.assign(containerStyles, {
      background: 'linear-gradient(135deg, rgba(255,196,209,0.7), rgba(250,147,165,0.5))',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.55)',
      boxShadow: '0 4px 16px rgba(250,147,165,0.2), inset 0 1px 0 rgba(255,255,255,0.5)',
    });
  } else {
    // default glass
    Object.assign(containerStyles, {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,196,209,0.25))',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: '0 4px 16px rgba(250,147,165,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
    });
  }

  const resolvedIconColor = iconColor
    || (variant === 'premium' ? 'white' : 'var(--rose)');

  return (
    <div style={containerStyles}>
      <Icon name={name} size={resolvedIconSize} color={resolvedIconColor} />
    </div>
  );
}
