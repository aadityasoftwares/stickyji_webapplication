import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, ViewChild, inject, signal, effect, untracked } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { LucideCheck, LucideChevronDown, LucideArrowLeft, LucideArrowRight, LucideFolderOpen, LucideGrid2X2, LucideList, LucideMoreHorizontal, LucidePanelsTopLeft, LucidePencil, LucidePlus, LucideRefreshCw, LucideSearch, LucideTrash2, LucideX } from '@lucide/angular';
import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { Divider } from '../../shared/components/divider/divider';
import { Input as AppInput } from '../../shared/components/input/input';
import { Label } from '../../shared/components/label/label';
import { Loader } from '../../shared/components/loader/loader';
import { Select } from '../../shared/components/select/select';
import { Tabs } from '../../shared/components/tabs/tabs';
import { AddEditNoteSidePanel } from '../mynotes/add-edit-note-side-panel/add-edit-note-side-panel';
import { StickyNote } from '../mynotes/sticky-note/sticky-note';
import { StickyNoteColumnApiService } from '../mynotes/services/sticky-note-column.service';
import { StickyNoteColumnStore } from '../mynotes/services/sticky-note-column.store';
import { StickyNoteChecklistItemApiService } from '../mynotes/services/sticky-note-checklist-item.service';
import { StickyNoteApiService } from '../mynotes/services/sticky-notes.service';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceFolderService } from '../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { MembersStack } from '../workspace-members/members-stack/members-stack';
import { WorkspaceMemberApiService } from '../workspace-members/services/workspace-member.service';
import { DeleteConfirmModal } from '../../shared/components/delete-confirm-modal/delete-confirm-modal';
import { AddEditStickyNoteColumnSidePanel } from '../sticky-note-columns/add-edit-sticky-note-column-side-panel/add-edit-sticky-note-column-side-panel';
import { STICKY_NOTE_LAYOUT_OPTIONS, STICKY_NOTE_FONT_OPTIONS, STICKY_NOTE_FONT_SIZE_OPTIONS, USER_PREFERENCE_KEYS } from '../../shared/constants/common.constants';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
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
    OverlayModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Checkbox,
    Divider,
    Loader,
    MembersStack,
    Select,
    StickyNote,
    DeleteConfirmModal,
    Tabs,
    AddEditNoteSidePanel,
    AddEditStickyNoteColumnSidePanel
  ]
})

export class Today {

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly workspaceApiService = inject(WorkspaceService);
  private readonly workspaceMemberApiService = inject(WorkspaceMemberApiService);
  private readonly workspaceFolderApiService = inject(WorkspaceFolderService);
  private readonly stickyNoteColumnApiService = inject(StickyNoteColumnApiService);
  private readonly stickyNoteColumnStore = inject(StickyNoteColumnStore);
  private readonly stickyNoteChecklistItemApiService = inject(StickyNoteChecklistItemApiService);
  private readonly stickyNoteApiService = inject(StickyNoteApiService);
  private readonly stickyNoteTrashApiService = inject(StickyNoteApiService);
  private readonly toastService = inject(ToastService);

  private workspaceMemberRequestVersion = 0;
  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideList = LucideList;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideSearch = LucideSearch;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;
  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;

  readonly today = signal(new Date());
  readonly view = signal<any>('kanban');
  readonly searchTerm = signal('');

  readonly stickyNoteLayoutOptions: any[] = STICKY_NOTE_LAYOUT_OPTIONS;
  readonly stickyNoteFontOptions: any[] = STICKY_NOTE_FONT_OPTIONS;
  readonly stickyNoteFontSizeOptions: any[] = STICKY_NOTE_FONT_SIZE_OPTIONS;

  readonly stickyNoteLayout = this.userPreferenceStore.stickyNoteLayout;
  readonly stickyNoteFont = this.userPreferenceStore.stickyNoteFont;
  readonly stickyNoteFontSize = this.userPreferenceStore.stickyNoteFontSize;

  readonly workspaceOptions = computed<any[]>(() => this.workspaceStore.workspaces().map(workspace => ({ label: workspace.name, value: workspace.id })));
  readonly activeWorkspaceId = this.workspaceStore.selectedId;
  readonly loadingWorkspaces = this.workspaceStore.loading;

