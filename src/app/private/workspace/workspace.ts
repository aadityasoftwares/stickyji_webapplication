import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
  computed,
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
  LucideLightbulb,
  LucideList,
  LucideMegaphone,
  LucideMoreHorizontal,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideTrash2,
  LucideUsers,
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
  MyWorkspaceQuery,
  PaginatedApiResponse,
  Workspace as WorkspaceModel,
  WorkspaceStatus,
  WorkspaceUpdateRequest
} from './models/workspace.models';
import { WorkspaceApiService } from './services/workspace.service';
import { AddEditWorkspaceModal } from './modals/add-edit-workspace-modal/add-edit-workspace-modal';

type WorkspaceTab = 'all' | 'active' | 'archived';
type WorkspaceView = 'grid' | 'list';
type WorkspaceSort = 'updatedAt' | 'createdAt' | 'name';
type UnknownRecord = Record<string, unknown>;

@Component({
  selector: 'app-workspace',
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
    AddEditWorkspaceModal,
    Select,
    StickyCard,
    Tabs
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Workspace implements OnInit {
  private readonly workspaceApi = inject(WorkspaceApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  @ViewChildren('renameInput')
  private renameInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private workspaceClickTimer: ReturnType<typeof setTimeout> | null = null;

  @Output() readonly workspaceOpened = new EventEmitter<WorkspaceModel>();
  @Output() readonly workspaceCreated = new EventEmitter<WorkspaceModel>();
  @Output() readonly workspaceChanged = new EventEmitter<WorkspaceModel>();

  readonly LucideArchive = LucideArchive;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideFileText = LucideFileText;
  readonly LucideFolder = LucideFolder;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideList = LucideList;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;

  readonly sortOptions: readonly SelectOption[] = [
    { label: 'Recently updated', value: 'updatedAt' },
    { label: 'Recently created', value: 'createdAt' },
    { label: 'Name A–Z', value: 'name' }
  ];

  readonly viewTabs: readonly TabItem[] = [
    { value: 'grid', label: 'Grid', icon: LucideGrid2X2, ariaLabel: 'Show workspaces in grid view' },
    { value: 'list', label: 'List', icon: LucideList, ariaLabel: 'Show workspaces in list view' }
  ];

  readonly workspaces = signal<readonly WorkspaceModel[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<WorkspaceTab>('all');
  readonly view = signal<WorkspaceView>('grid');
  readonly sortBy = signal<WorkspaceSort>('updatedAt');
  readonly searchTerm = signal('');
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  readonly workspaceModalOpen = signal(false);
  readonly workspaceModalId = signal('');

  readonly inlineRenameId = signal<string | null>(null);
  readonly inlineRenameName = signal('');
  readonly inlineRenameError = signal<string | null>(null);
  readonly savingInlineRename = signal(false);

  readonly deleteTarget = signal<WorkspaceModel | null>(null);
  readonly deleting = signal(false);

  readonly totalCount = computed(() =>
    this.workspaces().filter(workspace => !this.isDeleted(workspace)).length
  );

  readonly activeCount = computed(() =>
    this.workspaces().filter(workspace => this.isActive(workspace)).length
  );

  readonly archivedCount = computed(() =>
    this.workspaces().filter(workspace => this.isArchived(workspace)).length
  );

  readonly workspaceTabs = computed<readonly TabItem[]>(() => [
    {
      value: 'all',
      label: 'All',
      count: this.totalCount(),
      icon: LucideFolder,
      ariaLabel: 'All workspaces'
    },
    {
      value: 'active',
      label: 'Active',
      count: this.activeCount(),
      icon: LucideLightbulb,
      ariaLabel: 'Active workspaces'
    },
    {
      value: 'archived',
      label: 'Archived',
      count: this.archivedCount(),
      icon: LucideArchive,
      ariaLabel: 'Archived workspaces'
    }
  ]);

  readonly visibleWorkspaces = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    return this.workspaces()
      .filter(workspace => {
        if (this.isDeleted(workspace)) return false;
        if (tab === 'active' && !this.isActive(workspace)) return false;
        if (tab === 'archived' && !this.isArchived(workspace)) return false;
        if (!search) return true;

        return [
          workspace.name,
          workspace.description ?? '',
          workspace.slug,
          this.workspaceTypeLabel(workspace),
          this.workspaceVisibility(workspace)
        ].some(value => String(value).toLowerCase().includes(search));
      })
      .sort((first, second) => {
        if (sort === 'name') {
          return first.name.localeCompare(second.name, undefined, { sensitivity: 'base' });
        }

        return this.workspaceTimestamp(second, sort) - this.workspaceTimestamp(first, sort);
      });
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearWorkspaceClickTimer());
  }

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(savedId = '', created = false): void {
    this.loading.set(true);
    this.error.set(null);

    const query: MyWorkspaceQuery = { page: 1, limit: 100 };

    this.workspaceApi
      .getMyWorkspaces(query)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const workspaces = this.extractWorkspaces(response);
          this.workspaces.set(workspaces);

          if (!savedId) return;

          const savedWorkspace = workspaces.find(workspace => workspace.id === savedId);
          if (!savedWorkspace) return;

          if (created) {
            this.workspaceCreated.emit(savedWorkspace);
          } else {
            this.workspaceChanged.emit(savedWorkspace);
          }
        },
        error: error => {
          this.workspaces.set([]);

          const message = this.errorMessage(error, 'Unable to load your workspaces.');
          this.error.set(message);
          this.toastService.error(message, {
            title: 'Could not load workspaces',
            dedupeKey: 'workspace-load-error'
          });
        }
      });
  }

  setWorkspaceTab(value: TabValue): void {
    if (value === 'all' || value === 'active' || value === 'archived') {
      this.activeTab.set(value);
    }
  }

  setWorkspaceView(value: TabValue): void {
    if (value === 'grid' || value === 'list') {
      this.view.set(value);
    }
  }

  updateSearch(value: InputValue): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(value: SelectValue | SelectValue[] | null): void {
    if (value === null || Array.isArray(value)) return;

    if (value === 'updatedAt' || value === 'createdAt' || value === 'name') {
      this.sortBy.set(value);
    }
  }

  openWorkspace(workspace: WorkspaceModel): void {
    if (this.isBusy(workspace)) return;
    this.workspaceOpened.emit(workspace);
  }

  handleWorkspaceClick(workspace: WorkspaceModel, event: MouseEvent): void {
    event.stopPropagation();

    if (this.isBusy(workspace) || this.isInlineRenaming(workspace)) return;

    this.clearWorkspaceClickTimer();
    this.workspaceClickTimer = setTimeout(() => {
      this.workspaceClickTimer = null;
      this.openWorkspace(workspace);
    }, 280);
  }

  handleWorkspaceDoubleClick(workspace: WorkspaceModel, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearWorkspaceClickTimer();
    this.openEditEditor(workspace);
  }

  openCreateEditor(): void {
    this.cancelInlineRename();
    this.workspaceModalId.set('');
    this.workspaceModalOpen.set(true);
  }

  openEditEditor(workspace: WorkspaceModel, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isBusy(workspace)) return;

    this.clearWorkspaceClickTimer();
    this.cancelInlineRename();
    this.workspaceModalId.set(workspace.id);
    this.workspaceModalOpen.set(true);
  }

  closeWorkspaceEditor(): void {
    this.workspaceModalOpen.set(false);
    this.workspaceModalId.set('');
  }

  onWorkspaceSaved(id: string): void {
    const created = !this.workspaceModalId();

    this.closeWorkspaceEditor();

    if (created) {
      this.activeTab.set('active');
    }

    this.loadWorkspaces(id, created);
  }

  beginInlineRename(workspace: WorkspaceModel, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isBusy(workspace) || this.savingInlineRename()) return;

    this.clearWorkspaceClickTimer();
    this.inlineRenameId.set(workspace.id);
    this.inlineRenameName.set(workspace.name);
    this.inlineRenameError.set(null);
    this.focusInlineRename();
  }

  isInlineRenaming(workspace: WorkspaceModel): boolean {
    return this.inlineRenameId() === workspace.id;
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

  saveInlineRename(workspace: WorkspaceModel, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.isInlineRenaming(workspace) || this.savingInlineRename()) return;

    const name = this.inlineRenameName().trim();

    if (name.length < 2) {
      this.inlineRenameError.set('Enter at least 2 characters.');
      this.focusInlineRename();
      return;
    }

    if (name.length > 80) {
      this.inlineRenameError.set('Workspace name cannot be longer than 80 characters.');
      this.focusInlineRename();
      return;
    }

    if (name === workspace.name) {
      this.cancelInlineRename();
      return;
    }

    const id = workspace.id;
    this.savingInlineRename.set(true);
    this.setWorkspaceBusy(id, true);

    const payload: WorkspaceUpdateRequest = { name };

    this.workspaceApi
      .update(id, payload)
      .pipe(
        finalize(() => {
          this.savingInlineRename.set(false);
          this.setWorkspaceBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.workspaces.update(items =>
            items.map(item => item.id === id ? response.data : item)
          );

          this.workspaceChanged.emit(response.data);
          this.inlineRenameId.set(null);
          this.inlineRenameName.set('');
          this.inlineRenameError.set(null);

          this.toastService.success(`Workspace renamed to “${response.data.name}”.`, {
            title: 'Name updated',
            dedupeKey: 'workspace-inline-rename-success'
          });
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to rename workspace.');
          this.inlineRenameError.set(message);

          this.toastService.error(message, {
            title: 'Rename failed',
            dedupeKey: 'workspace-inline-rename-error'
          });

          this.focusInlineRename();
        }
      });
  }

  archiveWorkspace(workspace: WorkspaceModel): void {
    this.updateWorkspaceStatus(workspace, 'ARCHIVED');
  }

  activateWorkspace(workspace: WorkspaceModel): void {
    this.updateWorkspaceStatus(workspace, 'ACTIVE');
  }

  requestDelete(workspace: WorkspaceModel): void {
    this.deleteTarget.set(workspace);
  }

  closeDeleteDialog(): void {
    if (!this.deleting()) {
      this.deleteTarget.set(null);
    }
  }

  confirmDelete(): void {
    const workspace = this.deleteTarget();
    if (!workspace) return;

    this.deleting.set(true);
    this.setWorkspaceBusy(workspace.id, true);

    this.workspaceApi
      .delete(workspace.id)
      .pipe(
        finalize(() => {
          this.deleting.set(false);
          this.setWorkspaceBusy(workspace.id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);

          this.toastService.success(`“${workspace.name}” was moved to trash.`, {
            title: 'Workspace moved',
            dedupeKey: 'workspace-delete-success'
          });

          this.loadWorkspaces();
        },
        error: error => {
          this.deleteTarget.set(null);

          const message = this.errorMessage(error, 'Unable to move workspace to trash.');
          this.toastService.error(message, {
            title: 'Could not move workspace',
            dedupeKey: 'workspace-delete-error'
          });
        }
      });
  }

  workspaceId(workspace: WorkspaceModel): string {
    return workspace.id;
  }

  workspaceName(workspace: WorkspaceModel): string {
    return workspace.name || 'Untitled workspace';
  }

  workspaceDescription(workspace: WorkspaceModel): string {
    const description = workspace.description?.trim();
    if (description) return description;

    return workspace.isPersonal
      ? 'Your personal workspace'
      : 'Shared team workspace';
  }

  workspaceVisibility(workspace: WorkspaceModel): string {
    const value = String(workspace.visibility ?? 'PRIVATE')
      .toLowerCase()
      .replaceAll('_', ' ');

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  workspaceTypeLabel(workspace: WorkspaceModel): string {
    return workspace.isPersonal ? 'Personal' : 'Team';
  }

  workspaceRoleLabel(workspace: WorkspaceModel): string {
    const record = workspace as unknown as UnknownRecord;
    const access = record['access'];

    let role = 'MEMBER';

    if (access && typeof access === 'object') {
      const accessRecord = access as UnknownRecord;

      role = accessRecord['isOwner']
        ? 'OWNER'
        : String(accessRecord['type'] ?? 'MEMBER');
    } else if (record['isOwner']) {
      role = 'OWNER';
    } else if (record['accessRole']) {
      role = String(record['accessRole']);
    }

    const normalized = role.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  workspaceNoteCount(workspace: WorkspaceModel): number {
    const record = workspace as unknown as UnknownRecord;
    const value = record['noteCount'] ?? record['notesCount'] ?? record['stickyNoteCount'];

    return typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, value)
      : 0;
  }

  workspaceMemberCount(workspace: WorkspaceModel): number {
    const record = workspace as unknown as UnknownRecord;
    const count = record['memberCount'] ?? record['membersCount'];

    if (typeof count === 'number' && Number.isFinite(count)) {
      return Math.max(0, count);
    }

    const members = record['members'];
    return Array.isArray(members) && members.length ? members.length : 1;
  }

  workspaceUpdatedLabel(workspace: WorkspaceModel): string {
    const value = workspace.updatedAt ?? workspace.createdAt;
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

    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  }

  workspaceTheme(workspace: WorkspaceModel): {
    variant: CardVariant;
    icon: AppIconDefinition;
  } {
    const themes: readonly {
      variant: CardVariant;
      icon: AppIconDefinition;
    }[] = [
        { variant: 'noteYellow', icon: LucideLightbulb },
        { variant: 'noteBlue', icon: LucideFolder },
        { variant: 'notePink', icon: LucideMegaphone },
        { variant: 'noteGreen', icon: LucideUsers },
        { variant: 'notePurple', icon: LucideFolder },
        { variant: 'noteOrange', icon: LucideLightbulb }
      ];

    const score = [...workspace.name].reduce(
      (total, character) => total + character.charCodeAt(0),
      0
    );

    return themes[score % themes.length];
  }

  isActive(workspace: WorkspaceModel): boolean {
    return workspace.status === 'ACTIVE';
  }

  isArchived(workspace: WorkspaceModel): boolean {
    return workspace.status === 'ARCHIVED';
  }

  isDeleted(workspace: WorkspaceModel): boolean {
    return workspace.status === 'DELETED';
  }

  isBusy(workspace: WorkspaceModel): boolean {
    return this.busyIds().has(workspace.id);
  }

  private updateWorkspaceStatus(
    workspace: WorkspaceModel,
    status: WorkspaceStatus
  ): void {
    const id = workspace.id;
    this.setWorkspaceBusy(id, true);

    this.workspaceApi
      .updateStatus(id, status)
      .pipe(
        finalize(() => this.setWorkspaceBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.workspaceChanged.emit(response.data);

          const archived = status === 'ARCHIVED';
          this.toastService.success(
            archived
              ? `“${workspace.name}” was archived.`
              : `“${workspace.name}” is active again.`,
            {
              title: archived ? 'Workspace archived' : 'Workspace restored',
              dedupeKey: archived
                ? 'workspace-archive-success'
                : 'workspace-restore-success'
            }
          );

          this.loadWorkspaces();
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to update workspace.');

          this.toastService.error(message, {
            title: 'Workspace update failed',
            dedupeKey: 'workspace-status-error'
          });
        }
      });
  }

  private setWorkspaceBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());

    if (busy) {
      next.add(id);
    } else {
      next.delete(id);
    }

    this.busyIds.set(next);
  }

  private clearWorkspaceClickTimer(): void {
    if (this.workspaceClickTimer === null) return;

    clearTimeout(this.workspaceClickTimer);
    this.workspaceClickTimer = null;
  }

  private focusInlineRename(): void {
    setTimeout(() => {
      const input = this.renameInputs?.first?.nativeElement;
      input?.focus();
      input?.select();
    });
  }

  private workspaceTimestamp(
    workspace: WorkspaceModel,
    field: 'createdAt' | 'updatedAt'
  ): number {
    const value = workspace[field];
    if (!value) return 0;

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private extractWorkspaces(
    response: PaginatedApiResponse<WorkspaceModel>
  ): readonly WorkspaceModel[] {
    const data = response.data as unknown;

    if (Array.isArray(data)) {
      return data as WorkspaceModel[];
    }

    if (!data || typeof data !== 'object') {
      return [];
    }

    const record = data as UnknownRecord;
    const candidates = [
      record['items'],
      record['workspaces'],
      record['docs'],
      record['results']
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate as WorkspaceModel[];
      }
    }

    return [];
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback;

    const record = error as UnknownRecord;
    const nestedError = record['error'];

    if (nestedError && typeof nestedError === 'object') {
      const message = (nestedError as UnknownRecord)['message'];

      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    const message = record['message'];
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
