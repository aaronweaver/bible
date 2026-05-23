import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar, CircleBtn } from '../components/TopBar';
import { Icon } from '../icons';
import { LESSONS, parseVerseRef, type LessonSection, type Question, type QChoice } from '../data/lessons';
import { useAppState } from '../hooks/useAppState';

// Same regex used by the converter; kept simple — book names with optional
// leading digit, ch:verse(-end). Used at render time to linkify body text.
const INLINE_REF_RX = /\b((?:(?:III|II|I|[123])\s+)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+\d+:\d+(?:-\d+)?)/g;

function LinkedText({
  text, accent, onRef,
}: { text: string; accent: { c: string; on: string }; onRef: (ref: string) => void }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE_REF_RX.lastIndex = 0;
  while ((m = INLINE_REF_RX.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const ref = m[1];
    parts.push(
      <button
        key={`${m.index}-${ref}`}
        type="button"
        onClick={() => onRef(ref)}
        style={{
          background: 'none', border: 'none', padding: 0, margin: 0,
          color: accent.c, font: 'inherit', cursor: 'pointer',
          textDecoration: 'underline', textUnderlineOffset: 2,
          textDecorationColor: `${accent.c}55`,
        }}
      >{ref}</button>,
    );
    last = m.index + ref.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function LessonDetail({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const lessonId = Number(id);
  const lesson = LESSONS.find((l) => l.id === lessonId);
  const { state, updateLesson, setReflection, setAnswer } = useAppState();
  const fontScale = state.prefs.fontScale / 100;

  if (!lesson) {
    return (
      <div style={{ padding: 22 }}>
        <button onClick={() => navigate('/lessons')}>Back</button>
        <p>Lesson not found.</p>
      </div>
    );
  }

  const lp = state.progress[lesson.id] ?? { sectionsDone: 0, reflections: {}, completed: false };
  const totalSections = lesson.sections.length;
  const [readSection, setReadSection] = useState(lp.sectionsDone || 0);

  useEffect(() => {
    if (readSection > (lp.sectionsDone || 0)) updateLesson(lesson.id, { sectionsDone: readSection });
  }, [readSection]);

  // Persist scroll position so a round-trip to the Bible reader returns the
  // user to the exact spot they tapped from.
  const scrollKey = `cornerstone.scroll.lesson.${lesson.id}`;
  useEffect(() => {
    const saved = Number(sessionStorage.getItem(scrollKey) || '0');
    if (saved > 0) {
      // After paint so the layout has settled.
      requestAnimationFrame(() => window.scrollTo(0, saved));
    }
    const onScroll = () => {
      sessionStorage.setItem(scrollKey, String(window.scrollY));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollKey]);

  const markComplete = () => updateLesson(lesson.id, { completed: true, sectionsDone: totalSections });
  const undo = () => updateLesson(lesson.id, { completed: false });

  return (
    <div style={{ paddingBottom: 32 }}>
      <TopBar t={t} onBack={() => navigate('/lessons')}
        right={<CircleBtn t={t}><Icon name="bookmark" size={16} color={t.inkSoft} /></CircleBtn>} />

      <div style={{ padding: '6px 22px 0' }}>
        <div style={{ height: 3, borderRadius: 2, background: t.rule, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: accent.c,
            width: `${(readSection / totalSections) * 100}%`, transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <div style={{ padding: '18px 22px 8px' }}>
        <div style={{
          font: `11px ${t.fontUi}`, letterSpacing: 1.6, textTransform: 'uppercase',
          color: accent.c, fontWeight: 600,
        }}>Lesson {lesson.id} · New Believers</div>
        <h1 style={{
          margin: '8px 0 6px', font: `400 36px/1.05 ${t.fontDisplay}`,
          color: t.ink, letterSpacing: -0.6,
        }}>{lesson.title}</h1>
        <div style={{ font: `italic 16px ${t.fontBody}`, color: t.inkSoft, lineHeight: 1.4 }}>
          {lesson.subtitle}
        </div>
        <div style={{
          marginTop: 14, display: 'flex', gap: 14, alignItems: 'center',
          font: `12px ${t.fontUi}`, color: t.inkMute, letterSpacing: 0.3,
        }}>
          <span>~{lesson.minutes} min read</span>
          <span style={{ width: 3, height: 3, borderRadius: 2, background: t.inkMute }} />
          <span>{totalSections} sections</span>
        </div>
      </div>

      <div style={{ height: 1, background: t.rule, margin: '16px 22px 0' }} />

      <div style={{ padding: '8px 22px 0' }}>
        {lesson.sections.map((s, i) => (
          <Section key={i} t={t} accent={accent} fontScale={fontScale}
            idx={i} total={totalSections} section={s} lesson={lesson}
            reflection={lp.reflections?.[i] || ''}
            answers={lp.answers ?? {}}
            onReflect={(v) => setReflection(lesson.id, i, v)}
            onAnswerSlot={(sIdx, qNum, slot, v) => setAnswer(lesson.id, `${sIdx}:${qNum}:${slot}`, v)}
            onView={() => setReadSection((r) => Math.max(r, i + 1))} />
        ))}
      </div>

      <div style={{ padding: '24px 22px 8px' }}>
        {lp.completed ? (() => {
          const nextLesson = LESSONS.find((l) => l.id === lesson.id + 1);
          return (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 12,
              padding: '18px 18px 16px',
              background: t.paper, border: `0.5px solid ${accent.c}`, borderRadius: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 14, background: accent.c, color: accent.on,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="check" size={16} stroke={2.4} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: `400 16px ${t.fontDisplay}`, color: t.ink }}>Lesson complete</div>
                  <div style={{ font: `12px ${t.fontBody}`, color: t.inkSoft }}>
                    {nextLesson ? `Next up: ${nextLesson.title}` : "You've finished the course!"}
                  </div>
                </div>
                <button onClick={undo} style={{
                  background: 'none', border: 'none', color: accent.c,
                  font: `13px ${t.fontUi}`, cursor: 'pointer',
                }}>Undo</button>
              </div>
              {nextLesson ? (
                <button onClick={() => navigate(`/lessons/${nextLesson.id}`)} style={{
                  width: '100%', background: accent.c, color: accent.on, border: 'none',
                  borderRadius: 12, padding: '14px', cursor: 'pointer',
                  font: `600 15px ${t.fontUi}`, letterSpacing: 0.2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  Continue to Lesson {nextLesson.id}: {nextLesson.title}
                  <Icon name="chev-r" size={16} color={accent.on} />
                </button>
              ) : null}
              <button onClick={() => navigate('/lessons')} style={{
                width: '100%', background: 'transparent', color: accent.c,
                border: `1px solid ${accent.c}`,
                borderRadius: 12, padding: '12px', cursor: 'pointer',
                font: `500 14px ${t.fontUi}`,
              }}>Back to all lessons</button>
            </div>
          );
        })() : (
          <button onClick={markComplete} style={{
            width: '100%', background: accent.c, color: accent.on, border: 'none',
            borderRadius: 14, padding: '16px', cursor: 'pointer',
            font: `500 16px ${t.fontUi}`, letterSpacing: 0.2,
            boxShadow: `0 10px 24px -14px ${accent.c}`,
          }}>Mark lesson complete</button>
        )}
      </div>
    </div>
  );
}

function Section({
  t, accent, fontScale, idx, total, section, lesson, reflection, answers,
  onReflect, onAnswerSlot, onView,
}: {
  t: Theme; accent: { c: string; on: string }; fontScale: number; idx: number; total: number;
  section: LessonSection; lesson: { id: number; title: string };
  reflection: string;
  answers: Record<string, string>;
  onReflect: (v: string) => void;
  onAnswerSlot: (sectionIdx: number, qNum: number, slot: string, v: string) => void;
  onView: () => void;
}) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) onView(); },
      { rootMargin: '-30% 0px -50% 0px' });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const openVerse = (ref: string) => {
    const parsed = parseVerseRef(ref);
    if (!parsed) return;
    navigate('/bible', {
      state: {
        ...parsed,
        returnTo: `/lessons/${lesson.id}`,
        returnLabel: `Back to ${lesson.title}`,
      },
    });
  };

  return (
    <div ref={ref} style={{ padding: '22px 0 6px' }}>
      <div style={{
        font: `11px ${t.fontUi}`, letterSpacing: 1.6, textTransform: 'uppercase',
        color: t.inkMute, fontWeight: 600,
      }}>
        {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
      <h2 style={{
        margin: '6px 0 12px', font: `400 24px/1.15 ${t.fontDisplay}`,
        color: t.ink, letterSpacing: -0.3,
      }}>{section.heading}</h2>

      {section.items && section.items.map((item, k) => (
        item.kind === 'p' ? (
          <p key={k} style={{
            margin: '0 0 14px', font: `400 ${16 * fontScale}px/1.6 ${t.fontBody}`, color: t.ink,
          }}>
            <LinkedText text={item.text} accent={accent} onRef={openVerse} />
          </p>
        ) : (
          <button key={k} onClick={() => openVerse(item.ref)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            margin: '14px 0', padding: '14px 16px 14px 18px',
            borderLeft: `2px solid ${accent.c}`,
            borderTop: 'none', borderRight: 'none', borderBottom: 'none',
            background: t.paper, borderRadius: '0 10px 10px 0', cursor: 'pointer',
          }}>
            <p style={{
              margin: 0, font: `400 ${16.5 * fontScale}px/1.55 ${t.fontDisplay}`,
              color: t.ink, letterSpacing: -0.1,
            }}>“{item.text}”</p>
            <div style={{
              marginTop: 8, font: `italic 13px ${t.fontBody}`, color: accent.c, letterSpacing: 0.2,
            }}>— {item.ref} ›</div>
          </button>
        )
      ))}

      {section.questions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          {section.questions.map((q) => (
            <QuestionItem key={q.num} t={t} accent={accent} fontScale={fontScale}
              q={q}
              getAnswer={(slot) => answers[`${idx}:${q.num}:${slot}`] || ''}
              onAnswerSlot={(slot, v) => onAnswerSlot(idx, q.num, slot, v)}
              onRef={openVerse} />
          ))}
        </div>
      )}

      {/* answers above — reflect below */}
      {section.reflect && (
        <div style={{
          marginTop: 8, padding: '16px 16px 12px',
          background: t.paper, border: `0.5px dashed ${t.paperEdge}`, borderRadius: 12,
        }}>
          <div style={{
            font: `11px ${t.fontUi}`, letterSpacing: 1.4, textTransform: 'uppercase',
            color: accent.c, fontWeight: 600, marginBottom: 6,
          }}>Reflect</div>
          <div style={{
            font: `400 ${16 * fontScale}px/1.4 ${t.fontDisplay}`, color: t.ink, marginBottom: 10,
          }}>{section.reflect}</div>
          <textarea
            value={reflection}
            onChange={(e) => onReflect(e.target.value)}
            placeholder="Write your thoughts here…"
            rows={3}
            style={{
              width: '100%', resize: 'vertical', boxSizing: 'border-box',
              background: t.bg, border: `0.5px solid ${t.rule}`, borderRadius: 8,
              padding: '10px 12px', color: t.ink,
              font: `15px/1.5 ${t.fontBody}`, outline: 'none', minHeight: 80,
            }}
            onFocus={(e) => (e.target.style.borderColor = accent.c)}
            onBlur={(e) => (e.target.style.borderColor = t.rule)}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 6,
            font: `11px ${t.fontUi}`, color: t.inkMute,
          }}>
            <span>Saved privately on your device</span>
            <span>{reflection.length} chars</span>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionItem({
  t, accent, fontScale, q, getAnswer, onAnswerSlot, onRef,
}: {
  t: Theme; accent: { c: string; on: string }; fontScale: number;
  q: Question;
  getAnswer: (slot: string) => string;
  onAnswerSlot: (slot: string, v: string) => void;
  onRef: (ref: string) => void;
}) {
  const hasChoices = !!q.choices && q.choices.length > 0;
  const isStubs = hasChoices && !!q.stubMode;
  const isRadio = hasChoices && !q.stubMode;
  // Free-text fallback only when there are no blanks AND no choices.
  const showTextarea = q.blanks === 0 && !hasChoices;

  // Track if anything was filled in (for the "Saved" microcopy).
  const anyFilled = (() => {
    for (let i = 0; i < q.blanks; i++) if (getAnswer(`b${i}`)) return true;
    if (isRadio && getAnswer('c')) return true;
    if (isStubs && q.choices) for (const c of q.choices) if (getAnswer(`s_${c.label}`)) return true;
    if (showTextarea && getAnswer('t')) return true;
    return false;
  })();

  return (
    <div style={{
      padding: '14px 16px', background: t.paper,
      border: `0.5px solid ${t.paperEdge}`, borderRadius: 12,
    }}>
      <div style={{
        font: `400 ${15 * fontScale}px/1.7 ${t.fontBody}`, color: t.ink,
        marginBottom: 12,
      }}>
        <span style={{ fontWeight: 600, marginRight: 6 }}>{q.num}.</span>
        <PromptWithBlanks
          prompt={q.prompt}
          accent={accent}
          rule={t.rule}
          ink={t.ink}
          bg={t.bg}
          fontBody={t.fontBody}
          fontScale={fontScale}
          getBlank={(i) => getAnswer(`b${i}`)}
          onBlank={(i, v) => onAnswerSlot(`b${i}`, v)}
          onRef={onRef}
        />
      </div>

      {isRadio && q.choices && (
        <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {q.choices.map((c) => {
            const on = getAnswer('c') === c.label;
            return (
              <button key={c.label} type="button" role="radio" aria-checked={on}
                onClick={() => onAnswerSlot('c', c.label)} style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${on ? accent.c : t.rule}`,
                  background: on ? `${accent.c}12` : 'transparent',
                  color: t.ink, font: `15px ${t.fontBody}`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 9,
                  border: `1.5px solid ${on ? accent.c : t.inkMute}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {on && <span style={{
                    width: 9, height: 9, borderRadius: 5, background: accent.c,
                  }} />}
                </span>
                <span><b style={{ marginRight: 6 }}>{c.label}.</b>{c.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {isStubs && q.choices && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.choices.map((c) => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontWeight: 600, color: t.inkSoft, font: `14px ${t.fontUi}`,
                width: 18, flexShrink: 0,
              }}>{c.label}.</span>
              <input type="text" value={getAnswer(`s_${c.label}`)}
                onChange={(e) => onAnswerSlot(`s_${c.label}`, e.target.value)}
                placeholder="…"
                style={{
                  flex: 1, boxSizing: 'border-box',
                  background: t.bg, border: `0.5px solid ${t.rule}`, borderRadius: 8,
                  padding: '10px 12px', color: t.ink,
                  font: `14px ${t.fontBody}`, outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = accent.c)}
                onBlur={(e) => (e.target.style.borderColor = t.rule)}
              />
            </div>
          ))}
        </div>
      )}

      {showTextarea && (
        <textarea
          value={getAnswer('t')}
          onChange={(e) => onAnswerSlot('t', e.target.value)}
          placeholder="Your answer…"
          rows={4}
          style={{
            width: '100%', resize: 'vertical', boxSizing: 'border-box',
            background: t.bg, border: `0.5px solid ${t.rule}`, borderRadius: 8,
            padding: '10px 12px', color: t.ink,
            font: `14px/1.5 ${t.fontBody}`, outline: 'none', minHeight: 120,
          }}
          onFocus={(e) => (e.target.style.borderColor = accent.c)}
          onBlur={(e) => (e.target.style.borderColor = t.rule)}
        />
      )}

      {anyFilled && (
        <div style={{
          marginTop: 8, font: `11px ${t.fontUi}`, color: t.inkMute,
        }}>Saved</div>
      )}
    </div>
  );
}

// Splits a prompt on '___' tokens and renders an inline writing-line <input>
// between each pair of segments. Each segment passes through LinkedText so
// scripture references stay tappable.
function PromptWithBlanks({
  prompt, accent, rule, ink, bg, fontBody, fontScale,
  getBlank, onBlank, onRef,
}: {
  prompt: string;
  accent: { c: string; on: string };
  rule: string;
  ink: string;
  bg: string;
  fontBody: string;
  fontScale: number;
  getBlank: (i: number) => string;
  onBlank: (i: number, v: string) => void;
  onRef: (ref: string) => void;
}) {
  if (!prompt.includes('___')) {
    return <LinkedText text={prompt} accent={accent} onRef={onRef} />;
  }
  const segments = prompt.split('___');
  const nodes: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    if (seg) nodes.push(<LinkedText key={`s${i}`} text={seg} accent={accent} onRef={onRef} />);
    if (i < segments.length - 1) {
      const val = getBlank(i);
      const w = Math.max(70, Math.min(180, (val.length || 6) * 9));
      nodes.push(
        <input
          key={`b${i}`}
          type="text"
          value={val}
          onChange={(e) => onBlank(i, e.target.value)}
          style={{
            display: 'inline-block',
            width: w, minWidth: 70,
            margin: '0 4px',
            verticalAlign: 'baseline',
            background: bg,
            border: 'none',
            borderBottom: `1.5px solid ${val ? accent.c : ink}80`,
            outline: 'none',
            color: ink,
            font: `500 ${15 * fontScale}px ${fontBody}`,
            padding: '2px 4px',
          }}
          onFocus={(e) => (e.target.style.borderBottomColor = accent.c)}
          onBlur={(e) => (e.target.style.borderBottomColor = val ? accent.c : ink + '80')}
        />,
      );
    }
  });
  return <>{nodes}</>;
}
