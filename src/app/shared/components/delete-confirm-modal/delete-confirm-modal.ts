import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { LucideArchiveRestore, LucideTrash2, LucideTriangleAlert, LucideX } from '@lucide/angular';
import { Button } from '../button/button';
import { AppIcon } from '../icon/icon';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule, Button, AppIcon],
  templateUrl: './delete-confirm-modal.html',
  styleUrl: './delete-confirm-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DeleteConfirmModal {
  @Input() open = false;
  @Input() title = 'Move to trash?';
  @Input() message = 'You can restore this item later.';
  @Input() supportingText = '';
  @Input() itemName = '';
  @Input() confirmLabel = 'Move to trash';
  @Input() cancelLabel = 'Keep it';
  @Input() busy = false;
  @Input() mode: 'trash' | 'permanent' = 'trash';
  @Output() readonly confirmed = new EventEmitter<void>();
  @Output() readonly closed = new EventEmitter<void>();

  readonly LucideArchiveRestore = LucideArchiveRestore;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideTriangleAlert = LucideTriangleAlert;
  readonly LucideX = LucideX;

  get confirmVariant(): any {
    return this.mode === 'permanent' ? 'danger' : 'noteYellow';
  }

  close(): void {
    if (!this.busy) this.closed.emit();
  }

  confirm(): void {
    if (!this.busy) this.confirmed.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }
}
