// Lightweight front-matter parser (avoids gray-matter's Node Buffer dep).
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  if (!raw.startsWith('---')) return { data: {}, content: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: {}, content: raw };
  const header = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).replace(/^\r?\n/, '');
  const data: Record<string, unknown> = {};
  for (const line of header.split(/\r?\n/)) {
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let value: unknown = m[2].trim();
    if (typeof value === 'string') {
      if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
        value = value.slice(1, -1);
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        value = Number(value);
      }
    }
    data[m[1]] = value;
  }
  return { data, content };
}

export type QChoice = { label: string; text: string };
export type Question = {
  num: number;
  type: 'open' | 'blank' | 'choice';
  prompt: string;
  choices?: QChoice[];
};

export type SectionItem =
  | { kind: 'p'; text: string }
  | { kind: 'verse'; ref: string; text: string };

export type LessonSection = {
  heading: string;
  items?: SectionItem[];
  reflect?: string;
  questions?: Question[];
};

export type Lesson = {
  id: number;
  title: string;
  subtitle: string;
  verse: string;
  ref: string;
  minutes: number;
  sections: LessonSection[];
};

// All converted lesson markdowns. We resolve from project root via Vite glob.
const files = import.meta.glob('/content/lessons/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

// Collapse single newlines inside a paragraph (PDF extraction wraps lines at ~80
// chars). Preserve blank-line paragraph breaks. Also stitch words split across
// soft-wrapped lines back together by joining with a single space.
function reflow(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) =>
      para
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
    .join('\n\n');
}

function parseSections(body: string): LessonSection[] {
  const sections: LessonSection[] = [];
  const parts = body.split(/^##\s+/m).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const rest = (nl === -1 ? '' : part.slice(nl + 1)).trim();

    if (rest.startsWith('??')) {
      sections.push({ heading, reflect: rest.replace(/^\?\?\s*/, '').trim() });
      continue;
    }

    // Walk the section body in order, grouping into paragraph or verse items.
    // Blank lines separate items; lines starting with `>` are verse blockquotes.
    const items: SectionItem[] = [];
    let buf: string[] = [];
    const flushPara = () => {
      if (!buf.length) return;
      const text = reflow(buf.join('\n').trim());
      if (text) items.push({ kind: 'p', text });
      buf = [];
    };
    for (const line of rest.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) { flushPara(); continue; }
      const m = trimmed.match(/^>\s*([\w\s\d:.-]+?)\s+[—-]\s+(.+)$/);
      if (m) {
        flushPara();
        items.push({ kind: 'verse', ref: m[1].trim(), text: m[2].trim() });
      } else {
        buf.push(line);
      }
    }
    flushPara();

    const section: LessonSection = { heading };

    const isQuiz = /^quiz$/i.test(heading);
    if (isQuiz) {
      // Parse new format: numbered items optionally followed by `   - a) …` choice lines.
      const qs: Question[] = [];
      let curNum = 0;
      let curPrompt = '';
      let curChoices: QChoice[] = [];

      const flush = () => {
        if (!curPrompt) return;
        const prompt = curPrompt.replace(/_{3,}/g, '___').trim();
        let type: Question['type'] = 'open';
        if (curChoices.length >= 2) type = 'choice';
        else if (prompt.includes('___')) type = 'blank';
        const q: Question = { num: curNum, type, prompt };
        if (type === 'choice') q.choices = curChoices;
        qs.push(q);
        curPrompt = '';
        curChoices = [];
      };

      for (const line of rest.split('\n')) {
        const trimmed = line.trim();
        const qm = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (qm) {
          flush();
          curNum = Number(qm[1]);
          curPrompt = qm[2];
          continue;
        }
        const cm = trimmed.match(/^-\s+([a-d])\)\s+(.+)$/);
        if (cm && curNum > 0) {
          curChoices.push({ label: cm[1], text: cm[2] });
          continue;
        }
        // continuation line for a question (indented or plain text after numbered item)
        if (curNum > 0 && trimmed && !trimmed.startsWith('>')) {
          curPrompt += ' ' + trimmed;
        }
      }
      flush();

      if (qs.length) section.questions = qs;
    } else if (items.length) {
      section.items = items;
    }

    sections.push(section);
  }
  return sections;
}

