import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  signal,
} from '@angular/core';

import {
  LucideKey,
  LucideRefreshCw,
  LucideSearch,
  LucideShieldCheck,
  LucideX,
} from '@lucide/angular';

import type { BadgeVariant } from '../../../shared/components/badge/badge';
import { humanize } from '../../../shared/functions/string.functions';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';

import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';

import { Loader } from '../../../shared/components/loader/loader';
import { Modal } from '../../../shared/components/modal/modal';

import type { Permission, PermissionGroup } from '../interfaces/permission.interface';

import type { WorkspaceRole } from '../interfaces/workspace-role.interface';

interface ViewPermissionGroup {
  module: string;
  label: string;
  permissions: readonly Permission[];
}

@Component({
  selector: 'app-view-role-permissions-modal',

  standalone: true,

  imports: [AppIcon, AppInput, Button, Checkbox, Loader, Modal],

  templateUrl: './view-role-permissions-modal.html',

  styleUrl: './view-role-permissions-modal.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewRolePermissionsModal implements OnChanges, AfterViewInit, OnDestroy {
  @Input()
  open = false;

  @Input()
  role: WorkspaceRole | null = null;

  @Input()
  workspaceLabel = 'Workspace';

  @Input()
  permissionGroups: readonly PermissionGroup[] = [];

  @Input()
  loading = false;

  @Input()
  error: string | null = null;

  @Output()
  readonly closed = new EventEmitter<void>();

  @Output()
  readonly retry = new EventEmitter<void>();

  @ViewChild('permissionScroll')
  private permissionScroll?: ElementRef<HTMLElement>;

  @ViewChild('permissionNavigation')
  private permissionNavigation?: ElementRef<HTMLElement>;

  readonly LucideKey = LucideKey;

  readonly LucideRefreshCw = LucideRefreshCw;

  readonly LucideSearch = LucideSearch;

  readonly LucideShieldCheck = LucideShieldCheck;

  readonly LucideX = LucideX;

  readonly searchTerm = signal('');

  readonly activeModule = signal('');

  private readonly roleState = signal<WorkspaceRole | null>(null);

  private readonly permissionGroupsState = signal<readonly PermissionGroup[]>([]);

  private scrollFrame: number | null = null;

  readonly catalogPermissions = computed<readonly Permission[]>(() =>
    this.permissionGroupsState().flatMap((group) =>
      Array.isArray(group.permissions) ? group.permissions.filter(Boolean) : [],
    ),
  );

  readonly assignedPermissions = computed<readonly Permission[]>(() => {
    const role = this.roleState();

    if (!role) {
      return [];
    }

    const catalog = this.catalogPermissions();

    const resolved: Permission[] = [];

    for (const reference of Array.isArray(role.permissions) ? role.permissions : []) {
      /*
       * Populated permission object.
       */
      if (reference && typeof reference === 'object') {
        resolved.push(reference as Permission);

        continue;
      }

      /*
       * Permission stored as ID/code/name.
       */
      const value = String(reference ?? '')
        .trim()
        .toLowerCase();

      if (!value) {
        continue;
      }

      const permission = catalog.find((item) => {
        const references = [this.permissionId(item), item.code, item.name];

        return references.some(
          (current) =>
            String(current ?? '')
              .trim()
              .toLowerCase() === value,
        );
      });

      if (permission) {
        resolved.push(permission);
      }
    }

    /*
     * Remove duplicate permissions.
     */
    const uniquePermissions = new Map<string, Permission>();

    resolved.forEach((permission, index) => {
      const key = this.permissionId(permission) || `permission-${index}`;

      uniquePermissions.set(key, permission);
    });

    return [...uniquePermissions.values()];
  });

  readonly visibleGroups = computed<readonly ViewPermissionGroup[]>(() => {
    const search = this.searchTerm().trim().toLowerCase();

    const grouped = new Map<string, Permission[]>();

    for (const permission of this.assignedPermissions()) {
      /*
       * Search filtering.
       */
      if (search) {
        const searchableValues = [
          permission.displayName,
          permission.name,
          permission.code,
          permission.module,
          permission.action,
          permission.access,
          permission.description ?? '',
        ];

        const matches = searchableValues.some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(search),
        );

        if (!matches) {
          continue;
        }
      }

      const module = String(permission.module || 'general');

      const permissions = grouped.get(module) ?? [];

      permissions.push(permission);

      grouped.set(module, permissions);
    }

    return [...grouped.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([module, permissions]) => ({
        module,

        label: this.moduleLabel(module),

        permissions: [...permissions].sort(
          (first, second) =>
            (first.sortOrder ?? 0) - (second.sortOrder ?? 0) ||
            String(first.displayName ?? '').localeCompare(String(second.displayName ?? '')),
        ),
      }));
  });

  get modalTitle(): string {
    const workspace = String(this.workspaceLabel ?? '').trim();

    return workspace || 'Workspace';
  }

  get modalDescription(): string {
    const role = this.roleState();

    if (!role) {
      return 'See what this role can do in this workspace.';
    }

    return `${this.roleDisplayName(role)} can use the permissions listed below.`;
  }

  get footerNote(): string {
    if (this.roleState()?.isSystem) {
      return 'System role permissions are managed by the application.';
    }

    return 'These permissions are shown in read-only mode.';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['role']) {
      this.roleState.set(this.role);
    }

    if (changes['permissionGroups']) {
      this.permissionGroupsState.set(
        Array.isArray(this.permissionGroups) ? this.permissionGroups.filter(Boolean) : [],
      );
    }

    if (changes['open'] && this.open) {
      this.searchTerm.set('');

      this.activeModule.set('');
    }

    if (this.open && (changes['open'] || changes['role'] || changes['permissionGroups'])) {
      this.scheduleActiveModuleSync(true);
    }
  }

  ngAfterViewInit(): void {
    if (this.open) {
      this.scheduleActiveModuleSync(true);
    }
  }

  ngOnDestroy(): void {
    if (this.scrollFrame !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.scrollFrame);
    }
  }

  close(): void {
    this.closed.emit();
  }

  retryPermissions(): void {
    this.retry.emit();
  }

  updateSearch(value: InputValue): void {
    this.searchTerm.set(String(value ?? ''));

    this.scheduleActiveModuleSync(true);
  }

  clearSearch(): void {
    this.searchTerm.set('');

    this.scheduleActiveModuleSync(true);
  }

  onPermissionScroll(): void {
    if (this.scrollFrame !== null || typeof requestAnimationFrame === 'undefined') {
      return;
    }

    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = null;

      this.syncActiveModule();
    });
  }

  scrollToModule(module: string): void {
    const container = this.permissionScroll?.nativeElement;

    if (!container) {
      return;
    }

    const section = container.querySelector<HTMLElement>(`#${this.moduleDomId(module)}`);

    if (!section) {
      return;
    }

    this.activeModule.set(module);

    /*
     * Calculate section position against
     * the actual scroll container.
     *
     * Do not rely on offsetTop because
     * the section is nested.
     */
    const containerRect = container.getBoundingClientRect();

    const sectionRect = section.getBoundingClientRect();

    const targetTop = container.scrollTop + sectionRect.top - containerRect.top;

    container.scrollTo({
      top: Math.max(0, targetTop),

      behavior: this.preferredScrollBehavior(),
    });

    this.keepNavigationItemVisible(module);
  }

  moduleDomId(module: string): string {
    const safeModule = String(module || 'general')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `role-permission-${safeModule || 'general'}`;
  }

  moduleTitleDomId(module: string): string {
    return `${this.moduleDomId(module)}-title`;
  }

  permissionId(permission: Permission): string {
    return String(permission.id ?? permission._id ?? permission.code ?? permission.name ?? '');
  }

  roleDisplayName(role: WorkspaceRole): string {
    return String(role.displayName ?? role.name ?? role.code ?? 'Workspace role').trim();
  }

  permissionStatusVariant(permission: Permission): BadgeVariant {
    return permission.isActive === false ? 'warning' : 'success';
  }

  permissionAccessLabel(permission: Permission): string {
    const access = String(permission.access ?? 'GENERAL')
      .trim()
      .toUpperCase();

    if (access === 'OWN') {
      return 'Own only';
    }

    if (access === 'ANY') {
      return 'Any';
    }

    return 'General';
  }

  permissionSimpleDescription(permission: Permission): string {
    const action = String(permission.action ?? '')
      .trim()
      .toUpperCase();

    const module = this.moduleLabel(String(permission.module ?? 'item')).toLowerCase();

    switch (action) {
      case 'CREATE':
        return `Allows creating ${module}.`;

      case 'READ':
      case 'VIEW':
        return `Allows viewing ${module}.`;

      case 'UPDATE':
      case 'EDIT':
        return `Allows updating ${module}.`;

      case 'DELETE':
        return `Allows deleting ${module}.`;

      case 'INVITE':
        return `Allows inviting people to ${module}.`;

      case 'MANAGE':
        return `Allows managing ${module}.`;

      default:
        return `Allows access to ${module}.`;
    }
  }

  moduleLabel(module: string): string {
    return this.humanize(module);
  }

  actionLabel(action: unknown): string {
    return this.humanize(action);
  }

  private scheduleActiveModuleSync(resetScroll = false): void {
    if (typeof requestAnimationFrame === 'undefined') {
      return;
    }

    if (this.scrollFrame !== null) {
      cancelAnimationFrame(this.scrollFrame);
    }

    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = null;

      const container = this.permissionScroll?.nativeElement;

      if (resetScroll && container) {
        container.scrollTop = 0;

        const groups = this.visibleGroups();

        this.activeModule.set(groups[0]?.module ?? '');

        if (groups.length) {
          this.keepNavigationItemVisible(groups[0].module);
        }

        return;
      }

      this.ensureValidActiveModule();

      this.syncActiveModule();
    });
  }

  private ensureValidActiveModule(): void {
    const groups = this.visibleGroups();

    if (!groups.length) {
      this.activeModule.set('');

      return;
    }

    const current = this.activeModule();

    const exists = groups.some((group) => group.module === current);

    if (!exists) {
      this.activeModule.set(groups[0].module);

      this.keepNavigationItemVisible(groups[0].module);
    }
  }

  private syncActiveModule(): void {
    const container = this.permissionScroll?.nativeElement;

    const groups = this.visibleGroups();

    if (!container || !groups.length) {
      return;
    }

    const containerRect = container.getBoundingClientRect();

    const activationPoint = containerRect.top + 10;

    let nextModule = groups[0].module;

    for (const group of groups) {
      const section = container.querySelector<HTMLElement>(`#${this.moduleDomId(group.module)}`);

      if (!section) {
        continue;
      }

      const sectionRect = section.getBoundingClientRect();

      if (sectionRect.top <= activationPoint) {
        nextModule = group.module;
      } else {
        break;
      }
    }

    const reachedBottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - 4;

    if (reachedBottom) {
      nextModule = groups[groups.length - 1].module;
    }

    if (this.activeModule() === nextModule) {
      return;
    }

    this.activeModule.set(nextModule);

    this.keepNavigationItemVisible(nextModule);
  }

  private keepNavigationItemVisible(module: string): void {
    const navigation = this.permissionNavigation?.nativeElement;

    if (!navigation) {
      return;
    }

    const item = Array.from(
      navigation.querySelectorAll<HTMLElement>('[data-permission-module]'),
    ).find((element) => element.getAttribute('data-permission-module') === module);

    if (!item) {
      return;
    }

    const itemTop = item.offsetTop;

    const itemBottom = itemTop + item.offsetHeight;

    const visibleTop = navigation.scrollTop;

    const visibleBottom = visibleTop + navigation.clientHeight;

    if (itemTop < visibleTop) {
      navigation.scrollTo({
        top: Math.max(0, itemTop - 6),

        behavior: this.preferredScrollBehavior(),
      });

      return;
    }

    if (itemBottom > visibleBottom) {
      navigation.scrollTo({
        top: itemBottom - navigation.clientHeight + 6,

        behavior: this.preferredScrollBehavior(),
      });
    }
  }

  private preferredScrollBehavior(): ScrollBehavior {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return 'auto';
    }

    return 'smooth';
  }

  private readonly humanize = (value: unknown): string => humanize(value, /[_-]+/g);
}
