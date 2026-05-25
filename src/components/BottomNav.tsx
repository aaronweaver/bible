import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Theme } from '../theme';
import { Icon } from '../icons';
import { LESSONS } from '../data/lessons';
import { useAppState } from '../hooks/useAppState';
import { useUiState } from '../hooks/useUiState';

export function BottomNav({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { state } = useAppState();
  const isDark = t.statusDark;
  const { immersive, bibleNav } = useUiState();

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
    { id: 'today',   label: 'Home',    icon: 'home',    path: '/' },
    { id: 'bible',   label: 'Bible',   icon: 'book',    path: '/bible' },
    { id: 'lessons', label: 'Lessons', icon: 'lessons', path: '/lessons' },
    { id: 'study',   label: 'Study',   icon: 'bookmark', path: `/lessons/${curLessonId}` },
    { id: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
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
        {/* Chapter bar row */}
        {bibleNav && (
          <>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={bibleNav.onPrev}
                disabled={bibleNav.chapter <= 1}
                style={{
                  width: 56, height: 52, flexShrink: 0,
                  background: 'none', border: 'none',
                  cursor: bibleNav.chapter <= 1 ? 'default' : 'pointer',
                  opacity: bibleNav.chapter <= 1 ? 0.3 : 1,
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
                disabled={bibleNav.chapter >= bibleNav.maxChapter}
                style={{
                  width: 56, height: 52, flexShrink: 0,
                  background: 'none', border: 'none',
                  cursor: bibleNav.chapter >= bibleNav.maxChapter ? 'default' : 'pointer',
                  opacity: bibleNav.chapter >= bibleNav.maxChapter ? 0.3 : 1,
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
