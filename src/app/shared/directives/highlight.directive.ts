import { booleanAttribute, Directive, Input } from '@angular/core';

/**
 * Shared, state-driven selection highlight. Import Highlight in the consumer.
 * Usage: <div [appHighlight]="selected" highlightRadius="1rem">...</div>
 * For table rows, add [highlightInset]="true" to keep the ring inside the row.
 * Selection and click handling remain the consumer's responsibility.
 */
@Directive({
  selector: '[appHighlight]',
  standalone: true,
  host: {
    '[class.app-highlight-active]': 'active',
    '[style.background-color]': 'background',
    '[style.box-shadow]': 'ring',
    '[style.border-radius]': 'active ? highlightRadius : null',
  },
})
export class Highlight {
  @Input({ alias: 'appHighlight', transform: booleanAttribute }) active = false;
  @Input() highlightColor = 'var(--app-focus-color, #3b82f6)';
  @Input() highlightRadius: string | null = null;
  @Input({ transform: booleanAttribute }) highlightInset = false;

  get background(): string | null {
    return this.active
      ? `color-mix(in srgb, ${this.highlightColor} 6%, var(--app-paper, #ffffff))`
      : null;
  }

  get ring(): string | null {
    return this.active
      ? `${this.highlightInset ? 'inset ' : ''}0 0 0 1px color-mix(in srgb, ${this.highlightColor} 18%, transparent)`
      : null;
  }
}
