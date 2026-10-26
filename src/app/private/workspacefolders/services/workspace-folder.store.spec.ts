import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { WorkspaceFolderStore } from './workspace-folder.store';
import { WorkspaceFolderService } from './workspace-folder.service';
import type { WorkspaceFolder } from '../interfaces/workspace-folder.interface';

describe('WorkspaceFolderStore request isolation', () => {
  const api = { getFolderOptions: vi.fn() };
  const folder = (id: string, workspaceId = 'a') =>
    ({ id, workspaceId, status: 'ACTIVE' }) as WorkspaceFolder;
  let store: WorkspaceFolderStore;
  beforeEach(() => {
    api.getFolderOptions.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: WorkspaceFolderService, useValue: api }],
    });
    store = TestBed.inject(WorkspaceFolderStore);
  });

  it('cancels workspace A and never replaces B with its late response', () => {
    const pending = new Subject();
    api.getFolderOptions.mockReturnValueOnce(pending).mockReturnValueOnce(of([folder('b1', 'b')]));
    store.load('a');
    store.load('b');
    expect(pending.observed).toBe(false);
    pending.next({ data: [folder('a1')] });
    expect(store.workspaceId()).toBe('b');
    expect(store.selectedId()).toBe('b1');
    expect(store.loading()).toBe(false);
  });

  it('rejects late mutations from other workspaces and clears archived selection', () => {
    store.setFolders('a', [folder('one')]);
    store.upsert(folder('foreign', 'b'));
    expect(store.folders()).toHaveLength(1);
    store.upsert({ ...folder('one'), status: 'ARCHIVED' });
    expect(store.selectedId()).toBeNull();
  });

  it('cancels outstanding loads when reset', () => {
    const pending = new Subject();
    api.getFolderOptions.mockReturnValue(pending);
    store.load('a');
    store.reset();
    expect(pending.observed).toBe(false);
    expect(store.loading()).toBe(false);
    expect(store.workspaceId()).toBeNull();
  });
});
