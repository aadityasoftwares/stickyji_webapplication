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
  LucideKey,
  LucideList,
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
  LucideX
} from '@lucide/angular';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Loader } from '../../../shared/components/loader/loader';
import { Select, type SelectOption, type SelectValue } from '../../../shared/components/select/select';
import { StickyCard } from '../../../shared/components/sticky-card/sticky-card';
import { Tabs, type TabItem, type TabValue } from '../../../shared/components/tabs/tabs';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { AddEditWorkspaceRoleSidePanel } from '../add-edit-workspace-role-side-panel/add-edit-workspace-role-side-panel';
import { ViewRolePermissionsModal } from '../view-role-permissions-modal/view-role-permissions-modal';
import { WorkspaceRoleWrapper } from '../../workspace/workspace-role-wrapper/workspace-role-wrapper';
import type { PermissionGroup, Permission } from '../models/permission.models';
import type { WorkspaceRole } from '../models/workspace-role.models';
import { PermissionApiService } from '../services/permission.service';
import { WorkspaceRoleApiService } from '../services/workspace-role.service';

type AccessSection = 'roles' | 'permissions';
type AccessView = 'grid' | 'list';
type RoleTab = 'all' | 'system' | 'custom' | 'inactive';
type RoleSort = 'updatedAt' | 'name' | 'priority';
type UnknownRecord = Record<string, unknown>;
type BadgeVariant = 'success' | 'neutral' | 'noteYellow' | 'warning' | 'danger';


