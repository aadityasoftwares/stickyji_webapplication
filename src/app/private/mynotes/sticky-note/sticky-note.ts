import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  LucideCalendarDays,
  LucideCheck,
  LucideCheckCircle2,
  LucideClock3
} from '@lucide/angular';
import { Badge } from '../../../shared/components/badge/badge';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Divider } from '../../../shared/components/divider/divider';
import { AppIcon } from '../../../shared/components/icon/icon';
import { StickyCard, CardVariant } from '../../../shared/components/sticky-card/sticky-card';



export interface StickyNoteCardChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface StickyNoteCardChecklist {
  id: string;
  title?: string;
  items: readonly StickyNoteCardChecklistItem[];
  totalCount?: number;
  completedCount?: number;
}

export interface StickyNoteCardChecklistChange {
  checklistId: string;
  itemId: string;
  checked: boolean;
}

@Component({
  standalone: true,
  imports: [AppIcon, Badge, Checkbox, Divider, StickyCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sticky-note',
  styleUrl: './sticky-note.scss',
  templateUrl: './sticky-note.html',
})
export class StickyNote {
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideClock3 = LucideClock3;

  @Input() title = 'Untitled note';
  @Input() description = '';
  @Input() eyebrow = 'Note';
  @Input() subtitle = '';
  @Input() variant: CardVariant = 'noteYellow';
  @Input() compact = false;
  @Input() completed = false;
  @Input() showPin = false;
  @Input() showFooter = true;
  @Input() forceFooter = false;
  @Input() footerDivider = true;
  @Input() fullWidth = true;
  @Input() padding?: number;
  @Input() minHeight?: number;
  @Input() height?: number;
  @Input() maxWidth?: number;

  @Input() checklists: readonly StickyNoteCardChecklist[] = [];
  @Input() updatingChecklistItemIds: readonly string[] = [];
  @Input() checkboxVariant: any = 'noteYellow';
  @Input() progress: number | null | undefined = null;

  @Input() dueLabel = '';
  @Input() timeEstimate = '';
  @Input() updatedLabel = '';
  @Input() statusLabel = '';
  @Input() statusVariant: any = 'outline';
  @Input() tag = '';
  @Input() tagVariant: any = 'outline';

  @Output() readonly checklistItemChange = new EventEmitter<StickyNoteCardChecklistChange>();

  get resolvedPadding(): number {
    return this.padding ?? (this.compact ? 8 : 10);
  }

  get resolvedMinHeight(): number {
    return this.minHeight ?? (this.compact ? 88 : 104);
  }

  get normalizedProgress(): number | null {
    if (this.progress === null || this.progress === undefined || !Number.isFinite(this.progress)) return null;
    return Math.max(0, Math.min(100, Math.round(this.progress)));
  }

  checklistCompletedCount(checklist: StickyNoteCardChecklist): number {
    if (typeof checklist.completedCount === 'number') return checklist.completedCount;
    return checklist.items.filter(item => item.isCompleted).length;
  }

  checklistTotalCount(checklist: StickyNoteCardChecklist): number {
    if (typeof checklist.totalCount === 'number') return checklist.totalCount;
    return checklist.items.length;
  }

  isChecklistItemUpdating(itemId: string): boolean {
    return this.updatingChecklistItemIds.includes(itemId);
  }

  onChecklistItemChange(checklistId: string, itemId: string, checked: boolean): void {
    this.checklistItemChange.emit({ checklistId, itemId, checked });
  }
}
