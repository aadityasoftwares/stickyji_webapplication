import { MARKDOWN_LIMITS, StickyMarkdownDocument } from './markdown.types';
import { readStickyDom } from './markdown-dom';
export function plainStickyDocument(text: string): StickyMarkdownDocument {
  return {
    blocks: text
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => ({ type: 'paragraph', runs: line ? [{ text: line, marks: {} }] : [] })),
  };
}
export function readStickyClipboard(text: string, html = ''): StickyMarkdownDocument {
  if (html && html.length <= MARKDOWN_LIMITS.characters * 4) {
    try {
      const inert = new DOMParser().parseFromString(html, 'text/html');
      const parsed = readStickyDom(inert.body);
      if (parsed.blocks.some((block) => block.runs.some((run) => run.text))) return parsed;
    } catch {
      /* Complex clipboard HTML falls back to the complete plain-text payload. */
    }
  }
  return plainStickyDocument(text);
}
