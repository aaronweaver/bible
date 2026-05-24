import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar, DarkToggle } from '../components/TopBar';
import { Icon } from '../icons';
import { LESSONS, type Lesson } from '../data/lessons';
import { useAppState, useTheme } from '../hooks/useAppState';
import {
  DEVOTIONAL_SERIES, todayDateKey, formatDevotionalDate, devotionalDaysRead,
} from '../data/devotional';
import { READING_PLANS_META, planProgressPct } from '../data/readingPlans';

type Tab = 'mine' | 'find' | 'completed';

export function Lessons({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const navigate = useNavigate();
  const { state, addDevotional, addPlan, removePlan } = useAppState();
  const { dark, toggleDark } = useTheme();
  const [tab, setTab] = React.useState<Tab>('mine');
  const [expanded, setExpanded] = React.useState(() => {
    try { return localStorage.getItem('cornerstone.lessonsExpanded') === 'true'; } catch { return false; }
  });
  const completedCount = LESSONS.filter((l) => state.progress[l.id]?.completed).length;
  const totalMinutes = LESSONS.reduce((s, l) => s + l.minutes, 0);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'mine', label: 'My Lessons' },
    { id: 'find', label: 'Find' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      <TopBar t={t} title="Lessons"
        right={<DarkToggle t={t} darkMode={dark} onToggle={toggleDark} />} />

      {/* Pill tabs */}
      <div style={{
        display: 'flex', gap: 8, padding: '4px 18px 16px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {tabs.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              flexShrink: 0,
              padding: '8px 18px',
              borderRadius: 20,
              border: active ? 'none' : `0.5px solid ${t.rule}`,
              background: active ? accent.c : t.paper,
              color: active ? accent.on : t.inkSoft,
              font: `${active ? 600 : 400} 14px ${t.fontUi}`,
              cursor: 'pointer',
              letterSpacing: -0.1,
            }}>
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'mine' && (
        <MineLessons
          t={t} accent={accent} completedCount={completedCount}
          totalMinutes={totalMinutes} expanded={expanded}
          onToggle={() => setExpanded(e => {
            const next = !e;
            try { localStorage.setItem('cornerstone.lessonsExpanded', String(next)); } catch {}
            return next;
          })}
          state={state} navigate={navigate} onRemovePlan={removePlan}
        />
      )}
      {tab === 'find' && (
        <FindTab t={t} accent={accent} state={state}
          onAddDevotional={() => { addDevotional(); setTab('mine'); }}
          onAddPlan={(id) => { addPlan(id); setTab('mine'); }}
          navigate={navigate}
        />
      )}
      {tab === 'completed' && <CompletedTab t={t} accent={accent} state={state} navigate={navigate} />}
    </div>
  );
}

