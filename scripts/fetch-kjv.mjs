#!/usr/bin/env node
// Downloads a public-domain KJV bible (one JSON file per book) and reshapes
// into a single data/kjv.json with shape:
//   { "Genesis": { "1": ["In the beginning…", …], … }, … }

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'data', 'kjv.json');

const BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1Samuel','2Samuel','1Kings','2Kings','1Chronicles','2Chronicles','Ezra','Nehemiah',
  'Esther','Job','Psalms','Proverbs','Ecclesiastes','SongofSolomon','Isaiah','Jeremiah',
  'Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah',
  'Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans','1Corinthians','2Corinthians',
  'Galatians','Ephesians','Philippians','Colossians','1Thessalonians','2Thessalonians',
  '1Timothy','2Timothy','Titus','Philemon','Hebrews','James','1Peter','2Peter',
  '1John','2John','3John','Jude','Revelation',
];

const PRETTY = {
  '1Samuel': '1 Samuel', '2Samuel': '2 Samuel',
  '1Kings': '1 Kings', '2Kings': '2 Kings',
  '1Chronicles': '1 Chronicles', '2Chronicles': '2 Chronicles',
  'SongofSolomon': 'Song of Solomon',
  '1Corinthians': '1 Corinthians', '2Corinthians': '2 Corinthians',
  '1Thessalonians': '1 Thessalonians', '2Thessalonians': '2 Thessalonians',
  '1Timothy': '1 Timothy', '2Timothy': '2 Timothy',
  '1Peter': '1 Peter', '2Peter': '2 Peter',
  '1John': '1 John', '2John': '2 John', '3John': '3 John',
};

const BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

async function fetchBook(name) {
  const url = `${BASE}/${name}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  if (!existsSync(dirname(OUT))) await mkdir(dirname(OUT), { recursive: true });

  const out = {};
  for (const slug of BOOKS) {
    const pretty = PRETTY[slug] ?? slug;
    process.stdout.write(`fetching ${pretty}… `);
    try {
      const book = await fetchBook(slug);
      const chapters = {};
      for (const ch of book.chapters ?? []) {
        chapters[ch.chapter] = (ch.verses ?? []).map((v) => v.text);
      }
      out[pretty] = chapters;
      const total = Object.values(chapters).reduce((s, v) => s + v.length, 0);
      console.log(`${Object.keys(chapters).length} ch / ${total} v`);
    } catch (e) {
      console.log(`SKIP (${e.message})`);
    }
  }

  await writeFile(OUT, JSON.stringify(out));
  console.log(`\nWrote ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
