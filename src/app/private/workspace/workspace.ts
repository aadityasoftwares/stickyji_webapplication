import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import {
  LucideArchive,
  LucideArrowRight,
  LucideCalendarDays,
  LucideFolder,
  LucideGlobe,
  LucideLightbulb,
  LucideLock,
  LucideMegaphone,
  LucideMoreHorizontal,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideShield,
  LucideTrash2,
  LucideUsers,
  LucideX,
} from '@lucide/angular';

import { AppIcon } from '../../shared/components/icon/icon';
import { Input as AppInput } from '../../shared/components/input/input';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Loader } from '../../shared/components/loader/loader';
import { Select } from '../../shared/components/select/select';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { TabItem, Tabs } from '../../shared/components/tabs/tabs';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { WORKSPACE_MESSAGES } from './messages/workspace.messages';
import { APP_ROUTES, routeCommands } from '../../shared/constants/route.constants';
import { MembersStack } from '../workspace-members/members-stack/members-stack';
import { WorkspaceFolderWrapper } from './workspace-folder-wrapper/workspace-folder-wrapper';
import { AddEditWorkspaceSidePanel } from './add-edit-workspace-side-panel/add-edit-workspace-side-panel';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceStore } from './services/workspace.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import {
  SORT_OPTIONS,
  USER_PREFERENCE_KEYS,
  VIEW_TABS,
  buildStatusTabs,
} from '../../shared/constants/common.constants';
import {
  entityNameOf,
  extractErrorMessage,
  extractList,
  idOf,
} from '../../shared/functions/common.function';
import {
  getWorkspaceMemberAvatar,
  getWorkspaceMemberId,
  getWorkspaceMemberName,
  getWorkspaceMemberRole,
} from '../../shared/functions/workspace-member.function';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatDividerModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Loader,
    AddEditWorkspaceSidePanel,
    Select,
    StickyCard,
    Tabs,
    WorkspaceFolderWrapper,
  ],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Workspace implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly toastService = inject(ToastService);

  readonly LucideArchive = LucideArchive;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideFolder = LucideFolder;
  readonly LucideGlobe = LucideGlobe;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideShield = LucideShield;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;

  private readonly renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  readonly workspaces = signal<any[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly activeTab = signal<'all' | 'active' | 'archived'>('all');
  readonly sortBy = signal<'recent' | 'name-asc' | 'name-desc' | 'oldest'>('recent');
  readonly view = signal<'grid' | 'list'>('grid');

  readonly workspaceEditorOpen = signal(false);
  readonly workspaceEditorId = signal<string>('');
  readonly editorWorkspace = computed(() => {
    const id = this.workspaceEditorId();
    return id ? this.workspaces().find((item) => idOf(item) === id) ?? null : null;
  });

  readonly inlineRenameId = signal<string | null>(null);
  readonly inlineRenameName = signal('');
  readonly inlineRenameError = signal<string | null>(null);
  readonly inlineRenameSubmitting = signal(false);

  readonly deleteTarget = signal<any | null>(null);
  readonly deleting = signal(false);
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  readonly sortOptions = SORT_OPTIONS;
  readonly viewTabs = VIEW_TABS;

  readonly totalCount = computed(() => this.workspaces().length);

  readonly workspaceTabs = computed<TabItem[]>(() => {
    const list = this.workspaces();
    return buildStatusTabs({
      all: list.length,
      active: list.filter((item) => item?.status === 'ACTIVE').length,
      archived: list.filter((item) => item?.status === 'ARCHIVED').length,
    });
  });

  readonly visibleWorkspaces = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const tab = this.activeTab();
    const sort = this.sortBy();

    const filtered = this.workspaces().filter((item) => {
      const status = String(item?.status ?? 'ACTIVE');
      if (tab === 'active' && status !== 'ACTIVE') return false;
      if (tab === 'archived' && status !== 'ARCHIVED') return false;
      if (!query) return true;

      const name = this.workspaceName(item).toLowerCase();
      const description = this.workspaceDescription(item).toLowerCase();
      const role = this.workspaceRoleLabel(item).toLowerCase();
      const visibility = this.workspaceVisibility(item).toLowerCase();

      return (
        name.includes(query) ||
        description.includes(query) ||
        role.includes(query) ||
        visibility.includes(query)
      );
    });

    return [...filtered].sort((first, second) => {
      if (sort === 'name-asc') {
        return this.workspaceName(first).localeCompare(this.workspaceName(second));
      }
      if (sort === 'name-desc') {
        return this.workspaceName(second).localeCompare(this.workspaceName(first));
      }
      const firstDate = this.workspaceTimestamp(first);
      const secondDate = this.workspaceTimestamp(second);
      return sort === 'oldest' ? firstDate - secondDate : secondDate - firstDate;
    });
  });

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(savedId = ''): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    this.workspaceApi
      .getAllWorkspaces({ page: 1, limit: 100 })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const list = extractList(response).map((item) => this.prepareWorkspace(item));
          this.workspaces.set(list);
          this.workspaceStore.setWorkspaces(list as any);

          if (savedId) {
            this.workspaceStore.select(savedId);
          }
        },
        error: (error: any) => {
          const message = extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.LOAD_FAILED);
          this.error.set(message);
          this.toastService.error(message, {
            title: 'Failed to load workspaces',
            dedupeKey: 'workspace-load-error',
          });
        },
      });
  }

  onRefresh(): void {
    this.loadWorkspaces();
  }

  onSearch(value: any): void {
    this.searchTerm.set(String(value ?? ''));
  }

  onClearSearch(): void {
    this.searchTerm.set('');
  }

  onStatusChange(value: any): void {
    if (value === 'all' || value === 'active' || value === 'archived') {
      this.activeTab.set(value);
    }
  }

  onSortChange(value: any): void {
    if (value) {
      this.sortBy.set(value);
    }
  }

  onViewChange(value: any): void {
    if (value === 'grid' || value === 'list') {
      this.view.set(value);
    }
  }

  setWorkspaceTab(value: any): void {
    this.onStatusChange(value);
  }

  setWorkspaceView(value: any): void {
    this.onViewChange(value);
  }

  updateSearch(value: any): void {
    this.onSearch(value);
  }

  clearSearch(): void {
    this.onClearSearch();
  }

  setSort(value: any): void {
    this.onSortChange(value);
  }

  openCreateEditor(): void {
    this.workspaceEditorId.set('');
    this.workspaceEditorOpen.set(true);
  }

  openEditEditor(workspace: any, event?: Event): void {
    event?.stopPropagation();
    const id = idOf(workspace);
    if (!id || this.isBusy(workspace)) return;

    this.workspaceEditorId.set(id);
    this.workspaceEditorOpen.set(true);
  }

  closeWorkspaceEditor(): void {
    this.workspaceEditorOpen.set(false);
    this.workspaceEditorId.set('');
  }

  onWorkspaceSaved(savedWorkspace: any): void {
    if (!savedWorkspace) {
      this.closeWorkspaceEditor();
      return;
    }

    const savedId = idOf(savedWorkspace);
    this.closeWorkspaceEditor();
    this.loadWorkspaces(savedId);
  }

  handleWorkspaceClick(workspace: any, event?: MouseEvent): void {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('button, input, a, .mat-mdc-menu-panel, .mat-mdc-menu-item')) return;
    if (this.isInlineRenaming(workspace) || this.isBusy(workspace)) return;

    const id = idOf(workspace);
    if (!id) return;

    this.workspaceStore.select(id);
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID, id);
  }

  handleWorkspaceDoubleClick(workspace: any, event?: MouseEvent): void {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('button, input, a, .mat-mdc-menu-panel, .mat-mdc-menu-item')) return;

    this.beginInlineRename(workspace, event);
  }

  openWorkspace(workspace: any): void {
    const id = idOf(workspace);
    if (!id || this.isBusy(workspace)) return;

    this.workspaceStore.select(id);
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID, id);
    this.router.navigate(routeCommands(APP_ROUTES.WORKSPACE_FOLDERS));
  }

  beginInlineRename(workspace: any, event?: Event): void {
    event?.stopPropagation();
    if (this.isBusy(workspace)) return;

    this.inlineRenameId.set(idOf(workspace));
    this.inlineRenameName.set(this.workspaceName(workspace));
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
    if (this.inlineRenameError()) {
      this.inlineRenameError.set(null);
    }
  }

  cancelInlineRename(event?: Event): void {
    event?.stopPropagation();
    this.inlineRenameId.set(null);
    this.inlineRenameName.set('');
    this.inlineRenameError.set(null);
    this.inlineRenameSubmitting.set(false);
  }

  saveInlineRename(workspace: any, event?: Event): void {
    event?.stopPropagation();
    const id = idOf(workspace);
    if (!id || this.inlineRenameId() !== id) return;
    if (this.inlineRenameSubmitting()) return;

    const trimmed = this.inlineRenameName().trim();
    const original = this.workspaceName(workspace);

    if (!trimmed) {
      this.inlineRenameError.set('Workspace name cannot be empty');
      return;
    }

    if (trimmed === original) {
      this.cancelInlineRename();
      return;
    }

    this.inlineRenameSubmitting.set(true);
    this.inlineRenameError.set(null);

    this.workspaceApi
      .update(id, { name: trimmed })
      .pipe(
        finalize(() => this.inlineRenameSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const updated = response?.data || { ...workspace, name: trimmed };
          this.cancelInlineRename();

          this.workspaces.update((items) =>
            items.map((item) =>
              idOf(item) === id ? this.prepareWorkspace({ ...item, ...updated, name: trimmed }) : item
            )
          );
          this.workspaceStore.updateWorkspace(id, { name: trimmed } as any);

          this.toastService.success(WORKSPACE_MESSAGES.SUCCESS.RENAMED, {
            title: 'Workspace updated',
            dedupeKey: `workspace-rename-${id}`,
          });
        },
        error: (error: any) => {
          const message = extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.RENAME_FAILED);
          this.inlineRenameError.set(message);
          this.toastService.error(message, {
            title: 'Rename failed',
            dedupeKey: 'workspace-rename-error',
          });
        },
      });
  }

  archiveWorkspace(workspace: any): void {
    this.updateWorkspaceStatus(workspace, 'ARCHIVED');
  }

  activateWorkspace(workspace: any): void {
    this.updateWorkspaceStatus(workspace, 'ACTIVE');
  }

  restoreWorkspace(workspace: any): void {
    this.updateWorkspaceStatus(workspace, 'ACTIVE');
  }

  requestDelete(workspace: any): void {
    if (this.isBusy(workspace)) return;
    this.deleteTarget.set(workspace);
  }

  closeDeleteDialog(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const workspace = this.deleteTarget();
    const id = idOf(workspace);
    if (!id || this.deleting()) return;

    this.deleting.set(true);
    this.setBusy(id, true);

    this.workspaceApi
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
          this.deleteTarget.set(null);
          this.workspaces.update((items) => items.filter((item) => idOf(item) !== id));
          this.workspaceStore.remove(id);

          this.toastService.success(WORKSPACE_MESSAGES.SUCCESS.MOVED_TO_TRASH(this.workspaceName(workspace)), {
            title: 'Workspace moved to trash',
            dedupeKey: `workspace-delete-${id}`,
          });
        },
        error: (error: any) => {
          const message = extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.MOVE_TO_TRASH_FAILED);
          this.toastService.error(message, {
            title: 'Could not move workspace',
            dedupeKey: 'workspace-delete-error',
          });
        },
      });
  }

  workspaceId(workspace: any): string {
    return idOf(workspace);
  }

  workspaceName(workspace: any): string {
    return entityNameOf(workspace, 'Untitled workspace');
  }

  workspaceDescription(workspace: any): string {
    const description = String(workspace?.description ?? '').trim();
    if (description) return description;
    return workspace?.isPersonal ? 'Your personal workspace' : 'Shared team workspace';
  }

  workspaceVisibility(workspace: any): string {
    const value = String(workspace?.visibility ?? 'PRIVATE').toLowerCase().replaceAll('_', ' ');
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  workspaceTypeLabel(workspace: any): string {
    return workspace?.isPersonal ? 'Personal' : 'Team';
  }

  workspaceRoleLabel(workspace: any): string {
    const access = workspace?.access;
    let role = 'MEMBER';

    if (access && typeof access === 'object') {
      role = access?.isOwner ? 'OWNER' : String(access?.type ?? access?.role ?? 'MEMBER');
    } else if (workspace?.isOwner) {
      role = 'OWNER';
    } else if (workspace?.accessRole) {
      role = String(workspace.accessRole);
    }

    const normalized = role.toLowerCase().replaceAll('_', ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  workspaceFolderCount(workspace: any): number {
    if (typeof workspace?._folderCount === 'number') return workspace._folderCount;
    const value =
      workspace?.summary?.folderCount ??
      workspace?.folderCount ??
      workspace?.foldersCount ??
      (Array.isArray(workspace?.folders) ? workspace.folders.length : 0);
    const count = Number(value);
    return Number.isFinite(count) && count > 0 ? count : 0;
  }

  folderCountLabel(workspace: any): string {
    if (workspace?._folderCountLabel) return workspace._folderCountLabel;
    const count = this.workspaceFolderCount(workspace);
    return `${count} ${count === 1 ? 'folder' : 'folders'}`;
  }

  workspaceMemberCount(workspace: any, membersList?: any[]): number {
    if (typeof workspace?._memberCount === 'number') return workspace._memberCount;
    const raw = workspace?.summary?.memberCount ?? workspace?.memberCount;
    if (raw !== undefined && raw !== null && Number.isFinite(Number(raw))) {
      return Math.max(0, Number(raw));
    }
    const members = membersList ?? this.workspaceMembers(workspace);
    return members.length;
  }

  memberCountLabel(workspace: any): string {
    if (workspace?._memberCountLabel) return workspace._memberCountLabel;
    const count = this.workspaceMemberCount(workspace);
    return `${count} ${count === 1 ? 'member' : 'members'}`;
  }

  workspaceMembers(workspace: any): any[] {
    if (workspace?._members) return workspace._members;

    const source = Array.isArray(workspace?.summary?.members)
      ? workspace.summary.members
      : Array.isArray(workspace?.members)
        ? workspace.members
        : [];

    const mapped = source
      .map((member: any) => {
        const id = getWorkspaceMemberId(member);
        const name = getWorkspaceMemberName(member);
        const role = getWorkspaceMemberRole(member);
        const src = getWorkspaceMemberAvatar(member);

        return {
          id,
          name,
          src,
          alt: name,
          tooltip: role ? `${name} · ${role}` : name,
        };
      })
      .filter((member: any) => !!member.id);

    if (mapped.length > 0) return mapped;

    if (workspace?.ownerId && typeof workspace.ownerId === 'object') {
      const owner = workspace.ownerId;
      const name = getWorkspaceMemberName({ user: owner }, 'Owner');
      const src = getWorkspaceMemberAvatar({ user: owner });
      const id = idOf(owner) || `${idOf(workspace)}-owner`;

      return [{
        id,
        name,
        src,
        alt: name,
        tooltip: `${name} · Owner`,
      }];
    }

    return [];
  }

  workspaceDateLabel(workspace: any): string {
    if (workspace?._dateLabel) return workspace._dateLabel;
    const value = workspace?.updatedAt ?? workspace?.createdAt;
    if (!value) return 'Not saved yet';

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Date unavailable'
      : new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
  }

  workspaceStatusLabel(workspace: any): string {
    if (workspace?._statusLabel) return workspace._statusLabel;
    const status = String(workspace?.status ?? 'ACTIVE');
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  visibilityIcon(workspace: any) {
    return this.workspaceVisibility(workspace) === 'Public' ? LucideGlobe : LucideLock;
  }

  prepareWorkspace(workspace: any): any {
    const members = this.workspaceMembers(workspace);
    const folderCount = this.workspaceFolderCount(workspace);
    const memberCount = this.workspaceMemberCount(workspace, members);

    return {
      ...workspace,
      _members: members,
      _folderCount: folderCount,
      _folderCountLabel: `${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}`,
      _memberCount: memberCount,
      _memberCountLabel: `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`,
      _dateLabel: this.workspaceDateLabel(workspace),
      _roleLabel: this.workspaceRoleLabel(workspace),
      _visibility: this.workspaceVisibility(workspace),
      _statusLabel: this.workspaceStatusLabel(workspace),
    };
  }

  workspaceUpdatedLabel(workspace: any): string {
    const value = workspace?.updatedAt ?? workspace?.createdAt;
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
    const score = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
    return themes[score % themes.length];
  }

  isActive(workspace: any): boolean {
    return workspace?.status === 'ACTIVE';
  }

  isArchived(workspace: any): boolean {
    return workspace?.status === 'ARCHIVED';
  }

  isBusy(workspace: any): boolean {
    const id = idOf(workspace);
    return !!id && this.busyIds().has(id);
  }

  isInlineRenaming(workspace: any): boolean {
    return this.inlineRenameId() === idOf(workspace);
  }

  private updateWorkspaceStatus(workspace: any, status: 'ACTIVE' | 'ARCHIVED'): void {
    const id = idOf(workspace);
    if (!id || this.isBusy(workspace)) return;

    this.setBusy(id, true);

    this.workspaceApi
      .updateStatus(id, status)
      .pipe(
        finalize(() => this.setBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const updated = response?.data || { ...workspace, status };
          this.workspaces.update((items) =>
            items.map((item) =>
              idOf(item) === id ? this.prepareWorkspace({ ...item, ...updated, status }) : item
            )
          );
          this.workspaceStore.updateWorkspace(id, { status } as any);

          const isArchived = status === 'ARCHIVED';
          this.toastService.success(
            isArchived
              ? WORKSPACE_MESSAGES.SUCCESS.ARCHIVED(this.workspaceName(workspace))
              : WORKSPACE_MESSAGES.SUCCESS.ACTIVATED(this.workspaceName(workspace)),
            {
              title: isArchived ? 'Workspace archived' : 'Workspace restored',
              dedupeKey: `workspace-status-${id}`,
            }
          );
        },
        error: (error: any) => {
          const message = extractErrorMessage(error, WORKSPACE_MESSAGES.ERROR.STATUS_UPDATE_FAILED);
          this.toastService.error(message, {
            title: 'Status update failed',
            dedupeKey: 'workspace-status-error',
          });
        },
      });
  }

  private setBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());
    busy ? next.add(id) : next.delete(id);
    this.busyIds.set(next);
  }

  private workspaceTimestamp(workspace: any): number {
    const value = workspace?.updatedAt ?? workspace?.createdAt;
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
}
