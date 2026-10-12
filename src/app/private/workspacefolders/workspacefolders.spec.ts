import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Workspacefolders } from './workspacefolders';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { WorkspaceFolderService } from './services/workspace-folder.service';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import type { WorkspaceFolder } from './models/workspace-folder.models';
import { ToastService } from '../../shared/components/toast/services/toast.service';

describe('Workspace detail navigation authorization', () => {
  let fixture: ComponentFixture<Workspacefolders>;
  const workspaces = { getById: vi.fn() };
  const folders = { getAllWorkspaceFolders: vi.fn(), update: vi.fn(), updateStatus: vi.fn(), delete: vi.fn() };
  const folder = (id = 'f') => ({ id, workspaceId: 'a', name: id, status: 'ACTIVE', isDefault: false }) as WorkspaceFolder;
  afterEach(() => vi.useRealTimers());
  beforeEach(async () => {
    folders.update.mockReset(); folders.updateStatus.mockReset(); folders.delete.mockReset();
    workspaces.getById.mockReset().mockReturnValue(of({ data: { id: 'a', name: 'Workspace', status: 'ACTIVE', isOwner: true, allowedActions: { canView: true } } }));
    folders.getAllWorkspaceFolders.mockReset().mockReturnValue(of({ data: [] }));
    await TestBed.configureTestingModule({ imports: [Workspacefolders], providers: [provideRouter([]), provideHttpClient(),
      { provide: WorkspaceService, useValue: workspaces }, { provide: WorkspaceFolderService, useValue: folders },
      { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
    ] }).overrideComponent(Workspacefolders, { set: { template: '', imports: [] } }).compileComponents();
    TestBed.inject(WorkspaceStore).setWorkspaces([{ id: 'a', name: 'Workspace' }]);
    vi.spyOn(TestBed.inject(UserPreferenceStore), 'setAndSave').mockImplementation(() => {});
    fixture = TestBed.createComponent(Workspacefolders);
  });

  it('checks fresh READ metadata and limits the folder request to that workspace', () => {
    fixture.detectChanges();
    expect(workspaces.getById).toHaveBeenCalledWith('a');
    expect(folders.getAllWorkspaceFolders).toHaveBeenCalledWith({ workspaceId: 'a', page: 1, limit: 20, status: 'ALL', sortBy: 'position', sortOrder: 'asc' });
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
    expect(folders.getAllWorkspaceFolders).toHaveBeenCalledExactlyOnceWith({ workspaceId: 'b', page: 1, limit: 20, status: 'ALL', sortBy: 'position', sortOrder: 'asc' });
  });
  it('keeps backend ordering and reads full counts rather than counting the current page', () => {
    folders.getAllWorkspaceFolders.mockReturnValue(of({ data: [folder('z'), folder('a')], meta: { page: 1, limit: 20, total: 65, totalPages: 4, counts: { all: 80, active: 65, archived: 15 } } }));
    fixture.detectChanges();
    expect(fixture.componentInstance.visibleFolders().map(item => item.id)).toEqual(['z', 'a']);
    expect(fixture.componentInstance.totalCount()).toBe(80);
    expect(fixture.componentInstance.pagination().totalPages).toBe(4);
    fixture.componentInstance.setFolderTab('archived');
    expect(folders.getAllWorkspaceFolders).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'ARCHIVED', page: 1 }));
  });

  it('debounces search and cancels obsolete requests immediately', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    const stale = new Subject();
    folders.getAllWorkspaceFolders.mockReturnValueOnce(stale);
    fixture.componentInstance.loadFolders();
    fixture.componentInstance.updateSearch('old');
    fixture.componentInstance.updateSearch('new');
    expect(stale.observed).toBe(false);
    const before = folders.getAllWorkspaceFolders.mock.calls.length;
    vi.advanceTimersByTime(299);
    expect(folders.getAllWorkspaceFolders).toHaveBeenCalledTimes(before);
    vi.advanceTimersByTime(1);
    expect(folders.getAllWorkspaceFolders).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'new', page: 1 }));
  });

  it('returns to the previous page after deleting its last result', () => {
    fixture.detectChanges();
    folders.getAllWorkspaceFolders.mockReturnValueOnce(of({ data: [], meta: { page: 2, limit: 20, total: 20, totalPages: 1 } }))
      .mockReturnValueOnce(of({ data: [folder()], meta: { page: 1, limit: 20, total: 20, totalPages: 1 } }));
    fixture.componentInstance.page.set(2);
    fixture.componentInstance.loadFolders();
    expect(fixture.componentInstance.page()).toBe(1);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('submits rename only once for Enter plus blur, and never after Escape', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const pending = new Subject();
    folders.update.mockReturnValue(pending);
    page.folders.set([folder()]);
    page.beginInlineRename(folder()); page.inlineRenameName.set('renamed');
    page.saveInlineRename(folder()); page.saveInlineRename(folder());
    expect(folders.update).toHaveBeenCalledTimes(1);
    pending.next({ data: { ...folder(), name: 'renamed' } }); pending.complete();
    page.beginInlineRename(folder()); page.inlineRenameName.set('cancelled'); page.cancelInlineRename(); page.saveInlineRename(folder());
    expect(folders.update).toHaveBeenCalledTimes(1);
  });

  it('reports individual bulk failures and releases busy state', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.folders.set([folder('one'), folder('two')]);
    page.toggleSelectAll(true);
    folders.updateStatus.mockReturnValueOnce(of({ data: { ...folder('one'), status: 'ARCHIVED' } }))
      .mockReturnValueOnce(throwError(() => ({ status: 500 })));
    page.bulkArchiveSelected();
    expect(TestBed.inject(ToastService).success).toHaveBeenCalledWith('1 folder(s) archived.');
    expect(TestBed.inject(ToastService).error).toHaveBeenCalledWith('1 folder(s) could not be updated.');
    expect(page.bulkBusy()).toBe(false);
    expect(page.selectedCount()).toBe(0);
  });

  it('requires confirmation before bulk trash and rejects duplicate submissions', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const pending = new Subject();
    folders.delete.mockReturnValue(pending);
    page.folders.set([folder()]); page.toggleSelectAll(true);
    page.bulkDeleteSelected();
    expect(folders.delete).not.toHaveBeenCalled();
    expect(page.bulkDeleteOpen()).toBe(true);
    page.confirmBulkDelete(); page.confirmBulkDelete();
    expect(folders.delete).toHaveBeenCalledTimes(1);
    pending.next({ data: { ...folder(), status: 'DELETED' } }); pending.complete();
    expect(page.bulkBusy()).toBe(false);
  });
});
