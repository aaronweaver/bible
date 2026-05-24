import React from 'react';
import type { Theme } from '../theme';
import { Icon } from '../icons';

export function PlanCompletionSheet({ t, accentColor, planTitle, totalDays, dayNum, onNext, onClose }: {
  t: Theme; accentColor: string;
  planTitle: string; totalDays: number; dayNum: number;
  onNext?: () => void; onClose: () => void;
}) {
  const isLastDay = dayNum >= totalDays;
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
        animation: 'planSlideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <style>{`@keyframes planSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
        <div style={{ width: 36, height: 4, background: t.rule, borderRadius: 2, margin: '0 auto 28px' }} />

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
              ? `You've finished all ${totalDays} days of ${planTitle}.`
              : `${totalDays - dayNum} day${totalDays - dayNum === 1 ? '' : 's'} remaining in ${planTitle}.`
            }
          </div>
        </div>

        <div style={{ margin: '0 0 28px' }}>
          <div style={{ height: 6, borderRadius: 3, background: t.rule, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.round((dayNum / totalDays) * 100)}%`,
              height: '100%', background: accentColor, borderRadius: 3,
              transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          </div>
          <div style={{
            marginTop: 6, display: 'flex', justifyContent: 'space-between',
            font: `12px ${t.fontUi}`, color: t.inkMute,
          }}>
            <span>Day {dayNum} of {totalDays}</span>
            <span>{Math.round((dayNum / totalDays) * 100)}% complete</span>
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
