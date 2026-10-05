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
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideAArrowUp,
  LucideArchive,
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideChevronDown,
  LucideChevronRight,
  LucideClock3,
  LucideClockAlert,
  LucideColumns3,
  LucideCopy,
  LucideFolderOpen,
  LucideGrid2X2,
  LucideLayoutGrid,
  LucideList,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideStar,
  LucideStarOff,
  LucideStickyNote,
  LucideTrash2,
  LucideType,
  LucideX
} from '@lucide/angular';
import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { BulkActionPanel } from '../../shared/components/bulk-action-panel/bulk-action-panel';
import { Button } from '../../shared/components/button/button';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { Input as AppInput } from '../../shared/components/input/input';
import { Label } from '../../shared/components/label/label';
import { Loader } from '../../shared/components/loader/loader';
import { Select } from '../../shared/components/select/select';
import { Tabs } from '../../shared/components/tabs/tabs';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { APP_ROUTES, routeCommands } from '../../shared/constants/route.constants';
import { STICKY_NOTE_MESSAGES } from './messages/sticky-note.messages';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceFolderService } from '../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { StickyNotesFavouriteService } from '../sticky-notes-favourites/services/sticky-notes-favourite.service';
import {
  buildStatusTabs,
  STICKY_NOTE_FONT_OPTIONS,
  STICKY_NOTE_FONT_SIZE_OPTIONS,
  STICKY_NOTE_LAYOUT_OPTIONS,
  USER_PREFERENCE_KEYS,
  VIEW,
  VIEW_TABS,
  View
} from '../../shared/constants/common.constants';
import {
  entityNameOf,
  extractErrorMessage,
  extractList,
  idOf,
  sortItemsByPosition
} from '../../shared/functions/common.function';
import {
  compareNotesByRank,
  getNoteColorAccent,
  getNoteColumnEyebrow,
  getNoteContent,
  getNotePreview,
  getNoteTimestamp,
  getNoteTitle,
  getNeighborNoteIds,
  isNoteActive,
  isNoteArchived,
  isNoteDeleted,
  mapStickyNoteChecklists,
  NOTE_SORT_OPTIONS,
  sortNotesByRank,
  toColorCssClass
} from '../../shared/functions/sticky-note.function';
import { UserDatePipe } from '../../shared/pipes/user-date.pipe';
import { UserTimePipe } from '../../shared/pipes/user-time.pipe';
import { UserDateTimeFormatterService } from '../../shared/services/user-date-time-formatter.service';
import { AddEditNoteSidePanel } from './add-edit-note-side-panel/add-edit-note-side-panel';
import { OverdueTopbar } from './overdue-topbar/overdue-topbar';
import { OverdueNotesPanel } from './overdue-notes-panel/overdue-notes-panel';
import { OverdueNotesStore } from './services/overdue-notes.store';
import { StickyNote as StickyNoteCardComponent } from './sticky-note/sticky-note';
import { StickyNoteApiService } from './services/sticky-notes.service';
import { StickyNoteColumnApiService } from './services/sticky-note-column.service';
import { StickyNoteChecklistItemApiService } from './services/sticky-note-checklist-item.service';

