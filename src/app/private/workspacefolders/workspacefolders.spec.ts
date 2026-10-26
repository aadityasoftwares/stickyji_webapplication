import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Workspacefolders } from './workspacefolders';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { WorkspaceFolderService } from './services/workspace-folder.service';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import type { WorkspaceFolder } from './interfaces/workspace-folder.interface';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { USER_PREFERENCE_KEYS } from '../../shared/constants/common.constants';

describe('Workspace detail navigation authorization', () => {
  let fixture: ComponentFixture<Workspacefolders>;
  const workspaces = { getById: vi.fn() };
  const folders = {
    getAllWorkspaceFolders: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  };
  const folder = (id = 'f') =>
    ({ id, workspaceId: 'a', name: id, status: 'ACTIVE', isDefault: false }) as WorkspaceFolder;
  afterEach(() => vi.useRealTimers());
  beforeEach(async () => {
    folders.update.mockReset();
    folders.updateStatus.mockReset();
    folders.delete.mockReset();
    workspaces.getById.mockReset().mockReturnValue(
      of({
        data: {
          id: 'a',
          name: 'Workspace',
          status: 'ACTIVE',
          isOwner: true,
          allowedActions: { canView: true },
        },
      }),
    );
    folders.getAllWorkspaceFolders.mockReset().mockReturnValue(of({ data: [] }));
    await TestBed.configureTestingModule({
      imports: [Workspacefolders],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: WorkspaceService, useValue: workspaces },
        { provide: WorkspaceFolderService, useValue: folders },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    })
      .overrideComponent(Workspacefolders, { set: { template: '', imports: [] } })
      .compileComponents();
    TestBed.inject(WorkspaceStore).setWorkspaces([{ id: 'a', name: 'Workspace' }]);
    vi.spyOn(TestBed.inject(UserPreferenceStore), 'setAndSave').mockImplementation(() => {});
    fixture = TestBed.createComponent(Workspacefolders);
  });

  it('checks fresh READ metadata and limits the folder request to that workspace', () => {
    fixture.detectChanges();
    expect(workspaces.getById).toHaveBeenCalledWith('a');
    expect(folders.getAllWorkspaceFolders).toHaveBeenCalledWith({
      workspaceId: 'a',
      page: 1,
      limit: 20,
      status: 'ALL',
      sortBy: 'position',
      sortOrder: 'asc',
    });
  });

  it('blocks direct navigation when READ has been revoked', () => {
    workspaces.getById.mockReturnValue(
      of({ data: { id: 'a', allowedActions: { canView: false } } }),
    );
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
    expect(folders.getAllWorkspaceFolders).toHaveBeenCalledExactlyOnceWith({
      workspaceId: 'b',
      page: 1,
      limit: 20,
      status: 'ALL',
      sortBy: 'position',
      sortOrder: 'asc',
    });
  });
  it('keeps backend ordering and reads full counts rather than counting the current page', () => {
    folders.getAllWorkspaceFolders.mockReturnValue(
      of({
        data: [folder('z'), folder('a')],
        meta: {
          page: 1,
          limit: 20,
          total: 65,
          totalPages: 4,
          counts: { all: 80, active: 65, archived: 15 },
        },
      }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.visibleFolders().map((item) => item.id)).toEqual(['z', 'a']);
    expect(fixture.componentInstance.totalCount()).toBe(80);
    expect(fixture.componentInstance.pagination().totalPages).toBe(4);
    fixture.componentInstance.setFolderTab('archived');
    expect(folders.getAllWorkspaceFolders).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'ARCHIVED', page: 1 }),
    );
  });

  it('includes active and archived folders in All and keeps trash separate', () => {
    const archived = { ...folder('archived'), status: 'ARCHIVED' as const };
    folders.getAllWorkspaceFolders.mockReturnValue(
      of({ data: [folder('active'), archived, { ...folder('trash'), status: 'DELETED' }] }),
    );
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.isGroupCollapsed('archived')).toBe(true);
    expect(page.visibleFolders().map((item) => item.id)).toEqual(['active', 'archived']);
    expect(page.folderGroups().map((group) => group.id)).toEqual(['active', 'archived']);
    page.setFolderTab('archived');
    expect(page.visibleFolders().map((item) => item.id)).toEqual(['archived']);
    expect(page.isGroupCollapsed('archived')).toBe(false);
  });

  it('shows archived group row in All even when there are 0 archived folders without search', () => {
    folders.getAllWorkspaceFolders.mockReturnValue(of({ data: [folder('active')] }));
    fixture.detectChanges();
    const page = fixture.componentInstance;
    expect(page.folderGroups().map((group) => group.id)).toEqual(['active', 'archived']);
    expect(page.isGroupCollapsed('archived')).toBe(true);
  });

  it('opens rename at the end without selecting or resetting the edited name', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const item = { ...folder(), name: 'Folder name' };
    page.folders.set([item]);
    const input = document.createElement('input');
    input.value = item.name;
    vi.spyOn(page as any, 'renameInput').mockReturnValue({ nativeElement: input });
    page.beginInlineRename(item);
    vi.runOnlyPendingTimers();
    expect(input.selectionStart).toBe(item.name.length);
    expect(input.selectionEnd).toBe(item.name.length);
    page.inlineRenameName.set('Editing');
    page.beginInlineRename(item, new MouseEvent('dblclick'));
    expect(page.inlineRenameName()).toBe('Editing');
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
    expect(folders.getAllWorkspaceFolders).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'new', page: 1 }),
    );
  });

  it('returns to the previous page after deleting its last result', () => {
    fixture.detectChanges();
    folders.getAllWorkspaceFolders
      .mockReturnValueOnce(of({ data: [], meta: { page: 2, limit: 20, total: 20, totalPages: 1 } }))
      .mockReturnValueOnce(
        of({ data: [folder()], meta: { page: 1, limit: 20, total: 20, totalPages: 1 } }),
      );
    fixture.componentInstance.page.set(2);
    fixture.componentInstance.loadFolders();
    expect(fixture.componentInstance.page()).toBe(1);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('selects and highlights a folder without opening it on row or menu click', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const first = folder('first');
    const second = folder('second');
    page.folders.set([first, second]);
    const open = vi.spyOn(page, 'openFolder');
    const emitted = vi.spyOn(page.folderOpened, 'emit');
    page.handleFolderClick(first, new MouseEvent('click'));
    expect(page.selectedFolderId()).toBe('first');
    expect(page.isFolderHighlighted(first)).toBe(true);
    page.handleFolderMenuClick(second, new MouseEvent('click'));
    expect(page.selectedFolderId()).toBe('second');
    expect(page.isFolderHighlighted(first)).toBe(false);
    expect(page.isFolderHighlighted(second)).toBe(true);
    expect(page.selectedCount()).toBe(0);
    expect(open).not.toHaveBeenCalled();
    expect(emitted).not.toHaveBeenCalled();
  });

  it('ignores nested controls and starts inline rename on row double-click', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.folders.set([folder()]);
    const button = document.createElement('button');
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: button });
    page.handleFolderClick(folder(), event);
    page.handleFolderDoubleClick(folder(), event);
    expect(page.focusedFolderId()).toBeNull();
    expect(page.inlineRenameId()).toBeNull();
    page.handleFolderDoubleClick(folder(), new MouseEvent('dblclick'));
    expect(page.inlineRenameId()).toBe('f');
    expect(page.folderEditorOpen()).toBe(false);
  });

  it('positions the right-click menu at the pointer and highlights its folder', () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.folders.set([folder()]);
    const trigger = { closeMenu: vi.fn(), openMenu: vi.fn() };
    vi.spyOn(page, 'folderContextMenuTrigger').mockReturnValue(trigger as any);
    const event = new MouseEvent('contextmenu', { clientX: 120, clientY: 80, cancelable: true });
    page.openContextMenu(folder(), event);
    expect(event.defaultPrevented).toBe(true);
    expect(page.contextMenuPosition()).toEqual({ x: 120, y: 80 });
    expect(page.contextMenuFolder()?.id).toBe('f');
    expect(page.isFolderHighlighted(folder())).toBe(true);
    vi.runOnlyPendingTimers();
    expect(trigger.openMenu).toHaveBeenCalledOnce();
    page.closeFolderContextMenu();
    expect(page.contextMenuFolder()).toBeNull();
    expect(page.isFolderHighlighted(folder())).toBe(true);
  });

  it('submits rename only once for Enter plus blur, and never after Escape', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const pending = new Subject();
    folders.update.mockReturnValue(pending);
    page.folders.set([folder()]);
    page.beginInlineRename(folder());
    page.inlineRenameName.set('renamed');
    page.saveInlineRename(folder());
    page.saveInlineRename(folder());
    expect(folders.update).toHaveBeenCalledTimes(1);
    pending.next({ data: { ...folder(), name: 'renamed' } });
    pending.complete();
    page.beginInlineRename(folder());
    page.inlineRenameName.set('cancelled');
    page.cancelInlineRename();
    page.saveInlineRename(folder());
    expect(folders.update).toHaveBeenCalledTimes(1);
  });

  it('reports individual bulk failures and releases busy state', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    page.folders.set([folder('one'), folder('two')]);
    page.toggleSelectAll(true);
    folders.updateStatus
      .mockReturnValueOnce(of({ data: { ...folder('one'), status: 'ARCHIVED' } }))
      .mockReturnValueOnce(throwError(() => ({ status: 500 })));
    page.bulkArchiveSelected();
    expect(TestBed.inject(ToastService).success).toHaveBeenCalledWith('1 folder(s) archived.');
    expect(TestBed.inject(ToastService).error).toHaveBeenCalledWith(
      '1 folder(s) could not be updated.',
    );
    expect(page.bulkBusy()).toBe(false);
    expect(page.selectedCount()).toBe(0);
  });

  it('requires confirmation before bulk trash and rejects duplicate submissions', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const pending = new Subject();
    folders.delete.mockReturnValue(pending);
    page.folders.set([folder()]);
    page.toggleSelectAll(true);
    page.bulkDeleteSelected();
    expect(folders.delete).not.toHaveBeenCalled();
    expect(page.bulkDeleteOpen()).toBe(true);
    page.confirmBulkDelete();
    page.confirmBulkDelete();
    expect(folders.delete).toHaveBeenCalledTimes(1);
    pending.next({ data: { ...folder(), status: 'DELETED' } });
    pending.complete();
    expect(page.bulkBusy()).toBe(false);
  });

  it('patches sticky notes details into notes badges from the folder summary', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const folderWithSummary: WorkspaceFolder = {
      id: '6a96edf5d1b8847c20316875',
      workspaceId: '6a96edf5d1b8847c20316873',
      name: 'My Notes',
      slug: 'my-notes-6a96edf4d1b8847c20316871',
      description: 'Your default notes folder',
      icon: null,
      color: null,
      position: 0,
      isDefault: true,
      status: 'ACTIVE',
      summary: {
        stickyNoteCount: 22,
        stickyNotesCount: 22,
        total: 22,
        active: 22,
        archived: 0,
      },
      createdBy: '6a96edf4d1b8847c20316871',
      updatedBy: '6a96edf4d1b8847c20316871',
      deletedAt: null,
      deletedBy: null,
      purgeAfter: null,
      createdAt: '2026-09-01T15:23:33.170Z',
      updatedAt: '2026-09-06T05:37:58.843Z',
    };

    expect(page.folderNotesCount(folderWithSummary)).toBe(22);
    expect(page.folderNotesActiveCount(folderWithSummary)).toBe(22);
    expect(page.folderNotesArchivedCount(folderWithSummary)).toBe(0);
    expect(page.folderNotesCountLabel(folderWithSummary)).toBe('22 notes');
    expect(page.folderNotesBadgeVariant(folderWithSummary)).toBe('noteYellow');
    expect(page.folderNotesTooltip(folderWithSummary)).toBe('22 notes (22 active, 0 archived)');

    const emptyFolder = folder('empty');
    expect(page.folderNotesCount(emptyFolder)).toBe(0);
    expect(page.folderNotesCountLabel(emptyFolder)).toBe('0 notes');
    expect(page.folderNotesBadgeVariant(emptyFolder)).toBe('neutral');
    expect(page.folderNotesTooltip(emptyFolder)).toBe('0 notes in folder');

    const folderWithArchived: WorkspaceFolder = {
      ...folder('archived-notes'),
      summary: { total: 5, active: 3, archived: 2 },
    };
    expect(page.folderNotesCount(folderWithArchived)).toBe(5);
    expect(page.folderNotesCountLabel(folderWithArchived)).toBe('5 notes');
    expect(page.folderNotesTooltip(folderWithArchived)).toBe('5 notes (3 active, 2 archived)');
  });

  it('manages notes by delegating to openFolder for the requested folder', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const target = folder('target-folder');
    const openSpy = vi.spyOn(page, 'openFolder').mockImplementation(() => {});
    page.manageNotes(target);
    expect(openSpy).toHaveBeenCalledWith(target);
  });

  it('persists folder view, status filter, and sort order with folder preference keys', () => {
    fixture.detectChanges();
    const page = fixture.componentInstance;
    const prefStore = TestBed.inject(UserPreferenceStore);
    const saveSpy = vi.spyOn(prefStore, 'setAndSave');

    page.setFolderView('list');
    expect(saveSpy).toHaveBeenCalledWith(USER_PREFERENCE_KEYS.WORKSPACE_FOLDER_VIEW, 'LIST');

    page.setFolderTab('archived');
    expect(saveSpy).toHaveBeenCalledWith(
      USER_PREFERENCE_KEYS.WORKSPACE_FOLDER_STATUS_FILTER,
      'ARCHIVED',
    );

    page.setSort('updatedAt');
    expect(saveSpy).toHaveBeenCalledWith(
      USER_PREFERENCE_KEYS.WORKSPACE_FOLDER_SORT_ORDER,
      'RECENTLY_UPDATED',
    );
  });

  it('does not re-fetch workspace details when switching status tab or sort order', () => {
    fixture.detectChanges();
    expect(workspaces.getById).toHaveBeenCalledTimes(1);

    fixture.componentInstance.setFolderTab('archived');
    expect(workspaces.getById).toHaveBeenCalledTimes(1);
    expect(folders.getAllWorkspaceFolders).toHaveBeenCalledTimes(2);

    fixture.componentInstance.setSort('name');
    expect(workspaces.getById).toHaveBeenCalledTimes(1);
    expect(folders.getAllWorkspaceFolders).toHaveBeenCalledTimes(3);
  });
});
