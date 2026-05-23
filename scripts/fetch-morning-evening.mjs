#!/usr/bin/env node
// Downloads Morning and Evening by C.H. Spurgeon from CCEL (public domain EPUB)
// and converts to data/morning-evening.json with ~732 entries (366 days × 2 periods).
//
// EPUB structure: one HTML file per entry, named morneve.dMMDDam.html / morneve.dMMDDpm.html
//   <p class="passage"><i>"verse text"</i></p>
//   <h3 class="scripPassage"><a class="scripRef">Book Ch:V</a></h3>
//   <p class="normal">body paragraph...</p>

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import unzipper from 'unzipper';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'data', 'morning-evening.json');
const EPUB_URL = 'https://ccel.org/ccel/s/spurgeon/morneve/cache/morneve.epub';

const MONTH_ABBR = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

// Parse morneve.dMMDDam/pm.html filename → { date: "jan-1", period: "morning"|"evening" }
function parseName(path) {
  const m = path.match(/morneve\.d(\d{2})(\d{2})(am|pm)\.html?$/i);
  if (!m) return null;
  const monthIdx = parseInt(m[1], 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return null;
  const day = parseInt(m[2], 10);
  return {
    date: `${MONTH_ABBR[monthIdx]}-${day}`,
    period: m[3] === 'am' ? 'morning' : 'evening',
  };
}

function parseEntry(html, meta) {
  const $ = cheerio.load(html);

  // Opening verse text — inside <p class="passage"> <i>...</i>
  let verseText = $('p.passage i').first().text().trim()
    .replace(/^[""“”]+/, '').replace(/[""“”]+$/, '').trim();

  // Scripture reference — <h3 class="scripPassage"> <a class="scripRef">...</a>
  const scriptureRef = $('h3.scripPassage a.scripRef').first().text().trim()
    || $('h3.scripPassage').first().text().trim();

  // Body paragraphs — all <p class="normal">
  const bodyParts = [];
  $('p.normal').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 15) bodyParts.push(text);
  });
  const body = bodyParts.join('\n\n');

  return { ...meta, scriptureRef, verseText, body };
}

async function main() {
  console.log('Downloading Morning and Evening EPUB from CCEL...');
  const res = await fetch(EPUB_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BibleStudyApp/1.0)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded ${(buffer.length / 1024).toFixed(0)} KB`);

  // Unzip
  const zip = await unzipper.Open.buffer(buffer);
  const entries = [];

  for (const file of zip.files) {
    if (file.type !== 'File') continue;
    const meta = parseName(file.path);
    if (!meta) continue; // skip non-entry files (intro, toc, etc.)

    const html = (await file.buffer()).toString('utf8');
    const entry = parseEntry(html, meta);
    entries.push(entry);
  }

  // Sort: jan-1 morning, jan-1 evening, jan-2 morning, ...
  entries.sort((a, b) => {
    const [am, ad] = a.date.split('-');
    const [bm, bd] = b.date.split('-');
    const mi = MONTH_ABBR.indexOf(am) - MONTH_ABBR.indexOf(bm);
    if (mi !== 0) return mi;
    const di = parseInt(ad) - parseInt(bd);
    if (di !== 0) return di;
    return a.period === 'morning' ? -1 : 1;
  });

  // Validate
  const mornings = entries.filter(e => e.period === 'morning').length;
  const evenings = entries.filter(e => e.period === 'evening').length;
  const emptyBody = entries.filter(e => !e.body || e.body.trim().length < 50);

  console.log(`\nExtracted ${entries.length} entries (${mornings} mornings, ${evenings} evenings)`);
  if (emptyBody.length) console.warn(`WARNING: ${emptyBody.length} entries with short body`);

  if (entries[0]) console.log(`First: ${entries[0].date} ${entries[0].period} — ${entries[0].scriptureRef}`);
  const last = entries[entries.length - 1];
  if (last) console.log(`Last:  ${last.date} ${last.period} — ${last.scriptureRef}`);

  const dataDir = resolve(__dirname, '..', 'data');
  if (!existsSync(dataDir)) await mkdir(dataDir, { recursive: true });
  await writeFile(OUT, JSON.stringify(entries, null, 2));
  console.log(`\nWritten to ${OUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });
