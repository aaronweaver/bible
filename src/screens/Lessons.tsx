import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar, DarkToggle } from '../components/TopBar';
import { Icon } from '../icons';
import { LESSONS, type Lesson } from '../data/lessons';
import { useAppState, useTheme } from '../hooks/useAppState';

export function Lessons({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { dark, toggleDark } = useTheme();
  const completedCount = LESSONS.filter((l) => state.progress[l.id]?.completed).length;
  const palette = t.palette;

  return (
    <div style={{ paddingBottom: 24 }}>
      <TopBar t={t} eyebrow="New Believers Foundation" title="Lessons"
        right={<DarkToggle t={t} darkMode={dark} onToggle={toggleDark} />} />

      <div style={{
        margin: '6px 18px 18px', padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${accent.c}18`, color: accent.c,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="lessons" size={22} filled />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ font: `500 15px ${t.fontBody}`, color: t.ink, letterSpacing: -0.1 }}>
            A 10-step path through the basics
          </div>
          <div style={{ font: `12px ${t.fontUi}`, color: t.inkMute, marginTop: 3, letterSpacing: 0.3 }}>
            {completedCount}/10 complete · ~{LESSONS.reduce((s, l) => s + l.minutes, 0)} min total
          </div>
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {LESSONS.map((l, i) => {
          const isDone = !!state.progress[l.id]?.completed;
          const sectionsDone = state.progress[l.id]?.sectionsDone || 0;
          const inProg = !isDone && sectionsDone > 0;
          const prevDone = i === 0 || !!state.progress[LESSONS[i - 1].id]?.completed;
          const isLocked = !prevDone && !inProg && !isDone;
          const tone = palette[i % palette.length];
          return (
            <LessonRow key={l.id} t={t} tone={tone} lesson={l} idx={i}
              isLast={i === LESSONS.length - 1}
              state={isDone ? 'done' : inProg ? 'progress' : isLocked ? 'locked' : 'available'}
              sectionsDone={sectionsDone}
              onOpen={() => navigate(`/lessons/${l.id}`)} />
          );
        })}
      </div>
    </div>
  );
}

function LessonRow({ t, tone, lesson, idx, isLast, state, sectionsDone, onOpen }: {
  t: Theme; tone: string; lesson: Lesson; idx: number; isLast: boolean;
  state: 'done' | 'progress' | 'locked' | 'available'; sectionsDone: number; onOpen: () => void;
}) {
  const isDone = state === 'done';
  const isLocked = state === 'locked';
  const isProg = state === 'progress';
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 16,
          background: isDone ? tone : isProg ? `${tone}20` : 'transparent',
          border: isDone ? 'none' : `1.5px solid ${isLocked ? t.rule : (isProg ? tone : t.inkSoft)}`,
          color: isDone ? '#fff' : (isProg ? tone : t.inkSoft),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: `600 13px ${t.fontUi}`, flexShrink: 0,
        }}>
          {isDone ? <Icon name="check" size={14} stroke={2.4} /> : (idx + 1)}
        </div>
        {!isLast && <div style={{ width: 1.5, flex: 1, background: isDone ? tone : t.rule, marginTop: 2 }} />}
      </div>

      <button onClick={isLocked ? undefined : onOpen} disabled={isLocked} style={{
        flex: 1, textAlign: 'left', margin: '0 0 14px',
        background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radiusSm,
        padding: '14px 16px', cursor: isLocked ? 'default' : 'pointer',
        opacity: isLocked ? 0.5 : 1, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: tone, opacity: isLocked ? 0.3 : 1,
        }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ font: `500 19px/1.15 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.2 }}>{lesson.title}</div>
          <div style={{ font: `11px ${t.fontUi}`, color: t.inkMute, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
            ~{lesson.minutes} min
          </div>
        </div>
        <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 4, lineHeight: 1.4 }}>
          {lesson.subtitle}
        </div>
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${t.rule}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="book" size={14} color={t.inkMute} />
          <div style={{ font: `italic 12px ${t.fontBody}`, color: t.inkSoft }}>{lesson.ref}</div>
          {isProg && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 60, height: 4, borderRadius: 2, background: t.rule, overflow: 'hidden' }}>
                <div style={{ width: `${(sectionsDone / lesson.sections.length) * 100}%`, height: '100%', background: tone }} />
              </div>
              <div style={{ font: `11px ${t.fontUi}`, color: tone, fontWeight: 700 }}>
                {sectionsDone}/{lesson.sections.length}
              </div>
            </div>
          )}
          {isDone && (
            <div style={{
              marginLeft: 'auto', font: `11px ${t.fontUi}`, color: tone,
              fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
            }}>Complete</div>
          )}
        </div>
      </button>
    </div>
  );
}
