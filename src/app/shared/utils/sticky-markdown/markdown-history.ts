import { StickyMarkdownDocument, StickySelection } from './markdown.types';
export interface StickySnapshot {
  markdown: string;
  doc: StickyMarkdownDocument;
  selection: StickySelection;
}
export class StickyMarkdownHistory {
  private past: StickySnapshot[] = [];
  private future: StickySnapshot[] = [];
  private lastTime = 0;
  private lastKind = '';
  get canUndo(): boolean {
    return this.past.length > 0;
  }
  get canRedo(): boolean {
    return this.future.length > 0;
  }
  reset(): void {
    this.past = [];
    this.future = [];
    this.breakGroup();
  }
  breakGroup(): void {
    this.lastKind = '';
  }
  record(before: StickySnapshot, kind: string): void {
    const now = Date.now();
    if (kind !== 'typing' || this.lastKind !== kind || now - this.lastTime > 750)
      this.past.push(structuredClone(before));
    this.lastKind = kind;
    this.lastTime = now;
    this.future = [];
    while (
      this.past.length > 100 ||
      this.past.reduce((n, s) => n + s.markdown.length, 0) > 2_000_000
    )
      this.past.shift();
  }
  undo(current: StickySnapshot): StickySnapshot | undefined {
    const previous = this.past.pop();
    if (previous) this.future.push(structuredClone(current));
    this.breakGroup();
    return previous;
  }
  redo(current: StickySnapshot): StickySnapshot | undefined {
    const next = this.future.pop();
    if (next) this.past.push(structuredClone(current));
    this.breakGroup();
    return next;
  }
}
