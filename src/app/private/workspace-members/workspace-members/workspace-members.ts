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
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideEye,
  LucideGrid2X2,
  LucideList,
  LucideMail,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideShield,
  LucideTrash2,
  LucideUserCheck,
  LucideUserPlus,
  LucideUsers,
  LucideX
} from '@lucide/angular';

import { Avatar } from '../../../shared/components/avatar/avatar';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Loader } from '../../../shared/components/loader/loader';
import { Select, type SelectOption, type SelectValue } from '../../../shared/components/select/select';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { Tabs, type TabItem, type TabValue } from '../../../shared/components/tabs/tabs';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

import type {
  MyWorkspaceQuery,
  Workspace as WorkspaceModel,
  PaginatedApiResponse as WorkspacePaginatedApiResponse
} from '../../workspace/models/workspace.models';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';

import type {
  WorkspaceMember,
  WorkspaceMemberListItem,
  WorkspaceMemberStatus,
  PaginatedApiResponse as MemberPaginatedApiResponse,
  Pagination as MemberPagination
} from '../models/workspace-member.models';
import { WorkspaceMemberApiService } from '../services/workspace-member.service';

import type {
  WorkspaceInvitation,
  WorkspaceInvitationRef,
  WorkspaceInvitationStatus,
  PaginatedApiResponse as InvitationPaginatedApiResponse
} from '../models/workspace-invitation.models';
import { WorkspaceInvitationApiService } from '../services/workspace-invitation.service';

import { SendWorkspaceMemberRequestSidePanel } from '../send-workspace-member-request-side-panel/send-workspace-member-request-side-panel';

type MemberTab =
  | 'all'
  | 'active'
  | 'invitations'
  | 'removed';

type MemberView =
  | 'grid'
  | 'list';

type MemberSort =
  | 'updatedAt'
  | 'createdAt'
  | 'name'
  | 'role';

type UnknownRecord = Record<string, unknown>;

type BadgeVariant =
  | 'success'
  | 'noteYellow'
  | 'danger';

