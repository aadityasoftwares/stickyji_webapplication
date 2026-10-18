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
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, map, Observable, of, Subscription, timer } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import {
  LucideCheck,
  LucideChevronDown,
  LucideChevronRight,
  LucideClock3,
  LucideKey,
  LucideLock,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucidePower,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideShield,
  LucideShieldCheck,
  LucideTrash2,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { Badge, type BadgeVariant } from '../../../shared/components/badge/badge';
import { BulkActionPanel } from '../../../shared/components/bulk-action-panel/bulk-action-panel';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Loader } from '../../../shared/components/loader/loader';
import {
  Select,
  type SelectOption,
  type SelectValue,
} from '../../../shared/components/select/select';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { Switch } from '../../../shared/components/switch/switch';
import { Tabs, type TabItem, type TabValue } from '../../../shared/components/tabs/tabs';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { Highlight } from '../../../shared/directives/highlight.directive';
import { UserDatePipe } from '../../../shared/pipes/user-date.pipe';
import { UserTimePipe } from '../../../shared/pipes/user-time.pipe';
import { extractErrorMessage, idOf } from '../../../shared/functions/common.function';
import { humanize } from '../../../shared/functions/string.functions';
import { toTimestamp } from '../../../shared/functions/date.function';
import { GROUP_ACCENTS, VIEW_TABS } from '../../../shared/constants/common.constants';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { UserPreferenceStore } from '../../user-preferences/services/user-preference.store';
import { USER_PREFERENCE_KEYS } from '../../user-preferences/models/user-preference.models';
import { AuthStore } from '../../../public/auth/state/auth.store';
import { AddEditWorkspaceRoleSidePanel } from '../add-edit-workspace-role-side-panel/add-edit-workspace-role-side-panel';
import { AddEditPermissionSidePanel } from '../add-edit-permission-side-panel/add-edit-permission-side-panel';
import { ViewRolePermissionsModal } from '../view-role-permissions-modal/view-role-permissions-modal';
import { WorkspaceRoleWrapper } from '../../workspace/workspace-role-wrapper/workspace-role-wrapper';
import type { PermissionGroup, Permission } from '../models/permission.models';
import type { WorkspaceRole } from '../models/workspace-role.models';
import { PermissionApiService } from '../services/permission.service';
import { WorkspaceRoleApiService } from '../services/workspace-role.service';

export interface WorkspaceRoleGroup {
  id: string;
  label: string;
  type: 'system' | 'custom' | 'inactive';
  count: number;
  accent: string;
  items: WorkspaceRole[];
}

type AccessView = 'grid' | 'list';
type RoleTab = 'all' | 'system' | 'custom' | 'inactive';
type RoleSort = 'updatedAt' | 'name' | 'priority' | 'createdAt' | 'nameDesc' | 'oldest';

const ROLE_SORT_PREFERENCES: Record<RoleSort, string> = {
  priority: 'PRIORITY',
  updatedAt: 'RECENTLY_UPDATED',
  name: 'NAME_ASC',
  createdAt: 'RECENTLY_CREATED',
  nameDesc: 'NAME_DESC',
  oldest: 'OLDEST_FIRST',
};

