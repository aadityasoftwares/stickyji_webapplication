import { parseStickyMarkdown, safeStickyUrl } from './markdown-parser';
import { serializeStickyMarkdown } from './markdown-serializer';
import { stickyMarkdownToPlainText } from './markdown-plain-text';
import { STICKY_HIGHLIGHT_COLORS, StickyMarkdownDocument, documentText } from './markdown.types';
import { formatSelection, replaceSelection, toggleList } from './markdown-formatting';
import { plainStickyDocument, readStickyClipboard } from './markdown-clipboard';
import { readStickyDom, renderStickyDocument } from './markdown-dom';
import { captureStickySelection, restoreStickySelection } from './markdown-selection';
import { StickyMarkdownHistory } from './markdown-history';
import { validateStickyMarkdown } from './markdown-validator';

describe('Sticky Markdown grammar', () => {
  it.each([
    ['**bold**', 'bold', { bold: true }],
    ['*italic*', 'italic', { italic: true }],
    ['++underlined++', 'underlined', { underline: true }],
    ['~~strike~~', 'strike', { strike: true }],
    ['***both***', 'both', { bold: true, italic: true }],
    ['**++nested++**', 'nested', { bold: true, underline: true }],
    ['==highlight==', 'highlight', { highlight: { color: 'yellow', style: 'marker' } }],
    ['=={green}**done**==', 'done', { bold: true, highlight: { color: 'green', style: 'marker' } }],
    ['[docs](https://example.com)', 'docs', { link: 'https://example.com/' }],
  ])('parses %s', (source, text, marks) => {
    expect(parseStickyMarkdown(source as string).blocks[0].runs).toEqual([{ text, marks }]);
  });
  for (const color of Object.keys(STICKY_HIGHLIGHT_COLORS))
    for (const style of ['marker', 'soft']) {
      it(`round trips ${color} ${style}`, () => {
        const doc = parseStickyMarkdown(`=={${color}:${style}}Important==`);
        expect(doc.blocks[0].runs[0].marks.highlight).toEqual({ color, style });
        expect(parseStickyMarkdown(serializeStickyMarkdown(doc))).toEqual(doc);
      });
    }
  it.each([
    '',
    'ordinary text',
    'C++',
    'Price is 5 * 10',
    '**broken',
    '**broken*',
    '=={invalid}literal==',
    '<script>alert(1)</script>',
  ])('preserves literal input %s', (source) => {
    expect(stickyMarkdownToPlainText(source)).toBe(source);
  });
  it('supports escaped syntax and literal list prefixes', () => {
    expect(stickyMarkdownToPlainText('\\*\\*Not bold\\*\\*')).toBe('**Not bold**');
    expect(stickyMarkdownToPlainText('\\==Not highlighted\\==')).toBe('==Not highlighted==');
    for (const text of ['1. literal', '- literal', 'C++', '\\*[]{}==']) {
      const doc = plainStickyDocument(text);
      expect(parseStickyMarkdown(serializeStickyMarkdown(doc))).toEqual(doc);
    }
  });
  it('normalizes list numbering and preserves blank lines', () => {
    const doc = parseStickyMarkdown('Paragraph\n\n- **a**\n- b\n\n9. first\n18. second');
    expect(serializeStickyMarkdown(doc)).toBe('Paragraph\n\n- **a**\n- b\n\n1. first\n2. second');
  });
  it('round trips links with parentheses and nested formatting', () => {
    const doc = parseStickyMarkdown('[**label**](https://example.com/a(b))');
    const saved = serializeStickyMarkdown(doc);
    expect(saved).toBe('[**label**](https://example.com/a%28b%29)');
    expect(serializeStickyMarkdown(parseStickyMarkdown(saved))).toBe(saved);
  });
  it.each([
    'javascript:alert(1)',
    'data:text/html,hello',
    'vbscript:x',
    '//example.com',
    '/relative',
    'https://evil.test\n/x',
    'java\tscript:alert(1)',
  ])('rejects unsafe URL %s', (url) => {
    expect(safeStickyUrl(url)).toBeNull();
    expect(
      parseStickyMarkdown(`[label](${url})`)
        .blocks.flatMap((b) => b.runs)
        .some((r) => r.marks.link),
    ).toBe(false);
  });
  it('converges for all adjacent inline mark combinations', () => {
    const marks = Array.from({ length: 16 }, (_, i) => ({
      ...(i & 1 ? { bold: true } : {}),
      ...(i & 2 ? { italic: true } : {}),
      ...(i & 4 ? { underline: true } : {}),
      ...(i & 8 ? { strike: true } : {}),
    }));
    for (const a of marks)
      for (const b of marks) {
        const doc: StickyMarkdownDocument = {
          blocks: [
            {
              type: 'paragraph',
              runs: [
                { text: 'a', marks: a },
                { text: 'b', marks: b },
              ],
            },
          ],
        };
        const saved = serializeStickyMarkdown(doc),
          parsed = parseStickyMarkdown(saved);
        expect(documentText(parsed), saved).toBe('ab');
        expect(serializeStickyMarkdown(parsed), saved).toBe(saved);
        const actual = parsed.blocks[0].runs.flatMap((r) =>
          [...r.text].map((text) => ({ text, marks: r.marks })),
        );
        expect(actual, saved).toEqual(doc.blocks[0].runs);
      }
  });
  it('bounds pathological input and retains oversized text', () => {
    const text = '**['.repeat(10_000);
    const parsed = parseStickyMarkdown(text);
    expect(documentText(parsed).length).toBeGreaterThan(0);
    const oversized = 'a'.repeat(100_001);
    expect(stickyMarkdownToPlainText(oversized)).toBe(oversized);
  });
});

