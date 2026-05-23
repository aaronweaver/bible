#!/usr/bin/env node
// Generates all Bible reading plan JSON files:
//   data/reading-plans-meta.json        — eagerly bundled metadata (~2 KB)
//   data/reading-plans/[planId].json    — one per plan, lazy loaded

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const PLANS_DIR = resolve(DATA_DIR, 'reading-plans');

// === Bible book data (mirrors src/data/bible.ts BIBLE_BOOKS) ===
const BIBLE_BOOKS = [
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
  // NT starts at index 39
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

// Expand book segments to flat [{book, chapter}] array
function expand(segments) {
  const out = [];
  for (const seg of segments) {
    const from = seg.from ?? 1;
    const to = seg.to ?? BIBLE_BOOKS.find(b => b.name === seg.book).chapters;
    for (let ch = from; ch <= to; ch++) out.push({ book: seg.book, chapter: ch });
  }
  return out;
}

// Distribute N readings evenly across `days` day-slots.
// First `extras` slots get one extra reading so none are left over.
function distributeAcross(readings, days) {
  const perDay = Math.floor(readings.length / days);
  const extras = readings.length - perDay * days;
  const slots = [];
  let i = 0;
  for (let d = 0; d < days; d++) {
    const count = d < extras ? perDay + 1 : perDay;
    slots.push(readings.slice(i, i + count));
    i += count;
  }
  return slots;
}

// Build ReadingDay array from per-day reading lists
function buildDays(slotsPerStream, dayCount) {
  return Array.from({ length: dayCount }, (_, i) => ({
    day: i + 1,
    readings: slotsPerStream.flatMap(s => s[i] ?? []),
  }));
}

// === Plan generators ===

function genSequential() {
  const all = expand(BIBLE_BOOKS.map(b => ({ book: b.name })));
  const slots = distributeAcross(all, 365);
  return buildDays([slots], 365);
}

function genChronological() {
  // Reads the Bible in roughly historical order.
  // Key differences: Job after Gen 1-11, Psalms distributed by era,
  // prophets placed with their historical period, NT by authorship date.
  const segments = [
    // Ancient world
    { book: 'Genesis', from: 1, to: 11 },
    { book: 'Job' },
    { book: 'Genesis', from: 12, to: 50 },
    // Exodus through Conquest
    { book: 'Exodus' }, { book: 'Leviticus' }, { book: 'Numbers' }, { book: 'Deuteronomy' },
    { book: 'Joshua' }, { book: 'Judges' }, { book: 'Ruth' },
    // United Kingdom
    { book: '1 Samuel' }, { book: '2 Samuel' },
    { book: 'Psalms', from: 1, to: 72 },
    { book: '1 Kings', from: 1, to: 11 }, { book: '2 Chronicles', from: 1, to: 9 },
    { book: 'Proverbs' }, { book: 'Ecclesiastes' }, { book: 'Song of Solomon' },
    // Divided Kingdom — Israel (Northern)
    { book: '1 Kings', from: 12, to: 22 }, { book: '2 Chronicles', from: 10, to: 28 },
    { book: 'Amos' }, { book: 'Hosea' }, { book: 'Jonah' }, { book: 'Micah' },
    { book: '2 Kings', from: 1, to: 17 }, { book: '1 Chronicles' },
    // Divided Kingdom — Judah (Southern)
    { book: 'Joel' }, { book: 'Isaiah' },
    { book: '2 Kings', from: 18, to: 25 }, { book: '2 Chronicles', from: 29, to: 36 },
    { book: 'Psalms', from: 73, to: 89 },
    { book: 'Nahum' }, { book: 'Habakkuk' }, { book: 'Zephaniah' },
    { book: 'Jeremiah' }, { book: 'Lamentations' }, { book: 'Obadiah' }, { book: 'Ezekiel' },
    { book: 'Psalms', from: 90, to: 150 },
    { book: 'Daniel' },
    // Return from Exile
    { book: 'Haggai' }, { book: 'Ezra', from: 1, to: 6 }, { book: 'Zechariah' },
    { book: 'Ezra', from: 7, to: 10 }, { book: 'Nehemiah' }, { book: 'Esther' }, { book: 'Malachi' },
    // NT roughly by authorship/events
    { book: 'Matthew' }, { book: 'Mark' }, { book: 'Luke' }, { book: 'John' }, { book: 'Acts' },
    { book: 'James' }, { book: 'Galatians' }, { book: '1 Thessalonians' }, { book: '2 Thessalonians' },
    { book: '1 Corinthians' }, { book: '2 Corinthians' }, { book: 'Romans' },
    { book: 'Philippians' }, { book: 'Colossians' }, { book: 'Philemon' }, { book: 'Ephesians' },
    { book: '1 Timothy' }, { book: '2 Timothy' }, { book: 'Titus' }, { book: 'Hebrews' },
    { book: '1 Peter' }, { book: '2 Peter' }, { book: 'Jude' },
    { book: '1 John' }, { book: '2 John' }, { book: '3 John' }, { book: 'Revelation' },
  ];
  const all = expand(segments);
  const slots = distributeAcross(all, 365);
  return buildDays([slots], 365);
}

function genMcCheyne() {
  // Inspired by Robert Murray M'Cheyne's 1843 plan.
  // Three parallel streams read simultaneously each day:
  //   A) OT Historical narrative (Genesis–Esther, 436 chapters)
  //   B) OT Wisdom & Prophecy  (Job–Malachi, 493 chapters)
  //   C) New Testament (Matthew–Revelation, read twice = 520 chapters)
  // Total: 1,449 chapters / 365 days ≈ 3.97 readings/day
  const streamA = expand([
    { book: 'Genesis' }, { book: 'Exodus' }, { book: 'Leviticus' }, { book: 'Numbers' },
    { book: 'Deuteronomy' }, { book: 'Joshua' }, { book: 'Judges' }, { book: 'Ruth' },
    { book: '1 Samuel' }, { book: '2 Samuel' }, { book: '1 Kings' }, { book: '2 Kings' },
    { book: '1 Chronicles' }, { book: '2 Chronicles' },
    { book: 'Ezra' }, { book: 'Nehemiah' }, { book: 'Esther' },
  ]); // 436 chapters

  const streamB = expand([
    { book: 'Job' }, { book: 'Psalms' }, { book: 'Proverbs' }, { book: 'Ecclesiastes' },
    { book: 'Song of Solomon' }, { book: 'Isaiah' }, { book: 'Jeremiah' }, { book: 'Lamentations' },
    { book: 'Ezekiel' }, { book: 'Daniel' }, { book: 'Hosea' }, { book: 'Joel' }, { book: 'Amos' },
    { book: 'Obadiah' }, { book: 'Jonah' }, { book: 'Micah' }, { book: 'Nahum' },
    { book: 'Habakkuk' }, { book: 'Zephaniah' }, { book: 'Haggai' }, { book: 'Zechariah' }, { book: 'Malachi' },
  ]); // 493 chapters

  const ntOnce = BIBLE_BOOKS.slice(39).flatMap(b =>
    Array.from({ length: b.chapters }, (_, i) => ({ book: b.name, chapter: i + 1 }))
  ); // 260 chapters — read twice → 520
  const streamC = [...ntOnce, ...ntOnce];

  return buildDays([
    distributeAcross(streamA, 365),
    distributeAcross(streamB, 365),
    distributeAcross(streamC, 365),
  ], 365);
}

function genNT90() {
  const all = BIBLE_BOOKS.slice(39).flatMap(b =>
    Array.from({ length: b.chapters }, (_, i) => ({ book: b.name, chapter: i + 1 }))
  ); // 260 NT chapters
  const slots = distributeAcross(all, 90);
  return buildDays([slots], 90);
}

function genProverbs() {
  return Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    readings: [{ book: 'Proverbs', chapter: i + 1 }],
  }));
}

