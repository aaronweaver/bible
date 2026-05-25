import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Theme } from '../theme';
import { TopBar, DarkToggle, SectionHeader } from '../components/TopBar';
import { ProgressRing, Tile } from '../components/Bits';
import { Icon } from '../icons';
import { LESSONS, VERSE_OF_DAY } from '../data/lessons';
import { STORIES, type Story } from '../data/stories';
import { useAppState, useTheme } from '../hooks/useAppState';
import { getEntry, todayDateKey, formatDevotionalDate } from '../data/devotional';
import { READING_PLANS_META, getPlanDays, readingsLabel, planProgressPct, type ReadingDay } from '../data/readingPlans';

export function Today({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { dark, toggleDark } = useTheme();
  const fontScale = state.prefs.fontScale / 100;

  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const curLesson = LESSONS.find((l) => !state.progress[l.id]?.completed) || LESSONS[0];
  const completedCount = LESSONS.filter((l) => state.progress[l.id]?.completed).length;
  const pct = Math.round((completedCount / LESSONS.length) * 100);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const palette = t.palette;
  const curSectionsDone = state.progress[curLesson.id]?.sectionsDone || 0;
  const devDateKey = todayDateKey();
  const devAdded = state.devotional.status !== 'not-added';
  const devMorningRead = !!state.devotional.read[`${devDateKey}:morning`];
  const devEveningRead = !!state.devotional.read[`${devDateKey}:evening`];
  const devBothRead = devMorningRead && devEveningRead;
  const devEntry = getEntry(devDateKey, devMorningRead ? 'evening' : 'morning');
  const devColor = palette[1];
  const devPeriod = devMorningRead ? 'evening' : 'morning';

  // Featured reading plan (lowest progress % among in-progress plans)
  const activePlans = READING_PLANS_META.filter(
    m => state.readingPlans[m.id]?.status === 'in-progress'
  ).sort((a, b) => {
    const pa = planProgressPct(state.readingPlans[a.id], a.totalDays);
    const pb = planProgressPct(state.readingPlans[b.id], b.totalDays);
    return pa - pb;
  });
  const featuredPlan = activePlans[0] ?? null;
  const featuredProg = featuredPlan ? state.readingPlans[featuredPlan.id] : null;
  const [featuredDays, setFeaturedDays] = useState<ReadingDay[] | null>(null);
  useEffect(() => {
    if (!featuredPlan) { setFeaturedDays(null); return; }
    getPlanDays(featuredPlan.id).then(setFeaturedDays);
  }, [featuredPlan?.id]);
  const featuredDay = featuredDays?.find(d => d.day === featuredProg?.currentDay);
  const featuredLabel = featuredDay
    ? readingsLabel(featuredDay.readings)
    : (featuredPlan?.subtitle ?? '');

  return (
    <div style={{ padding: '0 0 24px' }}>
      <TopBar t={t} eyebrow={today} title="Good day, friend"
        right={<DarkToggle t={t} darkMode={dark} onToggle={toggleDark} />} />

      {/* Verse of the day hero */}
      <div style={{
        margin: '14px 18px 0', padding: '24px 22px 22px',
        background: accent.c, color: accent.on,
        borderRadius: t.radius + 4,
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 20px 40px -24px ${accent.c}aa`,
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            font: `11px ${t.fontUi}`, letterSpacing: 1.5, textTransform: 'uppercase',
            opacity: 0.85, fontWeight: 700,
          }}>
            <Icon name="sparkles" size={14} filled /> Verse of the day
          </div>
          <p style={{
            margin: '14px 0 14px',
            font: `400 ${22 * fontScale}px/1.35 ${t.fontDisplay}`,
            letterSpacing: -0.2,
          }}>
            “{VERSE_OF_DAY.text}”
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ font: `italic 14px ${t.fontBody}`, opacity: 0.85 }}>— {VERSE_OF_DAY.ref}</div>
          </div>
        </div>
      </div>

      {/* Continue lesson */}
      <SectionHeader t={t} title="Continue your study" />
      <button onClick={() => navigate(`/lessons/${curLesson.id}`)} style={{
        display: 'block', width: 'calc(100% - 36px)', margin: '0 18px',
        background: t.paper, color: t.ink, borderRadius: t.radius,
        border: `0.5px solid ${t.paperEdge}`, padding: '18px 20px',
        textAlign: 'left', cursor: 'pointer',
        boxShadow: '0 10px 30px -22px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${accent.c}15`, color: accent.c,
              padding: '4px 10px', borderRadius: 999,
              font: `600 11px ${t.fontUi}`, letterSpacing: 0.4,
              textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>Lesson {curLesson.id} of 10</div>
            <div style={{ font: `500 24px/1.15 ${t.fontDisplay}`, marginTop: 10, color: t.ink, letterSpacing: -0.3 }}>{curLesson.title}</div>
            <div style={{ font: `14px ${t.fontBody}`, color: t.inkSoft, marginTop: 4 }}>{curLesson.subtitle}</div>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            background: accent.c, color: accent.on,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: `0 8px 20px -10px ${accent.c}`,
          }}>
            <Icon name="play" size={18} filled />
          </div>
        </div>
        <div style={{ marginTop: 16, height: 6, borderRadius: 3, background: t.rule, overflow: 'hidden' }}>
          <div style={{
            width: `${(curSectionsDone / curLesson.sections.length) * 100}%`,
            height: '100%', background: accent.c, borderRadius: 3,
          }} />
        </div>
        <div style={{ font: `12px ${t.fontUi}`, color: t.inkMute, marginTop: 8 }}>
          {curSectionsDone} of {curLesson.sections.length} sections · ~{curLesson.minutes} min
        </div>
      </button>

      {/* Share buttons */}
      <div style={{ margin: '12px 18px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          onClick={() => {
            const msg = encodeURIComponent('Come and study the Bible with me! https://aaronweaver.github.io/bible/');
            window.open(`sms:?body=${msg}`);
          }}
          style={{
            background: accent.c, color: accent.on, border: 'none',
            borderRadius: t.radiusSm, padding: '12px 10px',
            font: `600 13px ${t.fontUi}`, cursor: 'pointer', letterSpacing: 0.1,
          }}>
          Share with a Friend
        </button>
        <button
          onClick={() => setShowPartnerModal(true)}
          style={{
            background: t.paper, color: t.ink, border: `0.5px solid ${t.paperEdge}`,
            borderRadius: t.radiusSm, padding: '12px 10px',
            font: `600 13px ${t.fontUi}`, cursor: 'pointer', letterSpacing: 0.1,
          }}>
          Request a Bible Study Partner
        </button>
      </div>

      {/* Course progress */}
      <SectionHeader t={t} title="Course progress" />
      <div onClick={() => navigate('/lessons')} style={{
        margin: '0 18px', padding: '16px 18px',
        background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
        display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer',
      }}>
        <ProgressRing pct={pct} accent={accent.c} t={t} />
        <div style={{ flex: 1 }}>
          <div style={{ font: `500 22px/1.1 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.3 }}>
            {completedCount} of 10 lessons
          </div>
          <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 2 }}>
            New Believers Foundation Course
          </div>
        </div>
        <Icon name="chev-r" size={18} color={t.inkMute} />
      </div>

      {/* Today's devotional card */}
      {devAdded && (
        <>
          <SectionHeader t={t} title="Today's devotional" />
          <button
            onClick={() => navigate(`/devotional/${devDateKey}/${devPeriod}`)}
            style={{
              display: 'block', width: 'calc(100% - 36px)', margin: '0 18px',
              background: t.paper, color: t.ink, borderRadius: t.radius,
              border: `0.5px solid ${t.paperEdge}`, padding: '18px 20px',
              textAlign: 'left', cursor: 'pointer',
              boxShadow: '0 10px 30px -22px rgba(0,0,0,0.25)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: devColor }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: `${devColor}15`, color: devColor,
                  padding: '4px 10px', borderRadius: 999,
                  font: `600 11px ${t.fontUi}`, letterSpacing: 0.4,
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>
                  {devBothRead ? 'Both read today' : devMorningRead ? 'Evening' : 'Morning'} · {formatDevotionalDate(devDateKey)}
                </div>
                <div style={{ font: `500 24px/1.15 ${t.fontDisplay}`, marginTop: 10, color: t.ink, letterSpacing: -0.3 }}>
                  Morning and Evening
                </div>
                <div style={{ font: `14px ${t.fontBody}`, color: t.inkSoft, marginTop: 4 }}>
                  {devEntry?.scriptureRef ?? 'C.H. Spurgeon'}
                </div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 24, flexShrink: 0,
                background: devColor, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 20px -10px ${devColor}`,
              }}>
                <Icon name={devBothRead ? 'check' : 'sparkles'} size={18} filled={!devBothRead} />
              </div>
            </div>
            {devMorningRead && !devBothRead && (
              <div style={{
                marginTop: 14, paddingTop: 12, borderTop: `0.5px solid ${t.rule}`,
                display: 'flex', alignItems: 'center', gap: 6,
                font: `12px ${t.fontUi}`, color: devColor,
              }}>
                <Icon name="check" size={12} color={devColor} stroke={2.2} />
                Morning read · Tap for evening
              </div>
            )}
            {devBothRead && (
              <div style={{
                marginTop: 14, paddingTop: 12, borderTop: `0.5px solid ${t.rule}`,
                display: 'flex', alignItems: 'center', gap: 6,
                font: `12px ${t.fontUi}`, color: devColor,
              }}>
                <Icon name="check" size={12} color={devColor} stroke={2.2} />
                Both readings complete for today
              </div>
            )}
          </button>
        </>
      )}

      {/* Today's reading plan */}
      {featuredPlan && featuredProg && (
        <>
          <SectionHeader t={t} title="Today's reading" />
          <button
            onClick={() => navigate(`/plan/${featuredPlan.id}/day/${featuredProg.currentDay}`)}
            style={{
              display: 'block', width: 'calc(100% - 36px)', margin: '0 18px',
              background: t.paper, color: t.ink, borderRadius: t.radius,
              border: `0.5px solid ${t.paperEdge}`, padding: '18px 20px',
              textAlign: 'left', cursor: 'pointer',
              boxShadow: '0 10px 30px -22px rgba(0,0,0,0.25)',
            }}
          >
            {(() => {
              const planColor = t.palette[featuredPlan.accentIndex];
              return (
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: `${planColor}15`, color: planColor,
                      padding: '4px 10px', borderRadius: 999,
                      font: `600 11px ${t.fontUi}`, letterSpacing: 0.4,
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>
                      Day {featuredProg.currentDay} of {featuredPlan.totalDays}
                    </div>
                    <div style={{ font: `500 24px/1.15 ${t.fontDisplay}`, marginTop: 10, color: t.ink, letterSpacing: -0.3 }}>
                      {featuredPlan.title}
                    </div>
                    <div style={{ font: `14px ${t.fontBody}`, color: t.inkSoft, marginTop: 4 }}>
                      {featuredLabel}
                    </div>
                  </div>
                  <div style={{
                    width: 48, height: 48, borderRadius: 24,
                    background: planColor, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: `0 8px 20px -10px ${planColor}`,
                  }}>
                    <Icon name={featuredPlan.icon as any} size={20} filled />
                  </div>
                </div>
              );
            })()}
          </button>
          {activePlans.length > 1 && (
            <button
              onClick={() => navigate('/lessons')}
              style={{
                display: 'block', width: 'calc(100% - 36px)', margin: '8px 18px 0',
                background: 'none', border: 'none', cursor: 'pointer',
                font: `13px ${t.fontUi}`, color: t.inkMute, textAlign: 'center', padding: '4px 0',
              }}
            >
              +{activePlans.length - 1} more active {activePlans.length - 1 === 1 ? 'plan' : 'plans'} →
            </button>
          )}
        </>
      )}

      {/* Study partner modal */}
      {showPartnerModal && (
        <div onClick={() => setShowPartnerModal(false)} style={{
          position: 'fixed', inset: 0, background: t.overlay, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: t.paper, borderRadius: t.radius, padding: '32px 28px',
            maxWidth: 340, width: '100%', textAlign: 'center',
            boxShadow: '0 24px 60px -20px rgba(0,0,0,0.35)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
              background: `${accent.c}15`, color: accent.c,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="mail" size={28} />
            </div>
            <div style={{ font: `600 20px/1.2 ${t.fontDisplay}`, color: t.ink, marginBottom: 10 }}>
              Request Sent
            </div>
            <div style={{ font: `15px/1.6 ${t.fontBody}`, color: t.inkSoft, marginBottom: 24 }}>
              For more questions, contact{' '}
              <span style={{ color: t.ink, fontWeight: 600 }}>Lehigh Valley Baptist Church</span>.
            </div>
            <button onClick={() => setShowPartnerModal(false)} style={{
              background: accent.c, color: accent.on, border: 'none',
              borderRadius: 999, padding: '12px 32px',
              font: `600 15px ${t.fontUi}`, cursor: 'pointer',
            }}>Done</button>
          </div>
        </div>
      )}

      {/* Habits — commented out until streak/verse tracking is wired up
      <SectionHeader t={t} title="This week" />
      <div style={{ margin: '0 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Tile t={t} label="Reading streak" value="6" unit="days" icon="flame" tone={palette[3]} />
        <Tile t={t} label="Verses read" value="143" unit="this week" icon="book" tone={palette[2]} />
      </div>
      */}

      {/* My Stories */}
      <div style={{ padding: '24px 22px 10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ font: `12px ${t.fontUi}`, letterSpacing: 1.5, textTransform: 'uppercase', color: t.inkMute, fontWeight: 600 }}>My Stories</div>
        <div style={{ font: `12px ${t.fontUi}`, color: t.inkMute, letterSpacing: 0.3 }}>{STORIES.length} testimonies</div>
      </div>
      <FeaturedStoryCard t={t} accent={accent} story={STORIES[0]} palette={palette}
        onOpen={() => navigate(`/stories/${STORIES[0].id}`)} />
      <div style={{
        marginTop: 12,
        display: 'flex', gap: 10, overflowX: 'auto',
        padding: '4px 0',
        scrollSnapType: 'x mandatory',
      }}>
        {STORIES.slice(1).map((s, i) => (
          <MiniStoryCard key={s.id} t={t} story={s}
            tone={palette[(i + 1) % palette.length]}
            ml={i === 0 ? 18 : 0}
            onOpen={() => navigate(`/stories/${s.id}`)} />
        ))}
        <div style={{
          flex: '0 0 auto', width: 168, scrollSnapAlign: 'start',
          border: `1.5px dashed ${t.paperEdge}`, borderRadius: t.radiusSm,
          padding: '14px 12px', display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start', justifyContent: 'space-between',
          background: 'transparent', minHeight: 132,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16, background: `${accent.c}18`, color: accent.c,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="cross" size={16} />
          </div>
          <div>
            <div style={{ font: `500 14px/1.2 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.1 }}>Share your story</div>
            <div style={{ font: `12px/1.3 ${t.fontBody}`, color: t.inkSoft, marginTop: 3 }}>Tell others how Christ changed your life.</div>
          </div>
        </div>
        <div style={{ flexShrink: 0, width: 18 }} />
      </div>

      {/* Last read */}
      <SectionHeader t={t} title="Last read" />
      <button onClick={() => navigate('/bible')} style={{
        display: 'block', width: 'calc(100% - 36px)', margin: '0 18px',
        background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
        padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${palette[1]}18`, color: palette[1],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="book" size={20} filled />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: `500 18px ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.2 }}>
              {state.lastRead ? `${state.lastRead.book} ${state.lastRead.chapter}` : 'John 3'}
            </div>
            <div style={{ font: `13px ${t.fontBody}`, color: t.inkSoft, marginTop: 1 }}>
              Pick up where you left off
            </div>
          </div>
          <Icon name="chev-r" size={18} color={t.inkMute} />
        </div>
      </button>
    </div>
  );
}

function FeaturedStoryCard({ t, accent, story, palette, onOpen }: {
  t: Theme; accent: { c: string; on: string }; story: Story; palette: string[]; onOpen: () => void;
}) {
  const [imgOk, setImgOk] = React.useState(!!story.coverImage);
  const initials = (story.author || '?').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const hasImage = story.coverImage && imgOk;
  return (
    <button onClick={onOpen} style={{
      display: 'block', width: 'calc(100% - 36px)', margin: '0 18px',
      background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
      padding: 0, textAlign: 'left', cursor: 'pointer', overflow: 'hidden',
      boxShadow: '0 18px 36px -22px rgba(0,0,0,0.28)',
    }}>
      {/* Cover image — only rendered when an image is available */}
      {story.coverImage && (
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '16 / 10',
          background: hasImage ? `url(${story.coverImage}) center/cover no-repeat` : 'transparent',
          display: hasImage ? 'block' : 'none',
        }}>
          <img src={story.coverImage} alt="" onError={() => setImgOk(false)}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 100%)',
          }} />
          <div style={{
            position: 'absolute', top: 14, left: 14,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.92)', color: '#1a1a1a',
            padding: '5px 10px 5px 8px', borderRadius: 999,
            font: `600 11px ${t.fontUi}`, letterSpacing: 0.6, textTransform: 'uppercase' as const,
            backdropFilter: 'blur(8px)',
          }}>
            <Icon name="sparkles" size={12} filled color="#1a1a1a" /> Featured testimony
          </div>
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, color: '#fff' }}>
            <div style={{ font: `500 22px/1.15 ${t.fontDisplay}`, letterSpacing: -0.3 }}>
              {story.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, font: `13px ${t.fontBody}`, opacity: 0.92 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                font: `600 10px ${t.fontUi}`, letterSpacing: 0.4,
              }}>{initials}</span>
              <span style={{ fontStyle: 'italic' }}>{story.author}</span>
              <span style={{ width: 3, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.6)' }} />
              <span>{story.readMinutes} min read</span>
            </div>
          </div>
        </div>
      )}
      {/* Text-only layout when no image */}
      {!hasImage && (
        <div style={{ padding: '18px 18px 16px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${accent.c}15`, color: accent.c,
            padding: '5px 10px 5px 8px', borderRadius: 999,
            font: `600 11px ${t.fontUi}`, letterSpacing: 0.6, textTransform: 'uppercase' as const,
          }}>
            <Icon name="sparkles" size={12} filled color={accent.c} /> Featured testimony
          </div>
          <div style={{ font: `500 22px/1.2 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.3, marginTop: 12 }}>
            {story.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, font: `13px ${t.fontBody}`, color: t.inkSoft }}>
            <span style={{
              width: 22, height: 22, borderRadius: 11, background: `${accent.c}18`, color: accent.c,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              font: `600 10px ${t.fontUi}`, letterSpacing: 0.4,
            }}>{initials}</span>
            <span style={{ fontStyle: 'italic' }}>{story.author}</span>
            <span style={{ width: 3, height: 3, borderRadius: 2, background: t.inkMute }} />
            <span>{story.readMinutes} min read</span>
          </div>
        </div>
      )}
    </button>
  );
}

function MiniStoryCard({ t, story, tone, onOpen, ml = 0 }: {
  t: Theme; story: Story; tone: string; onOpen: () => void; ml?: number;
}) {
  const initials = (story.author || '?').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <button onClick={onOpen} style={{
      flex: '0 0 auto', width: 220, scrollSnapAlign: 'start', marginLeft: ml,
      background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radiusSm,
      padding: '14px 14px', textAlign: 'left', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: 10, minHeight: 132,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: tone }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 26, height: 26, borderRadius: 13, background: `${tone}22`, color: tone,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          font: `600 11px ${t.fontUi}`, letterSpacing: 0.4,
        }}>{initials}</span>
        <span style={{ font: `italic 13px ${t.fontBody}`, color: t.inkSoft }}>{story.author}</span>
      </div>
      <div style={{ font: `500 15px/1.2 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.2 }}>
        {story.title}
      </div>
      <div style={{ marginTop: 'auto', font: `11px ${t.fontUi}`, color: t.inkMute, letterSpacing: 0.3 }}>
        {story.readMinutes} min · {story.publishedRel}
      </div>
    </button>
  );
}
