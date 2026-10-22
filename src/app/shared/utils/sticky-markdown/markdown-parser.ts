import {
  MARKDOWN_LIMITS,
  STICKY_HIGHLIGHT_COLORS,
  StickyMarkdownDocument,
  StickyMarks,
  StickyRun,
  normalizeRuns,
} from './markdown.types';

/** Absolute http(s) and mailto only. No browser-dependent relative URL resolution. */
export function safeStickyUrl(value: string): string | null {
  if (!value || /[\s\u0000-\u001f\u007f\\]/u.test(value)) return null;
  try {
    const url = new URL(value);
    return ((url.protocol === 'https:' || url.protocol === 'http:') && !!url.hostname) ||
      (url.protocol === 'mailto:' && !!url.pathname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

// A bounded recursive scanner, with a shared work budget to bound malformed backtracking.
function parseInline(source: string): StickyRun[] {
  let work = Math.max(256, source.length * 24);
  function scan(
    start: number,
    marks: StickyMarks,
    close = '',
    depth = 0,
  ): { runs: StickyRun[]; end: number; closed: boolean } {
    const runs: StickyRun[] = [];
    let literal = '';
    const flush = () => {
      if (literal) {
        runs.push({ text: literal, marks: { ...marks } });
        literal = '';
      }
    };
    let i = start;
    while (i < source.length && --work > 0) {
      if (source[i] === '\\' && i + 1 < source.length && /[\\*+~=[\](){}.!-]/.test(source[i + 1])) {
        // Escaping one character also prevents opening the remainder of its delimiter run.
        literal += source[i + 1];
        i += 2;
        continue;
      }
      if (close && source.startsWith(close, i) && i > start && !/\s/.test(source[i - 1])) {
        flush();
        return { runs, end: i + close.length, closed: true };
      }
      if (depth < MARKDOWN_LIMITS.depth && source[i] === '[' && !marks.link) {
        let labelEnd = i + 1;
        while (labelEnd < source.length && --work > 0) {
          if (source[labelEnd] === '\\') {
            labelEnd += 2;
            continue;
          }
          if (source[labelEnd] === ']') break;
          labelEnd++;
        }
        if (source[labelEnd + 1] === '(') {
          let end = labelEnd + 2,
            nesting = 1,
            url = '';
          while (end < source.length && nesting && --work > 0) {
            const ch = source[end++];
            if (ch === '\\' && /[()\\]/.test(source[end] ?? '')) {
              url += source[end++];
              continue;
            }
            if (ch === '(') nesting++;
            if (ch === ')') nesting--;
            if (nesting) url += ch;
          }
          const safe = nesting === 0 ? safeStickyUrl(url) : null;
          if (safe && labelEnd > i + 1) {
            const label = scan(i + 1, { ...marks, link: safe }, ']', depth + 1);
            if (label.closed && label.end === labelEnd + 1) {
              flush();
              runs.push(...label.runs);
              i = end;
              continue;
            }
          }
        }
      }
      let delimiter = '',
        next: StickyMarks = marks,
        skip = 0;
      if (!marks.bold && source.startsWith('**', i)) {
        delimiter = '**';
        next = { ...marks, bold: true };
      } else if (!marks.italic && source[i] === '*') {
        delimiter = '*';
        next = { ...marks, italic: true };
      } else if (!marks.underline && source.startsWith('++', i)) {
        delimiter = '++';
        next = { ...marks, underline: true };
      } else if (!marks.strike && source.startsWith('~~', i)) {
        delimiter = '~~';
        next = { ...marks, strike: true };
      } else if (!marks.highlight && source.startsWith('==', i)) {
        delimiter = '==';
        next = { ...marks, highlight: { color: 'yellow', style: 'marker' } };
        if (source[i + 2] === '{') {
          const closingOffset = source.slice(i + 3, i + 24).indexOf('}');
          const end = closingOffset < 0 ? -1 : i + 3 + closingOffset;
          const token = end < 0 ? '' : source.slice(i + 3, end);
          const [color, style = 'marker', extra] = token.split(':');
          if (
            Object.hasOwn(STICKY_HIGHLIGHT_COLORS, color) &&
            ['marker', 'soft'].includes(style) &&
            !extra
          ) {
            next = {
              ...marks,
              highlight: {
                color: color as keyof typeof STICKY_HIGHLIGHT_COLORS,
                style: style as 'marker' | 'soft',
              },
            };
            skip = end - i - 1;
          } else {
            literal += '==';
            i += 2;
            continue;
          }
        }
      }
      const contentStart = i + delimiter.length + skip;
      if (
        delimiter &&
        depth < MARKDOWN_LIMITS.depth &&
        source[contentStart] &&
        !/\s/.test(source[contentStart])
      ) {
        const child = scan(contentStart, next, delimiter, depth + 1);
        if (child.closed) {
          flush();
          runs.push(...child.runs);
          i = child.end;
          continue;
        }
      }
      // Consume unmatched delimiter atomically: '**broken*' must remain literal.
      literal += delimiter || source[i];
      i += delimiter.length || 1;
    }
    literal += source.slice(i);
    flush();
    return { runs, end: source.length, closed: false };
  }
  return normalizeRuns(scan(0, {}).runs);
}

export function parseStickyMarkdown(markdown: string): StickyMarkdownDocument {
  const text = String(markdown ?? '').replace(/\r\n?/g, '\n');
  // Oversized input stays visible and literal; the editor validator rejects further expansion.
  if (text.length > MARKDOWN_LIMITS.characters)
    return { blocks: [{ type: 'paragraph', runs: [{ text, marks: {} }] }] };
  const lines = text.split('\n');
  if (lines.length > MARKDOWN_LIMITS.blocks)
    return { blocks: [{ type: 'paragraph', runs: [{ text, marks: {} }] }] };
  let runs = 0;
  const doc: StickyMarkdownDocument = {
    blocks: lines.map((line) => {
      const prefix = /^(?:- |\d{1,9}\. )/.exec(line)?.[0];
      const parsed = parseInline(prefix ? line.slice(prefix.length) : line);
      runs += parsed.length;
      return { type: prefix ? (prefix === '- ' ? 'bullet' : 'number') : 'paragraph', runs: parsed };
    }),
  };
  return runs > MARKDOWN_LIMITS.runs
    ? { blocks: [{ type: 'paragraph', runs: [{ text, marks: {} }] }] }
    : doc;
}

export class StickyMarkdownParser {
  parse = parseStickyMarkdown;
}