@Component({
  selector: 'app-roles-permissions',
  standalone: true,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Badge,
    BulkActionPanel,
    Button,
    Checkbox,
    Loader,
    Select,
    StickyCard,
    Switch,
    Tabs,
    Tooltip,
    Highlight,
    UserDatePipe,
    UserTimePipe,
    AddEditWorkspaceRoleSidePanel,
    AddEditPermissionSidePanel,
    ViewRolePermissionsModal,
    WorkspaceRoleWrapper,
  ],
  templateUrl: './roles-permissions.html',
  styleUrl: './roles-permissions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPermissions implements OnInit, OnChanges {
  private readonly roleApi = inject(WorkspaceRoleApiService);
  private readonly permissionApi = inject(PermissionApiService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  readonly preferencesReady = this.userPreferenceStore.ready;
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  @Input() workspaceId = '';
  @Output() readonly workspaceChange = new EventEmitter<string>();

  private loadedWorkspaceId: string | null = null;
  private initialized = false;
  private roleRequest?: Subscription;
  private roleRequestVersion = 0;
  private permissionRequestVersion = 0;

  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucideClock3 = LucideClock3;
  readonly LucideKey = LucideKey;
  readonly LucideLock = LucideLock;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucidePower = LucidePower;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideShield = LucideShield;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;

  readonly collapsedGroups = signal<Set<string>>(new Set());
  readonly selectedRoleIds = signal<Set<string>>(new Set());
  readonly selectedRoleId = signal<string | null>(null);
  readonly contextMenuRole = signal<WorkspaceRole | null>(null);
  readonly contextMenuPosition = signal({ x: 0, y: 0 });
  private readonly roleContextMenuTrigger = viewChild<MatMenuTrigger>('roleContextMenuTrigger');
  readonly selectedCount = computed(() => this.selectedRoleIds().size);

  readonly workspaces = this.workspaceStore.workspaces;
  readonly loadingWorkspaces = this.workspaceStore.loading;
  readonly workspaceError = this.workspaceStore.error;
  readonly selectedWorkspaceId = computed(() => this.workspaceStore.selectedId() ?? '');

  readonly workspaceOptions = computed<readonly SelectOption[]>(() =>
    this.workspaces().map((workspace) => ({
      label: workspace.name?.trim() || 'Untitled workspace',
      value: workspace.id,
      icon: LucidePanelsTopLeft,
    })),
  );

  readonly selectedWorkspaceLabel = computed(() => {
    const selectedId = this.selectedWorkspaceId();
    const workspace = this.workspaces().find((item) => item.id === selectedId);
    return workspace?.name?.trim() || 'Select workspace';
  });

  readonly roles = signal<readonly WorkspaceRole[]>([]);
  readonly permissionGroups = signal<readonly PermissionGroup[]>([]);

  readonly loadingRoles = signal(false);
  readonly loadingPermissions = signal(false);
  readonly roleError = signal<string | null>(null);
  readonly permissionError = signal<string | null>(null);

  readonly view = computed<AccessView>(() =>
    String(this.userPreferenceStore.workspaceRoleView()).toUpperCase() === 'LIST' ? 'list' : 'grid',
  );
  readonly activeRoleTab = computed<RoleTab>(() => {
    const value = String(this.userPreferenceStore.workspaceRoleStatusFilter()).toLowerCase();
    return value === 'system' || value === 'custom' || value === 'inactive' ? value : 'all';
  });
  readonly searchTerm = signal('');
  readonly roleSort = computed<RoleSort>(() => {
    switch (String(this.userPreferenceStore.workspaceRoleSortOrder()).toUpperCase()) {
      case 'RECENTLY_UPDATED':
      case 'UPDATED_AT':
        return 'updatedAt';
      case 'NAME_ASC':
      case 'NAME':
        return 'name';
      case 'RECENTLY_CREATED':
      case 'CREATED_AT':
        return 'createdAt';
      case 'NAME_DESC':
        return 'nameDesc';
      case 'OLDEST_FIRST':
        return 'oldest';
      default:
        return 'priority';
    }
  });
  readonly permissionModule = signal('all');
  readonly busyRoleIds = signal<ReadonlySet<string>>(new Set());

  readonly canManageGlobalPermissions = computed(() => this.authStore.canManageGlobalPermissions());

  readonly roleEditorOpen = signal(false);
  readonly editorRole = signal<WorkspaceRole | null>(null);
  readonly permissionViewerOpen = signal(false);
  readonly permissionViewerRole = signal<WorkspaceRole | null>(null);
  readonly deleteTarget = signal<WorkspaceRole | null>(null);
  readonly deleting = signal(false);
  readonly bulkBusy = signal(false);

  readonly permissionSort = signal<'module' | 'name' | 'code' | 'action'>('module');
  readonly permissionEditorOpen = signal(false);
  readonly editorPermission = signal<Permission | null>(null);
  readonly permissionReadOnly = signal(false);
  readonly deletePermissionTarget = signal<Permission | null>(null);
  readonly deletingPermission = signal(false);
  readonly busyPermissionIds = signal<ReadonlySet<string>>(new Set());
  readonly collapsedPermissionGroups = signal<Set<string>>(new Set());

  readonly permissionSortOptions: readonly SelectOption[] = [
    { label: 'Module', value: 'module' },
    { label: 'Name A–Z', value: 'name' },
    { label: 'Code', value: 'code' },
    { label: 'Action', value: 'action' },
  ];

  readonly activeRolesCount = computed(
    () => this.roles().filter((role) => role.isActive !== false).length,
  );
  readonly systemRolesCount = computed(
    () => this.roles().filter((role) => role.isSystem && role.isActive !== false).length,
  );
  readonly customRolesCount = computed(
    () => this.roles().filter((role) => !role.isSystem && role.isActive !== false).length,
  );
  readonly inactiveRolesCount = computed(
    () => this.roles().filter((role) => !role.isSystem && role.isActive === false).length,
  );

  readonly allPermissions = computed<readonly Permission[]>(() =>
    this.permissionGroups().flatMap((group) => group.permissions),
  );

  readonly assignablePermissionGroups = computed<readonly PermissionGroup[]>(() =>
    this.permissionGroups()
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => permission.isActive !== false),
      }))
      .filter((group) => group.permissions.length > 0),
  );

  readonly viewTabs: readonly TabItem[] = VIEW_TABS;

  readonly roleTabs = computed<readonly TabItem[]>(() => [
    {
      value: 'all',
      label: 'All',
      count: this.activeRolesCount(),
      icon: LucideShield,
      ariaLabel: 'All active roles',
    },
    {
      value: 'system',
      label: 'System',
      count: this.systemRolesCount(),
      icon: LucideLock,
      ariaLabel: 'System roles',
    },
    {
      value: 'custom',
      label: 'Custom',
      count: this.customRolesCount(),
      icon: LucidePencil,
      ariaLabel: 'Custom roles',
    },
    {
      value: 'inactive',
      label: 'Inactive',
      count: this.inactiveRolesCount(),
      icon: LucidePower,
      ariaLabel: 'Inactive roles',
    },
  ]);

  readonly roleSortOptions: readonly SelectOption[] = [
    { label: 'Role level', value: 'priority' },
    { label: 'Recently updated', value: 'updatedAt' },
    { label: 'Role A–Z', value: 'name' },
    { label: 'Role Z–A', value: 'nameDesc' },
    { label: 'Recently created', value: 'createdAt' },
    { label: 'Oldest first', value: 'oldest' },
  ];

  readonly permissionModuleOptions = computed<readonly SelectOption[]>(() => [
    { label: 'All modules', value: 'all' },
    ...this.permissionGroups().map((group) => ({
      label: this.moduleLabel(group.module),
      value: group.module,
    })),
  ]);

  readonly visibleRoles = computed(() => {
    const tab = this.activeRoleTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.roleSort();

    return [...this.roles()]
      .filter((role) => {
        if (tab === 'all' && role.isActive === false) return false;
        if (tab === 'system' && (!role.isSystem || role.isActive === false)) return false;
        if (tab === 'custom' && (role.isSystem || role.isActive === false)) return false;
        if (tab === 'inactive' && (role.isSystem || role.isActive !== false)) return false;

        if (!search) return true;

        const permissionText = (Array.isArray(role.permissions) ? role.permissions : [])
          .map((permission) =>
            typeof permission === 'string'
              ? permission
              : `${permission?.displayName ?? ''} ${permission?.code ?? ''} ${permission?.module ?? ''}`,
          )
          .join(' ');

        return [
          this.roleDisplayName(role),
          role.name,
          role.code,
          role.description ?? '',
          permissionText,
        ].some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((first, second) => {
        if (sort === 'name' || sort === 'nameDesc') {
          return (
            (sort === 'nameDesc' ? -1 : 1) *
            this.roleDisplayName(first).localeCompare(this.roleDisplayName(second), undefined, {
              sensitivity: 'base',
            })
          );
        }

        if (sort === 'priority') {
          const priorityDifference = (second.priority ?? 0) - (first.priority ?? 0);
          if (priorityDifference !== 0) return priorityDifference;
          return this.roleDisplayName(first).localeCompare(this.roleDisplayName(second));
        }

        if (sort === 'createdAt')
          return this.timestamp(second.createdAt) - this.timestamp(first.createdAt);
        if (sort === 'oldest')
          return this.timestamp(first.createdAt) - this.timestamp(second.createdAt);
        return this.timestamp(second.updatedAt) - this.timestamp(first.updatedAt);
      });
  });

  readonly roleGroups = computed<WorkspaceRoleGroup[]>(() => {
    const roles = this.visibleRoles();
    const tab = this.activeRoleTab();

    const systemRoles = roles.filter((role) => role.isSystem && role.isActive !== false);
    const customRoles = roles.filter((role) => !role.isSystem && role.isActive !== false);
    const inactiveRoles = roles.filter((role) => role.isActive === false);
    const groups: WorkspaceRoleGroup[] = [
      {
        id: 'system',
        label: 'System Roles',
        type: 'system',
        count: systemRoles.length,
        accent: GROUP_ACCENTS.BLUE,
        items: systemRoles,
      },
      {
        id: 'custom',
        label: 'Custom Roles',
        type: 'custom',
        count: customRoles.length,
        accent: GROUP_ACCENTS.GREEN,
        items: customRoles,
      },
      {
        id: 'inactive',
        label: 'Inactive Roles',
        type: 'inactive',
        count: inactiveRoles.length,
        accent: GROUP_ACCENTS.SLATE,
        items: inactiveRoles,
      },
    ];

    return groups.filter((group) =>
      tab === 'all' ? group.type !== 'inactive' || group.count > 0 : group.type === tab,
    );
  });

  readonly visiblePermissions = computed(() => {
    const module = this.permissionModule();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.permissionSort();

    return [...this.allPermissions()]
      .filter((permission) => {
        if (module !== 'all' && permission.module !== module) return false;
        if (!search) return true;

        return [
          permission.displayName,
          permission.name,
          permission.code,
          permission.module,
          permission.action,
          permission.access,
          permission.description ?? '',
        ].some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((first, second) => {
        if (sort === 'name') {
          return String(first.displayName ?? first.name ?? '').localeCompare(
            String(second.displayName ?? second.name ?? ''),
            undefined,
            { sensitivity: 'base' },
          );
        }
        if (sort === 'code') {
          return String(first.code ?? '').localeCompare(String(second.code ?? ''));
        }
        if (sort === 'action') {
          return String(first.action ?? '').localeCompare(String(second.action ?? ''));
        }
        return (
          String(first.module ?? '').localeCompare(String(second.module ?? '')) ||
          (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
          String(first.displayName ?? '').localeCompare(String(second.displayName ?? ''))
        );
      });
  });

  readonly visiblePermissionGroups = computed(() => {
    const permissions = this.visiblePermissions();
    const groupsMap = new Map<string, Permission[]>();
    for (const p of permissions) {
      const mod = p.module || 'OTHER';
      const list = groupsMap.get(mod) ?? [];
      list.push(p);
      groupsMap.set(mod, list);
    }
    return Array.from(groupsMap.entries()).map(([module, perms]) => ({
      id: module,
      label: this.moduleLabel(module),
      module,
      count: perms.length,
      permissions: perms,
    }));
  });

  constructor() {
    effect(() => {
      this.workspaces();
      if (!this.loadingWorkspaces()) untracked(() => this.trySelectRequestedWorkspace());
    });
    effect(() => {
      const workspaceId = this.workspaceStore.selectedId();

      if (!workspaceId) {
        this.loadedWorkspaceId = null;
        this.roleRequestVersion++;
        this.roleRequest?.unsubscribe();
        this.loadingRoles.set(false);
        this.roles.set([]);
        this.roleError.set(null);
        this.resetInteractionState();
        return;
      }

      if (this.loadedWorkspaceId === workspaceId) return;

      this.loadedWorkspaceId = workspaceId;
      this.resetInteractionState();
      this.loadRoles(workspaceId);
    });
  }

  ngOnInit(): void {
    this.initialized = true;
    this.userPreferenceStore.load();
    this.loadPermissions();
    this.loadWorkspaces();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized || !changes['workspaceId'] || changes['workspaceId'].firstChange) return;
    this.trySelectRequestedWorkspace();
  }

  loadWorkspaces(force = false): void {
    this.workspaceStore.load(force);
  }

  loadRoles(workspaceId = this.selectedWorkspaceId()): void {
    const id = workspaceId.trim();
    const requestVersion = ++this.roleRequestVersion;
    this.roleRequest?.unsubscribe();

    if (!id) {
      this.loadingRoles.set(false);
      this.roles.set([]);
      this.roleError.set(null);
      return;
    }

    this.loadingRoles.set(true);
    this.roleError.set(null);

    this.roleRequest = this.roleApi
      .getWorkspaceRoles(id)
      .pipe(
        finalize(() => {
          if (requestVersion === this.roleRequestVersion) this.loadingRoles.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (roles) => {
          if (requestVersion !== this.roleRequestVersion || this.selectedWorkspaceId() !== id)
            return;
          this.roles.set(roles);
          const roleIds = new Set(
            roles.filter((role) => this.canSelectRole(role)).map((role) => this.roleId(role)),
          );
          this.selectedRoleIds.update(
            (selected) => new Set([...selected].filter((roleId) => roleIds.has(roleId))),
          );
        },
        error: (error) => {
          if (requestVersion !== this.roleRequestVersion || this.selectedWorkspaceId() !== id)
            return;

          this.roles.set([]);
          const message = extractErrorMessage(error, 'Unable to load workspace roles.');
          this.roleError.set(message);
          this.toastService.error(message, {
            title: 'Could not load roles',
            dedupeKey: 'workspace-roles-load-error',
          });
        },
      });
  }

  loadPermissions(): void {
    if (this.loadingPermissions()) return;
    const requestVersion = ++this.permissionRequestVersion;
    this.loadingPermissions.set(true);
    this.permissionError.set(null);

    this.permissionApi
      .getGrouped(true)
      .pipe(
        finalize(() => {
          if (requestVersion === this.permissionRequestVersion) this.loadingPermissions.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (groups) => {
          if (requestVersion !== this.permissionRequestVersion) return;
          this.permissionGroups.set(groups);
        },
        error: (error) => {
          if (requestVersion !== this.permissionRequestVersion) return;

          this.permissionGroups.set([]);
          const message = extractErrorMessage(error, 'Unable to load permission definitions.');
          this.permissionError.set(message);
          this.toastService.error(message, {
            title: 'Could not load permissions',
            dedupeKey: 'permissions-load-error',
          });
        },
      });
  }

  refresh(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  onWorkspaceChange(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string' || !value.trim()) return;

    const id = value.trim();
    if (id === this.selectedWorkspaceId()) return;

    this.workspaceStore.select(id);
    this.workspaceChange.emit(id);
  }

  setRoleTab(value: TabValue): void {
    if (value === 'all' || value === 'system' || value === 'custom' || value === 'inactive') {
      this.userPreferenceStore.setAndSave(
        USER_PREFERENCE_KEYS.WORKSPACE_ROLE_STATUS_FILTER,
        value.toUpperCase(),
      );
      this.clearSelection();
    }
  }

  setView(value: TabValue): void {
    if (value === 'grid' || value === 'list') {
      this.userPreferenceStore.setAndSave(
        USER_PREFERENCE_KEYS.WORKSPACE_ROLE_VIEW,
        value.toUpperCase(),
      );
      this.clearSelection();
    }
  }

  updateSearch(value: InputValue): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setRoleSort(value: SelectValue | SelectValue[] | null): void {
    if (
      typeof value === 'string' &&
      Object.prototype.hasOwnProperty.call(ROLE_SORT_PREFERENCES, value)
    ) {
      this.userPreferenceStore.setAndSave(
        USER_PREFERENCE_KEYS.WORKSPACE_ROLE_SORT_ORDER,
        ROLE_SORT_PREFERENCES[value as RoleSort],
      );
    }
  }

  setPermissionModule(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string') return;
    this.permissionModule.set(value || 'all');
  }

  openCreateRole(): void {
    if (!this.selectedWorkspaceId()) {
      this.toastService.warning('Select a workspace before creating a role.', {
        title: 'Workspace required',
        dedupeKey: 'workspace-role-workspace-required',
      });
      return;
    }

    this.editorRole.set(null);
    this.roleEditorOpen.set(true);
  }

  handleRoleClick(role: WorkspaceRole, event?: Event): void {
    const target = event?.target as Element | null;
    if (
      target?.closest(
        'button, input, a, app-checkbox, app-button, app-switch, .mat-mdc-menu-panel, .mat-mdc-menu-item',
      )
    )
      return;
    if (this.isRoleBusy(role)) return;
    this.selectedRoleId.set(this.canSelectRole(role) ? this.roleId(role) || null : null);
  }

  handleRoleDoubleClick(role: WorkspaceRole, event: MouseEvent): void {
    const target = event.target as Element | null;
    if (
      target?.closest(
        'button, input, a, app-checkbox, app-button, app-switch, .mat-mdc-menu-panel, .mat-mdc-menu-item',
      )
    )
      return;
    this.openRole(role);
  }

  handleRoleMenuClick(role: WorkspaceRole, _event: Event): void {
    if (!this.isRoleBusy(role))
      this.selectedRoleId.set(this.canSelectRole(role) ? this.roleId(role) || null : null);
  }

  openRoleContextMenu(role: WorkspaceRole, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.roleId(role) || this.isRoleBusy(role)) return;
    const trigger = this.roleContextMenuTrigger();
    if (!trigger) return;
    trigger.closeMenu();
    this.selectedRoleId.set(this.canSelectRole(role) ? this.roleId(role) : null);
    this.contextMenuRole.set(role);
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    timer(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.contextMenuRole() === role) trigger.openMenu();
      });
  }

  closeRoleContextMenu(): void {
    this.contextMenuRole.set(null);
  }

  openRole(role: WorkspaceRole): void {
    if (this.isRoleBusy(role)) return;
    this.selectedRoleId.set(this.canSelectRole(role) ? this.roleId(role) : null);

    this.editorRole.set(role);
    this.roleEditorOpen.set(true);
  }

  openPermissionViewer(role: WorkspaceRole): void {
    if (this.isRoleBusy(role)) return;

    this.permissionViewerRole.set(role);
    this.permissionViewerOpen.set(true);
  }

  closePermissionViewer(): void {
    this.permissionViewerOpen.set(false);
  }

  closeRoleEditor(): void {
    this.roleEditorOpen.set(false);
    this.editorRole.set(null);
  }

  onRoleSaved(): void {
    this.closeRoleEditor();
    this.loadRoles();
  }

  changeRoleStatus(role: WorkspaceRole, isActive: boolean): void {
    if (role.isSystem || this.isRoleBusy(role)) return;

    const id = this.roleId(role);
    if (!id) return;

    const workspaceId = this.selectedWorkspaceId();
    this.setRoleBusy(id, true);

    this.roleApi
      .changeStatus(id, isActive)
      .pipe(
        finalize(() => this.setRoleBusy(id, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (workspaceId !== this.selectedWorkspaceId()) return;
          this.roles.update((items) =>
            items.map((item) => (this.roleId(item) === id ? response.data : item)),
          );

          this.toastService.success(
            `“${this.roleDisplayName(role)}” is now ${isActive ? 'active' : 'inactive'}.`,
            {
              title: isActive ? 'Role activated' : 'Role deactivated',
              dedupeKey: `workspace-role-status-${id}`,
            },
          );
        },
        error: (error) => {
          if (workspaceId !== this.selectedWorkspaceId()) return;
          const message = extractErrorMessage(error, 'Unable to update role status.');
          this.toastService.error(message, {
            title: 'Role status failed',
            dedupeKey: `workspace-role-status-error-${id}`,
          });
        },
      });
  }

  requestDelete(role: WorkspaceRole): void {
    if (role.isSystem || this.isRoleBusy(role)) return;
    this.deleteTarget.set(role);
  }

  closeDeleteDialog(): void {
    if (!this.deleting()) this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const role = this.deleteTarget();
    if (!role || role.isSystem || this.deleting() || this.isRoleBusy(role)) return;

    const id = this.roleId(role);
    if (!id) return;

    const workspaceId = this.selectedWorkspaceId();
    this.deleting.set(true);
    this.setRoleBusy(id, true);

    this.roleApi
      .delete(id)
      .pipe(
        finalize(() => {
          this.deleting.set(false);
          this.setRoleBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          if (workspaceId !== this.selectedWorkspaceId()) return;
          this.deleteTarget.set(null);
          this.roles.update((items) => items.filter((item) => this.roleId(item) !== id));
          this.selectedRoleIds.update(
            (selected) => new Set([...selected].filter((roleId) => roleId !== id)),
          );

          this.toastService.success(`“${this.roleDisplayName(role)}” was deleted.`, {
            title: 'Role deleted',
            dedupeKey: 'workspace-role-delete-success',
          });
        },
        error: (error) => {
          if (workspaceId !== this.selectedWorkspaceId()) return;
          this.deleteTarget.set(null);
          const message = extractErrorMessage(error, 'Unable to delete workspace role.');
          this.toastService.error(message, {
            title: 'Could not delete role',
            dedupeKey: 'workspace-role-delete-error',
          });
        },
      });
  }

  roleId(role: WorkspaceRole): string {
    return idOf(role);
  }

  roleDisplayName(role: WorkspaceRole): string {
    return String(role.displayName ?? role.name ?? role.code ?? 'Workspace role').trim();
  }

  roleTypeLabel(role: WorkspaceRole): string {
    return role.isSystem ? 'System' : 'Custom';
  }

  roleTypeVariant(role: WorkspaceRole): BadgeVariant {
    return role.isSystem ? 'neutral' : 'noteYellow';
  }

  roleStatusLabel(role: WorkspaceRole): string {
    return role.isActive === false ? 'Inactive' : 'Active';
  }

  roleStatusVariant(role: WorkspaceRole): BadgeVariant {
    return role.isActive === false ? 'warning' : 'success';
  }

  roleScopeLabel(role: WorkspaceRole): string {
    const scope = String(role.scope ?? 'WORKSPACE').toUpperCase();
    return scope === 'WORKSPACE' ? 'Workspace' : this.humanize(scope);
  }

  rolePermissionCount(role: WorkspaceRole): number {
    return Array.isArray(role.permissions) ? role.permissions.length : 0;
  }

  rolePermissionPreview(role: WorkspaceRole): string {
    const names = (Array.isArray(role.permissions) ? role.permissions : [])
      .map((permission) =>
        typeof permission === 'string'
          ? ''
          : String(permission?.displayName ?? permission?.code ?? '').trim(),
      )
      .filter(Boolean)
      .slice(0, 2);

    if (!names.length) {
      const count = this.rolePermissionCount(role);
      return count ? `${count} assigned` : 'No permissions';
    }

    const extra = this.rolePermissionCount(role) - names.length;
    return extra > 0 ? `${names.join(', ')} +${extra}` : names.join(', ');
  }

  rolePriorityLabel(role: WorkspaceRole): string {
    if (role.isSystem) {
      const code = String(role.code ?? '').toUpperCase();
      if (code === 'WORKSPACE_OWNER') return 'Owner level';
      if (code === 'WORKSPACE_ADMIN') return 'Admin level';
      if (code === 'WORKSPACE_MEMBER') return 'Member level';
      if (code === 'WORKSPACE_VIEWER') return 'Viewer level';
    }

    return role.isSystem ? `Level ${role.priority ?? 0}` : 'Workspace role';
  }

  isRoleBusy(role: WorkspaceRole): boolean {
    return this.busyRoleIds().has(this.roleId(role));
  }

  permissionId(permission: Permission): string {
    return String(permission.id ?? permission._id ?? permission.code ?? '');
  }

  permissionStatusVariant(permission: Permission): BadgeVariant {
    return permission.isActive === false ? 'warning' : 'success';
  }

  permissionAccessLabel(permission: Permission): string {
    const access = String(permission.access ?? 'GENERAL').toUpperCase();
    if (access === 'OWN') return 'Own only';
    if (access === 'ANY') return 'Any';
    return 'General';
  }

  moduleLabel(module: string): string {
    return this.humanize(module);
  }

  actionLabel(action: unknown): string {
    return this.humanize(action);
  }

  private setRoleBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyRoleIds());
    busy ? next.add(id) : next.delete(id);
    this.busyRoleIds.set(next);
  }

  private trySelectRequestedWorkspace(): boolean {
    const requestedId = String(this.workspaceId ?? '').trim();
    if (!requestedId) return false;

    const exists = this.workspaces().some((workspace) => workspace.id === requestedId);

    if (!exists) return false;

    if (this.selectedWorkspaceId() !== requestedId) {
      this.workspaceStore.select(requestedId);
      this.workspaceChange.emit(requestedId);
    }

    return true;
  }

  private resetInteractionState(): void {
    this.selectedRoleId.set(null);
    this.contextMenuRole.set(null);
    this.roleContextMenuTrigger()?.closeMenu();
    this.searchTerm.set('');
    this.permissionModule.set('all');
    this.roleEditorOpen.set(false);
    this.editorRole.set(null);
    this.permissionViewerOpen.set(false);
    this.permissionViewerRole.set(null);
    this.permissionEditorOpen.set(false);
    this.editorPermission.set(null);
    this.permissionReadOnly.set(false);
    this.deleteTarget.set(null);
    this.deletePermissionTarget.set(null);
    this.clearSelection();
  }

  setPermissionSort(value: SelectValue | SelectValue[] | null): void {
    if (value === 'module' || value === 'name' || value === 'code' || value === 'action') {
      this.permissionSort.set(value);
    }
  }

  togglePermissionGroup(groupId: string): void {
    this.collapsedPermissionGroups.update((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  isPermissionGroupCollapsed(groupId: string): boolean {
    return this.collapsedPermissionGroups().has(groupId);
  }

  isPermissionBusy(permission: Permission): boolean {
    return this.busyPermissionIds().has(this.permissionId(permission));
  }

  private setPermissionBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyPermissionIds());
    busy ? next.add(id) : next.delete(id);
    this.busyPermissionIds.set(next);
  }

  openCreatePermission(): void {
    if (!this.canManageGlobalPermissions()) {
      this.toastService.warning('You do not have permission to manage global permissions.', {
        title: 'Unauthorized',
        dedupeKey: 'perm-create-unauthorized',
      });
      return;
    }
    this.editorPermission.set(null);
    this.permissionReadOnly.set(false);
    this.permissionEditorOpen.set(true);
  }

  openPermission(permission: Permission, readOnly = false): void {
    if (this.isPermissionBusy(permission)) return;
    const canManage = this.canManageGlobalPermissions();
    this.editorPermission.set(permission);
    this.permissionReadOnly.set(readOnly || !canManage);
    this.permissionEditorOpen.set(true);
  }

  closePermissionEditor(): void {
    this.permissionEditorOpen.set(false);
    this.editorPermission.set(null);
    this.permissionReadOnly.set(false);
  }

  onPermissionSaved(_saved?: Permission): void {
    this.closePermissionEditor();
    this.loadPermissions();
    if (this.selectedWorkspaceId()) {
      this.loadRoles();
    }
  }

  changePermissionStatus(permission: Permission, isActive: boolean): void {
    if (!this.canManageGlobalPermissions()) {
      this.toastService.warning('You do not have permission to change permission status.', {
        title: 'Unauthorized',
        dedupeKey: 'perm-status-unauthorized',
      });
      return;
    }
    if (permission.isSystem || this.isPermissionBusy(permission)) return;
    const id = this.permissionId(permission);
    if (!id) return;

    this.setPermissionBusy(id, true);
    this.permissionApi
      .changeStatus(id, isActive)
      .pipe(
        finalize(() => this.setPermissionBusy(id, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          const updated = response.data;
          this.permissionGroups.update((groups) =>
            groups.map((g) => ({
              ...g,
              permissions: g.permissions.map((p) => (this.permissionId(p) === id ? updated : p)),
            })),
          );
          this.toastService.success(
            `“${permission.displayName || permission.code}” is now ${isActive ? 'active' : 'inactive'}.`,
            {
              title: isActive ? 'Permission activated' : 'Permission deactivated',
              dedupeKey: `perm-status-${id}`,
            },
          );
          if (this.selectedWorkspaceId()) this.loadRoles();
        },
        error: (error) => {
          const message = extractErrorMessage(error, 'Unable to update permission status.');
          this.toastService.error(message, {
            title: 'Permission status failed',
            dedupeKey: `perm-status-error-${id}`,
          });
        },
      });
  }

  requestDeletePermission(permission: Permission): void {
    if (!this.canManageGlobalPermissions()) {
      this.toastService.warning('You do not have permission to delete permissions.', {
        title: 'Unauthorized',
        dedupeKey: 'perm-delete-unauthorized',
      });
      return;
    }
    if (permission.isSystem || this.isPermissionBusy(permission)) return;
    this.deletePermissionTarget.set(permission);
  }

  closeDeletePermissionDialog(): void {
    if (!this.deletingPermission()) {
      this.deletePermissionTarget.set(null);
    }
  }

  confirmDeletePermission(): void {
    const perm = this.deletePermissionTarget();
    if (!perm || perm.isSystem || this.deletingPermission() || this.isPermissionBusy(perm)) return;

    const id = this.permissionId(perm);
    if (!id) return;

    this.deletingPermission.set(true);
    this.setPermissionBusy(id, true);

    this.permissionApi
      .delete(id)
      .pipe(
        finalize(() => {
          this.deletingPermission.set(false);
          this.setPermissionBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.deletePermissionTarget.set(null);
          this.permissionGroups.update((groups) =>
            groups
              .map((g) => ({
                ...g,
                permissions: g.permissions.filter((p) => this.permissionId(p) !== id),
              }))
              .filter((g) => g.permissions.length > 0),
          );
          this.toastService.success(`“${perm.displayName || perm.code}” was deleted.`, {
            title: 'Permission deleted',
            dedupeKey: 'perm-delete-success',
          });
          if (this.selectedWorkspaceId()) this.loadRoles();
        },
        error: (error) => {
          this.deletePermissionTarget.set(null);
          const message = extractErrorMessage(error, 'Unable to delete permission.');
          this.toastService.error(message, {
            title: 'Could not delete permission',
            dedupeKey: 'perm-delete-error',
          });
        },
      });
  }

  toggleGroup(groupId: string): void {
    this.collapsedGroups.update((prev) => {
      const next = new Set(prev);
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

  canSelectRole(role: WorkspaceRole): boolean {
    return !role.isDefault && !role.isSystem && !!this.roleId(role);
  }

  hasSelectableRoles(items: WorkspaceRole[]): boolean {
    return items.some((role) => this.canSelectRole(role));
  }

  isRoleSelected(role: WorkspaceRole): boolean {
    const id = this.roleId(role);
    return this.canSelectRole(role) && this.selectedRoleIds().has(id);
  }

  toggleRoleSelection(role: WorkspaceRole, checked: boolean): void {
    if (!this.canSelectRole(role)) return;
    const id = this.roleId(role);
    if (!id) return;
    this.selectedRoleIds.update((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  isAllSelected(items: WorkspaceRole[]): boolean {
    items = items.filter((role) => this.canSelectRole(role));
    if (!items.length) return false;
    const selected = this.selectedRoleIds();
    return items.every((r) => {
      const id = this.roleId(r);
      return !!id && selected.has(id);
    });
  }

  isSomeSelected(items: WorkspaceRole[]): boolean {
    items = items.filter((role) => this.canSelectRole(role));
    if (!items.length) return false;
    const selected = this.selectedRoleIds();
    const count = items.filter((r) => {
      const id = this.roleId(r);
      return !!id && selected.has(id);
    }).length;
    return count > 0 && count < items.length;
  }

  toggleSelectAll(checked: boolean, items: WorkspaceRole[]): void {
    this.selectedRoleIds.update((prev) => {
      const next = new Set(prev);
      items.forEach((r) => {
        const id = this.roleId(r);
        if (!id) return;
        if (checked && this.canSelectRole(r)) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  }

  clearSelection(): void {
    this.selectedRoleIds.set(new Set());
  }

  bulkDeleteSelected(): void {
    this.runBulkAction('delete');
  }

  bulkActivateSelected(): void {
    this.runBulkAction('activate');
  }

  bulkDeactivateSelected(): void {
    this.runBulkAction('deactivate');
  }

  private runBulkAction(action: 'delete' | 'activate' | 'deactivate'): void {
    if (this.bulkBusy()) return;
    const selected = this.selectedRoleIds();
    const roles = this.roles().filter((role) => {
      const id = this.roleId(role);
      return (
        !!id &&
        selected.has(id) &&
        this.canSelectRole(role) &&
        !this.isRoleBusy(role) &&
        (action === 'delete' ||
          (action === 'activate' ? role.isActive === false : role.isActive !== false))
      );
    });
    if (!roles.length) {
      if (action === 'delete')
        this.toastService.warning('No selected custom roles are available to delete.');
      return;
    }

    const workspaceId = this.selectedWorkspaceId();
    this.bulkBusy.set(true);
    roles.forEach((role) => this.setRoleBusy(this.roleId(role), true));
    forkJoin(
      roles.map((role) => {
        const id = this.roleId(role);
        const request: Observable<WorkspaceRole | null> =
          action === 'delete'
            ? this.roleApi.delete(id).pipe(map(() => null))
            : this.roleApi
                .changeStatus(id, action === 'activate')
                .pipe(map((response) => response.data));
        return request.pipe(
          map((updated) => ({ id, updated, error: '' })),
          catchError((error) =>
            of({
              id,
              updated: null,
              error: extractErrorMessage(error, 'Unable to update workspace role.'),
            }),
          ),
        );
      }),
    )
      .pipe(
        finalize(() => {
          this.bulkBusy.set(false);
          roles.forEach((role) => this.setRoleBusy(this.roleId(role), false));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        if (workspaceId !== this.selectedWorkspaceId()) return;
        const succeeded = results.filter((result) => !result.error);
        const successfulIds = new Set(succeeded.map((result) => result.id));
        const updates = new Map(succeeded.map((result) => [result.id, result.updated]));
        this.roles.update((items) =>
          action === 'delete'
            ? items.filter((item) => !successfulIds.has(this.roleId(item)))
            : items.map((item) => updates.get(this.roleId(item)) ?? item),
        );
        this.selectedRoleIds.update(
          (ids) => new Set([...ids].filter((id) => !successfulIds.has(id))),
        );
        if (succeeded.length) {
          this.toastService.success(
            `${succeeded.length} ${succeeded.length === 1 ? 'role' : 'roles'} ${action === 'delete' ? 'deleted' : action === 'activate' ? 'activated' : 'deactivated'}.`,
          );
        }
        const failed = results.filter((result) => result.error);
        if (failed.length)
          this.toastService.error(failed[0].error, {
            title: `${failed.length} role actions failed`,
          });
      });
  }

  private readonly timestamp = toTimestamp;

  private readonly humanize = humanize;
}
