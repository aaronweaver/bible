import { useCallback, useEffect, useState } from 'react';

export type LessonProgress = {
  sectionsDone: number;
  reflections: Record<number, string>;
  // Question answers keyed by "<sectionIdx>:<questionNum>"
  answers?: Record<string, string>;
  completed: boolean;
};

export type AppState = {
  progress: Record<number, LessonProgress>;
  bibleHighlights: Record<string, number[]>;
  lastRead: { book: string; chapter: number; verse?: number } | null;
  prefs: { dark: boolean; fontScale: number };
};

const STORAGE_KEY = 'cornerstone.v1';

const DEFAULT_STATE: AppState = {
  progress: {},
  bibleHighlights: {},
  lastRead: { book: 'John', chapter: 3, verse: 16 },
  prefs: { dark: false, fontScale: 100 },
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed, prefs: { ...DEFAULT_STATE.prefs, ...(parsed.prefs ?? {}) } };
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
    persist({ ...memory, progress: { ...memory.progress, [id]: { ...cur, ...patch } } });
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

  const toggleHighlight = useCallback((key: string, verse: number) => {
    const cur = memory.bibleHighlights[key] ?? [];
    const next = cur.includes(verse) ? cur.filter((v) => v !== verse) : [...cur, verse];
    persist({ ...memory, bibleHighlights: { ...memory.bibleHighlights, [key]: next } });
  }, []);

  const setPrefs = useCallback((patch: Partial<AppState['prefs']>) => {
    persist({ ...memory, prefs: { ...memory.prefs, ...patch } });
  }, []);

  return { state, update, updateLesson, setReflection, setAnswer, toggleHighlight, setPrefs };
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