  private readonly syncPreferredWorkspace = effect(() => {
    if (!this.userPreferenceStore.loaded() || !this.workspaceStore.loaded()) return;

    const preferredWorkspaceId = this.userPreferenceStore.selectedWorkspaceId();
    if (!preferredWorkspaceId) return;

    const exists = this.workspaceStore.workspaces().some(
      workspace => workspace.id === preferredWorkspaceId
    );
    if (!exists) return;

    const currentWorkspaceId = this.activeWorkspaceId();

    if (currentWorkspaceId !== preferredWorkspaceId) {
      this.workspaceStore.select(preferredWorkspaceId);
      this.workspaceFolderStore.clear();
      this.stickyNoteColumnStore.clear();
      this.clearWorkspaceMembers();
      this.clearBoard();
    }

    untracked(() => {
      this.loadWorkspaceMembers(preferredWorkspaceId);
      this.getWorkspaceFolders(preferredWorkspaceId);
    });
  });

  readonly activeFolder = this.workspaceFolderStore.selectedId;
  readonly loadingFolders = this.workspaceFolderStore.loading;
  readonly folders = this.workspaceFolderStore.activeFolders;
  readonly foldersError = this.workspaceFolderStore.error;
  readonly folderOptions = computed<any[]>(() => this.folders().map(folder => ({ label: folder.name, value: folder.id })));