@Component({
  standalone: true,
  selector: 'app-mynotes',
  providers: [OverdueNotesStore],
  imports: [
    FormsModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    AddEditNoteSidePanel,
    OverdueTopbar,
    OverdueNotesPanel,
    Badge,
    BulkActionPanel,
    Button,
    Checkbox,
    Label,
    Loader,
    Select,
    StickyCard,
    StickyNoteCardComponent,
    Tabs,
    UserDatePipe,
    UserTimePipe
  ],
  templateUrl: './mynotes.html',
  styleUrl: './mynotes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyNotes implements OnInit, OnChanges {
  readonly overdue = inject(OverdueNotesStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly folderApi = inject(WorkspaceFolderService);
  private readonly stickyNoteApi = inject(StickyNoteApiService);
  private readonly stickyNoteColumnApi = inject(StickyNoteColumnApiService);
  private readonly stickyNoteChecklistItemApi = inject(StickyNoteChecklistItemApiService);
  readonly favoriteApi = inject(StickyNotesFavouriteService);
  private readonly toastService = inject(ToastService);
  private readonly dateTimeFormatter = inject(UserDateTimeFormatterService);

  @Input()
  workspaceId = '';
  @Input()
  workspaceFolderId = '';
  @Output()
  readonly workspaceChange = new EventEmitter<string>();
  @Output()
  readonly workspaceFolderChange = new EventEmitter<string>();
  @Output()
  readonly noteCreated = new EventEmitter<any>();
  @Output()
  readonly noteChanged = new EventEmitter<any>();

  private initialized = false;
  private workspaceRequestVersion = 0;
  private folderRequestVersion = 0;
  private noteRequestVersion = 0;

  readonly LucideAArrowUp = LucideAArrowUp;
  readonly LucideArchive = LucideArchive;
  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucideClock3 = LucideClock3;
  readonly LucideClockAlert = LucideClockAlert;
  readonly LucideColumns3 = LucideColumns3;
  readonly LucideCopy = LucideCopy;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideLayoutGrid = LucideLayoutGrid;
  readonly LucideList = LucideList;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideStar = LucideStar;
  readonly LucideStarOff = LucideStarOff;
  readonly LucideStickyNote = LucideStickyNote;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideType = LucideType;
  readonly LucideX = LucideX;

  /* Typography and layout preferences matching Today */
  readonly stickyNoteLayoutOptions: any[] = STICKY_NOTE_LAYOUT_OPTIONS;
  readonly stickyNoteFontOptions: any[] = STICKY_NOTE_FONT_OPTIONS.map(option => ({
    ...option,
    icon: LucideType
  }));
  readonly stickyNoteFontSizeOptions: any[] = STICKY_NOTE_FONT_SIZE_OPTIONS.map(option => ({
    ...option,
    icon: LucideAArrowUp
  }));

  readonly stickyNoteLayout = this.userPreferenceStore.stickyNoteLayout;
  readonly stickyNoteFont = this.userPreferenceStore.stickyNoteFont;
  readonly stickyNoteFontSize = this.userPreferenceStore.stickyNoteFontSize;

  /* Shared workspace/folder state — same source used by Today */
  readonly workspaces = this.workspaceStore.workspaces;
  readonly loadingWorkspaces = this.workspaceStore.loading;
  readonly workspaceError = this.workspaceStore.error;
  readonly selectedWorkspaceId = computed(() => this.workspaceStore.selectedId() ?? '');
  readonly folders = this.workspaceFolderStore.activeFolders;
  readonly loadingFolders = this.workspaceFolderStore.loading;
  readonly folderError = this.workspaceFolderStore.error;
  readonly selectedFolderId = computed(() => this.workspaceFolderStore.selectedId() ?? '');
  readonly columns = signal<readonly any[]>([]);
  readonly notes = signal<readonly any[]>([]);
  readonly loadingNotes = signal(false);
  readonly notesError = signal<string | null>(null);
  readonly activeTab = signal<any>('all');
  readonly view = signal<'grid' | 'table' | 'list'>('grid');
  readonly searchTerm = signal('');
  readonly sortBy = signal<any>('updatedAt');
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  /* Selection, grouping and bulk actions matching Workspace */
  readonly collapsedGroups = signal<Set<string>>(new Set());
  readonly selectedNoteIds = signal<Set<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedNoteIds().size);
  readonly copiedNoteIds = signal<Set<string>>(new Set());

  /* Drag-and-drop state */
  readonly draggedNoteId = signal<string | null>(null);
  readonly dropTargetIndex = signal<number | null>(null);

  /* One editor contract for create and edit side-panel flows */
  readonly notePanelOpen = signal(false);
  readonly notePanelMode = signal<any>('create');
  readonly notePanelId = signal('');
  readonly deleteTarget = signal<any>(null);
  readonly deleting = signal(false);

  readonly workspaceOptions = computed<readonly any[]>(() => this.workspaces()
    .map(workspace => ({
      label: entityNameOf(workspace, 'Untitled workspace'),
      value: idOf(workspace),
      icon: LucidePanelsTopLeft
    }))
    .filter(option => !!option.value));

  readonly folderOptions = computed<readonly any[]>(() => this.folders()
    .map(folder => ({
      label: entityNameOf(folder, 'Untitled folder'),
      value: idOf(folder),
      icon: LucideFolderOpen
    }))
    .filter(option => !!option.value));

  /** Sort options from shared base — same set used by Today */
  readonly sortOptions: readonly any[] = NOTE_SORT_OPTIONS;

  readonly viewTabs = VIEW_TABS;

  readonly selectedFolderLabel = computed(() => {
    const id = this.selectedFolderId();
    const folder = this.folders().find(item => idOf(item) === id);
    return folder ? entityNameOf(folder, 'Untitled folder') : 'Select folder';
  });

  readonly totalCount = computed(() => this.notes().filter(note => !isNoteDeleted(note)).length);
  readonly activeCount = computed(() => this.notes().filter(note => isNoteActive(note)).length);
  readonly archivedCount = computed(() => this.notes().filter(note => isNoteArchived(note)).length);

  readonly noteTabs = computed<readonly any[]>(() =>
    buildStatusTabs({
      all: this.totalCount(),
      active: this.activeCount(),
      archived: this.archivedCount()
    })
  );

  readonly visibleNotes = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();
    return [...this.notes()]
      .filter(note => {
        if (isNoteDeleted(note)) return false;
        if (tab === 'active'   && !isNoteActive(note))   return false;
        if (tab === 'archived' && !isNoteArchived(note)) return false;
        if (!search) return true;
        return [this.noteTitle(note), this.noteContent(note), this.noteColumnName(note), this.noteKey(note)]
          .some(value => value.toLowerCase().includes(search));
      })
      .sort((first, second) => {
        if (sort === 'title' || sort === 'name-asc') {
          return this.noteTitle(first).localeCompare(this.noteTitle(second), undefined, { sensitivity: 'base' });
        }
        if (sort === 'name-desc') {
          return this.noteTitle(second).localeCompare(this.noteTitle(first), undefined, { sensitivity: 'base' });
        }
        if (sort === 'oldest') {
          return getNoteTimestamp(first, 'createdAt') - getNoteTimestamp(second, 'createdAt');
        }
        if (sort === 'rank' || sort === 'position') {
          return compareNotesByRank(first, second);
        }
        return getNoteTimestamp(second, sort) - getNoteTimestamp(first, sort);
      });
  });

  readonly noteGroups = computed(() => {
    const list = this.visibleNotes();
    const tab = this.activeTab();
    const isSearchActive = !!this.searchTerm().trim();

    const groups: Array<{
      id: string;
      label: string;
      status: 'ACTIVE' | 'ARCHIVED';
      accent: string;
      items: any[];
      count: number;
    }> = [];

    if (tab === 'all' || tab === 'active') {
      const activeItems = list.filter((n) => isNoteActive(n));
      groups.push({
        id: 'active',
        label: 'Active Notes',
        status: 'ACTIVE',
        accent: '#10b981',
        items: activeItems,
        count: activeItems.length,
      });
    }

    if (tab === 'all' || tab === 'archived') {
      const archivedItems = list.filter((n) => isNoteArchived(n));
      groups.push({
        id: 'archived',
        label: 'Archived Notes',
        status: 'ARCHIVED',
        accent: '#64748b',
        items: archivedItems,
        count: archivedItems.length,
      });
    }

    return groups.filter((g) => g.count > 0 || !isSearchActive);
  });

  readonly canCreateNote = computed(() => !!this.selectedWorkspaceId() &&
    !!this.selectedFolderId() &&
    this.columns().length > 0 &&
    !this.loadingNotes());

  ngOnInit(): void {
    this.userPreferenceStore.load();
    this.initialized = true;
    this.loadWorkspaces();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (changes['workspaceId'] && this.workspaceId.trim()) {
      const requestedWorkspaceId = this.workspaceId.trim();
      const exists = this.workspaces().some(workspace => idOf(workspace) === requestedWorkspaceId);
      if (exists && requestedWorkspaceId !== this.selectedWorkspaceId()) {
        this.selectWorkspace(requestedWorkspaceId, false);
        return;
      }
    }
    if (changes['workspaceFolderId'] && this.workspaceFolderId.trim()) {
      const requestedFolderId = this.workspaceFolderId.trim();
      const exists = this.folders().some(folder => idOf(folder) === requestedFolderId);
      if (exists && requestedFolderId !== this.selectedFolderId()) {
        this.selectFolder(requestedFolderId, false);
      }
    }
  }

  chooseFont(value: any): void {
    const font = String(value ?? '').trim();
    if (!this.isStickyNoteFont(font)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT, font);
  }

  onStickyNoteFontSizeSelection(value: any): void {
    const size = Number(value);
    if (!this.isStickyNoteFontSize(size)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT_SIZE, size);
  }

  onStickyNoteLayoutSelection(value: any): void {
    const layout = String(value ?? '').trim();
    if (!this.isStickyNoteLayout(layout)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT, layout);
  }

  openStickyNoteTrash(): void {
    const workspaceId = this.selectedWorkspaceId();
    this.router.navigate(routeCommands(APP_ROUTES.TRASH), {
      queryParams: workspaceId ? { workspaceId } : undefined
    });
  }

  isCompactLayout(): boolean {
    const layout = String(this.stickyNoteLayout() ?? 'DETAIL').trim().toUpperCase();
    return layout === 'COMPACT' || layout === 'PLAIN';
  }

  isDetailLayout(): boolean {
    return !this.isCompactLayout();
  }

  loadWorkspaces(force = false): void {
    if (!force && this.workspaceStore.loaded() && this.workspaces().length) {
      this.selectInitialWorkspace();
      return;
    }
    const requestVersion = ++this.workspaceRequestVersion;
    this.workspaceStore.setLoading(true);
    const query: any = { page: 1, limit: 100 };
    this.workspaceApi
      .getMyWorkspaces(query)
      .pipe(
        finalize(() => this.workspaceStore.setLoading(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (requestVersion !== this.workspaceRequestVersion) return;
          const workspaces = extractList(response);
          this.workspaceStore.setWorkspaces(workspaces, response.pagination ?? null);
          this.selectInitialWorkspace();
        },
        error: error => {
          if (requestVersion !== this.workspaceRequestVersion) return;
          const message = extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.WORKSPACES_LOAD_FAILED);
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

  onWorkspaceChange(value: any | any[] | null): void {
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
    if (!force &&
      this.workspaceFolderStore.initialized() &&
      this.workspaceFolderStore.workspaceId() === workspaceId) {
      this.selectInitialFolder();
      return;
    }
    const requestVersion = ++this.folderRequestVersion;
    this.workspaceFolderStore.resetForWorkspace(workspaceId);
    this.workspaceFolderStore.setLoading(true);
    const query: any = {
      workspaceId,
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      sortBy: 'position',
      sortOrder: 'asc'
    };
    this.folderApi
      .getAllWorkspaceFolders(query)
      .pipe(
        finalize(() => this.workspaceFolderStore.setLoading(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (requestVersion !== this.folderRequestVersion || this.selectedWorkspaceId() !== workspaceId) return;
          const folders = extractList(response);
          const pagination =
            response?.meta ??
            response?.data?.meta ??
            response?.pagination ??
            response?.data?.pagination ??
            null;
          this.workspaceFolderStore.setFolders(workspaceId, folders, pagination);
          this.selectInitialFolder();
        },
        error: error => {
          if (requestVersion !== this.folderRequestVersion || this.selectedWorkspaceId() !== workspaceId) return;
          const message = extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.FOLDERS_LOAD_FAILED);
          this.workspaceFolderStore.setError(message);
          this.clearNotesState();
          this.toastService.error(message, {
            title: 'Could not load folders',
            dedupeKey: 'notes-folders-load-error'
          });
        }
      });
  }

  onFolderChange(value: any | any[] | null): void {
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
    this.overdue.refresh(workspaceId, workspaceFolderId);
    const requestVersion = ++this.noteRequestVersion;
    this.loadingNotes.set(true);
    this.notesError.set(null);
    this.favoriteApi.loadFavorites().subscribe();
    forkJoin({
      columns: this.stickyNoteColumnApi.getByWorkspaceFolder(workspaceId, workspaceFolderId),
      notes: this.stickyNoteApi.getByWorkspaceFolder(workspaceId, workspaceFolderId, { page: 1, limit: 100, sortBy: 'position', sortOrder: 'asc' })
    })
      .pipe(finalize(() => {
        if (requestVersion === this.noteRequestVersion) this.loadingNotes.set(false);
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ columns, notes }) => {
          if (requestVersion !== this.noteRequestVersion ||
            this.selectedWorkspaceId() !== workspaceId ||
            this.selectedFolderId() !== workspaceFolderId)
            return;
          const nextColumns = sortItemsByPosition(extractList(columns));
          const nextNotes = sortNotesByRank(extractList(notes));
          this.columns.set(nextColumns);
          this.notes.set(nextNotes);
          if (!savedId) return;
          const savedNote = nextNotes.find(note => idOf(note) === savedId);
          if (!savedNote) return;
          if (created) this.noteCreated.emit(savedNote);
          else this.noteChanged.emit(savedNote);
        },
        error: error => {
          if (requestVersion !== this.noteRequestVersion) return;
          this.columns.set([]);
          this.notes.set([]);
          const message = extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.LOAD_FAILED);
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

  setNoteTab(value: any): void {
    if (value === 'all' || value === 'active' || value === 'archived') this.activeTab.set(value);
  }

  setNoteView(value: any): void {
    if (value === 'grid' || value === 'table' || value === 'list') this.view.set(value);
  }

  updateSearch(value: any): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(value: any | any[] | null): void {
    if (Array.isArray(value) || value === null) return;
    if (value === 'updatedAt' || value === 'createdAt' || value === 'title' || value === 'rank' || value === 'position') this.sortBy.set(value);
  }

  openCreateEditor(): void {
    if (!this.canCreateNote()) {
      if (!this.selectedFolderId()) {
        this.toastService.error(STICKY_NOTE_MESSAGES.VALIDATION.FOLDER_REQUIRED, {
          title: 'Folder required',
          dedupeKey: 'note-create-folder-required'
        });
      } else if (this.columns().length === 0) {
        this.toastService.error(STICKY_NOTE_MESSAGES.VALIDATION.COLUMN_REQUIRED, {
          title: 'Column required',
          dedupeKey: 'note-create-column-required'
        });
      }
      return;
    }
    const defaultColumn = this.columns().find(column => column.type !== 'COMPLETED') ?? this.columns()[0];
    const columnId = idOf(defaultColumn);
    if (!columnId) return;
    this.notePanelMode.set('create');
    this.notePanelId.set(columnId);
    this.notePanelOpen.set(true);
  }

  openEditEditor(note: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const id = idOf(note);
    if (!id || this.isBusy(note)) return;
    this.notePanelMode.set('edit');
    this.notePanelId.set(id);
    this.notePanelOpen.set(true);
  }

  openOverdueNote(note: any): void {
    if (note.workspaceId !== this.selectedWorkspaceId() || note.workspaceFolderId !== this.selectedFolderId()) return;
    this.openEditEditor(note);
  }

  bringOverdueToToday(ids: readonly string[]): void {
    this.overdue.bringToToday(ids, () => this.loadSelectedFolder());
  }

  closeNotePanel(): void {
    this.notePanelOpen.set(false);
    this.notePanelId.set('');
  }

  onNoteSaved(value: unknown): void {
    const created = this.notePanelMode() === 'create';
    const noteId = typeof value === 'string' ? value : idOf(value);
    this.closeNotePanel();
    this.loadSelectedFolder(noteId, created);
  }

  onNoteDeleted(noteId: string): void {
    if (!noteId) return;
    this.overdue.refresh();
    this.notes.update(notes => notes.filter(item => idOf(item) !== noteId));
    this.selectedNoteIds.update(set => {
      const next = new Set(set);
      next.delete(noteId);
      return next;
    });
  }

  onNoteUpdated(updated: any): void {
    const id = idOf(updated);
    if (!id) return;
    this.notes.update(notes => notes.map(item => idOf(item) === id ? { ...item, ...updated } : item));
    this.noteChanged.emit(updated);
  }

  archiveNote(note: any): void {
    const id = idOf(note);
    if (!id || this.isBusy(note)) return;
    this.setBusy(id, true);
    this.stickyNoteApi
      .archive(id)
      .pipe(finalize(() => this.setBusy(id, false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.replaceNote(response.data);
          this.noteChanged.emit(response.data);
          this.overdue.refresh();
          this.toastService.success(STICKY_NOTE_MESSAGES.SUCCESS.ARCHIVED, {
            title: 'Note archived',
            dedupeKey: `note-archived-${id}`
          });
        },
        error: error => {
          const message = extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.ARCHIVE_FAILED);
          this.toastService.error(message, {
            title: 'Could not archive note',
            dedupeKey: `note-archive-error-${id}`
          });
        }
      });
  }

  activateNote(note: any): void {
    const id = idOf(note);
    if (!id || this.isBusy(note)) return;
    this.setBusy(id, true);
    this.stickyNoteApi
      .updateStatus(id, 'ACTIVE')
      .pipe(finalize(() => this.setBusy(id, false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.replaceNote(response.data);
          this.noteChanged.emit(response.data);
          this.overdue.refresh();
          this.toastService.success(STICKY_NOTE_MESSAGES.SUCCESS.RESTORED, {
            title: 'Note restored',
            dedupeKey: `note-restored-${id}`
          });
        },
        error: error => {
          const message = extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.RESTORE_FAILED);
          this.toastService.error(message, {
            title: 'Could not restore note',
            dedupeKey: `note-restore-error-${id}`
          });
        }
      });
  }

  requestDelete(note: any, event?: Event): void {
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
    const id = idOf(note);
    if (!id) return;
    this.deleting.set(true);
    this.setBusy(id, true);
    this.stickyNoteApi
      .delete(id)
      .pipe(finalize(() => {
        this.deleting.set(false);
        this.setBusy(id, false);
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.onNoteDeleted(id);
          this.deleteTarget.set(null);
          this.toastService.success(STICKY_NOTE_MESSAGES.SUCCESS.MOVED_TO_TRASH, {
            title: 'Note removed',
            dedupeKey: `note-deleted-${id}`
          });
        },
        error: error => {
          const message = extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.DELETE_FAILED);
          this.toastService.error(message, {
            title: 'Could not delete note',
            dedupeKey: `note-delete-error-${id}`
          });
        }
      });
  }

  isBusy(note: any): boolean {
    return this.busyIds().has(idOf(note));
  }

  noteId(note: any): string {
    return idOf(note);
  }

  /** Delegates to shared getNoteTitle from sticky-note.function.ts */
  noteTitle(note: any): string {
    return getNoteTitle(note);
  }

  /** Delegates to shared getNoteContent from sticky-note.function.ts */
  noteContent(note: any): string {
    return getNoteContent(note);
  }

  /** Delegates to shared getNotePreview from sticky-note.function.ts */
  notePreview(note: any): string {
    return getNotePreview(note);
  }

  noteColumn(note: any): any {
    const columnId = this.noteColumnId(note);
    return this.columns().find(column => idOf(column) === columnId);
  }

  isNoteCompleted(note: any): boolean {
    return this.noteColumn(note)?.type === 'COMPLETED';
  }

  noteEyebrow(note: any): string {
    const column = this.noteColumn(note);
    return column?.type ? getNoteColumnEyebrow(column.type) : this.noteColumnName(note);
  }

  stickyNoteData(note: any): any {
    const content = this.noteContent(note);
    const column = this.noteColumn(note);
    const title = this.noteTitle(note);

    return {
      ...note,
      id: idOf(note),
      noteKey: note?.noteKey ?? (typeof note?.stickyNoteNumber === 'number' ? `ST-${String(note.stickyNoteNumber).padStart(6, '0')}` : undefined),
      title,
      content,
      description: content && content !== title ? content : '',
      eyebrow: this.noteEyebrow(note),
      columnLabel: column?.label ?? column?.name ?? this.noteColumnName(note),
      checkboxVariant: column?.checkboxVariant,
      completed: this.isNoteCompleted(note),
      view: this.view(),
      layout: this.stickyNoteLayout(),
      font: this.stickyNoteFont(),
      fontSize: this.stickyNoteFontSize(),
      color: note?.color ?? 'WHITE',
      shape: note?.shape ?? 'SQUARE',
      variant: note?.variant ?? 'PLAIN',
      backgroundPattern: note?.backgroundPattern ?? 'NONE',
      compact: this.isCompactLayout(),
      dueLabel: note?.noteDate
        ? this.dateTimeFormatter.formatDateKey(note.noteDate, '')
        : this.noteUpdatedLabel(note),
      tag: isNoteArchived(note) ? 'Archived' : 'Active',
      tagVariant: isNoteArchived(note) ? 'neutral' : 'success',
      isFavorite: this.isNoteFavorite(note),
      favoriteId: note?.favoriteId || this.favoriteApi.getFavoriteId(idOf(note)),
      assignees: note?.assignees ?? [],
      checklists: note?.checklists ?? [],
      showDragHandle: this.view() === VIEW.GRID && this.sortBy() === 'rank',
      showEditAction: true,
      showMoveActions: false,
      actionsDisabled: this.isBusy(note),
      minHeight: 156,
      padding: 12
    };
  }

  isNoteFavorite(note: any): boolean {
    const id = idOf(note);
    if (!id) return false;
    return this.favoriteApi.isFavorite(id) || note?.isFavorite === true;
  }

  toggleFavorite(note: any, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    const id = idOf(note);
    if (!id || this.isBusy(note) || this.favoriteApi.isBusy(id)) return;

    const currentFavoriteId = note?.favoriteId || this.favoriteApi.getFavoriteId(id);
    const title = this.noteTitle(note);

    this.favoriteApi
      .toggleFavorite(id, currentFavoriteId, title)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          note.isFavorite = res.isFavorite;
          note.favoriteId = res.favoriteId;
          this.noteChanged.emit(note);
        }
      });
  }

  updateNoteTitle(change: any): void {
    const noteId = String(change?.noteId ?? '').trim();
    const title = String(change?.title ?? '').trim();
    const note = this.notes().find(item => idOf(item) === noteId);

    if (!noteId || !title || !note || this.isBusy(note)) return;

    const previousTitle = this.noteTitle(note);
    if (previousTitle === title) return;

    this.notes.update(notes => notes.map(item => idOf(item) === noteId
      ? { ...item, title }
      : item));
    this.setBusy(noteId, true);

    this.stickyNoteApi
      .update(noteId, { title })
      .pipe(
        finalize(() => this.setBusy(noteId, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (response?.data) this.replaceNote(response.data);
          this.noteChanged.emit(response?.data ?? { ...note, title });
        },
        error: error => {
          this.notes.update(notes => notes.map(item => idOf(item) === noteId
            ? { ...item, title: previousTitle }
            : item));
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.RENAME_FAILED),
            { title: 'Title not updated', dedupeKey: `mynotes-title-${noteId}` }
          );
        }
      });
  }

  updateNoteDescription(change: any): void {
    const noteId = String(change?.noteId ?? '').trim();
    const content = String(change?.description ?? '').trim();
    const note = this.notes().find(item => idOf(item) === noteId);

    if (!noteId || !note || this.isBusy(note)) return;

    const previousContent = String(note?.content ?? '').trim();
    if (previousContent === content) return;

    this.notes.update(notes => notes.map(item => idOf(item) === noteId
      ? { ...item, content }
      : item));
    this.setBusy(noteId, true);

    this.stickyNoteApi
      .update(noteId, { content })
      .pipe(
        finalize(() => this.setBusy(noteId, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (response?.data) this.replaceNote(response.data);
          this.noteChanged.emit(response?.data ?? { ...note, content });
        },
        error: error => {
          this.notes.update(notes => notes.map(item => idOf(item) === noteId
            ? { ...item, content: previousContent }
            : item));
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.DESCRIPTION_UPDATE_FAILED),
            { title: 'Description not updated', dedupeKey: `mynotes-description-${noteId}` }
          );
        }
      });
  }

  /* ---------------------------------------------------------------------- */
  /*                         Drag-and-Drop Handlers                          */
  /* ---------------------------------------------------------------------- */

  onNoteDragStart(event: DragEvent, note: any): void {
    if (this.sortBy() !== 'rank') return;
    const id = idOf(note);
    if (!id || this.isBusy(note)) {
      event.preventDefault();
      return;
    }
    this.draggedNoteId.set(id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
    }
  }

  onNoteDragOver(event: DragEvent, index: number): void {
    if (!this.draggedNoteId()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dropTargetIndex.set(index);
  }

  onNoteDragLeave(_event: DragEvent): void {
    // intentionally left empty – dropTargetIndex cleared in dragEnd/drop
  }

  onNoteDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    const draggedId = this.draggedNoteId();
    if (!draggedId) return;

    const currentNotes = [...this.visibleNotes()];
    const draggedNote = currentNotes.find(n => idOf(n) === draggedId);
    if (!draggedNote) { this.resetDragState(); return; }

    const sourceIndex = currentNotes.findIndex(n => idOf(n) === draggedId);
    if (sourceIndex === targetIndex || sourceIndex === -1) {
      this.resetDragState();
      return;
    }

    // Build reordered list optimistically
    const reordered = [...currentNotes];
    reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, draggedNote);

    // Calculate neighbour IDs for the backend (using full notes list ordered by rank)
    const { beforeId, afterId } = getNeighborNoteIds(reordered, targetIndex, draggedId);

    // Optimistic UI update
    const allNotes = this.notes();
    const visibleIds = new Set(currentNotes.map(n => idOf(n)));
    const reorderedAll = [
      ...reordered,
      ...allNotes.filter(n => !visibleIds.has(idOf(n)))
    ];
    this.notes.set(reorderedAll);
    this.resetDragState();

    // Persist to backend
    this.setBusy(draggedId, true);
    this.stickyNoteApi
      .reorder(draggedId, { beforeId, afterId })
      .pipe(finalize(() => this.setBusy(draggedId, false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (response?.data) this.replaceNote(response.data);
        },
        error: error => {
          // Roll back to original order
          this.notes.set(allNotes);
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.REORDER_FAILED),
            { title: 'Reorder failed', dedupeKey: `note-reorder-${draggedId}` }
          );
        }
      });
  }

  onNoteDragEnd(_event: DragEvent): void {
    this.resetDragState();
  }

  isDragTarget(index: number): boolean {
    return this.dropTargetIndex() === index && this.draggedNoteId() !== null;
  }

  isDragging(note: any): boolean {
    return this.draggedNoteId() === idOf(note);
  }

  private resetDragState(): void {
    this.draggedNoteId.set(null);
    this.dropTargetIndex.set(null);
  }

  updateChecklistItemStatus(noteId: string, itemId: string, checked: boolean): void {
    const note = this.notes().find(item => idOf(item) === noteId);
    if (!noteId || !itemId || !note || this.isBusy(note)) return;

    this.setChecklistItemCompletion(noteId, itemId, checked);
    this.setBusy(noteId, true);

    this.stickyNoteChecklistItemApi
      .updateCompletion(itemId, checked)
      .pipe(
        finalize(() => this.setBusy(noteId, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const confirmed = response?.data?.isCompleted;
          if (typeof confirmed === 'boolean' && confirmed !== checked)
            this.setChecklistItemCompletion(noteId, itemId, confirmed);
        },
        error: error => {
          this.setChecklistItemCompletion(noteId, itemId, !checked);
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.CHECKLIST_UPDATE_FAILED),
            { title: 'Checklist not updated', dedupeKey: `mynotes-checklist-${itemId}` }
          );
        }
      });
  }

  noteColumnId(note: any): string {
    return idOf(note?.columnId);
  }

  noteColumnName(note: any): string {
    if (note.columnId && typeof note.columnId === 'object') {
      const populatedName = (note.columnId as any)['name'];
      if (typeof populatedName === 'string' && populatedName.trim())
        return populatedName;
    }
    const id = this.noteColumnId(note);
    return this.columns().find(column => idOf(column) === id)?.name ?? 'Notes';
  }

  /** Uses shared toColorCssClass from sticky-note.function.ts */
  noteColorKey(note: any): string {
    return toColorCssClass(note?.color ?? 'WHITE');
  }

  noteColorLabel(note: any): string {
    const value = toColorCssClass(note?.color ?? 'WHITE');
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'White';
  }

  noteUpdatedLabel(note: any): string {
    return this.dateTimeFormatter.formatRelativeDate(note?.updatedAt ?? note?.createdAt, 'Recently');
  }

  /** Delegates to shared isNoteActive from sticky-note.function.ts */
  isActive(note: any): boolean {
    return isNoteActive(note);
  }

  /** Delegates to shared isNoteArchived from sticky-note.function.ts */
  isArchived(note: any): boolean {
    return isNoteArchived(note);
  }

  /** Delegates to shared isNoteDeleted from sticky-note.function.ts */
  isDeleted(note: any): boolean {
    return isNoteDeleted(note);
  }

  folderId(folder: any | undefined): string {
    return idOf(folder);
  }

  folderName(folder: any): string {
    return entityNameOf(folder, 'Untitled folder');
  }

  workspaceName(workspace: any): string {
    return entityNameOf(workspace, 'Untitled workspace');
  }

  private selectWorkspace(id: string, emitChange: boolean): void {
    if (!id) return;
    const changed = id !== this.selectedWorkspaceId();
    this.workspaceStore.select(id);
    if (changed) {
      this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID, id);
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
    if (changed) {
      this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID, id);
    }
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
    const preferredId = this.userPreferenceStore.selectedWorkspaceId();
    const exists = (id: string) => !!id && workspaces.some(item => idOf(item) === id);
    const nextId = exists(requestedId)
      ? requestedId
      : exists(preferredId)
        ? preferredId
        : exists(currentId)
          ? currentId
          : idOf(workspaces[0]);
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
    const preferredId = this.userPreferenceStore.selectedFolderId();
    const exists = (id: string) => !!id && folders.some(item => idOf(item) === id);
    const defaultFolder = folders.find(folder => Boolean(folder.isDefault));
    const nextId = exists(requestedId)
      ? requestedId
      : exists(preferredId)
        ? preferredId
        : exists(currentId)
          ? currentId
          : idOf(defaultFolder ?? folders[0]);
    this.selectFolder(nextId, false);
  }

  private replaceNote(updated: any): void {
    const id = idOf(updated);
    this.notes.update(notes => notes.map(note => idOf(note) === id ? updated : note));
  }

  /** Uses shared mapStickyNoteChecklists to recompute checklist counts correctly */
  private setChecklistItemCompletion(noteId: string, itemId: string, isCompleted: boolean): void {
    this.notes.update(notes => notes.map(note => {
      if (idOf(note) !== noteId || !Array.isArray(note?.checklists)) return note;

      const checklists = mapStickyNoteChecklists(
        note.checklists.map((checklist: any) => ({
          ...checklist,
          items: Array.isArray(checklist?.items)
            ? checklist.items.map((item: any) =>
              idOf(item) === itemId ? { ...item, isCompleted } : item
            )
            : []
        }))
      );

      return { ...note, checklists };
    }));
  }

  private setBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());
    busy ? next.add(id) : next.delete(id);
    this.busyIds.set(next);
  }

  toggleGroup(groupId: string): void {
    this.collapsedGroups.update((set) => {
      const next = new Set(set);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  isGroupCollapsed(groupId: string): boolean {
    return this.collapsedGroups().has(groupId);
  }

  isNoteSelected(note: any): boolean {
    const id = idOf(note);
    return !!id && this.selectedNoteIds().has(id);
  }

  toggleNoteSelection(note: any, checked: boolean): void {
    const id = idOf(note);
    if (!id) return;
    this.selectedNoteIds.update((set) => {
      const next = new Set(set);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  isAllSelected(notes?: any[]): boolean {
    const target = notes ?? this.visibleNotes();
    if (!target.length) return false;
    const set = this.selectedNoteIds();
    return target.every((n) => set.has(idOf(n)));
  }

  isSomeSelected(notes?: any[]): boolean {
    const target = notes ?? this.visibleNotes();
    if (!target.length) return false;
    const set = this.selectedNoteIds();
    const selected = target.filter((n) => set.has(idOf(n)));
    return selected.length > 0 && selected.length < target.length;
  }

  toggleSelectAll(checked: boolean, notes?: any[]): void {
    const target = notes ?? this.visibleNotes();
    if (!target.length) return;
    this.selectedNoteIds.update((set) => {
      const next = new Set(set);
      target.forEach((n) => {
        const id = idOf(n);
        if (id) {
          if (checked) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
      });
      return next;
    });
  }

  clearSelection(): void {
    this.selectedNoteIds.set(new Set());
  }

  bulkArchiveSelected(): void {
    const ids = Array.from(this.selectedNoteIds());
    if (!ids.length) return;

    let completed = 0;
    let updatedCount = 0;
    ids.forEach((id) => {
      const note = this.notes().find((n) => idOf(n) === id);
      if (note && this.isActive(note)) {
        this.stickyNoteApi
          .archive(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              if (res?.data) this.replaceNote(res.data);
              completed++;
              updatedCount++;
              if (completed === ids.length) {
                if (updatedCount > 0) {
                  this.overdue.refresh();
                  this.toastService.success(
                    `Archived ${updatedCount} ${updatedCount === 1 ? 'note' : 'notes'}`
                  );
                }
                this.clearSelection();
              }
            },
            error: () => {
              completed++;
              if (completed === ids.length) {
                if (updatedCount > 0) {
                  this.overdue.refresh();
                  this.toastService.success(
                    `Archived ${updatedCount} ${updatedCount === 1 ? 'note' : 'notes'}`
                  );
                }
                this.clearSelection();
              }
            }
          });
      } else {
        completed++;
        if (completed === ids.length) {
          if (updatedCount > 0) {
            this.overdue.refresh();
            this.toastService.success(
              `Archived ${updatedCount} ${updatedCount === 1 ? 'note' : 'notes'}`
            );
          }
          this.clearSelection();
        }
      }
    });
  }

  bulkDeleteSelected(): void {
    const ids = Array.from(this.selectedNoteIds());
    if (!ids.length) return;

    let completed = 0;
    let deletedCount = 0;
    ids.forEach((id) => {
      this.stickyNoteApi
        .delete(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.notes.update((items) => items.filter((n) => idOf(n) !== id));
            completed++;
            deletedCount++;
            if (completed === ids.length) {
              if (deletedCount > 0) {
                this.overdue.refresh();
                this.toastService.success(
                  `Moved ${deletedCount} ${deletedCount === 1 ? 'note' : 'notes'} to trash`
                );
              }
              this.clearSelection();
            }
          },
          error: () => {
            completed++;
            if (completed === ids.length) {
              if (deletedCount > 0) {
                this.overdue.refresh();
                this.toastService.success(
                  `Moved ${deletedCount} ${deletedCount === 1 ? 'note' : 'notes'} to trash`
                );
              }
              this.clearSelection();
            }
          }
        });
    });
  }

  copyNoteId(id: string, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (!id) return;
    navigator.clipboard?.writeText(id);
    this.copiedNoteIds.update((set) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      this.copiedNoteIds.update((set) => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }, 2000);
  }

  isKeyCopied(id: string): boolean {
    return this.copiedNoteIds().has(id);
  }

  noteKey(note: any): string {
    if (note?.noteKey) return String(note.noteKey);
    if (typeof note?.stickyNoteNumber === 'number') {
      return `ST-${String(note.stickyNoteNumber).padStart(6, '0')}`;
    }
    return '';
  }

  private clearNotesState(closeOverlays = true): void {
    if (closeOverlays) this.overdue.reset();
    ++this.noteRequestVersion;
    this.columns.set([]);
    this.notes.set([]);
    this.loadingNotes.set(false);
    this.notesError.set(null);
    this.busyIds.set(new Set());
    this.clearSelection();
    this.resetDragState();
    if (closeOverlays) {
      this.closeNotePanel();
      this.closeDeleteDialog(true);
    }
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
}
