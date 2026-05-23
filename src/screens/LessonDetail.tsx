import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar, CircleBtn } from '../components/TopBar';
import { Icon } from '../icons';
import { LESSONS, parseVerseRef, type LessonSection, type Question } from '../data/lessons';
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
            idx={i} total={totalSections} section={s} lesson={{ id: lesson.id, title: lesson.title, subtitle: lesson.subtitle }}
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
  section: LessonSection; lesson: { id: number; title: string; subtitle: string };
  reflection: string;
  answers: Record<string, string>;
  onReflect: (v: string) => void;
  onAnswerSlot: (sectionIdx: number, qNum: number, slot: string, v: string) => void;
  onView: () => void;
}) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [showQuiz, setShowQuiz] = useState(false);
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
        <>
          <button onClick={() => setShowQuiz(true)} style={{
            marginTop: 8, width: '100%',
            background: accent.c, color: accent.on, border: 'none',
            borderRadius: 14, padding: '15px 20px',
            font: `600 15px ${t.fontUi}`, cursor: 'pointer', letterSpacing: 0.1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            Take the Quiz
          </button>
          {showQuiz && (
            <QuizSheet
              t={t} accent={accent} fontScale={fontScale}
              lessonId={lesson.id} lessonTitle={lesson.title}
              questions={section.questions}
              getAnswer={(qNum, slot) => answers[`${idx}:${qNum}:${slot}`] || ''}
              onAnswerSlot={(qNum, slot, v) => onAnswerSlot(idx, qNum, slot, v)}
              onClose={() => setShowQuiz(false)}
            />
          )}
        </>
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

function QuizSheet({
  t, accent, fontScale, lessonId, lessonTitle, questions, getAnswer, onAnswerSlot, onClose,
}: {
  t: Theme; accent: { c: string; on: string }; fontScale: number;
  lessonId: number; lessonTitle: string;
  questions: Question[];
  getAnswer: (qNum: number, slot: string) => string;
  onAnswerSlot: (qNum: number, slot: string, v: string) => void;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const total = questions.length;
  const q = questions[current];

  const handleNext = () => {
    if (current < total - 1) setCurrent(current + 1);
    else setDone(true);
  };
  const handlePrev = () => { if (current > 0) setCurrent(current - 1); };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
      }} />

      {/* sheet */}
      <div style={{
        position: 'relative', background: t.bg,
        borderRadius: '24px 24px 0 0',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        paddingBottom: 32,
        animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

        {/* drag handle */}
        <div style={{ width: 36, height: 4, background: t.rule, borderRadius: 2, margin: '12px auto 0' }} />

        {/* header */}
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: `600 11px ${t.fontUi}`, letterSpacing: 1.5, textTransform: 'uppercase', color: accent.c }}>
              Lesson {lessonId} · Quiz
            </div>
            <div style={{ font: `400 22px/1.1 ${t.fontDisplay}`, color: t.ink, marginTop: 4, letterSpacing: -0.3 }}>
              {lessonTitle}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 17,
            background: t.paper, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            color: t.inkSoft, font: `500 16px ${t.fontUi}`,
          }}>✕</button>
        </div>

        {/* progress bar */}
        {!done && (
          <div style={{ padding: '14px 20px 0', display: 'flex', gap: 4 }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= current ? accent.c : t.rule,
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
        )}

        {/* content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 0' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '40px 0 20px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 32, background: `${accent.c}18`,
                color: accent.c, margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `600 28px ${t.fontUi}`,
              }}>✓</div>
              <div style={{ font: `400 26px/1.2 ${t.fontDisplay}`, color: t.ink, marginBottom: 8 }}>
                Quiz complete!
              </div>
              <div style={{ font: `15px ${t.fontBody}`, color: t.inkSoft, marginBottom: 32 }}>
                {total} questions answered
              </div>
              <button onClick={() => {}} style={{
                width: '100%', background: accent.c, color: accent.on, border: 'none',
                borderRadius: 14, padding: '15px 20px',
                font: `600 15px ${t.fontUi}`, cursor: 'pointer', marginBottom: 12,
              }}>Share results with a friend</button>
              <button onClick={onClose} style={{
                width: '100%', background: 'transparent', color: t.ink, border: `1px solid ${t.rule}`,
                borderRadius: 14, padding: '14px 20px',
                font: `500 15px ${t.fontUi}`, cursor: 'pointer',
              }}>Close</button>
            </div>
          ) : (
            <>
              <div style={{
                font: `400 ${24 * fontScale}px/1.35 ${t.fontDisplay}`,
                color: t.ink, letterSpacing: -0.3, marginBottom: 28,
              }}>
                {q.type === 'blank'
                  ? q.prompt.split('___').map((seg, i, arr) => (
                      <React.Fragment key={i}>
                        {seg}
                        {i < arr.length - 1 && (
                          <span style={{
                            display: 'inline-block', minWidth: 80, borderBottom: `2px solid ${accent.c}`,
                            margin: '0 4px 2px', verticalAlign: 'bottom',
                          }} />
                        )}
                      </React.Fragment>
                    ))
                  : q.prompt
                }
              </div>

              {q.type === 'choice' && q.choices && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.choices.map((c) => {
                    const on = getAnswer(q.num, 'c') === c.label;
                    return (
                      <button key={c.label} type="button"
                        onClick={() => onAnswerSlot(q.num, 'c', c.label)} style={{
                          textAlign: 'left', padding: '14px 16px', borderRadius: 14,
                          border: `1.5px solid ${on ? accent.c : t.paperEdge}`,
                          background: on ? `${accent.c}12` : t.paper,
                          color: t.ink, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 14,
                        }}>
                        <span style={{
                          width: 30, height: 30, borderRadius: 15, flexShrink: 0,
                          background: on ? accent.c : t.bg,
                          border: `1.5px solid ${on ? accent.c : t.rule}`,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          font: `600 12px ${t.fontUi}`, color: on ? accent.on : t.inkSoft,
                          transition: 'all 0.15s',
                        }}>{c.label.toUpperCase()}</span>
                        <span style={{ font: `400 ${16 * fontScale}px/1.4 ${t.fontBody}` }}>{c.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'blank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.prompt.split('___').slice(0, -1).map((_, i) => (
                    <input key={i} type="text"
                      value={getAnswer(q.num, `b${i}`)}
                      onChange={(e) => onAnswerSlot(q.num, `b${i}`, e.target.value)}
                      placeholder={`Fill in blank ${q.prompt.split('___').length > 2 ? i + 1 : ''}`}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: t.paper, border: `1.5px solid ${t.paperEdge}`, borderRadius: 12,
                        padding: '14px 16px', color: t.ink,
                        font: `${16 * fontScale}px ${t.fontBody}`, outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = accent.c)}
                      onBlur={(e) => (e.target.style.borderColor = t.paperEdge)}
                    />
                  ))}
                </div>
              )}

              {q.type === 'open' && (
                <textarea
                  value={getAnswer(q.num, 't')}
                  onChange={(e) => onAnswerSlot(q.num, 't', e.target.value)}
                  placeholder="Your answer…"
                  rows={4}
                  style={{
                    width: '100%', resize: 'vertical', boxSizing: 'border-box',
                    background: t.paper, border: `1.5px solid ${t.paperEdge}`, borderRadius: 12,
                    padding: '14px 16px', color: t.ink,
                    font: `${16 * fontScale}px/1.5 ${t.fontBody}`, outline: 'none', minHeight: 120,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = accent.c)}
                  onBlur={(e) => (e.target.style.borderColor = t.paperEdge)}
                />
              )}
            </>
          )}
        </div>

        {/* nav buttons */}
        {!done && (
          <div style={{ padding: '20px 20px 0', display: 'flex', gap: 10 }}>
            {current > 0 && (
              <button onClick={handlePrev} style={{
                flex: 1, background: t.paper, color: t.ink,
                border: `1px solid ${t.paperEdge}`, borderRadius: 14, padding: '14px',
                font: `500 15px ${t.fontUi}`, cursor: 'pointer',
              }}>Back</button>
            )}
            <button onClick={handleNext} style={{
              flex: 2, background: accent.c, color: accent.on, border: 'none',
              borderRadius: 14, padding: '15px',
              font: `600 15px ${t.fontUi}`, cursor: 'pointer',
            }}>
              {current < total - 1 ? 'Next' : 'Finish'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
