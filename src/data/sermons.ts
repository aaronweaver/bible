export type Sermon = {
  id: string;
  title: string;
  pastor: string;
  date: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  duration: number;
  audioUrl: string;
};

export const SERMONS: Sermon[] = [
  {
    id: 'walk-of-a-worker',
    title: 'The Walk of a Worker',
    pastor: 'Roland Hammett',
    date: '5/17/26',
    book: '1 Timothy',
    chapter: 6,
    verseStart: 1,
    verseEnd: 2,
    duration: 43 * 60 + 28,
    audioUrl: `${import.meta.env.BASE_URL}sermons/walk-of-a-worker.mp3`,
  },
];

export function getSermonsForChapter(book: string, chapter: number): Sermon[] {
  return SERMONS.filter((s) => s.book === book && s.chapter === chapter);
}
