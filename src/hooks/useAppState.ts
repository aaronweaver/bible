import { useCallback, useEffect, useState } from 'react';
import type { DevotionalPeriod } from '../data/devotional';
import { todayISO, type ReadingPlanProgress } from '../data/readingPlans';

export type DevotionalStatus = 'not-added' | 'in-progress' | 'completed';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: '#fbbf24',
  green: '#34d399',
  blue: '#60a5fa',
  pink: '#f472b6',
};

export type DevotionalProgress = {
  status: DevotionalStatus;
  read: Record<string, boolean>; // "jan-1:morning" → true
};

export type LessonProgress = {
  sectionsDone: number;
  reflections: Record<number, string>;
  // Question answers keyed by "<sectionIdx>:<questionNum>"
  answers?: Record<string, string>;
  completed: boolean;
};

export type AppState = {
  progress: Record<number, LessonProgress>;
  bibleHighlights: Record<string, Record<number, HighlightColor>>;
  lastRead: { book: string; chapter: number; verse?: number } | null;
  prefs: { dark: boolean; fontScale: number; verseLayout: 'paragraph' | 'verse' };
  devotional: DevotionalProgress;
  readingPlans: Record<string, ReadingPlanProgress>;
  // New Believers course is opt-in; added from Find.
  lessonsAdded: boolean;
};

const STORAGE_KEY = 'cornerstone.v1';

const DEFAULT_STATE: AppState = {
  progress: {},
  bibleHighlights: {},
  lastRead: { book: 'John', chapter: 3, verse: 16 },
  prefs: { dark: false, fontScale: 100, verseLayout: 'paragraph' as const },
  devotional: { status: 'not-added', read: {} },
  readingPlans: {},
  lessonsAdded: false,
};

function migrateHighlights(raw: unknown): Record<string, Record<number, HighlightColor>> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, Record<number, HighlightColor>> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      const m: Record<number, HighlightColor> = {};
      for (const v of val) if (typeof v === 'number') m[v] = 'yellow';
      out[key] = m;
    } else if (val && typeof val === 'object') {
      out[key] = val as Record<number, HighlightColor>;
    }
  }
  return out;
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE, ...parsed,
      bibleHighlights: migrateHighlights(parsed.bibleHighlights),
      prefs: { ...DEFAULT_STATE.prefs, ...(parsed.prefs ?? {}) },
      devotional: { ...DEFAULT_STATE.devotional, ...(parsed.devotional ?? {}) },
      readingPlans: parsed.readingPlans ?? {},
      // Existing users who already have lesson progress keep the course visible.
      lessonsAdded: parsed.lessonsAdded ?? Object.keys(parsed.progress ?? {}).length > 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

let memory: AppState = load();
const listeners = new Set<(s: AppState) => void>();

function persist(next: AppState) {
  memory = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
  listeners.forEach((l) => l(memory));
}

