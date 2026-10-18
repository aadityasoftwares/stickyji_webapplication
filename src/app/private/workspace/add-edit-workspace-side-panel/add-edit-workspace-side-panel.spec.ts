import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AddEditWorkspaceSidePanel } from './add-edit-workspace-side-panel';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceStore } from '../services/workspace.store';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

const workspaceItem = {
  id: 'shared',
  name: 'Shared space',
  status: 'ACTIVE',
  visibility: 'PRIVATE',
};

describe('AddEditWorkspaceSidePanel', () => {
  let fixture: ComponentFixture<AddEditWorkspaceSidePanel>;
  let component: AddEditWorkspaceSidePanel;
  const api = { getById: vi.fn(), update: vi.fn(), create: vi.fn() };

  beforeEach(async () => {
    api.getById.mockReset().mockReturnValue(of({ data: workspaceItem }));
    api.update.mockReset().mockReturnValue(of({ data: workspaceItem }));
    api.create.mockReset().mockReturnValue(of({ data: { ...workspaceItem, id: 'owned' } }));
    const store = { workspaces: signal([]), upsert: vi.fn(), select: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [AddEditWorkspaceSidePanel],
      providers: [
        { provide: WorkspaceService, useValue: api },
        { provide: WorkspaceStore, useValue: store },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    })
      .overrideComponent(AddEditWorkspaceSidePanel, {
        set: { template: '<ng-template #desktopPreview></ng-template>', imports: [] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(AddEditWorkspaceSidePanel);
    component = fixture.componentInstance;
  });

  function open(id = 'shared') {
    fixture.componentRef.setInput('id', id);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  }

  it('loads workspace on edit and submits changes with name, description, and visibility', () => {
    open();
    expect(api.getById).toHaveBeenCalledWith('shared');
    expect(component.previewRole).toBe('Owner');
    component.updateVisibility('PUBLIC');
    component.updateName('New name');
    component.submit();
    expect(api.update).toHaveBeenCalledExactlyOnceWith('shared', {
      name: 'New name',
      description: null,
      visibility: 'PUBLIC',
    });
  });

  it('creates new workspace when no id is passed', () => {
    open('');
    component.updateName('Owned space');
    component.submit();
    expect(api.create).toHaveBeenCalledOnce();
  });

  it('disables submit when name is too short', () => {
    open('');
    component.updateName('A');
    expect(component.canSubmit).toBe(false);
    component.submit();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('prevents duplicate submissions while busy', () => {
    const response = new Subject();
    api.update.mockReturnValue(response);
    open();
    component.updateName('Double click');
    component.submit();
    component.submit();
    expect(api.update).toHaveBeenCalledOnce();
    response.complete();
    expect(component.loading()).toBe(false);
  });

  it('handles error response and sets error state', () => {
    api.update.mockReturnValue(
      throwError(() => ({ status: 403, error: { message: 'Forbidden' } })),
    );
    open();
    component.updateName('New Name');
    component.submit();
    expect(component.error()).toBeTruthy();
  });

  it('cancels stale detail responses when changing workspace', () => {
    const old = new Subject();
    api.getById.mockReturnValueOnce(old);
    open('old');
    fixture.componentRef.setInput('id', 'shared');
    fixture.detectChanges();
    old.next({ data: { ...workspaceItem, id: 'old', name: 'Old' } });
    expect(component.name()).toBe('Shared space');
  });

  it('keeps personal workspace visibility private', () => {
    api.getById.mockReturnValue(
      of({ data: { ...workspaceItem, id: 'personal-1', isPersonal: true } }),
    );
    open('personal-1');
    expect(component.isPersonal()).toBe(true);
    expect(component.visibility()).toBe('PRIVATE');
    component.updateVisibility('PUBLIC');
    expect(component.visibility()).toBe('PRIVATE');
  });
});
