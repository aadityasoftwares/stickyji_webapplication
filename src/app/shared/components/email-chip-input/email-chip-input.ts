import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal
} from '@angular/core';
import { LucideMail, LucideX } from '@lucide/angular';

import { AppIcon } from '../icon/icon';

@Component({
  selector: 'app-email-chip-input',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './email-chip-input.html',
  styleUrl: './email-chip-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailChipInput {
  @Input() emails: readonly string[] = [];
  @Input() maxEmails = 10;
  @Input() disabled = false;
  @Input() inputId = 'email-chip-input';
  @Input() placeholder = 'Type an email and press Enter';
  @Input() ariaLabel = 'Email addresses';
  emailInput: any = null;

  @Output() readonly emailsChange = new EventEmitter<readonly string[]>();

  readonly LucideMail = LucideMail;
  readonly LucideX = LucideX;
  readonly draft = signal('');
  readonly validationMessage = signal<string | null>(null);

  updateDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement | null)?.value ?? '');
    this.validationMessage.set(null);
  }

  onKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    const separator = keyboardEvent.key === 'Enter' || keyboardEvent.key === ',' || keyboardEvent.key === ';';
    const tabWithValue = keyboardEvent.key === 'Tab' && !!this.draft().trim();

    if (!separator && !tabWithValue) return;
    keyboardEvent.preventDefault();
    this.commitDraft();
  }

  onPaste(event: Event): void {
    const clipboardEvent = event as ClipboardEvent;
    const value = clipboardEvent.clipboardData?.getData('text') ?? '';

    if (!/[\s,;]/.test(value.trim())) return;
    clipboardEvent.preventDefault();
    this.addTokens(value);
  }

  commitDraft(): void {
    if (this.disabled || !this.draft().trim()) return;
    this.addTokens(this.draft());
  }

  removeEmail(email: string): void {
    if (this.disabled) return;
    this.emailsChange.emit(this.emails.filter(item => item !== email));
    this.validationMessage.set(null);
  }

  clear(): void {
    if (this.disabled || !this.emails.length) return;
    this.emailsChange.emit([]);
    this.validationMessage.set(null);
  }

  private addTokens(rawValue: string): void {
    const tokens = rawValue
      .split(/[\s,;]+/)
      .map(value => value.trim().toLowerCase())
      .filter(Boolean);

    if (!tokens.length) return;

    const current = new Set(this.emails.map(email => email.toLowerCase()));
    const invalid: string[] = [];
    let added = 0;

    for (const email of tokens) {
      if (!this.isEmail(email)) {
        invalid.push(email);
        continue;
      }

      if (current.has(email)) continue;

      if (current.size >= this.maxEmails) {
        this.validationMessage.set(`You can invite up to ${this.maxEmails} people at once.`);
        break;
      }

      current.add(email);
      added++;
    }

    if (added) this.emailsChange.emit([...current]);
    this.draft.set('');

    if (invalid.length) {
      const preview = invalid.slice(0, 2).join(', ');
      this.validationMessage.set(
        `${preview}${invalid.length > 2 ? ' and more' : ''} ${invalid.length === 1 ? 'is' : 'are'} not valid.`
      );
    } else if (current.size < this.maxEmails) {
      this.validationMessage.set(null);
    }
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
