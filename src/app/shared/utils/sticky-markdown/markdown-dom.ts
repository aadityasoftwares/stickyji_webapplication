import {
  MARKDOWN_LIMITS,
  STICKY_HIGHLIGHT_COLORS,
  StickyBlock,
  StickyMarkdownDocument,
  StickyMarks,
  StickyRun,
  normalizeRuns,
} from './markdown.types';
import { safeStickyUrl } from './markdown-parser';

/** Only text nodes and explicitly constructed elements ever reach the live document. */
export function appendStickyRuns(parent: HTMLElement, runs: StickyRun[], allowLinks = true): void {
  const dom = parent.ownerDocument;
  for (const run of runs) {
    let target = parent;
    const wrap = (tag: string) => {
      const element = dom.createElement(tag);
      target.append(element);
      target = element;
      return element;
    };
    const marks = run.marks;
    const url = marks.link && safeStickyUrl(marks.link);
    if (url && allowLinks) {
      const a = wrap('a');
      a.setAttribute('href', url);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
    if (marks.bold) wrap('strong');
    if (marks.italic) wrap('em');
    if (marks.underline) wrap('u');
    if (marks.strike) wrap('s');
    if (marks.highlight && Object.hasOwn(STICKY_HIGHLIGHT_COLORS, marks.highlight.color)) {
      const mark = wrap('mark');
      mark.dataset['color'] = marks.highlight.color;
      mark.dataset['style'] = marks.highlight.style === 'soft' ? 'soft' : 'marker';
    }
    target.append(dom.createTextNode(run.text));
  }
}
export function renderStickyDocument(
  root: HTMLElement,
  doc: StickyMarkdownDocument,
  allowLinks = true,
  editable = false,
): void {
  const fragment = root.ownerDocument.createDocumentFragment();
  let list: HTMLElement | null = null,
    lastType = '';
  doc.blocks.forEach((block, index) => {
    if (block.type === 'paragraph') list = null;
    else if (!list || lastType !== block.type) {
      list = root.ownerDocument.createElement(block.type === 'bullet' ? 'ul' : 'ol');
      fragment.append(list);
    }
    const p = root.ownerDocument.createElement(block.type === 'paragraph' ? 'p' : 'li');
    p.dataset['stickyBlock'] = String(index);
    appendStickyRuns(p, block.runs, allowLinks);
    if (!p.textContent && editable) p.append(root.ownerDocument.createElement('br'));
    (list ?? fragment).append(p);
    lastType = block.type;
  });
  root.replaceChildren(fragment);
}

/** Preserve unaffected blocks during command/pending-mark input; rebuild only list structure changes. */
export function patchStickyDocument(
  root: HTMLElement,
  before: StickyMarkdownDocument,
  after: StickyMarkdownDocument,
): void {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-sticky-block]'));
  if (
    elements.length !== after.blocks.length ||
    before.blocks.length !== after.blocks.length ||
    after.blocks.some((block, i) => block.type !== before.blocks[i].type)
  ) {
    renderStickyDocument(root, after, true, true);
    return;
  }
  after.blocks.forEach((block, i) => {
    if (JSON.stringify(block) === JSON.stringify(before.blocks[i])) return;
    const element = elements[i];
    element.replaceChildren();
    appendStickyRuns(element, block.runs);
    if (!element.textContent) element.append(root.ownerDocument.createElement('br'));
  });
}

/** Walk inert clipboard DOM or our editing surface; never adopt pasted nodes/attributes. */
export function readStickyDom(root: Node): StickyMarkdownDocument {
  const blocks: StickyBlock[] = [];
  let current: StickyBlock | null = null,
    visited = 0,
    characters = 0;
  const blockTags = new Set([
    'P',
    'DIV',
    'LI',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'BLOCKQUOTE',
    'PRE',
    'TR',
  ]);
  function walk(
    node: Node,
    inherited: StickyMarks,
    list: StickyBlock['type'] = 'paragraph',
    depth = 0,
  ): void {
    if (++visited > 50_000 || depth > 64 || characters > MARKDOWN_LIMITS.characters)
      throw new RangeError('Document is too complex.');
    if (node.nodeType === 3) {
      const text = node.textContent ?? '';
      if (!current && !text.trim()) return;
      if (!current) {
        current = { type: 'paragraph', runs: [] };
        blocks.push(current);
      }
      current.runs.push({ text, marks: { ...inherited } });
      characters += text.length;
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as HTMLElement,
      tag = el.tagName;
    if (
      [
        'SCRIPT',
        'STYLE',
        'IFRAME',
        'OBJECT',
        'SVG',
        'MATH',
        'TEMPLATE',
        'NOSCRIPT',
        'IMG',
        'VIDEO',
        'AUDIO',
      ].includes(tag)
    )
      return;
    if (tag === 'BR') {
      // A sole/trailing BR is the browser's empty block placeholder.
      if (el.parentNode?.childNodes.length === 1 || !el.nextSibling) return;
      current = { type: list, runs: [] };
      blocks.push(current);
      return;
    }
    const marks = { ...inherited };
    if (['B', 'STRONG'].includes(tag) || /^(bold|[6-9]00)$/.test(el.style.fontWeight))
      marks.bold = true;
    if (['I', 'EM'].includes(tag) || el.style.fontStyle === 'italic') marks.italic = true;
    if (tag === 'U' || el.style.textDecoration.includes('underline')) marks.underline = true;
    if (['S', 'STRIKE', 'DEL'].includes(tag) || el.style.textDecoration.includes('line-through'))
      marks.strike = true;
    if (tag === 'A') {
      const url = safeStickyUrl(el.getAttribute('href') ?? '');
      if (url) marks.link = url;
    }
    if (tag === 'MARK') {
      const color = el.dataset['color'] ?? 'yellow';
      if (Object.hasOwn(STICKY_HIGHLIGHT_COLORS, color))
        marks.highlight = {
          color: color as keyof typeof STICKY_HIGHLIGHT_COLORS,
          style: el.dataset['style'] === 'soft' ? 'soft' : 'marker',
        };
    }
    // Only the approved palette is imported from word processors' background colors.
    if (el.style.backgroundColor) {
      const color = Object.entries(STICKY_HIGHLIGHT_COLORS).find(([, hex]) => {
        const rgb = `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
        return (
          el.style.backgroundColor.toLowerCase() === hex.toLowerCase() ||
          el.style.backgroundColor === rgb
        );
      })?.[0];
      if (color)
        marks.highlight = { color: color as keyof typeof STICKY_HIGHLIGHT_COLORS, style: 'marker' };
    }
    const isBlock = blockTags.has(tag);
    if (isBlock) {
      current = { type: tag === 'LI' ? list : 'paragraph', runs: [] };
      blocks.push(current);
    }
    for (const child of Array.from(el.childNodes))
      walk(child, marks, tag === 'UL' ? 'bullet' : tag === 'OL' ? 'number' : list, depth + 1);
    if (isBlock) current = null;
  }
  for (const child of Array.from(root.childNodes)) walk(child, {});
  return {
    blocks: blocks.length
      ? blocks.map((block) => ({ ...block, runs: normalizeRuns(block.runs) }))
      : [{ type: 'paragraph', runs: [] }],
  };
}
