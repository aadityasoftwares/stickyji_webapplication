import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowLeft,
  LucideArchiveRestore,
  LucideClock3,
  LucideGrid2X2,
  LucideList,
  LucideRefreshCw,
  LucideSearch,
  LucideTrash2,
  LucideX
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { DeleteConfirmModal } from '../../../shared/components/delete-confirm-modal/delete-confirm-modal';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Loader } from '../../../shared/components/loader/loader';
import { Select, type SelectOption, type SelectValue } from '../../../shared/components/select/select';
import { Tabs, type TabItem, type TabValue } from '../../../shared/components/tabs/tabs';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { extractErrorMessage } from '../../../shared/functions/common.function';
import { STICKY_NOTE_MESSAGES } from '../messages/sticky-note.messages';
import { STORAGE_KEYS } from '../../../shared/constants/app.constants';
import { APP_ROUTES, routeCommands } from '../../../shared/constants/route.constants';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { StickyNote } from '../sticky-note/sticky-note';
import { StickyNoteApiService } from '../services/sticky-notes.service';

type TrashView = 'grid' | 'list';
type TrashSort = 'deletedAt' | 'purgeAfter' | 'title';

@Component({
  selector: 'app-sticky-note-trash',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    DeleteConfirmModal,
    Loader,
    Select,
    StickyNote,
    Tabs
  ],
  templateUrl: './sticky-note-trash.html',
  styleUrl: './sticky-note-trash.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StickyNoteTrash implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly stickyNoteApi = inject(StickyNoteApiService);
  private readonly toastService = inject(ToastService);

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArchiveRestore = LucideArchiveRestore;
  readonly LucideClock3 = LucideClock3;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideList = LucideList;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideSearch = LucideSearch;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;

  readonly workspaceId = signal<string | null>(null);
  readonly notes = signal<any[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly view = signal<TrashView>('grid');
  readonly sortBy = signal<TrashSort>('deletedAt');
  readonly actionId = signal<string | null>(null);
  readonly permanentTarget = signal<any | null>(null);

  readonly sortOptions: readonly SelectOption[] = [
    { label: 'Recently deleted', value: 'deletedAt' },
    { label: 'Deletes soonest', value: 'purgeAfter' },
    { label: 'Title A–Z', value: 'title' }
  ];

  readonly viewTabs: readonly TabItem[] = [
    { value: 'grid', label: 'Grid', icon: LucideGrid2X2, ariaLabel: 'Show deleted notes in grid view' },
    { value: 'list', label: 'List', icon: LucideList, ariaLabel: 'Show deleted notes in list view' }
  ];

  readonly totalCount = computed(() => this.notes().length);

  readonly visibleNotes = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    return this.notes()
      .filter(note => {
        if (!search) return true;
        return [
          this.noteTitle(note),
          this.noteContent(note),
          this.folderLabel(note),
          this.columnLabel(note)
        ].some(value => value.toLowerCase().includes(search));
      })
      .sort((first, second) => {
        if (sort === 'title') {
          return this.noteTitle(first).localeCompare(this.noteTitle(second), undefined, { sensitivity: 'base' });
        }

        const firstTime = this.timestamp(first?.[sort]);
        const secondTime = this.timestamp(second?.[sort]);

        if (sort === 'purgeAfter') {
          return firstTime - secondTime;
        }

        return secondTime - firstTime;
      });
  });

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const routeWorkspaceId = String(params.get('workspaceId') ?? '').trim();
        const selectedWorkspaceId = String(this.workspaceStore.selectedId() ?? '').trim();
        const workspaceId = routeWorkspaceId || selectedWorkspaceId || null;

        this.workspaceId.set(workspaceId);
        this.loadTrash();
      });
  }

  loadTrash(): void {
    const workspaceId = this.workspaceId();
    if (!workspaceId) {
      this.notes.set([]);
      this.error.set(null);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.stickyNoteApi
      .getTrash(workspaceId, 1, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.notes.set(response?.data ?? []);
          this.loading.set(false);
        },
        error: error => {
          this.notes.set([]);
          this.loading.set(false);
          this.error.set(this.errorMessage(error, STICKY_NOTE_MESSAGES.ERROR.TRASH_LOAD_FAILED));
        }
      });
  }

  goBackToToday(): void {
    const workspaceId = this.workspaceId();

    this.router.navigate(routeCommands(APP_ROUTES.TODAY), {
      queryParams: workspaceId ? { workspaceId } : undefined
    });
  }

  updateSearch(value: InputValue): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(value: SelectValue | SelectValue[] | null): void {
    if (value === null || Array.isArray(value)) return;

    if (value === 'deletedAt' || value === 'purgeAfter' || value === 'title') {
      this.sortBy.set(value);
    }
  }

  setView(value: TabValue): void {
    if (value === 'grid' || value === 'list') {
      this.view.set(value);
    }
  }

  restore(note: any): void {
    const id = this.noteId(note);
    if (!id || this.actionId()) return;

    this.actionId.set(id);

    this.stickyNoteApi
      .restore(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notes.update(notes => notes.filter(item => this.noteId(item) !== id));
          this.actionId.set(null);

          this.toastService.success(STICKY_NOTE_MESSAGES.SUCCESS.RESTORED_FROM_TRASH, {
            title: 'Back in your notes',
            dedupeKey: `restore-note-${id}`
          });
        },
        error: error => {
          this.actionId.set(null);

          this.toastService.error(this.errorMessage(error, STICKY_NOTE_MESSAGES.ERROR.RESTORE_FAILED), {
            title: 'Restore failed',
            dedupeKey: `restore-note-${id}`
          });
        }
      });
  }

  requestPermanentDelete(note: any): void {
    if (!this.actionId()) {
      this.permanentTarget.set(note);
    }
  }

  closePermanentDelete(): void {
    if (!this.actionId()) {
      this.permanentTarget.set(null);
    }
  }

  confirmPermanentDelete(): void {
    const note = this.permanentTarget();
    const id = this.noteId(note);

    if (!id || this.actionId()) return;

    this.actionId.set(id);

    this.stickyNoteApi
      .permanentlyDelete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notes.update(notes => notes.filter(item => this.noteId(item) !== id));
          this.actionId.set(null);
          this.permanentTarget.set(null);

          this.toastService.success(STICKY_NOTE_MESSAGES.SUCCESS.PERMANENTLY_DELETED, {
            title: 'Deleted permanently',
            dedupeKey: `permanent-note-${id}`
          });
        },
        error: error => {
          this.actionId.set(null);

          this.toastService.error(this.errorMessage(error, STICKY_NOTE_MESSAGES.ERROR.PERMANENT_DELETE_FAILED), {
            title: 'Delete failed',
            dedupeKey: `permanent-note-${id}`
          });
        }
      });
  }

  stickyNoteData(note: any): any {
    const content = this.noteContent(note);

    return {
      ...note,
      id: this.noteId(note),
      noteKey: note?.noteKey ?? (typeof note?.stickyNoteNumber === 'number' ? `ST-${String(note.stickyNoteNumber).padStart(6, '0')}` : undefined),
      title: this.noteTitle(note),
      content,
      description: content || undefined,
      columnLabel: this.columnLabel(note),
      color: note?.color ?? 'WHITE',
      shape: note?.shape ?? 'SQUARE',
      variant: note?.variant ?? 'PLAIN',
      backgroundPattern: note?.backgroundPattern ?? 'NONE',
      dueLabel: note?.noteDate ?? note?.dueLabel,
      checklists: Array.isArray(note?.checklists)
        ? note.checklists.map((checklist: any) => ({
          ...checklist,
          id: checklist?.id ?? checklist?._id,
          items: Array.isArray(checklist?.items)
            ? checklist.items.map((item: any) => ({
              ...item,
              id: item?.id ?? item?._id,
              isCompleted: item?.isCompleted === true
            }))
            : []
        }))
        : [],
      showDragHandle: false,
      showEditAction: false,
      showMoveActions: false,
      actionsDisabled: true,
      layout: 'detail',
      font: this.readStoredStickyNoteFont(),
      fontSize: this.readStoredStickyNoteFontSize()
    };
  }

  noteId(note: any): string {
    return String(note?.id ?? note?._id ?? '').trim();
  }

  noteTitle(note: any): string {
    return String(note?.title ?? '').trim() || 'Untitled note';
  }

  noteContent(note: any): string {
    return String(note?.content ?? note?.description ?? '').trim();
  }

  folderLabel(note: any): string {
    const folder = note?.workspaceFolderId;

    if (folder && typeof folder === 'object') {
      return String(folder?.name ?? 'Folder').trim() || 'Folder';
    }

    return 'Folder';
  }

  columnLabel(note: any): string {
    const column = note?.columnId;

    if (column && typeof column === 'object') {
      return String(column?.name ?? column?.title ?? 'Note').trim() || 'Note';
    }

    return 'Note';
  }

  daysRemaining(note: any): number {
    const purgeAfter = this.timestamp(note?.purgeAfter);

    if (!purgeAfter) return 60;

    return Math.max(
      0,
      Math.ceil((purgeAfter - Date.now()) / 86_400_000)
    );
  }

  purgeLabel(note: any): string {
    const days = this.daysRemaining(note);

    if (days <= 0) {
      return 'Pending cleanup';
    }

    return `${days} ${days === 1 ? 'day' : 'days'} left`;
  }

  isBusy(note: any): boolean {
    return this.actionId() === this.noteId(note);
  }

  private timestamp(value: unknown): number {
    if (!value) return 0;

    const time = new Date(String(value)).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  private readStoredStickyNoteFont(): string {
    try {
    return localStorage.getItem(STORAGE_KEYS.STICKY_NOTE_FONT) || 'dmSans';
    } catch {
      return 'dmSans';
    }
  }

  private readStoredStickyNoteFontSize(): number {
    try {
    const value = Number(localStorage.getItem(STORAGE_KEYS.STICKY_NOTE_FONT_SIZE));
      return [13, 14, 15, 16].includes(value) ? value : 14;
    } catch {
      return 14;
    }
  }

  private errorMessage(error: any, fallback: string): string {
    return extractErrorMessage(error, fallback);
  }
}
