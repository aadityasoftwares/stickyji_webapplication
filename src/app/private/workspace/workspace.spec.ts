import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Workspace } from './workspace';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceStore } from './services/workspace.store';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { UserPreferenceService } from '../user-preferences/services/user-preference.service';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { APP_ROUTES } from '../../shared/constants/route.constants';

describe('Workspace', () => {
  let component: Workspace;
  let fixture: ComponentFixture<Workspace>;
  let preferences: UserPreferenceStore;
  let loadedPreferences: Subject<any>;
  let workspaceStore: WorkspaceStore;
  let workspaceApi: {
    getAllWorkspaces: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let preferenceApi: {
    getMyPreferences: ReturnType<typeof vi.fn>;
    createPreference: ReturnType<typeof vi.fn>;
    updatePreference: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    loadedPreferences = new Subject();
    preferenceApi = {
      getMyPreferences: vi.fn(() => loadedPreferences),
      createPreference: vi.fn((key, value) => of({ data: { key, value } })),
      updatePreference: vi.fn((key, value) => of({ data: { key, value } })),
    };
    workspaceApi = {
      getAllWorkspaces: vi.fn(() => of({ data: [] })),
      update: vi.fn(() => of({})),
      updateStatus: vi.fn(() => of({})),
      delete: vi.fn(() => of({})),
    };
    toast = { success: vi.fn(), error: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UserPreferenceService, useValue: preferenceApi },
        { provide: WorkspaceService, useValue: workspaceApi },
        { provide: ToastService, useValue: toast },
      ],
    })
      .overrideComponent(Workspace, { set: { template: '', imports: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(Workspace);
    component = fixture.componentInstance;
    preferences = TestBed.inject(UserPreferenceStore);
    workspaceStore = TestBed.inject(WorkspaceStore);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(preferenceApi.getMyPreferences).toHaveBeenCalledOnce();
    expect([component.activeTab(), component.sortBy(), component.view()]).toEqual(['all', 'recent', 'grid']);
  });

  it('restores preferences that arrive after initialization', () => {
    loadedPreferences.next({ data: [
      { key: 'workspaceStatusFilter', value: 'ARCHIVED' },
      { key: 'workspaceSortOrder', value: 'NAME_DESC' },
      { key: 'workspaceView', value: 'LIST' },
    ] });
    expect([component.activeTab(), component.sortBy(), component.view()]).toEqual(['archived', 'name-desc', 'list']);
    expect(preferenceApi.createPreference).not.toHaveBeenCalled();
    expect(preferenceApi.updatePreference).not.toHaveBeenCalled();
  });

  it('creates new preferences and updates existing ones with the API values', () => {
    loadedPreferences.next({ data: [] });
    component.onStatusChange('archived');
    component.onSortChange('created');
    component.onViewChange('list');
    expect(preferenceApi.createPreference.mock.calls).toEqual([
      ['workspaceStatusFilter', 'ARCHIVED'],
      ['workspaceSortOrder', 'RECENTLY_CREATED'],
      ['workspaceView', 'LIST'],
    ]);
    component.onStatusChange('all');
    component.onSortChange('recent');
    component.onViewChange('grid');
    expect(preferenceApi.updatePreference.mock.calls).toEqual([
      ['workspaceStatusFilter', 'ALL'],
      ['workspaceSortOrder', 'RECENTLY_UPDATED'],
      ['workspaceView', 'GRID'],
    ]);
  });

  it('rolls back the displayed settings when saves fail', () => {
    loadedPreferences.next({ data: [] });
    preferenceApi.createPreference.mockImplementation(() => throwError(() => new Error('Save failed')));
    component.onStatusChange('archived');
    component.onSortChange('oldest');
    component.onViewChange('list');
    expect([component.activeTab(), component.sortBy(), component.view()]).toEqual(['all', 'recent', 'grid']);
    expect(preferences.error()).toBeTruthy();
  });

  it('ignores invalid control values and falls back for invalid saved preferences', () => {
    loadedPreferences.next({ data: [
      { key: 'workspaceStatusFilter', value: 'INVALID' },
      { key: 'workspaceSortOrder', value: 'INVALID' },
      { key: 'workspaceView', value: 'INVALID' },
    ] });
    component.onStatusChange('invalid');
    component.onSortChange('invalid');
    component.onViewChange('invalid');
    expect([component.activeTab(), component.sortBy(), component.view()]).toEqual(['all', 'recent', 'grid']);
    expect(preferenceApi.createPreference).not.toHaveBeenCalled();
    expect(preferenceApi.updatePreference).not.toHaveBeenCalled();
  });

  it.each([
    ['RECENTLY_UPDATED', ['a', 'b', 'c']],
    ['RECENTLY_CREATED', ['c', 'b', 'a']],
    ['NAME_ASC', ['b', 'a', 'c']],
    ['NAME_DESC', ['c', 'a', 'b']],
    ['OLDEST_FIRST', ['c', 'b', 'a']],
  ])('applies the saved %s sort order', (value, expected) => {
    component.workspaces.set([
      { id: 'a', name: 'Beta', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-03-03' },
      { id: 'b', name: 'Alpha', status: 'ARCHIVED', createdAt: '2026-01-02', updatedAt: '2026-03-02' },
      { id: 'c', name: 'Gamma', status: 'ACTIVE', createdAt: '2026-01-03', updatedAt: '2026-03-01' },
    ]);
    preferences.updatePreference('workspaceSortOrder', value);
    expect(component.visibleWorkspaces().map(item => item.id)).toEqual(expected);
    expect(component.workspaces().map(item => item.id)).toEqual(['a', 'b', 'c']);
    preferences.updatePreference('workspaceStatusFilter', 'ARCHIVED');
    expect(component.visibleWorkspaces().map(item => item.id)).toEqual(['b']);
  });

  it('finishes bulk archive after successes, failures and skipped selections', () => {
    const first = new Subject();
    const second = new Subject();
    workspaceApi.updateStatus.mockImplementation(id => id === 'a' ? first : second);
    component.workspaces.set([
      { id: 'a', status: 'ACTIVE' },
      { id: 'b', status: 'ACTIVE' },
      { id: 'c', status: 'ARCHIVED' },
    ]);
    component.selectedWorkspaceIds.set(new Set(['a', 'b', 'c', 'missing']));

    component.bulkArchiveSelected();
    expect(workspaceApi.updateStatus.mock.calls).toEqual([['a', 'ARCHIVED'], ['b', 'ARCHIVED']]);
    second.error(new Error('Archive failed'));
    expect(component.selectedCount()).toBe(4);
    expect(toast.success).not.toHaveBeenCalled();
    first.next({});
    first.complete();

    expect(component.workspaces().map(item => item.status)).toEqual(['ARCHIVED', 'ACTIVE', 'ARCHIVED']);
    expect(component.selectedCount()).toBe(0);
    expect(toast.success).toHaveBeenCalledExactlyOnceWith('Archived 1 workspace');
  });

  it('removes only successful bulk deletions and preserves the remaining store selection', () => {
    const first = new Subject();
    const second = new Subject();
    workspaceApi.delete.mockImplementation(id => id === 'a' ? first : second);
    const workspaces: any[] = [{ id: 'a' }, { id: 'b' }];
    component.workspaces.set(workspaces);
    workspaceStore.setWorkspaces(workspaces);
    component.selectedWorkspaceIds.set(new Set(['a', 'b']));

    component.bulkDeleteSelected();
    first.next({});
    first.complete();
    expect(component.selectedCount()).toBe(2);
    expect(toast.success).not.toHaveBeenCalled();
    second.error(new Error('Delete failed'));

    expect(component.workspaces().map(item => item.id)).toEqual(['b']);
    expect(workspaceStore.workspaces().map(item => item.id)).toEqual(['b']);
    expect(workspaceStore.selectedId()).toBe('b');
    expect(component.selectedCount()).toBe(0);
    expect(toast.success).toHaveBeenCalledExactlyOnceWith('Moved 1 workspace to trash');
  });

  it('clears unsuccessful bulk selections without a success notification', () => {
    component.workspaces.set([{ id: 'a', status: 'ACTIVE' }]);
    workspaceApi.updateStatus.mockReturnValue(throwError(() => new Error('Archive failed')));
    workspaceApi.delete.mockReturnValue(throwError(() => new Error('Delete failed')));
    component.selectedWorkspaceIds.set(new Set(['a']));
    component.bulkArchiveSelected();
    expect(component.selectedCount()).toBe(0);
    component.selectedWorkspaceIds.set(new Set(['a']));
    component.bulkDeleteSelected();
    expect(component.selectedCount()).toBe(0);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('skips bulk requests when nothing is selected', () => {
    component.bulkArchiveSelected();
    component.bulkDeleteSelected();
    expect(workspaceApi.updateStatus).not.toHaveBeenCalled();
    expect(workspaceApi.delete).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('prevents overlapping loads, reports errors and allows retry', () => {
    const response = new Subject();
    workspaceApi.getAllWorkspaces.mockReturnValue(response);
    component.loadWorkspaces();
    component.loadWorkspaces();
    expect(workspaceApi.getAllWorkspaces).toHaveBeenCalledTimes(2);
    expect(workspaceApi.getAllWorkspaces).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      status: 'ALL',
      sortBy: 'RECENTLY_UPDATED',
    });
    expect(component.loading()).toBe(true);
    response.error(new Error('Load failed'));
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeTruthy();

    workspaceApi.getAllWorkspaces.mockReturnValue(of({ data: { workspaces: [{ id: 'saved', name: 'Saved' }] } }));
    component.loadWorkspaces('saved');
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.workspaces()[0].name).toBe('Saved');
    expect(workspaceStore.selectedId()).toBe('saved');
  });

  it('cancels an outstanding load and resets its loading state on destruction', () => {
    const response = new Subject();
    workspaceApi.getAllWorkspaces.mockReturnValue(response);
    component.loadWorkspaces();
    fixture.destroy();
    expect(component.loading()).toBe(false);
    response.next({ data: [{ id: 'late' }] });
    expect(component.workspaces()).toEqual([]);
  });

  it('updates counts and total from backend meta.counts and meta.total', () => {
    workspaceApi.getAllWorkspaces.mockReturnValue(
      of({
        data: [{ id: '1', name: 'Alpha', status: 'ACTIVE' }],
        meta: {
          page: 1,
          limit: 20,
          total: 42,
          totalPages: 3,
          counts: { all: 42, active: 30, archived: 12 },
        },
      })
    );
    component.loadWorkspaces('', true);
    expect(component.totalCount()).toBe(42);
    expect(component.counts()).toEqual({ all: 42, active: 30, archived: 12 });
    expect(component.workspaceTabs().map((tab) => ({ value: tab.value, count: tab.count }))).toEqual([
      { value: 'all', count: 42 },
      { value: 'active', count: 30 },
      { value: 'archived', count: 12 },
    ]);
  });

  it('calls backend with trimmed search, active status, sort preset and resets to page 1', () => {
    vi.useFakeTimers();
    workspaceApi.getAllWorkspaces.mockClear();

    component.onSearch('  Project Notes  ');
    vi.advanceTimersByTime(300);

    expect(workspaceApi.getAllWorkspaces).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      status: 'ALL',
      sortBy: 'RECENTLY_UPDATED',
      search: 'Project Notes',
    });

    component.onClearSearch();
    expect(workspaceApi.getAllWorkspaces).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      status: 'ALL',
      sortBy: 'RECENTLY_UPDATED',
    });
    expect(component.searchTerm()).toBe('');
  });


  it('validates inline rename and keeps a failed rename available for retry', () => {
    vi.useFakeTimers();
    const workspace: any = { id: 'a', name: 'Original', status: 'ACTIVE' };
    component.workspaces.set([workspace]);
    workspaceStore.setWorkspaces([workspace as any]);
    component.beginInlineRename(workspace);
    component.inlineRenameName.set(' ');
    component.saveInlineRename(workspace);
    expect(component.inlineRenameError()).toBe('Workspace name cannot be empty');
    expect(workspaceApi.update).not.toHaveBeenCalled();

    const response = new Subject();
    workspaceApi.update.mockReturnValue(response);
    component.inlineRenameName.set(' Renamed ');
    component.saveInlineRename(workspace);
    component.saveInlineRename(workspace);
    expect(workspaceApi.update).toHaveBeenCalledExactlyOnceWith('a', { name: 'Renamed' });
    response.error(new Error('Rename failed'));
    expect(component.inlineRenameSubmitting()).toBe(false);
    expect(component.inlineRenameId()).toBe('a');
    expect(component.inlineRenameError()).toBeTruthy();
    expect(component.workspaces()[0].name).toBe('Original');

    workspaceApi.update.mockReturnValue(of({ data: { description: 'Server description' } }));
    component.saveInlineRename(workspace);
    expect(component.inlineRenameId()).toBeNull();
    expect(component.inlineRenameSubmitting()).toBe(false);
    expect(component.workspaces()[0]).toMatchObject({ name: 'Renamed', description: 'Server description' });
    expect(workspaceStore.workspaces()[0].name).toBe('Renamed');
    vi.runAllTimers();
  });

  it('preserves status request payloads, store updates and busy guards', () => {
    const workspace: any = { id: 'a', name: 'Space', status: 'ACTIVE' };
    component.workspaces.set([workspace]);
    workspaceStore.setWorkspaces([workspace as any]);
    const response = new Subject();
    workspaceApi.updateStatus.mockReturnValue(response);
    component.archiveWorkspace(workspace);
    component.archiveWorkspace(workspace);
    expect(workspaceApi.updateStatus).toHaveBeenCalledExactlyOnceWith('a', 'ARCHIVED');
    expect(component.isBusy(workspace)).toBe(true);
    response.next({ data: { description: 'Server description' } });
    response.complete();
    expect(component.isBusy(workspace)).toBe(false);
    expect(component.workspaces()[0]).toMatchObject({ status: 'ARCHIVED', description: 'Server description' });
    expect(workspaceStore.workspaces()[0].status).toBe('ARCHIVED');

    workspaceApi.updateStatus.mockReturnValue(throwError(() => new Error('Restore failed')));
    component.activateWorkspace(component.workspaces()[0]);
    expect(workspaceApi.updateStatus).toHaveBeenLastCalledWith('a', 'ACTIVE');
    expect(component.isBusy(workspace)).toBe(false);
    expect(component.workspaces()[0].status).toBe('ARCHIVED');
  });

  it('keeps a failed delete dialog open and removes the workspace after retry', () => {
    const workspace: any = { id: 'a', name: 'Space' };
    component.workspaces.set([workspace]);
    workspaceStore.setWorkspaces([workspace as any]);
    const response = new Subject();
    workspaceApi.delete.mockReturnValue(response);
    component.requestDelete(workspace);
    component.confirmDelete();
    component.confirmDelete();
    component.closeDeleteDialog();
    expect(workspaceApi.delete).toHaveBeenCalledExactlyOnceWith('a');
    expect(component.deleteTarget()).toBe(workspace);
    expect(component.deleting()).toBe(true);
    response.error(new Error('Delete failed'));
    expect(component.deleting()).toBe(false);
    expect(component.isBusy(workspace)).toBe(false);
    expect(component.deleteTarget()).toBe(workspace);
    expect(component.workspaces()).toEqual([workspace]);

    workspaceApi.delete.mockReturnValue(of({}));
    component.confirmDelete();
    expect(component.deleteTarget()).toBeNull();
    expect(component.workspaces()).toEqual([]);
    expect(workspaceStore.workspaces()).toEqual([]);
    expect(workspaceStore.selectedId()).toBeNull();
  });

  it('navigates to workspace trash and sticky note trash', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.openWorkspaceTrash();
    expect(navigateSpy).toHaveBeenCalledWith([APP_ROUTES.WORKSPACE_TRASH]);

    workspaceStore.setWorkspaces([{ id: 'ws-123', name: 'Test' } as any]);
    workspaceStore.select('ws-123');
    component.openStickyNoteTrash();
    expect(navigateSpy).toHaveBeenLastCalledWith([APP_ROUTES.TRASH], {
      queryParams: { workspaceId: 'ws-123' },
    });
  });
});
