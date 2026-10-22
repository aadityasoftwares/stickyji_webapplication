import {
  StickyBlock,
  StickyMarkdownDocument,
  StickyMarks,
  StickyRun,
  StickySelection,
  blockText,
  normalizeRuns,
} from './markdown.types';

export function sliceRuns(runs: StickyRun[], start: number, end = Infinity): StickyRun[] {
  let offset = 0;
  return normalizeRuns(
    runs.flatMap((run) => {
      const from = Math.max(0, start - offset),
        to = Math.min(run.text.length, end - offset);
      offset += run.text.length;
      return to > from ? [{ text: run.text.slice(from, to), marks: { ...run.marks } }] : [];
    }),
  );
}
export function locate(
  doc: StickyMarkdownDocument,
  offset: number,
): { index: number; offset: number } {
  for (let index = 0; index < doc.blocks.length; index++) {
    const length = blockText(doc.blocks[index]).length;
    if (offset <= length || index === doc.blocks.length - 1)
      return { index, offset: Math.min(offset, length) };
    offset -= length + 1;
  }
  return { index: 0, offset: 0 };
}
export function marksAt(doc: StickyMarkdownDocument, offset: number): StickyMarks {
  const at = locate(doc, offset);
  let length = 0;
  for (const run of doc.blocks[at.index]?.runs ?? []) {
    length += run.text.length;
    if (length >= at.offset) return { ...run.marks };
  }
  return {};
}
export function selectedRuns(doc: StickyMarkdownDocument, selection: StickySelection): StickyRun[] {
  let offset = 0;
  return doc.blocks.flatMap((block) => {
    const runs = sliceRuns(block.runs, selection.start - offset, selection.end - offset);
    offset += blockText(block).length + 1;
    return runs;
  });
}
export function formatSelection(
  doc: StickyMarkdownDocument,
  selection: StickySelection,
  change: (marks: StickyMarks) => StickyMarks,
): StickyMarkdownDocument {
  let offset = 0;
  return {
    blocks: doc.blocks.map((block) => {
      const length = blockText(block).length;
      const from = Math.max(0, selection.start - offset),
        to = Math.min(length, selection.end - offset);
      offset += length + 1;
      if (to <= from) return block;
      return {
        ...block,
        runs: normalizeRuns([
          ...sliceRuns(block.runs, 0, from),
          ...sliceRuns(block.runs, from, to).map((run) => ({ ...run, marks: change(run.marks) })),
          ...sliceRuns(block.runs, to),
        ]),
      };
    }),
  };
}
export function replaceSelection(
  doc: StickyMarkdownDocument,
  selection: StickySelection,
  inserted: StickyMarkdownDocument,
): StickyMarkdownDocument {
  const start = locate(doc, selection.start),
    end = locate(doc, selection.end);
  const first = doc.blocks[start.index] ?? { type: 'paragraph', runs: [] };
  const before = sliceRuns(first.runs, 0, start.offset),
    after = sliceRuns(doc.blocks[end.index]?.runs ?? [], end.offset);
  const blocks = inserted.blocks.length
    ? inserted.blocks.map((b) => ({ ...b, runs: [...b.runs] }))
    : [{ type: 'paragraph' as const, runs: [] }];
  blocks[0] = {
    type: first.type === 'paragraph' ? blocks[0].type : first.type,
    runs: normalizeRuns([...before, ...blocks[0].runs]),
  };
  const last = blocks.length - 1;
  blocks[last].runs = normalizeRuns([...blocks[last].runs, ...after]);
  return {
    blocks: [...doc.blocks.slice(0, start.index), ...blocks, ...doc.blocks.slice(end.index + 1)],
  };
}
export function toggleList(
  doc: StickyMarkdownDocument,
  selection: StickySelection,
  type: StickyBlock['type'],
): StickyMarkdownDocument {
  const first = locate(doc, selection.start).index;
  const last = locate(
    doc,
    Math.max(selection.start, selection.end - (selection.end > selection.start ? 1 : 0)),
  ).index;
  const remove = doc.blocks.slice(first, last + 1).every((block) => block.type === type);
  return {
    blocks: doc.blocks.map((block, i) =>
      i >= first && i <= last ? { ...block, type: remove ? 'paragraph' : type } : block,
    ),
  };
}
