#!/usr/bin/env node
// Downloads the World English Bible USFM (public domain) and extracts the
// paragraph boundaries: for each book/chapter, the verse numbers at which a
// new paragraph (`\p`, `\m`, `\pi`, `\q1`, …) starts. Emits data/paragraphs.json
// with shape:
//   { "John": { "1": [1, 6, 10, 14, 19, 20, …], "3": [1, 9, 16, 22, …] }, … }
//
// WEB is broadly compatible with KJV verse numbering, so this provides a
// reasonable YouVersion-style chunking for our bundled KJV text.

import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'data', 'paragraphs.json');
const ZIP_URL = 'https://ebible.org/Scriptures/eng-web_usfm.zip';

// USFM 3-letter book codes → our pretty names
const BOOK_MAP = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
  JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
  EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalms',
  PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Solomon',
  ISA: 'Isaiah', JER: 'Jeremiah', LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel',
  HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah',
  MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah',
  HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi',
  MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts',
  ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians',
  GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians',
  '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy',
  TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews', JAS: 'James',
  '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John', '3JN': '3 John',
  JUD: 'Jude', REV: 'Revelation',
};

async function downloadZip() {
  const tmpZip = join(tmpdir(), 'web_usfm.zip');
  const tmpDir = join(tmpdir(), 'web_usfm_extracted');
  const res = await fetch(ZIP_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching WEB USFM`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(tmpZip, buf);
  spawnSync('rm', ['-rf', tmpDir]);
  spawnSync('mkdir', ['-p', tmpDir]);
  const r = spawnSync('unzip', ['-oq', tmpZip, '-d', tmpDir]);
  if (r.status !== 0) throw new Error(`unzip failed: ${r.stderr?.toString()}`);
  return tmpDir;
}

// Parse one book file, return { 'John': { '1': [...], '3': [...] } } shape.
function parseBook(text) {
  // Identify the book code from `\id <CODE>`
  const idMatch = text.match(/^\\id\s+(\w+)/m);
  if (!idMatch) return null;
  const code = idMatch[1].toUpperCase();
  const bookName = BOOK_MAP[code];
  if (!bookName) return null;

  const out = {};
  let chapter = null;
  let lastParaStartedAtVerse = null;
  let pendingPara = false; // paragraph marker seen, awaiting next \v

  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const cMatch = line.match(/^\\c\s+(\d+)/);
    if (cMatch) {
      chapter = cMatch[1];
      out[chapter] = [1];          // always start at verse 1
      lastParaStartedAtVerse = 1;
      pendingPara = false;
      continue;
    }
    if (!chapter) continue;
    // Any "new block" marker we treat as a paragraph break.
    if (/^\\(p|m|pi\d*|pc|pmo|pm|pmc|pmr|cls|li\d*|q\d*|qm\d*|qr|qa|qc|qd|sp|nb|b)\b/.test(line)
        || /^\\(p|m)$/.test(line)) {
      pendingPara = true;
      continue;
    }
    const vMatch = line.match(/^\\v\s+(\d+)/);
    if (vMatch) {
      const verseNum = Number(vMatch[1]);
      if (pendingPara && verseNum !== lastParaStartedAtVerse) {
        out[chapter].push(verseNum);
        lastParaStartedAtVerse = verseNum;
      }
      pendingPara = false;
    }
  }
  // Dedupe + sort each chapter
  for (const ch of Object.keys(out)) {
    out[ch] = Array.from(new Set(out[ch])).sort((a, b) => a - b);
  }
  return { [bookName]: out };
}

async function main() {
  const dir = await downloadZip();
  const files = (await readdir(dir)).filter((f) => f.endsWith('.usfm'));
  const all = {};
  for (const f of files) {
    const text = await readFile(join(dir, f), 'utf8');
    const parsed = parseBook(text);
    if (!parsed) continue;
    Object.assign(all, parsed);
    const [name] = Object.keys(parsed);
    const chCount = Object.keys(parsed[name]).length;
    console.log(`${name.padEnd(20)} ${chCount} ch`);
  }
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(all));
  console.log(`\nWrote ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
