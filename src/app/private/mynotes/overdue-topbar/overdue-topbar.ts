import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideArrowRight, LucideCircleAlert, LucideX } from '@lucide/angular';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { STICKY_NOTE_COLUMN_TYPES } from '../../../shared/constants/common.constants';

@Component({
  selector: 'app-overdue-topbar',
  standalone: true,
  imports: [AppIcon, Badge, Button],
  templateUrl: './overdue-topbar.html',
  styleUrl: './overdue-topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverdueTopbar {
  readonly columnTypes = STICKY_NOTE_COLUMN_TYPES;
  @Input() total = 0;
  @Input() byColumn: readonly any[] = [];
  @Output() readonly review = new EventEmitter<void>();
  @Output() readonly dismiss = new EventEmitter<void>();
  readonly LucideCircleAlert = LucideCircleAlert;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideX = LucideX;
}
