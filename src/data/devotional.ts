import rawEntries from '../../data/morning-evening.json';

export type DevotionalPeriod = 'morning' | 'evening';

export type DevotionalEntry = {
  date: string;           // "jan-1" … "dec-31"
  period: DevotionalPeriod;
  scriptureRef: string;   // "Joshua 5:12"
  verseText: string;      // opening verse text (no quotation marks)
  body: string;           // paragraphs joined by \n\n
};

export const DEVOTIONAL_SERIES = {
  id: 'morning-evening' as const,
  title: 'Morning and Evening',
  author: 'Charles H. Spurgeon',
  description:
    'A year of daily devotions from the Prince of Preachers — one reading for morning, one for evening, for every day of the year.',
  totalDays: 366,
  accentIndex: 1,
} as const;

export const DEVOTIONAL_ENTRIES: DevotionalEntry[] = rawEntries as DevotionalEntry[];

// O(1) lookup by "jan-1:morning" key
const ENTRY_MAP = new Map<string, DevotionalEntry>(
  DEVOTIONAL_ENTRIES.map((e) => [`${e.date}:${e.period}`, e])
);

export function getEntry(date: string, period: DevotionalPeriod): DevotionalEntry | undefined {
  return ENTRY_MAP.get(`${date}:${period}`);
}

const MONTH_ABBR = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;

export function todayDateKey(): string {
  const d = new Date();
  return `${MONTH_ABBR[d.getMonth()]}-${d.getDate()}`;
}

export function formatDevotionalDate(dateKey: string): string {
  const [monthAbbr, day] = dateKey.split('-');
  const monthIdx = MONTH_ABBR.indexOf(monthAbbr as typeof MONTH_ABBR[number]);
  if (monthIdx < 0) return dateKey;
  const d = new Date(2000, monthIdx, Number(day));
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function devotionalDaysRead(read: Record<string, boolean>): number {
  const days = new Set(Object.keys(read).map((k) => k.split(':')[0]));
  return days.size;
}
