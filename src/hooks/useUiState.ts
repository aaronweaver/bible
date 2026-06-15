import { useEffect, useState } from 'react';
import type { Sermon } from '../data/sermons';
import type { HighlightColor } from './useAppState';

export type BibleNav = {
  book: string;
  chapter: number;
  maxChapter: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPicker: () => void;
};

export type VerseSelection = {
  count: number;
  currentColor: HighlightColor | null;
  reference: string;
  combinedText: string;
  shareUrl: string;
  onPickColor: (color: HighlightColor | null) => void;
  onClose: () => void;
};

type UiState = {
  immersive: boolean;
  bibleNav: BibleNav | null;
  activeSermon: Sermon | null;
  verseSelection: VerseSelection | null;
};

let _state: UiState = { immersive: false, bibleNav: null, activeSermon: null, verseSelection: null };
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
