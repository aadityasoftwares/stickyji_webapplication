import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { Workspacefolders } from './workspacefolders';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { WorkspaceFolderService } from './services/workspace-folder.service';
import { ToastService } from '../../shared/components/toast/services/toast.service';

describe('Workspace detail navigation authorization', () => {
  let fixture: ComponentFixture<Workspacefolders>;
  const workspaces = { getById: vi.fn() };
  const folders = { getAllWorkspaceFolders: vi.fn() };
  beforeEach(async () => {
    workspaces.getById.mockReset().mockReturnValue(of({ data: { id: 'a', name: 'Workspace', status: 'ACTIVE', allowedActions: { canView: true } } }));
    folders.getAllWorkspaceFolders.mockReset().mockReturnValue(of({ data: [] }));
    await TestBed.configureTestingModule({ imports: [Workspacefolders], providers: [provideRouter([]), provideHttpClient(),
      { provide: WorkspaceService, useValue: workspaces }, { provide: WorkspaceFolderService, useValue: folders },
      { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
    ] }).overrideComponent(Workspacefolders, { set: { template: '', imports: [] } }).compileComponents();
    TestBed.inject(WorkspaceStore).setWorkspaces([{ id: 'a', name: 'Workspace' }]);
    fixture = TestBed.createComponent(Workspacefolders);
  });

  it('checks fresh READ metadata and limits the folder request to that workspace', () => {
    fixture.detectChanges();
    expect(workspaces.getById).toHaveBeenCalledWith('a');
    expect(folders.getAllWorkspaceFolders).toHaveBeenCalledWith({ workspaceId: 'a', page: 1, limit: 100 });
  });

  it('blocks direct navigation when READ has been revoked', () => {
    workspaces.getById.mockReturnValue(of({ data: { id: 'a', allowedActions: { canView: false } } }));
    fixture.detectChanges();
    expect(folders.getAllWorkspaceFolders).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('permission');
    expect(fixture.componentInstance.folders()).toEqual([]);
  });

  it('cancels a stale detail request when selecting another workspace', () => {
    const response = new Subject();
    workspaces.getById.mockReturnValueOnce(response);
    fixture.detectChanges();
    const store = TestBed.inject(WorkspaceStore);
    store.setWorkspaces([{ id: 'a' }, { id: 'b' }]);
    store.select('b');
    fixture.detectChanges();
    response.next({ data: { id: 'a', allowedActions: { canView: true } } });
    expect(folders.getAllWorkspaceFolders).toHaveBeenCalledExactlyOnceWith({ workspaceId: 'b', page: 1, limit: 100 });
  });
});
