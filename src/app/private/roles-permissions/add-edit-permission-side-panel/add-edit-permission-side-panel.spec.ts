import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AddEditPermissionSidePanel } from './add-edit-permission-side-panel';
import { PermissionApiService } from '../services/permission.service';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import type { Permission } from '../models/permission.models';

describe('AddEditPermissionSidePanel', () => {
  let component: AddEditPermissionSidePanel;
  let fixture: ComponentFixture<AddEditPermissionSidePanel>;
  const api = {
    create: vi.fn(),
    update: vi.fn(),
  };
  const toast = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [AddEditPermissionSidePanel],
      providers: [
        provideHttpClient(),
        { provide: PermissionApiService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditPermissionSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.mode).toBe('create');
  });

  it('populates fields in edit mode and keeps system permissions editable', () => {
    const existing: Permission = {
      id: '507f1f77bcf86cd799439011',
      displayName: 'Manage Folders',
      name: 'manage-folders',
      code: 'FOLDERS_MANAGE',
      description: 'Can manage workspace folders',
      module: 'FOLDERS',
      action: 'MANAGE',
      access: 'GENERAL',
      sortOrder: 5,
      isSystem: false,
      isActive: true,
    };

    component.permission = existing;
    component.open = true;
    component.ngOnChanges({
      open: new SimpleChange(false, true, false),
      permission: new SimpleChange(null, existing, false),
    });

    expect(component.mode).toBe('edit');
    expect(component.isReadOnly).toBe(false);
    expect(component.displayName()).toBe('Manage Folders');
    expect(component.code()).toBe('FOLDERS_MANAGE');
    expect(component.module()).toBe('FOLDERS');
    expect(component.action()).toBe('MANAGE');
    expect(component.description()).toBe('Can manage workspace folders');

    // System permissions use the same editor when the caller is authorized.
    component.permission = { ...existing, isSystem: true };
    expect(component.isReadOnly).toBe(false);
    expect(component.mode).toBe('edit');
  });

  it('auto-generates code from module and action in create mode', () => {
    component.open = true;
    component.permission = null;
    component.ngOnChanges({ open: new SimpleChange(false, true, false) });

    component.updateModule('NOTES');
    component.updateAction('CREATE');
    expect(component.code()).toBe('NOTES_CREATE');

    // Manual edit prevents auto-overwrite
    component.updateCode('CUSTOM_NOTES_CODE');
    component.updateAction('UPDATE');
    expect(component.code()).toBe('CUSTOM_NOTES_CODE');
  });

  it('submits validated create payload and notifies parent', () => {
    const created: Permission = {
      id: '507f1f77bcf86cd799439012',
      displayName: 'Create Notes',
      name: 'create-notes',
      code: 'NOTES_CREATE',
      module: 'NOTES',
      action: 'CREATE',
      access: 'GENERAL',
      sortOrder: 0,
      isSystem: false,
      isActive: true,
    };
    api.create.mockReturnValue(of({ data: created }));
    const savedSpy = vi.spyOn(component.saved, 'emit');
    const closedSpy = vi.spyOn(component.closed, 'emit');

    component.open = true;
    component.permission = null;
    component.ngOnChanges({ open: new SimpleChange(false, true, false) });
    component.updateDisplayName('Create Notes');
    component.updateModule('NOTES');
    component.updateAction('CREATE');

    expect(component.canSubmit).toBe(true);
    component.submit();

    expect(api.create).toHaveBeenCalledWith({
      displayName: 'Create Notes',
      name: 'create notes',
      code: 'NOTES_CREATE',
      description: '',
      module: 'NOTES',
      action: 'CREATE',
      access: 'GENERAL',
      sortOrder: 0,
      isActive: true,
    });
    expect(savedSpy).toHaveBeenCalledWith(created);
    expect(closedSpy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      '“Create Notes” permission created.',
      expect.any(Object),
    );
  });

  it('submits update payload for existing permission', () => {
    const existing: Permission = {
      id: '507f1f77bcf86cd799439011',
      displayName: 'Manage Folders',
      name: 'manage-folders',
      code: 'FOLDERS_MANAGE',
      module: 'FOLDERS',
      action: 'MANAGE',
      access: 'GENERAL',
      sortOrder: 0,
      isSystem: false,
      isActive: true,
    };
    api.update.mockReturnValue(of({ data: { ...existing, displayName: 'Updated Folders' } }));
    const savedSpy = vi.spyOn(component.saved, 'emit');

    component.permission = existing;
    component.open = true;
    component.ngOnChanges({
      open: new SimpleChange(false, true, false),
      permission: new SimpleChange(null, existing, false),
    });

    component.updateDisplayName('Updated Folders');
    component.submit();

    expect(api.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
      displayName: 'Updated Folders',
      name: 'manage-folders',
      code: 'FOLDERS_MANAGE',
      module: 'FOLDERS',
      description: '',
      action: 'MANAGE',
      access: 'GENERAL',
      sortOrder: 0,
      isActive: true,
    });
    expect(savedSpy).toHaveBeenCalled();
  });

  it('handles backend error responses gracefully', () => {
    api.create.mockReturnValue(
      throwError(() => ({ error: { message: 'Permission code already in use' } })),
    );
    component.open = true;
    component.permission = null;
    component.ngOnChanges({ open: new SimpleChange(false, true, false) });
    component.updateDisplayName('Notes');
    component.updateCode('NOTES_READ');

    component.submit();
    expect(component.error()).toBe('Permission code already in use');
    expect(component.saving()).toBe(false);
  });
});
