#!/usr/bin/env node
// PDF → Markdown converter for the Beginner's Bible Study lessons.
//
// Reads `lessons/beginner's bible study/bbs<N><slug>.pdf`, runs pdf-parse,
// detects ALL-CAPS major headings + Title-Case sub-headings, reflows
// paragraphs, and pulls inline scripture quotes out into > blockquotes.
// Writes `content/lessons/<N>-<slug>.md` with YAML frontmatter.
//
//   npm run lessons:build              # writes only missing files
//   npm run lessons:build -- --force   # overwrites existing files

import { mkdir, writeFile, readdir, readFile, access } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PDF_DIR = join(ROOT, "lessons", "beginner's bible study");
const OUT_DIR = join(ROOT, 'content', 'lessons');
const KJV_PATH = join(ROOT, 'data', 'kjv.json');
const FORCE = process.argv.includes('--force');

const TITLES = {
  1:  { title: 'Salvation',             subtitle: 'How a sinner is made right with God' },
  2:  { title: 'Assurance',             subtitle: 'How to know you are saved' },
  3:  { title: 'Baptism',               subtitle: 'Your first step of obedience' },
  4:  { title: 'Church Membership',     subtitle: 'Belonging to a local body' },
  5:  { title: 'Spiritual Nourishment', subtitle: 'Feeding on the Word daily' },
  6:  { title: 'Prayer',                subtitle: 'Speaking with the Father' },
  7:  { title: 'Confession of Sin',     subtitle: 'Keeping short accounts with God' },
  8:  { title: 'Victory Over Sin',      subtitle: 'Walking in the Spirit' },
  9:  { title: 'Witnessing',            subtitle: 'Sharing what Christ has done' },
  10: { title: 'Spiritual Maturity',    subtitle: 'Growing up into Christ' },
};

const FALLBACK_VERSE = {
  1: { verse: 'For by grace are ye saved through faith.',                       ref: 'Ephesians 2:8',         minutes: 12 },
  2: { verse: 'These things have I written…that ye may know.',                 ref: '1 John 5:13',           minutes: 9 },
  3: { verse: 'Buried with him in baptism.',                                    ref: 'Colossians 2:12',       minutes: 11 },
  4: { verse: 'Forsake not the assembling of ourselves.',                       ref: 'Hebrews 10:25',         minutes: 10 },
  5: { verse: 'Man shall not live by bread alone.',                             ref: 'Matthew 4:4',           minutes: 14 },
  6: { verse: 'Pray without ceasing.',                                          ref: '1 Thessalonians 5:17',  minutes: 12 },
  7: { verse: 'If we confess our sins, he is faithful and just to forgive.',    ref: '1 John 1:9',            minutes: 8 },
  8: { verse: 'Sin shall not have dominion over you.',                          ref: 'Romans 6:14',           minutes: 13 },
  9: { verse: 'Ye shall be witnesses unto me.',                                 ref: 'Acts 1:8',              minutes: 11 },
  10:{ verse: 'Grow in grace, and in the knowledge of…Jesus Christ.',          ref: '2 Peter 3:18',          minutes: 15 },
};

// ── Cleaning ────────────────────────────────────────────────────────────────

const NB_SPACE = String.fromCharCode(0xA0);

// Re-insert lost spaces around emphasis-styled words in the PDF. The PDF
// renders phrases like "a PICTURE of" with the styled word as a separate font
// run, which pdf-parse concatenates: "aPICTUREof". Splitting on any boundary
// between lowercase and a run of 2+ uppercase recovers the spacing without
// touching ordinary CamelCase.
function splitStickyEmphasis(s) {
  return s
    .replace(/([a-z])([A-Z]{2,})/g, '$1 $2')   // aPICTURE → a PICTURE
    .replace(/([A-Z]{2,})([a-z])/g, '$1 $2');  // PICTUREof → PICTURE of
}

