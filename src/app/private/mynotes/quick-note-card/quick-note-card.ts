import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';
import { Button } from '../../../shared/components/button/button';
import { NOTE_LIMITS } from '../../../shared/constants/common.constants';

export interface QuickNoteDraft {
  title: string;
  content: string;
}

@Component({
  selector: 'app-quick-note-card',
  imports: [FormsModule, Button],
  templateUrl: './quick-note-card.html',
  styleUrls: ['../sticky-note/sticky-note.scss', './quick-note-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickNoteCard {
  @Input({ required: true }) draft!: QuickNoteDraft;
  @Input() color = 'YELLOW';
  @Input() fontFamily = 'inherit';
  @Input() fontSize = 14;
  @Input() saving = false;
  @Input() error = '';
  @Output() draftChange = new EventEmitter<QuickNoteDraft>();
  @Output() saveRequested = new EventEmitter<boolean>();
  @Output() cancelled = new EventEmitter<void>();

  readonly limits = NOTE_LIMITS;
  readonly LucideX = LucideX;
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  constructor() {
    afterNextRender(() => this.focusTitle());
  }

  get canSave(): boolean {
    return !this.saving &&
      this.draft.title.length <= this.limits.TITLE_MAX_LENGTH &&
      this.draft.content.length <= this.limits.CONTENT_MAX_LENGTH &&
      !!(this.draft.title.trim() || this.draft.content.trim());
  }

  focusTitle(): void {
    const input = this.titleInput()?.nativeElement;
    input?.focus({ preventScroll: true });
    input?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  update(field: keyof QuickNoteDraft, value: string): void {
    if (!this.saving) this.draftChange.emit({ ...this.draft, [field]: value });
  }

  save(continueAdding = false): void {
    if (this.canSave) this.saveRequested.emit(continueAdding);
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.save(event.shiftKey);
    }
  }
}