@Component({
  selector: 'app-roles-permissions',
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
    Select,
    StickyCard,
    Tabs,
    AddEditWorkspaceRoleSidePanel,
    ViewRolePermissionsModal,
    WorkspaceRoleWrapper
  ],
  templateUrl: './roles-permissions.html',
  styleUrl: './roles-permissions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolesPermissions implements OnInit, OnChanges {
  private readonly roleApi = inject(WorkspaceRoleApiService);
  private readonly permissionApi = inject(PermissionApiService);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  @Input() workspaceId = '';
  @Output() readonly workspaceChange = new EventEmitter<string>();

  private loadedWorkspaceId: string | null = null;
  private initialized = false;
  private roleRequestVersion = 0;
  private permissionRequestVersion = 0;

  readonly LucideEye = LucideEye;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideKey = LucideKey;
  readonly LucideList = LucideList;
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

  readonly workspaces = this.workspaceStore.workspaces;
  readonly loadingWorkspaces = this.workspaceStore.loading;
  readonly workspaceError = this.workspaceStore.error;
  readonly selectedWorkspaceId = computed(() => this.workspaceStore.selectedId() ?? '');

  readonly workspaceOptions = computed<readonly SelectOption[]>(() =>
    this.workspaces().map(workspace => ({
      label: workspace.name?.trim() || 'Untitled workspace',
      value: workspace.id,
      icon: LucidePanelsTopLeft
    }))
  );

  readonly selectedWorkspaceLabel = computed(() => {
    const selectedId = this.selectedWorkspaceId();
    const workspace = this.workspaces().find(item => item.id === selectedId);
    return workspace?.name?.trim() || 'Select workspace';
  });

  readonly roles = signal<readonly WorkspaceRole[]>([]);
  readonly permissionGroups = signal<readonly PermissionGroup[]>([]);

  readonly loadingRoles = signal(false);
  readonly loadingPermissions = signal(false);
  readonly roleError = signal<string | null>(null);
  readonly permissionError = signal<string | null>(null);

  readonly activeSection = signal<AccessSection>('roles');
  readonly view = signal<AccessView>('grid');
  readonly activeRoleTab = signal<RoleTab>('all');
  readonly searchTerm = signal('');
  readonly roleSort = signal<RoleSort>('priority');
  readonly permissionModule = signal('all');
  readonly busyRoleIds = signal<ReadonlySet<string>>(new Set());

  readonly roleEditorOpen = signal(false);
  readonly editorRole = signal<WorkspaceRole | null>(null);
  readonly permissionViewerOpen = signal(false);
  readonly permissionViewerRole = signal<WorkspaceRole | null>(null);
  readonly deleteTarget = signal<WorkspaceRole | null>(null);
  readonly deleting = signal(false);

  readonly activeRolesCount = computed(() => this.roles().filter(role => role.isActive !== false).length);
  readonly systemRolesCount = computed(() => this.roles().filter(role => role.isSystem && role.isActive !== false).length);
  readonly customRolesCount = computed(() => this.roles().filter(role => !role.isSystem && role.isActive !== false).length);
  readonly inactiveRolesCount = computed(() => this.roles().filter(role => !role.isSystem && role.isActive === false).length);

  readonly allPermissions = computed<readonly Permission[]>(() =>
    this.permissionGroups().flatMap(group => group.permissions)
  );

  readonly accessTabs = computed<readonly TabItem[]>(() => [
    {
      value: 'roles',
      label: 'Roles',
      count: this.roles().length,
      icon: LucideShield,
      ariaLabel: 'Manage workspace roles'
    },
    {
      value: 'permissions',
      label: 'Permission catalog',
      count: this.allPermissions().length,
      icon: LucideKey,
      ariaLabel: 'View application permissions'
    }
  ]);

  readonly viewTabs: readonly TabItem[] = [
    { value: 'grid', label: 'Grid', icon: LucideGrid2X2, ariaLabel: 'Show cards' },
    { value: 'list', label: 'List', icon: LucideList, ariaLabel: 'Show table' }
  ];

  readonly roleTabs = computed<readonly TabItem[]>(() => [
    { value: 'all', label: 'All', count: this.activeRolesCount(), icon: LucideShield, ariaLabel: 'All active roles' },
    { value: 'system', label: 'System', count: this.systemRolesCount(), icon: LucideLock, ariaLabel: 'System roles' },
    { value: 'custom', label: 'Custom', count: this.customRolesCount(), icon: LucidePencil, ariaLabel: 'Custom roles' },
    { value: 'inactive', label: 'Inactive', count: this.inactiveRolesCount(), icon: LucidePower, ariaLabel: 'Inactive roles' }
  ]);

  readonly roleSortOptions: readonly SelectOption[] = [
    { label: 'Role level', value: 'priority' },
    { label: 'Recently updated', value: 'updatedAt' },
    { label: 'Role A–Z', value: 'name' }
  ];

  readonly permissionModuleOptions = computed<readonly SelectOption[]>(() => [
    { label: 'All modules', value: 'all' },
    ...this.permissionGroups().map(group => ({
      label: this.moduleLabel(group.module),
      value: group.module
    }))
  ]);

  readonly visibleRoles = computed(() => {
    const tab = this.activeRoleTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.roleSort();

    return [...this.roles()]
      .filter(role => {
        if (tab === 'all' && role.isActive === false) return false;
        if (tab === 'system' && (!role.isSystem || role.isActive === false)) return false;
        if (tab === 'custom' && (role.isSystem || role.isActive === false)) return false;
        if (tab === 'inactive' && (role.isSystem || role.isActive !== false)) return false;

        if (!search) return true;

        const permissionText = (role.permissions ?? [])
          .map(permission =>
            typeof permission === 'string'
              ? permission
              : `${permission.displayName} ${permission.code} ${permission.module}`
          )
          .join(' ');

        return [
          this.roleDisplayName(role),
          role.name,
          role.code,
          role.description ?? '',
          permissionText
        ].some(value => String(value).toLowerCase().includes(search));
      })
      .sort((first, second) => {
        if (sort === 'name') {
          return this.roleDisplayName(first).localeCompare(
            this.roleDisplayName(second),
            undefined,
            { sensitivity: 'base' }
          );
        }

        if (sort === 'priority') {
          const priorityDifference = (second.priority ?? 0) - (first.priority ?? 0);
          if (priorityDifference !== 0) return priorityDifference;
          return this.roleDisplayName(first).localeCompare(this.roleDisplayName(second));
        }

        return this.timestamp(second.updatedAt) - this.timestamp(first.updatedAt);
      });
  });

  readonly visiblePermissions = computed(() => {
    const module = this.permissionModule();
    const search = this.searchTerm().trim().toLowerCase();

    return [...this.allPermissions()]
      .filter(permission => {
        if (module !== 'all' && permission.module !== module) return false;
        if (!search) return true;

        return [
          permission.displayName,
          permission.name,
          permission.code,
          permission.module,
          permission.action,
          permission.access,
          permission.description ?? ''
        ].some(value => String(value).toLowerCase().includes(search));
      })
      .sort((first, second) =>
        first.module.localeCompare(second.module) ||
        (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
        first.displayName.localeCompare(second.displayName)
      );
  });

  constructor() {
    effect(() => {
      const workspaceId = this.workspaceStore.selectedId();

      if (!workspaceId) {
        this.loadedWorkspaceId = null;
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
    this.loadPermissions();
    this.loadWorkspaces();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized || !changes['workspaceId'] || changes['workspaceId'].firstChange) return;
    this.trySelectRequestedWorkspace();
  }

  loadWorkspaces(force = false): void {
    // if (
    //   !force &&
    //   this.workspaceStore.initialized() &&
    //   this.workspaceStore.workspaces().length > 0
    // ) {
    //   this.ensureWorkspaceSelection();
    //   return;
    // }

    // this.workspaceStore.setLoading(true);

    // this.workspaceApi
    //   .getMyWorkspaces()
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe({
    //     next: response => {
    //       const workspaces = response.data ?? [];

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

    //       this.toastService.error(message, {
    //         title: 'Could not load workspaces',
    //         dedupeKey: 'roles-workspace-load-error'
    //       });
    //     }
    //   });
  }

  loadRoles(workspaceId = this.selectedWorkspaceId()): void {
    const id = workspaceId.trim();
    const requestVersion = ++this.roleRequestVersion;

    if (!id) {
      this.roles.set([]);
      this.roleError.set(null);
      return;
    }

    this.loadingRoles.set(true);
    this.roleError.set(null);

    this.roleApi
      .getWorkspaceRoles(id)
      .pipe(
        finalize(() => {
          if (requestVersion === this.roleRequestVersion) this.loadingRoles.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: roles => {
          if (requestVersion !== this.roleRequestVersion || this.selectedWorkspaceId() !== id) return;
          this.roles.set(roles);
        },
        error: error => {
          if (requestVersion !== this.roleRequestVersion || this.selectedWorkspaceId() !== id) return;

          this.roles.set([]);
          const message = this.errorMessage(error, 'Unable to load workspace roles.');
          this.roleError.set(message);
          this.toastService.error(message, {
            title: 'Could not load roles',
            dedupeKey: 'workspace-roles-load-error'
          });
        }
      });
  }

  loadPermissions(): void {
    const requestVersion = ++this.permissionRequestVersion;
    this.loadingPermissions.set(true);
    this.permissionError.set(null);

    this.permissionApi
      .getGrouped()
      .pipe(
        finalize(() => {
          if (requestVersion === this.permissionRequestVersion) this.loadingPermissions.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: groups => {
          if (requestVersion !== this.permissionRequestVersion) return;
          this.permissionGroups.set(groups);
        },
        error: error => {
          if (requestVersion !== this.permissionRequestVersion) return;

          this.permissionGroups.set([]);
          const message = this.errorMessage(error, 'Unable to load permission definitions.');
          this.permissionError.set(message);
          this.toastService.error(message, {
            title: 'Could not load permissions',
            dedupeKey: 'permissions-load-error'
          });
        }
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

  setSection(value: TabValue): void {
    if (value !== 'roles' && value !== 'permissions') return;

    this.activeSection.set(value);
    this.searchTerm.set('');
    this.permissionModule.set('all');
  }

  setRoleTab(value: TabValue): void {
    if (value === 'all' || value === 'system' || value === 'custom' || value === 'inactive') {
      this.activeRoleTab.set(value);
    }
  }

  setView(value: TabValue): void {
    if (value === 'grid' || value === 'list') this.view.set(value);
  }

  updateSearch(value: InputValue): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setRoleSort(value: SelectValue | SelectValue[] | null): void {
    if (value === 'updatedAt' || value === 'name' || value === 'priority') {
      this.roleSort.set(value);
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
        dedupeKey: 'workspace-role-workspace-required'
      });
      return;
    }

    this.editorRole.set(null);
    this.roleEditorOpen.set(true);
  }

  openRole(role: WorkspaceRole): void {
    if (this.isRoleBusy(role)) return;

    if (role.isSystem) {
      this.openPermissionViewer(role);
      return;
    }

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

    this.setRoleBusy(id, true);

    this.roleApi
      .changeStatus(id, isActive)
      .pipe(
        finalize(() => this.setRoleBusy(id, false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.roles.update(items =>
            items.map(item => this.roleId(item) === id ? response.data : item)
          );

          this.toastService.success(
            `“${this.roleDisplayName(role)}” is now ${isActive ? 'active' : 'inactive'}.`,
            {
              title: isActive ? 'Role activated' : 'Role deactivated',
              dedupeKey: `workspace-role-status-${id}`
            }
          );
        },
        error: error => {
          const message = this.errorMessage(error, 'Unable to update role status.');
          this.toastService.error(message, {
            title: 'Role status failed',
            dedupeKey: `workspace-role-status-error-${id}`
          });
        }
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
    if (!role) return;

    const id = this.roleId(role);
    if (!id) return;

    this.deleting.set(true);
    this.setRoleBusy(id, true);

    this.roleApi
      .delete(id)
      .pipe(
        finalize(() => {
          this.deleting.set(false);
          this.setRoleBusy(id, false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.roles.update(items => items.filter(item => this.roleId(item) !== id));

          this.toastService.success(`“${this.roleDisplayName(role)}” was deleted.`, {
            title: 'Role deleted',
            dedupeKey: 'workspace-role-delete-success'
          });
        },
        error: error => {
          this.deleteTarget.set(null);
          const message = this.errorMessage(error, 'Unable to delete workspace role.');
          this.toastService.error(message, {
            title: 'Could not delete role',
            dedupeKey: 'workspace-role-delete-error'
          });
        }
      });
  }

  roleId(role: WorkspaceRole): string {
    return String(role.id ?? role._id ?? '');
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
    const names = (role.permissions ?? [])
      .map(permission =>
        typeof permission === 'string'
          ? ''
          : String(permission.displayName ?? permission.code ?? '').trim()
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

  private ensureWorkspaceSelection(): void {
    const workspaces = this.workspaces();

    if (!workspaces.length) {
      this.workspaceStore.select(null);
      return;
    }

    if (this.trySelectRequestedWorkspace()) return;

    const selectedId = this.selectedWorkspaceId();
    const selectedExists = workspaces.some(
      workspace => workspace.id === selectedId
    );

    if (selectedId && selectedExists) return;

    this.workspaceStore.select(workspaces[0].id);
  }

  private trySelectRequestedWorkspace(): boolean {
    const requestedId = String(this.workspaceId ?? '').trim();
    if (!requestedId) return false;

    const exists = this.workspaces().some(
      workspace => workspace.id === requestedId
    );

    if (!exists) return false;

    if (this.selectedWorkspaceId() !== requestedId) {
      this.workspaceStore.select(requestedId);
      this.workspaceChange.emit(requestedId);
    }

    return true;
  }

  private resetInteractionState(): void {
    this.searchTerm.set('');
    this.activeRoleTab.set('all');
    this.permissionModule.set('all');
    this.roleEditorOpen.set(false);
    this.editorRole.set(null);
    this.permissionViewerOpen.set(false);
    this.permissionViewerRole.set(null);
    this.deleteTarget.set(null);
  }

  private timestamp(value: string | Date | undefined): number {
    if (!value) return 0;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private humanize(value: unknown): string {
    const text = String(value ?? '')
      .trim()
      .toLowerCase()
      .replaceAll('_', ' ');

    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '—';
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback;

    const record = error as UnknownRecord;
    const nested = record['error'];

    if (nested && typeof nested === 'object') {
      const message = (nested as UnknownRecord)['message'];
      if (typeof message === 'string' && message.trim()) return message;
    }

    const message = record['message'];
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