@Component({
  selector: 'app-workspace-members',
  standalone: true,
  imports: [
    FormsModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Avatar,
    Badge,
    Button,
    Loader,
    Select,
    StickyCard,
    Tabs,
    SendWorkspaceMemberRequestSidePanel
  ],
  templateUrl: './workspace-members.html',
  styleUrl: './workspace-members.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceMembers implements OnInit, OnChanges {
  private readonly memberApi = inject(WorkspaceMemberApiService);
  private readonly invitationApi = inject(WorkspaceInvitationApiService);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  @Input() workspaceId = '';
  @Input() roleOptions: readonly SelectOption[] = [];

  @Output() readonly workspaceChange = new EventEmitter<string>();
  @Output() readonly memberCreated = new EventEmitter<WorkspaceMember>();
  @Output() readonly memberChanged = new EventEmitter<WorkspaceMember>();
  @Output() readonly memberRemoved = new EventEmitter<string>();

  private loadedWorkspaceId: string | null = null;
  private memberRequestVersion = 0;
  private invitationRequestVersion = 0;
  private initialized = false;

  readonly LucideEye = LucideEye;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideList = LucideList;
  readonly LucideMail = LucideMail;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideShield = LucideShield;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideUserCheck = LucideUserCheck;
  readonly LucideUserPlus = LucideUserPlus;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;

  readonly workspaces = this.workspaceStore.workspaces;
  readonly loadingWorkspaces = this.workspaceStore.loading;
  readonly workspaceError = this.workspaceStore.error;
  readonly selectedWorkspaceId = computed(
    () => this.workspaceStore.selectedId() ?? ''
  );

  readonly workspaceOptions = computed<readonly SelectOption[]>(() =>
    this.workspaces().map(workspace => ({
      label: this.workspaceName(workspace),
      value: this.workspaceRecordId(workspace),
      icon: LucidePanelsTopLeft
    }))
  );

  readonly selectedWorkspaceLabel = computed(() => {
    const selectedId = this.selectedWorkspaceId();

    const workspace = this.workspaces().find(
      item => this.workspaceRecordId(item) === selectedId
    );

    return workspace
      ? this.workspaceName(workspace)
      : 'Select workspace';
  });

  /*
   * Member state
   */
  readonly members = signal<readonly WorkspaceMemberListItem[]>([]);
  readonly memberMeta = signal<MemberPagination | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  /*
   * Invitation state
   */
  readonly invitations = signal<readonly WorkspaceInvitation[]>([]);
  readonly invitationLoading = signal(false);
  readonly invitationError = signal<string | null>(null);
  readonly invitationBusyIds = signal<ReadonlySet<string>>(new Set());

  /*
   * Shared explorer state
   */
  readonly activeTab = signal<MemberTab>('all');
  readonly view = signal<MemberView>('grid');
  readonly searchTerm = signal('');
  readonly sortBy = signal<MemberSort>('updatedAt');

  readonly memberModalOpen = signal(false);
  readonly memberModalMember = signal<WorkspaceMember | null>(null);

  readonly viewTarget = signal<WorkspaceMemberListItem | null>(null);

  readonly removeTarget = signal<WorkspaceMemberListItem | null>(null);
  readonly removing = signal(false);

  readonly cancelInvitationTarget = signal<WorkspaceInvitation | null>(null);
  readonly cancellingInvitation = signal(false);

  readonly totalCount = computed(
    () => this.members().filter(member => !this.isRemoved(member)).length
  );

  readonly activeCount = computed(
    () => this.members().filter(
      member => this.memberStatus(member) === 'ACTIVE'
    ).length
  );

  readonly invitationCount = computed(
    () => this.invitations().length
  );

  readonly pendingInvitationCount = computed(
    () => this.invitations().filter(
      invitation => this.invitationStatus(invitation) === 'PENDING'
    ).length
  );

  readonly removedCount = computed(
    () => this.members().filter(
      member => this.isRemoved(member)
    ).length
  );

  readonly headerCountLabel = computed(() => {
    const members = this.totalCount();
    const pending = this.pendingInvitationCount();

    const memberLabel =
      `${members} ${members === 1 ? 'member' : 'members'}`;

    if (pending === 0) {
      return memberLabel;
    }

    return `${memberLabel} · ${pending} pending`;
  });

  readonly memberTabs = computed<readonly TabItem[]>(() => [
    {
      value: 'all',
      label: 'All',
      count: this.totalCount(),
      icon: LucideUsers,
      ariaLabel: 'All current members'
    },
    {
      value: 'active',
      label: 'Active',
      count: this.activeCount(),
      icon: LucideUserCheck,
      ariaLabel: 'Active members'
    },
    {
      value: 'invitations',
      label: 'Invitations',
      count: this.invitationCount(),
      icon: LucideMail,
      ariaLabel: 'Workspace invitations'
    },
    {
      value: 'removed',
      label: 'Removed',
      count: this.removedCount(),
      icon: LucideTrash2,
      ariaLabel: 'Removed members'
    }
  ]);

  readonly viewTabs: readonly TabItem[] = [
    {
      value: 'grid',
      label: 'Grid',
      icon: LucideGrid2X2,
      ariaLabel: 'Show workspace access in grid view'
    },
    {
      value: 'list',
      label: 'List',
      icon: LucideList,
      ariaLabel: 'Show workspace access in list view'
    }
  ];

  readonly sortOptions: readonly SelectOption[] = [
    {
      label: 'Recently updated',
      value: 'updatedAt'
    },
    {
      label: 'Recently added',
      value: 'createdAt'
    },
    {
      label: 'Member / email A–Z',
      value: 'name'
    },
    {
      label: 'Role A–Z',
      value: 'role'
    }
  ];

  readonly searchPlaceholder = computed(() =>
    this.activeTab() === 'invitations'
      ? 'Search email, role or status'
      : 'Search member, email or role'
  );

  readonly visibleMembers = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    if (tab === 'invitations') {
      return [];
    }

    return [...this.members()]
      .filter(member => {
        const status = this.memberStatus(member);

        if (tab === 'all' && status === 'REMOVED') {
          return false;
        }

        if (tab === 'active' && status !== 'ACTIVE') {
          return false;
        }

        if (tab === 'removed' && status !== 'REMOVED') {
          return false;
        }

        if (!search) {
          return true;
        }

        return [
          this.memberName(member),
          this.memberEmail(member),
          this.memberRoleName(member),
          this.memberStatusLabel(member),
          this.addedByLabel(member)
        ].some(
          value => value.toLowerCase().includes(search)
        );
      })
      .sort((first, second) => {
        if (sort === 'name') {
          return this.memberName(first).localeCompare(
            this.memberName(second),
            undefined,
            { sensitivity: 'base' }
          );
        }

        if (sort === 'role') {
          return this.memberRoleName(first).localeCompare(
            this.memberRoleName(second),
            undefined,
            { sensitivity: 'base' }
          );
        }

        return (
          this.memberTimestamp(second, sort) -
          this.memberTimestamp(first, sort)
        );
      });
  });

  readonly visibleInvitations = computed(() => {
    if (this.activeTab() !== 'invitations') {
      return [];
    }

    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    return [...this.invitations()]
      .filter(invitation => {
        if (!search) {
          return true;
        }

        return [
          this.invitationEmail(invitation),
          this.invitationRoleName(invitation),
          this.invitationStatusLabel(invitation),
          this.invitationInvitedByLabel(invitation),
          this.invitationMessage(invitation)
        ].some(
          value => value.toLowerCase().includes(search)
        );
      })
      .sort((first, second) => {
        if (sort === 'name') {
          return this.invitationEmail(first).localeCompare(
            this.invitationEmail(second),
            undefined,
            { sensitivity: 'base' }
          );
        }

        if (sort === 'role') {
          return this.invitationRoleName(first).localeCompare(
            this.invitationRoleName(second),
            undefined,
            { sensitivity: 'base' }
          );
        }

        return (
          this.invitationTimestamp(second, sort) -
          this.invitationTimestamp(first, sort)
        );
      });
  });

  constructor() {
    effect(() => {
      const workspaceId = this.workspaceStore.selectedId();

      if (!workspaceId) {
        this.loadedWorkspaceId = null;
        this.clearPageForNoWorkspace();
        return;
      }

      if (this.loadedWorkspaceId === workspaceId) {
        return;
      }

      this.loadedWorkspaceId = workspaceId;
      this.resetInteractionState();
      this.loadWorkspaceAccess(workspaceId);
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
    if (
      !this.initialized ||
      !changes['workspaceId'] ||
      changes['workspaceId'].firstChange
    ) {
      return;
    }

    this.trySelectRequestedWorkspace();
  }

  loadWorkspaces(): void {
    // this.workspaceStore.setLoading(true);

    const query: MyWorkspaceQuery = {
      page: 1,
      limit: 100
    };

    // this.workspaceApi
    //   .getMyWorkspaces(query)
    //   .pipe(
    //     finalize(() =>
    //       this.workspaceStore.setLoading(false)
    //     ),
    //     takeUntilDestroyed(this.destroyRef)
    //   )
    //   .subscribe({
    //     next: response => {
    //       const workspaces =
    //         this.extractWorkspaces(response);

    //       this.workspaceStore.setWorkspaces(
    //         workspaces,
    //         response.pagination ?? null
    //       );

    //       this.ensureWorkspaceSelection();
    //     },
    //     error: error => {
    //       const message = this.errorMessage(
    //         error,
    //         'Unable to load your workspaces.'
    //       );

    //       this.workspaceStore.setError(message);

    //       this.toastService.error(
    //         message,
    //         {
    //           title: 'Could not load workspaces',
    //           dedupeKey: 'workspace-members-workspace-load-error'
    //         }
    //       );
    //     }
    //   });
  }

  loadWorkspaceAccess(
    workspaceId = this.selectedWorkspaceId()
  ): void {
    const id = workspaceId.trim();

    if (!id) {
      this.clearPageForNoWorkspace();
      return;
    }

    this.loadMembers(id);
    this.loadInvitations(id);
  }

  loadMembers(
    workspaceId = this.selectedWorkspaceId()
  ): void {
    const id = workspaceId.trim();
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

    this.memberApi
      .getAll({
        workspaceId: id,
        page: 1,
        limit: 100,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
      .pipe(
        finalize(() => {
          if (
            requestVersion === this.memberRequestVersion
          ) {
            this.loading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (
            requestVersion !== this.memberRequestVersion ||
            this.selectedWorkspaceId() !== id
          ) {
            return;
          }

          this.members.set(
            this.extractMembers(response)
          );
        },
        error: error => {
          if (
            requestVersion !== this.memberRequestVersion ||
            this.selectedWorkspaceId() !== id
          ) {
            return;
          }

          this.members.set([]);
          this.memberMeta.set(null);

          const message = this.errorMessage(
            error,
            'Unable to load workspace members.'
          );

          this.error.set(message);

          this.toastService.error(
            message,
            {
              title: 'Could not load members',
              dedupeKey: 'workspace-members-load-error'
            }
          );
        }
      });
  }

  loadInvitations(
    workspaceId = this.selectedWorkspaceId()
  ): void {
    const id = workspaceId.trim();
    const requestVersion =
      ++this.invitationRequestVersion;

    if (!id) {
      this.invitations.set([]);
      this.invitationLoading.set(false);
      this.invitationError.set(null);
      return;
    }

    this.invitationLoading.set(true);
    this.invitationError.set(null);

    this.invitationApi
      .getAll({
        workspaceId: id,
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      .pipe(
        finalize(() => {
          if (
            requestVersion ===
            this.invitationRequestVersion
          ) {
            this.invitationLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (
            requestVersion !==
            this.invitationRequestVersion ||
            this.selectedWorkspaceId() !== id
          ) {
            return;
          }

          this.invitations.set(
            this.extractInvitations(response)
          );
        },
        error: error => {
          if (
            requestVersion !==
            this.invitationRequestVersion ||
            this.selectedWorkspaceId() !== id
          ) {
            return;
          }

          this.invitations.set([]);

          const message = this.errorMessage(
            error,
            'Unable to load workspace invitations.'
          );

          this.invitationError.set(message);

          this.toastService.error(
            message,
            {
              title: 'Could not load invitations',
              dedupeKey: 'workspace-invitations-load-error'
            }
          );
        }
      });
  }

  onWorkspaceChange(
    value: SelectValue | SelectValue[] | null
  ): void {
    if (
      typeof value !== 'string' ||
      !value.trim()
    ) {
      return;
    }

    const id = value.trim();

    if (id === this.selectedWorkspaceId()) {
      return;
    }

    this.workspaceStore.select(id);
    this.workspaceChange.emit(id);
  }

  setMemberTab(value: TabValue): void {
    if (
      value === 'all' ||
      value === 'active' ||
      value === 'invitations' ||
      value === 'removed'
    ) {
      this.activeTab.set(value);
      this.searchTerm.set('');
    }
  }

  setMemberView(value: TabValue): void {
    if (
      value === 'grid' ||
      value === 'list'
    ) {
      this.view.set(value);
    }
  }

  updateSearch(value: InputValue): void {
    this.searchTerm.set(
      String(value ?? '')
    );
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(
    value: SelectValue | SelectValue[] | null
  ): void {
    if (
      value === null ||
      Array.isArray(value)
    ) {
      return;
    }

    if (
      value === 'updatedAt' ||
      value === 'createdAt' ||
      value === 'name' ||
      value === 'role'
    ) {
      this.sortBy.set(value);
    }
  }

  openSendRequest(): void {
    if (!this.selectedWorkspaceId()) {
      this.toastService.warning(
        'Select a workspace before sending a member request.',
        {
          title: 'Workspace required',
          dedupeKey: 'workspace-members-workspace-required'
        }
      );

      return;
    }

    this.memberModalMember.set(null);
    this.memberModalOpen.set(true);
  }

  openMemberView(
    member: WorkspaceMemberListItem
  ): void {
    if (this.isBusy(member)) {
      return;
    }

    this.viewTarget.set(member);
  }

  closeMemberViewDialog(): void {
    this.viewTarget.set(null);
  }

  editViewedMember(
    member: WorkspaceMemberListItem
  ): void {
    this.viewTarget.set(null);
    this.openRoleEditor(member);
  }

  openRoleEditor(
    member: WorkspaceMemberListItem
  ): void {
    if (
      this.isBusy(member) ||
      this.isRemoved(member) ||
      !this.canManageMember(member)
    ) {
      return;
    }

    /*
     * The list API intentionally returns a lightweight DTO.
     * The existing role editor only needs member ID + role ID, so create a
     * small compatibility object instead of requesting the heavy member
     * document again.
     */
    this.memberModalMember.set(
      this.toEditorMember(member)
    );
    this.memberModalOpen.set(true);
  }

  closeMemberModal(): void {
    this.memberModalOpen.set(false);
    this.memberModalMember.set(null);
  }

  onMemberSaved(
    member: WorkspaceMember | any
  ): void {
    /*
     * Invitation creation emits null.
     * Existing member role editing emits the updated member.
     */
    if (member) {
      const id = this.memberId(member);

      const exists = this.members().some(
        item => this.memberId(item) === id
      );

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
    if (
      this.isBusy(member) ||
      this.isRemoved(member) ||
      !this.canManageMember(member)
    ) {
      return;
    }

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

    if (!member) {
      return;
    }

    const id = this.memberId(member);

    if (!id) {
      return;
    }

    this.removing.set(true);
    this.setMemberBusy(id, true);

    this.memberApi
      .remove(id)
      .pipe(
        finalize(() => {
          this.removing.set(false);
          this.setMemberBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.removeTarget.set(null);
          this.memberRemoved.emit(id);

          this.toastService.success(
            `“${this.memberName(member)}” was removed from the workspace.`,
            {
              title: 'Member removed',
              dedupeKey: 'workspace-member-remove-success'
            }
          );

          this.loadMembers();
        },
        error: error => {
          this.removeTarget.set(null);

          const message = this.errorMessage(
            error,
            'Unable to remove workspace member.'
          );

          this.toastService.error(
            message,
            {
              title: 'Could not remove member',
              dedupeKey: 'workspace-member-remove-error'
            }
          );
        }
      });
  }

  restoreMember(member: WorkspaceMemberListItem): void {
    const id = this.memberId(member);

    if (
      !id ||
      this.isBusy(member)
    ) {
      return;
    }

    this.setMemberBusy(id, true);

    this.memberApi
      .restore(id)
      .pipe(
        finalize(
          () => this.setMemberBusy(id, false)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.memberChanged.emit(response.data);

          this.toastService.success(
            `“${this.memberName(member)}” was restored.`,
            {
              title: 'Member restored',
              dedupeKey: 'workspace-member-restore-success'
            }
          );

          this.loadMembers();
        },
        error: error => {
          const message = this.errorMessage(
            error,
            'Unable to restore workspace member.'
          );

          this.toastService.error(
            message,
            {
              title: 'Restore failed',
              dedupeKey: 'workspace-member-restore-error'
            }
          );
        }
      });
  }

  requestCancelInvitation(
    invitation: WorkspaceInvitation
  ): void {
    if (
      !this.canCancelInvitation(invitation) ||
      this.isInvitationBusy(invitation)
    ) {
      return;
    }

    this.cancelInvitationTarget.set(invitation);
  }

  closeCancelInvitationDialog(): void {
    if (!this.cancellingInvitation()) {
      this.cancelInvitationTarget.set(null);
    }
  }

  confirmCancelInvitation(): void {
    const invitation =
      this.cancelInvitationTarget();

    if (!invitation) {
      return;
    }

    const id = this.invitationId(invitation);

    if (!id) {
      return;
    }

    this.cancellingInvitation.set(true);
    this.setInvitationBusy(id, true);

    this.invitationApi
      .cancel(id)
      .pipe(
        finalize(() => {
          this.cancellingInvitation.set(false);
          this.setInvitationBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.cancelInvitationTarget.set(null);

          this.toastService.success(
            `Invitation to ${this.invitationEmail(invitation)} was cancelled.`,
            {
              title: 'Invitation cancelled',
              dedupeKey: 'workspace-invitation-cancel-success'
            }
          );

          this.loadInvitations();
        },
        error: error => {
          this.cancelInvitationTarget.set(null);

          const message = this.errorMessage(
            error,
            'Unable to cancel workspace invitation.'
          );

          this.toastService.error(
            message,
            {
              title: 'Could not cancel invitation',
              dedupeKey: 'workspace-invitation-cancel-error'
            }
          );
        }
      });
  }

  memberId(
    member: WorkspaceMemberListItem
  ): string {
    return String(
      member.id ?? ''
    ).trim();
  }

  memberName(
    member: WorkspaceMemberListItem
  ): string {
    return (
      String(
        member.user?.displayName ?? ''
      ).trim() ||
      this.emailName(
        member.user?.email
      ) ||
      'Workspace member'
    );
  }

  memberEmail(
    member: WorkspaceMemberListItem
  ): string {
    return String(
      member.user?.email ?? ''
    ).trim();
  }

  memberRoleName(
    member: WorkspaceMemberListItem
  ): string {
    return (
      String(
        member.role?.name ?? ''
      ).trim() ||
      String(
        member.role?.code ?? ''
      ).trim() ||
      'Member'
    );
  }

  memberStatus(
    member: WorkspaceMemberListItem
  ): WorkspaceMemberStatus {
    const value = String(
      member.status ?? 'ACTIVE'
    ).toUpperCase();

    if (
      value === 'ACTIVE' ||
      value === 'REMOVED'
    ) {
      return value;
    }

    return 'INVITED';
  }

  memberStatusLabel(
    member: WorkspaceMemberListItem
  ): string {
    const status =
      this.memberStatus(member).toLowerCase();

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  }

  memberStatusVariant(
    member: WorkspaceMemberListItem
  ): BadgeVariant {
    const status =
      this.memberStatus(member);

    if (status === 'ACTIVE') {
      return 'success';
    }

    if (status === 'REMOVED') {
      return 'danger';
    }

    return 'noteYellow';
  }

  memberJoinedLabel(
    member: WorkspaceMemberListItem
  ): string {
    return this.formatDate(
      member.joinedAt
    );
  }

  memberLastActiveLabel(
    member: WorkspaceMemberListItem
  ): string {
    return this.formatActivity(
      member.lastActiveAt
    );
  }

  addedByLabel(
    member: WorkspaceMemberListItem
  ): string {
    const addedBy = member.addedBy;

    if (!addedBy) {
      return '—';
    }

    return (
      String(
        addedBy.displayName ?? ''
      ).trim() ||
      this.emailName(
        addedBy.email
      ) ||
      String(
        addedBy.email ?? ''
      ).trim() ||
      '—'
    );
  }

  memberSecondaryLabel(
    member: WorkspaceMemberListItem
  ): string {
    const email =
      this.memberEmail(member);

    if (!email) {
      return member.isCurrentUser
        ? 'You'
        : 'Workspace member';
    }

    return member.isCurrentUser
      ? `${email} · You`
      : email;
  }

  isOwner(
    member: WorkspaceMemberListItem
  ): boolean {
    if (member.isOwner) {
      return true;
    }

    const code =
      String(
        member.role?.code ?? ''
      )
        .trim()
        .toUpperCase();

    return (
      code === 'WORKSPACE_OWNER' ||
      code === 'OWNER'
    );
  }

  isCurrentUser(
    member: WorkspaceMemberListItem
  ): boolean {
    return Boolean(
      member.isCurrentUser
    );
  }

  canManageMember(
    member: WorkspaceMemberListItem
  ): boolean {
    return (
      !this.isOwner(member) &&
      !this.isCurrentUser(member)
    );
  }

  memberManageBlockedReason(
    member: WorkspaceMemberListItem
  ): string {
    if (this.isOwner(member)) {
      return 'Workspace owner is protected';
    }

    if (this.isCurrentUser(member)) {
      return 'Your own membership is managed separately';
    }

    return 'This member cannot be changed';
  }

  isRemoved(
    member: WorkspaceMemberListItem
  ): boolean {
    return (
      this.memberStatus(member) ===
      'REMOVED'
    );
  }

  isBusy(
    member: WorkspaceMemberListItem
  ): boolean {
    return this.busyIds().has(
      this.memberId(member)
    );
  }

  invitationId(
    invitation: WorkspaceInvitation
  ): string {
    return String(
      invitation.id ??
      invitation._id ??
      ''
    );
  }

  invitationEmail(
    invitation: WorkspaceInvitation
  ): string {
    return String(
      invitation.email ?? ''
    ).trim();
  }

  invitationName(
    invitation: WorkspaceInvitation
  ): string {
    return (
      this.emailName(
        this.invitationEmail(invitation)
      ) ||
      'Invited user'
    );
  }

  invitationRoleName(
    invitation: WorkspaceInvitation
  ): string {
    return this.invitationRefLabel(
      invitation.roleId,
      'Workspace role'
    );
  }

  invitationStatus(
    invitation: WorkspaceInvitation
  ): WorkspaceInvitationStatus {
    const value = String(
      invitation.status ?? 'PENDING'
    ).toUpperCase();

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

  invitationStatusLabel(
    invitation: WorkspaceInvitation
  ): string {
    const status =
      this.invitationStatus(invitation)
        .toLowerCase();

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  }

  invitationStatusVariant(
    invitation: WorkspaceInvitation
  ): BadgeVariant {
    const status =
      this.invitationStatus(invitation);

    if (status === 'ACCEPTED') {
      return 'success';
    }

    if (status === 'PENDING') {
      return 'noteYellow';
    }

    return 'danger';
  }

  invitationCreatedLabel(
    invitation: WorkspaceInvitation
  ): string {
    return this.formatDate(
      invitation.createdAt
    );
  }

  invitationExpiryLabel(
    invitation: WorkspaceInvitation
  ): string {
    return this.formatDate(
      invitation.expiresAt
    );
  }

  invitationInvitedByLabel(
    invitation: WorkspaceInvitation
  ): string {
    return (
      this.invitationRefLabel(
        invitation.invitedBy,
        ''
      ) ||
      this.invitationRefLabel(
        invitation.createdBy ?? null,
        ''
      ) ||
      '—'
    );
  }

  invitationMessage(
    invitation: WorkspaceInvitation
  ): string {
    return String(
      invitation.message ?? ''
    ).trim();
  }

  invitationMessagePreview(
    invitation: WorkspaceInvitation
  ): string {
    const message =
      this.invitationMessage(invitation);

    if (!message) {
      return '';
    }

    return message.length > 72
      ? `${message.slice(0, 72).trim()}…`
      : message;
  }

  invitationSecondaryLabel(
    invitation: WorkspaceInvitation
  ): string {
    return (
      this.invitationMessagePreview(invitation) ||
      'Workspace invitation'
    );
  }

  canCancelInvitation(
    invitation: WorkspaceInvitation
  ): boolean {
    return (
      this.invitationStatus(invitation) ===
      'PENDING'
    );
  }

  isInvitationBusy(
    invitation: WorkspaceInvitation
  ): boolean {
    return this.invitationBusyIds().has(
      this.invitationId(invitation)
    );
  }

  private setMemberBusy(
    id: string,
    busy: boolean
  ): void {
    const next = new Set(
      this.busyIds()
    );

    busy
      ? next.add(id)
      : next.delete(id);

    this.busyIds.set(next);
  }

  private setInvitationBusy(
    id: string,
    busy: boolean
  ): void {
    const next = new Set(
      this.invitationBusyIds()
    );

    busy
      ? next.add(id)
      : next.delete(id);

    this.invitationBusyIds.set(next);
  }

  private workspaceRecordId(
    workspace: WorkspaceModel
  ): string {
    const record =
      workspace as unknown as UnknownRecord;

    return String(
      record['id'] ??
      record['_id'] ??
      ''
    );
  }

  private workspaceName(
    workspace: WorkspaceModel
  ): string {
    return (
      workspace.name?.trim() ||
      'Untitled workspace'
    );
  }

  private ensureWorkspaceSelection(): void {
    if (!this.workspaces().length) {
      this.workspaceStore.select(null);
      return;
    }

    if (this.trySelectRequestedWorkspace()) {
      return;
    }

    const selected =
      this.selectedWorkspaceId();

    if (
      selected &&
      this.workspaces().some(
        item =>
          this.workspaceRecordId(item) ===
          selected
      )
    ) {
      return;
    }

    this.workspaceStore.select(
      this.workspaceRecordId(
        this.workspaces()[0]
      )
    );
  }

  private trySelectRequestedWorkspace(): boolean {
    const requestedId =
      String(this.workspaceId ?? '').trim();

    if (!requestedId) {
      return false;
    }

    const exists = this.workspaces().some(
      workspace =>
        this.workspaceRecordId(workspace) ===
        requestedId
    );

    if (!exists) {
      return false;
    }

    if (
      this.selectedWorkspaceId() !==
      requestedId
    ) {
      this.workspaceStore.select(requestedId);
      this.workspaceChange.emit(requestedId);
    }

    return true;
  }

  private clearPageForNoWorkspace(): void {
    this.memberRequestVersion++;
    this.invitationRequestVersion++;

    this.loading.set(false);
    this.invitationLoading.set(false);

    this.error.set(null);
    this.invitationError.set(null);

    this.members.set([]);
    this.memberMeta.set(null);
    this.invitations.set([]);

    this.resetInteractionState();
  }

  private resetInteractionState(): void {
    this.searchTerm.set('');
    this.activeTab.set('all');

    this.memberModalOpen.set(false);
    this.memberModalMember.set(null);

    this.viewTarget.set(null);
    this.removeTarget.set(null);
    this.cancelInvitationTarget.set(null);

    this.busyIds.set(new Set());
    this.invitationBusyIds.set(new Set());
  }

  private extractWorkspaces(
    response: WorkspacePaginatedApiResponse<WorkspaceModel>
  ): readonly WorkspaceModel[] {
    const data = response.data as unknown;

    if (Array.isArray(data)) {
      return data as WorkspaceModel[];
    }

    if (
      !data ||
      typeof data !== 'object'
    ) {
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

  private extractMembers(
    response:
      MemberPaginatedApiResponse<WorkspaceMemberListItem>
  ): readonly WorkspaceMemberListItem[] {
    this.memberMeta.set(
      response.meta ??
      response.pagination ??
      null
    );

    return Array.isArray(
      response.data
    )
      ? response.data
      : [];
  }

  private extractInvitations(
    response: InvitationPaginatedApiResponse<WorkspaceInvitation>
  ): readonly WorkspaceInvitation[] {
    const data = response.data as unknown;

    if (Array.isArray(data)) {
      return data as WorkspaceInvitation[];
    }

    if (
      !data ||
      typeof data !== 'object'
    ) {
      return [];
    }

    const record = data as UnknownRecord;

    const candidates = [
      record['items'],
      record['invitations'],
      record['workspaceInvitations'],
      record['docs'],
      record['results']
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate as WorkspaceInvitation[];
      }
    }

    return [];
  }

  private memberTimestamp(
    member: WorkspaceMemberListItem,
    field: 'createdAt' | 'updatedAt'
  ): number {
    const value =
      field === 'createdAt'
        ? member.joinedAt
        : member.lastActiveAt ??
        member.joinedAt;

    if (!value) {
      return 0;
    }

    const timestamp =
      new Date(value).getTime();

    return Number.isNaN(timestamp)
      ? 0
      : timestamp;
  }

  private invitationTimestamp(
    invitation: WorkspaceInvitation,
    field: 'createdAt' | 'updatedAt'
  ): number {
    const value = invitation[field];

    if (!value) {
      return 0;
    }

    const timestamp =
      new Date(value).getTime();

    return Number.isNaN(timestamp)
      ? 0
      : timestamp;
  }

  private formatDate(
    value:
      | string
      | Date
      | null
      | undefined
  ): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    ).format(date);
  }

  private formatActivity(
    value:
      | string
      | Date
      | null
      | undefined
  ): string {
    if (!value) {
      return 'Not yet';
    }

    const date =
      new Date(value);

    const timestamp =
      date.getTime();

    if (Number.isNaN(timestamp)) {
      return '—';
    }

    const diffMs =
      Date.now() - timestamp;

    if (diffMs < 60_000) {
      return 'Just now';
    }

    const minutes =
      Math.floor(
        diffMs / 60_000
      );

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days === 1) {
      return 'Yesterday';
    }

    if (days < 7) {
      return `${days} days ago`;
    }

    return this.formatDate(
      date
    );
  }

  private toEditorMember(
    member: WorkspaceMemberListItem
  ): WorkspaceMember {
    const addedBy =
      member.addedBy
        ? {
          id:
            member.addedBy.id,
          _id:
            member.addedBy.id,
          displayName:
            member.addedBy.displayName,
          email:
            member.addedBy.email
        }
        : null;

    return {
      id:
        member.id,
      _id:
        member.id,
      workspaceId:
        this.selectedWorkspaceId(),
      userId: {
        id:
          member.user.id,
        _id:
          member.user.id,
        displayName:
          member.user.displayName,
        email:
          member.user.email
      },
      roleId: {
        id:
          member.role.id,
        _id:
          member.role.id,
        name:
          member.role.name,
        displayName:
          member.role.name,
        code:
          member.role.code
      },
      status:
        member.status,
      invitedBy:
        addedBy,
      joinedAt:
        member.joinedAt,
      createdBy:
        addedBy
    };
  }

  private invitationRefLabel(
    ref:
      | WorkspaceInvitationRef
      | null
      | undefined,
    fallback: string
  ): string {
    if (!ref) {
      return fallback;
    }

    if (typeof ref === 'string') {
      return fallback;
    }

    return (
      String(ref.displayName ?? '').trim() ||
      String(ref.name ?? '').trim() ||
      String(ref.code ?? '').trim() ||
      String(ref.email ?? '').trim() ||
      fallback
    );
  }

  private emailName(email: unknown): string {
    const value =
      typeof email === 'string'
        ? email.trim()
        : '';

    return value.includes('@')
      ? value.split('@')[0]
      : value;
  }

  private errorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (
      !error ||
      typeof error !== 'object'
    ) {
      return fallback;
    }

    const record =
      error as UnknownRecord;

    const nested =
      record['error'];

    if (
      nested &&
      typeof nested === 'object'
    ) {
      const message =
        (nested as UnknownRecord)['message'];

      if (
        typeof message === 'string' &&
        message.trim()
      ) {
        return message;
      }
    }

    const message = record['message'];

    return (
      typeof message === 'string' &&
      message.trim()
    )
      ? message
      : fallback;
  }
}
