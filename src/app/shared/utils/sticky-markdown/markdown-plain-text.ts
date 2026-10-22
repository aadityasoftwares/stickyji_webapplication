import { parseStickyMarkdown } from './markdown-parser';
import { documentText } from './markdown.types';
export function stickyMarkdownToPlainText(markdown: string): string {
  return documentText(parseStickyMarkdown(markdown));
}
