import React from 'react';

type Props = {
  name: string;
  size?: number;
  color?: string;
  filled?: boolean;
  stroke?: number;
};

export function Icon({ name, size = 22, color = 'currentColor', filled = false, stroke = 1.6 }: Props) {
  const s: React.CSSProperties = { width: size, height: size, display: 'block' };
  const p = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'mail':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <rect x="2" y="4" width="20" height="16" rx="2" {...p} fill={filled ? color : 'none'} />
          <path d="M2 7l10 7 10-7" {...p} fill="none" />
        </svg>
      );
    case 'home':
      return (
        <svg style={s} viewBox="0 0 24 24">
          {filled
            ? <path d="M3 12L12 3l9 9v9a1 1 0 01-1 1h-5v-5h-6v5H4a1 1 0 01-1-1v-9z" {...p} fill={color} stroke="none" />
            : <><path d="M3 12L12 3l9 9v9a1 1 0 01-1 1h-5v-5h-6v5H4a1 1 0 01-1-1v-9z" {...p} fill="none" /></>}
        </svg>
      );
    case 'sun':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" {...p} fill={filled ? color : 'none'} />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" {...p} />
        </svg>
      );
    case 'book':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M2 5c0-1 .7-1.5 1.5-1.5C5 3.5 8 4.5 12 4.5s7-1 8.5-1C21.3 3.5 22 4 22 5v14c0 1-.7 1.5-1.5 1.5C19 20.5 16 19.5 12 19.5s-7 1-8.5 1C2.7 20.5 2 20 2 19V5z" {...p} fill={filled ? color : 'none'} />
          <path d="M12 4.5v15" {...p} fill="none" />
          <path d="M6 8.5c1 .3 2.5.5 4 .5M6 12c1 .3 2.5.5 4 .5M14 8.5c1-.3 2.5-.5 4-.5M14 12c1-.3 2.5-.5 4-.5" {...p} fill="none" />
        </svg>
      );
    case 'lessons':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M4 19h4v-7H4zM10 19h4V8h-4zM16 19h4V4h-4z" {...p} fill={filled ? color : 'none'} />
        </svg>
      );
    case 'profile':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <circle cx="12" cy="8.5" r="3.5" {...p} fill={filled ? color : 'none'} />
          <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" {...p} />
        </svg>
      );
    case 'check':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M4 12.5l5 5L20 6.5" {...p} />
        </svg>
      );
    case 'chev-r':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" {...p} />
        </svg>
      );
    case 'chev-l':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M15 5l-7 7 7 7" {...p} />
        </svg>
      );
    case 'chev-d':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M5 9l7 7 7-7" {...p} />
        </svg>
      );
    case 'search':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="6" {...p} />
          <path d="M16 16l4 4" {...p} />
        </svg>
      );
    case 'flame':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 11-8 0c0-1.5.5-2.5 1.5-3.5C10 9 11 7 12 3z" {...p} fill={filled ? color : 'none'} />
        </svg>
      );
    case 'bookmark':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M6 4h12v17l-6-4-6 4z" {...p} fill={filled ? color : 'none'} />
        </svg>
      );
    case 'settings':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" {...p} />
          <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 00-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 002.1 1.2L10 21h4l.5-2.6a7 7 0 002.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" {...p} />
        </svg>
      );
    case 'note':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M4 6.5C4 5.7 4.7 5 5.5 5h13c.8 0 1.5.7 1.5 1.5v11c0 .8-.7 1.5-1.5 1.5h-13c-.8 0-1.5-.7-1.5-1.5v-11zM8 10h8M8 13h8M8 16h5" {...p} />
        </svg>
      );
    case 'play':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M7 4l13 8-13 8z" {...p} fill={filled ? color : 'none'} />
        </svg>
      );
    case 'moon':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M20 14.5A8 8 0 1110 4a6.5 6.5 0 0010 10.5z" {...p} fill={filled ? color : 'none'} />
        </svg>
      );
    case 'sparkles':
      return (
        <svg style={s} viewBox="0 0 24 24">
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" {...p} fill={filled ? color : 'none'} />
        </svg>
      );
    default:
      return null;
  }
}
