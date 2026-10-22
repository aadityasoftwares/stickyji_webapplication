export const STICKY_HIGHLIGHT_COLORS = {
  yellow: '#FFF59D',
  green: '#B9F6CA',
  pink: '#F8BBD0',
  blue: '#BBDEFB',
  orange: '#FFE0B2',
  purple: '#E1BEE7',
} as const;
export type HighlightColor = keyof typeof STICKY_HIGHLIGHT_COLORS;
export type HighlightStyle = 'marker' | 'soft';
export interface StickyMarks {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  highlight?: { color: HighlightColor; style: HighlightStyle };
  link?: string;
}
export interface StickyRun {
  text: string;
  marks: StickyMarks;
}
export interface StickyBlock {
  type: 'paragraph' | 'bullet' | 'number';
  runs: StickyRun[];
}
export interface StickyMarkdownDocument {
  blocks: StickyBlock[];
}
export type StickyMarkdownEditorMode = 'SINGLE_LINE' | 'MULTI_LINE' | 'CHECKLIST_ITEM' | 'PLAIN';
export interface StickyMarkdownRendererConfig {
  compact?: boolean;
  maxLines?: number;
  allowLinks?: boolean;
  preserveLineBreaks?: boolean;
}
export interface StickySelection {
  start: number;
  end: number;
  backward?: boolean;
}
export const MARKDOWN_LIMITS = {
  characters: 100_000,
  blocks: 10_000,
  runs: 20_000,
  depth: 16,
} as const;
export const blockText = (block: StickyBlock): string => block.runs.map((run) => run.text).join('');
export const documentText = (doc: StickyMarkdownDocument): string =>
  doc.blocks.map(blockText).join('\n');
export function sameMarks(a: StickyMarks, b: StickyMarks): boolean {
  return (
    !!a.bold === !!b.bold &&
    !!a.italic === !!b.italic &&
    !!a.underline === !!b.underline &&
    !!a.strike === !!b.strike &&
    a.link === b.link &&
    a.highlight?.color === b.highlight?.color &&
    a.highlight?.style === b.highlight?.style
  );
}
export function normalizeRuns(runs: StickyRun[]): StickyRun[] {
  const result: StickyRun[] = [];
  for (const run of runs) {
    if (!run.text) continue;
    const last = result.at(-1);
    if (last && sameMarks(last.marks, run.marks)) last.text += run.text;
    else result.push({ text: run.text, marks: { ...run.marks } });
  }
  return result;
}