function cleanLine(line) {
  return splitStickyEmphasis(line
    .replace(new RegExp(NB_SPACE, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .replace(/([.!?:”’")])([A-Z“"])/g, '$1 $2')          // "God.”In" → "God.” In"
    .replace(/,([“"])/g, ', $1')                          // 'Romans 3:23,"…"' → 'Romans 3:23, "…"'
    .replace(/\bcalledsin\b/g, 'called sin')              // common PDF glitches
    .replace(/\batransgression\b/g, 'a transgression')
    .replace(/\bisiniquity\b/g, 'is iniquity'))
    .replace(/^\s*[•·●▪]\s*/, '- ')
    .trim();
}

function isPageNumber(line) {
  return /^\d{1,3}$/.test(line.trim());
}

// ── Heading detection ──────────────────────────────────────────────────────

function isMajorHeading(line) {
  const s = line.trim();
  if (!s || s.length > 60) return false;
  const letters = s.replace(/[^A-Za-z]/g, '');
  if (letters.length < 4) return false;
  return letters === letters.toUpperCase();
}

const SMALL = new Set(['a','an','and','as','at','but','by','for','if','in','of','on','or','the','to','with','from','is','are','was','were','do','does','did','can','should','will']);
function isSubHeading(line) {
  const s = line.trim();
  if (!s || s.length < 3 || s.length > 80) return false;
  // Reject sentence fragments / quote tails.
  if (/[.!,;:]$/.test(s)) return false;
  if (/["”’')\]]$/.test(s)) return false;
  if (/^[“"‘'(\[]/.test(s)) return false;
  if (/\d{2,}/.test(s)) return false;
  const words = s.split(/\s+/);
  if (words.length < 2 || words.length > 12) return false;
  // Question heading: starts with What/Why/How/etc., ends with "?"
  if (/\?$/.test(s) && /^(What|Why|How|When|Where|Who|Which|Is|Are|Do|Does|Should|Can)\b/.test(s)) {
    return true;
  }
  let cap = 0;
  for (const w of words) {
    const bare = w.replace(/[^A-Za-z]/g, '');
    if (!bare) continue;
    if (SMALL.has(bare.toLowerCase())) continue;
    if (/^[A-Z]/.test(bare)) cap++;
    else return false;
  }
  return cap >= 2;
}

function titleCase(s) {
  return s.toLowerCase().replace(/\b(\w)/g, (_, c) => c.toUpperCase());
}

// ── Paragraph reflow ───────────────────────────────────────────────────────

function flowParagraphs(lines) {
  const paras = [];
  let buf = [];
  const flush = () => { if (buf.length) { paras.push(buf.join(' ').trim()); buf = []; } };
  for (const line of lines) {
    if (!line) { flush(); continue; }
    const prev = buf[buf.length - 1] || '';
    const endsSentence = /[.!?:”")]$/.test(prev);
    const startsCap = /^[A-Z“"(\d]/.test(line);
    if (endsSentence && startsCap && prev.length > 40) flush();
    if (prev.endsWith('-')) buf[buf.length - 1] = prev.slice(0, -1) + line;
    else buf.push(line);
  }
  flush();

  // Second pass: within paragraphs that mash multiple numbered items together
  // ("3. … ? 4. … ."), split on "<digit>." boundaries so each Q gets its own line.
  const out = [];
  for (const p of paras) {
    if (/(?:^|\s)\d+\.\s.*\s\d+\.\s/.test(p)) {
      const parts = p
        .split(/\s+(?=\d+\.\s+[A-Z])/g)
        .map((s) => s.trim())
        .filter(Boolean);
      // Re-attach "a. b. c. d." sub-item lines onto their parent question.
      const merged = [];
      for (const item of parts) {
        if (/^[a-d]\.\s/.test(item) && merged.length) {
          merged[merged.length - 1] += ' ' + item;
        } else {
          merged.push(item);
        }
      }
      out.push(...merged);
    } else {
      out.push(p);
    }
  }
  return out;
}

// ── Scripture extraction ──────────────────────────────────────────────────

const BOOK_NAMES = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah',
  'Esther','Job','Psalm','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah',
  'Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah',
  'Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians',
  'Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians',
  '1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter',
  '1 John','2 John','3 John','Jude','Revelation',
];
const BOOK_ALT = BOOK_NAMES.map((b) => b.replace(/ /g, '\\s+')).join('|');

// Match: "Romans 3:23-25, "For all have…"" — book + ch:verse(-end) optionally
// followed by a quoted passage. The quote is captured if present.
const REF_RX = new RegExp(
  `\\b(${BOOK_ALT})\\s+(\\d+):(\\d+)(?:[\\-–]\\s*(\\d+))?(?:[,\\s]*[“"]([^”"]{6,500})[”"])?`,
  'g',
);

function canonical(book) {
  if (book === 'Psalm') return 'Psalms';
  return book.replace(/\s+/g, ' ');
}

function extractScriptures(paragraphs, kjv) {
  const verses = [];
  const seen = new Set();
  for (const p of paragraphs) {
    let m;
    REF_RX.lastIndex = 0;
    while ((m = REF_RX.exec(p)) !== null) {
      const book = canonical(m[1].replace(/\s+/g, ' '));
      const ch = m[2];
      const v1 = Number(m[3]);
      const v2 = m[4] ? Number(m[4]) : v1;
      const ref = v1 === v2 ? `${book} ${ch}:${v1}` : `${book} ${ch}:${v1}-${v2}`;
      if (seen.has(ref)) continue;
      seen.add(ref);

      let text = m[5]?.trim();
      // If no inline quote, try to look the verse(s) up in KJV.
      if (!text && kjv?.[book]?.[ch]) {
        const chArr = kjv[book][ch];
        const parts = [];
        for (let v = v1; v <= Math.min(v2, chArr.length); v++) {
          if (chArr[v - 1]) parts.push(chArr[v - 1]);
        }
        if (parts.length) text = parts.join(' ');
      }
      if (text) verses.push({ ref, text });
    }
  }
  return verses;
}

// ── Main conversion ───────────────────────────────────────────────────────

function buildSections(rawText) {
  // Preserve blank lines as empty strings so we can use them as a structural
  // cue. A sub-heading must be ISOLATED (blank line above and below) or
  // sentence fragments like 'Son Of God."' get falsely promoted.
  const raw = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((l, i, arr) => !(isPageNumber(l)));

  const isBlank = (i) => i < 0 || i >= raw.length || raw[i] === '';

  const sections = [];
  let current = { heading: 'Introduction', lines: [] };

  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    if (!line) continue;
    // Major heading (ALL CAPS): always splits.
    if (isMajorHeading(line)) {
      if (current.lines.length) sections.push(current);
      current = { heading: titleCase(line.replace(/^\d+[.)]\s*/, '')), lines: [] };
      continue;
    }
    // Sub-heading only when the line stands alone in the source.
    if (isSubHeading(line) && isBlank(i - 1) && isBlank(i + 1)) {
      if (current.lines.length) sections.push(current);
      current = { heading: titleCase(line.replace(/^\d+[.)]\s*/, '')), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  if (current.lines.length) sections.push(current);

  return sections;
}

function renderMarkdown(sections, kjv) {
  // Drop any church-bulletin boilerplate or empty/scrap sections.
  const BOILERPLATE_RX = /lvbaptist|colebrook\s+avenue|emmaus,\s*pa|originally these lessons|lehigh valley baptist|\(\d{3}\)\s?\d{3}-\d{4}|www\.\w+\.org/i;
  const trimmed = [];
  for (const s of sections) {
    const headingIsScrap = /^\d+$/.test(s.heading) || s.heading.length < 2;
    const bodyText = s.lines.join(' ').trim();
    if (headingIsScrap) continue;
    if (BOILERPLATE_RX.test(`${s.heading}\n${bodyText}`)) continue;
    if (!bodyText && !/reflect/i.test(s.heading) && !/question/i.test(s.heading)) continue;
    trimmed.push(s);
  }
  const kept = trimmed;

  const out = [];
  for (const sec of kept) {
    const paras = flowParagraphs(sec.lines);
    out.push(`## ${sec.heading}`);
    out.push('');
    const seenRefs = new Set();
    for (const p of paras) {
      out.push(p);
      out.push('');
      // Emit any verses cited in THIS paragraph as a blockquote immediately
      // after it, so they land where the author intended visually.
      const versesHere = extractScriptures([p], kjv).filter((v) => !seenRefs.has(v.ref));
      for (const v of versesHere) {
        seenRefs.add(v.ref);
        out.push(`> ${v.ref} — ${v.text}`);
        out.push('');
      }
    }
  }

  if (!kept.some((s) => /reflect/i.test(s.heading))) {
    out.push('## Reflect');
    out.push('');
    out.push('?? Write one thing God taught you in this lesson.');
    out.push('');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// ── Entrypoint ────────────────────────────────────────────────────────────

function parseBbs(filename) {
  const m = filename.match(/^bbs(\d+)([a-z]+)\.pdf$/i);
  if (!m) return null;
  return { num: Number(m[1]), slug: m[2].toLowerCase() };
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function loadKjv() {
  try {
    const raw = await readFile(KJV_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    console.log('(no data/kjv.json — scripture refs without inline quotes will be skipped)');
    return null;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const kjv = await loadKjv();
  const files = await readdir(PDF_DIR);
  let wrote = 0, skipped = 0;

  for (const f of files) {
    const meta = parseBbs(f);
    if (!meta) continue;
    if (meta.slug === 'answerkey') continue;

    const outName = `${String(meta.num).padStart(2, '0')}-${meta.slug}.md`;
    const outPath = join(OUT_DIR, outName);

    if (!FORCE && await exists(outPath)) {
      console.log(`skip  ${outName} (exists; pass --force to overwrite)`);
      skipped++;
      continue;
    }

    const pdfPath = join(PDF_DIR, f);
    const buf = await readFile(pdfPath);
    const parsed = await pdfParse(buf);
    const sections = buildSections(parsed.text);
    const md = renderMarkdown(sections, kjv);

    const titleMeta = TITLES[meta.num] ?? { title: titleCase(meta.slug), subtitle: '' };
    const verseMeta = FALLBACK_VERSE[meta.num] ?? { verse: '', ref: '', minutes: 10 };

    const frontmatter = [
      '---',
      `id: ${meta.num}`,
      `title: ${titleMeta.title}`,
      `subtitle: ${titleMeta.subtitle}`,
      `verse: ${JSON.stringify(verseMeta.verse)}`,
      `ref: ${verseMeta.ref}`,
      `minutes: ${verseMeta.minutes}`,
      '---',
      '',
    ].join('\n');

    await writeFile(outPath, frontmatter + md);
    console.log(`wrote ${outName}  (${sections.length} sections)`);
    wrote++;
  }

  console.log(`\nDone. ${wrote} written, ${skipped} skipped.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
