import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditWorkspaceRoleSidePanel } from './add-edit-workspace-role-side-panel';
import { provideHttpClient } from '@angular/common/http';
import { SimpleChange } from '@angular/core';
import { WorkspaceRoleApiService } from '../services/workspace-role.service';
import { of, Subject, throwError } from 'rxjs';
import type { ApiResponse, WorkspaceRole } from '../models/workspace-role.models';

describe('AddEditWorkspaceRoleSidePanel', () => {
  let component: AddEditWorkspaceRoleSidePanel;
  let fixture: ComponentFixture<AddEditWorkspaceRoleSidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditWorkspaceRoleSidePanel],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditWorkspaceRoleSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('generates a valid hidden code for long and numeric role names', () => {
    component.workspaceId = '0123456789abcdef01234567';
    component.updateDisplayName('A'.repeat(80));
    expect(component.code()).toHaveLength(60);
    expect(component.canSubmit).toBe(true);
    component.updateDisplayName('2026 Editors');
    expect(component.code()).toBe('ROLE_2026_EDITORS');
    expect(component.canSubmit).toBe(true);
  });

  it('keeps unsaved edits and updates counts when the catalog arrives', () => {
    component.open = true;
    component.ngOnChanges({ open: new SimpleChange(false, true, false) });
    component.updateDisplayName('Content editor');
    component.selectedPermissionIds.set(new Set(['existing']));
    component.permissionGroups = [{ module: 'NOTES', permissions: [] }];
    component.ngOnChanges({
      permissionGroups: new SimpleChange([], component.permissionGroups, false),
    });
    expect(component.displayName()).toBe('Content editor');
    expect(component.selectedPermissionIds().has('existing')).toBe(true);
    expect(component.totalPermissionCount()).toBe(0);
  });

  it('preserves the create payload and shows backend validation errors', () => {
    const api = TestBed.inject(WorkspaceRoleApiService);
    const create = vi
      .spyOn(api, 'create')
      .mockReturnValue(throwError(() => ({ error: { message: 'Code already exists' } })));
    component.workspaceId = '0123456789abcdef01234567';
    component.updateDisplayName('Content editor');
    component.selectedPermissionIds.set(new Set(['permission-id']));
    component.submit();
    expect(create).toHaveBeenCalledWith({
      name: 'content-editor',
      displayName: 'Content editor',
      code: 'CONTENT_EDITOR',
      description: '',
      scope: 'WORKSPACE',
      workspaceId: component.workspaceId,
      permissions: ['permission-id'],
      isActive: true,
    });
    expect(component.error()).toBe('Code already exists');
    expect(component.saving()).toBe(false);
  });

  it('cancels an old save when the editor context changes', () => {
    const pending = new Subject<ApiResponse<WorkspaceRole>>();
    vi.spyOn(TestBed.inject(WorkspaceRoleApiService), 'create').mockReturnValue(pending);
    const saved = vi.spyOn(component.saved, 'emit');
    component.workspaceId = '0123456789abcdef01234567';
    component.updateDisplayName('Content editor');
    component.submit();
    component.open = false;
    component.ngOnChanges({ open: new SimpleChange(true, false, false) });
    expect(pending.observed).toBe(false);
    expect(component.saving()).toBe(false);
    expect(saved).not.toHaveBeenCalled();
  });

  it('updates a custom role with its assigned permissions and emits the saved role', () => {
    const existing: WorkspaceRole = {
      id: 'abcdef0123456789abcdef01',
      name: 'editor',
      displayName: 'Editor',
      code: 'EDITOR',
      type: 'CUSTOM',
      scope: 'WORKSPACE',
      permissions: ['retained'],
      isSystem: false,
      isDefault: false,
      priority: 0,
      isActive: true,
    };
    component.role = existing;
    component.open = true;
    component.workspaceId = '0123456789abcdef01234567';
    component.ngOnChanges({ role: new SimpleChange(null, existing, false) });
    const update = vi
      .spyOn(TestBed.inject(WorkspaceRoleApiService), 'update')
      .mockReturnValue(of({ data: existing }));
    const saved = vi.spyOn(component.saved, 'emit');
    component.submit();
    expect(update).toHaveBeenCalledWith(existing.id, {
      name: 'editor',
      displayName: 'Editor',
      code: 'EDITOR',
      description: '',
      permissions: ['retained'],
      isActive: true,
    });
    expect(saved).toHaveBeenCalledWith(existing);
    expect(component.saving()).toBe(false);
    component.role = { ...existing, isSystem: true };
    expect(component.mode).toBe('edit');
    expect(component.isReadOnly).toBe(false);
    component.submit();
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('keeps default role values and permission checkboxes read-only', () => {
    component.role = {
      id: 'abcdef0123456789abcdef01',
      name: 'member',
      displayName: 'Member',
      code: 'MEMBER',
      type: 'SYSTEM',
      scope: 'WORKSPACE',
      permissions: [],
      isSystem: true,
      isDefault: true,
      priority: 10,
      isActive: true,
    };

    expect(component.mode).toBe('view');
    expect(component.isReadOnly).toBe(true);
    component.toggleActive();
    expect(component.active()).toBe(true);
  });
});
