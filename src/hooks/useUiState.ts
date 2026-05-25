import { useEffect, useState } from 'react';

export type BibleNav = {
  book: string;
  chapter: number;
  maxChapter: number;
  onPrev: () => void;
  onNext: () => void;
  onPicker: () => void;
};

type UiState = { immersive: boolean; bibleNav: BibleNav | null };

let _state: UiState = { immersive: false, bibleNav: null };
const _listeners = new Set<(s: UiState) => void>();

export function setUiState(patch: Partial<UiState>) {
  _state = { ..._state, ...patch };
  _listeners.forEach((l) => l(_state));
}

export function useUiState() {
  const [state, setState] = useState(_state);
  useEffect(() => {
    _listeners.add(setState);
    return () => { _listeners.delete(setState); };
  }, []);
  return state;
}
