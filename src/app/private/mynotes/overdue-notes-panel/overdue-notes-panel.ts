import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideCalendarDays, LucideCheckCircle2, LucideClock3, LucideExternalLink } from '@lucide/angular';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Loader } from '../../../shared/components/loader/loader';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { Tabs, TabItem } from '../../../shared/components/tabs/tabs';
import { UserDatePipe } from '../../../shared/pipes/user-date.pipe';
import { STICKY_NOTE_COLUMN_TYPES } from '../../../shared/constants/common.constants';

@Component({
  selector: 'app-overdue-notes-panel',
  standalone: true,
  imports: [AppIcon, Badge, Button, Checkbox, Loader, SidePanel, Tabs, UserDatePipe],
  templateUrl: './overdue-notes-panel.html',
  styleUrl: './overdue-notes-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverdueNotesPanel {
  readonly columnTypes = STICKY_NOTE_COLUMN_TYPES;
  readonly open = input(false);
  readonly data = input<any>(null);
  readonly pagination = input<any>(null);
  readonly loading = input(false);
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly selectedIds = input<ReadonlySet<string>>(new Set());
  readonly columnFilter = input('');
  readonly closed = output<void>();
  readonly selectionChange = output<ReadonlySet<string>>();
  readonly filterChange = output<string>();
  readonly pageChange = output<number>();
  readonly retry = output<void>();
  readonly bringToToday = output<readonly string[]>();
  readonly openNote = output<any>();

  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideClock3 = LucideClock3;
  readonly LucideExternalLink = LucideExternalLink;
  private pendingNote: any = null;

  readonly filterTabs = computed<readonly TabItem[]>(() => [
    { value: '', label: 'All', count: this.data()?.total ?? 0 },
    ...(this.data()?.byColumn ?? []).filter((column: any) => column.type !== this.columnTypes.COMPLETED).map((column: any) => ({
      value: column.columnId, label: column.name, count: column.count
    }))
  ]);
  readonly visibleNotes = computed(() => (this.data()?.notes ?? []).filter((note: any) =>
    !this.columnFilter() || note.column.id === this.columnFilter()
  ));
  readonly groups = computed(() => {
    const groups = new Map<string, { date: string; yesterday: boolean; notes: any[] }>();
    for (const note of this.visibleNotes()) {
      let group = groups.get(note.noteDate);
      if (!group) {
        group = { date: note.noteDate, yesterday: note.daysOverdue === 1, notes: [] };
        groups.set(note.noteDate, group);
      }
      group.notes.push(note);
    }
    return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date));
  });
  readonly selected = computed(() => [...this.selectedIds()]);
  readonly visibleSelectedCount = computed(() => this.visibleNotes().filter((note: any) => this.selectedIds().has(note.id)).length);
  readonly allVisibleSelected = computed(() => this.visibleNotes().length > 0 && this.visibleSelectedCount() === this.visibleNotes().length);
  readonly disabled = computed(() => this.busy() || this.loading() || !!this.error());

  selectNote(id: string, checked: boolean): void {
    if (this.disabled()) return;
    const selected = new Set(this.selectedIds());
    if (checked) selected.add(id);
    else selected.delete(id);
    this.selectionChange.emit(selected);
  }

  selectVisible(checked: boolean): void {
    if (this.disabled()) return;
    const selected = new Set(this.selectedIds());
    for (const note of this.visibleNotes()) {
      if (checked) selected.add(note.id);
      else selected.delete(note.id);
    }
    this.selectionChange.emit(selected);
  }

  clearSelection(): void {
    this.selectionChange.emit(new Set());
  }

  changeFilter(value: string | number): void {
    this.clearSelection();
    this.filterChange.emit(String(value));
  }

  requestOpen(note: any): void {
    if (this.disabled()) return;
    this.pendingNote = note;
    this.closed.emit();
  }

  afterClosed(): void {
    const note = this.pendingNote;
    this.pendingNote = null;
    if (note) this.openNote.emit(note);
  }
}
