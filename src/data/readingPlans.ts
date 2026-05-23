import rawMeta from '../../data/reading-plans-meta.json';

export type Reading = {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
};

export type ReadingDay = {
  day: number;
  readings: Reading[];
  label?: string;
};

export type ReadingPlanMeta = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  totalDays: number;
  accentIndex: number;
  icon: string;
};

export type ReadingPlanStatus = 'not-added' | 'in-progress' | 'completed';

export type ReadingPlanProgress = {
  status: ReadingPlanStatus;
  currentDay: number;
  completedDays: number[];
};

export const READING_PLANS_META: ReadingPlanMeta[] = rawMeta as ReadingPlanMeta[];

const dayCache = new Map<string, ReadingDay[]>();

export async function getPlanDays(planId: string): Promise<ReadingDay[]> {
  if (dayCache.has(planId)) return dayCache.get(planId)!;
  const mod = await import(`../../data/reading-plans/${planId}.json`);
  const days: ReadingDay[] = mod.default.days;
  dayCache.set(planId, days);
  return days;
}

export function readingsLabel(readings: Reading[]): string {
  const groups: { book: string; chapters: number[]; startVerse?: number; endVerse?: number }[] = [];
  for (const r of readings) {
    const last = groups[groups.length - 1];
    if (last && last.book === r.book && !r.startVerse && !last.startVerse) {
      last.chapters.push(r.chapter);
    } else {
      groups.push({ book: r.book, chapters: [r.chapter], startVerse: r.startVerse, endVerse: r.endVerse });
    }
  }
  return groups.map(g => {
    const chs = g.chapters;
    const range = chs.length === 1 ? `${chs[0]}` : `${chs[0]}–${chs[chs.length - 1]}`;
    const suffix = g.startVerse ? `:${g.startVerse}–${g.endVerse}` : '';
    return `${g.book} ${range}${suffix}`;
  }).join(' · ');
}

export function planProgressPct(prog: ReadingPlanProgress, totalDays: number): number {
  return Math.round(((prog.currentDay - 1) / totalDays) * 100);
}
