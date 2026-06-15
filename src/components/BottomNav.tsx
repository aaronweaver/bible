import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Theme } from '../theme';
import { Icon } from '../icons';
import { LESSONS } from '../data/lessons';
import { useAppState, HIGHLIGHT_COLORS, type HighlightColor } from '../hooks/useAppState';
import { useUiState } from '../hooks/useUiState';
import { SermonPlayerRow } from './SermonPlayer';

export function BottomNav({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { state } = useAppState();
  const isDark = t.statusDark;
  const { immersive, bibleNav, activeSermon, verseSelection } = useUiState();

  const curLessonId = LESSONS.find((l) => !state.progress[l.id]?.completed)?.id ?? LESSONS[0].id;

  const activeId = (() => {
    if (pathname === '/' || pathname.startsWith('/today')) return 'today';
    if (pathname.startsWith('/bible')) return 'bible';
    if (pathname.match(/^\/lessons\/\d/)) return 'study';
    if (pathname === '/lessons') return 'lessons';
    if (pathname.startsWith('/profile')) return 'profile';
    return '';
  })();

  const TABS = [
    { id: 'today',   label: 'Home',            icon: 'home',    path: '/' },
    { id: 'bible',   label: 'Bible',           icon: 'book',    path: '/bible' },
    { id: 'lessons', label: 'Bible Content',   icon: 'lessons', path: '/lessons' },
    { id: 'study',   label: 'My Content',      icon: 'bookmark', path: `/lessons/${curLessonId}` },
    { id: 'profile', label: 'Profile',         icon: 'profile', path: '/profile' },
  ];

  const pillBg = isDark ? 'rgba(22,22,27,0.85)' : 'rgba(255,255,255,0.92)';
  const pillBorder = `0.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`;

  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  // Hide the tab row when immersive AND on the Bible screen
  const hideTabRow = immersive && !!bibleNav;

  return (
    <div
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      {/* Single unified card — chapter bar (when on Bible) + tab nav, flush to bottom */}
      <div style={{
        background: pillBg,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: pillBorder,
        borderLeft: pillBorder,
        borderRight: pillBorder,
        borderBottom: 'none',
        borderRadius: '28px 28px 0 0',
        overflow: 'hidden',
        pointerEvents: 'auto',
        boxShadow: isDark
          ? '0 -8px 30px -10px rgba(0,0,0,0.5)'
          : '0 -8px 30px -10px rgba(0,0,0,0.1)',
      }}>
        {/* Sermon player row — sits flush on top of nav */}
        {activeSermon && (
          <SermonPlayerRow t={t} accent={accent} sermon={activeSermon} divider={divider} />
        )}

        {/* Chapter bar row — or highlight row when verses selected */}
        {bibleNav && verseSelection && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, padding: '0 12px' }}>
              {(['yellow','green','blue','pink'] as HighlightColor[]).map(c => {
                const active = verseSelection.currentColor === c;
                return (
                  <button
                    key={c}
                    aria-label={active ? `Remove ${c} highlight` : `Highlight ${c}`}
                    onClick={() => verseSelection.onPickColor(active ? null : c)}
                    style={{
                      width: 30, height: 30, borderRadius: 15,
                      background: HIGHLIGHT_COLORS[c],
                      border: active ? `2px solid ${t.ink}` : '0.5px solid rgba(0,0,0,0.1)',
                      cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {active && <Icon name="close" size={14} color={t.ink} stroke={2.4} />}
                  </button>
                );
              })}
              <div style={{ width: 1, height: 22, background: divider }} />
              <button
                aria-label="Copy verse"
                onClick={() => {
                  const txt = `${verseSelection.reference} — ${verseSelection.combinedText}`;
                  navigator.clipboard?.writeText(txt);
                }}
                style={{
                  width: 30, height: 30, borderRadius: 15,
                  background: 'transparent', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, color: t.ink,
                }}
              >
                <Icon name="copy" size={15} color={t.ink} />
              </button>
              <button
                aria-label="Share verse"
                onClick={() => {
                  const { reference, combinedText, shareUrl } = verseSelection;
                  if (navigator.share) {
                    navigator.share({ title: reference, text: `${reference} — ${combinedText}`, url: shareUrl })
                      .catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(shareUrl);
                  }
                }}
                style={{
                  width: 30, height: 30, borderRadius: 15,
                  background: 'transparent', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, color: t.ink,
                }}
              >
                <Icon name="share" size={15} color={t.ink} />
              </button>
              <div style={{ width: 1, height: 22, background: divider }} />
              <div style={{
                font: `600 12px ${t.fontUi}`, color: t.inkSoft,
                minWidth: 22, textAlign: 'center',
              }}>+{verseSelection.count}</div>
              <button
                aria-label="Close selection"
                onClick={verseSelection.onClose}
                style={{
                  width: 30, height: 30, borderRadius: 15,
                  background: 'transparent', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                  color: t.inkSoft,
                }}
              >
                <Icon name="close" size={15} color={t.inkSoft} />
              </button>
            </div>
            <div style={{ height: 0.5, background: divider, margin: '0 14px' }} />
          </>
        )}
        {bibleNav && !verseSelection && (
          <>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={bibleNav.onPrev}
                disabled={!bibleNav.canPrev}
                style={{
                  width: 56, height: 52, flexShrink: 0,
                  background: 'none', border: 'none',
                  cursor: !bibleNav.canPrev ? 'default' : 'pointer',
                  opacity: !bibleNav.canPrev ? 0.3 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="chev-l" size={20} color={t.ink} />
              </button>
              <button
                onClick={bibleNav.onPicker}
                style={{
                  flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'center', padding: '0',
                  font: `500 17px ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.2,
                  height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {bibleNav.book} {bibleNav.chapter}
              </button>
              <button
                onClick={bibleNav.onNext}
                disabled={!bibleNav.canNext}
                style={{
                  width: 56, height: 52, flexShrink: 0,
                  background: 'none', border: 'none',
                  cursor: !bibleNav.canNext ? 'default' : 'pointer',
                  opacity: !bibleNav.canNext ? 0.3 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="chev-r" size={20} color={t.ink} />
              </button>
            </div>
            <div style={{ height: 0.5, background: divider, margin: '0 14px' }} />
          </>
        )}

        {/* Tab nav row — collapses in immersive mode on Bible */}
        <div style={{
          overflow: 'hidden',
          maxHeight: hideTabRow ? 0 : 80,
          opacity: hideTabRow ? 0 : 1,
          transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
        }}>
        <div style={{
          padding: '6px 6px max(env(safe-area-inset-bottom), 8px)',
          display: 'flex', justifyContent: 'space-between', gap: 2,
        }}>
          {TABS.map((tab) => {
            const active = activeId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'bible' && activeId === 'bible') {
                    navigate('/bible', { state: { openPicker: true } });
                  } else {
                    navigate(tab.path);
                  }
                }}
                aria-label={tab.label}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 2px',
                  color: active ? accent.on : t.inkSoft,
                  transition: 'color 0.2s',
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 18,
                  background: active ? accent.c : 'transparent',
                  transition: 'background 0.2s',
                }}>
                  <Icon name={tab.icon} size={20} filled={active} stroke={active ? 1.9 : 1.7} />
                </span>
              </button>
            );
          })}
        </div>
        </div> {/* end collapse wrapper */}
      </div>
    </div>
  );
}
