// Lazy bible loader. If data/kjv.json exists (fetched via `npm run kjv:fetch`),
// the dynamic import resolves to the full text. Until then, falls back to an
// embedded John 3 sample so the reader is always functional.

export type BibleData = Record<string, Record<string, string[]>>;

const JOHN_3_FALLBACK = [
  'There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:',
  'The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him.',
  'Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.',
  "Nicodemus saith unto him, How can a man be born when he is old? can he enter the second time into his mother's womb, and be born?",
  'Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and of the Spirit, he cannot enter into the kingdom of God.',
  'That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.',
  'Marvel not that I said unto thee, Ye must be born again.',
  'The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh, and whither it goeth: so is every one that is born of the Spirit.',
  'Nicodemus answered and said unto him, How can these things be?',
  'Jesus answered and said unto him, Art thou a master of Israel, and knowest not these things?',
  'Verily, verily, I say unto thee, We speak that we do know, and testify that we have seen; and ye receive not our witness.',
  'If I have told you earthly things, and ye believe not, how shall ye believe, if I tell you of heavenly things?',
  'And no man hath ascended up to heaven, but he that came down from heaven, even the Son of man which is in heaven.',
  'And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:',
  'That whosoever believeth in him should not perish, but have eternal life.',
  'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
  'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.',
  'And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.',
  'For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.',
  'But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought of God.',
  'After these things came Jesus and his disciples into the land of Judaea; and there he tarried with them, and baptized.',
  'And John also was baptizing in Aenon near to Salim, because there was much water there: and they came, and were baptized.',
  'For John was not yet cast into prison.',
  "Then there arose a question between some of John's disciples and the Jews about purifying.",
  'And they came unto John, and said unto him, Rabbi, he that was with thee beyond Jordan, to whom thou barest witness, behold, the same baptizeth, and all men come to him.',
  'John answered and said, A man can receive nothing, except it be given him from heaven.',
  'Ye yourselves bear me witness, that I said, I am not the Christ, but that I am sent before him.',
  "He that hath the bride is the bridegroom: but the friend of the bridegroom, which standeth and heareth him, rejoiceth greatly because of the bridegroom's voice: this my joy therefore is fulfilled.",
  'He must increase, but I must decrease.',
  'He that cometh from above is above all: he that is of the earth is earthly, and speaketh of the earth: he that cometh from heaven is above all.',
  'And what he hath seen and heard, that he testifieth; and no man receiveth his testimony.',
  'He that hath received his testimony hath set to his seal that God is true.',
  'For he whom God hath sent speaketh the words of God: for God giveth not the Spirit by measure unto him.',
  'The Father loveth the Son, and hath given all things into his hand.',
  'He that believeth on the Son hath everlasting life: and he that believeth not the Son shall not see life, but the wrath of God abideth on him.',
];

export function formatBookTitle(name: string): string {
  return name.replace(/^1 /, 'I ').replace(/^2 /, 'II ').replace(/^3 /, 'III ');
}

export function isNumberedBook(name: string): boolean {
  return /^[123] /.test(name);
}

export async function getVerseCount(book: string, chapter: number): Promise<number> {
  const verses = await getChapter(book, chapter);
  return verses.length;
}

