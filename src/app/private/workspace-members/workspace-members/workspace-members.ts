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
  effect,
  inject,
  signal,
  viewChild,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Subject,
  expand,
  finalize,
  map,
  reduce,
  takeUntil,
  timer,
  type Observable,
} from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { Highlight } from '../../../shared/directives/highlight.directive';
import {
  LucideCheck,
  LucideChevronDown,
  LucideChevronRight,
  LucideClock3,
  LucideCopy,
  LucideCrown,
  LucideEye,
  LucideGrid2X2,
  LucideList,
  LucideMail,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideShield,
  LucideTrash2,
  LucideUserCheck,
  LucideUserPlus,
  LucideUsers,
  LucideX,
} from '@lucide/angular';

import { Avatar } from '../../../shared/components/avatar/avatar';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { BulkActionPanel } from '../../../shared/components/bulk-action-panel/bulk-action-panel';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Loader } from '../../../shared/components/loader/loader';
import {
  Select,
  type SelectOption,
  type SelectValue,
} from '../../../shared/components/select/select';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { Tabs, type TabItem, type TabValue } from '../../../shared/components/tabs/tabs';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import {
  entityNameOf,
  extractErrorMessage,
  extractList,
  idOf,
} from '../../../shared/functions/common.function';
import {
  USER_PREFERENCE_KEYS,
  WORKSPACE_MEMBER_SORT_PREFERENCES,
} from '../../../shared/constants/common.constants';
import { UserDateTimeFormatterService } from '../../../shared/services/user-date-time-formatter.service';
import { UserDatePipe } from '../../../shared/pipes/user-date.pipe';
import { UserTimePipe } from '../../../shared/pipes/user-time.pipe';

import { getWorkspaceMemberName } from '../../../shared/functions/workspace-member.function';
import {
  WORKSPACE_MEMBER_STATUS_PREFERENCES,
  WORKSPACE_MEMBER_SORT_OPTIONS,
  PREFERENCE_TO_MEMBER_STATUS,
  PREFERENCE_TO_MEMBER_SORT,
  WORKSPACE_MEMBER_PAGE_SIZE,
  type MemberTab,
  type MemberView,
  type MemberSort,
} from '../constants/workspace-member.constants';

import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { UserPreferenceStore } from '../../user-preferences/services/user-preference.store';

import type {
  WorkspaceMember,
  WorkspaceMemberListItem,
  WorkspaceMemberStatus,
  Pagination as MemberPagination,
} from '../models/workspace-member.models';
import { WorkspaceMemberApiService } from '../services/workspace-member.service';

import type {
  WorkspaceInvitation,
  WorkspaceInvitationRef,
  WorkspaceInvitationStatus,
  Pagination as InvitationPagination,
  PaginatedApiResponse as InvitationPaginatedApiResponse,
} from '../models/workspace-invitation.models';
import { WorkspaceInvitationApiService } from '../services/workspace-invitation.service';

import type { WorkspaceRole } from '../../roles/models/workspace-role.models';
import { WorkspaceRoleApiService } from '../../roles/services/workspace-role.service';

import { SendWorkspaceMemberRequestSidePanel } from '../send-workspace-member-request-side-panel/send-workspace-member-request-side-panel';
import { MemberCardWrapper } from '../member-card-wrapper/member-card-wrapper';
import { InvitationCardWrapper } from '../invitation-card-wrapper/invitation-card-wrapper';

type BadgeVariant = 'success' | 'noteYellow' | 'danger';

