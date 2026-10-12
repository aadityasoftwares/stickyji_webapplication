import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { WorkspaceFolderTrash } from './workspace-folder-trash';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { WorkspaceFolderService } from '../services/workspace-folder.service';
import { WorkspaceFolderStore } from '../services/workspace-folder.store';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import type { WorkspaceFolder } from '../models/workspace-folder.models';

describe('Folder trash', () => {
  const folder = (id = 'f', workspaceId = 'a') => ({ id, workspaceId, name: id, status: 'DELETED', isDefault: false }) as WorkspaceFolder;
  const response = (items: WorkspaceFolder[], page = 1, totalPages = 1) => ({ data: items, meta: { page, limit: 100, total: items.length, totalPages } });
  let workspaceApi: { getById: ReturnType<typeof vi.fn> };
  let folderApi: { getAllWorkspaceFolders: ReturnType<typeof vi.fn>; restore: ReturnType<typeof vi.fn>; permanentlyDelete: ReturnType<typeof vi.fn> };
  let store: { selectedId: ReturnType<typeof signal<string | null>>; workspaces: ReturnType<typeof signal<any[]>>; load: ReturnType<typeof vi.fn>; select: ReturnType<typeof vi.fn> };
  let folderStore: { load: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    workspaceApi = { getById: vi.fn((id: string) => of({ data: { id, status: 'ACTIVE', isOwner: true, allowedActions: { canView: true } } })) };
    folderApi = { getAllWorkspaceFolders: vi.fn(() => of(response([folder()]))), restore: vi.fn(), permanentlyDelete: vi.fn() };
    store = { selectedId: signal<string | null>('a'), workspaces: signal<any[]>([]), load: vi.fn(), select: vi.fn() };
    folderStore = { load: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [WorkspaceFolderTrash],
      providers: [provideRouter([]),
        { provide: WorkspaceService, useValue: workspaceApi },
        { provide: WorkspaceFolderService, useValue: folderApi },
        { provide: WorkspaceStore, useValue: store },
        { provide: WorkspaceFolderStore, useValue: folderStore },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).overrideComponent(WorkspaceFolderTrash, { set: { template: '', imports: [] } }).compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(WorkspaceFolderTrash);
    fixture.detectChanges();
    return fixture;
  }

  it('loads every deleted-folder page for the selected workspace', () => {
    folderApi.getAllWorkspaceFolders.mockReturnValueOnce(of(response([folder('one')], 1, 2)))
      .mockReturnValueOnce(of(response([folder('two')], 2, 2)));
    const page = create().componentInstance;
    expect(folderApi.getAllWorkspaceFolders).toHaveBeenNthCalledWith(2, { workspaceId: 'a', status: 'DELETED', page: 2, limit: 100 });
    expect(page.totalCount()).toBe(2);
    page.updateSearch('two');
    expect(page.visibleFolders().map(item => item.id)).toEqual(['two']);
  });

  it('blocks reads when workspace access is revoked', () => {
    workspaceApi.getById.mockReturnValue(of({ data: { id: 'a', status: 'ACTIVE', allowedActions: { canView: false } } }));
    const page = create().componentInstance;
    expect(folderApi.getAllWorkspaceFolders).not.toHaveBeenCalled();
    expect(page.error()).toBeTruthy();
    expect(page.can(folder(), 'canRestore')).toBe(false);
  });

  it('restores once and refreshes the folder store', () => {
    const page = create().componentInstance;
    const pending = new Subject();
    folderApi.restore.mockReturnValue(pending);
    page.restore(folder());
    page.restore(folder());
    expect(folderApi.restore).toHaveBeenCalledTimes(1);
    pending.next({ data: { ...folder(), status: 'ACTIVE' } });
    pending.complete();
    expect(page.totalCount()).toBe(0);
    expect(folderStore.load).toHaveBeenCalledWith('a', true);
    expect(page.actionId()).toBeNull();
  });

  it('requires confirmation for permanent deletion and preserves a failed item', () => {
    const page = create().componentInstance;
    folderApi.permanentlyDelete.mockReturnValue(throwError(() => new Error('failed')));
    page.confirmPermanentDelete();
    expect(folderApi.permanentlyDelete).not.toHaveBeenCalled();
    page.requestPermanentDelete(folder());
    expect(folderApi.permanentlyDelete).not.toHaveBeenCalled();
    page.confirmPermanentDelete();
    expect(folderApi.permanentlyDelete).toHaveBeenCalledWith('f');
    expect(page.totalCount()).toBe(1);
    expect(page.actionId()).toBeNull();
  });

  it('does not grant mutations to members or restore expired folders', () => {
    workspaceApi.getById.mockReturnValue(of({ data: { id: 'a', status: 'ACTIVE', isOwner: false, allowedActions: { canView: true } } }));
    const page = create().componentInstance;
    page.restore(folder());
    page.requestPermanentDelete(folder());
    expect(folderApi.restore).not.toHaveBeenCalled();
    expect(page.permanentTarget()).toBeNull();
    workspaceApi.getById.mockReturnValue(of({ data: { id: 'a', status: 'ACTIVE', isOwner: true } }));
    folderApi.getAllWorkspaceFolders.mockReturnValue(of(response([{ ...folder(), purgeAfter: '2000-01-01' }])));
    page.loadTrash();
    expect(page.can(folder(), 'canRestore')).toBe(false);
  });

  it('cancels stale requests when the selected workspace changes', () => {
    const pending = new Subject();
    folderApi.getAllWorkspaceFolders.mockReturnValueOnce(pending).mockReturnValue(of(response([folder('new', 'b')])));
    const fixture = create();
    store.selectedId.set('b');
    fixture.detectChanges();
    pending.next(response([folder('old')]));
    expect(fixture.componentInstance.folders().map(item => item.id)).toEqual(['new']);
  });
});