export function useAppState() {
  const [state, setState] = useState<AppState>(memory);
  useEffect(() => {
    const fn = (s: AppState) => setState(s);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const update = useCallback((patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
    const p = typeof patch === 'function' ? patch(memory) : patch;
    persist({ ...memory, ...p });
  }, []);

  const updateLesson = useCallback((id: number, patch: Partial<LessonProgress>) => {
    const cur = memory.progress[id] ?? { sectionsDone: 0, reflections: {}, completed: false };
    persist({ ...memory, lessonsAdded: true, progress: { ...memory.progress, [id]: { ...cur, ...patch } } });
  }, []);

  const setReflection = useCallback((id: number, idx: number, value: string) => {
    const cur = memory.progress[id] ?? { sectionsDone: 0, reflections: {}, completed: false };
    persist({
      ...memory,
      progress: {
        ...memory.progress,
        [id]: { ...cur, reflections: { ...cur.reflections, [idx]: value } },
      },
    });
  }, []);

  const setAnswer = useCallback((id: number, key: string, value: string) => {
    const cur = memory.progress[id] ?? { sectionsDone: 0, reflections: {}, completed: false };
    persist({
      ...memory,
      progress: {
        ...memory.progress,
        [id]: { ...cur, answers: { ...(cur.answers ?? {}), [key]: value } },
      },
    });
  }, []);

  const setHighlight = useCallback((key: string, verse: number, color: HighlightColor | null) => {
    const cur = memory.bibleHighlights[key] ?? {};
    const next = { ...cur };
    if (color === null) delete next[verse];
    else next[verse] = color;
    persist({ ...memory, bibleHighlights: { ...memory.bibleHighlights, [key]: next } });
  }, []);

  const setPrefs = useCallback((patch: Partial<AppState['prefs']>) => {
    persist({ ...memory, prefs: { ...memory.prefs, ...patch } });
  }, []);

  const addDevotional = useCallback(() => {
    if (memory.devotional.status === 'not-added') {
      persist({ ...memory, devotional: { ...memory.devotional, status: 'in-progress' } });
    }
  }, []);

  const markDevotionalRead = useCallback((date: string, period: DevotionalPeriod) => {
    const key = `${date}:${period}`;
    const nextRead = { ...memory.devotional.read, [key]: true };
    const readCount = Object.keys(nextRead).length;
    const status: DevotionalStatus = readCount >= 732 ? 'completed' : 'in-progress';
    persist({ ...memory, devotional: { status, read: nextRead } });
  }, []);

  const addPlan = useCallback((planId: string) => {
    if (memory.readingPlans[planId]?.status !== 'not-added' && memory.readingPlans[planId]) return;
    persist({
      ...memory,
      readingPlans: {
        ...memory.readingPlans,
        [planId]: { status: 'in-progress', currentDay: 1, completedDays: [], startDate: todayISO() },
      },
    });
  }, []);

  /**
   * Shift the plan's startDate so that the user's next incomplete day lands on today.
   * Lets the user "catch up" after missing days without losing completed-day history.
   */
  const shiftPlanDatesToToday = useCallback((planId: string) => {
    const cur = memory.readingPlans[planId];
    if (!cur) return;
    const nextDay = cur.currentDay;
    // Set startDate so that day=nextDay falls on today.
    const today = new Date();
    today.setDate(today.getDate() - (nextDay - 1));
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const newStart = `${yyyy}-${mm}-${dd}`;
    persist({
      ...memory,
      readingPlans: {
        ...memory.readingPlans,
        [planId]: { ...cur, startDate: newStart },
      },
    });
  }, []);

  const markPlanDayComplete = useCallback((
    planId: string, day: number, totalDays: number, totalReadings?: number,
  ) => {
    const cur = memory.readingPlans[planId] ?? { status: 'in-progress', currentDay: 1, completedDays: [] };
    const completedDays = cur.completedDays.includes(day) ? cur.completedDays : [...cur.completedDays, day];
    const nextDay = Math.min(day + 1, totalDays);
    const status: ReadingPlanProgress['status'] = day >= totalDays ? 'completed' : 'in-progress';
    const completedReadings = totalReadings != null
      ? {
          ...(cur.completedReadings ?? {}),
          [day]: Array.from({ length: totalReadings }, (_, i) => i),
        }
      : cur.completedReadings;
    persist({
      ...memory,
      readingPlans: {
        ...memory.readingPlans,
        [planId]: { ...cur, status, currentDay: nextDay, completedDays, completedReadings },
      },
    });
  }, []);

  const togglePlanReading = useCallback((
    planId: string, day: number, readingIdx: number,
    totalReadings: number, totalDays: number, forceComplete = false,
  ) => {
    const cur = memory.readingPlans[planId] ?? { status: 'in-progress' as const, currentDay: 1, completedDays: [], completedReadings: {} };
    const prevReadings = cur.completedReadings ?? {};
    const wasDayDone = cur.completedDays.includes(day);
    const dayList = prevReadings[day]
      ?? (wasDayDone ? Array.from({ length: totalReadings }, (_, i) => i) : []);
    const has = dayList.includes(readingIdx);
    const nextDayList = forceComplete
      ? (has ? dayList : [...dayList, readingIdx])
      : (has ? dayList.filter(i => i !== readingIdx) : [...dayList, readingIdx]);
    const nextReadings = { ...prevReadings, [day]: nextDayList };

    const allDone = nextDayList.length >= totalReadings;
    let completedDays = cur.completedDays;
    if (allDone && !wasDayDone) completedDays = [...completedDays, day];
    else if (!allDone && wasDayDone) completedDays = completedDays.filter(d => d !== day);

    const status: ReadingPlanProgress['status'] =
      completedDays.length >= totalDays ? 'completed' : 'in-progress';

    persist({
      ...memory,
      readingPlans: {
        ...memory.readingPlans,
        [planId]: { ...cur, status, completedDays, completedReadings: nextReadings },
      },
    });
  }, []);

  const setPlanDay = useCallback((planId: string, day: number) => {
    const cur = memory.readingPlans[planId] ?? { status: 'in-progress', currentDay: 1, completedDays: [] };
    persist({
      ...memory,
      readingPlans: {
        ...memory.readingPlans,
        [planId]: { ...cur, currentDay: day },
      },
    });
  }, []);

  const removePlan = useCallback((planId: string) => {
    const { [planId]: _removed, ...rest } = memory.readingPlans;
    persist({ ...memory, readingPlans: rest });
  }, []);

  const addCourse = useCallback(() => {
    if (!memory.lessonsAdded) persist({ ...memory, lessonsAdded: true });
  }, []);

  const removeLessonProgress = useCallback(() => {
    persist({ ...memory, progress: {}, lessonsAdded: false });
  }, []);

  const removeDevotional = useCallback(() => {
    persist({ ...memory, devotional: { status: 'not-added', read: {} } });
  }, []);

  return { state, update, updateLesson, setReflection, setAnswer, setHighlight, setPrefs, addDevotional, markDevotionalRead, addPlan, markPlanDayComplete, togglePlanReading, setPlanDay, shiftPlanDatesToToday, addCourse, removePlan, removeLessonProgress, removeDevotional };
}

export function useTheme() {
  const { state, setPrefs } = useAppState();
  return {
    dark: state.prefs.dark,
    fontScale: state.prefs.fontScale,
    setDark: (v: boolean) => setPrefs({ dark: v }),
    setFontScale: (v: number) => setPrefs({ fontScale: v }),
    toggleDark: () => setPrefs({ dark: !state.prefs.dark }),
  };
}
