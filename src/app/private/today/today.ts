import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';

import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideCheck,
  LucideCheckCircle2,
  LucideClock3,
  LucideFolderOpen,
  LucideGrid2X2,
  LucideGripVertical,
  LucideList,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideSearch,
  LucideX
} from '@lucide/angular';

import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { Divider } from '../../shared/components/divider/divider';
import { Input as AppInput } from '../../shared/components/input/input';
import { Label } from '../../shared/components/label/label';
import { Loader } from '../../shared/components/loader/loader';
import { Select, SelectOption, SelectValue } from '../../shared/components/select/select';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { Tabs } from '../../shared/components/tabs/tabs';

import { AddEditMyNotesModal } from '../mynotes/modals/add-edit-my-notes-modal/add-edit-my-notes-modal';
import { StickyNoteColumnApiService } from '../mynotes/services/sticky-note-column.service';
import { StickyNoteChecklistItemApiService } from '../mynotes/services/sticky-note-checklist-item.service';
import { StickyNoteApiService } from '../mynotes/services/sticky-notes.service';
import { WorkspaceApiService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceFolderApiService } from '../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import { ToastService } from '../../shared/components/toast/services/toast.service';

type TodayView = 'kanban' | 'list';

@Component({
  selector: 'app-today',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today.html',
  styleUrl: './today.scss',
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    DragDropModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Checkbox,
    Divider,
    Label,
    Loader,
    Select,
    StickyCard,
    Tabs,
    AddEditMyNotesModal
  ]
})
export class Today {
  private readonly destroyRef = inject(DestroyRef);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly workspaceApiService = inject(WorkspaceApiService);
  private readonly workspaceFolderApiService = inject(WorkspaceFolderApiService);
  private readonly stickyNoteColumnApiService = inject(StickyNoteColumnApiService);
  private readonly stickyNoteChecklistItemApiService = inject(StickyNoteChecklistItemApiService);
  private readonly stickyNoteApiService = inject(StickyNoteApiService);
  private readonly toastService = inject(ToastService);

  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideClock3 = LucideClock3;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideGripVertical = LucideGripVertical;
  readonly LucideList = LucideList;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideSearch = LucideSearch;
  readonly LucideX = LucideX;

  readonly today = signal(new Date());
  readonly view = signal<TodayView>('kanban');
  readonly searchTerm = signal('');
  readonly stickyNotes = signal<any[]>([]);
  readonly stickyNoteColumns = signal<any[]>([]);
  readonly loadingNotes = signal(false);
  readonly loadingColumns = signal(false);
  readonly boardError = signal<string | null>(null);
  readonly movingNoteId = signal<string | null>(null);
  readonly updatingChecklistItemIds = signal<readonly string[]>([]);
  readonly noteModalOpen = signal(false);
  readonly noteModalMode = signal<'create' | 'edit'>('create');
  readonly noteModalId = signal('');

  readonly activeWorkspaceId = this.workspaceStore.selectedId;
  readonly loadingWorkspaces = this.workspaceStore.loading;
  readonly activeFolder = this.workspaceFolderStore.selectedId;
  readonly loadingFolders = this.workspaceFolderStore.loading;
  readonly folders = this.workspaceFolderStore.activeFolders;
  readonly foldersError = this.workspaceFolderStore.error;

  readonly workspaceOptions = computed<SelectOption[]>(() =>
    this.workspaceStore.workspaces().map(workspace => ({ label: workspace.name, value: workspace.id }))
  );

  readonly folderOptions = computed<SelectOption[]>(() =>
    this.folders().map(folder => ({ label: folder.name, value: folder.id }))
  );

  readonly boardLoading = computed(() =>
    this.loadingWorkspaces() || this.loadingFolders() || this.loadingColumns() || this.loadingNotes()
  );

  readonly noteCount = computed(() => this.stickyNotes().length);
  readonly hasColumns = computed(() => this.stickyNoteColumns().length > 0);
  readonly firstActionColumnId = computed(() => this.stickyNoteColumns()[0]?.id ?? '');

  readonly visibleListNotes = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    if (!search) return this.stickyNotes();

