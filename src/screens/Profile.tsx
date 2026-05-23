import React from 'react';
import type { Theme } from '../theme';
import { TopBar, DarkToggle, SectionHeader } from '../components/TopBar';
import { Stat } from '../components/Bits';
import { Icon } from '../icons';
import { LESSONS } from '../data/lessons';
import { useAppState, useTheme } from '../hooks/useAppState';

export function Profile({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const { state } = useAppState();
  const { dark, toggleDark, fontScale, setFontScale } = useTheme();
  const completedCount = LESSONS.filter((l) => state.progress[l.id]?.completed).length;
  const reflCount = Object.values(state.progress).reduce(
    (s, l) => s + Object.values(l?.reflections || {}).filter((v) => v?.trim()).length,
    0,
  );
  const palette = t.palette;

  return (
    <div style={{ paddingBottom: 24 }}>
      <TopBar t={t} eyebrow="Your walk" title="Profile"
        right={<DarkToggle t={t} darkMode={dark} onToggle={toggleDark} />} />

      <div style={{
        margin: '6px 18px 16px', padding: '20px 18px', display: 'flex', gap: 14,
        background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28, background: accent.c, color: accent.on,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: `500 22px ${t.fontDisplay}`,
          boxShadow: `0 8px 20px -10px ${accent.c}`,
        }}>C</div>
        <div style={{ flex: 1 }}>
          <div style={{ font: `500 22px/1.1 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.3 }}>Welcome</div>
          <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 2 }}>
            New Believers Foundation Course
          </div>
        </div>
      </div>

      <div style={{ margin: '0 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Stat t={t} v={completedCount} l="Lessons" tone={palette[0]} />
        <Stat t={t} v={Object.keys(state.bibleHighlights).length} l="Chapters" tone={palette[3]} />
        <Stat t={t} v={reflCount} l="Reflections" tone={palette[2]} />
      </div>

      <SectionHeader t={t} title="Reading" />
      <div style={{
        margin: '0 18px', padding: '16px 18px',
        background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: 14,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 8, color: t.ink, font: `15px ${t.fontBody}`,
        }}>
          <span>Text size</span>
          <span style={{ color: t.inkMute, font: `13px ${t.fontUi}` }}>{fontScale}%</span>
        </div>
        <input
          type="range" min={85} max={130} step={5} value={fontScale}
          onChange={(e) => setFontScale(Number(e.target.value))}
          style={{ width: '100%', accentColor: accent.c }}
        />
      </div>

      <SectionHeader t={t} title="Settings" />
      <div style={{
        margin: '0 18px', background: t.paper, border: `0.5px solid ${t.paperEdge}`,
        borderRadius: 14, overflow: 'hidden',
      }}>
        {[
          { label: 'Reading plan', value: 'New Believers' },
          { label: 'Theme', value: dark ? 'Dark' : 'Light' },
          { label: 'About Cornerstone', value: 'v0.1' },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? `0.5px solid ${t.rule}` : 'none',
          }}>
            <div style={{ font: `15px ${t.fontBody}`, color: t.ink }}>{row.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {row.value && <span style={{ font: `13px ${t.fontBody}`, color: t.inkSoft }}>{row.value}</span>}
              <Icon name="chev-r" size={14} color={t.inkMute} />
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '24px 22px 0', textAlign: 'center',
        font: `italic 13px ${t.fontBody}`, color: t.inkMute, lineHeight: 1.5,
      }}>
        “Cornerstone” — built on Christ, the chief cornerstone.<br />
        Ephesians 2:20
      </div>
    </div>
  );
}
