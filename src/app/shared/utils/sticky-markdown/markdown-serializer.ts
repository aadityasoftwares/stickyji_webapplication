import { StickyMarkdownDocument, StickyMarks, normalizeRuns } from './markdown.types';
import { safeStickyUrl } from './markdown-parser';

function wrappers(marks: StickyMarks): [string, string][] {
  const result: [string, string][] = [];
  const link = marks.link && safeStickyUrl(marks.link);
  if (link) result.push(['[', `](${link.replace(/\(/g, '%28').replace(/\)/g, '%29')})`]);
  if (marks.bold) result.push(['**', '**']);
  if (marks.italic) result.push(['*', '*']);
  if (marks.underline) result.push(['++', '++']);
  if (marks.strike) result.push(['~~', '~~']);
  if (marks.highlight) {
    const { color, style } = marks.highlight;
    result.push([
      color === 'yellow' && style === 'marker'
        ? '=='
        : `=={${color}${style === 'soft' ? ':soft' : ''}}`,
      '==',
    ]);
  }
  return result;
}
export function serializeStickyMarkdown(document: StickyMarkdownDocument): string {
  let number = 0;
  return document.blocks
    .map((block) => {
      number = block.type === 'number' ? number + 1 : 0;
      let value = '',
        active: [string, string][] = [];
      // Whitespace at mark boundaries is unformatted; it is never removed from the text.
      const runs = normalizeRuns(
        block.runs.flatMap((run) => {
          const parts = /^(\s*)([\s\S]*?)(\s*)$/.exec(run.text)!;
          return [
            { text: parts[1], marks: {} },
            { text: parts[2], marks: run.marks },
            { text: parts[3], marks: {} },
          ];
        }),
      );
      for (const run of runs) {
        const next = wrappers(run.marks);
        let common = 0;
        while (
          common < active.length &&
          common < next.length &&
          active[common][0] === next[common][0] &&
          active[common][1] === next[common][1]
        )
          common++;
        value += active
          .slice(common)
          .reverse()
          .map((pair) => pair[1])
          .join('');
        value += next
          .slice(common)
          .map((pair) => pair[0])
          .join('');
        value += run.text.replace(/[\\*+~=\[\]{}]/g, '\\$&');
        active = next;
      }
      value += active
        .reverse()
        .map((pair) => pair[1])
        .join('');
      if (block.type === 'paragraph')
        return value.replace(/^-(?= )/, '\\-').replace(/^(\d{1,9})\.(?= )/, '$1\\.');
      return `${block.type === 'bullet' ? '-' : `${number}.`} ${value}`;
    })
    .join('\n');
}
export class StickyMarkdownSerializer {
  serialize = serializeStickyMarkdown;
}
