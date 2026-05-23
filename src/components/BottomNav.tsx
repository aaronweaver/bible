import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Theme } from '../theme';
import { Icon } from '../icons';

type Tab = { id: string; label: string; icon: string; path: string };

const TABS: Tab[] = [
  { id: 'today', label: 'Today', icon: 'sun', path: '/' },
  { id: 'bible', label: 'Bible', icon: 'book', path: '/bible' },
  { id: 'lessons', label: 'Lessons', icon: 'lessons', path: '/lessons' },
  { id: 'profile', label: 'Profile', icon: 'profile', path: '/profile' },
];

export function BottomNav({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDark = t.statusDark;

  const activeId = (() => {
    if (pathname === '/' || pathname.startsWith('/today')) return 'today';
    if (pathname.startsWith('/bible')) return 'bible';
    if (pathname.startsWith('/lessons')) return 'lessons';
    if (pathname.startsWith('/profile')) return 'profile';
    return '';
  })();

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
        display: 'flex', justifyContent: 'space-between', gap: 4,
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
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 4px',
                color: active ? accent.on : t.inkSoft,
                transition: 'color 0.2s',
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 20,
                background: active ? accent.c : 'transparent',
                transition: 'background 0.2s',
              }}>
                <Icon name={tab.icon} size={22} filled={active} stroke={active ? 1.9 : 1.7} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