    return this.stickyNotes().filter(note =>
      `${note.title ?? ''} ${note.description ?? ''}`.toLowerCase().includes(search)
    );
  });

  readonly viewTabs = [
    { value: 'kanban', label: 'Kanban', icon: LucideGrid2X2 },
    { value: 'list', label: 'List', icon: LucideList }
  ];

  ngOnInit(): void {
    this.getWorkspaces();
  }

  getWorkspaces(): void {
    if (this.workspaceStore.initialized()) {
      const workspaceId = this.activeWorkspaceId() ?? this.workspaceStore.workspaces()[0]?.id ?? null;
      if (workspaceId) {
        this.workspaceStore.select(workspaceId);
        this.getWorkspaceFolders(workspaceId);
      }
      return;
    }

    this.workspaceStore.setLoading(true);

    this.workspaceApiService.getMyWorkspaces()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const workspaces = response.data ?? [];
          this.workspaceStore.setWorkspaces(workspaces, response.pagination ?? null);

          const workspaceId = this.activeWorkspaceId() ?? workspaces[0]?.id ?? null;
          if (!workspaceId) {
            this.clearBoard();
            return;
          }

          this.workspaceStore.select(workspaceId);
          this.getWorkspaceFolders(workspaceId);
        },
        error: error => {
          console.error(error);
          this.workspaceStore.setError(this.errorMessage(error, 'Failed to load workspaces'));
          this.clearBoard();
        }
      });
  }

  onWorkspaceSelection(value: SelectValue): void {
    const workspaceId = value ? String(value) : null;

    this.workspaceStore.select(workspaceId);
    this.workspaceFolderStore.clear();
    this.clearBoard();

    if (workspaceId) this.getWorkspaceFolders(workspaceId);
  }

  getWorkspaceFolders(workspaceId: string): void {
    if (
      this.workspaceFolderStore.initialized() &&
      this.workspaceFolderStore.workspaceId() === workspaceId
    ) {
      this.selectFolderAndLoad();
      return;
    }

    this.workspaceFolderStore.resetForWorkspace(workspaceId);
    this.workspaceFolderStore.setLoading(true);

    this.workspaceFolderApiService.getByWorkspace(workspaceId, {
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      sortBy: 'position',
      sortOrder: 'asc'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (this.activeWorkspaceId() !== workspaceId) return;

          this.workspaceFolderStore.setFolders(
            workspaceId,
            response.data ?? [],
            response.pagination ?? null
          );
          this.selectFolderAndLoad();
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId) return;

          console.error(error);
          this.workspaceFolderStore.setError(this.errorMessage(error, 'Failed to load workspace folders'));
          this.clearBoard();
        }
      });
  }

  onFolderSelection(value: SelectValue): void {
    const folderId = value ? String(value) : null;

    this.workspaceFolderStore.select(folderId);
    this.clearBoard();

    if (folderId) this.loadBoard();
  }

  getStickyNoteColumns(): void {
    const workspaceId = this.activeWorkspaceId();
    const folderId = this.activeFolder();
    if (!workspaceId || !folderId) {
      this.stickyNoteColumns.set([]);
      return;
    }

    this.loadingColumns.set(true);

    this.stickyNoteColumnApiService.getByWorkspaceFolder(workspaceId, folderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId) return;

          const columns = [...(response.data ?? [])]
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map(column => this.mapColumn(column));

          this.stickyNoteColumns.set(columns);
          this.loadingColumns.set(false);
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId) return;

          console.error(error);
          this.stickyNoteColumns.set([]);
          this.boardError.set(this.errorMessage(error, 'Failed to load columns'));
          this.loadingColumns.set(false);
        }
      });
  }

  getNotesForToday(): void {
    const workspaceId = this.activeWorkspaceId();
    const folderId = this.activeFolder();
    if (!workspaceId || !folderId) {
      this.stickyNotes.set([]);
      return;
    }

    this.loadingNotes.set(true);

    this.stickyNoteApiService.getAll(this.buildParams({
      workspaceId,
      workspaceFolderId: folderId,
      page: 1,
      limit: 100,
      sortBy: 'position',
      sortOrder: 'asc'
    }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId) return;

          const notes = [...(response.data ?? [])]
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map(note => this.mapNote(note));

          this.stickyNotes.set(notes);
          this.loadingNotes.set(false);
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId) return;

          console.error(error);
          this.stickyNotes.set([]);
          this.boardError.set(this.errorMessage(error, 'Failed to load notes'));
          this.loadingNotes.set(false);
        }
      });
  }

  refreshBoard(): void {
    const workspaceId = this.activeWorkspaceId();
    if (!workspaceId) return;

    if (!this.activeFolder()) {
      this.getWorkspaceFolders(workspaceId);
      return;
    }

    this.loadBoard();
  }

  setView(value: string | number | null): void {
    if (value === 'kanban' || value === 'list') this.view.set(value);
  }

  updateSearch(value: any): void {
    this.searchTerm.set(value ?? '');
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  visibleNotesFor(columnId: string): any[] {
    const search = this.searchTerm().trim().toLowerCase();

    return this.stickyNotes().filter(note => {
      if (note.columnId !== columnId) return false;
      if (!search) return true;

      return `${note.title ?? ''} ${note.description ?? ''}`.toLowerCase().includes(search);
    });
  }

  canMoveBackward(note: any): boolean {
    return this.columnIndex(note.columnId) > 0;
  }

  canMoveForward(note: any): boolean {
    const index = this.columnIndex(note.columnId);
    return index >= 0 && index < this.stickyNoteColumns().length - 1;
  }

  dropNote(event: CdkDragDrop<any[]>, targetColumnId: string): void {
    if (this.searchTerm().trim() || this.movingNoteId()) return;

    const note = event.item.data;
    if (!note?.id || !targetColumnId) return;

    this.moveNote(note, targetColumnId, event.currentIndex);
  }

  moveBackward(note: any): void {
    const index = this.columnIndex(note.columnId);
    if (index <= 0) return;

    const targetColumn = this.stickyNoteColumns()[index - 1];
    this.moveNote(note, targetColumn.id, this.notesInColumn(targetColumn.id).length);
  }

  moveForward(note: any): void {
    const index = this.columnIndex(note.columnId);
    if (index < 0 || index >= this.stickyNoteColumns().length - 1) return;

    const targetColumn = this.stickyNoteColumns()[index + 1];
    this.moveNote(note, targetColumn.id, this.notesInColumn(targetColumn.id).length);
  }

  isNoteCompleted(note: any): boolean {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.type === 'COMPLETED';
  }

  noteEyebrow(note: any): string {
    const type = this.stickyNoteColumns().find(column => column.id === note.columnId)?.type;
    if (type === 'COMPLETED') return 'Completed';
    if (type === 'IN_PROGRESS') return 'In progress';
    if (type === 'TODO') return 'To do';
    return 'Note';
  }

  noteColumnLabel(note: any): string {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.label ?? 'Unknown';
  }

  noteColumnAccent(note: any): string {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.accent ?? this.columnAccent('YELLOW');
  }

  isChecklistItemUpdating(itemId: string): boolean {
    return this.updatingChecklistItemIds().includes(itemId);
  }

  updateChecklistItemStatus(noteId: string, itemId: string, checked: boolean): void {
    if (!noteId || !itemId || this.isChecklistItemUpdating(itemId)) return;

    const note = this.stickyNotes().find(item => item.id === noteId);
    const checklistItem = note?.checklists
      ?.flatMap((checklist: any) => checklist.items ?? [])
      .find((item: any) => item.id === itemId);

    if (!checklistItem || checklistItem.isCompleted === checked) return;

    this.setChecklistItemCompletion(noteId, itemId, checked);
    this.setChecklistItemUpdating(itemId, true);

    this.stickyNoteChecklistItemApiService.updateCompletion(itemId, checked)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const confirmed = response?.data?.isCompleted;

          if (typeof confirmed === 'boolean' && confirmed !== checked) {
            this.setChecklistItemCompletion(noteId, itemId, confirmed);
          }

          this.setChecklistItemUpdating(itemId, false);
        },
        error: error => {
          console.error(error);
          this.setChecklistItemCompletion(noteId, itemId, !checked);
          this.setChecklistItemUpdating(itemId, false);

          this.toastService.error(
            this.errorMessage(error, 'Unable to update checklist item.'),
            {
              title: 'Checklist not updated',
              dedupeKey: `checklist-item-${itemId}`
            }
          );
        }
      });
  }

  requestWorkspaceEdit(): void { }

  requestFolderEdit(): void { }

  openFolderCreateModal(): void { }

  openColumnCreateModal(): void { }

  requestColumnEdit(_column: any): void { }

  openNoteCreateModal(columnId: string): void {
    if (!columnId || this.movingNoteId()) return;

    this.noteModalMode.set('create');
    this.noteModalId.set(columnId);
    this.noteModalOpen.set(true);
  }

  openNoteEditModal(note: any, event?: Event): void {
    event?.stopPropagation();

    const noteId = note?.id ?? note?._id ?? '';
    if (!noteId || this.movingNoteId()) return;

    this.noteModalMode.set('edit');
    this.noteModalId.set(noteId);
    this.noteModalOpen.set(true);
  }

  closeNoteModal(): void {
    this.noteModalOpen.set(false);
    this.noteModalId.set('');
  }

  onNoteSaved(_noteId: string): void {
    this.closeNoteModal();
    this.getNotesForToday();
  }

  private moveNote(note: any, targetColumnId: string, targetIndex: number): void {
    if (this.movingNoteId()) return;

    const snapshot = this.stickyNotes().map(item => ({ ...item }));
    const sourceColumnId = note.columnId;
    const sourceNotes = this.notesInColumn(sourceColumnId).filter(item => item.id !== note.id);
    const targetNotes = sourceColumnId === targetColumnId
      ? sourceNotes
      : this.notesInColumn(targetColumnId).filter(item => item.id !== note.id);

    const index = Math.max(0, Math.min(targetIndex, targetNotes.length));
    targetNotes.splice(index, 0, { ...note, columnId: targetColumnId });

    const changed = new Map<string, any>();

    targetNotes.forEach((item, itemIndex) => {
      changed.set(item.id, {
        ...item,
        columnId: targetColumnId,
        position: itemIndex + 1
      });
    });

    if (sourceColumnId !== targetColumnId) {
      sourceNotes.forEach((item, itemIndex) => {
        changed.set(item.id, {
          ...item,
          columnId: sourceColumnId,
          position: itemIndex + 1
        });
      });
    }

    const nextNotes = snapshot.map(item => changed.get(item.id) ?? item);
    const updates = [...changed.values()].filter(item => {
      const previous = snapshot.find(current => current.id === item.id);
      return previous && (
        previous.columnId !== item.columnId ||
        previous.position !== item.position
      );
    });

    if (!updates.length) return;

    this.stickyNotes.set(this.sortNotes(nextNotes));
    this.movingNoteId.set(note.id);
    this.boardError.set(null);

    forkJoin(
      updates.map(item =>
        this.stickyNoteApiService.update(item.id, {
          columnId: item.columnId,
          position: item.position
        })
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.movingNoteId.set(null),
        error: error => {
          console.error(error);
          this.movingNoteId.set(null);
          this.boardError.set(this.errorMessage(error, 'Failed to move note'));
          this.getNotesForToday();
        }
      });
  }

  private notesInColumn(columnId: string): any[] {
    return this.stickyNotes()
      .filter(note => note.columnId === columnId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  private sortNotes(notes: any[]): any[] {
    return [...notes].sort((a, b) => {
      const columnDifference = this.columnIndex(a.columnId) - this.columnIndex(b.columnId);
      return columnDifference || (a.position ?? 0) - (b.position ?? 0);
    });
  }

  private selectFolderAndLoad(): void {
    const folders = this.folders();
    if (!folders.length) {
      this.workspaceFolderStore.select(null);
      this.clearBoard();
      return;
    }

    const folderId = this.activeFolder() ?? this.workspaceFolderStore.defaultFolder()?.id ?? folders[0].id;
    this.workspaceFolderStore.select(folderId);
    this.loadBoard();
  }

  private loadBoard(): void {
    this.boardError.set(null);
    this.getStickyNoteColumns();
    this.getNotesForToday();
  }

  private clearBoard(): void {
    this.stickyNoteColumns.set([]);
    this.stickyNotes.set([]);
    this.boardError.set(null);
    this.loadingColumns.set(false);
    this.loadingNotes.set(false);
    this.movingNoteId.set(null);
    this.updatingChecklistItemIds.set([]);
  }

  private columnIndex(columnId: string): number {
    return this.stickyNoteColumns().findIndex(column => column.id === columnId);
  }

  private mapColumn(column: any): any {
    const color = String(column.color || 'YELLOW').toUpperCase();

    return {
      ...column,
      id: column.id ?? column._id,
      label: column.name || 'Untitled column',
      type: column.type || 'CUSTOM',
      color,
      position: column.position ?? 0,
      accent: this.columnAccent(color),
      checkboxVariant: this.noteVariant(color)
    };
  }

  private mapNote(note: any): any {
    const title = String(note.title || '').trim() || 'Untitled note';
    const content = String(note.content || '').trim();
    const checklists = this.mapChecklists(
      Array.isArray(note.checklists)
        ? note.checklists
        : note.checklist
          ? [note.checklist]
          : []
    );

    const totalCount = checklists.reduce(
      (total: number, checklist: any) => total + checklist.totalCount,
      0
    );

    const completedCount = checklists.reduce(
      (total: number, checklist: any) => total + checklist.completedCount,
      0
    );

    return {
      ...note,
      id: note.id ?? note._id,
      columnId: this.referenceId(note.columnId),
      folderId: this.referenceId(note.workspaceFolderId),
      title,
      description: content && content !== title ? content : '',
      tone: this.noteVariant(note.color),
      checklists,
      checklistCount: checklists.length,
      checklistItemCount: totalCount,
      completedChecklistItemCount: completedCount,
      progress: totalCount
        ? Math.round((completedCount / totalCount) * 100)
        : undefined,
      compact: !content || content === title
    };
  }

  private mapChecklists(checklists: any[]): any[] {
    return [...checklists]
      .filter(checklist => checklist?.status !== 'DELETED')
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(checklist => {
        const items = Array.isArray(checklist.items)
          ? [...checklist.items]
            .filter(item => item?.status !== 'DELETED')
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map(item => ({
              ...item,
              id: item.id ?? item._id,
              title: String(item.title || '').trim(),
              isCompleted: item.isCompleted === true
            }))
          : [];

        return {
          ...checklist,
          id: checklist.id ?? checklist._id,
          title: String(checklist.title || '').trim() || 'Checklist',
          items,
          totalCount: items.length,
          completedCount: items.filter(item => item.isCompleted).length
        };
      });
  }

  private setChecklistItemCompletion(noteId: string, itemId: string, isCompleted: boolean): void {
    this.stickyNotes.update(notes =>
      notes.map(note => {
        if (note.id !== noteId || !note.checklists?.length) return note;

        const checklists = note.checklists.map((checklist: any) => {
          const items = (checklist.items ?? []).map((item: any) =>
            item.id === itemId ? { ...item, isCompleted } : item
          );

          return {
            ...checklist,
            items,
            totalCount: items.length,
            completedCount: items.filter((item: any) => item.isCompleted).length
          };
        });

        const totalCount = checklists.reduce(
          (total: number, checklist: any) => total + checklist.totalCount,
          0
        );

        const completedCount = checklists.reduce(
          (total: number, checklist: any) => total + checklist.completedCount,
          0
        );

        return {
          ...note,
          checklists,
          checklistCount: checklists.length,
          checklistItemCount: totalCount,
          completedChecklistItemCount: completedCount,
          progress: totalCount
            ? Math.round((completedCount / totalCount) * 100)
            : undefined
        };
      })
    );
  }

  private setChecklistItemUpdating(itemId: string, updating: boolean): void {
    this.updatingChecklistItemIds.update(ids => {
      if (updating) return ids.includes(itemId) ? ids : [...ids, itemId];
      return ids.filter(id => id !== itemId);
    });
  }

  private referenceId(value: any): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value.id ?? value._id ?? '';
  }

  private noteVariant(color: string): any {
    const variants: Record<string, string> = {
      YELLOW: 'noteYellow',
      BLUE: 'noteBlue',
      GREEN: 'noteGreen',
      PINK: 'notePink',
      PURPLE: 'notePurple',
      ORANGE: 'noteOrange',
      RED: 'noteRed',
      BROWN: 'noteBrown',
      BLACK: 'noteBlack'
    };

    return variants[String(color || 'YELLOW').toUpperCase()] ?? 'noteYellow';
  }

  private columnAccent(color: string): string {
    const accents: Record<string, string> = {
      YELLOW: 'var(--note-yellow, #eab308)',
      BLUE: 'var(--note-blue, #3b82f6)',
      GREEN: 'var(--note-green, #22c55e)',
      PINK: 'var(--note-pink, #ec4899)',
      PURPLE: 'var(--note-purple, #a855f7)',
      ORANGE: 'var(--note-orange, #f97316)',
      RED: 'var(--note-red, #ef4444)',
      BROWN: 'var(--note-brown, #92400e)',
      BLACK: 'var(--note-black, #171717)'
    };

    return accents[String(color || 'YELLOW').toUpperCase()] ?? accents['YELLOW'];
  }

  private buildParams(filters: Record<string, unknown>): Record<string, string> {
    const params: Record<string, string> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) params[key] = String(value);
    });

    return params;
  }

  private errorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }
}