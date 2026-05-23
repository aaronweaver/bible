export type Theme = {
  bg: string; paper: string; paperEdge: string;
  ink: string; inkSoft: string; inkMute: string;
  rule: string; chip: string; overlay: string;
  accent: string; accentOn: string;
  accents: string[];
  palette: string[];
  radius: number; radiusSm: number;
  statusDark: boolean;
  fontDisplay: string;
  fontBody: string;
  fontUi: string;
};

export const light: Theme = {
  bg: '#f4f4f0', paper: '#ffffff', paperEdge: '#ececea',
  ink: '#0b0b0d', inkSoft: '#525258', inkMute: '#9a9aa0',
  rule: '#ebebe5', chip: '#f0efe8', overlay: 'rgba(10,10,12,0.45)',
  accent: '#2563eb', accentOn: '#fff',
  accents: ['#2563eb', '#7c3aed', '#059669', '#ea580c', '#db2777'],
  palette: ['#2563eb', '#7c3aed', '#059669', '#ea580c', '#db2777', '#0891b2'],
  radius: 20, radiusSm: 14,
  statusDark: false,
  fontDisplay: '"Newsreader", Georgia, serif',
  fontBody: '"DM Sans", system-ui, sans-serif',
  fontUi: '"DM Sans", system-ui, sans-serif',
};

export const dark: Theme = {
  bg: '#0a0a0d', paper: '#16161b', paperEdge: '#22222a',
  ink: '#f5f5f7', inkSoft: '#a1a1aa', inkMute: '#6b6b75',
  rule: '#22222a', chip: '#1c1c22', overlay: 'rgba(0,0,0,0.6)',
  accent: '#3b82f6', accentOn: '#fff',
  accents: ['#3b82f6', '#a78bfa', '#34d399', '#fb923c', '#f472b6'],
  palette: ['#3b82f6', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#22d3ee'],
  radius: 20, radiusSm: 14,
  statusDark: true,
  fontDisplay: '"Newsreader", Georgia, serif',
  fontBody: '"DM Sans", system-ui, sans-serif',
  fontUi: '"DM Sans", system-ui, sans-serif',
};
