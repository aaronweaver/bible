import React from 'react';
import type { Theme } from '../theme';
import { Icon } from '../icons';

export function ProgressRing({ pct, accent, t }: { pct: number; accent: string; t: Theme }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 56, height: 56 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke={t.rule} strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={accent} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          transform="rotate(-90 28 28)" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', font: `400 14px ${t.fontDisplay}`, color: t.ink,
      }}>{pct}%</div>
    </div>
  );
}

export function Tile({ t, label, value, unit, icon, tone }: {
  t: Theme; label: string; value: string | number; unit?: string; icon: string; tone?: string;
}) {
  const c = tone || t.ink;
  return (
    <div style={{
      background: t.paper, border: `0.5px solid ${t.paperEdge}`,
      borderRadius: 16, padding: '14px 14px 12px',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 9, background: `${c}18`, color: c,
      }}>
        <Icon name={icon} size={16} filled />
      </div>
      <div style={{ font: `500 28px/1 ${t.fontDisplay}`, color: t.ink, marginTop: 10, letterSpacing: -0.4 }}>
        {value}{' '}
        <span style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, fontWeight: 400 }}>{unit}</span>
      </div>
      <div style={{ font: `12px ${t.fontUi}`, color: t.inkMute, marginTop: 4, letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

export function Stat({ t, v, l, tone }: { t: Theme; v: string | number; l: string; tone?: string }) {
  const c = tone || t.ink;
  return (
    <div style={{
      background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: 14,
      padding: '14px 10px 12px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c }} />
      <div style={{ font: `600 26px/1 ${t.fontDisplay}`, color: c, letterSpacing: -0.5 }}>{v}</div>
      <div style={{
        font: `11px ${t.fontUi}`, color: t.inkMute, marginTop: 4, letterSpacing: 0.4,
        textTransform: 'uppercase', fontWeight: 600,
      }}>{l}</div>
    </div>
  );
}
