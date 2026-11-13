import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { LucideArchiveRestore, LucideTrash2, LucideTriangleAlert } from '@lucide/angular';
import { closeAllMatMenus } from '../../functions/menu.function';
import { Button } from '../button/button';
import { AppIcon } from '../icon/icon';
import { Modal, ModalTone } from '../modal/modal';

@Component({
  host: { '[attr.title]': 'null' },
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule, Modal, Button, AppIcon],
  templateUrl: './delete-confirm-modal.html',
  styleUrl: './delete-confirm-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmModal implements OnChanges {
  @Input() open = false;
  @Input() title = 'Move to trash?';
  @Input() message = 'You can restore this item later.';
  @Input() supportingText = '';
  @Input() itemName = '';
  @Input() confirmLabel = 'Move to trash';
  @Input() cancelLabel = 'Keep it';
  @Input() busy = false;
  @Input() mode: 'trash' | 'permanent' = 'trash';
  @Input() eyebrow?: string;
  @Input() icon?: any;
  @Input() tone?: ModalTone;
  @Input() maxWidth: number | null = 460;

  @Output() readonly confirmed = new EventEmitter<void>();
  @Output() readonly closed = new EventEmitter<void>();

  readonly LucideArchiveRestore = LucideArchiveRestore;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideTriangleAlert = LucideTriangleAlert;

  get headerIcon(): any {
    if (this.icon) return this.icon;
    return this.mode === 'permanent' ? this.LucideTriangleAlert : this.LucideArchiveRestore;
  }

  get supportIcon(): any {
    return this.mode === 'permanent' ? this.LucideTrash2 : this.LucideArchiveRestore;
  }

  get resolvedEyebrow(): string {
    if (this.eyebrow) return this.eyebrow;
    return this.mode === 'permanent' ? 'Permanent action' : 'Safe delete';
  }

  get resolvedTone(): ModalTone {
    if (this.tone) return this.tone;
    return this.mode === 'permanent' ? 'red' : 'yellow';
  }

  get confirmVariant(): any {
    return this.mode === 'permanent' ? 'danger' : 'noteYellow';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      closeAllMatMenus();
    }
  }

  close(): void {
    if (!this.busy) {
      this.closed.emit();
    }
  }

  confirm(): void {
    if (!this.busy) {
      this.confirmed.emit();
    }
  }
}