describe('Sticky Markdown editing utilities', () => {
  it('formats partial selections across blocks without dropping other marks', () => {
    const doc = parseStickyMarkdown('**hello**\nworld');
    const result = formatSelection(doc, { start: 2, end: 9 }, (marks) => ({
      ...marks,
      underline: true,
    }));
    expect(documentText(result)).toBe('hello\nworld');
    expect(result.blocks[0].runs[1].marks).toEqual({ bold: true, underline: true });
    expect(result.blocks[1].runs[0].text).toBe('wor');
  });
  it('replaces selections spanning lists and renumbers', () => {
    const doc = parseStickyMarkdown('1. first\n2. second\n3. third');
    const replaced = replaceSelection(doc, { start: 3, end: 9 }, plainStickyDocument('X'));
    expect(serializeStickyMarkdown(replaced)).toBe('1. firXond\n2. third');
    expect(toggleList(doc, { start: 0, end: 12 }, 'bullet').blocks.map((b) => b.type)).toEqual([
      'bullet',
      'bullet',
      'number',
    ]);
  });
  it('captures/restores a backward selection across formatted paragraphs', () => {
    const root = document.createElement('div');
    document.body.append(root);
    renderStickyDocument(root, parseStickyMarkdown('**abc**\n++def++'), true, true);
    restoreStickySelection(root, { start: 1, end: 6, backward: true });
    expect(captureStickySelection(root)).toEqual({ start: 1, end: 6, backward: true });
    root.remove();
  });
  it('safely converts clipboard formatting without executable markup or arbitrary CSS', () => {
    const doc = readStickyClipboard(
      'Hello',
      '<p><b>Hello</b> <a href="javascript:alert(1)" onclick="alert(1)">bad</a><script>alert(1)</script><img src=x onerror=alert(1)><span style="color:red">text</span></p>',
    );
    expect(documentText(doc)).toBe('Hello badtext');
    const root = document.createElement('div');
    renderStickyDocument(root, doc);
    expect(root.querySelector('script,img,a,[style],[onclick]')).toBeNull();
    expect(root.querySelector('strong')?.textContent).toBe('Hello');
    expect(readStickyDom(root)).toEqual(doc);
  });
  it('counts visible words and stored syntax separately', () => {
    const markdown = '**Important**';
    const doc = parseStickyMarkdown(markdown);
    expect(
      validateStickyMarkdown(markdown, doc, { maxWords: 1, maxVisibleCharacters: 9 }),
    ).toBeNull();
    expect(validateStickyMarkdown(markdown, doc, { maxMarkdownLength: 10 })).toContain(
      'stored characters',
    );
  });
  it('bounds undo history, clears redo on a new branch, and restores source', () => {
    const history = new StickyMarkdownHistory();
    const make = (markdown: string) => ({
      markdown,
      doc: parseStickyMarkdown(markdown),
      selection: { start: 0, end: 0 },
    });
    for (let i = 0; i < 120; i++) history.record(make(String(i)), 'command');
    let count = 0;
    while (history.undo(make('current'))) count++;
    expect(count).toBe(100);
    expect(history.canRedo).toBe(true);
    history.record(make('branch'), 'command');
    expect(history.canRedo).toBe(false);
  });
});
