import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar } from '../components/TopBar';
import { Icon } from '../icons';
import {
  READING_PLANS_META, getPlanDays, readingsLabel,
  dateForPlanDay, formatPlanDate, daysBetween, todayISO,
  type ReadingDay,
} from '../data/readingPlans';
import { useAppState } from '../hooks/useAppState';
import { PlanCompletionSheet } from '../components/PlanCompletionSheet';

export function PlanReader({ t }: { t: Theme }) {
  const { planId = '', day: dayParam = '1' } = useParams<{ planId: string; day: string }>();
  const navigate = useNavigate();
  const { state, markPlanDayComplete, togglePlanReading, shiftPlanDatesToToday } = useAppState();

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
  const dayMarkedComplete = prog?.completedDays?.includes(dayNum) ?? false;
  const todayData = days?.find(d => d.day === dayNum);
  const storedIdxs = prog?.completedReadings?.[dayNum];
  const completedIdxs = storedIdxs ?? (dayMarkedComplete && todayData
    ? todayData.readings.map((_, i) => i)
    : []);
  const isRead = todayData
    ? completedIdxs.length >= todayData.readings.length
    : dayMarkedComplete;

  // Catch-up: how many days behind is the user vs. the scheduled date?
  const startDate = prog?.startDate;
  const scheduledDay = startDate
    ? Math.min(totalDays, Math.max(1, daysBetween(startDate, todayISO()) + 1))
    : null;
  const nextIncomplete = prog
    ? (() => {
        for (let d = 1; d <= totalDays; d++) {
          if (!prog.completedDays.includes(d)) return d;
        }
        return totalDays + 1;
      })()
    : 1;
  const daysBehind = scheduledDay != null ? Math.max(0, scheduledDay - nextIncomplete) : 0;

  function goToDay(d: number) {
    navigate(`/plan/${planId}/day/${d}`, { replace: true });
  }

  function handleMarkComplete() {
    markPlanDayComplete(planId, dayNum, totalDays, todayData?.readings.length);
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
        startDate={startDate}
        scheduledDay={scheduledDay}
        onSelect={goToDay}
      />

      {daysBehind > 0 && (
        <div style={{
          margin: '0 18px 12px',
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: `${accentColor}10`,
          border: `1px solid ${accentColor}33`,
          borderRadius: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: `600 13px ${t.fontUi}`, color: accentColor }}>
              You're {daysBehind} day{daysBehind === 1 ? '' : 's'} behind
            </div>
            <div style={{ font: `12px ${t.fontBody}`, color: t.inkSoft, marginTop: 2 }}>
              Catch up by shifting dates to start today.
            </div>
          </div>
          <button
            onClick={() => shiftPlanDatesToToday(planId)}
            style={{
              background: accentColor, color: '#fff', border: 'none',
              borderRadius: 999, padding: '8px 14px',
              font: `600 13px ${t.fontUi}`, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Catch up
          </button>
        </div>
      )}

      {/* Readings list */}
      <div style={{ padding: '20px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {days === null ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 120, color: t.inkMute, font: `14px ${t.fontUi}`,
          }}>
            Loading…
          </div>
        ) : todayData ? todayData.readings.map((r, i) => {
          const readingDone = completedIdxs.includes(i);
          const totalReadings = todayData.readings.length;
          const goRead = () => navigate('/bible', {
            state: {
              book: r.book, chapter: r.chapter,
              startVerse: r.startVerse,
              endVerse: r.endVerse,
              returnTo: `/plan/${planId}/day/${dayNum}`,
              returnLabel: `Day ${dayNum}`,
              lastReadingBook: todayData.readings[totalReadings - 1].book,
              lastReadingChapter: todayData.readings[totalReadings - 1].chapter,
              planId, planDay: dayNum, planTotalDays: totalDays,
              planAccentIndex: meta.accentIndex, planTitle: meta.title,
              planReadings: todayData.readings,
              planReadingIdx: i,
            },
          });
          return (
            <div
              key={i}
              onClick={goRead}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: t.paper, border: `0.5px solid ${t.paperEdge}`,
                borderRadius: t.radius, padding: '15px 18px',
                color: t.ink, cursor: 'pointer', textAlign: 'left',
                boxShadow: '0 4px 16px -10px rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  role="radio"
                  aria-checked={readingDone}
                  aria-label={`Mark ${r.book} ${r.chapter} complete`}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlanReading(planId, dayNum, i, totalReadings, totalDays);
                  }}
                  style={{
                    width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                    border: `2px solid ${readingDone ? accentColor : t.rule}`,
                    background: 'transparent', padding: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {readingDone && (
                    <div style={{
                      width: 14, height: 14, borderRadius: 7,
                      background: accentColor,
                    }} />
                  )}
                </button>
                <div>
                  <div style={{
                    font: `500 17px ${t.fontDisplay}`, letterSpacing: -0.2,
                    color: readingDone ? t.inkMute : t.ink,
                  }}>
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
            </div>
          );
        }) : (
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
                    endVerse: todayData.readings[0].endVerse,
                    returnTo: `/plan/${planId}/day/${dayNum}`,
                    returnLabel: `Day ${dayNum}`,
                    lastReadingBook: todayData.readings[todayData.readings.length - 1].book,
                    lastReadingChapter: todayData.readings[todayData.readings.length - 1].chapter,
                    planId, planDay: dayNum, planTotalDays: totalDays,
                    planAccentIndex: meta.accentIndex, planTitle: meta.title,
                    planReadings: todayData.readings,
                    planReadingIdx: 0,
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

      {showComplete && (
        <PlanCompletionSheet
          t={t} accentColor={accentColor}
          planTitle={meta.title} totalDays={totalDays} dayNum={dayNum}
          onNext={dayNum < totalDays ? () => { setShowComplete(false); goToDay(dayNum + 1); } : undefined}
          onClose={() => setShowComplete(false)}
        />
      )}
    </div>
  );
}

function DayStrip({ t, accentColor, totalDays, currentDay, completedDays, startDate, scheduledDay, onSelect }: {
  t: Theme; accentColor: string; totalDays: number; currentDay: number;
  completedDays: number[];
  startDate?: string;
  scheduledDay: number | null;
  onSelect: (day: number) => void;
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
        const isToday = scheduledDay === d;
        const dt = dateForPlanDay(startDate, d);
        const dateLabel = dt ? formatPlanDate(dt) : 'Day';
        return (
          <button
            key={d}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(d)}
            style={{
              flexShrink: 0,
              minWidth: 56, height: 64, padding: '0 8px',
              borderRadius: 12,
              border: isActive
                ? 'none'
                : `1px solid ${isToday ? accentColor : (isDone ? accentColor + '50' : t.rule)}`,
              background: isActive ? accentColor : isDone ? `${accentColor}12` : t.paper,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            }}
          >
            <div style={{
              font: `${isActive ? 700 : 500} 15px ${t.fontUi}`,
              color: isActive ? '#fff' : isDone ? accentColor : t.ink,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {d}
              {isDone && !isActive && (
                <Icon name="check" size={11} stroke={2.4} color={accentColor} />
              )}
            </div>
            <div style={{
              font: `500 10px ${t.fontUi}`,
              color: isActive ? 'rgba(255,255,255,0.85)' : t.inkMute,
              letterSpacing: 0.2,
              whiteSpace: 'nowrap',
            }}>
              {dateLabel}
            </div>
          </button>
        );
      })}
    </div>
  );
}

