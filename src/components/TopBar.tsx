import React from 'react';
import type { Theme } from '../theme';
import { Icon } from '../icons';

type Props = {
  t: Theme;
  eyebrow?: string;
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function TopBar({ t, eyebrow, title, onBack, right }: Props) {
  return (
    <div className="safe-top" style={{ padding: '14px 22px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 }}>
        {onBack ? (
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
            color: t.inkSoft, font: `15px ${t.fontUi}`, padding: 0, cursor: 'pointer',
          }}>
            <Icon name="chev-l" size={18} /> Back
          </button>
        ) : (
          <div style={{
            font: `12px/1 ${t.fontUi}`, letterSpacing: 1.5, textTransform: 'uppercase',
            color: t.inkMute, fontWeight: 600, whiteSpace: 'nowrap',
          }}>{eyebrow}</div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>{right}</div>
      </div>
      {title && (
        <h1 style={{
          margin: '4px 0 0', font: `400 34px/1.05 ${t.fontDisplay}`,
          letterSpacing: -0.5, color: t.ink,
        }}>{title}</h1>
      )}
    </div>
  );
}

export function CircleBtn({ t, children, onClick, title }: { t: Theme; children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 36, height: 36, borderRadius: 18,
      background: t.chip, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: t.ink,
    }}>{children}</button>
  );
}

export function DarkToggle({ t, darkMode, onToggle }: { t: Theme; darkMode: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 36, height: 36, borderRadius: 18,
      background: t.chip, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: t.ink,
    }} title={darkMode ? 'Switch to light' : 'Switch to dark'}>
      <Icon name={darkMode ? 'sun' : 'moon'} size={18} filled={!darkMode} />
    </button>
  );
}

export function SectionHeader({ t, title }: { t: Theme; title: string }) {
  return (
    <div style={{
      padding: '24px 22px 10px', font: `12px ${t.fontUi}`, letterSpacing: 1.5,
      textTransform: 'uppercase', color: t.inkMute, fontWeight: 600,
    }}>{title}</div>
  );
}