function genPsalms() {
  const all = Array.from({ length: 150 }, (_, i) => ({ book: 'Psalms', chapter: i + 1 }));
  const slots = distributeAcross(all, 30);
  return buildDays([slots], 30);
}

function genGospels() {
  const all = expand(['Matthew', 'Mark', 'Luke', 'John'].map(book => ({ book })));
  const slots = distributeAcross(all, 30);
  return buildDays([slots], 30);
}

function genSOTM() {
  return [
    { day: 1, label: 'The Beatitudes', readings: [{ book: 'Matthew', chapter: 5, startVerse: 1, endVerse: 20 }] },
    { day: 2, label: 'A Higher Standard', readings: [{ book: 'Matthew', chapter: 5, startVerse: 21, endVerse: 48 }] },
    { day: 3, label: 'Prayer and Fasting', readings: [{ book: 'Matthew', chapter: 6, startVerse: 1, endVerse: 18 }] },
    { day: 4, label: "Don't Worry", readings: [{ book: 'Matthew', chapter: 6, startVerse: 19, endVerse: 34 }] },
    { day: 5, label: 'Ask, Seek, Knock', readings: [{ book: 'Matthew', chapter: 7, startVerse: 1, endVerse: 12 }] },
    { day: 6, label: 'Two Ways', readings: [{ book: 'Matthew', chapter: 7, startVerse: 13, endVerse: 29 }] },
    { day: 7, label: 'Read It All', readings: [
      { book: 'Matthew', chapter: 5 },
      { book: 'Matthew', chapter: 6 },
      { book: 'Matthew', chapter: 7 },
    ] },
  ];
}

