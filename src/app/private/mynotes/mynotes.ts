import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideArchive,
  LucideClock3,
  LucideColumns3,
  LucideFolderOpen,
  LucideLayoutGrid,
  LucideList,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideStickyNote,
  LucideTrash2,
  LucideX
} from '@lucide/angular';

import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Input as AppInput, type InputValue } from '../../shared/components/input/input';
import { Label } from '../../shared/components/label/label';
import { Loader } from '../../shared/components/loader/loader';
import { Select, type SelectOption, type SelectValue } from '../../shared/components/select/select';
import { Tabs, type TabItem, type TabValue } from '../../shared/components/tabs/tabs';
import { StickyCard, type CardVariant } from '../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../shared/components/toast/services/toast.service';

import type {
  MyWorkspaceQuery,
  PaginatedApiResponse as WorkspacePaginatedApiResponse,
  Workspace as WorkspaceModel
} from '../workspace/models/workspace.models';
import { WorkspaceApiService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';

import type {
  PaginatedApiResponse as FolderPaginatedApiResponse,
  WorkspaceFolder,
  WorkspaceFolderQuery
} from '../workspacefolders/models/workspace-folder.models';
import { WorkspaceFolderApiService } from '../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';

import type { StickyNote, StickyNoteColumn } from './models/mynotes.interface';
import { AddEditMyNotesModal } from './modals/add-edit-my-notes-modal/add-edit-my-notes-modal';
import { StickyNoteApiService } from './services/sticky-notes.service';
import { StickyNoteColumnApiService } from './services/sticky-note-column.service';

type NoteTab = 'all' | 'active' | 'archived';
type NoteSort = 'updatedAt' | 'createdAt' | 'title';
type NoteView = 'grid' | 'table';
type NoteModalMode = 'create' | 'edit';
type UnknownRecord = Record<string, unknown>;

@Component({
  standalone: true,
  selector: 'app-mynotes',
  imports: [
    FormsModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    AddEditMyNotesModal,
    Badge,
    Button,
    Label,
    Loader,
    Select,
    StickyCard,
    Tabs
  ],
  templateUrl: './mynotes.html',
  styleUrl: './mynotes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyNotes implements OnInit, OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly workspaceApi = inject(WorkspaceApiService);
  private readonly folderApi = inject(WorkspaceFolderApiService);
  private readonly stickyNoteApi = inject(StickyNoteApiService);
  private readonly stickyNoteColumnApi = inject(StickyNoteColumnApiService);
  private readonly toastService = inject(ToastService);

  @Input() workspaceId = '';
  @Input() workspaceFolderId = '';

  @Output() readonly workspaceChange = new EventEmitter<string>();
  @Output() readonly workspaceFolderChange = new EventEmitter<string>();
  @Output() readonly noteCreated = new EventEmitter<StickyNote>();
  @Output() readonly noteChanged = new EventEmitter<StickyNote>();

  private initialized = false;
  private workspaceRequestVersion = 0;
  private folderRequestVersion = 0;
  private noteRequestVersion = 0;

  readonly LucideArchive = LucideArchive;
  readonly LucideClock3 = LucideClock3;
  readonly LucideColumns3 = LucideColumns3;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideLayoutGrid = LucideLayoutGrid;
  readonly LucideList = LucideList;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideStickyNote = LucideStickyNote;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;

  /* Shared workspace/folder state — same source used by Today. */
  readonly workspaces = this.workspaceStore.workspaces;
  readonly loadingWorkspaces = this.workspaceStore.loading;
  readonly workspaceError = this.workspaceStore.error;
  readonly selectedWorkspaceId = computed(() => this.workspaceStore.selectedId() ?? '');

  readonly folders = this.workspaceFolderStore.activeFolders;
  readonly loadingFolders = this.workspaceFolderStore.loading;
  readonly folderError = this.workspaceFolderStore.error;
  readonly selectedFolderId = computed(() => this.workspaceFolderStore.selectedId() ?? '');

  readonly columns = signal<readonly StickyNoteColumn[]>([]);
  readonly notes = signal<readonly StickyNote[]>([]);
  readonly loadingNotes = signal(false);
  readonly notesError = signal<string | null>(null);

  readonly activeTab = signal<NoteTab>('all');
  readonly view = signal<NoteView>('grid');
  readonly searchTerm = signal('');
  readonly sortBy = signal<NoteSort>('updatedAt');
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  /* Same note modal contract used by Today. */
  readonly noteModalOpen = signal(false);
  readonly noteModalMode = signal<NoteModalMode>('create');
  readonly noteModalId = signal('');

  readonly deleteTarget = signal<StickyNote | null>(null);
  readonly deleting = signal(false);

  readonly workspaceOptions = computed<readonly SelectOption[]>(() =>
    this.workspaces()
      .map(workspace => ({
        label: this.workspaceName(workspace),
        value: this.workspaceRecordId(workspace),
        icon: LucidePanelsTopLeft
      }))
      .filter(option => !!option.value)
  );

  readonly folderOptions = computed<readonly SelectOption[]>(() =>
    this.folders()
      .map(folder => ({
        label: this.folderName(folder),
        value: this.folderId(folder),
        icon: LucideFolderOpen
      }))
      .filter(option => !!option.value)
  );

  readonly sortOptions: readonly SelectOption[] = [
    { label: 'Recently updated', value: 'updatedAt' },
    { label: 'Recently created', value: 'createdAt' },
    { label: 'Title A–Z', value: 'title' }
  ];

  readonly selectedWorkspaceLabel = computed(() => {
    const id = this.selectedWorkspaceId();
    const workspace = this.workspaces().find(item => this.workspaceRecordId(item) === id);
    return workspace ? this.workspaceName(workspace) : 'Select workspace';
  });

  readonly selectedFolderLabel = computed(() => {
    const id = this.selectedFolderId();
    const folder = this.folders().find(item => this.folderId(item) === id);
    return folder ? this.folderName(folder) : 'Select folder';
  });

  readonly totalCount = computed(() => this.notes().filter(note => !this.isDeleted(note)).length);
  readonly activeCount = computed(() => this.notes().filter(note => this.isActive(note)).length);
  readonly archivedCount = computed(() => this.notes().filter(note => this.isArchived(note)).length);

  readonly noteTabs = computed<readonly TabItem[]>(() => [
    { value: 'all', label: 'All', count: this.totalCount(), icon: LucideStickyNote, ariaLabel: 'All notes' },
    { value: 'active', label: 'Active', count: this.activeCount(), icon: LucideStickyNote, ariaLabel: 'Active notes' },
    { value: 'archived', label: 'Archived', count: this.archivedCount(), icon: LucideArchive, ariaLabel: 'Archived notes' }
  ]);

  readonly viewTabs: readonly TabItem[] = [
    { value: 'grid', label: 'Grid', icon: LucideLayoutGrid, ariaLabel: 'Grid view' },
    { value: 'table', label: 'Table', icon: LucideList, ariaLabel: 'Table view' }
  ];

  readonly visibleNotes = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    return [...this.notes()]
      .filter(note => {
        if (this.isDeleted(note)) return false;
        if (tab === 'active' && !this.isActive(note)) return false;
        if (tab === 'archived' && !this.isArchived(note)) return false;
        if (!search) return true;

        return [this.noteTitle(note), this.noteContent(note), this.noteColumnName(note)]
          .some(value => value.toLowerCase().includes(search));
      })
      .sort((first, second) => {
        if (sort === 'title') {
          return this.noteTitle(first).localeCompare(this.noteTitle(second), undefined, { sensitivity: 'base' });
        }
        return this.noteTimestamp(second, sort) - this.noteTimestamp(first, sort);
      });
  });

  readonly canCreateNote = computed(() =>
    !!this.selectedWorkspaceId() &&
    !!this.selectedFolderId() &&
    this.columns().length > 0 &&
    !this.loadingNotes()
  );

  ngOnInit(): void {
    this.initialized = true;
    this.loadWorkspaces();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;

    if (changes['workspaceId'] && this.workspaceId.trim()) {
      const requestedWorkspaceId = this.workspaceId.trim();
      const exists = this.workspaces().some(
        workspace => this.workspaceRecordId(workspace) === requestedWorkspaceId
      );

      if (exists && requestedWorkspaceId !== this.selectedWorkspaceId()) {
        this.selectWorkspace(requestedWorkspaceId, false);
        return;
      }
    }

    if (changes['workspaceFolderId'] && this.workspaceFolderId.trim()) {
      const requestedFolderId = this.workspaceFolderId.trim();
      const exists = this.folders().some(folder => this.folderId(folder) === requestedFolderId);

      if (exists && requestedFolderId !== this.selectedFolderId()) {
        this.selectFolder(requestedFolderId, false);
      }
    }
  }

  loadWorkspaces(force = false): void {
    if (!force && this.workspaceStore.initialized() && this.workspaces().length) {
      this.selectInitialWorkspace();
      return;
    }

    const requestVersion = ++this.workspaceRequestVersion;
    this.workspaceStore.setLoading(true);

    const query: MyWorkspaceQuery = { page: 1, limit: 100 };

    this.workspaceApi
      .getMyWorkspaces(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (requestVersion !== this.workspaceRequestVersion) return;

          const workspaces = this.extractWorkspaces(response);
          this.workspaceStore.setWorkspaces(workspaces, response.pagination ?? null);
          this.selectInitialWorkspace();
        },
        error: error => {
          if (requestVersion !== this.workspaceRequestVersion) return;

          const message = this.errorMessage(error, 'Unable to load your workspaces.');
          this.workspaceStore.setError(message);
          this.workspaceFolderStore.clear();
          this.clearNotesState();

          this.toastService.error(message, {
            title: 'Could not load workspaces',
            dedupeKey: 'notes-workspaces-load-error'
          });
        }
      });
  }

  onWorkspaceChange(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string' || !value.trim()) return;
    this.selectWorkspace(value.trim(), true);
  }

  loadFolders(force = false): void {
    const workspaceId = this.selectedWorkspaceId();

    if (!workspaceId) {
      this.workspaceFolderStore.clear();
      this.clearNotesState();
      return;
    }

    if (
      !force &&
      this.workspaceFolderStore.initialized() &&
      this.workspaceFolderStore.workspaceId() === workspaceId
    ) {
      this.selectInitialFolder();
      return;
    }

    const requestVersion = ++this.folderRequestVersion;
    this.workspaceFolderStore.resetForWorkspace(workspaceId);
    this.workspaceFolderStore.setLoading(true);

    const query: WorkspaceFolderQuery = {
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      sortBy: 'position',
      sortOrder: 'asc'
    };

    this.folderApi
      .getByWorkspace(workspaceId, query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (requestVersion !== this.folderRequestVersion || this.selectedWorkspaceId() !== workspaceId) return;

          const folders = this.extractFolders(response);
          this.workspaceFolderStore.setFolders(workspaceId, folders, response.pagination ?? null);
          this.selectInitialFolder();
        },
        error: error => {
          if (requestVersion !== this.folderRequestVersion || this.selectedWorkspaceId() !== workspaceId) return;

          const message = this.errorMessage(error, 'Unable to load folders for this workspace.');
          this.workspaceFolderStore.setError(message);
          this.clearNotesState();

          this.toastService.error(message, {
            title: 'Could not load folders',
            dedupeKey: 'notes-folders-load-error'
          });
        }
      });
  }

  onFolderChange(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string' || !value.trim()) return;
    this.selectFolder(value.trim(), true);
  }

  loadSelectedFolder(savedId = '', created = false): void {
    const workspaceId = this.selectedWorkspaceId();
    const workspaceFolderId = this.selectedFolderId();

    if (!workspaceId || !workspaceFolderId) {
      this.clearNotesState();
      return;
    }

    const requestVersion = ++this.noteRequestVersion;
    this.loadingNotes.set(true);
    this.notesError.set(null);

    forkJoin({
      columns: this.stickyNoteColumnApi.getByWorkspaceFolder(workspaceId, workspaceFolderId),
      notes: this.stickyNoteApi.getByWorkspaceFolder(workspaceId, workspaceFolderId, { page: 1, limit: 100 })
    })
      .pipe(
        finalize(() => {
          if (requestVersion === this.noteRequestVersion) this.loadingNotes.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ columns, notes }) => {
          if (
            requestVersion !== this.noteRequestVersion ||
            this.selectedWorkspaceId() !== workspaceId ||
            this.selectedFolderId() !== workspaceFolderId
          ) return;

          const nextColumns = [...(columns.data ?? [])]
            .sort((first, second) => first.position - second.position);
          const nextNotes = [...(notes.data ?? [])];

          this.columns.set(nextColumns);
          this.notes.set(nextNotes);

          if (!savedId) return;

          const savedNote = nextNotes.find(note => this.noteId(note) === savedId);
          if (!savedNote) return;

          if (created) this.noteCreated.emit(savedNote);
          else this.noteChanged.emit(savedNote);
        },
        error: error => {
          if (requestVersion !== this.noteRequestVersion) return;

          this.columns.set([]);
          this.notes.set([]);

          const message = this.errorMessage(error, 'Unable to load notes for this folder.');
          this.notesError.set(message);

          this.toastService.error(message, {
            title: 'Could not load notes',
            dedupeKey: 'notes-list-load-error'
          });
        }
      });
  }

  refresh(): void {
    if (!this.selectedWorkspaceId()) {
      this.loadWorkspaces(true);
      return;
    }

    this.loadFolders(true);
  }

  setNoteTab(value: TabValue): void {
    if (value === 'all' || value === 'active' || value === 'archived') this.activeTab.set(value);
  }

  setNoteView(value: TabValue): void {
    if (value === 'grid' || value === 'table') this.view.set(value);
  }

  updateSearch(value: InputValue): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(value: SelectValue | SelectValue[] | null): void {
    if (Array.isArray(value) || value === null) return;
    if (value === 'updatedAt' || value === 'createdAt' || value === 'title') this.sortBy.set(value);
  }

  openCreateEditor(): void {
    if (!this.canCreateNote()) {
      if (!this.selectedFolderId()) {
        this.toastService.error('Select a folder before creating a note.', {
          title: 'Folder required',
          dedupeKey: 'note-create-folder-required'
        });
      } else if (this.columns().length === 0) {
        this.toastService.error('This folder does not have a note column yet.', {
          title: 'Column required',
          dedupeKey: 'note-create-column-required'
        });
      }
      return;
    }

    const defaultColumn = this.columns().find(column => column.type !== 'COMPLETED') ?? this.columns()[0];
    const columnId = defaultColumn?._id ?? '';
    if (!columnId) return;

    this.noteModalMode.set('create');
    this.noteModalId.set(columnId);
    this.noteModalOpen.set(true);
  }

  openEditEditor(note: StickyNote, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const id = this.noteId(note);
    if (!id || this.isBusy(note)) return;

    this.noteModalMode.set('edit');
    this.noteModalId.set(id);
    this.noteModalOpen.set(true);
  }

  closeNoteModal(): void {
    this.noteModalOpen.set(false);
    this.noteModalId.set('');
  }

  onNoteSaved(noteId: string): void {
    const created = this.noteModalMode() === 'create';
    this.closeNoteModal();
    this.loadSelectedFolder(noteId, created);
  }

  archiveNote(note: StickyNote): void {
    const id = this.noteId(note);
    if (!id || this.isBusy(note)) return;

    this.setBusy(id, true);

    this.stickyNoteApi
      .archive(id)
      .pipe(
        finalize(() => this.setBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.replaceNote(response.data);
          this.noteChanged.emit(response.data);
          this.toastService.success('The note was archived.', {
            title: 'Note archived',
            dedupeKey: `note-archived-${id}`
          });
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to archive the note.');
          this.toastService.error(message, {
            title: 'Could not archive note',
            dedupeKey: `note-archive-error-${id}`
          });
        }
      });
  }

  activateNote(note: StickyNote): void {
    const id = this.noteId(note);
    if (!id || this.isBusy(note)) return;

    this.setBusy(id, true);

    this.stickyNoteApi
      .updateStatus(id, 'ACTIVE')
      .pipe(
        finalize(() => this.setBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.replaceNote(response.data);
          this.noteChanged.emit(response.data);
          this.toastService.success('The note is active again.', {
            title: 'Note restored',
            dedupeKey: `note-restored-${id}`
          });
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to restore the note.');
          this.toastService.error(message, {
            title: 'Could not restore note',
            dedupeKey: `note-restore-error-${id}`
          });
        }
      });
  }

  requestDelete(note: StickyNote, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.isBusy(note)) this.deleteTarget.set(note);
  }

  closeDeleteDialog(force = false): void {
    if (this.deleting() && !force) return;
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const note = this.deleteTarget();
    if (!note || this.deleting()) return;

    const id = this.noteId(note);
    if (!id) return;

    this.deleting.set(true);
    this.setBusy(id, true);

    this.stickyNoteApi
      .delete(id)
      .pipe(
        finalize(() => {
          this.deleting.set(false);
          this.setBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.notes.update(notes => notes.filter(item => this.noteId(item) !== id));
          this.deleteTarget.set(null);
          this.toastService.success('The note was moved to trash.', {
            title: 'Note removed',
            dedupeKey: `note-deleted-${id}`
          });
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to delete the note.');
          this.toastService.error(message, {
            title: 'Could not delete note',
            dedupeKey: `note-delete-error-${id}`
          });
        }
      });
  }

  isBusy(note: StickyNote): boolean {
    return this.busyIds().has(this.noteId(note));
  }

  noteId(note: StickyNote): string {
    return note._id ?? '';
  }

  noteTitle(note: StickyNote): string {
    return note.title?.trim() || 'Untitled note';
  }

  noteContent(note: StickyNote): string {
    const content = note.content?.trim() ?? '';
    const title = note.title?.trim() ?? '';
    return content === title ? '' : content;
  }

  notePreview(note: StickyNote): string {
    return this.noteContent(note) || 'A quick thought pinned for later.';
  }

  noteColumnId(note: StickyNote): string {
    return this.getReferenceId(note.columnId);
  }

  noteColumnName(note: StickyNote): string {
    if (note.columnId && typeof note.columnId === 'object') {
      const populatedName = (note.columnId as unknown as UnknownRecord)['name'];
      if (typeof populatedName === 'string' && populatedName.trim()) return populatedName;
    }

    const id = this.noteColumnId(note);
    return this.columns().find(column => column._id === id)?.name ?? 'Notes';
  }

  noteVariant(note: StickyNote): CardVariant {
    switch (note.color) {
      case 'PINK': return 'notePink';
      case 'BLUE': return 'noteBlue';
      case 'GREEN': return 'noteGreen';
      case 'ORANGE': return 'noteOrange';
      case 'PURPLE': return 'notePurple';
      case 'RED': return 'noteRed';
      case 'BROWN': return 'noteBrown';
      case 'YELLOW':
      default: return 'noteYellow';
    }
  }

  noteColorKey(note: StickyNote): string {
    return String(note.color ?? 'YELLOW').toLowerCase();
  }

  noteColorLabel(note: StickyNote): string {
    const value = String(note.color ?? 'YELLOW').trim().toLowerCase();
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Yellow';
  }

  noteUpdatedLabel(note: StickyNote): string {
    const timestamp = this.noteTimestamp(note, 'updatedAt');
    if (!timestamp) return 'Recently';

    const date = new Date(timestamp);
    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  isActive(note: StickyNote): boolean {
    return String(note.status ?? '').toUpperCase() === 'ACTIVE';
  }

  isArchived(note: StickyNote): boolean {
    return String(note.status ?? '').toUpperCase() === 'ARCHIVED';
  }

  isDeleted(note: StickyNote): boolean {
    return String(note.status ?? '').toUpperCase() === 'DELETED';
  }

  folderId(folder: WorkspaceFolder | undefined): string {
    if (!folder) return '';
    const record = folder as unknown as UnknownRecord;
    return String(record['id'] ?? record['_id'] ?? '');
  }

  folderName(folder: WorkspaceFolder): string {
    return folder.name?.trim() || 'Untitled folder';
  }

  private selectWorkspace(id: string, emitChange: boolean): void {
    if (!id) return;

    const changed = id !== this.selectedWorkspaceId();
    this.workspaceStore.select(id);

    if (changed) {
      this.workspaceFolderStore.clear();
      this.clearNotesState();
    }

    if (emitChange && changed) this.workspaceChange.emit(id);
    this.loadFolders();
  }

  private selectFolder(id: string, emitChange: boolean): void {
    if (!id) return;

    const changed = id !== this.selectedFolderId();
    this.workspaceFolderStore.select(id);
    this.clearNotesState(false);
    this.activeTab.set('all');
    this.searchTerm.set('');

    if (emitChange && changed) this.workspaceFolderChange.emit(id);
    this.loadSelectedFolder();
  }

  private selectInitialWorkspace(): void {
    const workspaces = this.workspaces();

    if (!workspaces.length) {
      this.workspaceStore.select(null);
      this.workspaceFolderStore.clear();
      this.clearNotesState();
      return;
    }

    const requestedId = this.workspaceId.trim();
    const currentId = this.selectedWorkspaceId();
    const exists = (id: string) => !!id && workspaces.some(item => this.workspaceRecordId(item) === id);
    const nextId = exists(requestedId) ? requestedId : exists(currentId) ? currentId : this.workspaceRecordId(workspaces[0]);

    this.selectWorkspace(nextId, false);
  }

  private selectInitialFolder(): void {
    const folders = this.folders();

    if (!folders.length) {
      this.workspaceFolderStore.select(null);
      this.clearNotesState();
      return;
    }

    const requestedId = this.workspaceFolderId.trim();
    const currentId = this.selectedFolderId();
    const exists = (id: string) => !!id && folders.some(item => this.folderId(item) === id);
    const defaultFolder = folders.find(folder => Boolean(folder.isDefault));
    const nextId = exists(requestedId)
      ? requestedId
      : exists(currentId)
        ? currentId
        : this.folderId(defaultFolder ?? folders[0]);

    this.selectFolder(nextId, false);
  }

  private replaceNote(updated: StickyNote): void {
    const id = this.noteId(updated);
    this.notes.update(notes => notes.map(note => this.noteId(note) === id ? updated : note));
  }

  private setBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());
    busy ? next.add(id) : next.delete(id);
    this.busyIds.set(next);
  }

  private clearNotesState(closeOverlays = true): void {
    ++this.noteRequestVersion;
    this.columns.set([]);
    this.notes.set([]);
    this.loadingNotes.set(false);
    this.notesError.set(null);
    this.busyIds.set(new Set());

    if (closeOverlays) {
      this.closeNoteModal();
      this.closeDeleteDialog(true);
    }
  }

  private workspaceRecordId(workspace: WorkspaceModel | undefined): string {
    if (!workspace) return '';
    const record = workspace as unknown as UnknownRecord;
    return String(record['id'] ?? record['_id'] ?? '');
  }

  private workspaceName(workspace: WorkspaceModel): string {
    return workspace.name?.trim() || 'Untitled workspace';
  }

  private getReferenceId(value: string | { _id: string } | null | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value._id;
  }

  private noteTimestamp(note: StickyNote, field: 'updatedAt' | 'createdAt'): number {
    const value = (note as unknown as UnknownRecord)[field];
    if (typeof value !== 'string' && !(value instanceof Date)) return 0;

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private extractWorkspaces(
    response: WorkspacePaginatedApiResponse<WorkspaceModel>
  ): readonly WorkspaceModel[] {
    const data = response.data as unknown;
    if (Array.isArray(data)) return data as WorkspaceModel[];
    if (!data || typeof data !== 'object') return [];

    const record = data as UnknownRecord;
    const candidates = [record['items'], record['workspaces'], record['docs'], record['results']];
    return candidates.find(Array.isArray) as WorkspaceModel[] | undefined ?? [];
  }

  private extractFolders(
    response: FolderPaginatedApiResponse<WorkspaceFolder>
  ): readonly WorkspaceFolder[] {
    const data = response.data as unknown;
    if (Array.isArray(data)) return data as WorkspaceFolder[];
    if (!data || typeof data !== 'object') return [];

    const record = data as UnknownRecord;
    const candidates = [record['items'], record['folders'], record['workspaceFolders'], record['docs'], record['results']];
    return candidates.find(Array.isArray) as WorkspaceFolder[] | undefined ?? [];
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback;

    const record = error as UnknownRecord;
    const nested = record['error'];

    if (nested && typeof nested === 'object') {
      const message = (nested as UnknownRecord)['message'];
      if (typeof message === 'string' && message.trim()) return message;
    }

    const message = record['message'];
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}