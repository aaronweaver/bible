import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!meta) { navigate('/lessons', { replace: true }); return; }
    getPlanDays(planId).then(setDays);
  }, [planId, meta, navigate]);

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

  return (
    <div style={{ padding: '0 0 40px' }}>
      <TopBar
        t={t}
        onBack={() => navigate('/lessons')}
        right={
          <button
            onClick={() => {
              const input = window.prompt(`Jump to day (1–${totalDays}):`, String(dayNum));
              if (!input) return;
              const n = parseInt(input, 10);
              if (!isNaN(n)) goToDay(Math.max(1, Math.min(n, totalDays)));
            }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              font: `600 14px ${t.fontUi}`, color: accentColor, padding: '4px 8px',
            }}
          >
            Jump
          </button>
        }
      />

      {/* Header */}
      <div style={{ padding: '4px 22px 20px' }}>
        <div style={{
          font: `700 11px ${t.fontUi}`, letterSpacing: 1.5, textTransform: 'uppercase',
          color: accentColor, marginBottom: 6,
        }}>
          {meta.title.toUpperCase()} · Day {dayNum} of {totalDays}
        </div>
        <h1 style={{
          margin: '0 0 6px', font: `400 34px/1.05 ${t.fontDisplay}`,
          letterSpacing: -0.5, color: t.ink,
        }}>
          Day {dayNum}
        </h1>
        <div style={{ font: `italic 15px ${t.fontBody}`, color: t.inkSoft }}>
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

      {/* Readings list */}
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              borderRadius: t.radius, padding: '16px 18px',
              color: t.ink, cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 4px 16px -10px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${accentColor}14`, color: accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="book" size={20} filled />
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

      {/* Prev / Next */}
      <div style={{ margin: '24px 18px 0', display: 'flex', gap: 10 }}>
        <button
          onClick={() => goToDay(dayNum - 1)}
          disabled={dayNum <= 1}
          style={{
            flex: 1, padding: '12px', borderRadius: t.radiusSm,
            border: `1.5px solid ${dayNum <= 1 ? t.rule : accentColor}`,
            background: 'transparent', cursor: dayNum <= 1 ? 'default' : 'pointer',
            color: dayNum <= 1 ? t.inkMute : accentColor,
            font: `600 14px ${t.fontUi}`, letterSpacing: -0.1,
            opacity: dayNum <= 1 ? 0.4 : 1,
          }}
        >
          ← Day {dayNum - 1}
        </button>
        <button
          onClick={() => goToDay(dayNum + 1)}
          disabled={dayNum >= totalDays}
          style={{
            flex: 1, padding: '12px', borderRadius: t.radiusSm,
            border: `1.5px solid ${dayNum >= totalDays ? t.rule : accentColor}`,
            background: 'transparent', cursor: dayNum >= totalDays ? 'default' : 'pointer',
            color: dayNum >= totalDays ? t.inkMute : accentColor,
            font: `600 14px ${t.fontUi}`, letterSpacing: -0.1,
            opacity: dayNum >= totalDays ? 0.4 : 1,
          }}
        >
          Day {dayNum + 1} →
        </button>
      </div>

      {/* Mark complete footer */}
      <div style={{
        margin: '24px 18px 0', padding: '20px',
        background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
      }}>
        {!isRead ? (
          <>
            <button
              onClick={() => markPlanDayComplete(planId, dayNum, totalDays)}
              style={{
                width: '100%', background: accentColor, color: '#fff',
                border: 'none', borderRadius: 12, padding: '14px',
                font: `600 16px ${t.fontUi}`, cursor: 'pointer', letterSpacing: -0.1,
              }}
            >
              Mark Day {dayNum} Complete
            </button>
            <div style={{
              marginTop: 10, font: `12px ${t.fontBody}`, color: t.inkMute,
              textAlign: 'center', lineHeight: 1.4,
            }}>
              Tap when you've finished all readings
            </div>
          </>
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 14,
              font: `600 14px ${t.fontUi}`, color: accentColor,
            }}>
              <Icon name="check" size={16} stroke={2.2} color={accentColor} />
              Day {dayNum} complete
            </div>
            {dayNum < totalDays && (
              <button
                onClick={() => goToDay(dayNum + 1)}
                style={{
                  width: '100%', background: 'transparent', color: accentColor,
                  border: `1.5px solid ${accentColor}`, borderRadius: 12, padding: '13px',
                  font: `600 15px ${t.fontUi}`, cursor: 'pointer', letterSpacing: -0.1,
                }}
              >
                Read Day {dayNum + 1} →
              </button>
            )}
            {dayNum === totalDays && (
              <div style={{
                textAlign: 'center', font: `15px ${t.fontBody}`, color: t.inkSoft, lineHeight: 1.5,
              }}>
                You've completed the entire plan! 🎉
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