// Parse "Romans 3:23", "1 John 5:13", "Colossians 2:12-14" into book + chapter.
export function parseVerseRef(ref: string): { book: string; chapter: number; verse?: number } | null {
  const normalized = ref.trim().replace(/^(III|II|I)\s+/, (_, r) =>
    ({ 'I': '1', 'II': '2', 'III': '3' }[r as 'I' | 'II' | 'III']!) + ' '
  );
  const m = normalized.match(/^((?:\d\s)?[A-Za-z][A-Za-z ]*?)\s+(\d+)(?::(\d+))?/);
  if (!m) return null;
  return {
    book: m[1].trim(),
    chapter: Number(m[2]),
    verse: m[3] ? Number(m[3]) : undefined,
  };
}

function loadFromFiles(): Lesson[] {
  const list: Lesson[] = [];
  for (const [path, raw] of Object.entries(files)) {
    if (path.endsWith('/answer-key.md')) continue;
    const { data, content } = parseFrontmatter(raw);
    list.push({
      id: Number(data.id),
      title: String(data.title ?? 'Untitled'),
      subtitle: String(data.subtitle ?? ''),
      verse: String(data.verse ?? ''),
      ref: String(data.ref ?? ''),
      minutes: Number(data.minutes ?? 10),
      sections: parseSections(content),
    });
  }
  list.sort((a, b) => a.id - b.id);
  return list;
}

// Placeholder lessons (used until convert-pdfs is run).
const PLACEHOLDERS: Lesson[] = [
  { id: 1, title: 'Salvation', subtitle: 'How a sinner is made right with God', verse: 'For by grace are ye saved through faith.', ref: 'Ephesians 2:8', minutes: 12 },
  { id: 2, title: 'Assurance', subtitle: 'How to know you are saved', verse: 'These things have I written…that ye may know.', ref: '1 John 5:13', minutes: 9 },
  { id: 3, title: 'Baptism', subtitle: 'Your first step of obedience', verse: 'Buried with him in baptism.', ref: 'Colossians 2:12', minutes: 11 },
  { id: 4, title: 'Church Membership', subtitle: 'Belonging to a local body', verse: 'Forsake not the assembling of ourselves.', ref: 'Hebrews 10:25', minutes: 10 },
  { id: 5, title: 'Spiritual Nourishment', subtitle: 'Feeding on the Word daily', verse: 'Man shall not live by bread alone.', ref: 'Matthew 4:4', minutes: 14 },
  { id: 6, title: 'Prayer', subtitle: 'Speaking with the Father', verse: 'Pray without ceasing.', ref: '1 Thessalonians 5:17', minutes: 12 },
  { id: 7, title: 'Confession of Sin', subtitle: 'Keeping short accounts with God', verse: 'If we confess our sins, he is faithful and just to forgive.', ref: '1 John 1:9', minutes: 8 },
  { id: 8, title: 'Victory Over Sin', subtitle: 'Walking in the Spirit', verse: 'Sin shall not have dominion over you.', ref: 'Romans 6:14', minutes: 13 },
  { id: 9, title: 'Witnessing', subtitle: 'Sharing what Christ has done', verse: 'Ye shall be witnesses unto me.', ref: 'Acts 1:8', minutes: 11 },
  { id: 10, title: 'Spiritual Maturity', subtitle: 'Growing up into Christ', verse: 'Grow in grace, and in the knowledge of…Jesus Christ.', ref: '2 Peter 3:18', minutes: 15 },
].map((l) => ({
  ...l,
  sections: [
    {
      heading: 'Where We Begin',
      items: [{ kind: 'p', text: `${l.title} is one of the early marks of a believer's life. This lesson walks through what Scripture teaches, why it matters, and what it looks like in practice.` }] as SectionItem[],
    },
    {
      heading: 'What Scripture Says',
      items: [
        { kind: 'p', text: 'The key passage below gives us the shape of the doctrine in plain words.' },
        { kind: 'verse', ref: l.ref, text: l.verse },
      ] as SectionItem[],
    },
    {
      heading: 'In Practice',
      items: [{ kind: 'p', text: 'Doctrine is meant to be lived. Below is a simple, practical way to begin walking this out in the coming week.' }] as SectionItem[],
    },
    { heading: 'Reflect', reflect: `What is one specific way you can apply ${l.title.toLowerCase()} this week?` },
  ],
}));

const loaded = loadFromFiles();
export const LESSONS: Lesson[] = loaded.length === 10 ? loaded : PLACEHOLDERS;

export const VERSE_OF_DAY = {
  text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  ref: 'Proverbs 3:5',
};
