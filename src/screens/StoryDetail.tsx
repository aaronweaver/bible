import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Theme } from '../theme';
import { Icon } from '../icons';
import { STORIES, type Story, type StoryBlock } from '../data/stories';
import { useAppState } from '../hooks/useAppState';

export function StoryDetail({ t, accent }: { t: Theme; accent: { c: string; on: string } }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAppState();
  const fontScale = state.prefs.fontScale / 100;

  const story = STORIES.find(s => s.id === id);
  if (!story) { navigate('/'); return null; }

  return <StoryScreen t={t} accent={accent} fontScale={fontScale} story={story}
    onBack={() => navigate(-1)} onOpenStory={(sid) => navigate(`/stories/${sid}`)} />;
}

function StoryScreen({
  t, accent, fontScale, story, onBack, onOpenStory,
}: {
  t: Theme;
  accent: { c: string; on: string };
  fontScale: number;
  story: Story;
  onBack: () => void;
  onOpenStory: (id: string) => void;
}) {
  const [imgOk, setImgOk] = useState(!!story.coverImage);
  const [saved, setSaved] = useState(false);
  const initials = (story.author || '?').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ paddingBottom: 24, position: 'relative' }}>
      {/* Floating back / save / settings buttons */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px',
        pointerEvents: 'none',
      }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: 19, border: 'none',
          background: 'rgba(255,255,255,0.92)', color: '#1a1a1a', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 16px -6px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          pointerEvents: 'auto',
        }}>
          <Icon name="chev-l" size={18} color="#1a1a1a" />
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setSaved(!saved)} style={{
          width: 38, height: 38, borderRadius: 19, border: 'none',
          background: 'rgba(255,255,255,0.92)',
          color: saved ? accent.c : '#1a1a1a', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 16px -6px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          pointerEvents: 'auto',
        }}>
          <Icon name="bookmark" size={16} filled={saved} color={saved ? accent.c : '#1a1a1a'} />
        </button>
      </div>

      {/* Hidden probe to catch 404s before the hero renders */}
      {story.coverImage && (
        <img src={story.coverImage} alt="" onError={() => setImgOk(false)}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      )}

      {/* Hero cover — only when image is available */}
      {story.coverImage && imgOk && (
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '4 / 3',
          marginTop: -62,
          background: `url(${story.coverImage}) center/cover no-repeat`,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 100%)',
          }} />
          <div style={{ position: 'absolute', left: 22, right: 22, bottom: 20, color: '#fff' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
              padding: '5px 10px 5px 8px', borderRadius: 999,
              font: `600 10.5px ${t.fontUi}`, letterSpacing: 1, textTransform: 'uppercase' as const,
            }}>
              <Icon name="sparkles" size={12} filled color="#fff" /> Testimony
            </div>
          </div>
        </div>
      )}

      {/* Title block */}
      <div style={{ padding: '22px 22px 6px' }}>
        <h1 style={{
          margin: 0,
          font: `400 34px/1.08 ${t.fontDisplay}`,
          letterSpacing: -0.6, color: t.ink,
        }}>{story.title}</h1>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 16,
          paddingTop: 14, borderTop: `0.5px solid ${t.rule}`,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 21, background: accent.c, color: accent.on,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: `500 16px ${t.fontDisplay}`,
            boxShadow: `0 8px 18px -10px ${accent.c}`,
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `500 15px ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.1 }}>
              {story.author}
            </div>
            <div style={{
              font: `12px ${t.fontUi}`, color: t.inkMute, letterSpacing: 0.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {story.church} · {story.readMinutes} min read · {story.publishedRel}
            </div>
          </div>
        </div>
      </div>

      {/* Body blocks */}
      <div style={{ padding: '14px 22px 4px' }}>
        {(story.blocks || []).map((block, i) => (
          <Block key={i} block={block} t={t} accent={accent} fontScale={fontScale} author={story.author} />
        ))}
      </div>

      {/* More stories scroller */}
      {(() => {
        const others = STORIES.filter(s => s.id !== story.id);
        if (others.length === 0) return null;
        return (
          <>
            <div style={{ padding: '24px 22px 10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ font: `12px ${t.fontUi}`, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: t.inkMute, fontWeight: 600 }}>More stories</div>
            </div>
            <div style={{
              display: 'flex', gap: 10, overflowX: 'auto',
              paddingTop: 4, paddingBottom: 4, paddingLeft: 22,
              scrollSnapType: 'x mandatory',
            }}>
              {others.map((s, i) => {
                const tones = t.palette;
                const tone = tones[i % tones.length];
                const ini = (s.author || '?').split(/\s+/).map(c => c[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <button key={s.id} onClick={() => onOpenStory(s.id)} style={{
                    flex: '0 0 auto', width: 220, scrollSnapAlign: 'start',
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
                      }}>{ini}</span>
                      <span style={{ font: `italic 13px ${t.fontBody}`, color: t.inkSoft }}>{s.author}</span>
                    </div>
                    <div style={{ font: `500 15px/1.2 ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.2 }}>
                      {s.title}
                    </div>
                    <div style={{ marginTop: 'auto', font: `11px ${t.fontUi}`, color: t.inkMute, letterSpacing: 0.3 }}>
                      {s.readMinutes} min · {s.publishedRel}
                    </div>
                  </button>
                );
              })}
              <div style={{ flex: '0 0 22px' }} />
            </div>
          </>
        );
      })()}

      {/* Footer CTA */}
      <div style={{ padding: '16px 22px 8px' }}>
        <div style={{
          display: 'flex', gap: 10, padding: '14px 14px',
          background: t.paper, border: `0.5px solid ${t.paperEdge}`, borderRadius: t.radius,
          alignItems: 'center',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18, background: `${accent.c}18`, color: accent.c,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="cross" size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `500 14px ${t.fontDisplay}`, color: t.ink, letterSpacing: -0.1 }}>
              Has Christ changed your life?
            </div>
            <div style={{ font: `12px ${t.fontBody}`, color: t.inkSoft, marginTop: 2 }}>
              Share your own story with the community.
            </div>
          </div>
          <button style={{
            background: accent.c, color: accent.on, border: 'none',
            padding: '10px 14px', borderRadius: 999, cursor: 'pointer',
            font: `600 13px ${t.fontUi}`, letterSpacing: 0.2,
            boxShadow: `0 10px 20px -10px ${accent.c}`,
            flexShrink: 0,
          }}>Share</button>
        </div>
      </div>
    </div>
  );
}

