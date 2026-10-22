import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { safeStickyUrl } from '../../../utils/sticky-markdown/markdown-parser';
@Component({
  selector: 'app-sticky-link-popover',
  standalone: true,
  imports: [FormsModule],
  template: `<label
      >Text<input
        aria-label="Link text"
        [(ngModel)]="label"
        [ngModelOptions]="{ standalone: true }"
    /></label>
    <label
      >URL<input
        aria-label="Link URL"
        type="url"
        placeholder="https://example.com"
        [(ngModel)]="url"
        [ngModelOptions]="{ standalone: true }"
        (keydown.enter)="submit($event)"
    /></label>
    @if (error) {
      <small role="alert">{{ error }}</small>
    }
    <div>
      <button type="button" (click)="submit($event)">Apply link</button
      ><button type="button" (click)="remove.emit()">Remove link</button>
    </div>`,
  styles: [
    `
      :host {
        display: grid;
        gap: 8px;
      }
      label {
        display: grid;
        gap: 3px;
        font-size: 12px;
      }
      input {
        width: 100%;
        min-width: 0;
        padding: 6px 8px;
        border: 1px solid #d9d4c8;
        border-radius: 5px;
      }
      button {
        padding: 4px 8px;
        margin-right: 5px;
        background: #fff8dc;
        border: 1px solid #d9d4c8;
        border-radius: 5px;
      }
      small {
        color: #a52424;
      }
    `,
  ],
})
export class StickyLinkPopoverComponent {
  @Input() label = '';
  @Input() url = '';
  @Output() apply = new EventEmitter<{ label: string; url: string }>();
  @Output() remove = new EventEmitter<void>();
  error = '';
  submit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const url = safeStickyUrl(this.url.trim());
    if (!url || !this.label.trim() || /[\r\n]/.test(this.label)) {
      this.error = 'Enter link text and a valid https, http or mailto URL.';
      return;
    }
    this.apply.emit({ label: this.label, url });
  }
}
