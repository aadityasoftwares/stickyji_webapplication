import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AddEditWorkspaceModal } from './add-edit-workspace-modal';
import { WorkspaceService } from '../../services/workspace.service';
import { AuthStore } from '../../../../public/auth/state/auth.store';
import { ToastService } from '../../../../shared/components/toast/services/toast.service';

describe('Legacy workspace modal authorization', () => {
  let fixture: ComponentFixture<AddEditWorkspaceModal>;
  const api = { getById: vi.fn(), update: vi.fn(), create: vi.fn() };
  beforeEach(async () => {
    api.getById.mockReset().mockReturnValue(of({ data: { id: 'a', name: 'Space', status: 'ACTIVE',
      visibility: 'PRIVATE', allowedActions: { canEdit: true } } }));
    api.update.mockReset().mockReturnValue(of({ data: { id: 'a' } }));
    await TestBed.configureTestingModule({ imports: [AddEditWorkspaceModal], providers: [
      { provide: WorkspaceService, useValue: api },
      { provide: AuthStore, useValue: { canCreateWorkspace: signal(true), loadGlobalPermissions: vi.fn() } },
      { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
    ] }).overrideComponent(AddEditWorkspaceModal, { set: { template: '', imports: [] } }).compileComponents();
    fixture = TestBed.createComponent(AddEditWorkspaceModal);
    fixture.componentRef.setInput('id', 'a');
    fixture.componentRef.setInput('open', true);
  });
  it('omits visibility without settings permission', () => {
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(api.update).toHaveBeenCalledExactlyOnceWith('a', { name: 'Space', description: null });
  });
  it('blocks direct editing without allowedActions', () => {
    api.getById.mockReturnValue(of({ data: { id: 'a', name: 'Space' } }));
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(api.update).not.toHaveBeenCalled();
    expect(fixture.componentInstance.canSubmit).toBe(false);
  });
});
