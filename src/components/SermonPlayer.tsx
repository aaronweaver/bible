import React, { useEffect, useRef, useState } from 'react';
import type { Theme } from '../theme';
import { Icon } from '../icons';
import type { Sermon } from '../data/sermons';
import { setUiState } from '../hooks/useUiState';

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function SermonBadge({
  t, accent, sermon, active, onClick,
}: {
  t: Theme;
  accent: { c: string; on: string };
  sermon: Sermon;
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button onClick={onClick} title={`Sermon: ${sermon.title}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      verticalAlign: 'middle', transform: 'translateY(-1px)',
      background: active ? accent.c : `${accent.c}1a`,
      color: active ? accent.on : accent.c,
      border: 'none', cursor: 'pointer',
      padding: '2px 8px 2px 6px', marginRight: 6,
      borderRadius: 999,
      font: `600 10px ${t.fontUi}`, letterSpacing: 0.5, textTransform: 'uppercase',
      lineHeight: 1,
      boxShadow: active ? `0 4px 12px -6px ${accent.c}` : 'none',
      transition: 'all 0.2s',
    }}>
      <Icon name="play" size={9} color={active ? accent.on : accent.c} filled />
      Sermon
    </button>
  );
}

/**
 * Inline player row meant to be rendered inside the BottomNav pill.
 * The album-art tile is the play/pause button. Progress bar is scrubbable.
 */
export function SermonPlayerRow({
  t, accent, sermon, divider,
}: {
  t: Theme;
  accent: { c: string; on: string };
  sermon: Sermon;
  divider: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(sermon.duration);
  const [scrubPct, setScrubPct] = useState<number | null>(null);

  useEffect(() => {
    setProgress(0);
    setPlaying(true);
  }, [sermon.id]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, sermon.id]);

  const onTime = () => {
    const a = audioRef.current;
    if (!a) return;
    setProgress(a.currentTime);
    if (!Number.isNaN(a.duration) && a.duration > 0) setDuration(a.duration);
  };
  const onEnded = () => { setPlaying(false); setProgress(0); };

  const seekFromEvent = (clientX: number) => {
    const bar = barRef.current;
    if (!bar || duration <= 0) return null;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio;
  };

  const commitSeek = (ratio: number) => {
    const a = audioRef.current;
    if (!a || duration <= 0) return;
    const t2 = ratio * duration;
    a.currentTime = t2;
    setProgress(t2);
  };

  const onBarPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const ratio = seekFromEvent(e.clientX);
    if (ratio != null) setScrubPct(ratio);
  };
  const onBarPointerMove = (e: React.PointerEvent) => {
    if (scrubPct == null) return;
    const ratio = seekFromEvent(e.clientX);
    if (ratio != null) setScrubPct(ratio);
  };
  const onBarPointerUp = (e: React.PointerEvent) => {
    if (scrubPct != null) {
      const ratio = seekFromEvent(e.clientX) ?? scrubPct;
      commitSeek(ratio);
      setScrubPct(null);
    }
  };

  const liveRatio = scrubPct != null
    ? scrubPct
    : (duration > 0 ? progress / duration : 0);
  const pct = Math.min(100, Math.max(0, liveRatio * 100));
  const displayedProgress = scrubPct != null ? scrubPct * duration : progress;

  const onClose = () => setUiState({ activeSermon: null });

  const onShare = () => {
    const url = `https://aaronweaver.github.io/bible/bible?sermon=${sermon.id}`;
    const text = `${sermon.title} — a sermon by ${sermon.pastor} on ${sermon.book} ${sermon.chapter}:${sermon.verseStart}${sermon.verseEnd !== sermon.verseStart ? `-${sermon.verseEnd}` : ''}`;
    if (navigator.share) {
      navigator.share({ title: sermon.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={sermon.audioUrl}
        preload="metadata"
        onTimeUpdate={onTime}
        onLoadedMetadata={onTime}
        onEnded={onEnded}
      />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
      }}>
        {/* Album-art tile doubles as play/pause */}
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `linear-gradient(135deg, ${accent.c}, ${accent.c}cc)`,
            color: accent.on, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 14px -8px ${accent.c}`,
          }}
        >
          {playing
            ? <Icon name="pause" size={18} color={accent.on} />
            : <Icon name="play" size={18} color={accent.on} filled />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            font: `500 14px/1.2 ${t.fontDisplay}`, color: t.ink,
            letterSpacing: -0.1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sermon.title}
          </div>
          <div style={{
            font: `12px ${t.fontBody}`, color: t.inkSoft, marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sermon.pastor} · {sermon.book} {sermon.chapter}:{sermon.verseStart}
            {sermon.verseEnd !== sermon.verseStart ? `–${sermon.verseEnd}` : ''}
          </div>

          {/* Scrubbable progress bar */}
          <div
            ref={barRef}
            onPointerDown={onBarPointerDown}
            onPointerMove={onBarPointerMove}
            onPointerUp={onBarPointerUp}
            onPointerCancel={onBarPointerUp}
            style={{
              marginTop: 6, padding: '6px 0', cursor: 'pointer',
              touchAction: 'none',
            }}
          >
            <div style={{
              position: 'relative', height: 3, borderRadius: 2,
              background: t.statusDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0,
                width: `${Math.max(pct, 1.5)}%`,
                background: accent.c, borderRadius: 2,
              }} />
              <div style={{
                position: 'absolute', top: '50%', left: `${pct}%`,
                width: 12, height: 12, borderRadius: 6,
                background: accent.c,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 2px 6px -1px ${accent.c}aa`,
                transition: scrubPct == null ? 'left 0.1s linear' : 'none',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              font: `10px ${t.fontUi}`, color: t.inkMute, marginTop: 4, letterSpacing: 0.3,
            }}>
              <span>{fmt(displayedProgress)}</span>
              <span>−{fmt(Math.max(0, duration - displayedProgress))}</span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          alignSelf: 'stretch', justifyContent: 'space-between', paddingTop: 2,
        }}>
          <button
            onClick={onClose}
            aria-label="Close player"
            style={{
              width: 28, height: 28, borderRadius: 14, flexShrink: 0,
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.inkMute,
            }}
          >
            <Icon name="close" size={16} color={t.inkMute} />
          </button>
          <button
            onClick={onShare}
            aria-label="Share sermon"
            style={{
              width: 28, height: 28, borderRadius: 14, flexShrink: 0,
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.inkSoft,
            }}
          >
            <Icon name="share" size={15} color={t.inkSoft} />
          </button>
        </div>
      </div>

      <div style={{ height: 0.5, background: divider, margin: '0 14px' }} />
    </>
  );
}
