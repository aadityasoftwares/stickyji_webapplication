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
  SimpleChanges,
  computed,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideArchive,
  LucideArrowRight,
  LucideFileText,
  LucideFolder,
  LucideHash,
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

import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Input as AppInput, type InputValue } from '../../shared/components/input/input';
import { Loader } from '../../shared/components/loader/loader';
import { Select, type SelectOption, type SelectValue } from '../../shared/components/select/select';
import { Tabs, type TabItem, type TabValue } from '../../shared/components/tabs/tabs';
import { type CardVariant, StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { APP_ROUTES, routeCommands } from '../../shared/constants/route.constants';
import { WorkspaceFolderWrapper } from '../workspace/workspace-folder-wrapper/workspace-folder-wrapper';
import { AddEditWorkspaceFolderSidePanel } from './add-edit-workspace-folder-side-panel/add-edit-workspace-folder-side-panel';
import { WorkspaceFolderService } from './services/workspace-folder.service';
import { WorkspaceFolderStore } from './services/workspace-folder.store';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import {
  USER_PREFERENCE_KEYS,
  VIEW_TABS,
  buildStatusTabs
} from '../../shared/constants/common.constants';
import {
  entityNameOf,
  extractErrorMessage,
  extractList,
  idOf
} from '../../shared/functions/common.function';
import type { WorkspaceFolder, WorkspaceFolderStatus } from './models/workspace-folder.models';
import { WORKSPACE_FOLDER_MESSAGES } from './messages/workspace-folder.messages';
import { VALIDATION_MESSAGES } from '../../shared/constants/common.messages';
import { UserDateTimeFormatterService } from '../../shared/services/user-date-time-formatter.service';

type FolderTab = 'all' | 'active' | 'archived';
type FolderView = 'grid' | 'list';
type FolderSort = 'position' | 'updatedAt' | 'createdAt' | 'name';

interface FolderTheme {
  variant: CardVariant;
  icon: any;
}

@Component({
  selector: 'app-workspacefolders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Loader,
    AddEditWorkspaceFolderSidePanel,
    Select,
    StickyCard,
    Tabs,
    WorkspaceFolderWrapper
  ],
  templateUrl: './workspacefolders.html',
  styleUrl: './workspacefolders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Workspacefolders implements OnInit, OnChanges {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly folderApi = inject(WorkspaceFolderService);
  private readonly folderStore = inject(WorkspaceFolderStore);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly toastService = inject(ToastService);
  private readonly dateTimeFormatter = inject(UserDateTimeFormatterService);

  @Input() workspaceId = '';

  @Output() readonly workspaceChange = new EventEmitter<string>();
  @Output() readonly folderOpened = new EventEmitter<WorkspaceFolder>();
  @Output() readonly folderCreated = new EventEmitter<WorkspaceFolder>();
  @Output() readonly folderChanged = new EventEmitter<WorkspaceFolder>();

  private readonly renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  private folderClickTimer: ReturnType<typeof setTimeout> | null = null;
  private loadedWorkspaceId: string | null = null;
  private initialized = false;

  readonly LucideArchive = LucideArchive;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideFileText = LucideFileText;
  readonly LucideFolder = LucideFolder;
  readonly LucideHash = LucideHash;
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
  readonly selectedFolderId = computed(() => this.folderStore.selectedId() ?? '');

  readonly workspaceOptions = computed<readonly SelectOption[]>(() =>
    this.workspaces().map(workspace => ({
      label: this.workspaceName(workspace),
      value: idOf(workspace),
      icon: LucidePanelsTopLeft
    }))
  );

  readonly selectedWorkspaceLabel = computed(() => {
    const id = this.selectedWorkspaceId();
    const workspace = this.workspaces().find(item => idOf(item) === id);
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

  readonly folderEditorOpen = signal(false);
  readonly folderEditorId = signal('');
  readonly folderEditorFolder = signal<WorkspaceFolder | null>(null);

  /* Aliases for compatibility */
  readonly folderModalOpen = this.folderEditorOpen;
  readonly folderModalId = this.folderEditorId;
  readonly folderModalFolder = this.folderEditorFolder;

  readonly inlineRenameId = signal<string | null>(null);
  readonly inlineRenameName = signal('');
  readonly inlineRenameError = signal<string | null>(null);
  readonly savingInlineRename = signal(false);

  readonly deleteTarget = signal<WorkspaceFolder | null>(null);
  readonly deleting = signal(false);

  readonly sortOptions: readonly SelectOption[] = [
    { label: 'Folder order', value: 'position' },
    { label: 'Recently updated', value: 'updatedAt' },
    { label: 'Recently created', value: 'createdAt' },
    { label: 'Name A–Z', value: 'name' }
  ];
  readonly viewTabs = VIEW_TABS;

  readonly totalCount = computed(() => this.folders().filter(folder => !this.isDeleted(folder)).length);
  readonly activeCount = computed(() => this.folders().filter(folder => this.isActive(folder)).length);
  readonly archivedCount = computed(() => this.folders().filter(folder => this.isArchived(folder)).length);

  readonly folderTabs = computed<readonly TabItem[]>(() =>
    buildStatusTabs({
      all: this.totalCount(),
      active: this.activeCount(),
      archived: this.archivedCount()
    })
  );

  readonly nextFolderPosition = computed(() => {
    const folders = this.folders().filter(folder => !this.isDeleted(folder));
    return folders.length
      ? Math.max(...folders.map(folder => this.folderPosition(folder))) + 1
      : 0;
  });

  readonly visibleFolders = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    const filtered = this.folders().filter(folder => {
      if (this.isDeleted(folder)) return false;
      if (tab === 'active' && !this.isActive(folder)) return false;
      if (tab === 'archived' && !this.isArchived(folder)) return false;
      if (!search) return true;

      const name = this.folderName(folder).toLowerCase();
      const description = this.folderDescription(folder).toLowerCase();
      const status = this.folderStatusLabel(folder).toLowerCase();
      const type = this.isDefault(folder) ? 'default folder' : 'folder';
      const pos = String(this.folderPosition(folder));

      return (
        name.includes(search) ||
        description.includes(search) ||
        status.includes(search) ||
        type.includes(search) ||
        pos.includes(search)
      );
    });

    return [...filtered].sort((first, second) => {
      if (sort === 'name') {
        return this.folderName(first).localeCompare(this.folderName(second), undefined, { sensitivity: 'base' });
      }
      if (sort === 'position') {
        const byPos = this.folderPosition(first) - this.folderPosition(second);
        return byPos || this.folderName(first).localeCompare(this.folderName(second), undefined, { sensitivity: 'base' });
      }
      const firstDate = this.folderTimestamp(first, sort as 'createdAt' | 'updatedAt');
      const secondDate = this.folderTimestamp(second, sort as 'createdAt' | 'updatedAt');
      return secondDate - firstDate;
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
    if (!this.workspaceStore.loaded() && !this.workspaceStore.loading()) {
      this.workspaceStore.load();
    } else {
      this.ensureWorkspaceSelection();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized || !changes['workspaceId'] || changes['workspaceId'].firstChange) return;
    this.trySelectRequestedWorkspace();
  }

  loadWorkspaces(): void {
    this.workspaceStore.load(true);
  }

  loadFolders(savedId = '', created = false, workspaceId = this.selectedWorkspaceId()): void {
    const id = workspaceId.trim();
    if (!id) {
      this.clearPageForNoWorkspace();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.folderStore.setLoading(true);

    this.folderApi
      .getAllWorkspaceFolders({ page: 1, limit: 100 })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          if (this.selectedWorkspaceId() !== id) return;

          const folders = extractList<WorkspaceFolder>(response);
          this.folders.set(folders);
          this.folderStore.setFolders(id, folders, response.pagination ?? null);
          this.ensureSelectedFolder(folders);

          if (savedId) {
            const savedFolder = folders.find(folder => this.folderId(folder) === savedId);
            if (savedFolder) {
              if (created) this.folderCreated.emit(savedFolder);
              else this.folderChanged.emit(savedFolder);
            }
          }
        },
        error: error => {
          if (this.selectedWorkspaceId() !== id) return;
          this.folders.set([]);
          const message = extractErrorMessage(error, WORKSPACE_FOLDER_MESSAGES.ERROR.LOAD_FAILED);
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
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID, id);
    this.folderStore.resetForWorkspace(id);
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

  setSort(value: SelectValue): void {
    if (value) this.sortBy.set(value as FolderSort);
  }

  openFolder(folder: WorkspaceFolder): void {
    const id = this.folderId(folder);
    if (!id || this.isBusy(folder)) return;

    this.folderStore.select(id);
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID, id);
    this.folderOpened.emit(folder);
    this.router.navigate(routeCommands(APP_ROUTES.MY_NOTES));
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

  openCreateEditor(): void {
    if (!this.selectedWorkspaceId()) {
      this.toastService.warning(WORKSPACE_FOLDER_MESSAGES.VALIDATION.WORKSPACE_REQUIRED, {
        title: 'Workspace required',
        dedupeKey: 'workspace-folder-workspace-required'
      });
      return;
    }

    this.cancelInlineRename();
    this.folderEditorId.set('');
    this.folderEditorFolder.set(null);
    this.folderEditorOpen.set(true);
  }

  openEditEditor(folder: WorkspaceFolder, event?: Event): void {
    event?.stopPropagation();
    const id = this.folderId(folder);
    if (!id || this.isBusy(folder)) return;

    this.cancelInlineRename();
    this.folderEditorId.set(id);
    this.folderEditorFolder.set(folder);
    this.folderEditorOpen.set(true);
  }

  closeFolderEditor(): void {
    this.folderEditorOpen.set(false);
    this.folderEditorId.set('');
    this.folderEditorFolder.set(null);
  }

  onFolderSaved(savedId: any): void {
    const id = idOf(savedId) || this.folderEditorId();
    const isCreate = !this.folderEditorId();
    this.closeFolderEditor();
    this.loadFolders(id, isCreate);
  }

  beginInlineRename(folder: WorkspaceFolder, event?: Event): void {
    event?.stopPropagation();
    if (this.isBusy(folder)) return;

    this.clearFolderClickTimer();
    this.inlineRenameId.set(this.folderId(folder));
    this.inlineRenameName.set(this.folderName(folder));
    this.inlineRenameError.set(null);

    setTimeout(() => {
      const input = this.renameInput()?.nativeElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  updateInlineRename(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.inlineRenameName.set(input.value);
    if (this.inlineRenameError()) this.inlineRenameError.set(null);
  }

  cancelInlineRename(event?: Event): void {
    event?.stopPropagation();
    this.inlineRenameId.set(null);
    this.inlineRenameName.set('');
    this.inlineRenameError.set(null);
    this.savingInlineRename.set(false);
  }

  saveInlineRename(folder: WorkspaceFolder, event?: Event): void {
    event?.stopPropagation();
    const id = this.folderId(folder);
    if (!id || this.inlineRenameId() !== id || this.savingInlineRename()) return;

    const trimmed = this.inlineRenameName().trim();
    const original = this.folderName(folder);

    if (!trimmed) {
      this.inlineRenameError.set(WORKSPACE_FOLDER_MESSAGES.VALIDATION.NAME_REQUIRED);
      return;
    }
    if (trimmed.length < 2) {
      this.inlineRenameError.set(VALIDATION_MESSAGES.MIN_LENGTH(2));
      return;
    }
    if (trimmed.length > 80) {
      this.inlineRenameError.set(VALIDATION_MESSAGES.MAX_LENGTH(80));
      return;
    }
    if (trimmed === original) {
      this.cancelInlineRename();
      return;
    }

    this.savingInlineRename.set(true);
    this.setFolderBusy(id, true);

    this.folderApi
      .update(id, { name: trimmed })
      .pipe(
        finalize(() => {
          this.savingInlineRename.set(false);
          this.setFolderBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const updated = response?.data || { ...folder, name: trimmed };
          this.cancelInlineRename();
          this.folders.update(items =>
            items.map(item => this.folderId(item) === id ? { ...item, ...updated, name: trimmed } : item)
          );
          this.folderStore.upsert(updated);
          this.folderChanged.emit(updated);
          this.toastService.success(WORKSPACE_FOLDER_MESSAGES.SUCCESS.RENAMED(trimmed), {
            title: 'Name updated',
            dedupeKey: `workspace-folder-inline-rename-${id}`
          });
        },
        error: error => {
          const message = extractErrorMessage(error, WORKSPACE_FOLDER_MESSAGES.ERROR.RENAME_FAILED);
          this.inlineRenameError.set(message);
          this.toastService.error(message, {
            title: 'Rename failed',
            dedupeKey: 'workspace-folder-inline-rename-error'
          });
        }
      });
  }

  archiveFolder(folder: WorkspaceFolder): void {
    if (this.isDefault(folder)) {
      this.toastService.warning(WORKSPACE_FOLDER_MESSAGES.VALIDATION.DEFAULT_MUST_REMAIN_ACTIVE, {
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
      this.toastService.warning(WORKSPACE_FOLDER_MESSAGES.VALIDATION.DEFAULT_CANNOT_DELETE, {
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
    const id = this.folderId(folder);
    if (!id || this.isDefault(folder) || this.deleting()) return;

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
          this.toastService.success(WORKSPACE_FOLDER_MESSAGES.SUCCESS.MOVED_TO_TRASH(this.folderName(folder)), {
            title: 'Folder moved',
            dedupeKey: `workspace-folder-delete-${id}`
          });
        },
        error: error => {
          this.deleteTarget.set(null);
          const message = extractErrorMessage(error, WORKSPACE_FOLDER_MESSAGES.ERROR.MOVE_TO_TRASH_FAILED);
          this.toastService.error(message, {
            title: 'Could not move folder',
            dedupeKey: 'workspace-folder-delete-error'
          });
        }
      });
  }

  restoreFolder(folder: WorkspaceFolder): void {
    const id = this.folderId(folder);
    if (!id) return;
    this.setFolderBusy(id, true);

    this.folderApi
      .restore(id)
      .pipe(
        finalize(() => this.setFolderBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const restored = response?.data || { ...folder, status: 'ACTIVE' };
          this.folderStore.upsert(restored);
          this.folderChanged.emit(restored);
          this.toastService.success(WORKSPACE_FOLDER_MESSAGES.SUCCESS.RESTORED(this.folderName(restored)), {
            title: 'Folder restored',
            dedupeKey: `workspace-folder-restore-${id}`
          });
          this.loadFolders();
        },
        error: error => {
          const message = extractErrorMessage(error, WORKSPACE_FOLDER_MESSAGES.ERROR.RESTORE_FAILED);
          this.toastService.error(message, {
            title: 'Restore failed',
            dedupeKey: 'workspace-folder-restore-error'
          });
        }
      });
  }

  folderId(folder: any): string {
    return idOf(folder);
  }

  folderName(folder: any): string {
    return entityNameOf(folder, 'Untitled folder');
  }

  folderDescription(folder: any): string {
    const description = typeof folder?.description === 'string' ? folder.description.trim() : '';
    if (description) return description;
    return this.isDefault(folder) ? 'Your default notes folder' : 'A folder inside this workspace';
  }

  folderStatus(folder: any): WorkspaceFolderStatus {
    return String(folder?.status ?? 'ACTIVE').toUpperCase() as WorkspaceFolderStatus;
  }

  folderStatusLabel(folder: any): string {
    const status = this.folderStatus(folder).toLowerCase();
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  folderPosition(folder: any): number {
    const position = Number(folder?.position);
    return Number.isFinite(position) ? position : 0;
  }

  folderPositionLabel(folder: any): string {
    return `#${this.folderPosition(folder) + 1}`;
  }

  folderNoteCount(folder: any): number {
    const value = folder?.noteCount ?? folder?.notesCount ?? folder?.totalNotes ?? folder?.stickyNoteCount ?? 0;
    const count = Number(value);
    return Number.isFinite(count) ? Math.max(0, count) : 0;
  }

  folderUpdatedLabel(folder: any): string {
    const value = folder?.updatedAt ?? folder?.createdAt;
    if (!value) return 'Recently';

    return this.dateTimeFormatter.formatRelativeDate(value, 'Recently');
  }

  folderTheme(folder: any): FolderTheme {
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

    const storedColor = String(folder?.color ?? '').trim().toLowerCase();
    const storedVariant = byColor[storedColor];
    if (storedVariant) {
      return { variant: storedVariant, icon: this.isDefault(folder) ? LucideStar : LucideFolder };
    }

    return {
      variant: 'noteYellow',
      icon: this.isDefault(folder) ? LucideStar : LucideFolder
    };
  }

  isActive(folder: any): boolean {
    return this.folderStatus(folder) === 'ACTIVE';
  }

  isArchived(folder: any): boolean {
    return this.folderStatus(folder) === 'ARCHIVED';
  }

  isDeleted(folder: any): boolean {
    return this.folderStatus(folder) === 'DELETED';
  }

  isDefault(folder: any): boolean {
    return Boolean(folder?.isDefault);
  }

  isBusy(folder: any): boolean {
    return this.busyIds().has(this.folderId(folder));
  }

  isInlineRenaming(folder: any): boolean {
    return this.inlineRenameId() === this.folderId(folder);
  }

  private updateFolderStatus(folder: any, status: WorkspaceFolderStatus): void {
    const id = this.folderId(folder);
    if (!id) return;
    this.setFolderBusy(id, true);

    this.folderApi
      .updateStatus(id, status)
      .pipe(
        finalize(() => this.setFolderBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const updated = response?.data || { ...folder, status };
          this.folders.update(items =>
            items.map(item => this.folderId(item) === id ? { ...item, ...updated } : item)
          );
          this.folderStore.upsert(updated);
          this.folderChanged.emit(updated);

          const archived = status === 'ARCHIVED';
          this.toastService.success(
            archived
              ? WORKSPACE_FOLDER_MESSAGES.SUCCESS.ARCHIVED(this.folderName(folder))
              : WORKSPACE_FOLDER_MESSAGES.SUCCESS.ACTIVATED(this.folderName(folder)),
            {
              title: archived ? 'Folder archived' : 'Folder restored',
              dedupeKey: `workspace-folder-status-${id}`
            }
          );
        },
        error: error => {
          const message = extractErrorMessage(error, WORKSPACE_FOLDER_MESSAGES.ERROR.UPDATE_FAILED);
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
    const preferredId = this.userPreferenceStore.selectedWorkspaceId();
    const valid = (id: string) => !!id && workspaces.some(workspace => idOf(workspace) === id);

    const nextId = valid(requestedId)
      ? requestedId
      : valid(preferredId)
        ? preferredId
        : valid(currentId)
          ? currentId
          : idOf(workspaces[0]);

    if (nextId !== currentId) {
      this.workspaceStore.select(nextId);
    } else if (this.loadedWorkspaceId !== nextId) {
      this.loadFolders('', false, nextId);
    }
  }

  private trySelectRequestedWorkspace(): void {
    const id = this.workspaceId.trim();
    if (!id || id === this.selectedWorkspaceId()) return;

    if (this.workspaces().some(workspace => idOf(workspace) === id)) {
      this.workspaceStore.select(id);
    }
  }

  private ensureSelectedFolder(folders: readonly WorkspaceFolder[]): void {
    const selectedId = this.folderStore.selectedId();
    if (selectedId && folders.some(folder => this.folderId(folder) === selectedId && this.isActive(folder))) {
      return;
    }

    const preferredFolderId = this.userPreferenceStore.selectedFolderId();
    if (preferredFolderId && folders.some(folder => this.folderId(folder) === preferredFolderId && this.isActive(folder))) {
      this.folderStore.select(preferredFolderId);
      return;
    }

    const preferred =
      folders.find(folder => this.isActive(folder) && this.isDefault(folder)) ??
      folders.find(folder => this.isActive(folder)) ??
      null;

    this.folderStore.select(preferred ? this.folderId(preferred) : null);
  }

  private setFolderBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());
    if (busy) next.add(id);
    else next.delete(id);
    this.busyIds.set(next);
  }

  private clearFolderClickTimer(): void {
    if (this.folderClickTimer !== null) {
      clearTimeout(this.folderClickTimer);
      this.folderClickTimer = null;
    }
  }

  private folderTimestamp(folder: WorkspaceFolder, field: 'createdAt' | 'updatedAt'): number {
    const value = folder[field];
    if (!value) return 0;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private workspaceName(workspace: any): string {
    return entityNameOf(workspace, 'Untitled workspace');
  }

  private clearPageForNoWorkspace(): void {
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
    this.folderEditorOpen.set(false);
    this.folderEditorId.set('');
    this.folderEditorFolder.set(null);
    this.deleteTarget.set(null);
    this.busyIds.set(new Set());
    this.activeTab.set('all');
    this.searchTerm.set('');
  }
}
