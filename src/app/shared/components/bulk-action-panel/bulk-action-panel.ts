import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideArrowRight, LucideCheckSquare, LucideTrash2, LucideX } from '@lucide/angular';
import { AppIcon } from '../icon/icon';
import { Button } from '../button/button';

export type BulkActionPanelPosition =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'left-center'
  | 'right-center';

export type BulkActionPanelOrientation = 'horizontal' | 'vertical';
export type BulkActionPanelVariant = 'floating' | 'paper' | 'dark';

@Component({
  selector: 'app-bulk-action-panel',
  standalone: true,
  imports: [CommonModule, AppIcon, Button],
  templateUrl: './bulk-action-panel.html',
  styleUrl: './bulk-action-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-visible]': 'isVisible',
    '[class.is-horizontal]': 'orientation === "horizontal"',
    '[class.is-vertical]': 'orientation === "vertical"',
    '[class]': 'hostClasses',
  },
})
export class BulkActionPanel {
  @Input() selectedCount = 0;
  @Input() totalCount = 0;
  @Input() label = 'selected';
  @Input() visible?: boolean;

  @Input() position: BulkActionPanelPosition = 'bottom-center';
  @Input() orientation: BulkActionPanelOrientation = 'horizontal';
  @Input() variant: BulkActionPanelVariant = 'floating';

  @Input() showClear = true;
  @Input() showDelete = true;
  @Input() showMove = false;
  @Input() deleteLabel = 'Move to trash';
  @Input() moveLabel = 'Move';

  @Output() readonly clearSelection = new EventEmitter<void>();
  @Output() readonly bulkDelete = new EventEmitter<void>();
  @Output() readonly bulkMove = new EventEmitter<void>();

  readonly LucideCheckSquare = LucideCheckSquare;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideX = LucideX;

  get isVisible(): boolean {
    return this.visible ?? this.selectedCount > 0;
  }

  get hostClasses(): string {
    return `app-bulk-action-panel pos-${this.position} orient-${this.orientation} variant-${this.variant}`;
  }

  onClear(): void {
    this.clearSelection.emit();
  }

  onDelete(): void {
    this.bulkDelete.emit();
  }

  onMove(): void {
    this.bulkMove.emit();
  }
}