// === Metadata ===
const META = [
  {
    id: 'bible-sequential',
    title: 'Bible in a Year',
    subtitle: 'Sequential · 365 days',
    description: 'Read through the entire Bible from Genesis to Revelation in one year, following the canonical book order.',
    totalDays: 365,
    accentIndex: 0,
    icon: 'book',
  },
  {
    id: 'bible-chronological',
    title: 'Bible in a Year',
    subtitle: 'Chronological · 365 days',
    description: 'Read the Bible in the order events occurred — from creation through Revelation — placing each book in its historical context.',
    totalDays: 365,
    accentIndex: 2,
    icon: 'book',
  },
  {
    id: 'bible-mccheyne',
    title: 'Bible in a Year',
    subtitle: "M'Cheyne · 365 days",
    description: "Robert Murray M'Cheyne's classic 1843 plan — 3–4 readings per day from both Testaments simultaneously, with the NT read twice.",
    totalDays: 365,
    accentIndex: 4,
    icon: 'book',
  },
  {
    id: 'nt-90',
    title: 'New Testament in 90 Days',
    subtitle: '90 days · ~3 chapters/day',
    description: 'Read through the entire New Testament — Matthew through Revelation — in just 90 days.',
    totalDays: 90,
    accentIndex: 3,
    icon: 'bookmark',
  },
  {
    id: 'proverbs-31',
    title: 'Proverbs in 31 Days',
    subtitle: '31 days · 1 chapter/day',
    description: 'One chapter of Proverbs per day for a month of practical wisdom from Solomon.',
    totalDays: 31,
    accentIndex: 1,
    icon: 'sparkles',
  },
  {
    id: 'psalms-30',
    title: 'Psalms in 30 Days',
    subtitle: '30 days · 5 chapters/day',
    description: 'Read all 150 Psalms in 30 days — a month of prayer, praise, lament, and worship.',
    totalDays: 30,
    accentIndex: 5,
    icon: 'sparkles',
  },
  {
    id: 'gospels-30',
    title: 'The Gospels in 30 Days',
    subtitle: '30 days · ~3 chapters/day',
    description: "Read all four Gospel accounts of Jesus' life and ministry — Matthew, Mark, Luke, and John — in one month.",
    totalDays: 30,
    accentIndex: 0,
    icon: 'bookmark',
  },
  {
    id: 'sotm-7',
    title: 'Sermon on the Mount',
    subtitle: '7 days · Matthew 5–7',
    description: "Jesus' most famous teaching — the Beatitudes, the Lord's Prayer, and the Golden Rule — studied in seven focused days.",
    totalDays: 7,
    accentIndex: 2,
    icon: 'sparkles',
  },
];

const PLANS = [
  { id: 'bible-sequential', gen: genSequential },
  { id: 'bible-chronological', gen: genChronological },
  { id: 'bible-mccheyne', gen: genMcCheyne },
  { id: 'nt-90', gen: genNT90 },
  { id: 'proverbs-31', gen: genProverbs },
  { id: 'psalms-30', gen: genPsalms },
  { id: 'gospels-30', gen: genGospels },
  { id: 'sotm-7', gen: genSOTM },
];

async function main() {
  if (!existsSync(PLANS_DIR)) await mkdir(PLANS_DIR, { recursive: true });

  await writeFile(
    resolve(DATA_DIR, 'reading-plans-meta.json'),
    JSON.stringify(META, null, 2)
  );
  console.log('Written reading-plans-meta.json');

  for (const { id, gen } of PLANS) {
    const days = gen();
    const totalReadings = days.reduce((s, d) => s + d.readings.length, 0);
    await writeFile(
      resolve(PLANS_DIR, `${id}.json`),
      JSON.stringify({ id, days })
    );
    console.log(`Written reading-plans/${id}.json  (${days.length} days, ${totalReadings} readings)`);
  }

  // Validation
  console.log('\nValidation:');
  for (const { id, gen } of PLANS) {
    const days = gen();
    const meta = META.find(m => m.id === id);
    const ok = days.length === meta.totalDays;
    console.log(`  ${ok ? '✓' : '✗'} ${id}: ${days.length}/${meta.totalDays} days`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