@Component({
  selector: 'app-workspace-members',
  standalone: true,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    Tooltip,
    Highlight,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Avatar,
    Badge,
    Button,
    Checkbox,
    BulkActionPanel,
    Loader,
    Select,
    StickyCard,
    Tabs,
    SendWorkspaceMemberRequestSidePanel,
    MemberCardWrapper,
    InvitationCardWrapper,
    UserDatePipe,
    UserTimePipe,
  ],
  templateUrl: './workspace-members.html',
  styleUrl: './workspace-members.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceMembers implements OnInit, OnChanges {
  private readonly memberApi = inject(WorkspaceMemberApiService);
  private readonly invitationApi = inject(WorkspaceInvitationApiService);
  private readonly roleApi = inject(WorkspaceRoleApiService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly dateTimeFormatter = inject(UserDateTimeFormatterService);
  readonly preferencesReady = this.userPreferenceStore.ready;

  @Input() workspaceId = '';
  @Input() roleOptions: readonly SelectOption[] = [];

  @Output() readonly workspaceChange = new EventEmitter<string>();
  @Output() readonly memberCreated = new EventEmitter<WorkspaceMember>();
  @Output() readonly memberChanged = new EventEmitter<WorkspaceMember>();
  @Output() readonly memberRemoved = new EventEmitter<string>();

  private loadedWorkspaceId: string | null = null;
  private memberRequestVersion = 0;
  private invitationRequestVersion = 0;
  private roleRequestVersion = 0;
  private workspaceVersion = 0;
  private readonly workspaceChanged = new Subject<void>();
  readonly bulkBusy = signal(false);
  private initialized = false;

  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucideClock3 = LucideClock3;
  readonly LucideCopy = LucideCopy;
  readonly LucideCrown = LucideCrown;
  readonly LucideEye = LucideEye;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideList = LucideList;
  readonly LucideMail = LucideMail;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideShield = LucideShield;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideUserCheck = LucideUserCheck;
  readonly LucideUserPlus = LucideUserPlus;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;

  readonly availableRoleOptions = signal<readonly SelectOption[]>([]);
  readonly loadingRoles = signal(false);

  readonly collapsedGroups = signal<Set<string>>(new Set());
  readonly selectedMemberIds = signal<Set<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedMemberIds().size);
  readonly copiedKeyMap = signal<Record<string, boolean>>({});
  readonly contextMenuMember = signal<WorkspaceMemberListItem | null>(null);
  readonly contextMenuInvitation = signal<WorkspaceInvitation | null>(null);
  readonly contextMenuPosition = signal({ x: 0, y: 0 });
  readonly accessContextMenuTrigger = viewChild<MatMenuTrigger>('accessContextMenuTrigger');

  readonly workspaces = this.workspaceStore.workspaces;
  readonly loadingWorkspaces = this.workspaceStore.loading;
  readonly workspaceError = this.workspaceStore.error;
  readonly selectedWorkspaceId = computed(() => this.workspaceStore.selectedId() ?? '');

  readonly workspaceOptions = computed<readonly SelectOption[]>(() =>
    this.workspaces().map((workspace) => ({
      label: entityNameOf(workspace, 'Untitled workspace'),
      value: idOf(workspace),
      icon: LucidePanelsTopLeft,
    })),
  );

  readonly selectedWorkspaceLabel = computed(() => {
    const selectedId = this.selectedWorkspaceId();

    const workspace = this.workspaces().find((item) => idOf(item) === selectedId);

    return workspace ? entityNameOf(workspace, 'Untitled workspace') : 'Select workspace';
  });

  readonly members = signal<readonly WorkspaceMemberListItem[]>([]);
  readonly memberMeta = signal<MemberPagination | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  readonly invitations = signal<readonly WorkspaceInvitation[]>([]);
  readonly invitationLoading = signal(false);
  readonly invitationError = signal<string | null>(null);
  readonly invitationBusyIds = signal<ReadonlySet<string>>(new Set());

  readonly activeTab = computed<MemberTab>(() => {
    const status = String(
      this.userPreferenceStore.workspaceMemberStatusFilter() ?? '',
    ).toUpperCase();
    return PREFERENCE_TO_MEMBER_STATUS[status] ?? 'all';
  });
  readonly view = computed<MemberView>(() =>
    String(this.userPreferenceStore.workspaceMemberView() ?? '').toUpperCase() === 'LIST'
      ? 'list'
      : 'grid',
  );
  readonly searchTerm = signal('');
  readonly sortBy = computed<MemberSort>(() => {
    const value = String(this.userPreferenceStore.workspaceMemberSortOrder() ?? '').toUpperCase();
    return PREFERENCE_TO_MEMBER_SORT[value] ?? 'updatedAt';
  });

  readonly memberModalOpen = signal(false);
  readonly memberModalMember = signal<WorkspaceMember | null>(null);

  readonly viewTarget = signal<WorkspaceMemberListItem | null>(null);

  readonly removeTarget = signal<WorkspaceMemberListItem | null>(null);
  readonly removing = signal(false);

  readonly cancelInvitationTarget = signal<WorkspaceInvitation | null>(null);
  readonly cancellingInvitation = signal(false);

  readonly totalCount = computed(
    () => this.members().filter((member) => !this.isRemoved(member)).length,
  );

  readonly activeCount = computed(
    () => this.members().filter((member) => this.memberStatus(member) === 'ACTIVE').length,
  );

  readonly invitationCount = computed(() => this.invitations().length);

  readonly pendingInvitationCount = computed(
    () =>
      this.invitations().filter((invitation) => this.invitationStatus(invitation) === 'PENDING')
        .length,
  );

  readonly removedCount = computed(
    () => this.members().filter((member) => this.isRemoved(member)).length,
  );

  readonly headerCountLabel = computed(() => {
    const members = this.totalCount();
    const pending = this.pendingInvitationCount();

    const memberLabel = `${members} ${members === 1 ? 'member' : 'members'}`;

    if (pending === 0) return memberLabel;

    return `${memberLabel} · ${pending} pending`;
  });

  readonly memberTabs = computed<readonly TabItem[]>(() => [
    {
      value: 'all',
      label: 'All',
      count: this.totalCount(),
      icon: LucideUsers,
      ariaLabel: 'All current members',
    },
    {
      value: 'active',
      label: 'Active',
      count: this.activeCount(),
      icon: LucideUserCheck,
      ariaLabel: 'Active members',
    },
    {
      value: 'invitations',
      label: 'Invitations',
      count: this.invitationCount(),
      icon: LucideMail,
      ariaLabel: 'Workspace invitations',
    },
    {
      value: 'removed',
      label: 'Removed',
      count: this.removedCount(),
      icon: LucideTrash2,
      ariaLabel: 'Removed members',
    },
  ]);

  readonly viewTabs: readonly TabItem[] = [
    {
      value: 'grid',
      label: 'Grid',
      icon: LucideGrid2X2,
      ariaLabel: 'Show workspace access in grid view',
    },
    {
      value: 'list',
      label: 'List',
      icon: LucideList,
      ariaLabel: 'Show workspace access in list view',
    },
  ];

  readonly sortOptions = WORKSPACE_MEMBER_SORT_OPTIONS;

  readonly searchPlaceholder = computed(() =>
    this.activeTab() === 'invitations'
      ? 'Search email, role or status'
      : 'Search member, email or role',
  );

  readonly visibleMembers = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();

    if (tab === 'invitations') return [];

    return [...this.members()]
      .filter((member) => {
        const status = this.memberStatus(member);

        if (tab === 'all' && status === 'REMOVED') return false;

        if (tab === 'active' && status !== 'ACTIVE') return false;

        if (tab === 'removed' && status !== 'REMOVED') return false;

        if (!search) return true;

        return this.matchesMemberSearch(member, search);
      })
      .sort((first, second) => this.compareMembers(first, second));
  });

  readonly memberGroups = computed(() => {
    const list = this.visibleMembers();
    const tab = this.activeTab();
    const isSearchActive = !!this.searchTerm().trim();

    const groups: Array<{
      id: string;
      label: string;
      status: 'ACTIVE' | 'REMOVED';
      accent: string;
      items: readonly WorkspaceMemberListItem[];
      count: number;
    }> = [];

    if (tab === 'all' || tab === 'active') {
      const activeItems = list.filter((m) => this.memberStatus(m) === 'ACTIVE');
      groups.push({
        id: 'active',
        label: 'Active Members',
        status: 'ACTIVE',
        accent: '#10b981',
        items: activeItems,
        count: activeItems.length,
      });
    }

    if (tab === 'all' || tab === 'removed') {
      const source = tab === 'all' ? this.members() : list;
      const query = this.searchTerm().trim().toLowerCase();
      const removedItems = source
        .filter((member) => this.isRemoved(member) && this.matchesMemberSearch(member, query))
        .sort((first, second) => this.compareMembers(first, second));

      if (removedItems.length > 0 || tab === 'removed') {
        groups.push({
          id: 'removed',
          label: 'Removed Members',
          status: 'REMOVED',
          accent: '#64748b',
          items: removedItems,
          count: removedItems.length,
        });
      }
    }

    return groups.filter((g) => g.count > 0 || !isSearchActive);
  });

  readonly visibleInvitations = computed(() => {
    if (this.activeTab() !== 'invitations') return [];

    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    return [...this.invitations()]
      .filter((invitation) => {
        if (!search) return true;

        return [
          this.invitationEmail(invitation),
          this.invitationRoleName(invitation),
          this.invitationStatusLabel(invitation),
          this.invitationInvitedByLabel(invitation),
          this.invitationMessage(invitation),
        ].some((value) => value.toLowerCase().includes(search));
      })
      .sort((first, second) => {
        if (sort === 'name') {
          return (
            this.sortDirection('name') *
            this.invitationEmail(first).localeCompare(this.invitationEmail(second), undefined, {
              sensitivity: 'base',
            })
          );
        }

        if (sort === 'role') {
          return this.invitationRoleName(first).localeCompare(
            this.invitationRoleName(second),
            undefined,
            { sensitivity: 'base' },
          );
        }

        return (
          this.sortDirection(sort) *
          (this.invitationTimestamp(second, sort) - this.invitationTimestamp(first, sort))
        );
      });
  });

  constructor() {
    effect(() => {
      this.workspaces();
      untracked(() => this.trySelectRequestedWorkspace());
    });
    effect(() => {
      const workspaceId = this.workspaceStore.selectedId();
      untracked(() => {
        if (!workspaceId) {
          this.loadedWorkspaceId = null;
          this.clearPageForNoWorkspace();
          return;
        }

        if (this.loadedWorkspaceId === workspaceId) return;

        this.loadedWorkspaceId = workspaceId;
        this.clearPageForNoWorkspace();
        this.loadWorkspaceAccess(workspaceId);
      });
    });
  }

  ngOnInit(): void {
    this.initialized = true;
    this.userPreferenceStore.load();
    this.trySelectRequestedWorkspace();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized && changes['roleOptions'] && !this.loadingRoles()) this.loadRoles();
    if (!this.initialized || !changes['workspaceId']) return;

    this.trySelectRequestedWorkspace();
  }

  openMemberContextMenu(member: WorkspaceMemberListItem, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (
      this.isBusy(member) ||
      !this.members().some((item) => this.memberId(item) === this.memberId(member))
    )
      return;
    this.closeAccessContextMenu();
    this.contextMenuMember.set(member);
    this.openAccessContextMenu(event);
  }

  openInvitationContextMenu(invitation: WorkspaceInvitation, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (
      this.isInvitationBusy(invitation) ||
      !this.invitations().some((item) => this.invitationId(item) === this.invitationId(invitation))
    )
      return;
    this.closeAccessContextMenu();
    this.contextMenuInvitation.set(invitation);
    this.openAccessContextMenu(event);
  }

  closeAccessContextMenu(): void {
    this.accessContextMenuTrigger()?.closeMenu();
    this.clearContextMenuTarget();
  }

  clearContextMenuTarget(): void {
    this.contextMenuMember.set(null);
    this.contextMenuInvitation.set(null);
  }

  private openAccessContextMenu(event: MouseEvent): void {
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    timer(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.contextMenuMember() || this.contextMenuInvitation()) {
          this.accessContextMenuTrigger()?.openMenu();
        }
      });
  }

  async copyAccessEmail(email: string): Promise<void> {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      if (!this.destroyRef.destroyed) this.toastService.info('Copied email address to clipboard');
    } catch {
      if (!this.destroyRef.destroyed) this.toastService.error('Unable to copy email address');
    }
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

  isMemberSelected(member: WorkspaceMemberListItem): boolean {
    const id = this.memberId(member);
    return !!id && this.selectedMemberIds().has(id);
  }

  toggleMemberSelection(member: WorkspaceMemberListItem, checked: boolean): void {
    const id = this.memberId(member);
    if (!id) return;

    this.selectedMemberIds.update((set) => {
      const next = new Set(set);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  isAllSelected(members?: readonly WorkspaceMemberListItem[]): boolean {
    const target = members ?? this.visibleMembers();
    if (!target.length) return false;
    const set = this.selectedMemberIds();
    return target.every((m) => set.has(this.memberId(m)));
  }

  isSomeSelected(members?: readonly WorkspaceMemberListItem[]): boolean {
    const target = members ?? this.visibleMembers();
    if (!target.length) return false;
    const set = this.selectedMemberIds();
    const selected = target.filter((m) => set.has(this.memberId(m)));
    return selected.length > 0 && selected.length < target.length;
  }

  toggleSelectAll(checked: boolean, members?: readonly WorkspaceMemberListItem[]): void {
    const target = members ?? this.visibleMembers();
    if (!target.length) return;

    this.selectedMemberIds.update((set) => {
      const next = new Set(set);
      target.forEach((m) => {
        const id = this.memberId(m);
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
    this.selectedMemberIds.set(new Set());
  }

  bulkRemoveSelected(): void {
    this.runBulkMemberAction('remove');
  }

  bulkRestoreSelected(): void {
    this.runBulkMemberAction('restore');
  }

  private runBulkMemberAction(action: 'remove' | 'restore'): void {
    if (this.bulkBusy() || this.loading()) return;
    const ids = this.members()
      .filter(
        (member) =>
          this.selectedMemberIds().has(this.memberId(member)) &&
          !this.isBusy(member) &&
          (action === 'remove'
            ? !this.isRemoved(member) && this.canManageMember(member)
            : this.isRemoved(member)),
      )
      .map((member) => this.memberId(member));
    if (!ids.length) {
      this.toastService.warning(
        action === 'remove'
          ? 'Selected members cannot be removed'
          : 'Selected members are not removed',
      );
      this.clearSelection();
      return;
    }

    const workspaceId = this.selectedWorkspaceId();
    const version = this.workspaceVersion;
    let completed = 0;
    let succeeded = 0;
    let failureMessage = '';
    this.bulkBusy.set(true);
    ids.forEach((id) => this.setMemberBusy(id, true));
    const finish = (): void => {
      if (
        this.destroyRef.destroyed ||
        version !== this.workspaceVersion ||
        workspaceId !== this.selectedWorkspaceId()
      )
        return;
      if (++completed !== ids.length) return;
      this.bulkBusy.set(false);
      if (succeeded) {
        const label = action === 'remove' ? 'Removed' : 'Restored';
        this.toastService.success(
          label + ' ' + succeeded + (succeeded === 1 ? ' member' : ' members'),
        );
      }
      if (completed > succeeded) {
        this.toastService.error(
          completed - succeeded + ' member action(s) failed. ' + failureMessage,
        );
      }
      this.clearSelection();
      this.loadMembers();
    };

    ids.forEach((id) => {
      let succeededRequest = false;
      const request: Observable<{ success?: boolean; message?: string }> =
        action === 'remove' ? this.memberApi.remove(id) : this.memberApi.restore(id);
      request
        .pipe(
          map((response) => {
            if (response?.success === false)
              throw new Error(response.message || 'Workspace access update failed.');
            return response;
          }),
          finalize(() => {
            if (this.destroyRef.destroyed || version !== this.workspaceVersion) return;
            this.setMemberBusy(id, false);
            finish();
          }),
          takeUntil(this.workspaceChanged),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            if (!succeededRequest) succeeded++;
            succeededRequest = true;
          },
          error: (error) => {
            failureMessage = extractErrorMessage(error, 'Unable to ' + action + ' member.');
          },
        });
    });
  }

  isKeyCopied(id?: string): boolean {
    return !!(id && this.copiedKeyMap()[id]);
  }

  async copyMemberId(id?: string, event?: Event): Promise<void> {
    event?.stopPropagation();
    event?.preventDefault();
    if (!id) return;
    const version = this.workspaceVersion;
    try {
      await navigator.clipboard.writeText(id);
      if (this.destroyRef.destroyed || version !== this.workspaceVersion) return;
      this.copiedKeyMap.update((map) => ({ ...map, [id]: true }));
      this.toastService.info('Copied member ID to clipboard');
      timer(2000)
        .pipe(takeUntil(this.workspaceChanged), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.copiedKeyMap.update((map) => {
            const next = { ...map };
            delete next[id];
            return next;
          });
        });
    } catch {
      if (!this.destroyRef.destroyed && version === this.workspaceVersion) {
        this.toastService.error('Unable to copy member ID');
      }
    }
  }

  loadWorkspaces(): void {
    this.workspaceStore.load(true);
  }

  loadWorkspaceAccess(workspaceId = this.selectedWorkspaceId()): void {
    const id = idOf(workspaceId);

    if (!id) {
      this.clearPageForNoWorkspace();
      return;
    }

    this.loadMembers(id);
    this.loadInvitations(id);
    this.loadRoles(id);
  }

  loadRoles(workspaceId = this.selectedWorkspaceId()): void {
    const id = idOf(workspaceId);
    const requestVersion = ++this.roleRequestVersion;
    this.availableRoleOptions.set(this.fallbackRoleOptions());
    this.loadingRoles.set(!!id);
    if (!id) return;

    this.roleApi
      .getWorkspaceRoles(id)
      .pipe(
        finalize(() => {
          if (requestVersion === this.roleRequestVersion) this.loadingRoles.set(false);
        }),
        takeUntil(this.workspaceChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (roles) => {
          if (requestVersion !== this.roleRequestVersion || id !== this.selectedWorkspaceId())
            return;
          const options = extractList<WorkspaceRole>(roles)
            .filter((role) => role && idOf(role) && this.canAssignRole(role, id))
            .map<SelectOption>((role) => ({
              label: String(role.displayName || role.name || 'Workspace role'),
              value: idOf(role),
              icon: LucideShield,
            }));
          this.availableRoleOptions.set(options.length ? options : this.fallbackRoleOptions());
        },
        error: (error) => {
          if (requestVersion !== this.roleRequestVersion || id !== this.selectedWorkspaceId())
            return;
          this.toastService.error(extractErrorMessage(error, 'Unable to load workspace roles.'), {
            title: 'Could not load roles',
            dedupeKey: 'workspace-member-roles-error',
          });
        },
      });
  }

  memberRoleId(member: WorkspaceMemberListItem): string {
    return idOf(member?.role);
  }

  roleOptionsForMember(member: WorkspaceMemberListItem): readonly SelectOption[] {
    const options = this.availableRoleOptions();
    const currentRoleId = this.memberRoleId(member);
    if (!currentRoleId) return options;
    const exists = options.some((opt) => opt.value === currentRoleId);
    if (exists) return options;
    const currentRoleName = this.memberRoleName(member);
    return [
      {
        label: currentRoleName,
        value: currentRoleId,
        icon: LucideShield,
      },
      ...options,
    ];
  }

  onMemberRoleChange(
    member: WorkspaceMemberListItem,
    value: SelectValue | SelectValue[] | null,
  ): void {
    const newRoleId = Array.isArray(value) || value === null ? '' : String(value).trim();
    const currentRoleId = this.memberRoleId(member);

    if (!newRoleId || newRoleId === currentRoleId) return;

    if (
      !this.canManageMember(member) ||
      this.isRemoved(member) ||
      this.isBusy(member) ||
      this.loadingRoles()
    )
      return;
    if (!this.availableRoleOptions().some((option) => option.value === newRoleId)) return;

    const memberId = this.memberId(member);
    if (!memberId) return;

    this.setMemberBusy(memberId, true);

    const selectedOption = this.roleOptionsForMember(member).find((opt) => opt.value === newRoleId);
    const newRoleName = selectedOption?.label ?? 'updated role';

    const workspaceId = this.selectedWorkspaceId();
    const version = this.workspaceVersion;
    this.memberApi
      .assignRole(memberId, newRoleId)
      .pipe(
        map((response) => {
          if (response?.success === false)
            throw new Error(response.message || 'Workspace access update failed.');
          return response;
        }),
        finalize(() => this.setMemberBusy(memberId, false)),
        takeUntil(this.workspaceChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (version !== this.workspaceVersion || workspaceId !== this.selectedWorkspaceId())
            return;
          this.toastService.success(
            `${this.memberName(member)}'s role was updated to ${newRoleName}.`,
            {
              title: 'Role updated',
              dedupeKey: 'workspace-member-role-success',
            },
          );

          this.members.update((currentList) =>
            currentList.map((item) => {
              if (this.memberId(item) !== memberId) return item;
              return {
                ...item,
                role: {
                  ...item.role,
                  id: newRoleId,
                  name: newRoleName,
                },
              };
            }),
          );

          if (response?.data) this.memberChanged.emit(response.data);
        },
        error: (error) => {
          if (version !== this.workspaceVersion || workspaceId !== this.selectedWorkspaceId())
            return;
          const message = extractErrorMessage(error, 'Unable to update member role.');
          this.toastService.error(message, {
            title: 'Role update failed',
            dedupeKey: 'workspace-member-role-error',
          });

          this.members.update((currentList) => [...currentList]);
        },
      });
  }

  private canAssignRole(role: WorkspaceRole, workspaceId: string): boolean {
    const code = String(role.code ?? '')
      .trim()
      .toUpperCase();
    const scope = String(role.scope ?? '')
      .trim()
      .toUpperCase();
    const roleWorkspaceId = idOf(role.workspaceId);

    if (!role.isActive || scope !== 'WORKSPACE' || code === 'WORKSPACE_OWNER') return false;

    return role.isSystem || roleWorkspaceId === workspaceId;
  }

  private fallbackRoleOptions(): readonly SelectOption[] {
    return (Array.isArray(this.roleOptions) ? this.roleOptions : []).filter(
      (option) =>
        option &&
        idOf(option.value) &&
        !String(option.label ?? '')
          .toUpperCase()
          .includes('OWNER'),
    );
  }

  loadMembers(workspaceId = this.selectedWorkspaceId()): void {
    const id = idOf(workspaceId);
    const requestVersion = ++this.memberRequestVersion;

    if (!id) {
      this.members.set([]);
      this.memberMeta.set(null);
      this.loading.set(false);
      this.error.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const fetchPage = (page: number) =>
      this.memberApi
        .getAll({
          workspaceId: id,
          page,
          limit: WORKSPACE_MEMBER_PAGE_SIZE,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        })
        .pipe(
          map((response) => {
            if (response?.success === false)
              throw new Error(response.message || 'Unable to load workspace members.');
            return {
              response,
              page,
              items: extractList<WorkspaceMemberListItem>(response).filter(
                (item) => item && typeof item === 'object' && idOf(item),
              ),
            };
          }),
        );

    fetchPage(1)
      .pipe(
        expand(({ response, page, items }) => {
          if (requestVersion !== this.memberRequestVersion || this.selectedWorkspaceId() !== id)
            return EMPTY;
          const pagination = response?.meta ?? response?.pagination;
          const totalPages =
            Number(pagination?.totalPages) ||
            Math.ceil(Number(pagination?.total) / Number(pagination?.limit));
          if (items.length && Number.isFinite(totalPages) && page < totalPages)
            return fetchPage(page + 1);
          return EMPTY;
        }),
        reduce(
          (result, page) => ({
            items: [...result.items, ...page.items],
            meta: page.response?.meta ?? page.response?.pagination ?? result.meta,
          }),
          { items: [] as WorkspaceMemberListItem[], meta: null as MemberPagination | null },
        ),
        finalize(() => {
          if (requestVersion === this.memberRequestVersion) {
            this.loading.set(false);
          }
        }),
        takeUntil(this.workspaceChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          if (requestVersion !== this.memberRequestVersion || this.selectedWorkspaceId() !== id)
            return;

          this.memberMeta.set(result.meta);
          this.members.set(result.items);
          const ids = new Set(result.items.map((item) => this.memberId(item)));
          this.selectedMemberIds.update(
            (selected) => new Set([...selected].filter((id) => ids.has(id))),
          );
        },
        error: (error) => {
          if (requestVersion !== this.memberRequestVersion || this.selectedWorkspaceId() !== id)
            return;

          this.members.set([]);
          this.memberMeta.set(null);

          const message = extractErrorMessage(error, 'Unable to load workspace members.');

          this.error.set(message);

          this.toastService.error(message, {
            title: 'Could not load members',
            dedupeKey: 'workspace-members-load-error',
          });
        },
      });
  }

  loadInvitations(workspaceId = this.selectedWorkspaceId()): void {
    const id = idOf(workspaceId);
    const requestVersion = ++this.invitationRequestVersion;

    if (!id) {
      this.invitations.set([]);
      this.invitationLoading.set(false);
      this.invitationError.set(null);
      return;
    }

    this.invitationLoading.set(true);
    this.invitationError.set(null);

    const fetchPage = (page: number) =>
      this.invitationApi
        .getAll({
          workspaceId: id,
          page,
          limit: WORKSPACE_MEMBER_PAGE_SIZE,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
        .pipe(
          map((response) => {
            if (response?.success === false)
              throw new Error(response.message || 'Unable to load workspace invitations.');
            return {
              response,
              page,
              items: this.extractInvitations(response).filter(
                (item) => item && typeof item === 'object' && idOf(item),
              ),
            };
          }),
        );

    fetchPage(1)
      .pipe(
        expand(({ response, page, items }) => {
          if (requestVersion !== this.invitationRequestVersion || this.selectedWorkspaceId() !== id)
            return EMPTY;
          const pagination = response?.pagination;
          const totalPages =
            Number(pagination?.totalPages) ||
            Math.ceil(Number(pagination?.total) / Number(pagination?.limit));
          if (items.length && Number.isFinite(totalPages) && page < totalPages)
            return fetchPage(page + 1);
          return EMPTY;
        }),
        reduce(
          (result, page) => ({
            items: [...result.items, ...page.items],
            meta: page.response?.pagination ?? result.meta,
          }),
          { items: [] as WorkspaceInvitation[], meta: null as InvitationPagination | null },
        ),
        finalize(() => {
          if (requestVersion === this.invitationRequestVersion) {
            this.invitationLoading.set(false);
          }
        }),
        takeUntil(this.workspaceChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          if (
            requestVersion !== this.invitationRequestVersion ||
            this.selectedWorkspaceId() !== id
          ) {
            return;
          }

          this.invitations.set(result.items);
        },
        error: (error) => {
          if (
            requestVersion !== this.invitationRequestVersion ||
            this.selectedWorkspaceId() !== id
          ) {
            return;
          }

          this.invitations.set([]);

          const message = extractErrorMessage(error, 'Unable to load workspace invitations.');

          this.invitationError.set(message);

          this.toastService.error(message, {
            title: 'Could not load invitations',
            dedupeKey: 'workspace-invitations-load-error',
          });
        },
      });
  }

  onWorkspaceChange(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string' || !value.trim()) return;

    const id = value.trim();

    if (id === this.selectedWorkspaceId()) return;

    this.workspaceStore.select(id);
    this.workspaceChange.emit(id);
  }

  setMemberTab(value: TabValue): void {
    const tab = PREFERENCE_TO_MEMBER_STATUS[String(value).toUpperCase()];
    if (tab) {
      this.closeAccessContextMenu();
      this.clearSelection();
      this.searchTerm.set('');
      if (tab !== this.activeTab()) {
        const pref = WORKSPACE_MEMBER_STATUS_PREFERENCES[tab] ?? 'ALL';
        this.userPreferenceStore.setAndSave(
          USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_STATUS_FILTER,
          pref,
        );
      }
    }
  }

  setMemberView(value: TabValue): void {
    if (value === 'grid' || value === 'list') {
      this.closeAccessContextMenu();
      if (value !== this.view()) {
        this.userPreferenceStore.setAndSave(
          USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_VIEW,
          value.toUpperCase(),
        );
      }
    }
  }

  updateSearch(value: InputValue): void {
    this.closeAccessContextMenu();
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(value: SelectValue | SelectValue[] | null): void {
    if (value === null || Array.isArray(value)) return;

    if (value === 'updatedAt' || value === 'createdAt' || value === 'name' || value === 'role') {
      const pref = WORKSPACE_MEMBER_SORT_PREFERENCES[value];
      if (pref !== this.userPreferenceStore.workspaceMemberSortOrder()) {
        this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.WORKSPACE_MEMBER_SORT_ORDER, pref);
      }
    }
  }

  openSendRequest(): void {
    if (!this.selectedWorkspaceId()) {
      this.toastService.warning('Select a workspace before sending a member request.', {
        title: 'Workspace required',
        dedupeKey: 'workspace-members-workspace-required',
      });

      return;
    }

    this.memberModalMember.set(null);
    this.memberModalOpen.set(true);
  }

  openMemberView(member: WorkspaceMemberListItem): void {
    if (this.isBusy(member)) return;

    this.viewTarget.set(member);
  }

  closeMemberViewDialog(): void {
    this.viewTarget.set(null);
  }

  editViewedMember(member: WorkspaceMemberListItem): void {
    this.viewTarget.set(null);
    this.openRoleEditor(member);
  }

  openRoleEditor(member: WorkspaceMemberListItem): void {
    if (this.isBusy(member) || this.isRemoved(member) || !this.canManageMember(member)) return;

    // Preserve the role editor contract using the lightweight list references.
    this.memberModalMember.set(this.toEditorMember(member));
    this.memberModalOpen.set(true);
  }

  closeMemberModal(): void {
    this.memberModalOpen.set(false);
    this.memberModalMember.set(null);
  }

  onMemberSaved(member: WorkspaceMember | null): void {
    // Invitations emit null; role edits emit the updated member.
    if (member) {
      const id = idOf(member);

      const exists = this.members().some((item) => this.memberId(item) === id);

      if (exists) {
        this.memberChanged.emit(member);
      } else {
        this.memberCreated.emit(member);
      }
    }

    this.closeMemberModal();
    this.loadWorkspaceAccess();
  }

  requestRemove(member: WorkspaceMemberListItem): void {
    if (this.isBusy(member) || this.isRemoved(member) || !this.canManageMember(member)) return;

    this.viewTarget.set(null);
    this.removeTarget.set(member);
  }

  closeRemoveDialog(): void {
    if (!this.removing()) {
      this.removeTarget.set(null);
    }
  }

  confirmRemove(): void {
    const member = this.removeTarget();

    if (
      !member ||
      this.removing() ||
      this.isBusy(member) ||
      this.isRemoved(member) ||
      !this.canManageMember(member)
    )
      return;

    const id = this.memberId(member);

    if (!id) return;

    this.removing.set(true);
    this.setMemberBusy(id, true);

    const workspaceId = this.selectedWorkspaceId();
    const version = this.workspaceVersion;
    this.memberApi
      .remove(id)
      .pipe(
        map((response) => {
          if (response?.success === false)
            throw new Error(response.message || 'Workspace access update failed.');
          return response;
        }),
        finalize(() => {
          this.removing.set(false);
          this.setMemberBusy(id, false);
        }),
        takeUntil(this.workspaceChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          if (version !== this.workspaceVersion || workspaceId !== this.selectedWorkspaceId())
            return;
          this.removeTarget.set(null);
          this.memberRemoved.emit(id);

          this.toastService.success(
            `“${this.memberName(member)}” was removed from the workspace.`,
            {
              title: 'Member removed',
              dedupeKey: 'workspace-member-remove-success',
            },
          );

          this.loadMembers();
        },
        error: (error) => {
          if (version !== this.workspaceVersion || workspaceId !== this.selectedWorkspaceId())
            return;
          this.removeTarget.set(null);

          const message = extractErrorMessage(error, 'Unable to remove workspace member.');

          this.toastService.error(message, {
            title: 'Could not remove member',
            dedupeKey: 'workspace-member-remove-error',
          });
        },
      });
  }

  restoreMember(member: WorkspaceMemberListItem): void {
    const id = this.memberId(member);

    if (!id || this.isBusy(member) || !this.isRemoved(member)) return;

    this.setMemberBusy(id, true);

    const workspaceId = this.selectedWorkspaceId();
    const version = this.workspaceVersion;
    this.memberApi
      .restore(id)
      .pipe(
        map((response) => {
          if (response?.success === false)
            throw new Error(response.message || 'Workspace access update failed.');
          return response;
        }),
        finalize(() => this.setMemberBusy(id, false)),
        takeUntil(this.workspaceChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (version !== this.workspaceVersion || workspaceId !== this.selectedWorkspaceId())
            return;
          if (response?.data) this.memberChanged.emit(response.data);

          this.toastService.success(`“${this.memberName(member)}” was restored.`, {
            title: 'Member restored',
            dedupeKey: 'workspace-member-restore-success',
          });

          this.loadMembers();
        },
        error: (error) => {
          if (version !== this.workspaceVersion || workspaceId !== this.selectedWorkspaceId())
            return;
          const message = extractErrorMessage(error, 'Unable to restore workspace member.');

          this.toastService.error(message, {
            title: 'Restore failed',
            dedupeKey: 'workspace-member-restore-error',
          });
        },
      });
  }

  requestCancelInvitation(invitation: WorkspaceInvitation): void {
    if (!this.canCancelInvitation(invitation) || this.isInvitationBusy(invitation)) return;

    this.cancelInvitationTarget.set(invitation);
  }

  closeCancelInvitationDialog(): void {
    if (!this.cancellingInvitation()) {
      this.cancelInvitationTarget.set(null);
    }
  }

  confirmCancelInvitation(): void {
    const invitation = this.cancelInvitationTarget();

    if (
      !invitation ||
      this.cancellingInvitation() ||
      this.isInvitationBusy(invitation) ||
      !this.canCancelInvitation(invitation)
    )
      return;

    const id = this.invitationId(invitation);

    if (!id) return;

    this.cancellingInvitation.set(true);
    this.setInvitationBusy(id, true);

    const workspaceId = this.selectedWorkspaceId();
    const version = this.workspaceVersion;
    this.invitationApi
      .cancel(id)
      .pipe(
        map((response) => {
          if (response?.success === false)
            throw new Error(response.message || 'Workspace access update failed.');
          return response;
        }),
        finalize(() => {
          this.cancellingInvitation.set(false);
          this.setInvitationBusy(id, false);
        }),
        takeUntil(this.workspaceChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          if (version !== this.workspaceVersion || workspaceId !== this.selectedWorkspaceId())
            return;
          this.cancelInvitationTarget.set(null);

          this.toastService.success(
            `Invitation to ${this.invitationEmail(invitation)} was cancelled.`,
            {
              title: 'Invitation cancelled',
              dedupeKey: 'workspace-invitation-cancel-success',
            },
          );

          this.loadInvitations();
        },
        error: (error) => {
          if (version !== this.workspaceVersion || workspaceId !== this.selectedWorkspaceId())
            return;
          this.cancelInvitationTarget.set(null);

          const message = extractErrorMessage(error, 'Unable to cancel workspace invitation.');

          this.toastService.error(message, {
            title: 'Could not cancel invitation',
            dedupeKey: 'workspace-invitation-cancel-error',
          });
        },
      });
  }

  memberId(member: WorkspaceMemberListItem): string {
    return idOf(member);
  }

  memberName(member: WorkspaceMemberListItem): string {
    return getWorkspaceMemberName(member);
  }

  memberEmail(member: WorkspaceMemberListItem): string {
    return String(member.user?.email ?? '').trim();
  }

  memberRoleName(member: WorkspaceMemberListItem): string {
    return (
      String(member.role?.name ?? '').trim() || String(member.role?.code ?? '').trim() || 'Member'
    );
  }

  memberStatus(member: WorkspaceMemberListItem): WorkspaceMemberStatus {
    const value = String(member.status ?? 'ACTIVE')
      .trim()
      .toUpperCase();

    if (value === 'ACTIVE' || value === 'REMOVED') return value;

    return 'INVITED';
  }

  memberStatusLabel(member: WorkspaceMemberListItem): string {
    const status = this.memberStatus(member).toLowerCase();

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  memberStatusVariant(member: WorkspaceMemberListItem): BadgeVariant {
    const status = this.memberStatus(member);

    if (status === 'ACTIVE') return 'success';

    if (status === 'REMOVED') return 'danger';

    return 'noteYellow';
  }

  memberJoinedLabel(member: WorkspaceMemberListItem): string {
    return this.formatDate(member.joinedAt);
  }

  memberLastActiveLabel(member: WorkspaceMemberListItem): string {
    return this.formatActivity(member.lastActiveAt);
  }

  addedByLabel(member: WorkspaceMemberListItem): string {
    const addedBy = member.addedBy;

    if (!addedBy) return '—';

    return (
      String(addedBy.displayName ?? '').trim() ||
      this.emailName(addedBy.email) ||
      String(addedBy.email ?? '').trim() ||
      '—'
    );
  }

  memberSecondaryLabel(member: WorkspaceMemberListItem): string {
    const email = this.memberEmail(member);

    if (!email) return member.isCurrentUser ? 'You' : 'Workspace member';

    return member.isCurrentUser ? `${email} · You` : email;
  }

  isOwner(member: WorkspaceMemberListItem): boolean {
    if (member.isOwner) return true;

    const code = String(member.role?.code ?? '')
      .trim()
      .toUpperCase();

    return code === 'WORKSPACE_OWNER' || code === 'OWNER';
  }

  isCurrentUser(member: WorkspaceMemberListItem): boolean {
    return Boolean(member.isCurrentUser);
  }

  canManageMember(member: WorkspaceMemberListItem): boolean {
    return !!this.memberId(member) && !this.isOwner(member) && !this.isCurrentUser(member);
  }

  memberManageBlockedReason(member: WorkspaceMemberListItem): string {
    if (this.isOwner(member)) return 'Workspace owner is protected';

    if (this.isCurrentUser(member)) return 'Your own membership is managed separately';

    return 'This member cannot be changed';
  }

  isRemoved(member: WorkspaceMemberListItem): boolean {
    return this.memberStatus(member) === 'REMOVED';
  }

  isBusy(member: WorkspaceMemberListItem): boolean {
    return (
      this.loadedWorkspaceId !== this.selectedWorkspaceId() ||
      this.loading() ||
      this.bulkBusy() ||
      this.busyIds().has(this.memberId(member))
    );
  }

  invitationId(invitation: WorkspaceInvitation): string {
    return idOf(invitation);
  }

  invitationEmail(invitation: WorkspaceInvitation): string {
    return String(invitation.email ?? '').trim();
  }

  invitationName(invitation: WorkspaceInvitation): string {
    return this.emailName(this.invitationEmail(invitation)) || 'Invited user';
  }

  invitationRoleName(invitation: WorkspaceInvitation): string {
    return this.invitationRefLabel(invitation.roleId, 'Workspace role');
  }

  invitationStatus(invitation: WorkspaceInvitation): WorkspaceInvitationStatus {
    const value = String(invitation.status ?? 'PENDING')
      .trim()
      .toUpperCase();

    if (
      value === 'ACCEPTED' ||
      value === 'REJECTED' ||
      value === 'EXPIRED' ||
      value === 'CANCELLED'
    ) {
      return value;
    }

    return 'PENDING';
  }

  invitationStatusLabel(invitation: WorkspaceInvitation): string {
    const status = this.invitationStatus(invitation).toLowerCase();

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  invitationStatusVariant(invitation: WorkspaceInvitation): BadgeVariant {
    const status = this.invitationStatus(invitation);

    if (status === 'ACCEPTED') return 'success';

    if (status === 'PENDING') return 'noteYellow';

    return 'danger';
  }

  invitationCreatedLabel(invitation: WorkspaceInvitation): string {
    return this.formatDate(invitation.createdAt);
  }

  invitationExpiryLabel(invitation: WorkspaceInvitation): string {
    return this.formatDate(invitation.expiresAt);
  }

  invitationInvitedByLabel(invitation: WorkspaceInvitation): string {
    return (
      this.invitationRefLabel(invitation.invitedBy, '') ||
      this.invitationRefLabel(invitation.createdBy ?? null, '') ||
      '—'
    );
  }

  invitationMessage(invitation: WorkspaceInvitation): string {
    return String(invitation.message ?? '').trim();
  }

  invitationMessagePreview(invitation: WorkspaceInvitation): string {
    const message = this.invitationMessage(invitation);

    if (!message) return '';

    return message.length > 72 ? `${message.slice(0, 72).trim()}…` : message;
  }

  invitationSecondaryLabel(invitation: WorkspaceInvitation): string {
    return this.invitationMessagePreview(invitation) || 'Workspace invitation';
  }

  canCancelInvitation(invitation: WorkspaceInvitation): boolean {
    return !!this.invitationId(invitation) && this.invitationStatus(invitation) === 'PENDING';
  }

  isInvitationBusy(invitation: WorkspaceInvitation): boolean {
    return (
      this.loadedWorkspaceId !== this.selectedWorkspaceId() ||
      this.invitationLoading() ||
      this.invitationBusyIds().has(this.invitationId(invitation))
    );
  }

  private setMemberBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());

    busy ? next.add(id) : next.delete(id);

    this.busyIds.set(next);
  }

  private setInvitationBusy(id: string, busy: boolean): void {
    const next = new Set(this.invitationBusyIds());

    busy ? next.add(id) : next.delete(id);

    this.invitationBusyIds.set(next);
  }

  private trySelectRequestedWorkspace(): boolean {
    const requestedId = String(this.workspaceId ?? '').trim();

    if (!requestedId) return false;

    const exists = this.workspaces().some((workspace) => idOf(workspace) === requestedId);

    if (!exists) return false;

    if (this.selectedWorkspaceId() !== requestedId) {
      this.workspaceStore.select(requestedId);
      this.workspaceChange.emit(requestedId);
    }

    return true;
  }

  private clearPageForNoWorkspace(): void {
    this.workspaceVersion++;
    this.workspaceChanged.next();
    this.memberRequestVersion++;
    this.invitationRequestVersion++;
    this.roleRequestVersion++;

    this.loading.set(false);
    this.invitationLoading.set(false);

    this.error.set(null);
    this.invitationError.set(null);

    this.members.set([]);
    this.memberMeta.set(null);
    this.invitations.set([]);
    this.availableRoleOptions.set([]);
    this.loadingRoles.set(false);

    this.resetInteractionState();
  }

  private resetInteractionState(): void {
    this.closeAccessContextMenu();
    this.clearSelection();
    this.searchTerm.set('');
    this.collapsedGroups.set(new Set());
    this.copiedKeyMap.set({});
    this.removing.set(false);
    this.cancellingInvitation.set(false);
    this.bulkBusy.set(false);

    this.memberModalOpen.set(false);
    this.memberModalMember.set(null);

    this.viewTarget.set(null);
    this.removeTarget.set(null);
    this.cancelInvitationTarget.set(null);

    this.busyIds.set(new Set());
    this.invitationBusyIds.set(new Set());
  }

  private extractInvitations(
    response: InvitationPaginatedApiResponse<WorkspaceInvitation>,
  ): readonly WorkspaceInvitation[] {
    const data = response?.data as unknown;

    if (Array.isArray(data)) return data as WorkspaceInvitation[];

    if (!data || typeof data !== 'object') return [];

    const record = data as Record<string, unknown>;

    const candidates = [
      record['items'],
      record['invitations'],
      record['workspaceInvitations'],
      record['docs'],
      record['results'],
    ];

    return extractList<WorkspaceInvitation>(candidates.find(Array.isArray));
  }

  private sortDirection(sort: MemberSort): number {
    const preference = String(this.userPreferenceStore.workspaceMemberSortOrder()).toUpperCase();
    return (sort === 'name' && preference === 'NAME_DESC') ||
      (sort === 'createdAt' && preference === 'OLDEST_FIRST')
      ? -1
      : 1;
  }

  private compareMembers(first: WorkspaceMemberListItem, second: WorkspaceMemberListItem): number {
    const sort = this.sortBy();
    if (sort === 'name') {
      return (
        this.sortDirection('name') *
        this.memberName(first).localeCompare(this.memberName(second), undefined, {
          sensitivity: 'base',
        })
      );
    }

    if (sort === 'role') {
      return this.memberRoleName(first).localeCompare(this.memberRoleName(second), undefined, {
        sensitivity: 'base',
      });
    }

    return (
      this.sortDirection(sort) *
      (this.memberTimestamp(second, sort) - this.memberTimestamp(first, sort))
    );
  }

  private matchesMemberSearch(member: WorkspaceMemberListItem, search: string): boolean {
    return (
      !search ||
      [
        this.memberName(member),
        this.memberEmail(member),
        this.memberRoleName(member),
        this.memberStatusLabel(member),
        this.addedByLabel(member),
      ].some((value) => value.toLowerCase().includes(search))
    );
  }
  private memberTimestamp(
    member: WorkspaceMemberListItem,
    field: 'createdAt' | 'updatedAt',
  ): number {
    const value =
      field === 'createdAt' ? member.joinedAt : (member.lastActiveAt ?? member.joinedAt);

    if (!value) return 0;

    const timestamp = new Date(value).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private invitationTimestamp(
    invitation: WorkspaceInvitation,
    field: 'createdAt' | 'updatedAt',
  ): number {
    const value = invitation[field];

    if (!value) return 0;

    const timestamp = new Date(value).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private formatDate(value: string | Date | null | undefined): string {
    return this.dateTimeFormatter.formatDate(value, '—');
  }

  private formatActivity(value: string | Date | null | undefined): string {
    if (!value) return 'Not yet';

    const date = new Date(value);

    const timestamp = date.getTime();

    if (Number.isNaN(timestamp)) return '—';

    const diffMs = Date.now() - timestamp;

    if (diffMs < 60_000) return 'Just now';

    const minutes = Math.floor(diffMs / 60_000);

    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);

    if (days === 1) return 'Yesterday';

    if (days < 7) return `${days} days ago`;

    return this.formatDate(date);
  }

  private toEditorMember(member: WorkspaceMemberListItem): WorkspaceMember {
    const addedBy = member.addedBy
      ? {
          id: idOf(member.addedBy),
          _id: idOf(member.addedBy),
          displayName: member.addedBy.displayName,
          email: member.addedBy.email,
        }
      : null;

    return {
      id: idOf(member),
      _id: idOf(member),
      workspaceId: this.selectedWorkspaceId(),
      userId: {
        id: idOf(member.user),
        _id: idOf(member.user),
        displayName: member.user?.displayName,
        email: member.user?.email,
      },
      roleId: {
        id: idOf(member.role),
        _id: idOf(member.role),
        name: member.role?.name,
        displayName: member.role?.name,
        code: member.role?.code,
      },
      status: this.memberStatus(member),
      invitedBy: addedBy,
      joinedAt: member.joinedAt,
      createdBy: addedBy,
    };
  }

  private invitationRefLabel(
    ref: WorkspaceInvitationRef | null | undefined,
    fallback: string,
  ): string {
    if (!ref) return fallback;

    if (typeof ref === 'string') return fallback;

    return (
      String(ref.displayName ?? '').trim() ||
      String(ref.name ?? '').trim() ||
      String(ref.code ?? '').trim() ||
      String(ref.email ?? '').trim() ||
      fallback
    );
  }

  private emailName(email: unknown): string {
    const value = typeof email === 'string' ? email.trim() : '';

    return value.includes('@') ? value.split('@')[0] : value;
  }
}