export const BIBLE_BOOKS = [
  { name: 'Genesis', chapters: 50 }, { name: 'Exodus', chapters: 40 },
  { name: 'Leviticus', chapters: 27 }, { name: 'Numbers', chapters: 36 },
  { name: 'Deuteronomy', chapters: 34 }, { name: 'Joshua', chapters: 24 },
  { name: 'Judges', chapters: 21 }, { name: 'Ruth', chapters: 4 },
  { name: '1 Samuel', chapters: 31 }, { name: '2 Samuel', chapters: 24 },
  { name: '1 Kings', chapters: 22 }, { name: '2 Kings', chapters: 25 },
  { name: '1 Chronicles', chapters: 29 }, { name: '2 Chronicles', chapters: 36 },
  { name: 'Ezra', chapters: 10 }, { name: 'Nehemiah', chapters: 13 },
  { name: 'Esther', chapters: 10 }, { name: 'Job', chapters: 42 },
  { name: 'Psalms', chapters: 150 }, { name: 'Proverbs', chapters: 31 },
  { name: 'Ecclesiastes', chapters: 12 }, { name: 'Song of Solomon', chapters: 8 },
  { name: 'Isaiah', chapters: 66 }, { name: 'Jeremiah', chapters: 52 },
  { name: 'Lamentations', chapters: 5 }, { name: 'Ezekiel', chapters: 48 },
  { name: 'Daniel', chapters: 12 }, { name: 'Hosea', chapters: 14 },
  { name: 'Joel', chapters: 3 }, { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 }, { name: 'Jonah', chapters: 4 },
  { name: 'Micah', chapters: 7 }, { name: 'Nahum', chapters: 3 },
  { name: 'Habakkuk', chapters: 3 }, { name: 'Zephaniah', chapters: 3 },
  { name: 'Haggai', chapters: 2 }, { name: 'Zechariah', chapters: 14 },
  { name: 'Malachi', chapters: 4 },
  { name: 'Matthew', chapters: 28 }, { name: 'Mark', chapters: 16 },
  { name: 'Luke', chapters: 24 }, { name: 'John', chapters: 21 },
  { name: 'Acts', chapters: 28 }, { name: 'Romans', chapters: 16 },
  { name: '1 Corinthians', chapters: 16 }, { name: '2 Corinthians', chapters: 13 },
  { name: 'Galatians', chapters: 6 }, { name: 'Ephesians', chapters: 6 },
  { name: 'Philippians', chapters: 4 }, { name: 'Colossians', chapters: 4 },
  { name: '1 Thessalonians', chapters: 5 }, { name: '2 Thessalonians', chapters: 3 },
  { name: '1 Timothy', chapters: 6 }, { name: '2 Timothy', chapters: 4 },
  { name: 'Titus', chapters: 3 }, { name: 'Philemon', chapters: 1 },
  { name: 'Hebrews', chapters: 13 }, { name: 'James', chapters: 5 },
  { name: '1 Peter', chapters: 5 }, { name: '2 Peter', chapters: 3 },
  { name: '1 John', chapters: 5 }, { name: '2 John', chapters: 1 },
  { name: '3 John', chapters: 1 }, { name: 'Jude', chapters: 1 },
  { name: 'Revelation', chapters: 22 },
];

let cache: BibleData | null = null;

export async function getBible(): Promise<BibleData | null> {
  if (cache) return cache;
  try {
    const mod = await import('../../data/kjv.json');
    cache = (mod as any).default ?? (mod as unknown as BibleData);
    return cache;
  } catch {
    return null;
  }
}

export async function getChapter(book: string, chapter: number): Promise<string[]> {
  const data = await getBible();
  if (data && data[book] && data[book][String(chapter)]) return data[book][String(chapter)];
  if (book === 'John' && chapter === 3) return JOHN_3_FALLBACK;
  return [];
}

// Paragraph boundaries (verse number at which each new paragraph starts).
export type Paragraphs = Record<string, Record<string, number[]>>;
let paraCache: Paragraphs | null = null;
export async function getParagraphs(book: string, chapter: number): Promise<number[]> {
  if (!paraCache) {
    try {
      const mod = await import('../../data/paragraphs.json');
      paraCache = ((mod as any).default ?? mod) as Paragraphs;
    } catch { paraCache = {}; }
  }
  return paraCache[book]?.[String(chapter)] ?? [1];
}

// Pericope (section) headings.
export type Pericope = { verse: number; title: string };
export type Pericopes = Record<string, Record<string, Pericope[]>>;
let pericopeCache: Pericopes | null = null;
export async function getPericopes(book: string, chapter: number): Promise<Pericope[]> {
  if (!pericopeCache) {
    try {
      const mod = await import('../../data/pericopes.json');
      pericopeCache = ((mod as any).default ?? mod) as Pericopes;
    } catch { pericopeCache = {}; }
  }
  return pericopeCache[book]?.[String(chapter)] ?? [];
}

// Group a chapter into rendered "blocks": each block has an optional title,
// a starting verse number, and the verse texts in order. Pericope titles
// force a block boundary even when no paragraph break is recorded there.
export type Block = { title?: string; startVerse: number; verses: { num: number; text: string }[] };

export async function getChapterBlocks(book: string, chapter: number): Promise<Block[]> {
  const verses = await getChapter(book, chapter);
  if (verses.length === 0) return [];
  const paras = await getParagraphs(book, chapter);
  const pers = await getPericopes(book, chapter);

  const breakSet = new Set<number>([1, ...paras, ...pers.map((p) => p.verse)]);
  const breaks = Array.from(breakSet).sort((a, b) => a - b).filter((v) => v >= 1 && v <= verses.length);

  const titleAt = new Map<number, string>();
  for (const p of pers) titleAt.set(p.verse, p.title);

  const blocks: Block[] = [];
  for (let i = 0; i < breaks.length; i++) {
    const start = breaks[i];
    const end = i + 1 < breaks.length ? breaks[i + 1] - 1 : verses.length;
    const items: { num: number; text: string }[] = [];
    for (let v = start; v <= end; v++) {
      items.push({ num: v, text: verses[v - 1] });
    }
    blocks.push({ title: titleAt.get(start), startVerse: start, verses: items });
  }
  return blocks;
}
