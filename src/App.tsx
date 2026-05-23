import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { light, dark } from './theme';
import { useTheme } from './hooks/useAppState';
import { BottomNav } from './components/BottomNav';
import { Today } from './screens/Today';
import { Bible } from './screens/Bible';
import { Lessons } from './screens/Lessons';
import { LessonDetail } from './screens/LessonDetail';
import { Profile } from './screens/Profile';

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
      <Routes>
        <Route path="/" element={<Today t={t} accent={accent} />} />
        <Route path="/today" element={<Navigate to="/" replace />} />
        <Route path="/bible" element={<Bible t={t} accent={accent} />} />
        <Route path="/lessons" element={<Lessons t={t} accent={accent} />} />
        <Route path="/lessons/:id" element={<LessonDetail t={t} accent={accent} />} />
        <Route path="/profile" element={<Profile t={t} accent={accent} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav t={t} accent={accent} />
    </div>
  );
}
