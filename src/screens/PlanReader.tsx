import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar } from '../components/TopBar';
import { Icon } from '../icons';
import {
  READING_PLANS_META, getPlanDays, readingsLabel,
  type ReadingDay,
} from '../data/readingPlans';
import { useAppState } from '../hooks/useAppState';

export function PlanReader({ t }: { t: Theme }) {
  const { planId = '', day: dayParam = '1' } = useParams<{ planId: string; day: string }>();
  const navigate = useNavigate();
  const { state, markPlanDayComplete } = useAppState();

  const meta = READING_PLANS_META.find(m => m.id === planId);
  const [days, setDays] = useState<ReadingDay[] | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (!meta) { navigate('/lessons', { replace: true }); return; }
    getPlanDays(planId).then(setDays);
  }, [planId, meta, navigate]);

  // Reset completion sheet when day changes
  useEffect(() => { setShowComplete(false); }, [dayParam]);

  if (!meta) return null;

  const totalDays = meta.totalDays;
  const rawDay = parseInt(dayParam, 10);
  const dayNum = isNaN(rawDay) ? 1 : Math.max(1, Math.min(rawDay, totalDays));

  const accentColor = t.palette[meta.accentIndex];
  const prog = state.readingPlans[planId];
  const isRead = prog?.completedDays?.includes(dayNum) ?? false;
  const todayData = days?.find(d => d.day === dayNum);

  function goToDay(d: number) {
    navigate(`/plan/${planId}/day/${d}`, { replace: true });
  }

  function handleMarkComplete() {
    markPlanDayComplete(planId, dayNum, totalDays);
    setShowComplete(true);
  }

  return (
    <div style={{ padding: '0 0 48px' }}>
      <TopBar t={t} onBack={() => navigate('/lessons')} />

      {/* Header */}
      <div style={{ padding: '4px 22px 16px' }}>
        <div style={{
          font: `700 11px ${t.fontUi}`, letterSpacing: 1.5, textTransform: 'uppercase',
          color: accentColor, marginBottom: 6,
        }}>
          {meta.title.toUpperCase()}
        </div>
        <h1 style={{
          margin: '0 0 4px', font: `400 32px/1.05 ${t.fontDisplay}`,
          letterSpacing: -0.5, color: t.ink,
        }}>
          Day {dayNum} <span style={{ color: t.inkMute, font: `300 22px/1.05 ${t.fontDisplay}` }}>of {totalDays}</span>
        </h1>
        <div style={{ font: `italic 14px ${t.fontBody}`, color: t.inkSoft, minHeight: 20 }}>
          {todayData ? readingsLabel(todayData.readings) : meta.subtitle}
        </div>
        {todayData?.label && (
          <div style={{
            marginTop: 8,
            display: 'inline-flex', alignItems: 'center',
            background: `${accentColor}14`, color: accentColor,
            padding: '4px 12px', borderRadius: 999,
            font: `600 12px ${t.fontUi}`, letterSpacing: 0.3,
          }}>
            {todayData.label}
          </div>
        )}
      </div>

      {/* Day selector strip */}
      <DayStrip
        t={t} accentColor={accentColor}
        totalDays={totalDays} currentDay={dayNum}
        completedDays={prog?.completedDays ?? []}
        onSelect={goToDay}
      />

      {/* Readings list */}
      <div style={{ padding: '20px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {days === null ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 120, color: t.inkMute, font: `14px ${t.fontUi}`,
          }}>
            Loading…
          </div>
        ) : todayData ? todayData.readings.map((r, i) => (
          <button
            key={i}
            onClick={() => navigate('/bible', {
              state: {
                book: r.book, chapter: r.chapter,
                startVerse: r.startVerse,
                returnTo: `/plan/${planId}/day/${dayNum}`,
                returnLabel: `Day ${dayNum}`,
              },
            })}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: t.paper, border: `0.5px solid ${t.paperEdge}`,
              borderRadius: t.radius, padding: '15px 18px',
              color: t.ink, cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 4px 16px -10px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 19, flexShrink: 0,
                border: `1.5px solid ${isRead ? accentColor : t.rule}`,
                background: isRead ? `${accentColor}14` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isRead ? accentColor : t.inkMute,
              }}>
                {isRead
                  ? <Icon name="check" size={16} stroke={2.2} color={accentColor} />
                  : <div style={{ width: 10, height: 10, borderRadius: 5, background: t.rule }} />
                }
              </div>
              <div>
                <div style={{ font: `500 17px ${t.fontDisplay}`, letterSpacing: -0.2, color: t.ink }}>
                  {r.book} {r.chapter}
                  {r.startVerse ? `:${r.startVerse}–${r.endVerse}` : ''}
                </div>
                {r.startVerse && (
                  <div style={{ font: `12px ${t.fontBody}`, color: t.inkMute, marginTop: 2 }}>
                    Verses {r.startVerse}–{r.endVerse}
                  </div>
                )}
              </div>
            </div>
            <Icon name="chev-r" size={18} color={t.inkMute} />
          </button>
        )) : (
          <div style={{ color: t.inkMute, font: `14px ${t.fontBody}`, textAlign: 'center', padding: '40px 0' }}>
            No readings for day {dayNum}.
          </div>
        )}
      </div>

      {/* Start Reading / Mark Complete footer */}
      <div style={{ margin: '24px 18px 0' }}>
        {!isRead ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayData && todayData.readings.length > 0 && (
              <button
                onClick={() => navigate('/bible', {
                  state: {
                    book: todayData.readings[0].book,
                    chapter: todayData.readings[0].chapter,
                    startVerse: todayData.readings[0].startVerse,
                    returnTo: `/plan/${planId}/day/${dayNum}`,
                    returnLabel: `Day ${dayNum}`,
                  },
                })}
                style={{
                  width: '100%', background: accentColor, color: '#fff',
                  border: 'none', borderRadius: 14, padding: '16px',
                  font: `600 17px ${t.fontUi}`, cursor: 'pointer', letterSpacing: -0.1,
                  boxShadow: `0 8px 24px -10px ${accentColor}99`,
                }}
              >
                Start Reading
              </button>
            )}
            <button
              onClick={handleMarkComplete}
              style={{
                width: '100%', background: 'transparent', color: t.inkSoft,
                border: `1px solid ${t.rule}`, borderRadius: 14, padding: '13px',
                font: `500 14px ${t.fontUi}`, cursor: 'pointer', letterSpacing: -0.1,
              }}
            >
              Mark Day {dayNum} Complete
            </button>
          </div>
        ) : (
          <div style={{
            background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
            padding: '18px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18, flexShrink: 0,
              background: `${accentColor}18`, color: accentColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check" size={16} stroke={2.2} color={accentColor} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: `600 14px ${t.fontUi}`, color: accentColor }}>Day {dayNum} complete</div>
              {dayNum < totalDays && (
                <button
                  onClick={() => goToDay(dayNum + 1)}
                  style={{
                    marginTop: 8, width: '100%', background: accentColor, color: '#fff',
                    border: 'none', borderRadius: 10, padding: '11px',
                    font: `600 14px ${t.fontUi}`, cursor: 'pointer',
                  }}
                >
                  Read Day {dayNum + 1} →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Completion fly-up sheet */}
      {showComplete && (
        <CompletionSheet
          t={t} accentColor={accentColor}
          meta={meta} dayNum={dayNum}
          onNext={dayNum < totalDays ? () => { setShowComplete(false); goToDay(dayNum + 1); } : undefined}
          onClose={() => setShowComplete(false)}
        />
      )}
    </div>
  );
}

function DayStrip({ t, accentColor, totalDays, currentDay, completedDays, onSelect }: {
  t: Theme; accentColor: string; totalDays: number; currentDay: number;
  completedDays: number[]; onSelect: (day: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const offset = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [currentDay]);

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
        padding: '2px 18px 16px',
        maskImage: 'linear-gradient(to right, transparent 0px, black 18px, black calc(100% - 18px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 18px, black calc(100% - 18px), transparent 100%)',
      }}
    >
      {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
        const isActive = d === currentDay;
        const isDone = completedDays.includes(d);
        return (
          <button
            key={d}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(d)}
            style={{
              flexShrink: 0,
              width: 52, height: 60,
              borderRadius: 12,
              border: isActive ? 'none' : `1px solid ${isDone ? accentColor + '50' : t.rule}`,
              background: isActive ? accentColor : isDone ? `${accentColor}12` : t.paper,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <div style={{
              font: `${isActive ? 700 : 500} 16px ${t.fontUi}`,
              color: isActive ? '#fff' : isDone ? accentColor : t.ink,
            }}>
              {isDone && !isActive ? '✓' : d}
            </div>
            <div style={{
              font: `500 10px ${t.fontUi}`,
              color: isActive ? 'rgba(255,255,255,0.75)' : t.inkMute,
              letterSpacing: 0.2,
            }}>
              Day
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CompletionSheet({ t, accentColor, meta, dayNum, onNext, onClose }: {
  t: Theme; accentColor: string;
  meta: { title: string; totalDays: number; icon: string };
  dayNum: number; onNext?: () => void; onClose: () => void;
}) {
  const isLastDay = dayNum >= meta.totalDays;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{
        position: 'relative', background: t.paper,
        borderRadius: '24px 24px 0 0',
        padding: '12px 24px 48px',
        animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
        <div style={{ width: 36, height: 4, background: t.rule, borderRadius: 2, margin: '0 auto 28px' }} />

        {/* Check circle */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 36, margin: '0 auto 16px',
            background: `${accentColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${accentColor}40`,
          }}>
            <Icon name="check" size={32} stroke={2.2} color={accentColor} />
          </div>
          <div style={{ font: `700 26px/1.1 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.5 }}>
            {isLastDay ? 'Plan Complete!' : `Day ${dayNum} Complete!`}
          </div>
          <div style={{ font: `14px ${t.fontBody}`, color: t.inkSoft, marginTop: 6 }}>
            {isLastDay
              ? `You've finished all ${meta.totalDays} days of ${meta.title}.`
              : `${meta.totalDays - dayNum} day${meta.totalDays - dayNum === 1 ? '' : 's'} remaining in ${meta.title}.`
            }
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ margin: '0 0 28px' }}>
          <div style={{ height: 6, borderRadius: 3, background: t.rule, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.round((dayNum / meta.totalDays) * 100)}%`,
              height: '100%', background: accentColor, borderRadius: 3,
              transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          </div>
          <div style={{
            marginTop: 6, display: 'flex', justifyContent: 'space-between',
            font: `12px ${t.fontUi}`, color: t.inkMute,
          }}>
            <span>Day {dayNum} of {meta.totalDays}</span>
            <span>{Math.round((dayNum / meta.totalDays) * 100)}% complete</span>
          </div>
        </div>

        {onNext && (
          <button
            onClick={onNext}
            style={{
              width: '100%', background: accentColor, color: '#fff',
              border: 'none', borderRadius: 14, padding: '16px',
              font: `600 17px ${t.fontUi}`, cursor: 'pointer', marginBottom: 10,
              boxShadow: `0 8px 24px -10px ${accentColor}99`,
            }}
          >
            Read Day {dayNum + 1} →
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            width: '100%', background: 'transparent', color: t.inkSoft,
            border: `1px solid ${t.rule}`, borderRadius: 14, padding: '14px',
            font: `600 15px ${t.fontUi}`, cursor: 'pointer',
          }}
        >
          {isLastDay ? 'Done' : 'Back to Plan'}
        </button>
      </div>
    </div>
  );
}