function Block({ block, t, accent, fontScale, author }: {
  block: StoryBlock;
  t: Theme;
  accent: { c: string; on: string };
  fontScale: number;
  author: string;
}) {
  if (block.type === 'lede') {
    return (
      <p style={{
        margin: '0 0 14px',
        font: `italic 400 ${20 * fontScale}px/1.45 ${t.fontDisplay}`,
        color: t.inkSoft, letterSpacing: -0.2,
      }}>{block.text}</p>
    );
  }
  if (block.type === 'p') {
    return (
      <p style={{
        margin: '0 0 14px',
        font: `400 ${16.5 * fontScale}px/1.65 ${t.fontBody}`,
        color: t.ink,
      }}>{block.text}</p>
    );
  }
  if (block.type === 'quote') {
    return (
      <div style={{
        margin: '20px 0 22px', padding: '6px 0',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 3, alignSelf: 'stretch', background: accent.c, borderRadius: 2, minHeight: 60,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            font: `500 ${22 * fontScale}px/1.3 ${t.fontDisplay}`,
            color: t.ink, letterSpacing: -0.3,
          }}>
            "{block.text}"
          </div>
          <div style={{
            marginTop: 8, font: `italic 12px ${t.fontBody}`,
            color: t.inkMute, letterSpacing: 0.2,
          }}>— {author}</div>
        </div>
      </div>
    );
  }
  if (block.type === 'verse') {
    return (
      <blockquote style={{
        margin: '18px 0', padding: '14px 16px 14px 18px',
        borderLeft: `2px solid ${accent.c}`,
        background: t.paper, borderRadius: '0 10px 10px 0',
      }}>
        <p style={{
          margin: 0,
          font: `400 ${16.5 * fontScale}px/1.55 ${t.fontDisplay}`,
          color: t.ink, letterSpacing: -0.1,
        }}>
          "{block.text}"
        </p>
        <div style={{ marginTop: 8, font: `italic 13px ${t.fontBody}`, color: t.inkSoft, letterSpacing: 0.2 }}>
          — {block.ref}, KJV
        </div>
      </blockquote>
    );
  }
  if (block.type === 'attribution') {
    return (
      <div style={{
        marginTop: 22, paddingTop: 16, borderTop: `0.5px solid ${t.rule}`,
        font: `italic 12px/1.5 ${t.fontBody}`, color: t.inkMute, textAlign: 'center' as const,
      }}>{block.text}</div>
    );
  }
  return null;
}
