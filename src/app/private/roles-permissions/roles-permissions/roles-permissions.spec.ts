import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { RolesPermissions } from './roles-permissions';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { UserPreferenceStore } from '../../user-preferences/services/user-preference.store';
import { AuthStore } from '../../../public/auth/state/auth.store';
import { WorkspaceRoleApiService } from '../services/workspace-role.service';
import { PermissionApiService } from '../services/permission.service';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import type { WorkspaceRole } from '../interfaces/workspace-role.interface';
import type { Permission } from '../interfaces/permission.interface';

const role = (id: string, isSystem = false): WorkspaceRole => ({
  id,
  name: id,
  displayName: id,
  code: id,
  type: isSystem ? 'SYSTEM' : 'CUSTOM',
  scope: 'WORKSPACE',
  permissions: [],
  isSystem,
  isDefault: false,
  priority: 0,
  isActive: true,
});

const permission = (id: string, isSystem = false): Permission => ({
  id,
  _id: id,
  name: id,
  displayName: id,
  code: id,
  module: 'NOTES',
  action: 'READ',
  access: 'GENERAL',
  sortOrder: 1,
  isSystem,
  isActive: true,
});

describe('RolesPermissions', () => {
  const preferenceStore = {
    ready: signal(true),
    workspaceRoleView: signal('GRID'),
    workspaceRoleStatusFilter: signal('ALL'),
    workspaceRoleSortOrder: signal('PRIORITY'),
    load: vi.fn(),
    setAndSave: vi.fn((key: string, value: string) => {
      if (key === 'workspaceRoleView') preferenceStore.workspaceRoleView.set(value);
      if (key === 'workspaceRoleStatusFilter') preferenceStore.workspaceRoleStatusFilter.set(value);
      if (key === 'workspaceRoleSortOrder') preferenceStore.workspaceRoleSortOrder.set(value);
    }),
  };
  const selectedId = signal<string | null>('workspace');
  const api = {
    getWorkspaceRoles: vi.fn(),
    delete: vi.fn(),
    changeStatus: vi.fn(),
    getByCode: vi.fn(),
  };
  const permissions = {
    getGrouped: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    getByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    changeStatus: vi.fn(),
    delete: vi.fn(),
  };
  const toast = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };
  const authStore = {
    canManageGlobalPermissions: signal(true),
    user: signal({ id: 'user1' }),
    role: signal({ scope: 'GLOBAL', code: 'SUPER_ADMIN' }),
  };
  const store = {
    selectedId,
    workspaces: signal([{ id: 'workspace', name: 'Workspace' }]),
    loading: signal(false),
    error: signal(null),
    load: vi.fn(),
    select: vi.fn(),
  };
  let component: RolesPermissions;

  beforeEach(() => {
    vi.clearAllMocks();
    preferenceStore.ready.set(true);
    preferenceStore.workspaceRoleView.set('GRID');
    preferenceStore.workspaceRoleStatusFilter.set('ALL');
    preferenceStore.workspaceRoleSortOrder.set('PRIORITY');
    selectedId.set('workspace');
    authStore.canManageGlobalPermissions.set(true);
    api.getWorkspaceRoles.mockReturnValue(of([]));
    permissions.getGrouped.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [RolesPermissions],
      providers: [
        provideHttpClient(),
        { provide: WorkspaceRoleApiService, useValue: api },
        { provide: PermissionApiService, useValue: permissions },
        { provide: AuthStore, useValue: authStore },
        { provide: WorkspaceStore, useValue: store },
        { provide: UserPreferenceStore, useValue: preferenceStore },
        { provide: ToastService, useValue: toast },
      ],
    });
    component = TestBed.runInInjectionContext(() => new RolesPermissions());
    TestBed.tick();
  });

  it('uses the workspace store for loading and retry', () => {
    component.loadWorkspaces(true);
    expect(store.load).toHaveBeenCalledWith(true);
  });

  it('restores saved role preferences and saves changes using backend values', () => {
    preferenceStore.workspaceRoleView.set('LIST');
    preferenceStore.workspaceRoleStatusFilter.set('CUSTOM');
    preferenceStore.workspaceRoleSortOrder.set('NAME_DESC');
    expect(component.view()).toBe('list');
    expect(component.activeRoleTab()).toBe('custom');
    expect(component.roleSort()).toBe('nameDesc');
    component.setView('grid');
    component.setRoleTab('inactive');
    component.setRoleSort('createdAt');
    expect(preferenceStore.setAndSave).toHaveBeenCalledWith('workspaceRoleView', 'GRID');
    expect(preferenceStore.setAndSave).toHaveBeenCalledWith(
      'workspaceRoleStatusFilter',
      'INACTIVE',
    );
    expect(preferenceStore.setAndSave).toHaveBeenCalledWith(
      'workspaceRoleSortOrder',
      'RECENTLY_CREATED',
    );
    selectedId.set('another-workspace');
    TestBed.tick();
    expect(component.activeRoleTab()).toBe('inactive');
  });

  it.each([
    ['ROLE_LEVEL', 'priority'],
    ['UPDATED_AT', 'updatedAt'],
    ['NAME', 'name'],
    ['CREATED_AT', 'createdAt'],
    ['OLDEST_FIRST', 'oldest'],
    ['unknown', 'priority'],
  ])('restores sort alias %s as %s', (saved, expected) => {
    preferenceStore.workspaceRoleSortOrder.set(saved);
    expect(component.roleSort()).toBe(expected);
  });

  it('preserves failed selections and reports partial bulk deletion', () => {
    component.roles.set([role('one'), role('two'), role('system', true)]);
    component.selectedRoleIds.set(new Set(['one', 'two', 'system']));
    api.delete.mockImplementation((id) =>
      id === 'one'
        ? of({ data: null })
        : throwError(() => ({ error: { message: 'Assigned role' } })),
    );
    component.bulkDeleteSelected();
    expect(api.delete.mock.calls.map((call) => call[0])).toEqual(['one', 'two']);
    expect(component.roles().map((item) => item.id)).toEqual(['two', 'system']);
    expect([...component.selectedRoleIds()]).toEqual(['two', 'system']);
    expect(toast.error).toHaveBeenCalledWith('Assigned role', expect.any(Object));
    expect(component.bulkBusy()).toBe(false);
    expect(component.busyRoleIds().size).toBe(0);
  });

  it('prevents duplicate bulk requests and cancels subscriptions on destruction', () => {
    const pending = new Subject<{ data: null }>();
    api.delete.mockReturnValue(pending);
    component.roles.set([role('one')]);
    component.selectedRoleIds.set(new Set(['one']));
    component.bulkDeleteSelected();
    component.bulkDeleteSelected();
    expect(api.delete).toHaveBeenCalledTimes(1);
    TestBed.resetTestingModule();
    expect(pending.observed).toBe(false);
    expect(component.bulkBusy()).toBe(false);
  });

  it('protects system roles even when delete confirmation is invoked directly', () => {
    component.deleteTarget.set(role('system', true));
    component.confirmDelete();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('does not apply stale role lists after switching workspaces', () => {
    const pending = new Subject<WorkspaceRole[]>();
    api.getWorkspaceRoles.mockReturnValue(pending);
    component.loadRoles();
    selectedId.set(null);
    TestBed.tick();
    pending.next([role('stale')]);
    expect(component.roles()).toEqual([]);
    expect(component.loadingRoles()).toBe(false);
    expect(pending.observed).toBe(false);
  });

  it('excludes default and system roles from individual and group selection', () => {
    const defaults = [{ ...role('Default'), isDefault: true }, role('System', true)];
    const custom = role('Custom');
    defaults.forEach((item) => component.toggleRoleSelection(item, true));
    expect(component.selectedCount()).toBe(0);
    component.toggleSelectAll(true, [...defaults, custom]);
    expect([...component.selectedRoleIds()]).toEqual(['Custom']);
    expect(component.isAllSelected([...defaults, custom])).toBe(true);
    expect(component.isSomeSelected([...defaults, custom])).toBe(false);
    expect(component.hasSelectableRoles(defaults)).toBe(false);
    expect(component.isAllSelected(defaults)).toBe(false);
  });

  it('retains search, status filters and sorting', () => {
    component.roles.set([role('Zulu'), role('Alpha'), { ...role('Inactive'), isActive: false }]);
    component.setRoleSort('name');
    expect(component.visibleRoles().map((item) => item.id)).toEqual(['Alpha', 'Zulu']);
    component.updateSearch('alp');
    expect(component.visibleRoles().map((item) => item.id)).toEqual(['Alpha']);
    component.clearSearch();
    component.setRoleTab('inactive');
    expect(component.visibleRoles().map((item) => item.id)).toEqual(['Inactive']);
  });

  it.each([
    ['grid', false],
    ['list', false],
    ['grid', true],
    ['list', true],
  ] as const)('renders the shared layout and menu in %s for system=%s', async (view, system) => {
    const fixture = TestBed.createComponent(RolesPermissions);
    fixture.detectChanges();
    await fixture.whenStable();
    const rendered = fixture.componentInstance;
    rendered.roles.set([role('Editor', system)]);
    rendered.setView(view);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.workspace-page .workspace-header')).not.toBeNull();
    expect(root.querySelector('.workspace-toolbar-filters app-tabs')).not.toBeNull();
    expect(root.querySelector('.workspace-toolbar-actions .workspace-search')).not.toBeNull();
    if (view === 'grid') expect(root.querySelector('app-workspace-role-wrapper')).not.toBeNull();
    else expect(root.querySelector('.workspace-grouped-table .workspace-gtable')).not.toBeNull();
    const item = root.querySelector<HTMLElement>(view === 'grid' ? '.rp-role-tile' : 'tbody tr')!;
    const clickable =
      view === 'grid' ? item.querySelector<HTMLElement>('.role-wrapper__body')! : item;
    clickable.click();
    fixture.detectChanges();
    expect(rendered.selectedRoleId()).toBe(system ? null : 'Editor');
    expect(item.classList.contains('app-highlight-active')).toBe(!system);
    expect(rendered.roleEditorOpen()).toBe(false);
    expect(rendered.permissionViewerOpen()).toBe(false);
    rendered.selectedRoleId.set(null);
    rendered.toggleRoleSelection(role('Editor', system), true);
    fixture.detectChanges();
    expect(item.classList.contains('app-highlight-active')).toBe(!system);
    rendered.clearSelection();
    fixture.detectChanges();
    expect(item.classList.contains('app-highlight-active')).toBe(false);
    const trigger = root.querySelector<HTMLButtonElement>(
      view === 'grid'
        ? '.workspace-role-card-actions .workspace-table-menu-button'
        : '.workspace-table-menu-button',
    );
    expect(trigger).not.toBeNull();
    trigger!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const menu = document.querySelector('.mat-mdc-menu-panel');
    expect(menu?.textContent).toContain('Edit role');
    if (system) expect(menu?.textContent).not.toContain('Delete role');
    else expect(menu?.textContent).toContain('Delete role');
    expect(rendered.selectedRoleId()).toBe(system ? null : 'Editor');
    fixture.destroy();
  });

  it('does not open the editor when action controls are double-clicked', () => {
    const button = document.createElement('button');
    const event = new MouseEvent('dblclick', { bubbles: true });
    button.addEventListener('dblclick', (current) =>
      component.handleRoleDoubleClick(role('Editor'), current),
    );
    button.dispatchEvent(event);
    expect(component.roleEditorOpen()).toBe(false);
    component.handleRoleDoubleClick(role('Editor'), new MouseEvent('dblclick'));
    expect(component.roleEditorOpen()).toBe(true);
    component.closeRoleEditor();
    component.handleRoleDoubleClick(role('Owner', true), new MouseEvent('dblclick'));
    expect(component.permissionViewerOpen()).toBe(false);
    expect(component.roleEditorOpen()).toBe(true);
  });

  it.each(['grid', 'list'] as const)(
    'opens an editable system-role context menu in %s',
    async (view) => {
      const fixture = TestBed.createComponent(RolesPermissions);
      fixture.detectChanges();
      await fixture.whenStable();
      const rendered = fixture.componentInstance;
      rendered.roles.set([role('Owner', true)]);
      rendered.setView(view);
      fixture.detectChanges();
      const root: HTMLElement = fixture.nativeElement;
      const item = root.querySelector<HTMLElement>(view === 'grid' ? '.rp-role-tile' : 'tbody tr')!;
      item.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 80,
          clientY: 120,
        }),
      );
      fixture.detectChanges();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await fixture.whenStable();
      fixture.detectChanges();
      const menu = document.querySelector('.mat-mdc-menu-panel');
      expect(rendered.selectedRoleId()).toBeNull();
      expect(rendered.contextMenuPosition()).toEqual({ x: 80, y: 120 });
      expect(menu?.textContent).toContain('Edit role');
      expect(menu?.textContent).not.toContain('Delete role');
      fixture.destroy();
    },
  );

  it('allows authorized global users to create and manage permissions', () => {
    component.openCreatePermission();
    expect(component.permissionEditorOpen()).toBe(true);
    expect(component.editorPermission()).toBeNull();
    expect(component.permissionReadOnly()).toBe(false);

    component.closePermissionEditor();
    expect(component.permissionEditorOpen()).toBe(false);

    authStore.canManageGlobalPermissions.set(false);
    component.openCreatePermission();
    expect(component.permissionEditorOpen()).toBe(false);
    expect(toast.warning).toHaveBeenCalledWith(
      'You do not have permission to manage global permissions.',
      expect.any(Object),
    );
  });

  it('activates and deactivates permissions via API', () => {
    const perm = permission('notes_create');
    component.permissionGroups.set([{ module: 'NOTES', permissions: [perm] }]);
    permissions.changeStatus.mockReturnValue(of({ data: { ...perm, isActive: false } }));

    component.changePermissionStatus(perm, false);
    expect(permissions.changeStatus).toHaveBeenCalledWith('notes_create', false);
    expect(component.permissionGroups()[0].permissions[0].isActive).toBe(false);
    expect(toast.success).toHaveBeenCalledWith(
      '“notes_create” is now inactive.',
      expect.any(Object),
    );
  });

  it('protects system permissions from deletion and deletes custom permissions on confirmation', () => {
    const sysPerm = permission('sys_perm', true);
    component.requestDeletePermission(sysPerm);
    expect(component.deletePermissionTarget()).toBeNull();

    const customPerm = permission('custom_perm', false);
    component.requestDeletePermission(customPerm);
    expect(component.deletePermissionTarget()).toEqual(customPerm);

    component.permissionGroups.set([{ module: 'NOTES', permissions: [customPerm] }]);
    permissions.delete.mockReturnValue(of({ data: null }));

    component.confirmDeletePermission();
    expect(permissions.delete).toHaveBeenCalledWith('custom_perm');
    expect(component.deletePermissionTarget()).toBeNull();
    expect(component.permissionGroups().length).toBe(0);
    expect(toast.success).toHaveBeenCalledWith('“custom_perm” was deleted.', expect.any(Object));
  });

  it('keeps the permission catalog internal for role creation', () => {
    const perm1 = permission('p1');
    const perm2 = { ...permission('p2'), module: 'FOLDERS' };
    component.permissionGroups.set([
      { module: 'NOTES', permissions: [perm1] },
      { module: 'FOLDERS', permissions: [perm2] },
    ]);

    expect(component.visiblePermissions().length).toBe(2);

    component.setPermissionModule('NOTES');
    expect(component.visiblePermissions().length).toBe(1);
    expect(component.visiblePermissions()[0].id).toBe('p1');

    component.setPermissionSort('name');
    expect(component.permissionSort()).toBe('name');
  });

  it('does not render permission catalog management in the workspace role page', async () => {
    const fixture = TestBed.createComponent(RolesPermissions);
    fixture.detectChanges();
    await fixture.whenStable();

    const rendered = fixture.componentInstance;
    rendered.permissionGroups.set([
      {
        module: 'NOTES',
        permissions: [permission('notes_read', true), permission('notes_share')],
      },
    ]);
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.permission-catalog-table')).toBeNull();
    expect(root.textContent).not.toContain('Permission catalog');
    fixture.destroy();
  });
});
