import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { light, dark } from './theme';
import { useTheme } from './hooks/useAppState';
import { BottomNav } from './components/BottomNav';
import { Today } from './screens/Today';
import { Bible } from './screens/Bible';
import { Lessons } from './screens/Lessons';
import { LessonDetail } from './screens/LessonDetail';
import { Profile } from './screens/Profile';
import { DevotionalReader } from './screens/DevotionalReader';
import { PlanReader } from './screens/PlanReader';
import { StoryDetail } from './screens/StoryDetail';

export function App() {
  const { dark: isDark } = useTheme();
  const t = isDark ? dark : light;
  const accent = { c: t.accent, on: t.accentOn };

  // Sync browser chrome to theme
  React.useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.bg);
    document.body.style.background = t.bg;
  }, [t.bg]);

  return (
    <div style={{
      minHeight: '100%', width: '100%',
      background: t.bg, color: t.ink,
      fontFamily: t.fontBody,
      paddingBottom: 160,
    }}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Today t={t} accent={accent} />} />
        <Route path="/today" element={<Navigate to="/" replace />} />
        <Route path="/bible" element={<Bible t={t} accent={accent} />} />
        <Route path="/lessons" element={<Lessons t={t} accent={accent} />} />
        <Route path="/lessons/:id" element={<LessonDetail t={t} accent={accent} />} />
        <Route path="/profile" element={<Profile t={t} accent={accent} />} />
        <Route path="/devotional/:date/:period" element={<DevotionalReader t={t} />} />
        <Route path="/plan/:planId/day/:day" element={<PlanReader t={t} />} />
        <Route path="/stories/:id" element={<StoryDetail t={t} accent={accent} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav t={t} accent={accent} />
    </div>
  );
}