  readonly stickyNotes = signal<any[]>([]);
  readonly loadingNotes = signal(false);
  readonly workspaceMembers = signal<readonly any[]>([]);
  readonly loadingWorkspaceMembers = signal(false);
  readonly stickyNoteColumns = computed(() => this.stickyNoteColumnStore.orderedColumns().map(column => this.mapColumn(column)));
  readonly loadingColumns = this.stickyNoteColumnStore.loading;
  readonly boardError = signal<string | null>(null);
  readonly movingNoteId = signal<string | null>(null);
  readonly updatingChecklistItemIds = signal<readonly string[]>([]);
  readonly updatingTitleIds = signal<readonly string[]>([]);
  readonly updatingDescriptionIds = signal<readonly string[]>([]);
  readonly tableEditingTitleId = signal<string | null>(null);
  readonly tableTitleDraft = signal('');
  readonly notePanelOpen = signal(false);
  readonly notePanelMode = signal<'create' | 'edit'>('create');
  readonly notePanelId = signal('');
  readonly columnPanelOpen = signal(false);
  readonly columnPanelId = signal('');
  readonly columnPanelColumn = signal<any | null>(null);
  readonly trashTarget = signal<any | null>(null);
  readonly trashingNoteId = signal<string | null>(null);
  readonly workspaceMemberStack = computed<readonly any[]>(() => this.workspaceMembers().map(member => ({
    id: this.workspaceMemberId(member),
    name: this.workspaceMemberName(member),
    src: this.workspaceMemberAvatar(member),
    tooltip: `${this.workspaceMemberName(member)} · ${this.workspaceMemberRole(member)}`
  })));
  readonly boardLoading = computed(() => this.loadingWorkspaces() || this.loadingFolders() || this.loadingColumns() || this.loadingNotes());
  readonly noteCount = computed(() => this.stickyNotes().length);
  readonly hasColumns = computed(() => this.stickyNoteColumns().length > 0);
  readonly firstActionColumnId = computed(() => this.stickyNoteColumns()[0]?.id ?? '');
  readonly visibleListNotes = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    if (!search)
      return this.stickyNotes();
    return this.stickyNotes().filter(note => `${note.title ?? ''} ${note.description ?? ''}`.toLowerCase().includes(search));
  });
  readonly viewTabs = [
    {
      value: 'kanban',
      label: 'Kanban',
      icon: LucideGrid2X2,
    },
    {
      value: 'list',
      label: 'List',
      icon: LucideList,
    },
  ] as any;

  ngOnInit(): void {
    this.userPreferenceStore.load();
    this.getWorkspaces();
  }

  fontFamilyFor(value: string): string {
    return this.stickyNoteFontOptions.find(option => option.value === value)?.family ?? this.stickyNoteFontOptions[0]?.family ?? '"DM Sans", sans-serif';
  }

  chooseFont(value: string): void {
    this.onStickyNoteFontSelection(value);
  }

  onStickyNoteFontSelection(value: any): void {
    const font = String(value ?? '')?.trim();
    if (!this.isStickyNoteFont(font)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT, font);
  }

  getWorkspaces(force = false): void {
    if (this.workspaceStore.loaded() && !force) {
      const workspaceId = this.resolveWorkspaceSelection();

      if (!workspaceId) {
        this.workspaceFolderStore.clear();
        this.stickyNoteColumnStore.clear();
        this.clearWorkspaceMembers();
        this.clearBoard();
        return;
      }

      this.activateWorkspace(workspaceId);
      return;
    }

    if (this.workspaceStore.loading()) return;

    this.workspaceStore.setLoading(true);
    this.workspaceStore.clearError();

    this.workspaceApiService.getMyWorkspaces()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.workspaceStore.setLoading(false))
      )
      .subscribe({
        next: (response: any) => {
          const workspaces = response?.data ?? [];
          const pagination = response?.data?.meta ?? null;

          this.workspaceStore.setWorkspaces(
            Array.isArray(workspaces) ? workspaces : [],
            pagination
          );

          const workspaceId = this.resolveWorkspaceSelection();

          if (!workspaceId) {
            this.workspaceFolderStore.clear();
            this.stickyNoteColumnStore.clear();
            this.clearWorkspaceMembers();
            this.clearBoard();
            return;
          }

          this.activateWorkspace(workspaceId);
        },
        error: (error: any) => {
          console.error(error);
          this.workspaceStore.setError(
            this.errorMessage(error, 'Failed to load workspaces')
          );
          this.workspaceFolderStore.clear();
          this.stickyNoteColumnStore.clear();
          this.clearWorkspaceMembers();
          this.clearBoard();
        }
      });
  }

  private resolveWorkspaceSelection(): string | null {
    const workspaces = this.workspaceStore.workspaces();
    if (!workspaces.length) return null;

    const preferredWorkspaceId = this.userPreferenceStore.selectedWorkspaceId();

    if (
      preferredWorkspaceId &&
      workspaces.some(workspace => workspace.id === preferredWorkspaceId)
    ) {
      return preferredWorkspaceId;
    }

    const currentWorkspaceId = this.workspaceStore.selectedId();

    if (
      currentWorkspaceId &&
      workspaces.some(workspace => workspace.id === currentWorkspaceId)
    ) {
      return currentWorkspaceId;
    }

    return workspaces[0]?.id ?? null;
  }

  private activateWorkspace(workspaceId: string): void {
    this.workspaceStore.select(workspaceId);
    this.loadWorkspaceMembers(workspaceId);
    this.getWorkspaceFolders(workspaceId);
  }

  onWorkspaceSelection(value: any): void {
    const workspaceId = String(value ?? '').trim();
    if (!workspaceId || workspaceId === this.activeWorkspaceId()) return;

    this.workspaceStore.select(workspaceId);
    this.userPreferenceStore.setAndSave(
      USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID,
      workspaceId
    );

    this.workspaceFolderStore.clear();
    this.stickyNoteColumnStore.clear();
    this.clearWorkspaceMembers();
    this.clearBoard();

    this.loadWorkspaceMembers(workspaceId);
    this.getWorkspaceFolders(workspaceId);
  }

  loadWorkspaceMembers(workspaceId: string): void {
    const id = workspaceId.trim();
    const requestVersion = ++this.workspaceMemberRequestVersion;
    if (!id) {
      this.clearWorkspaceMembers();
      return;
    }
    this.loadingWorkspaceMembers.set(true);
    this.workspaceMemberApiService.getAll({
      workspaceId: id,
      status: 'ACTIVE',
      page: 1,
      limit: 100,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (requestVersion !== this.workspaceMemberRequestVersion ||
            this.activeWorkspaceId() !== id) {
            return;
          }
          this.workspaceMembers.set(response.data ?? []);
          this.loadingWorkspaceMembers.set(false);
        },
        error: error => {
          if (requestVersion !== this.workspaceMemberRequestVersion ||
            this.activeWorkspaceId() !== id) {
            return;
          }
          console.error(error);
          this.workspaceMembers.set([]);
          this.loadingWorkspaceMembers.set(false);
        }
      });
  }

  getWorkspaceFolders(workspaceId: string): void {
    if (this.workspaceFolderStore.initialized() &&
      !this.workspaceFolderStore.error() &&
      this.workspaceFolderStore.workspaceId() === workspaceId) {
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
          if (this.activeWorkspaceId() !== workspaceId)
            return;
          this.workspaceFolderStore.setFolders(workspaceId, response.data ?? [], response.pagination ?? null);
          this.selectFolderAndLoad();
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId)
            return;
          console.error(error);
          this.workspaceFolderStore.setError(this.errorMessage(error, 'Failed to load workspace folders'));
          this.clearBoard();
        }
      });
  }

  onFolderSelection(value: any): void {
    const folderId = value ? String(value) : null;
    this.workspaceFolderStore.select(folderId);
    this.stickyNoteColumnStore.clear();
    this.clearBoard();
    if (folderId) {
      this.loadBoard();
    }
  }
  getStickyNoteColumns(force = false): void {
    const workspaceId = this.activeWorkspaceId();
    const folderId = this.activeFolder();
    if (!workspaceId || !folderId) {
      this.stickyNoteColumnStore.clear();
      return;
    }
    if (!force &&
      this.stickyNoteColumnStore.initialized() &&
      !this.stickyNoteColumnStore.error() &&
      this.stickyNoteColumnStore.contextMatches(workspaceId, folderId)) {
      return;
    }
    this.stickyNoteColumnStore.resetForContext(workspaceId, folderId);
    this.stickyNoteColumnStore.setLoading(true);
    this.stickyNoteColumnApiService
      .getByWorkspaceFolder(workspaceId, folderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (this.activeWorkspaceId() !== workspaceId ||
            this.activeFolder() !== folderId) {
            return;
          }
          this.stickyNoteColumnStore.setColumns(workspaceId, folderId, response.data ?? []);
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId ||
            this.activeFolder() !== folderId) {
            return;
          }
          console.error(error);
          const message = this.errorMessage(error, 'Failed to load columns');
          this.stickyNoteColumnStore.setError(message);
          this.boardError.set(message);
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
      status: 'ACTIVE',
      datePreset: 'TODAY',
      sortBy: 'position',
      sortOrder: 'asc',
    }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId)
            return;
          const notes = [...(response.data ?? [])]
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map(note => this.mapNote(note));
          this.stickyNotes.set(notes);
          this.loadingNotes.set(false);
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId)
            return;
          console.error(error);
          this.stickyNotes.set([]);
          this.boardError.set(this.errorMessage(error, 'Failed to load notes'));
          this.loadingNotes.set(false);
        }
      });
  }
  refreshBoard(): void {
    const workspaceId = this.activeWorkspaceId();
    if (!workspaceId)
      return;
    this.loadWorkspaceMembers(workspaceId);
    if (!this.activeFolder()) {
      this.getWorkspaceFolders(workspaceId);
      return;
    }
    this.loadBoard(true);
  }
  setView(value: string | number | null): void {
    if (value === 'kanban' || value === 'list') {
      this.view.set(value);
      this.searchTerm.set('');
    }
  }
  openStickyNoteTrash(): void {
    const workspaceId = this.activeWorkspaceId();
    this.router.navigate(['/mynotes/trash'], {
      queryParams: workspaceId
        ? { workspaceId }
        : undefined
    });
  }
  updateSearch(value: any): void {
    this.searchTerm.set(value ?? '');
  }
  clearSearch(): void {
    this.searchTerm.set('');
  }
  onStickyNoteLayoutSelection(value: any): void {
    const layout = String(value ?? '').trim();
    if (!this.isStickyNoteLayout(layout)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT, layout);
  }
  onStickyNoteFontSizeSelection(value: any): void {
    const size = Number(value);
    if (!this.isStickyNoteFontSize(size)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT_SIZE, size);
  }
  isNoteTitleUpdating(noteId: string): boolean {
    return this.updatingTitleIds().includes(noteId);
  }
  isNoteDescriptionUpdating(noteId: string): boolean {
    return this.updatingDescriptionIds().includes(noteId);
  }
  startTableTitleEdit(note: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const noteId = String(note?.id ?? '').trim();
    if (!noteId ||
      this.isNoteTitleUpdating(noteId) ||
      this.movingNoteId()) {
      return;
    }
    this.tableEditingTitleId.set(noteId);
    this.tableTitleDraft.set(String(note?.title ?? ''));
    const sourceElement = event?.currentTarget as HTMLElement | null;
    setTimeout(() => {
      const row = sourceElement?.closest('tr');
      const input = row?.querySelector<HTMLInputElement>('[data-inline-note-title]');
      input?.focus();
      input?.select();
    });
  }
  onTableTitleInput(event: Event): void {
    this.tableTitleDraft.set((event.target as HTMLInputElement).value);
  }
  onTableTitleKeydown(event: KeyboardEvent, note: any): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLInputElement).blur();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancelTableTitleEdit(note);
    }
  }
  commitTableTitleEdit(note: any): void {
    const noteId = String(note?.id ?? '').trim();
    if (!noteId ||
      this.tableEditingTitleId() !== noteId) {
      return;
    }
    const currentTitle = String(note?.title ?? '').trim();
    const nextTitle = String(this.tableTitleDraft() ?? '').trim();
    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
    if (!nextTitle || nextTitle === currentTitle) {
      return;
    }
    this.updateNoteTitle({
      noteId,
      title: nextTitle
    });
  }
  cancelTableTitleEdit(note?: any): void {
    const noteId = String(note?.id ?? '').trim();
    if (noteId &&
      this.tableEditingTitleId() !== noteId) {
      return;
    }
    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
  }
  visibleNotesFor(columnId: string): any[] {
    const search = this.searchTerm().trim().toLowerCase();
    return this.stickyNotes().filter(note => {
      if (note.columnId !== columnId)
        return false;
      if (!search)
        return true;
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
  dropNote(event: any, targetColumnId: string): void {
    if (this.searchTerm().trim() || this.movingNoteId())
      return;
    const note = event.item.data;
    if (!note?.id || !targetColumnId)
      return;
    this.moveNote(note, targetColumnId, event.currentIndex);
  }
  moveBackward(note: any): void {
    const index = this.columnIndex(note.columnId);
    if (index <= 0)
      return;
    const targetColumn = this.stickyNoteColumns()[index - 1];
    this.moveNote(note, targetColumn.id, this.notesInColumn(targetColumn.id).length);
  }
  moveForward(note: any): void {
    const index = this.columnIndex(note.columnId);
    if (index < 0 || index >= this.stickyNoteColumns().length - 1)
      return;
    const targetColumn = this.stickyNoteColumns()[index + 1];
    this.moveNote(note, targetColumn.id, this.notesInColumn(targetColumn.id).length);
  }
  isNoteCompleted(note: any): boolean {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.type === 'COMPLETED';
  }
  noteEyebrow(note: any): string {
    const type = this.stickyNoteColumns().find(column => column.id === note.columnId)?.type;
    if (type === 'COMPLETED')
      return 'Completed';
    if (type === 'IN_PROGRESS')
      return 'In progress';
    if (type === 'TODO')
      return 'To do';
    return 'Note';
  }
  noteColumnLabel(note: any): string {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.label
      ?? note?.columnName
      ?? 'Note';
  }
  noteDateLabel(value: unknown): string {
    const dateKey = String(value ?? '').trim();
    if (!dateKey) return 'No date';
    const parts = dateKey.split('-').map(Number);
    if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) {
      return dateKey;
    }
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
  todayDateKey(): string {
    const date = this.today();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  noteColumnAccent(note: any): string {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.accent ?? this.columnAccent('YELLOW');
  }
  stickyNoteData(note: any, column: any): any {
    const content = String(note?.content ?? note?.description ?? '');
    return {
      ...note,
      id: note?.id ?? note?._id,
      title: note?.title || 'Untitled note',
      content,
      description: content || undefined,
      eyebrow: this.noteEyebrow(note),
      columnLabel: column?.label ?? column?.name ?? 'Note',
      color: note?.color ?? 'WHITE',
      shape: note?.shape ?? 'SQUARE',
      variant: note?.variant ?? 'PLAIN',
      backgroundPattern: note?.backgroundPattern ?? 'NONE',
      checkboxVariant: column?.checkboxVariant,
      completed: this.isNoteCompleted(note),
      compact: note?.compact,
      progress: note?.progress,
      dueLabel: note?.noteDate ?? note?.dueLabel,
      timeEstimate: note?.timeEstimate,
      tag: note?.tag,
      tagVariant: note?.tagVariant,
      assignees: note?.assignees,
      checklists: (note?.checklists ?? []).map((checklist: any) => ({
        id: checklist?.id ?? checklist?._id,
        title: checklist?.title,
        completedCount: checklist?.completedCount,
        totalCount: checklist?.totalCount,
        items: (checklist?.items ?? []).map((item: any) => ({
          id: item?.id ?? item?._id,
          title: item?.title,
          isCompleted: item?.isCompleted === true,
          updating: this.isChecklistItemUpdating(item?.id ?? item?._id)
        }))
      })),
      showDragHandle: true,
      showEditAction: true,
      layout: this.stickyNoteLayout(),
      font: this.stickyNoteFont(),
      fontSize: this.stickyNoteFontSize(),
      showMoveActions: true,
      canMoveBackward: this.canMoveBackward(note),
      canMoveForward: this.canMoveForward(note),
      actionsDisabled: this.movingNoteId() === (note?.id ?? note?._id),
      titleUpdating: this.isNoteTitleUpdating(note?.id ?? note?._id),
      descriptionUpdating: this.isNoteDescriptionUpdating(note?.id ?? note?._id)
    };
  }
  updateNoteTitle(change: any): void {
    const noteId = String(change?.noteId ?? '').trim();
    const nextTitle = String(change?.title ?? '').trim();
    if (!noteId ||
      !nextTitle ||
      this.isNoteTitleUpdating(noteId)) {
      return;
    }
    const note = this.stickyNotes().find(item => item.id === noteId);
    if (!note) {
      return;
    }
    const previousTitle = String(note.title ?? '').trim();
    if (previousTitle === nextTitle) {
      return;
    }
    // Optimistic UI: title changes immediately.
    this.stickyNotes.update(notes => notes.map(item => item.id === noteId
      ? { ...item, title: nextTitle }
      : item));
    this.setNoteTitleUpdating(noteId, true);
    this.stickyNoteApiService
      .update(noteId, { title: nextTitle })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const serverTitle = String((response as any)?.data?.title ?? nextTitle).trim();
          if (serverTitle && serverTitle !== nextTitle) {
            this.stickyNotes.update(notes => notes.map(item => item.id === noteId
              ? { ...item, title: serverTitle }
              : item));
          }
          this.setNoteTitleUpdating(noteId, false);
        },
        error: error => {
          console.error(error);
          this.stickyNotes.update(notes => notes.map(item => item.id === noteId
            ? { ...item, title: previousTitle }
            : item));
          this.setNoteTitleUpdating(noteId, false);
          this.toastService.error(this.errorMessage(error, 'Unable to rename note.'), {
            title: 'Title not updated',
            dedupeKey: `note-title-${noteId}`
          });
        }
      });
  }
  updateNoteDescription(change: any): void {
    const noteId = String(change?.noteId ?? '')
      .trim();
    const nextDescription = String(change?.description ?? '')
      .trim();
    if (!noteId ||
      this.isNoteDescriptionUpdating(noteId)) {
      return;
    }
    const note = this.stickyNotes()
      .find(item => item.id === noteId);
    if (!note) {
      return;
    }
    const previousDescription = String(note.description ?? '').trim();
    if (previousDescription ===
      nextDescription) {
      return;
    }
    // Optimistic UI.
    this.stickyNotes.update(notes => notes.map(item => item.id === noteId
      ? {
        ...item,
        description: nextDescription,
        compact: !nextDescription
      }
      : item));
    this.setNoteDescriptionUpdating(noteId, true);
    /*
     * Backend note text is stored in `content`.
     * The frontend maps it to `description`.
     */
    this.stickyNoteApiService
      .update(noteId, {
        content: nextDescription
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const serverDescription = String((response as any)
            ?.data?.content ??
            nextDescription).trim();
          this.stickyNotes.update(notes => notes.map(item => item.id === noteId
            ? {
              ...item,
              description: serverDescription,
              compact: !serverDescription
            }
            : item));
          this.setNoteDescriptionUpdating(noteId, false);
        },
        error: error => {
          console.error(error);
          this.stickyNotes.update(notes => notes.map(item => item.id === noteId
            ? {
              ...item,
              description: previousDescription,
              compact: !previousDescription
            }
            : item));
          this.setNoteDescriptionUpdating(noteId, false);
          this.toastService.error(this.errorMessage(error, 'Unable to update note description.'), {
            title: 'Description not updated',
            dedupeKey: `note-description-${noteId}`
          });
        }
      });
  }
  isChecklistItemUpdating(itemId: string): boolean {
    return this.updatingChecklistItemIds().includes(itemId);
  }
  updateChecklistItemStatus(noteId: string, itemId: string, checked: boolean): void {
    if (!noteId || !itemId || this.isChecklistItemUpdating(itemId))
      return;
    const note = this.stickyNotes().find(item => item.id === noteId);
    const checklistItem = note?.checklists
      ?.flatMap((checklist: any) => checklist.items ?? [])
      .find((item: any) => item.id === itemId);
    if (!checklistItem || checklistItem.isCompleted === checked)
      return;
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
          this.toastService.error(this.errorMessage(error, 'Unable to update checklist item.'), {
            title: 'Checklist not updated',
            dedupeKey: `checklist-item-${itemId}`
          });
        }
      });
  }
  requestTrashNote(note: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.trashingNoteId()) return;
    this.trashTarget.set(note);
  }
  closeTrashConfirm(): void {
    if (!this.trashingNoteId()) this.trashTarget.set(null);
  }
  confirmTrashNote(): void {
    const note = this.trashTarget();
    const noteId = String(note?.id ?? note?._id ?? '').trim();
    if (!noteId || this.trashingNoteId()) return;
    this.trashingNoteId.set(noteId);
    this.stickyNoteTrashApiService.moveToTrash(noteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.stickyNotes.update(notes => notes.filter(item => item.id !== noteId));
          this.trashingNoteId.set(null);
          this.trashTarget.set(null);
          this.toastService.success('Moved to Trash. You can restore this note for 60 days.', {
            title: 'Note safely moved',
            dedupeKey: `trash-note-${noteId}`
          });
        },
        error: error => {
          this.trashingNoteId.set(null);
          this.toastService.error(this.errorMessage(error, 'Unable to move note to Trash.'), {
            title: 'Note not moved',
            dedupeKey: `trash-note-${noteId}`
          });
        }
      });
  }
  requestWorkspaceEdit(): void { }
  requestFolderEdit(): void { }
  openFolderCreateModal(): void { }
  openColumnCreateModal(): void {
    if (!this.activeWorkspaceId() || !this.activeFolder() || this.boardLoading()) return;
    this.columnPanelId.set('');
    this.columnPanelColumn.set(null);
    this.columnPanelOpen.set(true);
  }
  requestColumnEdit(column: any): void {
    const id = String(column?.id ?? column?._id ?? '').trim();
    if (!id || this.boardLoading()) return;
    this.columnPanelId.set(id);
    this.columnPanelColumn.set(column);
    this.columnPanelOpen.set(true);
  }
  closeColumnPanel(): void {
    this.columnPanelOpen.set(false);
    this.columnPanelId.set('');
    this.columnPanelColumn.set(null);
  }
  onColumnSaved(_columnId: string): void {
    this.closeColumnPanel();
    this.loadBoard(true);
  }
  openNoteCreatePanel(columnId: string): void {
    if (!columnId || this.movingNoteId())
      return;
    this.notePanelMode.set('create');
    this.notePanelId.set(columnId);
    this.notePanelOpen.set(true);
  }
  openNoteEditPanel(note: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const noteId = note?.id ?? note?._id ?? '';
    if (!noteId || this.movingNoteId())
      return;
    this.notePanelMode.set('edit');
    this.notePanelId.set(noteId);
    this.notePanelOpen.set(true);
  }
  closeNotePanel(): void {
    this.notePanelOpen.set(false);
    this.notePanelId.set('');
  }
  onNoteSaved(_noteId: string): void {
    this.closeNotePanel();
    this.loadBoard();
  }
  private moveNote(note: any, targetColumnId: string, targetIndex: number): void {
    if (this.movingNoteId())
      return;
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
      return previous && (previous.columnId !== item.columnId ||
        previous.position !== item.position);
    });
    if (!updates.length)
      return;
    this.stickyNotes.set(this.sortNotes(nextNotes));
    this.movingNoteId.set(note.id);
    this.boardError.set(null);
    forkJoin(updates.map(item => this.stickyNoteApiService.update(item.id, {
      columnId: item.columnId,
      position: item.position
    })))
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
      this.stickyNoteColumnStore.clear();
      this.clearBoard();
      return;
    }
    const folderId = this.activeFolder() ?? this.workspaceFolderStore.defaultFolder()?.id ?? folders[0].id;
    this.workspaceFolderStore.select(folderId);
    this.loadBoard();
  }
  private loadBoard(forceColumns = false): void {
    this.boardError.set(null);
    this.getStickyNoteColumns(forceColumns);
    this.getNotesForToday();
  }
  private clearBoard(): void {
    this.closeNotePanel();
    this.closeColumnPanel();
    this.stickyNotes.set([]);
    this.boardError.set(null);
    this.loadingNotes.set(false);
    this.movingNoteId.set(null);
    this.updatingChecklistItemIds.set([]);
    this.updatingTitleIds.set([]);
    this.updatingDescriptionIds.set([]);
    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
  }

  private clearWorkspaceMembers(): void {
    this.workspaceMemberRequestVersion += 1;
    this.workspaceMembers.set([]);
    this.loadingWorkspaceMembers.set(false);
  }
  private workspaceMemberId(member: any): string {
    const user = member.user as unknown as Record<string, unknown> | undefined;
    return String(user?.['id'] ??
      user?.['_id'] ??
      member.id ??
      '').trim();
  }
  private workspaceMemberName(member: any): string {
    const displayName = String(member.user?.displayName ?? '').trim();
    const email = String(member.user?.email ?? '').trim();
    if (displayName)
      return displayName;
    if (email)
      return email.split('@')[0] || email;
    return 'Workspace member';
  }
  private workspaceMemberRole(member: any): string {
    return String(member.role?.name ??
      member.role?.code ??
      'Member').trim();
  }
  private workspaceMemberAvatar(member: any): string | null {
    const user = member.user as unknown as Record<string, unknown> | undefined;
    const profile = user?.['profile'] as Record<string, unknown> | undefined;
    const value = user?.['avatarUrl'] ??
      user?.['profileImage'] ??
      user?.['imageUrl'] ??
      profile?.['avatarUrl'] ??
      profile?.['profileImage'];
    return typeof value === 'string' && value.trim()
      ? value.trim()
      : null;
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
    const title = String(note?.title || '').trim() || 'Untitled note';
    const content = String(note?.content || '').trim();
    const checklists = this.mapChecklists(
      Array.isArray(note?.checklists)
        ? note.checklists
        : note?.checklist
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
      id: note?.id ?? note?._id,
      columnId: this.referenceId(note?.columnId),
      folderId: this.referenceId(note?.workspaceFolderId),
      columnName: this.referenceName(note?.columnId, 'Note'),
      folderName: this.referenceName(note?.workspaceFolderId, 'My Notes'),
      workspaceName: this.referenceName(note?.workspaceId, 'Workspace'),
      creatorEmail: String(note?.createdBy?.email ?? '').trim(),
      updatedByEmail: String(note?.updatedBy?.email ?? '').trim(),
      title,
      content,
      description: content && content !== title ? content : '',
      color: note?.color ?? 'WHITE',
      shape: note?.shape ?? 'SQUARE',
      variant: note?.variant ?? 'PLAIN',
      backgroundPattern: note?.backgroundPattern ?? 'NONE',
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
    this.stickyNotes.update(notes => notes.map(note => {
      if (note.id !== noteId || !note.checklists?.length)
        return note;
      const checklists = note.checklists.map((checklist: any) => {
        const items = (checklist.items ?? []).map((item: any) => item.id === itemId ? { ...item, isCompleted } : item);
        return {
          ...checklist,
          items,
          totalCount: items.length,
          completedCount: items.filter((item: any) => item.isCompleted).length
        };
      });
      const totalCount = checklists.reduce((total: number, checklist: any) => total + checklist.totalCount, 0);
      const completedCount = checklists.reduce((total: number, checklist: any) => total + checklist.completedCount, 0);
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
    }));
  }
  private setNoteTitleUpdating(noteId: string, updating: boolean): void {
    this.updatingTitleIds.update(ids => {
      if (updating) {
        return ids.includes(noteId)
          ? ids
          : [...ids, noteId];
      }
      return ids.filter(id => id !== noteId);
    });
  }
  private setNoteDescriptionUpdating(noteId: string, updating: boolean): void {
    this.updatingDescriptionIds.update(ids => {
      if (updating) {
        return ids.includes(noteId)
          ? ids
          : [...ids, noteId];
      }
      return ids.filter(id => id !== noteId);
    });
  }
  private setChecklistItemUpdating(itemId: string, updating: boolean): void {
    this.updatingChecklistItemIds.update(ids => {
      if (updating)
        return ids.includes(itemId) ? ids : [...ids, itemId];
      return ids.filter(id => id !== itemId);
    });
  }
  private referenceId(value: any): string {
    if (!value)
      return '';
    return typeof value === 'string' ? value : value.id ?? value._id ?? '';
  }
  private referenceName(value: any, fallback = ''): string {
    if (!value || typeof value !== 'object')
      return fallback;
    return String(value.name ?? value.title ?? fallback).trim() || fallback;
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
      if (value !== '' && value !== null && value !== undefined)
        params[key] = String(value);
    });
    return params;
  }
  private isStickyNoteFont(value: any): boolean {
    const font = String(value ?? '').trim();
    return this.stickyNoteFontOptions.some(option => option.value === font);
  }
  private isStickyNoteFontSize(value: any): boolean {
    const size = Number(value);
    return this.stickyNoteFontSizeOptions.some(option => Number(option.value) === size);
  }
  private isStickyNoteLayout(value: any): boolean {
    const layout = String(value ?? '').trim();
    return this.stickyNoteLayoutOptions.some(option => option.value === layout);
  }
  private errorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }
}
