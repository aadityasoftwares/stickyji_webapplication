import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { WorkspaceTrash } from './workspace-trash';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceStore } from '../services/workspace.store';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { APP_ROUTES } from '../../../shared/constants/route.constants';

describe('WorkspaceTrash', () => {
  let component: WorkspaceTrash;
  let fixture: ComponentFixture<WorkspaceTrash>;
  let workspaceApi: {
    getMyWorkspaces: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    permanentlyDelete: ReturnType<typeof vi.fn>;
  };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    workspaceApi = {
      getMyWorkspaces: vi.fn(() => of({ data: [{ allowedActions: { canRestore: true, canPermanentlyDelete: true }, status: 'DELETED', id: 'w1', name: 'Trashed Space' }] })),
      restore: vi.fn(() => of({ success: true })),
      permanentlyDelete: vi.fn(() => of({ success: true })),
    };
    toast = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [WorkspaceTrash],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: WorkspaceService, useValue: workspaceApi },
        { provide: ToastService, useValue: toast },
      ],
    })
      .overrideComponent(WorkspaceTrash, { set: { template: '', imports: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(WorkspaceTrash);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load trashed workspaces', () => {
    expect(component).toBeTruthy();
    expect(workspaceApi.getMyWorkspaces).toHaveBeenCalledWith({ status: 'DELETED' });
    expect(component.workspaces().length).toBe(1);
    expect(component.totalCount()).toBe(1);
  });

  it('navigates back to workspaces', () => {
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.goBackToWorkspaces();
    expect(navSpy).toHaveBeenCalledWith([APP_ROUTES.WORKSPACES]);
  });

  it('restores a trashed workspace and updates local list', () => {
    const workspace = { allowedActions: { canRestore: true, canPermanentlyDelete: true }, status: 'DELETED', id: 'w1', name: 'Trashed Space' };
    component.restore(workspace);
    expect(workspaceApi.restore).toHaveBeenCalledWith('w1');
    expect(component.workspaces().length).toBe(0);
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles restore failure gracefully', () => {
    workspaceApi.restore.mockReturnValue(throwError(() => new Error('Restore failed')));
    const workspace = { allowedActions: { canRestore: true, canPermanentlyDelete: true }, status: 'DELETED', id: 'w1', name: 'Trashed Space' };
    component.restore(workspace);
    expect(component.actionId()).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });

  it('requests and closes permanent delete dialog', () => {
    const workspace = { allowedActions: { canRestore: true, canPermanentlyDelete: true }, status: 'DELETED', id: 'w1', name: 'Trashed Space' };
    component.requestPermanentDelete(workspace);
    expect(component.permanentTarget()).toEqual(workspace);

    component.closePermanentDelete();
    expect(component.permanentTarget()).toBeNull();
  });

  it('confirms permanent delete and removes workspace from list', () => {
    const workspace = { allowedActions: { canRestore: true, canPermanentlyDelete: true }, status: 'DELETED', id: 'w1', name: 'Trashed Space' };
    component.requestPermanentDelete(workspace);
    component.confirmPermanentDelete();

    expect(workspaceApi.permanentlyDelete).toHaveBeenCalledWith('w1');
    expect(component.workspaces().length).toBe(0);
    expect(component.permanentTarget()).toBeNull();
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles permanent delete failure gracefully', () => {
    workspaceApi.permanentlyDelete.mockReturnValue(throwError(() => new Error('Delete failed')));
    const workspace = { allowedActions: { canRestore: true, canPermanentlyDelete: true }, status: 'DELETED', id: 'w1', name: 'Trashed Space' };
    component.requestPermanentDelete(workspace);
    component.confirmPermanentDelete();

    expect(component.actionId()).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });

  it('calculates daysRemaining and purgeLabel properly', () => {
    const futureDate = new Date(Date.now() + 10 * 86_400_000).toISOString();
    const urgentDate = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const pastDate = new Date(Date.now() - 1000).toISOString();

    expect(component.daysRemaining({ purgeAfter: futureDate })).toBe(10);
    expect(component.purgeLabel({ purgeAfter: futureDate })).toBe('10 days left');
    expect(component.daysRemaining({ purgeAfter: urgentDate })).toBe(3);
    expect(component.purgeLabel({ purgeAfter: urgentDate })).toBe('3 days left');
    expect(component.daysRemaining({ purgeAfter: pastDate })).toBe(0);
    expect(component.purgeLabel({ purgeAfter: pastDate })).toBe('Pending cleanup');
    expect(component.daysRemaining({})).toBe(60);
  });
});

