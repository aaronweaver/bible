import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar } from '../components/TopBar';
import { Icon } from '../icons';
import {
  getEntry, formatDevotionalDate, todayDateKey,
  type DevotionalPeriod,
} from '../data/devotional';
import { useAppState, useTheme } from '../hooks/useAppState';

export function DevotionalReader({ t }: { t: Theme }) {
  const { date = '', period = 'morning' } = useParams<{ date: string; period: string }>();
  const navigate = useNavigate();
  const { state, markDevotionalRead } = useAppState();
  const { fontScale } = useTheme();
  const scale = fontScale / 100;
  const scrollRef = useRef<HTMLDivElement>(null);

  const safePeriod = (period === 'morning' || period === 'evening') ? period as DevotionalPeriod : 'morning';
  const entry = getEntry(date, safePeriod);
  const devColor = t.palette[1]; // purple

  // Restore scroll position
  const scrollKey = `cornerstone.scroll.devotional.${date}.${safePeriod}`;
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(scrollKey);
      if (saved) window.scrollTo(0, parseInt(saved, 10));
    } catch {}
    return () => {
      try { sessionStorage.setItem(scrollKey, String(window.scrollY)); } catch {}
    };
  }, [scrollKey]);

  const isRead = !!state.devotional.read[`${date}:${safePeriod}`];
  const otherPeriod: DevotionalPeriod = safePeriod === 'morning' ? 'evening' : 'morning';
  const otherEntry = getEntry(date, otherPeriod);
  const otherRead = !!state.devotional.read[`${date}:${otherPeriod}`];

  // After marking: CTA destination
  function nextDestination() {
    if (safePeriod === 'morning' && otherEntry) return `/devotional/${date}/evening`;
    // Evening done — suggest tomorrow's morning
    const [m, d] = date.split('-');
    const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const mIdx = MONTHS.indexOf(m);
    const tomorrow = new Date(2000, mIdx, parseInt(d) + 1);
    const tomorrowKey = `${MONTHS[tomorrow.getMonth()]}-${tomorrow.getDate()}`;
    return `/devotional/${tomorrowKey}/morning`;
  }

  const eyebrow = safePeriod === 'morning' ? 'Morning Devotional' : 'Evening Devotional';
  const dateLabel = formatDevotionalDate(date);
  const isTodayEntry = date === todayDateKey();

  if (!entry) {
    return (
      <div style={{ padding: '0 0 24px' }}>
        <TopBar t={t} title="Devotional" onBack={() => navigate(-1)} />
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '60px 32px', gap: 12,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: `${devColor}14`, color: devColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="book" size={26} />
          </div>
          <div style={{ font: `600 17px ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.2 }}>
            Entry not found
          </div>
          <div style={{ font: `14px ${t.fontBody}`, color: t.inkMute, textAlign: 'center', lineHeight: 1.5 }}>
            No devotional entry exists for {dateLabel}.
          </div>
          <button onClick={() => navigate(-1)} style={{
            marginTop: 8, background: devColor, color: '#fff', border: 'none',
            borderRadius: 12, padding: '12px 28px',
            font: `600 15px ${t.fontUi}`, cursor: 'pointer',
          }}>Go Back</button>
        </div>
      </div>
    );
  }

  const bodyParagraphs = entry.body.split('\n\n').filter(p => p.trim().length > 0);

  return (
    <div ref={scrollRef} style={{ padding: '0 0 40px' }}>
      <TopBar t={t} onBack={() => navigate(-1)} />

      {/* Header */}
      <div style={{ padding: '4px 22px 20px' }}>
        <div style={{
          font: `700 11px ${t.fontUi}`, letterSpacing: 1.5, textTransform: 'uppercase',
          color: devColor, marginBottom: 6,
        }}>
          {eyebrow}{isTodayEntry ? ' · Today' : ''}
        </div>
        <h1 style={{
          margin: '0 0 6px', font: `400 34px/1.05 ${t.fontDisplay}`,
          letterSpacing: -0.5, color: t.ink,
        }}>
          {dateLabel}
        </h1>
        <div style={{ font: `italic 15px ${t.fontBody}`, color: t.inkSoft }}>
          {entry.scriptureRef}
        </div>
      </div>

      {/* Opening verse blockquote */}
      <div style={{
        margin: '0 18px 24px',
        padding: '16px 18px',
        background: `${devColor}08`,
        borderLeft: `3px solid ${devColor}`,
        borderRadius: '0 12px 12px 0',
      }}>
        <p style={{
          margin: 0,
          font: `italic ${Math.round(17 * scale)}px/1.6 ${t.fontDisplay}`,
          color: t.ink,
          letterSpacing: -0.1,
        }}>
          "{entry.verseText}"
        </p>
        <div style={{
          marginTop: 10,
          font: `600 12px ${t.fontUi}`, letterSpacing: 0.5,
          color: devColor, textTransform: 'uppercase',
        }}>
          {entry.scriptureRef}
        </div>
      </div>

      {/* Period toggle */}
      <div style={{
        margin: '0 18px 24px',
        display: 'flex', gap: 8,
      }}>
        {(['morning', 'evening'] as DevotionalPeriod[]).map(p => {
          const active = p === safePeriod;
          const hasEntry = !!getEntry(date, p);
          if (!hasEntry) return null;
          return (
            <button
              key={p}
              onClick={() => !active && navigate(`/devotional/${date}/${p}`, { replace: true })}
              style={{
                padding: '7px 18px',
                borderRadius: 20,
                border: active ? 'none' : `0.5px solid ${t.rule}`,
                background: active ? devColor : t.paper,
                color: active ? '#fff' : t.inkSoft,
                font: `${active ? 600 : 400} 13px ${t.fontUi}`,
                cursor: active ? 'default' : 'pointer',
                letterSpacing: -0.1,
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
              {!!state.devotional.read[`${date}:${p}`] && !active && (
                <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 11 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div style={{ padding: '0 22px' }}>
        {bodyParagraphs.map((para, i) => (
          <p key={i} style={{
            margin: '0 0 20px',
            font: `${Math.round(16 * scale)}px/1.75 ${t.fontBody}`,
            color: t.ink,
          }}>
            {para}
          </p>
        ))}
      </div>

      {/* Read footer */}
      <div style={{
        margin: '32px 18px 0',
        padding: '20px',
        background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
      }}>
        {!isRead ? (
          <>
            <button
              onClick={() => markDevotionalRead(date, safePeriod)}
              style={{
                width: '100%', background: devColor, color: '#fff',
                border: 'none', borderRadius: 12, padding: '14px',
                font: `600 16px ${t.fontUi}`, cursor: 'pointer', letterSpacing: -0.1,
              }}
            >
              Mark as Read
            </button>
            <div style={{
              marginTop: 10, font: `12px ${t.fontBody}`, color: t.inkMute,
              textAlign: 'center', lineHeight: 1.4,
            }}>
              Tap when you've finished reading
            </div>
          </>
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 14,
              font: `600 14px ${t.fontUi}`, color: devColor,
            }}>
              <Icon name="check" size={16} stroke={2.2} color={devColor} />
              {safePeriod === 'morning' ? 'Morning reading complete' : 'Evening reading complete'}
            </div>
            {(!otherRead || safePeriod === 'morning') && (
              <button
                onClick={() => navigate(nextDestination())}
                style={{
                  width: '100%',
                  background: 'transparent', color: devColor,
                  border: `1.5px solid ${devColor}`, borderRadius: 12, padding: '13px',
                  font: `600 15px ${t.fontUi}`, cursor: 'pointer', letterSpacing: -0.1,
                }}
              >
                {safePeriod === 'morning'
                  ? `Read This Evening${otherRead ? ' (already read)' : ''}`
                  : "Tomorrow's Morning"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
