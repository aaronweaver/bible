import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar, CircleBtn, DarkToggle } from '../components/TopBar';
import { Icon } from '../icons';
import { BIBLE_BOOKS, getChapterBlocks, getVerseCount, formatBookTitle, isNumberedBook, type Block } from '../data/bible';
import type { Reading } from '../data/readingPlans';
import { useAppState, useTheme, HIGHLIGHT_COLORS, type HighlightColor } from '../hooks/useAppState';
import { setUiState } from '../hooks/useUiState';
import { useUiState } from '../hooks/useUiState';
import { PlanCompletionSheet } from '../components/PlanCompletionSheet';
import { SermonBadge } from '../components/SermonPlayer';
import { getSermonsForChapter, SERMONS, type Sermon } from '../data/sermons';

export function Bible({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const { state, setHighlight, update, markPlanDayComplete, togglePlanReading } = useAppState();
  const { dark, toggleDark } = useTheme();
  const fontScale = state.prefs.fontScale / 100;
  const location = useLocation();
  const navigate = useNavigate();
  const nav = location.state as {
    book?: string; chapter?: number; verse?: number;
    startVerse?: number; endVerse?: number;
    returnTo?: string; returnLabel?: string;
    openPicker?: boolean;
    lastReadingBook?: string; lastReadingChapter?: number;
    planId?: string; planDay?: number; planTotalDays?: number;
    planAccentIndex?: number; planTitle?: string;
    planReadings?: Reading[]; planReadingIdx?: number;
  } | null;

  const sharedSermonId = new URLSearchParams(location.search).get('sermon');
  const sharedSermon = sharedSermonId ? SERMONS.find((s) => s.id === sharedSermonId) : undefined;
  const initial = sharedSermon
    ? { book: sharedSermon.book, chapter: sharedSermon.chapter }
    : nav?.book ? { book: nav.book, chapter: nav.chapter ?? 1 } : (state.lastRead ?? { book: 'John', chapter: 3 });
  const [book, setBook] = useState(initial.book);
  const [chapter, setChapter] = useState(initial.chapter);
  const verseRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const programmaticScroll = useRef(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [flashVerse, setFlashVerse] = useState<number | null>(null);
  const [immersive, setImmersive] = useState(false);
  const { activeSermon } = useUiState();
  const chapterSermons = React.useMemo(() => getSermonsForChapter(book, chapter), [book, chapter]);
  const sermonByStartVerse = React.useMemo(() => {
    const m: Record<number, Sermon> = {};
    chapterSermons.forEach((s) => { m[s.verseStart] = s; });
    return m;
  }, [chapterSermons]);
  const verseInActiveSermon = (v: number) =>
    activeSermon && activeSermon.book === book && activeSermon.chapter === chapter
      && v >= activeSermon.verseStart && v <= activeSermon.verseEnd;

  // When opened via a shared ?sermon=<id> link, auto-load the player + scroll to the passage
  useEffect(() => {
    if (!sharedSermon) return;
    // Defer to next tick so other mount effects (bibleNav) settle first
    const tid = setTimeout(() => {
      setUiState({ activeSermon: sharedSermon });
      setTargetVerse(sharedSermon.verseStart);
      const url = window.location.pathname + window.location.hash;
      window.history.replaceState(window.history.state, '', url);
    }, 0);
    return () => clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-close player if user navigates to a different chapter than the sermon
  useEffect(() => {
    if (activeSermon && (activeSermon.book !== book || activeSermon.chapter !== chapter)) {
      setUiState({ activeSermon: null });
    }
  }, [book, chapter, activeSermon]);

  const toggleSermon = (s: Sermon) => {
    setUiState({ activeSermon: activeSermon && activeSermon.id === s.id ? null : s });
  };

  const key = `${book} ${chapter}`;
  const highlighted = React.useMemo(
    () => state.bibleHighlights[key] ?? {},
    [state.bibleHighlights, key]
  );
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const toggleSelect = (num: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };
  const clearSelection = () => setSelectedVerses(new Set());

  // Clear selection when chapter changes
  useEffect(() => { clearSelection(); }, [book, chapter]);

  const displayBlocks = React.useMemo(
    () => (nav?.startVerse && nav?.endVerse)
      ? blocks
          .map(b => ({ ...b, verses: b.verses.filter(v => v.num >= nav.startVerse! && v.num <= nav.endVerse!) }))
          .filter(b => b.verses.length > 0)
      : blocks,
    [blocks, nav?.startVerse, nav?.endVerse]
  );
  const verseCount = displayBlocks.reduce((s, b) => s + b.verses.length, 0);

  // Publish selection to UI state so BottomNav can render highlight controls
  useEffect(() => {
    const versesInOrder = [...selectedVerses].sort((a, b) => a - b);
    if (versesInOrder.length === 0) {
      setUiState({ verseSelection: null });
      return;
    }
    const verseMap: Record<number, string> = {};
    displayBlocks.forEach(b => b.verses.forEach(v => { verseMap[v.num] = v.text; }));
    const present = versesInOrder.filter(n => verseMap[n] != null);
    if (present.length === 0) {
      setUiState({ verseSelection: null });
      return;
    }

    // Compact verse range: "1-3, 5"
    const ranges: string[] = [];
    let start = present[0], prev = start;
    for (let i = 1; i < present.length; i++) {
      const n = present[i];
      if (n === prev + 1) { prev = n; continue; }
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = n; prev = n;
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    const reference = `${formatBookTitle(book)} ${chapter}:${ranges.join(', ')}`;
    const combinedText = present.map(n => `${n} ${verseMap[n]}`).join(' ');
    const shareUrl = `https://aaronweaver.github.io/bible/?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${present[0]}`;

    const colors = present.map(n => highlighted[n]).filter(Boolean) as HighlightColor[];
    const allSame = colors.length === present.length && colors.every(c => c === colors[0]);
    const currentColor: HighlightColor | null = allSame && colors.length > 0 ? colors[0] : null;
    setUiState({
      verseSelection: {
        count: present.length,
        currentColor,
        reference,
        combinedText,
        shareUrl,
        onPickColor: (c) => {
          present.forEach(n => setHighlight(key, n, c));
          clearSelection();
        },
        onClose: clearSelection,
      },
    });
    return () => { setUiState({ verseSelection: null }); };
  }, [selectedVerses, key, highlighted, displayBlocks, book, chapter]);

  useEffect(() => {
    let alive = true;
    getChapterBlocks(book, chapter).then((b) => { if (alive) setBlocks(b); });
    update({ lastRead: { book, chapter } });
    return () => { alive = false; };
  }, [book, chapter]);

  // While reading a plan, mark each chapter complete as the user moves through it.
  const prevPlanChapter = useRef<{ book: string; chapter: number } | null>(null);
  useEffect(() => {
    if (!nav?.planId || !nav.planReadings || nav.planDay == null || nav.planTotalDays == null) {
      prevPlanChapter.current = null;
      return;
    }
    const prev = prevPlanChapter.current;
    if (prev && (prev.book !== book || prev.chapter !== chapter)) {
      const idx = nav.planReadings.findIndex(r => r.book === prev.book && r.chapter === prev.chapter);
      if (idx >= 0) {
        togglePlanReading(nav.planId, nav.planDay, idx, nav.planReadings.length, nav.planTotalDays, true);
      }
    }
    prevPlanChapter.current = { book, chapter };
  }, [book, chapter, nav?.planId, nav?.planDay, nav?.planTotalDays, nav?.planReadings]);

  // Respond to incoming nav (e.g. tapped a verse blockquote in a lesson, or re-tapped Bible tab)
  useEffect(() => {
    if (nav?.openPicker) { setShowPicker(true); return; }
    if (nav?.book && (nav.book !== book || (nav.chapter ?? 1) !== chapter)) {
      setBook(nav.book);
      setChapter(nav.chapter ?? 1);
    }
  }, [location.key]);

  // Scroll to target verse once blocks are loaded
  useEffect(() => {
    const v = targetVerse ?? nav?.verse ?? nav?.startVerse;
    if (!v || verseCount === 0) return;
    const el = verseRefs.current[v];
    if (el) {
      programmaticScroll.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFlashVerse(v);
      setTimeout(() => {
        setFlashVerse(null);
        programmaticScroll.current = false;
      }, 1200);
      setTargetVerse(null);
    }
  }, [verseCount, targetVerse, nav?.verse, nav?.startVerse]);

  // Immersive mode: hide tabs while scrolling down; restore on scroll up or at top.
  // Direction deadband + post-flip lockout prevents jitter when the menu's
  // open/close animation reshuffles layout and re-fires scroll events.
  const immersiveRef = useRef(false);
  useEffect(() => {
    let lastY = window.scrollY;
    let dir = 0;
    let dirStartY = lastY;
    let lockUntil = 0;
    const FLIP_PX = 12;
    const LOCK_MS = 350;

    const setImm = (v: boolean) => {
      immersiveRef.current = v;
      setImmersive(v);
      setUiState({ immersive: v });
      lockUntil = performance.now() + LOCK_MS;
    };

    const onScroll = () => {
      if (programmaticScroll.current) return;
      const now = performance.now();
      const y = Math.max(0, window.scrollY);
      const prevY = lastY;
      lastY = y;
      const dy = y - prevY;
      if (dy === 0) return;

      if (y < 40) {
        if (immersiveRef.current && now >= lockUntil) setImm(false);
        dir = 0;
        dirStartY = y;
        return;
      }

      if (now < lockUntil) return;

      const d = dy > 0 ? 1 : -1;
      if (d !== dir) { dir = d; dirStartY = prevY; }
      const moved = Math.abs(y - dirStartY);
      if (moved < FLIP_PX) return;

      if (d > 0 && !immersiveRef.current) setImm(true);
      else if (d < 0 && immersiveRef.current) setImm(false);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      immersiveRef.current = false;
      setUiState({ immersive: false, bibleNav: null });
    };
  }, []);

  const bookIdx = BIBLE_BOOKS.findIndex((b) => b.name === book);
  const maxChapter = BIBLE_BOOKS[bookIdx]?.chapters ?? 1;

  const goTo = (b: string, c: number) => { setBook(b); setChapter(c); window.scrollTo(0, 0); };

  // Index of the currently-shown chapter within the active plan reading list (if any)
  const planReadingIdx = nav?.planReadings
    ? nav.planReadings.findIndex(r => r.book === book && r.chapter === chapter)
    : -1;
  // Currently reading a chapter that belongs to the active plan day's selection.
  const inPlanReadings = !!nav?.planId && !!nav?.planReadings && planReadingIdx >= 0;

  // Within a plan, Prev/Next walk the day's reading selection (not adjacent chapters).
  const canPrev = inPlanReadings ? planReadingIdx > 0 : (chapter > 1 || bookIdx > 0);
  const canNext = inPlanReadings ? true : (chapter < maxChapter || bookIdx < BIBLE_BOOKS.length - 1);

  const finishReadingSelection = () => {
    if (!nav?.planId || nav.planDay == null || nav.planTotalDays == null) return;
    const alreadyDone = state.readingPlans[nav.planId]?.completedDays?.includes(nav.planDay) ?? false;
    if (!alreadyDone) {
      markPlanDayComplete(nav.planId, nav.planDay, nav.planTotalDays, nav.planReadings?.length);
    }
    setShowCompletion(true);
  };

  const prevChapter = () => {
    if (inPlanReadings) {
      if (planReadingIdx > 0) {
        const r = nav!.planReadings![planReadingIdx - 1];
        goTo(r.book, r.chapter);
      }
      return;
    }
    if (chapter > 1) { goTo(book, chapter - 1); return; }
    const pb = BIBLE_BOOKS[bookIdx - 1];
    if (pb) goTo(pb.name, pb.chapters);
  };

  const nextChapter = () => {
    if (inPlanReadings) {
      const readings = nav!.planReadings!;
      if (planReadingIdx < readings.length - 1) {
        const r = readings[planReadingIdx + 1];
        goTo(r.book, r.chapter);
      } else {
        // End of the day's reading selection — show the completion sheet.
        finishReadingSelection();
      }
      return;
    }
    if (chapter < maxChapter) { goTo(book, chapter + 1); return; }
    const nb = BIBLE_BOOKS[bookIdx + 1];
    if (nb) goTo(nb.name, 1);
  };

  // Keep bibleNav in sync so BottomNav can render the chapter bar
  useEffect(() => {
    setUiState({
      bibleNav: {
        book, chapter, maxChapter, canPrev, canNext,
        onPrev: prevChapter,
        onNext: nextChapter,
        onPicker: () => setShowPicker(true),
      },
    });
  }, [book, chapter, maxChapter, canPrev, canNext]);

  const handleNavigate = ({ book: b, chapter: c, verse: v }: { book: string; chapter: number; verse: number }) => {
    setBook(b);
    setChapter(c);
    setTargetVerse(v);
    setShowPicker(false);
  };

  const verseLayout = state.prefs.verseLayout ?? 'paragraph';

  const inPlan = !!nav?.planId && nav.planDay != null && nav.planTotalDays != null;
  const planColor = inPlan ? t.palette[nav!.planAccentIndex ?? 0] : t.ink;
  const planReadingsCount = nav?.planReadings?.length ?? 0;
  // Current reading position within the day (1-based), so it reads 1/3 not 0/3.
  const planReadingPos = planReadingIdx >= 0 ? planReadingIdx + 1 : 1;

  return (
    <div style={{ paddingBottom: 24 }}>
      {inPlan && (
        <div
          className="safe-top"
          style={{
            position: 'sticky', top: 0, zIndex: 30,
            background: t.bg,
            borderBottom: `0.5px solid ${t.rule}`,
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <button
            onClick={() => navigate(nav!.returnTo!)}
            aria-label="Back to plan"
            style={{
              background: 'none', border: 'none', padding: 6,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              color: planColor,
            }}
          >
            <Icon name="chev-l" size={20} color={planColor} />
          </button>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            font: `600 13px ${t.fontUi}`, color: planColor,
            letterSpacing: 0.3, textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            <span>Day {nav!.planDay} of {nav!.planTotalDays}</span>
            {nav!.planTitle && (
              <span style={{
                color: t.inkMute, textTransform: 'none',
                font: `italic 13px ${t.fontBody}`, letterSpacing: 0,
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                · {nav!.planTitle}
              </span>
            )}
          </div>
          {planReadingsCount > 0 && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: `${planColor}14`, color: planColor,
              font: `600 12px ${t.fontUi}`,
            }}>
              {planReadingPos}/{planReadingsCount}
            </div>
          )}
        </div>
      )}

      <div style={{
        overflow: 'hidden',
        opacity: immersive ? 0 : 1,
        maxHeight: immersive ? 0 : 200,
        transition: 'opacity 0.25s ease, max-height 0.3s ease',
        pointerEvents: immersive ? 'none' : 'auto',
      }}>
        {!inPlan && (
          <TopBar t={t} eyebrow="Bible"
            right={<DarkToggle t={t} darkMode={dark} onToggle={toggleDark} />} />
        )}

        <div style={{ padding: '0 22px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowPicker(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: t.ink, font: `400 30px ${t.fontDisplay}`, letterSpacing: -0.4,
          }}>
            <span>{formatBookTitle(book)}</span>
            {' '}{chapter}
            <Icon name="chev-d" size={20} color={t.inkSoft} />
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <CircleBtn t={t}><Icon name="search" size={16} color={t.inkSoft} /></CircleBtn>
            <CircleBtn t={t}><Icon name="settings" size={16} color={t.inkSoft} /></CircleBtn>
          </div>
        </div>

        {chapterSermons.length > 0 && (
          <div style={{ padding: '4px 22px 0' }}>
            {chapterSermons.map((s) => {
              const isActive = !!(activeSermon && activeSermon.id === s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSermon(s)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: isActive ? accent.c : `${accent.c}14`,
                    color: isActive ? accent.on : accent.c,
                    border: 'none', cursor: 'pointer',
                    padding: '7px 14px 7px 10px',
                    borderRadius: 999,
                    font: `600 12px ${t.fontUi}`, letterSpacing: 0.2,
                  }}
                >
                  <Icon name="play" size={12} color={isActive ? accent.on : accent.c} filled />
                  {isActive ? 'Now playing: ' : 'Sermon available: '}{s.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {nav?.returnTo && !inPlan && (
        <button
          onClick={() => navigate(nav.returnTo!)}
          style={{
            position: 'fixed', bottom: 100, left: '50%',
            transform: 'translateX(-50%)', zIndex: 35,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 16px 10px 12px', borderRadius: 999,
            background: accent.c, color: accent.on, border: 'none',
            font: `600 13px ${t.fontUi}`, cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: `0 14px 30px -10px ${accent.c}aa, 0 2px 6px -2px rgba(0,0,0,0.2)`,
          }}
        >
          <Icon name="chev-l" size={14} color={accent.on} />
          {nav.returnLabel || 'Back'}
        </button>
      )}

      {verseCount === 0 ? (
        <div style={{ padding: 22, font: `15px ${t.fontBody}`, color: t.inkSoft }}>
          Loading…
        </div>
      ) : (
        <div style={{ padding: '12px 22px 20px', color: t.ink }}>
          {verseLayout === 'verse' ? (
            displayBlocks.map((block, bi) => (
              <React.Fragment key={bi}>
                {block.title && (
                  <h2 style={{
                    margin: '24px 0 10px',
                    font: `500 18px/1.25 ${t.fontDisplay}`,
                    color: t.ink, letterSpacing: -0.2,
                  }}>{block.title}</h2>
                )}
                {block.verses.map(({ num, text }) => {
                  const hlColor = highlighted[num] as HighlightColor | undefined;
                  const isHL = !!hlColor;
                  const hlHex = hlColor ? HIGHLIGHT_COLORS[hlColor] : null;
                  const isSelected = selectedVerses.has(num);
                  const sermonHere = sermonByStartVerse[num];
                  const inActive = verseInActiveSermon(num);
                  return (
                    <div key={num}
                      ref={(el) => { verseRefs.current[num] = el; }}
                      onClick={() => toggleSelect(num)}
                      style={{
                        display: 'flex', gap: 14,
                        alignItems: 'flex-start', cursor: 'pointer',
                        background: flashVerse === num
                          ? (hlHex ? `${hlHex}55` : (dark ? '#fbbf2422' : `${accent.c}22`))
                          : isHL
                            ? `${hlHex}33`
                            : inActive
                              ? `${accent.c}10`
                              : (nav?.verse === num ? (dark ? '#fbbf2412' : `${accent.c}12`) : 'transparent'),
                        borderRadius: 4, margin: '0 -4px', padding: '5px 4px',
                        transition: 'background 0.15s',
                      }}>
                      <span style={{
                        font: `500 11px ${t.fontUi}`, color: t.inkMute,
                        minWidth: 22, textAlign: 'right', paddingTop: `${3 * fontScale}px`,
                        flexShrink: 0, letterSpacing: 0.3,
                      }}>{num}</span>
                      <span style={{
                        flex: 1, font: `400 ${17 * fontScale}px/1.65 ${t.fontBody}`,
                        textDecorationLine: (isHL || isSelected) ? 'underline' : 'none',
                        textDecorationStyle: isSelected && !isHL ? 'dotted' : 'solid',
                        textDecorationColor: isHL && hlHex ? hlHex : (isSelected ? accent.c : undefined),
                        textDecorationThickness: (isHL || isSelected) ? 2 : undefined,
                        textUnderlineOffset: 4,
                      }}>
                        {sermonHere && (
                          <SermonBadge
                            t={t} accent={accent} sermon={sermonHere}
                            active={!!(activeSermon && activeSermon.id === sermonHere.id)}
                            onClick={(e) => { e.stopPropagation(); toggleSermon(sermonHere); }}
                          />
                        )}
                        {text}
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))
          ) : (
            displayBlocks.map((block, bi) => (
              <React.Fragment key={bi}>
                {block.title && (
                  <h2 style={{
                    margin: '24px 0 10px',
                    font: `500 18px/1.25 ${t.fontDisplay}`,
                    color: t.ink, letterSpacing: -0.2,
                  }}>{block.title}</h2>
                )}
                <p style={{
                  margin: '0 0 14px',
                  font: `400 ${17 * fontScale}px/1.7 ${t.fontBody}`,
                  textAlign: 'left',
                }}>
                  {block.verses.map(({ num, text }) => {
                    const hlColor = highlighted[num] as HighlightColor | undefined;
                    const isHL = !!hlColor;
                    const hlHex = hlColor ? HIGHLIGHT_COLORS[hlColor] : null;
                    const isSelected = selectedVerses.has(num);
                    const sermonHere = sermonByStartVerse[num];
                    const inActive = verseInActiveSermon(num);
                    return (
                      <span key={num}
                        ref={(el) => { verseRefs.current[num] = el; }}
                        onClick={() => toggleSelect(num)} style={{
                          cursor: 'pointer',
                          background: flashVerse === num
                            ? (hlHex ? `${hlHex}88` : (dark ? '#fbbf2488' : `${accent.c}aa`))
                            : isHL
                              ? `${hlHex}55`
                              : inActive
                                ? `${accent.c}18`
                                : (nav?.verse === num ? (dark ? '#fbbf2433' : `${accent.c}44`) : 'transparent'),
                          textDecorationLine: (isHL || isSelected) ? 'underline' : 'none',
                          textDecorationStyle: isSelected && !isHL ? 'dotted' : 'solid',
                          textDecorationColor: isHL && hlHex ? hlHex : (isSelected ? accent.c : undefined),
                          textDecorationThickness: (isHL || isSelected) ? 2 : undefined,
                          textUnderlineOffset: 4,
                          borderRadius: 3, padding: '1px 2px', transition: 'background 0.15s',
                        }}>
                        <sup style={{
                          font: `500 11px ${t.fontUi}`, color: t.inkMute,
                          marginRight: 4, verticalAlign: 'super', letterSpacing: 0.4,
                        }}>{num}</sup>
                        {sermonHere && (
                          <SermonBadge
                            t={t} accent={accent} sermon={sermonHere}
                            active={!!(activeSermon && activeSermon.id === sermonHere.id)}
                            onClick={(e) => { e.stopPropagation(); toggleSermon(sermonHere); }}
                          />
                        )}
                        {text}{' '}
                      </span>
                    );
                  })}
                </p>
              </React.Fragment>
            ))
          )}
        </div>
      )}


      {/* Plan day completion — shown only when on the last chapter of the day */}
      {nav?.planId && nav.planDay != null && nav.planTotalDays != null &&
        nav.lastReadingBook === book && nav.lastReadingChapter === chapter && (() => {
        const planColor = t.palette[nav.planAccentIndex ?? 0];
        const alreadyDone = state.readingPlans[nav.planId]?.completedDays?.includes(nav.planDay) ?? false;
        return (
          <div style={{ margin: '24px 22px 0', padding: '18px 20px', background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius }}>
            {!alreadyDone ? (
              <>
                <button
                  onClick={() => {
                    markPlanDayComplete(nav.planId!, nav.planDay!, nav.planTotalDays!, nav.planReadings?.length);
                    setShowCompletion(true);
                  }}
                  style={{
                    width: '100%', background: planColor, color: '#fff',
                    border: 'none', borderRadius: 12, padding: '15px',
                    font: `600 16px ${t.fontUi}`, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: `0 8px 24px -10px ${planColor}99`,
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 11,
                    border: '2px solid rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="check" size={12} stroke={2.5} color="rgba(255,255,255,0.7)" />
                  </div>
                  Mark Day {nav.planDay} Complete
                </button>
                <div style={{ marginTop: 8, font: `12px ${t.fontBody}`, color: t.inkMute, textAlign: 'center' }}>
                  {nav.planTitle} · Day {nav.planDay} of {nav.planTotalDays}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                  background: `${planColor}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="check" size={16} stroke={2.2} color={planColor} />
                </div>
                <div>
                  <div style={{ font: `600 14px ${t.fontUi}`, color: planColor }}>Day {nav.planDay} complete</div>
                  <button
                    onClick={() => navigate(nav.returnTo!)}
                    style={{
                      marginTop: 4, background: 'none', border: 'none', padding: 0,
                      font: `13px ${t.fontBody}`, color: t.inkSoft, cursor: 'pointer',
                    }}
                  >
                    ← Back to {nav.returnLabel}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {showCompletion && nav?.planId && nav.planDay != null && nav.planTotalDays != null && (
        <PlanCompletionSheet
          t={t}
          accentColor={t.palette[nav.planAccentIndex ?? 0]}
          planTitle={nav.planTitle ?? ''}
          totalDays={nav.planTotalDays}
          dayNum={nav.planDay}
          onNext={nav.planDay < nav.planTotalDays
            ? () => { setShowCompletion(false); navigate(nav.returnTo!); }
            : undefined}
          onClose={() => { setShowCompletion(false); navigate(nav.returnTo!); }}
        />
      )}

      {showPicker && (
        <NavigationPicker
          t={t} accent={accent}
          initialBook={book} initialChapter={chapter}
          onNavigate={handleNavigate}
          onClose={() => setShowPicker(false)}
        />
      )}


    </div>
  );
}


type PickerStep = 'book' | 'chapter' | 'verse';

function NavigationPicker({ t, accent, initialBook, initialChapter, onNavigate, onClose }: {
  t: Theme;
  accent: { c: string; on: string };
  initialBook: string;
  initialChapter: number;
  onNavigate: (nav: { book: string; chapter: number; verse: number }) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<PickerStep>('chapter');
  const [pickerBook, setPickerBook] = useState(initialBook);
  const [pickerChapter, setPickerChapter] = useState(initialChapter);
  const [verseCount, setVerseCount] = useState(0);

  const maxChapter = BIBLE_BOOKS.find((b) => b.name === pickerBook)?.chapters ?? 1;

  const pickBook = (b: string) => {
    setPickerBook(b);
    setPickerChapter(1);
    setStep('chapter');
  };

  const pickChapter = async (c: number) => {
    setPickerChapter(c);
    const count = await getVerseCount(pickerBook, c);
    setVerseCount(count);
    setStep('verse');
  };

  const pickVerse = (v: number) => {
    onNavigate({ book: pickerBook, chapter: pickerChapter, verse: v });
  };

  const sheetStyle: React.CSSProperties = {
    width: '100%', background: t.bg, borderRadius: '20px 20px 0 0',
    maxHeight: '80%', overflow: 'auto', padding: '12px 0 40px',
  };

  const headerStyle: React.CSSProperties = {
    padding: '0 22px 12px',
    display: 'flex', alignItems: 'center', gap: 10,
  };

  const backBtn: React.CSSProperties = {
    background: 'none', border: 'none', padding: 4,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    color: accent.c,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 10,
    padding: '4px 22px',
  };

  const numBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? accent.c : t.paper,
    border: `0.5px solid ${active ? accent.c : t.paperEdge}`,
    borderRadius: 12,
    color: active ? accent.on : t.ink,
    font: `500 16px ${t.fontUi}`,
    padding: '14px 0',
    cursor: 'pointer',
    textAlign: 'center',
  });

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: t.overlay, zIndex: 40,
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={sheetStyle}>
        <div style={{ width: 36, height: 4, background: t.rule, borderRadius: 2, margin: '8px auto 14px' }} />

        {step === 'book' && (
          <>
            <div style={headerStyle}>
              <div style={{ font: `400 22px ${t.fontDisplay}`, color: t.ink, flex: 1 }}>Select book</div>
              <button onClick={onClose} style={{
                background: 'none', border: 'none', color: accent.c,
                font: `15px ${t.fontUi}`, cursor: 'pointer',
              }}>Done</button>
            </div>
            <div>
              {BIBLE_BOOKS.map((b, i) => (
                <div key={b.name} onClick={() => pickBook(b.name)} style={{
                  padding: '14px 22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderTop: i ? `0.5px solid ${t.rule}` : 'none',
                  background: b.name === pickerBook ? t.chip : 'transparent',
                  cursor: 'pointer',
                }}>
                  <div style={{ font: `400 18px ${t.fontDisplay}`, color: t.ink }}>
                    {formatBookTitle(b.name)}
                  </div>
                  <div style={{ font: `12px ${t.fontUi}`, color: t.inkMute }}>{b.chapters} ch</div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 'chapter' && (
          <>
            <div style={headerStyle}>
              <button style={backBtn} onClick={() => setStep('book')}>
                <Icon name="chev-l" size={18} color={accent.c} />
              </button>
              <div style={{ font: `400 22px ${t.fontDisplay}`, color: t.ink, flex: 1 }}>
                {formatBookTitle(pickerBook)}
              </div>
            </div>
            <div style={gridStyle}>
              {Array.from({ length: maxChapter }, (_, i) => i + 1).map((c) => (
                <button key={c} style={numBtnStyle(c === pickerChapter)} onClick={() => pickChapter(c)}>
                  {c}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'verse' && (
          <>
            <div style={headerStyle}>
              <button style={backBtn} onClick={() => setStep('chapter')}>
                <Icon name="chev-l" size={18} color={accent.c} />
              </button>
              <div style={{ font: `400 22px ${t.fontDisplay}`, color: t.ink, flex: 1 }}>
                {formatBookTitle(pickerBook)}{' '}{pickerChapter}
              </div>
            </div>
            <div style={gridStyle}>
              {verseCount === 0
                ? <div style={{ gridColumn: '1/-1', padding: 12, color: t.inkSoft, font: `14px ${t.fontBody}` }}>Loading…</div>
                : Array.from({ length: verseCount }, (_, i) => i + 1).map((v) => (
                    <button key={v} style={numBtnStyle(false)} onClick={() => pickVerse(v)}>
                      {v}
                    </button>
                  ))
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}
