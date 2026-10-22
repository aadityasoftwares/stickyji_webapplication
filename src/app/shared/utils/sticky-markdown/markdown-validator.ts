import { MARKDOWN_LIMITS, StickyMarkdownDocument, documentText } from './markdown.types';
export interface StickyMarkdownLimits {
  required?: boolean;
  maxVisibleCharacters?: number;
  maxWords?: number;
  maxMarkdownLength?: number;
}
export function validateStickyMarkdown(
  markdown: string,
  doc: StickyMarkdownDocument,
  limits: StickyMarkdownLimits,
): string | null {
  const text = documentText(doc);
  if (limits.required && !text.trim()) return 'Enter some text.';
  if (markdown.length > (limits.maxMarkdownLength ?? MARKDOWN_LIMITS.characters))
    return `Text and formatting must fit within ${limits.maxMarkdownLength ?? MARKDOWN_LIMITS.characters} stored characters.`;
  if (limits.maxVisibleCharacters && [...text].length > limits.maxVisibleCharacters)
    return `Use at most ${limits.maxVisibleCharacters} visible characters.`;
  if (limits.maxWords && (text.trim().match(/\S+/gu)?.length ?? 0) > limits.maxWords)
    return `Use at most ${limits.maxWords} words.`;
  if (
    doc.blocks.length > MARKDOWN_LIMITS.blocks ||
    doc.blocks.reduce((n, b) => n + b.runs.length, 0) > MARKDOWN_LIMITS.runs
  )
    return 'This note has too many formatting sections.';
  return null;
}
