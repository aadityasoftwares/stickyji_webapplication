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
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, finalize, from, map, mergeMap, of, switchMap, takeUntil, throwError, toArray } from 'rxjs';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { canWorkspaceAction } from '../../shared/functions/workspace-access.function';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import {
  LucideArchive,
  LucideArrowRight,
  LucideCheck,
  LucideChevronDown,
  LucideChevronRight,
  LucideClock3,
  LucideCopy,
  LucideFileText,
  LucideFolder,
  LucideFolderOpen,
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
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { BulkActionPanel } from '../../shared/components/bulk-action-panel/bulk-action-panel';
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
import { UserDatePipe } from '../../shared/pipes/user-date.pipe';
import {
  USER_PREFERENCE_KEYS,
  VIEW_TABS
} from '../../shared/constants/common.constants';
import {
  entityNameOf,
  extractErrorMessage,
  extractList,
  idOf
} from '../../shared/functions/common.function';
import type { WorkspaceFolder, WorkspaceFolderStatus, WorkspaceFolderQuery, PaginatedApiResponse } from './models/workspace-folder.models';
import { WORKSPACE_FOLDER_MESSAGES } from './messages/workspace-folder.messages';
import { VALIDATION_MESSAGES } from '../../shared/constants/common.messages';


import { canFolderAction, type FolderAction, type FolderWorkspaceAccess } from '../../shared/functions/workspace-folder-access.function';
import { DeleteConfirmModal } from '../../shared/components/delete-confirm-modal/delete-confirm-modal';
import { Tooltip, TooltipTone } from '../../shared/components/tooltip/tooltip';
import { Highlight } from '../../shared/directives/highlight.directive';

type FolderTab = 'all' | 'active' | 'archived' | 'inactive' | 'deleted';
type FolderView = 'grid' | 'list';
type FolderSort = 'position' | 'updatedAt' | 'createdAt' | 'name' | 'name-desc' | 'oldest';

interface FolderTheme {
  variant: TooltipTone;
  icon: typeof LucideFolder | typeof LucideStar;
}

@Component({
  selector: 'app-workspacefolders',
  standalone: true,
  imports: [
    CommonModule,
    DeleteConfirmModal,
    FormsModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Checkbox,
    BulkActionPanel,
    Loader,
    AddEditWorkspaceFolderSidePanel,
    Select,
    StickyCard,
    Tabs,
    Tooltip,
    Highlight,
    WorkspaceFolderWrapper,
    UserDatePipe
  ],
  templateUrl: './workspacefolders.html',
  styleUrl: './workspacefolders.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Workspacefolders implements OnInit, OnChanges {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly folderApi = inject(WorkspaceFolderService);
  private readonly workspaceApi = inject(WorkspaceService);
  private folderLoadSubscription?: Subscription;
  private requestVersion = 0;
  private requestedQuery = '';
  private readonly searchChanges = new Subject<string>();
  private readonly workspaceEnd = new Subject<void>();
  readonly accessWorkspace = signal<FolderWorkspaceAccess | null>(null);
  readonly page = signal(1);
  readonly pagination = signal({ page: 1, limit: 20, total: 0, totalPages: 0 });
  readonly counts = signal<NonNullable<PaginatedApiResponse<WorkspaceFolder>['meta']['counts']>>({});
  readonly bulkBusy = signal(false);
  readonly bulkDeleteOpen = signal(false);
  readonly permanentTarget = signal<WorkspaceFolder | null>(null);
  readonly view = computed<FolderView>(() => this.userPreferenceStore.workspaceView() === 'LIST' ? 'list' : 'grid');
  private readonly folderStore = inject(WorkspaceFolderStore);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly toastService = inject(ToastService);


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
  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucideClock3 = LucideClock3;
  readonly LucideCopy = LucideCopy;
  readonly LucideFileText = LucideFileText;
  readonly LucideFolder = LucideFolder;
  readonly LucideFolderOpen = LucideFolderOpen;
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

  readonly collapsedGroups = signal<Set<string>>(new Set());
  readonly selectedFolderIds = signal<Set<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedFolderIds().size);
  readonly copiedKeyMap = signal<Record<string, boolean>>({});

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
  readonly sortBy = signal<FolderSort>('position');
  readonly searchTerm = signal('');
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  readonly folderEditorOpen = signal(false);
  readonly folderEditorId = signal('');
  readonly folderEditorFolder = signal<WorkspaceFolder | null>(null);

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
    { label: 'Name Z–A', value: 'name-desc' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Name A–Z', value: 'name' }
  ];
  readonly viewTabs = VIEW_TABS;

  readonly totalCount = computed(() => this.counts().all ?? this.pagination().total);
  readonly folderTabs = computed<readonly TabItem[]>(() => [
    { value: 'all', label: 'All', count: this.counts().all },
    { value: 'active', label: 'Active', count: this.counts().active },
    { value: 'archived', label: 'Archived', count: this.counts().archived },
    { value: 'inactive', label: 'Inactive', count: this.counts().inactive },
    { value: 'deleted', label: 'Trash', count: this.counts().deleted },
  ]);
  readonly visibleFolders = this.folders.asReadonly();
  readonly folderGroups = computed(() => ['ACTIVE', 'ARCHIVED', 'INACTIVE', 'DELETED'].map(status => {
    const items = this.visibleFolders().filter(folder => folder.status === status);
    return { id: status.toLowerCase(), label: status === 'DELETED' ? 'Trashed folders' : `${status[0]}${status.slice(1).toLowerCase()} Folders`,
      status, accent: status === 'ACTIVE' ? '#10b981' : '#64748b', items, count: items.length };
  }).filter(group => group.count > 0));

  canAction(folder: WorkspaceFolder | null, action: FolderAction): boolean {
    return canFolderAction(this.accessWorkspace(), folder, action, !this.error() && this.folders().some(item => item.id === folder?.id));
  }

  canBulk(action: FolderAction): boolean {
    const selected = this.folders().filter(folder => this.selectedFolderIds().has(folder.id));
    return !this.bulkBusy() && selected.length > 0 && selected.length === this.selectedCount() &&
      selected.every(folder => !this.isBusy(folder) && this.canAction(folder, action) && (action !== 'canArchive' || folder.status === 'ACTIVE'));
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

  isFolderSelected(folder: WorkspaceFolder | null): boolean {
    const id = this.folderId(folder);
    return !!id && this.selectedFolderIds().has(id);
  }

  toggleFolderSelection(folder: WorkspaceFolder | null, checked: boolean): void {
    if (!folder || this.isBusy(folder) || (!this.canAction(folder, 'canTrash') && !this.canAction(folder, 'canArchive'))) return;
    const id = this.folderId(folder);
    if (!id) return;

    this.selectedFolderIds.update((set) => {
      const next = new Set(set);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  isAllSelected(folders?: readonly WorkspaceFolder[]): boolean {
    const target = (folders ?? this.visibleFolders()).filter(folder => this.canAction(folder, 'canTrash') || this.canAction(folder, 'canArchive'));
    if (!target.length) return false;
    const set = this.selectedFolderIds();
    return target.every((f) => set.has(this.folderId(f)));
  }

  isSomeSelected(folders?: readonly WorkspaceFolder[]): boolean {
    const target = (folders ?? this.visibleFolders()).filter(folder => this.canAction(folder, 'canTrash') || this.canAction(folder, 'canArchive'));
    if (!target.length) return false;
    const set = this.selectedFolderIds();
    const selected = target.filter((f) => set.has(this.folderId(f)));
    return selected.length > 0 && selected.length < target.length;
  }

  toggleSelectAll(checked: boolean, folders?: readonly WorkspaceFolder[]): void {
    const target = (folders ?? this.visibleFolders()).filter(folder => this.canAction(folder, 'canTrash') || this.canAction(folder, 'canArchive'));
    if (!target.length || this.bulkBusy()) return;

    this.selectedFolderIds.update((set) => {
      const next = new Set(set);
      target.forEach((f) => {
        const id = this.folderId(f);
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
    this.selectedFolderIds.set(new Set());
  }

  bulkArchiveSelected(): void { this.runBulk('canArchive'); }
  bulkDeleteSelected(): void {
    if (this.canBulk('canTrash')) this.bulkDeleteOpen.set(true);
  }
  confirmBulkDelete(): void { this.runBulk('canTrash'); }

  private runBulk(action: 'canArchive' | 'canTrash'): void {
    if (!this.canBulk(action)) return;
    const selected = this.folders().filter(folder => this.selectedFolderIds().has(folder.id));
    this.bulkBusy.set(true);
    from(selected).pipe(
      mergeMap(folder => (action === 'canArchive' ? this.folderApi.updateStatus(folder.id, 'ARCHIVED') : this.folderApi.delete(folder.id)).pipe(
        map(() => { this.folderStore.remove(folder.id); this.syncSelectedPreference(); return true; }),
        catchError(error => { this.refreshAccessOnError(error); return of(false); }),
      ), 3),
      toArray(), takeUntil(this.workspaceEnd), takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.bulkBusy.set(false); this.bulkDeleteOpen.set(false); }),
    ).subscribe(results => {
      const succeeded = results.filter(Boolean).length;
      const failed = results.length - succeeded;
      if (succeeded) this.toastService.success(`${succeeded} folder(s) ${action === 'canArchive' ? 'archived' : 'moved to trash'}.`);
      if (failed) this.toastService.error(`${failed} folder(s) could not be updated.`);
      this.clearSelection();
      this.loadFolders();
    });
  }

  requestPermanentDelete(folder: WorkspaceFolder): void {
    if (!this.isBusy(folder) && this.canAction(folder, 'canPermanentlyDelete')) this.permanentTarget.set(folder);
  }

  confirmPermanentDelete(): void {
    const folder = this.permanentTarget();
    if (!folder || this.deleting() || !this.canAction(folder, 'canPermanentlyDelete')) return;
    this.deleting.set(true);
    this.folderApi.permanentlyDelete(folder.id).pipe(
      takeUntil(this.workspaceEnd), takeUntilDestroyed(this.destroyRef), finalize(() => this.deleting.set(false)),
    ).subscribe({
      next: () => {
        this.permanentTarget.set(null);
        this.folderStore.remove(folder.id);
        this.syncSelectedPreference();
        this.toastService.success('Folder permanently deleted.');
        this.loadFolders();
      },
      error: error => {
        this.refreshAccessOnError(error);
        this.toastService.error(extractErrorMessage(error, 'Could not permanently delete folder.'));
      },
    });
  }

  private refreshAccessOnError(error: unknown): void {
    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) {
      this.accessWorkspace.set(null);
      this.clearSelection();
      this.folderStore.reset();
      this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID, '');
      this.loadFolders();
    }
  }
  isKeyCopied(id?: string): boolean {
    return !!(id && this.copiedKeyMap()[id]);
  }

  copyFolderId(id?: string, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (!id) return;
    navigator.clipboard
      .writeText(id)
      .then(() => {
        this.copiedKeyMap.update((map) => ({ ...map, [id]: true }));
        this.toastService.info('Copied folder ID to clipboard');
        setTimeout(() => {
          this.copiedKeyMap.update((map) => {
            const next = { ...map };
            delete next[id];
            return next;
          });
        }, 2000);
      })
      .catch(() => {});
  }

  constructor() {
    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.requestedQuery === JSON.stringify({ ...this.buildListQuery(this.selectedWorkspaceId()), page: 1 })) return;
        this.page.set(1); this.loadFolders();
      });
    this.destroyRef.onDestroy(() => { this.clearFolderClickTimer(); this.workspaceEnd.next(); this.workspaceEnd.complete(); });


    effect(() => {
      const workspaceId = this.workspaceStore.selectedId();
      if (!workspaceId) {
        this.loadedWorkspaceId = null;
        this.clearPageForNoWorkspace();
        return;
      }

      if (this.loadedWorkspaceId === workspaceId) return;

      this.workspaceEnd.next();
      this.folderLoadSubscription?.unsubscribe();
      this.folders.set([]);
      this.accessWorkspace.set(null);
      this.folderStore.resetForWorkspace(workspaceId);
      this.page.set(1);
      this.loadedWorkspaceId = workspaceId;
      this.resetInteractionState();
      this.loadFolders(workspaceId);
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

  loadFolders(workspaceId = this.selectedWorkspaceId()): void {
    const version = ++this.requestVersion;
    this.folderLoadSubscription?.unsubscribe();
    const id = workspaceId.trim();
    if (!id) {
      this.clearPageForNoWorkspace();
      return;
    }

    const query = this.buildListQuery(id);
    this.requestedQuery = JSON.stringify(query);
    this.loading.set(true);
    this.error.set(null);
    this.clearSelection();

    this.folderLoadSubscription = this.workspaceApi
      .getById(id)
      .pipe(
        switchMap(response => {
          const workspace = response?.data;
          this.workspaceStore.updateWorkspace(id, workspace ?? { allowedActions: {} });
          this.accessWorkspace.set(workspace ?? null);
          if (!canWorkspaceAction(workspace, 'canView') || !['ACTIVE', 'ARCHIVED'].includes(workspace?.status)) {
            return throwError(() => ({ status: 403, error: { message: 'You no longer have permission to view this workspace.' } }));
          }
          return this.folderApi.getAllWorkspaceFolders(query);
        }),
        finalize(() => { if (version === this.requestVersion) this.loading.set(false); }),
        takeUntil(this.workspaceEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (this.selectedWorkspaceId() !== id) return;

          const folders = extractList<WorkspaceFolder>(response);
          this.folders.set(folders);
          const meta = response.meta ?? response.pagination;
          const total = meta?.total ?? folders.length;
          const totalPages = meta?.totalPages ?? Math.ceil(total / 20);
          this.pagination.set({ page: meta?.page ?? this.page(), limit: meta?.limit ?? 20, total, totalPages });
          this.counts.set(response.meta?.counts ?? {});
          if (this.page() > Math.max(1, totalPages)) {
            this.page.set(Math.max(1, totalPages));
            this.loadFolders();
            return;
          }

        },
        error: error => {
          if (this.selectedWorkspaceId() !== id) return;
          this.folders.set([]);
          this.accessWorkspace.set(null);
          this.folderStore.reset();
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
    if (['all', 'active', 'archived', 'inactive', 'deleted'].includes(String(value)) && value !== this.activeTab()) {
      this.activeTab.set(value as FolderTab); this.page.set(1); this.loadFolders();
    }
  }

  setFolderView(value: TabValue): void {
    if (value === 'grid' || value === 'list') this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.WORKSPACE_VIEW, value.toUpperCase());
  }

  updateSearch(value: InputValue): void {
    const term = String(value ?? '').slice(0, 100);
    if (term === this.searchTerm()) return;
    this.searchTerm.set(term);
    this.folderLoadSubscription?.unsubscribe();
    this.clearSelection();
    this.searchChanges.next(term);
  }

  clearSearch(): void { this.updateSearch(''); }

  setSort(value: SelectValue): void {
    if (value !== this.sortBy() && this.sortOptions.some(option => option.value === value)) { this.sortBy.set(value as FolderSort); this.page.set(1); this.loadFolders(); }
  }

  openFolder(folder: WorkspaceFolder): void {
    const id = this.folderId(folder);
    if (!id || this.isBusy(folder) || !this.canAction(folder, 'canView')) return;

    this.folderStore.resetForWorkspace(this.selectedWorkspaceId());
    this.folderStore.upsert(folder);
    this.folderStore.select(id);
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID, id);
    this.folderOpened.emit(folder);
    this.router.navigate(routeCommands(APP_ROUTES.MY_NOTES));
  }

  openContextMenu(folder: WorkspaceFolder, event: MouseEvent | KeyboardEvent, trigger: MatMenuTrigger): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearFolderClickTimer();
    if (!this.isBusy(folder) && this.folders().some(item => item.id === folder.id)) trigger.openMenu();
  }

  handleFolderMenuClick(folder: WorkspaceFolder, event: Event): void {
    event.stopPropagation();
    this.clearFolderClickTimer();
  }

  handleFolderClick(folder: WorkspaceFolder, event: MouseEvent): void {
    event.stopPropagation();
    if (this.isBusy(folder) || this.isInlineRenaming(folder) || !this.canAction(folder, 'canView')) return;

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
    if (!this.canAction(null, 'canCreate')) return;
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
    if (!this.canAction(folder, 'canEdit')) return;
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

  onEditorAccessDenied(): void { this.refreshAccessOnError({ status: 403 }); }

  onFolderSaved(folder: WorkspaceFolder): void {
    const isCreate = !this.folderEditorId();
    this.folderStore.upsert(folder);
    this.syncSelectedPreference();
    if (isCreate) this.folderCreated.emit(folder);
    else this.folderChanged.emit(folder);
    this.closeFolderEditor();
    this.loadFolders();
  }

  private syncSelectedPreference(): void {
    const id = this.folderStore.selectedId() ?? '';
    if (id !== this.userPreferenceStore.selectedFolderId()) {
      this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID, id);
    }
  }

  beginInlineRename(folder: WorkspaceFolder, event?: Event): void {
    event?.stopPropagation();
    if (this.isBusy(folder) || !this.canAction(folder, 'canEdit')) return;

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
    if (this.savingInlineRename()) return;
    this.inlineRenameId.set(null);
    this.inlineRenameName.set('');
    this.inlineRenameError.set(null);
  }

  saveInlineRename(folder: WorkspaceFolder, event?: Event): void {
    event?.stopPropagation();
    const id = this.folderId(folder);
    if (!id || this.inlineRenameId() !== id || this.savingInlineRename() || !this.canAction(folder, 'canEdit')) return;

    const trimmed = this.inlineRenameName().trim().replace(/\s+/g, ' ');
    const original = this.folderName(folder);

    if (!trimmed) {
      this.inlineRenameError.set(WORKSPACE_FOLDER_MESSAGES.VALIDATION.NAME_REQUIRED);
      return;
    }
    if (trimmed.length < 1) {
      this.inlineRenameError.set(VALIDATION_MESSAGES.MIN_LENGTH(1));
      return;
    }
    if (trimmed.length > 100) {
      this.inlineRenameError.set(VALIDATION_MESSAGES.MAX_LENGTH(100));
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
        takeUntil(this.workspaceEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const updated = response?.data || { ...folder, name: trimmed };
          this.savingInlineRename.set(false);
          this.cancelInlineRename();
          this.folders.update(items =>
            items.map(item => this.folderId(item) === id ? { ...item, ...updated, name: trimmed } : item)
          );
          this.folderStore.upsert(updated);
          this.syncSelectedPreference();
          this.folderChanged.emit(updated);
          this.loadFolders();
          this.toastService.success(WORKSPACE_FOLDER_MESSAGES.SUCCESS.RENAMED(trimmed), {
            title: 'Name updated',
            dedupeKey: `workspace-folder-inline-rename-${id}`
          });
        },
        error: error => {
          this.refreshAccessOnError(error);
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
    if (this.isBusy(folder) || !this.canAction(folder, 'canTrash')) return;
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
    if (!id || !folder || !this.canAction(folder, 'canTrash') || this.deleting()) return;

    this.deleting.set(true);
    this.setFolderBusy(id, true);

    this.folderApi
      .delete(id)
      .pipe(
        finalize(() => {
          this.deleting.set(false);
          this.setFolderBusy(id, false);
        }),
        takeUntil(this.workspaceEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.folders.update(items => items.filter(item => this.folderId(item) !== id));
          this.folderStore.remove(id);
          this.syncSelectedPreference();
          this.loadFolders();
          this.toastService.success(WORKSPACE_FOLDER_MESSAGES.SUCCESS.MOVED_TO_TRASH(this.folderName(folder)), {
            title: 'Folder moved',
            dedupeKey: `workspace-folder-delete-${id}`
          });
        },
        error: error => {
          this.deleteTarget.set(null);
          this.refreshAccessOnError(error);
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
    if (!id || this.isBusy(folder) || !this.canAction(folder, 'canRestore')) return;
    this.setFolderBusy(id, true);

    this.folderApi
      .restore(id)
      .pipe(
        finalize(() => this.setFolderBusy(id, false)),
        takeUntil(this.workspaceEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const restored = response?.data || { ...folder, status: 'ACTIVE' };
          this.folderStore.upsert(restored);
          this.syncSelectedPreference();
          this.folderChanged.emit(restored);
          this.toastService.success(WORKSPACE_FOLDER_MESSAGES.SUCCESS.RESTORED(this.folderName(restored)), {
            title: 'Folder restored',
            dedupeKey: `workspace-folder-restore-${id}`
          });
          this.loadFolders();
        },
        error: error => {
          this.refreshAccessOnError(error);
          const message = extractErrorMessage(error, WORKSPACE_FOLDER_MESSAGES.ERROR.RESTORE_FAILED);
          this.toastService.error(message, {
            title: 'Restore failed',
            dedupeKey: 'workspace-folder-restore-error'
          });
        }
      });
  }

  folderId(folder: WorkspaceFolder | null): string {
    return idOf(folder);
  }

  folderName(folder: WorkspaceFolder | null): string {
    return entityNameOf(folder, 'Untitled folder');
  }

  folderDescription(folder: WorkspaceFolder | null): string {
    const description = typeof folder?.description === 'string' ? folder.description.trim() : '';
    if (description) return description;
    return this.isDefault(folder) ? 'Your default notes folder' : 'A folder inside this workspace';
  }

  folderStatus(folder: WorkspaceFolder | null): WorkspaceFolderStatus {
    return String(folder?.status ?? 'ACTIVE').toUpperCase() as WorkspaceFolderStatus;
  }

  folderStatusLabel(folder: WorkspaceFolder | null): string {
    const status = this.folderStatus(folder).toLowerCase();
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  folderPosition(folder: WorkspaceFolder | null): number {
    const position = Number(folder?.position);
    return Number.isFinite(position) ? position : 0;
  }

  folderPositionLabel(folder: WorkspaceFolder | null): string {
    return `#${this.folderPosition(folder) + 1}`;
  }

  folderTheme(folder: WorkspaceFolder | null): FolderTheme {
    const byColor: Record<string, TooltipTone> = {
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

  isActive(folder: WorkspaceFolder | null): boolean {
    return this.folderStatus(folder) === 'ACTIVE';
  }

  isArchived(folder: WorkspaceFolder | null): boolean {
    return this.folderStatus(folder) === 'ARCHIVED';
  }

  isDeleted(folder: WorkspaceFolder | null): boolean {
    return this.folderStatus(folder) === 'DELETED';
  }

  isDefault(folder: WorkspaceFolder | null): boolean {
    return Boolean(folder?.isDefault);
  }

  isBusy(folder: WorkspaceFolder | null): boolean {
    return this.bulkBusy() || this.busyIds().has(this.folderId(folder));
  }

  isInlineRenaming(folder: WorkspaceFolder | null): boolean {
    return this.inlineRenameId() === this.folderId(folder);
  }

  private updateFolderStatus(folder: WorkspaceFolder, status: Exclude<WorkspaceFolderStatus, 'DELETED'>): void {
    const id = this.folderId(folder);
    if (!id || this.isBusy(folder) || !this.canAction(folder, 'canArchive')) return;
    this.setFolderBusy(id, true);

    this.folderApi
      .updateStatus(id, status)
      .pipe(
        finalize(() => this.setFolderBusy(id, false)),
        takeUntil(this.workspaceEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const updated = response?.data || { ...folder, status };
          this.folders.update(items =>
            items.map(item => this.folderId(item) === id ? { ...item, ...updated } : item)
          );
          this.folderStore.upsert(updated);
          this.syncSelectedPreference();
          this.folderChanged.emit(updated);
          this.loadFolders();

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
          this.refreshAccessOnError(error);
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

    }
  }

  private trySelectRequestedWorkspace(): void {
    const id = this.workspaceId.trim();
    if (!id || id === this.selectedWorkspaceId()) return;

    if (this.workspaces().some(workspace => idOf(workspace) === id)) {
      this.workspaceStore.select(id);
    }
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

  private buildListQuery(workspaceId: string): WorkspaceFolderQuery {
    const sort = this.sortBy();
    return { workspaceId, page: this.page(), limit: 20,
      status: this.activeTab().toUpperCase() as WorkspaceFolderQuery['status'],
      ...(this.searchTerm().trim() ? { search: this.searchTerm().trim() } : {}),
      sortBy: sort === 'name-desc' ? 'name' : sort === 'oldest' ? 'createdAt' : sort,
      sortOrder: ['name', 'position', 'oldest'].includes(sort) ? 'asc' : 'desc' };
  }

  changePage(delta: number): void {
    const next = this.page() + delta;
    if (this.loading() || next < 1 || next > this.pagination().totalPages) return;
    this.page.set(next); this.loadFolders();
  }

  private workspaceName(workspace: unknown): string {
    return entityNameOf(workspace, 'Untitled workspace');
  }

  private clearPageForNoWorkspace(): void {
    this.workspaceEnd.next();
    this.folderLoadSubscription?.unsubscribe();
    this.accessWorkspace.set(null);
    this.folderStore.reset();
    this.folders.set([]);
    this.loading.set(false);
    this.error.set(null);
    this.resetInteractionState();
  }

  private resetInteractionState(): void {
    this.clearFolderClickTimer();
    this.clearSelection();
    this.inlineRenameId.set(null);
    this.inlineRenameName.set('');
    this.inlineRenameError.set(null);
    this.folderEditorOpen.set(false);
    this.folderEditorId.set('');
    this.folderEditorFolder.set(null);
    this.deleteTarget.set(null);
    this.permanentTarget.set(null);
    this.bulkDeleteOpen.set(false);
    this.busyIds.set(new Set());
    this.activeTab.set('all');
    this.searchTerm.set('');
  }
}
