import { Tooltip } from '../../tooltip/tooltip';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  HighlightColor,
  HighlightStyle,
  STICKY_HIGHLIGHT_COLORS,
  StickyMarks,
} from '../../../utils/sticky-markdown/markdown.types';
@Component({
  imports: [Tooltip],
  selector: 'app-sticky-highlight-picker',
  standalone: true,
  template: `<div role="group" aria-label="Highlight color" class="swatches">
      @for (color of colors; track color) {
        <button
          type="button"
          [style.background]="palette[color]"
          [attr.aria-label]="color"
          [appTooltip]="color"
          [attr.aria-pressed]="selected === color"
          (click)="selected = color"
        >
          @if (selected === color) {
            ✓
          }
        </button>
      }
    </div>
    <div class="styles">
      <button type="button" [attr.aria-pressed]="style === 'marker'" (click)="style = 'marker'">
        Marker</button
      ><button type="button" [attr.aria-pressed]="style === 'soft'" (click)="style = 'soft'">
        Soft
      </button>
    </div>
    <div class="actions">
      <button type="button" (click)="apply.emit({ color: selected, style })">Apply</button
      ><button type="button" (click)="apply.emit(undefined)">Remove highlight</button>
    </div>`,
  styles: [
    `
      :host {
        display: grid;
        gap: 10px;
      }
      .swatches,
      .styles,
      .actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      button {
        border: 1px solid #d9d4c8;
        border-radius: 5px;
        padding: 4px 8px;
        color: #333;
        background: #fff;
      }
      .swatches button {
        width: 28px;
        height: 28px;
        padding: 0;
      }
      [aria-pressed='true'] {
        outline: 2px solid #77611f;
        outline-offset: 1px;
      }
    `,
  ],
})
export class StickyHighlightPickerComponent {
  readonly palette = STICKY_HIGHLIGHT_COLORS;
  readonly colors = Object.keys(STICKY_HIGHLIGHT_COLORS) as HighlightColor[];
  selected: HighlightColor = 'yellow';
  style: HighlightStyle = 'marker';
  @Input() set highlight(value: StickyMarks['highlight']) {
    this.selected = value?.color ?? 'yellow';
    this.style = value?.style ?? 'marker';
  }
  @Output() apply = new EventEmitter<StickyMarks['highlight']>();
}