function MineLessons({ t, accent, completedCount, totalMinutes, expanded, onToggle, state, navigate, onRemovePlan }: {
  t: Theme; accent: { c: string; on: string }; completedCount: number; totalMinutes: number;
  expanded: boolean; onToggle: () => void; state: any; navigate: (path: string) => void;
  onRemovePlan: (id: string) => void;
}) {
  const palette = t.palette;
  const devColor = t.palette[DEVOTIONAL_SERIES.accentIndex];
  const devAdded = state.devotional.status !== 'not-added';
  const daysRead = devotionalDaysRead(state.devotional.read);
  const [stopConfirm, setStopConfirm] = React.useState<string | null>(null); // planId to confirm stop

  return (
    <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Course card — condensed, expandable */}
      <button onClick={onToggle} style={{
        width: '100%', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 18px',
        background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
        borderBottomLeftRadius: expanded ? 0 : t.radius,
        borderBottomRightRadius: expanded ? 0 : t.radius,
        cursor: 'pointer',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${accent.c}18`, color: accent.c,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="lessons" size={22} filled />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `600 15px ${t.fontBody}`, color: t.ink, letterSpacing: -0.2 }}>
            New Believers Foundation
          </div>
          <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
            A 10-step path through the basics
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.rule, overflow: 'hidden' }}>
              <div style={{
                width: `${(completedCount / 10) * 100}%`, height: '100%',
                background: accent.c, borderRadius: 2,
              }} />
            </div>
            <div style={{ font: `11px ${t.fontUi}`, color: t.inkMute, whiteSpace: 'nowrap', letterSpacing: 0.3 }}>
              {completedCount}/10 · ~{totalMinutes} min
            </div>
          </div>
        </div>
        <div style={{ color: t.inkMute, flexShrink: 0, marginLeft: 4, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <Icon name="chev-d" size={18} />
        </div>
      </button>

      {/* Expanded lesson list */}
      {expanded && (
        <div style={{
          padding: '14px 18px 0',
          background: t.paper, border: `0.5px solid ${t.paperEdge}`,
          borderTop: 'none',
          borderBottomLeftRadius: t.radius, borderBottomRightRadius: t.radius,
          marginTop: -12,
        }}>
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
      )}

      {/* Devotional series row */}
      {devAdded && (
        <button
          onClick={() => navigate(`/devotional/${todayDateKey()}/morning`)}
          style={{
            width: '100%', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px',
            background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: devColor }} />
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${devColor}18`, color: devColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkles" size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `600 15px ${t.fontBody}`, color: t.ink, letterSpacing: -0.2 }}>
              Morning and Evening
            </div>
            <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
              C.H. Spurgeon · Daily devotional
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.rule, overflow: 'hidden' }}>
                <div style={{
                  width: `${(daysRead / DEVOTIONAL_SERIES.totalDays) * 100}%`, height: '100%',
                  background: devColor, borderRadius: 2,
                }} />
              </div>
              <div style={{ font: `11px ${t.fontUi}`, color: t.inkMute, whiteSpace: 'nowrap', letterSpacing: 0.3 }}>
                {daysRead}/{DEVOTIONAL_SERIES.totalDays} days
              </div>
            </div>
          </div>
          <Icon name="chev-r" size={16} color={t.inkMute} />
        </button>
      )}

      {/* Reading plan rows */}
      {READING_PLANS_META.filter(m => state.readingPlans[m.id]?.status && state.readingPlans[m.id].status !== 'not-added').map(m => {
        const prog = state.readingPlans[m.id];
        const planColor = t.palette[m.accentIndex];
        const pct = planProgressPct(prog, m.totalDays);
        return (
          <div key={m.id} style={{ position: 'relative' }}>
            <button
              onClick={() => navigate(`/plan/${m.id}/day/${prog.currentDay}`)}
              style={{
                width: '100%', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px',
                background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: planColor }} />
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${planColor}18`, color: planColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={m.icon as any} size={20} filled />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `600 15px ${t.fontBody}`, color: t.ink, letterSpacing: -0.2 }}>
                  {m.title}
                </div>
                <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 2, lineHeight: 1.4 }}>
                  {m.subtitle}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: t.rule, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: planColor, borderRadius: 2 }} />
                  </div>
                  <div style={{ font: `11px ${t.fontUi}`, color: t.inkMute, whiteSpace: 'nowrap', letterSpacing: 0.3 }}>
                    Day {prog.currentDay}/{m.totalDays}
                  </div>
                </div>
              </div>
              {/* stop button */}
              <button
                onClick={(e) => { e.stopPropagation(); setStopConfirm(m.id); }}
                style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 16,
                  background: `${t.inkMute}14`, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: t.inkMute, font: `700 16px ${t.fontUi}`,
                }}
                aria-label="Stop plan"
              >
                ···
              </button>
            </button>
          </div>
        );
      })}

      {/* Stop plan confirmation modal */}
      {stopConfirm && (() => {
        const planMeta = READING_PLANS_META.find(m => m.id === stopConfirm);
        return (
          <div onClick={() => setStopConfirm(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: t.paper, borderRadius: '20px 20px 0 0',
              width: '100%', maxWidth: 480, padding: '20px 24px 40px',
              animation: 'slideUp 0.25s cubic-bezier(0.32,0.72,0,1)',
            }}>
              <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
              <div style={{ width: 36, height: 4, background: t.rule, borderRadius: 2, margin: '0 auto 20px' }} />
              <div style={{ font: `600 18px/1.2 ${t.fontDisplay}`, color: t.ink, marginBottom: 8 }}>
                Stop "{planMeta?.title}"?
              </div>
              <div style={{ font: `14px/1.55 ${t.fontBody}`, color: t.inkSoft, marginBottom: 24 }}>
                Your progress will be removed. You can always add it again from Find.
              </div>
              <button
                onClick={() => { onRemovePlan(stopConfirm); setStopConfirm(null); }}
                style={{
                  width: '100%', background: '#e53e3e', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '14px',
                  font: `600 15px ${t.fontUi}`, cursor: 'pointer', marginBottom: 10,
                }}
              >
                Stop Plan
              </button>
              <button
                onClick={() => setStopConfirm(null)}
                style={{
                  width: '100%', background: 'transparent', color: t.inkSoft,
                  border: `1px solid ${t.rule}`, borderRadius: 12, padding: '13px',
                  font: `600 15px ${t.fontUi}`, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function FindTab({ t, accent, state, onAddDevotional, onAddPlan, navigate }: {
  t: Theme; accent: { c: string; on: string }; state: any;
  onAddDevotional: () => void; onAddPlan: (id: string) => void; navigate: (path: string) => void;
}) {
  const devColor = t.palette[DEVOTIONAL_SERIES.accentIndex];
  const isAdded = state.devotional.status !== 'not-added';

  return (
    <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Morning & Evening discovery card */}
      <div style={{
        background: t.paper, border: `0.5px solid ${t.paperEdge}`,
        borderRadius: t.radius, overflow: 'hidden',
      }}>
        <div style={{ height: 4, background: devColor }} />
        <div style={{ padding: '18px 18px 20px' }}>
          <div style={{
            font: `700 11px ${t.fontUi}`, letterSpacing: 1.4, textTransform: 'uppercase',
            color: devColor, marginBottom: 8,
          }}>
            C.H. Spurgeon · 1865
          </div>
          <div style={{ font: `500 24px/1.1 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.3 }}>
            Morning and Evening
          </div>
          <div style={{ font: `14px/1.55 ${t.fontBody}`, color: t.inkSoft, marginTop: 8 }}>
            {DEVOTIONAL_SERIES.description}
          </div>
          <div style={{
            marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${t.rule}`,
            display: 'flex', alignItems: 'center', gap: 16,
            font: `12px ${t.fontUi}`, color: t.inkMute,
          }}>
            <span>366 days · 732 entries</span>
            <span>Public domain</span>
          </div>
          <button
            onClick={isAdded
              ? () => navigate(`/devotional/${todayDateKey()}/morning`)
              : onAddDevotional}
            style={{
              marginTop: 16, width: '100%',
              background: isAdded ? 'transparent' : devColor,
              color: isAdded ? devColor : '#fff',
              border: isAdded ? `1.5px solid ${devColor}` : 'none',
              borderRadius: 12, padding: '13px',
              font: `600 15px ${t.fontUi}`, cursor: 'pointer', letterSpacing: -0.1,
            }}
          >
            {isAdded
              ? `Open Today's Devotional — ${formatDevotionalDate(todayDateKey())}`
              : 'Add to My Lessons'}
          </button>
        </div>
      </div>

      {/* Reading Plans section */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 4,
      }}>
        <div style={{ font: `700 11px ${t.fontUi}`, letterSpacing: 1.4, textTransform: 'uppercase', color: t.inkMute }}>
          Reading Plans
        </div>
        <div style={{ flex: 1, height: 0.5, background: t.rule }} />
      </div>

      {READING_PLANS_META.map(m => {
        const planColor = t.palette[m.accentIndex];
        const planProg = state.readingPlans[m.id];
        const planAdded = planProg?.status && planProg.status !== 'not-added';
        return (
          <div key={m.id} style={{
            background: t.paper, border: `0.5px solid ${t.paperEdge}`,
            borderRadius: t.radius, overflow: 'hidden',
          }}>
            <div style={{ height: 3, background: planColor }} />
            <div style={{ padding: '16px 18px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: `${planColor}16`, color: planColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={m.icon as any} size={20} filled />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `600 16px/1.15 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.2 }}>
                  {m.title}
                </div>
                <div style={{ font: `13px/1.45 ${t.fontBody}`, color: t.inkSoft, marginTop: 4 }}>
                  {m.description}
                </div>
                <div style={{
                  marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${t.rule}`,
                  font: `11px ${t.fontUi}`, color: t.inkMute, letterSpacing: 0.2,
                }}>
                  {m.totalDays} days · {m.subtitle}
                </div>
                <button
                  onClick={planAdded
                    ? () => navigate(`/plan/${m.id}/day/${planProg.currentDay}`)
                    : () => onAddPlan(m.id)}
                  style={{
                    marginTop: 12, width: '100%',
                    background: planAdded ? 'transparent' : planColor,
                    color: planAdded ? planColor : '#fff',
                    border: planAdded ? `1.5px solid ${planColor}` : 'none',
                    borderRadius: 10, padding: '11px',
                    font: `600 14px ${t.fontUi}`, cursor: 'pointer', letterSpacing: -0.1,
                  }}
                >
                  {planAdded ? `Open → Day ${planProg.currentDay}` : 'Add Plan'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompletedTab({ t, accent, state, navigate }: {
  t: Theme; accent: { c: string; on: string }; state: any; navigate: (path: string) => void;
}) {
  const completedCount = LESSONS.filter(l => state.progress[l.id]?.completed).length;
  const allLessonsDone = completedCount === LESSONS.length;
  const devotionalDone = state.devotional.status === 'completed';
  const totalMinutes = LESSONS.reduce((s, l) => s + l.minutes, 0);
  const devColor = t.palette[DEVOTIONAL_SERIES.accentIndex];
  const completedPlans = READING_PLANS_META.filter(m => state.readingPlans[m.id]?.status === 'completed');

  if (!allLessonsDone && !devotionalDone && completedPlans.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '60px 32px', gap: 12,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `${accent.c}14`, color: accent.c,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 4,
        }}>
          <Icon name="check" size={26} />
        </div>
        <div style={{ font: `600 17px ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.2 }}>
          No completed courses yet
        </div>
        <div style={{ font: `14px ${t.fontBody}`, color: t.inkMute, textAlign: 'center', lineHeight: 1.5 }}>
          Finish all lessons in a course to see it here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {allLessonsDone && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 18px',
          background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${accent.c}18`, color: accent.c,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="lessons" size={22} filled />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `600 15px ${t.fontBody}`, color: t.ink, letterSpacing: -0.2 }}>
              New Believers Foundation
            </div>
            <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 2 }}>
              A 10-step path through the basics
            </div>
            <div style={{ marginTop: 6, font: `11px ${t.fontUi}`, color: accent.c, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Complete · ~{totalMinutes} min
            </div>
          </div>
          <div style={{ color: accent.c, flexShrink: 0 }}>
            <Icon name="check" size={20} stroke={2.2} />
          </div>
        </div>
      )}

      {devotionalDone && (
        <button
          onClick={() => navigate(`/devotional/${todayDateKey()}/morning`)}
          style={{
            width: '100%', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px',
            background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: devColor }} />
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${devColor}18`, color: devColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkles" size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `600 15px ${t.fontBody}`, color: t.ink, letterSpacing: -0.2 }}>
              Morning and Evening
            </div>
            <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 2 }}>
              C.H. Spurgeon · All 366 days read
            </div>
            <div style={{ marginTop: 6, font: `11px ${t.fontUi}`, color: devColor, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Complete
            </div>
          </div>
          <div style={{ color: devColor, flexShrink: 0 }}>
            <Icon name="check" size={20} stroke={2.2} />
          </div>
        </button>
      )}

      {completedPlans.map(m => {
        const planColor = t.palette[m.accentIndex];
        return (
          <button
            key={m.id}
            onClick={() => navigate(`/plan/${m.id}/day/${m.totalDays}`)}
            style={{
              width: '100%', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px',
              background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: planColor }} />
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `${planColor}18`, color: planColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={m.icon as any} size={20} filled />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: `600 15px ${t.fontBody}`, color: t.ink, letterSpacing: -0.2 }}>
                {m.title}
              </div>
              <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 2 }}>
                {m.totalDays} days completed
              </div>
              <div style={{ marginTop: 6, font: `11px ${t.fontUi}`, color: planColor, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                Complete
              </div>
            </div>
            <div style={{ color: planColor, flexShrink: 0 }}>
              <Icon name="check" size={20} stroke={2.2} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function shareLesson(lesson: Lesson) {
  const url = `${window.location.origin}/bible/lessons/${lesson.id}`;
  const text = `Check out this ${lesson.title}`;
  if (navigator.share) {
    navigator.share({ title: lesson.title, text, url }).catch(() => {});
  } else {
    window.open(`sms:?body=${encodeURIComponent(`${text}\n${url}`)}`);
  }
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
        background: 'transparent', border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radiusSm,
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
            <button
              onClick={(e) => { e.stopPropagation(); shareLesson(lesson); }}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                padding: '2px 4px', cursor: 'pointer', color: tone,
                display: 'flex', alignItems: 'center',
              }}
            >
              <Icon name="share" size={16} color={tone} stroke={1.8} />
            </button>
          )}
        </div>
      </button>
    </div>
  );
}
