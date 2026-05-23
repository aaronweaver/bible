import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar, CircleBtn, DarkToggle } from '../components/TopBar';
import { Icon } from '../icons';
import { BIBLE_BOOKS, getChapterBlocks, getVerseCount, formatBookTitle, isNumberedBook, type Block } from '../data/bible';
import { useAppState, useTheme } from '../hooks/useAppState';

export function Bible({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const { state, toggleHighlight, update } = useAppState();
  const { dark, toggleDark } = useTheme();
  const fontScale = state.prefs.fontScale / 100;
  const location = useLocation();
  const navigate = useNavigate();
  const nav = location.state as {
    book?: string; chapter?: number; verse?: number;
    returnTo?: string; returnLabel?: string;
    openPicker?: boolean;
  } | null;

  const initial = nav?.book ? { book: nav.book, chapter: nav.chapter ?? 1 } : (state.lastRead ?? { book: 'John', chapter: 3 });
  const [book, setBook] = useState(initial.book);
  const [chapter, setChapter] = useState(initial.chapter);
  const verseRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [targetVerse, setTargetVerse] = useState<number | null>(null);

  const verseCount = blocks.reduce((s, b) => s + b.verses.length, 0);
  const key = `${book} ${chapter}`;
  const highlighted = new Set(state.bibleHighlights[key] ?? []);

  useEffect(() => {
    let alive = true;
    getChapterBlocks(book, chapter).then((b) => { if (alive) setBlocks(b); });
    update({ lastRead: { book, chapter } });
    return () => { alive = false; };
  }, [book, chapter]);

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
    const v = targetVerse ?? nav?.verse;
    if (!v || verseCount === 0) return;
    const el = verseRefs.current[v];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTargetVerse(null);
    }
  }, [verseCount, targetVerse, nav?.verse]);

  const maxChapter = BIBLE_BOOKS.find((b) => b.name === book)?.chapters ?? 1;
  const prevChapter = () => { if (chapter > 1) { setChapter(chapter - 1); window.scrollTo(0, 0); } };
  const nextChapter = () => { if (chapter < maxChapter) { setChapter(chapter + 1); window.scrollTo(0, 0); } };

  const handleNavigate = ({ book: b, chapter: c, verse: v }: { book: string; chapter: number; verse: number }) => {
    setBook(b);
    setChapter(c);
    setTargetVerse(v);
    setShowPicker(false);
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      <TopBar t={t} eyebrow="Bible"
        right={<DarkToggle t={t} darkMode={dark} onToggle={toggleDark} />} />

      {nav?.returnTo && (
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

      {verseCount === 0 ? (
        <div style={{ padding: 22, font: `15px ${t.fontBody}`, color: t.inkSoft }}>
          Loading…
        </div>
      ) : (
        <div style={{ padding: '12px 22px 20px', color: t.ink }}>
          {blocks.map((block, bi) => (
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
                  const isHL = highlighted.has(num);
                  return (
                    <span key={num}
                      ref={(el) => { verseRefs.current[num] = el; }}
                      onClick={() => toggleHighlight(key, num)} style={{
                        cursor: 'pointer',
                        background: isHL
                          ? (dark ? '#fbbf2455' : `${accent.c}66`)
                          : (nav?.verse === num ? (dark ? '#fbbf2433' : `${accent.c}44`) : 'transparent'),
                        borderRadius: 3, padding: '1px 2px', transition: 'background 0.15s',
                      }}>
                      <sup style={{
                        font: `500 11px ${t.fontUi}`, color: t.inkMute,
                        marginRight: 4, verticalAlign: 'super', letterSpacing: 0.4,
                      }}>{num}</sup>
                      {text}{' '}
                    </span>
                  );
                })}
              </p>
            </React.Fragment>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 22px 0' }}>
        <button onClick={prevChapter} disabled={chapter <= 1} style={btn(t, chapter <= 1)}>
          <Icon name="chev-l" size={16} color={t.inkSoft} /> Prev
        </button>
        <button onClick={nextChapter} disabled={chapter >= maxChapter} style={btn(t, chapter >= maxChapter)}>
          Next <Icon name="chev-r" size={16} color={t.inkSoft} />
        </button>
      </div>

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

function btn(t: Theme, disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6,
    background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: 20,
    padding: '8px 14px', color: t.ink, font: `14px ${t.fontBody}`,
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
  };
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
  const [step, setStep] = useState<PickerStep>('book');
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
