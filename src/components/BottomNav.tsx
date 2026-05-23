import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Theme } from '../theme';
import { Icon } from '../icons';
import { LESSONS } from '../data/lessons';
import { useAppState } from '../hooks/useAppState';

export function BottomNav({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { state } = useAppState();
  const isDark = t.statusDark;

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

  return (
    <div
      className="safe-bot"
      style={{
        position: 'fixed', left: 14, right: 14, bottom: 0,
        paddingBottom: 22,
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        background: isDark ? 'rgba(22,22,27,0.85)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        borderRadius: 28,
        padding: 6,
        display: 'flex', justifyContent: 'space-between', gap: 2,
        pointerEvents: 'auto',
        boxShadow: isDark
          ? '0 20px 40px -20px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04)'
          : '0 20px 40px -20px rgba(0,0,0,0.25), 0 2px 8px -4px rgba(0,0,0,0.08)',
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
    </div>
  );
}
