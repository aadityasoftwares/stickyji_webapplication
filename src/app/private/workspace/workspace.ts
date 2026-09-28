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
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideArchive,
  LucideArrowRight,
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
  LucideX,
} from '@lucide/angular';
import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Input as AppInput } from '../../shared/components/input/input';
import { Loader } from '../../shared/components/loader/loader';
import { Select } from '../../shared/components/select/select';
import { Tabs } from '../../shared/components/tabs/tabs';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { MembersStack } from '../workspace-members/members-stack/members-stack';
import { Router } from '@angular/router';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceStore } from './services/workspace.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { USER_PREFERENCE_KEYS } from '../../shared/constants/common.constants';
import { AddEditWorkspaceSidePanel } from './add-edit-workspace-side-panel/add-edit-workspace-side-panel';
import { WorkspaceFolderWrapper } from './workspace-folder-wrapper/workspace-folder-wrapper';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    FormsModule,
    WorkspaceFolderWrapper,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Loader,
    AddEditWorkspaceSidePanel,
    Select,
    StickyCard,
    Tabs,
    MembersStack,
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Workspace implements OnInit {
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  @ViewChildren('renameInput')
  private renameInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private workspaceClickTimer: ReturnType<typeof setTimeout> | null = null;

  @Output() readonly workspaceOpened = new EventEmitter<any>();
  @Output() readonly workspaceCreated = new EventEmitter<any>();
  @Output() readonly workspaceChanged = new EventEmitter<any>();

  readonly LucideArchive = LucideArchive;
  readonly LucideArrowRight = LucideArrowRight;
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

  readonly sortOptions: any[] = [
    { label: 'Recently updated', value: 'updatedAt' },
    { label: 'Recently created', value: 'createdAt' },
    { label: 'Name A–Z', value: 'name' },
  ];

  readonly viewTabs: any[] = [
    {
      value: 'grid',
      label: 'Grid',
      icon: LucideGrid2X2,
      ariaLabel: 'Show workspaces in grid view',
    },
    {
      value: 'list',
      label: 'List',
      icon: LucideList,
      ariaLabel: 'Show workspaces in list view',
    },
  ];

  readonly workspaces = signal<any[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<'all' | 'active' | 'archived'>('all');
  readonly view = signal<'grid' | 'list'>('grid');
  readonly sortBy = signal<'updatedAt' | 'createdAt' | 'name'>('updatedAt');
  readonly searchTerm = signal('');
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  readonly workspaceEditorOpen = signal(false);
  readonly workspaceEditorId = signal('');
  readonly editorWorkspace = computed(() =>
    this.workspaces().find((item: any) => item.id === this.workspaceEditorId()) ?? null
  );

  readonly inlineRenameId = signal<string | null>(null);
  readonly inlineRenameName = signal('');
  readonly inlineRenameError = signal<string | null>(null);
  readonly savingInlineRename = signal(false);

  readonly deleteTarget = signal<any | null>(null);
  readonly deleting = signal(false);

  readonly totalCount = computed(() =>
    this.workspaces().filter((workspace: any) => !this.isDeleted(workspace)).length
  );

  readonly activeCount = computed(() =>
    this.workspaces().filter((workspace: any) => this.isActive(workspace)).length
  );

  readonly archivedCount = computed(() =>
    this.workspaces().filter((workspace: any) => this.isArchived(workspace)).length
  );

  readonly workspaceTabs = computed<any[]>(() => [
    {
      value: 'all',
      label: 'All',
      count: this.totalCount(),
      icon: LucideFolder,
      ariaLabel: 'All workspaces',
    },
    {
      value: 'active',
      label: 'Active',
      count: this.activeCount(),
      icon: LucideLightbulb,
      ariaLabel: 'Active workspaces',
    },
    {
      value: 'archived',
      label: 'Archived',
      count: this.archivedCount(),
      icon: LucideArchive,
      ariaLabel: 'Archived workspaces',
    },
  ]);

  readonly visibleWorkspaces = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    return [...this.workspaces()]
      .filter((workspace: any) => {
        if (this.isDeleted(workspace)) return false;
        if (tab === 'active' && !this.isActive(workspace)) return false;
        if (tab === 'archived' && !this.isArchived(workspace)) return false;
        if (!search) return true;

        return [
          workspace?.name,
          workspace?.description ?? '',
          workspace?.slug,
          this.workspaceTypeLabel(workspace),
          this.workspaceVisibility(workspace),
        ].some(value => String(value ?? '').toLowerCase().includes(search));
      })
      .sort((first: any, second: any) => {
        if (sort === 'name') {
          return String(first?.name ?? '').localeCompare(
            String(second?.name ?? ''),
            undefined,
            { sensitivity: 'base' },
          );
        }

        return (
          this.workspaceTimestamp(second, sort) -
          this.workspaceTimestamp(first, sort)
        );
      });
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearWorkspaceClickTimer());
  }

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(savedId = '', created = false): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const payload: any = {
      page: 1,
      limit: 100,
      sortBy: this.sortBy(),
      sortOrder: 'desc',
    };

    this.workspaceApi
      .getAllWorkspaces(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          const workspaces = this.extractWorkspaces(response);
          this.workspaces.set(workspaces);
          this.workspaceStore.setWorkspaces(workspaces);

          if (!savedId) return;

          const savedWorkspace = workspaces.find(
            (workspace: any) => workspace?.id === savedId,
          );

          if (!savedWorkspace) return;

          if (created) {
            this.workspaceCreated.emit(savedWorkspace);
          } else {
            this.workspaceChanged.emit(savedWorkspace);
          }
        },
        error: (error: any) => {
          this.workspaces.set([]);
          const message = this.errorMessage(
            error,
            'Unable to load workspaces.',
          );

          this.error.set(message);
          this.toastService.error(message, {
            title: 'Could not load workspaces',
            dedupeKey: 'workspace-load-error',
          });
        },
      });
  }

  refreshWorkspaces(): void {
    this.loadWorkspaces();
  }

  setWorkspaceTab(value: any): void {
    if (value === 'all' || value === 'active' || value === 'archived') {
      this.activeTab.set(value);
    }
  }

  setWorkspaceView(value: any): void {
    if (value === 'grid' || value === 'list') {
      this.view.set(value);
    }
  }

  updateSearch(value: any): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(value: any): void {
    if (value === null || Array.isArray(value)) return;

    if (value === 'updatedAt' || value === 'createdAt' || value === 'name') {
      this.sortBy.set(value);
    }
  }

  openWorkspace(workspace: any): void {
    if (!workspace?.id || this.isBusy(workspace)) return;
    this.workspaceStore.select(workspace.id);
    this.userPreferenceStore.setAndSave(
      USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID,
      workspace.id
    );
    this.workspaceOpened.emit(workspace);
    this.router.navigate(['/app/workspacefolders/my']);
  }

  handleWorkspaceClick(workspace: any, event: MouseEvent): void {
    event.stopPropagation();

    if (this.isBusy(workspace) || this.isInlineRenaming(workspace)) {
      return;
    }

    this.clearWorkspaceClickTimer();

    this.workspaceClickTimer = setTimeout(() => {
      this.workspaceClickTimer = null;
      this.openWorkspace(workspace);
    }, 280);
  }

  handleWorkspaceDoubleClick(workspace: any, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.clearWorkspaceClickTimer();
    this.openEditEditor(workspace);
  }

  openCreateEditor(): void {
    this.cancelInlineRename();
    this.workspaceEditorId.set('');
    this.workspaceEditorOpen.set(true);
  }

  openEditEditor(workspace: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!workspace?.id || this.isBusy(workspace)) return;

    this.clearWorkspaceClickTimer();
    this.cancelInlineRename();
    this.workspaceEditorId.set(workspace.id);
    this.workspaceEditorOpen.set(true);
  }

  closeWorkspaceEditor(): void {
    this.workspaceEditorOpen.set(false);
    this.workspaceEditorId.set('');
  }

  onWorkspaceSaved(id: string): void {
    const created = !this.workspaceEditorId();

    this.closeWorkspaceEditor();

    if (created) {
      this.activeTab.set('active');
    }

    this.loadWorkspaces(id, created);
  }

  beginInlineRename(workspace: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!workspace?.id || this.isBusy(workspace) || this.savingInlineRename()) {
      return;
    }

    this.clearWorkspaceClickTimer();
    this.inlineRenameId.set(workspace.id);
    this.inlineRenameName.set(String(workspace.name ?? ''));
    this.inlineRenameError.set(null);
    this.focusInlineRename();
  }

  isInlineRenaming(workspace: any): boolean {
    return this.inlineRenameId() === workspace?.id;
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

  saveInlineRename(workspace: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.isInlineRenaming(workspace) || this.savingInlineRename()) {
      return;
    }

    const name = this.inlineRenameName().trim();

    if (name.length < 2) {
      this.inlineRenameError.set('Enter at least 2 characters.');
      this.focusInlineRename();
      return;
    }

    if (name.length > 100) {
      this.inlineRenameError.set('Workspace name cannot be longer than 100 characters.');
      this.focusInlineRename();
      return;
    }

    if (name === String(workspace?.name ?? '').trim()) {
      this.cancelInlineRename();
      return;
    }

    const id = String(workspace?.id ?? '').trim();

    if (!id) return;

    this.savingInlineRename.set(true);
    this.setWorkspaceBusy(id, true);

    this.workspaceApi
      .update(id, { name })
      .pipe(
        finalize(() => {
          this.savingInlineRename.set(false);
          this.setWorkspaceBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          const updatedWorkspace = response?.data;

          if (!updatedWorkspace?.id) {
            this.inlineRenameError.set('Workspace response is invalid.');
            return;
          }

          this.workspaces.update((items: any[]) =>
            items.map((item: any) =>
              item?.id === id
                ? {
                  ...item,
                  ...updatedWorkspace,
                  summary: item?.summary ?? updatedWorkspace?.summary,
                }
                : item
            )
          );

          const localWorkspace =
            this.workspaces().find((item: any) => item?.id === id) ??
            updatedWorkspace;

          this.workspaceChanged.emit(localWorkspace);
          this.inlineRenameId.set(null);
          this.inlineRenameName.set('');
          this.inlineRenameError.set(null);

          this.toastService.success(
            `Workspace renamed to “${updatedWorkspace.name}”.`,
            {
              title: 'Name updated',
              dedupeKey: 'workspace-inline-rename-success',
            },
          );
        },
        error: (error: any) => {
          const message = this.errorMessage(
            error,
            'Unable to rename workspace.',
          );

          this.inlineRenameError.set(message);
          this.toastService.error(message, {
            title: 'Rename failed',
            dedupeKey: 'workspace-inline-rename-error',
          });
          this.focusInlineRename();
        },
      });
  }

  archiveWorkspace(workspace: any): void {
    this.updateWorkspaceStatus(workspace, 'ARCHIVED');
  }

  activateWorkspace(workspace: any): void {
    this.updateWorkspaceStatus(workspace, 'ACTIVE');
  }

  requestDelete(workspace: any): void {
    if (!workspace?.id || this.isBusy(workspace)) return;
    this.deleteTarget.set(workspace);
  }

  closeDeleteDialog(): void {
    if (!this.deleting()) {
      this.deleteTarget.set(null);
    }
  }

  confirmDelete(): void {
    const workspace = this.deleteTarget();

    if (!workspace?.id || this.deleting()) return;

    const id = String(workspace.id);
    this.deleting.set(true);
    this.setWorkspaceBusy(id, true);

    this.workspaceApi
      .delete(id)
      .pipe(
        finalize(() => {
          this.deleting.set(false);
          this.setWorkspaceBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);

          this.toastService.success(
            `“${this.workspaceName(workspace)}” was moved to trash.`,
            {
              title: 'Workspace moved',
              dedupeKey: 'workspace-delete-success',
            },
          );

          this.loadWorkspaces();
        },
        error: (error: any) => {
          this.deleteTarget.set(null);

          const message = this.errorMessage(
            error,
            'Unable to move workspace to trash.',
          );

          this.toastService.error(message, {
            title: 'Could not move workspace',
            dedupeKey: 'workspace-delete-error',
          });
        },
      });
  }

  workspaceId(workspace: any): string {
    return String(workspace?.id ?? workspace?._id ?? '').trim();
  }

  workspaceName(workspace: any): string {
    return String(workspace?.name ?? '').trim() || 'Untitled workspace';
  }

  workspaceDescription(workspace: any): string {
    const description = String(workspace?.description ?? '').trim();

    if (description) return description;

    return workspace?.isPersonal
      ? 'Your personal workspace'
      : 'Shared team workspace';
  }

  workspaceVisibility(workspace: any): string {
    const value = String(workspace?.visibility ?? 'PRIVATE')
      .toLowerCase()
      .replaceAll('_', ' ');

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  workspaceTypeLabel(workspace: any): string {
    return workspace?.isPersonal ? 'Personal' : 'Team';
  }

  workspaceRoleLabel(workspace: any): string {
    const access = workspace?.access;
    let role = 'MEMBER';

    if (access && typeof access === 'object') {
      role = access?.isOwner
        ? 'OWNER'
        : String(access?.type ?? access?.role ?? 'MEMBER');
    } else if (workspace?.isOwner) {
      role = 'OWNER';
    } else if (workspace?.accessRole) {
      role = String(workspace.accessRole);
    }

    const normalized = role.toLowerCase().replaceAll('_', ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  workspaceFolderCount(workspace: any): number {
    const value =
      workspace?.summary?.folderCount ??
      workspace?.folderCount ??
      0;

    const count = Number(value);
    return Number.isFinite(count) && count > 0 ? count : 0;
  }

  workspaceMemberCount(workspace: any): number {
    const members = this.workspaceMembers(workspace);
    const value =
      workspace?.summary?.memberCount ??
      workspace?.memberCount ??
      members.length;

    const count = Number(value);
    return Number.isFinite(count) && count > 0
      ? count
      : members.length;
  }

  workspaceMembers(workspace: any): any[] {
    const source = Array.isArray(workspace?.summary?.members)
      ? workspace.summary.members
      : Array.isArray(workspace?.members)
        ? workspace.members
        : [];

    return source
      .map((member: any, index: number) => {
        const user = member?.user ?? member;
        const id = String(
          user?.id ??
          user?._id ??
          member?.userId ??
          member?.id ??
          `${this.workspaceId(workspace)}-member-${index}`,
        ).trim();

        const email = String(
          user?.email ??
          member?.email ??
          '',
        ).trim();

        const name = String(
          user?.displayName ??
          user?.name ??
          member?.displayName ??
          member?.name ??
          (email ? email.split('@')[0] : '') ??
          '',
        ).trim() || 'Workspace member';

        const role = String(
          member?.role?.name ??
          member?.role?.displayName ??
          member?.role ??
          member?.roleName ??
          (member?.isOwner ? 'Owner' : 'Member'),
        ).trim();

        const src =
          this.resolveMemberImage(user) ??
          this.resolveMemberImage(member);

        return {
          id,
          name,
          src,
          alt: name,
          tooltip: role
            ? `${name} · ${role}`
            : name,
        };
      })
      .filter((member: any) => !!member.id);
  }

  workspaceUpdatedLabel(workspace: any): string {
    const value = workspace?.updatedAt ?? workspace?.createdAt;

    if (!value) return 'Recently';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }

    const minutes = Math.max(
      0,
      Math.floor(
        (Date.now() - date.getTime()) /
        60_000,
      ),
    );

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  workspaceTheme(workspace: any): any {
    const themes: any[] = [
      { variant: 'noteYellow', icon: LucideLightbulb },
      { variant: 'noteBlue', icon: LucideFolder },
      { variant: 'notePink', icon: LucideMegaphone },
      { variant: 'noteGreen', icon: LucideUsers },
      { variant: 'notePurple', icon: LucideFolder },
      { variant: 'noteOrange', icon: LucideLightbulb },
    ];

    const name = this.workspaceName(workspace);
    const score = [...name].reduce(
      (total, character) =>
        total + character.charCodeAt(0),
      0,
    );

    return themes[score % themes.length];
  }

  isActive(workspace: any): boolean {
    return workspace?.status === 'ACTIVE';
  }

  isArchived(workspace: any): boolean {
    return workspace?.status === 'ARCHIVED';
  }

  isDeleted(workspace: any): boolean {
    return workspace?.status === 'DELETED';
  }

  isBusy(workspace: any): boolean {
    const id = this.workspaceId(workspace);
    return !!id && this.busyIds().has(id);
  }

  private updateWorkspaceStatus(workspace: any, status: any): void {
    const id = this.workspaceId(workspace);

    if (!id || this.isBusy(workspace)) return;

    this.setWorkspaceBusy(id, true);

    this.workspaceApi
      .updateStatus(id, status)
      .pipe(
        finalize(() =>
          this.setWorkspaceBusy(
            id,
            false,
          )
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          const updatedWorkspace = response?.data;

          if (updatedWorkspace?.id) {
            this.workspaces.update((items: any[]) =>
              items.map((item: any) =>
                item?.id === id
                  ? {
                    ...item,
                    ...updatedWorkspace,
                    summary:
                      item?.summary ??
                      updatedWorkspace?.summary,
                  }
                  : item
              )
            );

            this.workspaceChanged.emit(
              this.workspaces().find(
                (item: any) =>
                  item?.id === id,
              ) ?? updatedWorkspace,
            );
          }

          const archived = status === 'ARCHIVED';

          this.toastService.success(
            archived
              ? `“${this.workspaceName(workspace)}” was archived.`
              : `“${this.workspaceName(workspace)}” is active again.`,
            {
              title: archived
                ? 'Workspace archived'
                : 'Workspace restored',
              dedupeKey: archived
                ? 'workspace-archive-success'
                : 'workspace-restore-success',
            },
          );

          this.loadWorkspaces();
        },
        error: (error: any) => {
          const message = this.errorMessage(
            error,
            'Unable to update workspace.',
          );

          this.toastService.error(message, {
            title: 'Workspace update failed',
            dedupeKey: 'workspace-status-error',
          });
        },
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

  private workspaceTimestamp(workspace: any, field: string): number {
    const value = workspace?.[field];

    if (!value) return 0;

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private extractWorkspaces(response: any): any[] {
    const data = response?.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (!data || typeof data !== 'object') {
      return [];
    }

    const candidates = [
      data?.items,
      data?.workspaces,
      data?.docs,
      data?.results,
      data?.data,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }

  private resolveMemberImage(value: any): string | null {
    const profile = value?.profile;

    const image =
      value?.src ??
      value?.avatarUrl ??
      value?.avatar ??
      value?.profileImage ??
      value?.imageUrl ??
      profile?.avatarUrl ??
      profile?.profileImage ??
      profile?.imageUrl;

    return typeof image === 'string' && image.trim()
      ? image.trim()
      : null;
  }

  private errorMessage(error: any, fallback: string): string {
    const candidates = [
      error?.error?.message,
      error?.error?.error?.message,
      error?.message,
    ];

    for (const value of candidates) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    if (error?.status === 0) {
      return 'Unable to connect to the server. Please check your connection and try again.';
    }

    if (error?.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (error?.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error?.status === 404) {
      return 'The requested workspace could not be found.';
    }

    if (error?.status >= 500) {
      return 'The server could not complete the request. Please try again.';
    }

    return fallback;
  }
}
