import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideArchive,
  LucideArrowRight,
  LucideFileText,
  LucideFolder,
  LucideGrid2X2,
  LucideHash,
  LucideLightbulb,
  LucideList,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideStar,
  LucideTrash2,
  LucideX
} from '@lucide/angular';

import { AppIcon, type AppIconDefinition } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Input as AppInput, type InputValue } from '../../shared/components/input/input';
import { Loader } from '../../shared/components/loader/loader';
import { Select, type SelectOption, type SelectValue } from '../../shared/components/select/select';
import { Tabs, type TabItem, type TabValue } from '../../shared/components/tabs/tabs';
import { type CardVariant, StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../shared/components/toast/services/toast.service';

import type {
  PaginatedApiResponse,
  WorkspaceFolder,
  WorkspaceFolderQuery,
  WorkspaceFolderStatus,
  WorkspaceFolderUpdateRequest
} from './models/workspace-folder.models';
import { WorkspaceFolderApiService } from './services/workspace-folder.service';
import { WorkspaceFolderStore } from './services/workspace-folder.store';
import { AddEditWorkspaceFolderModal } from './modals/add-edit-workspace-folder-modal/add-edit-workspace-folder-modal';

import type {
  MyWorkspaceQuery,
  PaginatedApiResponse as WorkspacePaginatedApiResponse,
  Workspace as WorkspaceModel
} from '../workspace/models/workspace.models';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';

type FolderTab = 'all' | 'active' | 'archived';
type FolderView = 'grid' | 'list';
type FolderSort = 'position' | 'updatedAt' | 'createdAt' | 'name';
type UnknownRecord = Record<string, unknown>;

interface FolderTheme {
  variant: CardVariant;
  icon: AppIconDefinition;
}

@Component({
  selector: 'app-workspacefolders',
  standalone: true,
  imports: [
    FormsModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Loader,
    AddEditWorkspaceFolderModal,
    Select,
    StickyCard,
    Tabs
  ],
  templateUrl: './workspacefolders.html',
  styleUrl: './workspacefolders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Workspacefolders implements OnInit, OnChanges {
  private readonly folderApi = inject(WorkspaceFolderApiService);
  // private readonly workspaceApi = inject(WorkspaceApiService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly folderStore = inject(WorkspaceFolderStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  @Input() workspaceId = '';

  @Output() readonly workspaceChange = new EventEmitter<string>();
  @Output() readonly folderOpened = new EventEmitter<WorkspaceFolder>();
  @Output() readonly folderCreated = new EventEmitter<WorkspaceFolder>();
  @Output() readonly folderChanged = new EventEmitter<WorkspaceFolder>();

  @ViewChildren('renameInput')
  private renameInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private folderClickTimer: ReturnType<typeof setTimeout> | null = null;
  private loadedWorkspaceId: string | null = null;
  private folderRequestVersion = 0;
  private initialized = false;

  readonly LucideArchive = LucideArchive;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideFileText = LucideFileText;
  readonly LucideFolder = LucideFolder;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideHash = LucideHash;
  readonly LucideList = LucideList;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideStar = LucideStar;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;

  readonly workspaces = this.workspaceStore.workspaces;
  readonly loadingWorkspaces = this.workspaceStore.loading;
  readonly workspaceError = this.workspaceStore.error;
  readonly selectedWorkspaceId = computed(() => this.workspaceStore.selectedId() ?? '');

  readonly workspaceOptions = computed<readonly SelectOption[]>(() =>
    this.workspaces().map(workspace => ({
      label: this.workspaceName(workspace),
      value: this.workspaceRecordId(workspace),
      icon: LucidePanelsTopLeft
    }))
  );

  readonly selectedWorkspaceLabel = computed(() => {
    const id = this.selectedWorkspaceId();
    const workspace = this.workspaces().find(item => this.workspaceRecordId(item) === id);
    return workspace ? this.workspaceName(workspace) : 'Select workspace';
  });

  readonly folders = signal<readonly WorkspaceFolder[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<FolderTab>('all');
  readonly view = signal<FolderView>('grid');
  readonly sortBy = signal<FolderSort>('position');
  readonly searchTerm = signal('');
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  /* Same parent/modal contract as Workspace. */
  readonly folderModalOpen = signal(false);
  readonly folderModalId = signal('');
  readonly folderModalFolder = signal<WorkspaceFolder | null>(null);

  readonly inlineRenameId = signal<string | null>(null);
  readonly inlineRenameName = signal('');
  readonly inlineRenameError = signal<string | null>(null);
  readonly savingInlineRename = signal(false);

  readonly deleteTarget = signal<WorkspaceFolder | null>(null);
  readonly deleting = signal(false);

  readonly totalCount = computed(() => this.folders().filter(folder => !this.isDeleted(folder)).length);
  readonly activeCount = computed(() => this.folders().filter(folder => this.isActive(folder)).length);
  readonly archivedCount = computed(() => this.folders().filter(folder => this.isArchived(folder)).length);

  readonly nextFolderPosition = computed(() => {
    const folders = this.folders().filter(folder => !this.isDeleted(folder));
    return folders.length
      ? Math.max(...folders.map(folder => this.folderPosition(folder))) + 1
      : 0;
  });

  readonly folderTabs = computed<readonly TabItem[]>(() => [
    {
      value: 'all',
      label: 'All',
      count: this.totalCount(),
      icon: LucideFolder,
      ariaLabel: 'All workspace folders'
    },
    {
      value: 'active',
      label: 'Active',
      count: this.activeCount(),
      icon: LucideLightbulb,
      ariaLabel: 'Active workspace folders'
    },
    {
      value: 'archived',
      label: 'Archived',
      count: this.archivedCount(),
      icon: LucideArchive,
      ariaLabel: 'Archived workspace folders'
    }
  ]);

  readonly viewTabs: readonly TabItem[] = [
    { value: 'grid', label: 'Grid', icon: LucideGrid2X2, ariaLabel: 'Show folders in grid view' },
    { value: 'list', label: 'List', icon: LucideList, ariaLabel: 'Show folders in list view' }
  ];

  readonly sortOptions: readonly SelectOption[] = [
    { label: 'Folder order', value: 'position' },
    { label: 'Recently updated', value: 'updatedAt' },
    { label: 'Recently created', value: 'createdAt' },
    { label: 'Name A–Z', value: 'name' }
  ];

  readonly visibleFolders = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    return [...this.folders()]
      .filter(folder => {
        if (this.isDeleted(folder)) return false;
        if (tab === 'active' && !this.isActive(folder)) return false;
        if (tab === 'archived' && !this.isArchived(folder)) return false;
        if (!search) return true;

        return [
          this.folderName(folder),
          this.folderDescription(folder),
          this.folderStatusLabel(folder),
          this.isDefault(folder) ? 'default folder' : 'folder',
          String(this.folderPosition(folder))
        ].some(value => value.toLowerCase().includes(search));
      })
      .sort((first, second) => {
        if (sort === 'name') {
          return this.folderName(first).localeCompare(this.folderName(second), undefined, { sensitivity: 'base' });
        }

        if (sort === 'position') {
          const byPosition = this.folderPosition(first) - this.folderPosition(second);
          return byPosition || this.folderName(first).localeCompare(this.folderName(second), undefined, { sensitivity: 'base' });
        }

        return this.folderTimestamp(second, sort) - this.folderTimestamp(first, sort);
      });
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearFolderClickTimer());

    effect(() => {
      const workspaceId = this.workspaceStore.selectedId();

      if (!workspaceId) {
        this.loadedWorkspaceId = null;
        this.clearPageForNoWorkspace();
        return;
      }

      if (this.loadedWorkspaceId === workspaceId) return;

      this.loadedWorkspaceId = workspaceId;
      this.resetInteractionState();
      this.loadFolders('', false, workspaceId);
    });
  }

  ngOnInit(): void {
    this.initialized = true;

    // if (this.workspaceStore.initialized()) {
    //   this.ensureWorkspaceSelection();
    // } else {
    //   this.loadWorkspaces();
    // }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized || !changes['workspaceId'] || changes['workspaceId'].firstChange) return;
    this.trySelectRequestedWorkspace();
  }

  loadWorkspaces(): void {
    // this.workspaceStore.setLoading(true);
    // const query: MyWorkspaceQuery = { page: 1, limit: 100 };

    // this.workspaceApi
    //   .getMyWorkspaces(query)
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe({
    //     next: response => {
    //       const workspaces = this.extractWorkspaces(response);
    //       this.workspaceStore.setWorkspaces(workspaces, response.pagination ?? null);
    //       this.ensureWorkspaceSelection();
    //     },
    //     error: error => {
    //       const message = this.errorMessage(error, 'Unable to load your workspaces.');
    //       this.workspaceStore.setError(message);
    //       this.toastService.error(message, {
    //         title: 'Could not load workspaces',
    //         dedupeKey: 'workspace-folder-workspace-load-error'
    //       });
    //     }
    //   });
  }

  loadFolders(savedId = '', created = false, workspaceId = this.selectedWorkspaceId()): void {
    const id = workspaceId.trim();
    const requestVersion = ++this.folderRequestVersion;

    if (!id) {
      this.clearPageForNoWorkspace();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.folderStore.setLoading(true);

    const query: WorkspaceFolderQuery = { page: 1, limit: 100 };

    this.folderApi
      .getByWorkspace(id, query)
      .pipe(
        finalize(() => {
          if (requestVersion === this.folderRequestVersion) this.loading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (requestVersion !== this.folderRequestVersion || this.selectedWorkspaceId() !== id) return;

          const folders = this.extractFolders(response);
          this.folders.set(folders);
          this.folderStore.setFolders(id, folders, response.pagination ?? null);
          this.ensureSelectedFolder(folders);

          if (!savedId) return;

          const savedFolder = folders.find(folder => this.folderId(folder) === savedId);
          if (!savedFolder) return;

          if (created) {
            this.folderCreated.emit(savedFolder);
          } else {
            this.folderChanged.emit(savedFolder);
          }
        },
        error: error => {
          if (requestVersion !== this.folderRequestVersion || this.selectedWorkspaceId() !== id) return;

          this.folders.set([]);
          const message = this.errorMessage(error, 'Unable to load workspace folders.');
          this.error.set(message);
          this.folderStore.setError(message);
          this.toastService.error(message, {
            title: 'Could not load folders',
            dedupeKey: 'workspace-folder-load-error'
          });
        }
      });
  }

  onWorkspaceChange(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string' || !value.trim()) return;

    const id = value.trim();
    if (id === this.selectedWorkspaceId()) return;

    this.workspaceStore.select(id);
    this.folderStore.select(null);
    this.workspaceChange.emit(id);
  }

  setFolderTab(value: TabValue): void {
    if (value === 'all' || value === 'active' || value === 'archived') this.activeTab.set(value);
  }

  setFolderView(value: TabValue): void {
    if (value === 'grid' || value === 'list') this.view.set(value);
  }

  updateSearch(value: InputValue): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(value: SelectValue | SelectValue[] | null): void {
    if (value === null || Array.isArray(value)) return;

    if (value === 'position' || value === 'updatedAt' || value === 'createdAt' || value === 'name') {
      this.sortBy.set(value);
    }
  }

  openFolder(folder: WorkspaceFolder): void {
    if (this.isBusy(folder) || this.isDeleted(folder)) return;

    this.folderStore.select(this.folderId(folder));
    this.folderOpened.emit(folder);
  }

  handleFolderClick(folder: WorkspaceFolder, event: MouseEvent): void {
    event.stopPropagation();
    if (this.isBusy(folder) || this.isInlineRenaming(folder)) return;

    this.clearFolderClickTimer();
    this.folderClickTimer = setTimeout(() => {
      this.folderClickTimer = null;
      this.openFolder(folder);
    }, 280);
  }

  handleFolderDoubleClick(folder: WorkspaceFolder, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearFolderClickTimer();

    if (!this.isBusy(folder) && !this.isInlineRenaming(folder)) {
      this.openEditEditor(folder);
    }
  }

  /* Same create/edit flow as Workspace: parent only controls modal open + id. */
  openCreateEditor(): void {
    if (!this.selectedWorkspaceId()) {
      this.toastService.warning('Select a workspace before creating a folder.', {
        title: 'Workspace required',
        dedupeKey: 'workspace-folder-workspace-required'
      });
      return;
    }

    this.cancelInlineRename();
    this.folderModalId.set('');
    this.folderModalFolder.set(null);
    this.folderModalOpen.set(true);
  }

  openEditEditor(folder: WorkspaceFolder, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isBusy(folder)) return;

    this.clearFolderClickTimer();
    this.cancelInlineRename();
    this.folderModalId.set(this.folderId(folder));
    this.folderModalFolder.set(folder);
    this.folderModalOpen.set(true);
  }

  closeFolderEditor(): void {
    this.folderModalOpen.set(false);
    this.folderModalId.set('');
    this.folderModalFolder.set(null);
  }

  onFolderSaved(id: string): void {
    const created = !this.folderModalId();

    this.closeFolderEditor();

    if (created) {
      this.activeTab.set('active');
    }

    this.loadFolders(id, created);
  }

  beginInlineRename(folder: WorkspaceFolder, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isBusy(folder) || this.savingInlineRename()) return;

    this.clearFolderClickTimer();
    this.inlineRenameId.set(this.folderId(folder));
    this.inlineRenameName.set(this.folderName(folder));
    this.inlineRenameError.set(null);
    this.focusInlineRename();
  }

  isInlineRenaming(folder: WorkspaceFolder): boolean {
    return this.inlineRenameId() === this.folderId(folder);
  }

  updateInlineRename(event: Event): void {
    this.inlineRenameName.set((event.target as HTMLInputElement).value);
    this.inlineRenameError.set(null);
  }

  cancelInlineRename(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.savingInlineRename()) return;

    this.inlineRenameId.set(null);
    this.inlineRenameName.set('');
    this.inlineRenameError.set(null);
  }

  saveInlineRename(folder: WorkspaceFolder, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.isInlineRenaming(folder) || this.savingInlineRename()) return;

    const name = this.inlineRenameName().trim();
    const nameError = this.validateFolderName(name);

    if (nameError) {
      this.inlineRenameError.set(nameError);
      this.focusInlineRename();
      return;
    }

    if (name === this.folderName(folder)) {
      this.cancelInlineRename();
      return;
    }

    const id = this.folderId(folder);
    const payload: WorkspaceFolderUpdateRequest = { name };

    this.savingInlineRename.set(true);
    this.setFolderBusy(id, true);

    this.folderApi
      .update(id, payload)
      .pipe(
        finalize(() => {
          this.savingInlineRename.set(false);
          this.setFolderBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.replaceFolder(response.data);
          this.folderStore.upsert(response.data);
          this.folderChanged.emit(response.data);
          this.inlineRenameId.set(null);
          this.inlineRenameName.set('');
          this.inlineRenameError.set(null);

          this.toastService.success(`Folder renamed to “${this.folderName(response.data)}”.`, {
            title: 'Name updated',
            dedupeKey: 'workspace-folder-inline-rename-success'
          });
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to rename folder.');
          this.inlineRenameError.set(message);

          this.toastService.error(message, {
            title: 'Rename failed',
            dedupeKey: 'workspace-folder-inline-rename-error'
          });

          this.focusInlineRename();
        }
      });
  }

  archiveFolder(folder: WorkspaceFolder): void {
    if (this.isDefault(folder)) {
      this.toastService.warning('The default folder must remain active.', {
        title: 'Default folder protected',
        dedupeKey: `workspace-folder-default-archive-${this.folderId(folder)}`
      });
      return;
    }

    this.updateFolderStatus(folder, 'ARCHIVED');
  }

  activateFolder(folder: WorkspaceFolder): void {
    this.updateFolderStatus(folder, 'ACTIVE');
  }

  requestDelete(folder: WorkspaceFolder): void {
    if (this.isDefault(folder)) {
      this.toastService.warning('The default folder cannot be moved to trash.', {
        title: 'Default folder protected',
        dedupeKey: `workspace-folder-default-delete-${this.folderId(folder)}`
      });
      return;
    }

    this.deleteTarget.set(folder);
  }

  closeDeleteDialog(): void {
    if (!this.deleting()) this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const folder = this.deleteTarget();
    if (!folder || this.isDefault(folder)) return;

    const id = this.folderId(folder);
    this.deleting.set(true);
    this.setFolderBusy(id, true);

    this.folderApi
      .delete(id)
      .pipe(
        finalize(() => {
          this.deleting.set(false);
          this.setFolderBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.folders.update(items => items.filter(item => this.folderId(item) !== id));
          this.folderStore.remove(id);

          this.toastService.success(`“${this.folderName(folder)}” was moved to trash.`, {
            title: 'Folder moved',
            dedupeKey: 'workspace-folder-delete-success'
          });

          this.loadFolders();
        },
        error: error => {
          this.deleteTarget.set(null);
          const message = this.errorMessage(error, 'Unable to move folder to trash.');

          this.toastService.error(message, {
            title: 'Could not move folder',
            dedupeKey: 'workspace-folder-delete-error'
          });
        }
      });
  }

  restoreFolder(folder: WorkspaceFolder): void {
    const id = this.folderId(folder);
    this.setFolderBusy(id, true);

    this.folderApi
      .restore(id)
      .pipe(
        finalize(() => this.setFolderBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.folderStore.upsert(response.data);
          this.folderChanged.emit(response.data);

          this.toastService.success(`“${this.folderName(response.data)}” was restored.`, {
            title: 'Folder restored',
            dedupeKey: 'workspace-folder-restore-success'
          });

          this.loadFolders();
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to restore folder.');

          this.toastService.error(message, {
            title: 'Restore failed',
            dedupeKey: 'workspace-folder-restore-error'
          });
        }
      });
  }

  folderId(folder: WorkspaceFolder): string {
    const record = folder as unknown as UnknownRecord;
    return String(record['id'] ?? record['_id'] ?? '');
  }

  folderName(folder: WorkspaceFolder): string {
    return folder.name?.trim() || 'Untitled folder';
  }

  folderRawDescription(folder: WorkspaceFolder): string {
    return typeof folder.description === 'string' ? folder.description : '';
  }

  folderDescription(folder: WorkspaceFolder): string {
    const description = this.folderRawDescription(folder).trim();
    if (description) return description;

    return this.isDefault(folder)
      ? 'Your default notes folder'
      : 'A folder inside this workspace';
  }

  folderStatus(folder: WorkspaceFolder): WorkspaceFolderStatus {
    return String(folder.status ?? 'ACTIVE').toUpperCase() as WorkspaceFolderStatus;
  }

  folderStatusLabel(folder: WorkspaceFolder): string {
    const status = this.folderStatus(folder).toLowerCase();
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  folderPosition(folder: WorkspaceFolder): number {
    const position = Number(folder.position);
    return Number.isFinite(position) ? position : 0;
  }

  folderPositionLabel(folder: WorkspaceFolder): string {
    return `#${this.folderPosition(folder) + 1}`;
  }

  folderNoteCount(folder: WorkspaceFolder): number {
    const record = folder as unknown as UnknownRecord;
    const value = record['noteCount'] ?? record['notesCount'] ?? record['totalNotes'] ?? record['stickyNoteCount'] ?? 0;
    const count = Number(value);

    return Number.isFinite(count) ? Math.max(0, count) : 0;
  }

  folderUpdatedLabel(folder: WorkspaceFolder): string {
    const value = folder.updatedAt ?? folder.createdAt;
    if (!value) return 'Recently';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';

    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
  }

  folderTheme(folder: WorkspaceFolder): FolderTheme {
    const byColor: Record<string, CardVariant> = {
      yellow: 'noteYellow',
      pink: 'notePink',
      blue: 'noteBlue',
      green: 'noteGreen',
      orange: 'noteOrange',
      purple: 'notePurple',
      red: 'noteRed',
      brown: 'noteBrown'
    };

    const storedColor = String(folder.color ?? '').trim().toLowerCase();
    const storedVariant = byColor[storedColor];

    if (storedVariant) {
      return {
        variant: storedVariant,
        icon: this.isDefault(folder) ? LucideStar : LucideFolder
      };
    }

    const variants: readonly CardVariant[] = [
      'noteYellow',
      'noteBlue',
      'notePink',
      'noteGreen',
      'notePurple',
      'noteOrange'
    ];

    const score = [...this.folderName(folder)].reduce(
      (total, character) => total + character.charCodeAt(0),
      0
    );

    return {
      variant: variants[score % variants.length],
      icon: this.isDefault(folder) ? LucideStar : LucideFolder
    };
  }

  isActive(folder: WorkspaceFolder): boolean {
    return this.folderStatus(folder) === 'ACTIVE';
  }

  isArchived(folder: WorkspaceFolder): boolean {
    return this.folderStatus(folder) === 'ARCHIVED';
  }

  isDeleted(folder: WorkspaceFolder): boolean {
    return this.folderStatus(folder) === 'DELETED';
  }

  isDefault(folder: WorkspaceFolder): boolean {
    return Boolean(folder.isDefault);
  }

  isBusy(folder: WorkspaceFolder): boolean {
    return this.busyIds().has(this.folderId(folder));
  }

  private updateFolderStatus(folder: WorkspaceFolder, status: WorkspaceFolderStatus): void {
    const id = this.folderId(folder);
    this.setFolderBusy(id, true);

    this.folderApi
      .updateStatus(id, status)
      .pipe(
        finalize(() => this.setFolderBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.replaceFolder(response.data);
          this.folderStore.upsert(response.data);
          this.folderChanged.emit(response.data);

          const archived = status === 'ARCHIVED';
          this.toastService.success(
            archived
              ? `“${this.folderName(folder)}” was archived.`
              : `“${this.folderName(folder)}” is active again.`,
            {
              title: archived ? 'Folder archived' : 'Folder restored',
              dedupeKey: archived
                ? 'workspace-folder-archive-success'
                : 'workspace-folder-activate-success'
            }
          );

          this.loadFolders();
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to update folder.');

          this.toastService.error(message, {
            title: 'Folder update failed',
            dedupeKey: 'workspace-folder-status-error'
          });
        }
      });
  }

  private ensureWorkspaceSelection(): void {
    const workspaces = this.workspaces();

    if (!workspaces.length) {
      this.workspaceStore.select(null);
      this.clearPageForNoWorkspace();
      return;
    }

    const requestedId = this.workspaceId.trim();
    const currentId = this.selectedWorkspaceId();
    const valid = (id: string) =>
      !!id && workspaces.some(workspace => this.workspaceRecordId(workspace) === id);

    const preferredId = valid(requestedId)
      ? requestedId
      : valid(currentId)
        ? currentId
        : this.workspaceRecordId(workspaces[0]);

    if (preferredId !== currentId) {
      this.workspaceStore.select(preferredId);
    } else if (this.loadedWorkspaceId !== preferredId) {
      this.loadFolders('', false, preferredId);
    }
  }

  private trySelectRequestedWorkspace(): void {
    const id = this.workspaceId.trim();

    if (!id || id === this.selectedWorkspaceId()) return;

    if (this.workspaces().some(workspace => this.workspaceRecordId(workspace) === id)) {
      this.workspaceStore.select(id);
    }
  }

  private ensureSelectedFolder(folders: readonly WorkspaceFolder[]): void {
    const selectedId = this.folderStore.selectedId();

    if (
      selectedId &&
      folders.some(folder => this.folderId(folder) === selectedId && this.isActive(folder))
    ) {
      return;
    }

    const preferred =
      folders.find(folder => this.isActive(folder) && this.isDefault(folder)) ??
      folders.find(folder => this.isActive(folder)) ??
      null;

    this.folderStore.select(preferred ? this.folderId(preferred) : null);
  }

  private validateFolderName(name: string): string | null {
    if (name.length < 2) return 'Enter at least 2 characters.';
    if (name.length > 80) return 'Folder name cannot be longer than 80 characters.';
    return null;
  }

  private replaceFolder(updated: WorkspaceFolder): void {
    const id = this.folderId(updated);
    this.folders.update(items =>
      items.map(item => this.folderId(item) === id ? updated : item)
    );
  }

  private setFolderBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());

    if (busy) {
      next.add(id);
    } else {
      next.delete(id);
    }

    this.busyIds.set(next);
  }

  private clearFolderClickTimer(): void {
    if (this.folderClickTimer === null) return;

    clearTimeout(this.folderClickTimer);
    this.folderClickTimer = null;
  }

  private focusInlineRename(): void {
    setTimeout(() => {
      const input = this.renameInputs?.first?.nativeElement;
      input?.focus();
      input?.select();
    });
  }

  private folderTimestamp(folder: WorkspaceFolder, field: 'createdAt' | 'updatedAt'): number {
    const value = folder[field];
    if (!value) return 0;

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private workspaceRecordId(workspace: WorkspaceModel): string {
    const record = workspace as unknown as UnknownRecord;
    return String(record['id'] ?? record['_id'] ?? '');
  }

  private workspaceName(workspace: WorkspaceModel): string {
    return workspace.name?.trim() || 'Untitled workspace';
  }

  private extractWorkspaces(
    response: WorkspacePaginatedApiResponse<WorkspaceModel>
  ): readonly WorkspaceModel[] {
    const data = response.data as unknown;

    if (Array.isArray(data)) return data as WorkspaceModel[];
    if (!data || typeof data !== 'object') return [];

    const record = data as UnknownRecord;
    const candidates = [
      record['items'],
      record['workspaces'],
      record['docs'],
      record['results']
    ];

    return candidates.find(Array.isArray) as WorkspaceModel[] | undefined ?? [];
  }

  private extractFolders(
    response: PaginatedApiResponse<WorkspaceFolder>
  ): readonly WorkspaceFolder[] {
    const data = response.data as unknown;

    if (Array.isArray(data)) return data as WorkspaceFolder[];
    if (!data || typeof data !== 'object') return [];

    const record = data as UnknownRecord;
    const candidates = [
      record['items'],
      record['folders'],
      record['workspaceFolders'],
      record['docs'],
      record['results']
    ];

    return candidates.find(Array.isArray) as WorkspaceFolder[] | undefined ?? [];
  }

  private clearPageForNoWorkspace(): void {
    ++this.folderRequestVersion;
    this.folders.set([]);
    this.loading.set(false);
    this.error.set(null);
    this.resetInteractionState();
  }

  private resetInteractionState(): void {
    this.clearFolderClickTimer();
    this.inlineRenameId.set(null);
    this.inlineRenameName.set('');
    this.inlineRenameError.set(null);
    this.folderModalOpen.set(false);
    this.folderModalId.set('');
    this.folderModalFolder.set(null);
    this.deleteTarget.set(null);
    this.busyIds.set(new Set());
    this.activeTab.set('all');
    this.searchTerm.set('');
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback;

    const record = error as UnknownRecord;
    const nestedError = record['error'];

    if (nestedError && typeof nestedError === 'object') {
      const message = (nestedError as UnknownRecord)['message'];
      if (typeof message === 'string' && message.trim()) return message;
    }

    const message = record['message'];
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}