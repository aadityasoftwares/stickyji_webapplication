import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkspaceService } from './workspace.service';
import { WorkspaceStore } from './workspace.store';
import { WorkspaceDropdownStore } from './workspace-dropdown.store';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import type { WorkspaceDropdownResponse } from '../interfaces/workspace-dropdown.interface';

describe('WorkspaceDropdownStore & WorkspaceService dropdown API', () => {
  let service: WorkspaceService;
  let store: WorkspaceDropdownStore;
  let httpMock: HttpTestingController;

  const mockResponse: WorkspaceDropdownResponse = {
    success: true,
    message: 'Workspaces fetched successfully.',
    data: [
      {
        id: 'ws-1',
        name: 'Personal Workspace',
        folders: [
          { id: 'f-1', name: 'General' },
          { id: 'f-2', name: 'Ideas' },
        ],
      },
      {
        id: 'ws-2',
        name: 'Work Workspace',
        folders: [
          { id: 'f-3', name: 'Sprint 1' },
          { id: 'f-4', name: 'Roadmap' },
        ],
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkspaceService,
        WorkspaceStore,
        WorkspaceDropdownStore,
      ],
    });

    service = TestBed.inject(WorkspaceService);
    store = TestBed.inject(WorkspaceDropdownStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('WorkspaceService.getWorkspaceDropdown', () => {
    it('shares overlapping requests and allows a fresh request after completion', () => {
      let responses = 0;
      service.getWorkspaceDropdown().subscribe(() => responses++);
      service.getWorkspaceDropdown('  ').subscribe(() => responses++);
      httpMock.expectOne(API_ENDPOINTS.workspaces.dropdown).flush(mockResponse);
      expect(responses).toBe(2);

      service.getWorkspaceDropdown().subscribe(() => responses++);
      httpMock.expectOne(API_ENDPOINTS.workspaces.dropdown).flush(mockResponse);
      expect(responses).toBe(3);
    });

    it('calls GET /workspaces/dropdown without search query when omitted', () => {
      service.getWorkspaceDropdown().subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API_ENDPOINTS.workspaces.dropdown);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('search')).toBe(false);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });

    it('calls GET /workspaces/dropdown?search=term when search string is provided', () => {
      service.getWorkspaceDropdown('ideas').subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_ENDPOINTS.workspaces.dropdown}?search=ideas`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('search')).toBe('ideas');
      req.flush(mockResponse);
    });

    it('supports alias getDropdown(search)', () => {
      service.getDropdown('test').subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${API_ENDPOINTS.workspaces.dropdown}?search=test`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('WorkspaceDropdownStore', () => {
    it('initializes with empty signals and unselected states', () => {
      expect(store.items()).toEqual([]);
      expect(store.hasWorkspaces()).toBe(false);
      expect(store.selectedWorkspaceId()).toBeNull();
      expect(store.selectedFolderId()).toBeNull();
      expect(store.selectedWorkspace()).toBeNull();
      expect(store.folders()).toEqual([]);
      expect(store.hasFolders()).toBe(false);
      expect(store.loading()).toBe(false);
      expect(store.loaded()).toBe(false);
    });

    it('loads data, sets items, and automatically selects first workspace and its first folder', () => {
      store.load().subscribe();

      expect(store.loading()).toBe(true);

      const req = httpMock.expectOne(API_ENDPOINTS.workspaces.dropdown);
      req.flush(mockResponse);

      expect(store.loading()).toBe(false);
      expect(store.loaded()).toBe(true);
      expect(store.items().length).toBe(2);
      expect(store.hasWorkspaces()).toBe(true);

      expect(store.selectedWorkspaceId()).toBe('ws-1');
      expect(store.selectedWorkspace()?.name).toBe('Personal Workspace');

      expect(store.folders().length).toBe(2);
      expect(store.selectedFolderId()).toBe('f-1');
      expect(store.selectedFolder()?.name).toBe('General');
    });

    it('caches response and avoids duplicate HTTP requests across multiple calls', () => {
      store.load().subscribe();
      const req1 = httpMock.expectOne(API_ENDPOINTS.workspaces.dropdown);
      req1.flush(mockResponse);

      store.load().subscribe();
      httpMock.expectNone(API_ENDPOINTS.workspaces.dropdown);

      store.refresh().subscribe();
      const req2 = httpMock.expectOne(API_ENDPOINTS.workspaces.dropdown);
      req2.flush(mockResponse);
    });

    it('resets folder selection to the new workspace first folder when workspace changes', () => {
      store.setItems(mockResponse.data);

      expect(store.selectedWorkspaceId()).toBe('ws-1');
      expect(store.selectedFolderId()).toBe('f-1');

      store.selectWorkspace('ws-2');
      expect(store.selectedWorkspaceId()).toBe('ws-2');
      expect(store.selectedFolderId()).toBe('f-3');
      expect(store.folders().map((f) => f.id)).toEqual(['f-3', 'f-4']);
    });

    it('allows selecting preferred folder when selecting workspace if present', () => {
      store.setItems(mockResponse.data);

      store.selectWorkspace('ws-2', 'f-4');
      expect(store.selectedWorkspaceId()).toBe('ws-2');
      expect(store.selectedFolderId()).toBe('f-4');
    });

    it('allows changing folder within the current workspace', () => {
      store.setItems(mockResponse.data);

      expect(store.selectedFolderId()).toBe('f-1');
      store.selectFolder('f-2');
      expect(store.selectedFolderId()).toBe('f-2');

      store.selectFolder('invalid-folder');
      expect(store.selectedFolderId()).toBe('f-2');
    });

    it('produces options for workspace and folder select dropdowns', () => {
      store.setItems(mockResponse.data);

      expect(store.workspaceOptions()).toEqual([
        { label: 'Personal Workspace', value: 'ws-1' },
        { label: 'Work Workspace', value: 'ws-2' },
      ]);

      expect(store.folderOptions()).toEqual([
        { label: 'General', value: 'f-1' },
        { label: 'Ideas', value: 'f-2' },
      ]);
    });

    it('handles empty state when no workspaces are returned', () => {
      store.setItems([]);
      expect(store.hasWorkspaces()).toBe(false);
      expect(store.selectedWorkspaceId()).toBeNull();
      expect(store.selectedFolderId()).toBeNull();
      expect(store.folders()).toEqual([]);
      expect(store.workspaceOptions()).toEqual([]);
      expect(store.folderOptions()).toEqual([]);
    });

    it('captures error message when HTTP fails', () => {
      store.load().subscribe();
      const req = httpMock.expectOne(API_ENDPOINTS.workspaces.dropdown);
      req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

      expect(store.loading()).toBe(false);
      expect(store.error()).toBe('Internal Server Error');
    });
  });

  describe('WorkspaceStore lightweight integration', () => {
    it('uses GET /workspaces/dropdown and does not call POST /workspaces/getall when loading', () => {
      const workspaceStore = TestBed.inject(WorkspaceStore);

      workspaceStore.load();

      const req = httpMock.expectOne(API_ENDPOINTS.workspaces.dropdown);
      expect(req.request.method).toBe('GET');
      httpMock.expectNone(API_ENDPOINTS.workspaces.getAll);

      req.flush(mockResponse);

      expect(workspaceStore.workspaces().length).toBe(2);
      expect(workspaceStore.workspaces()[0].name).toBe('Personal Workspace');
      expect(store.items().length).toBe(2);
      expect(store.items()[0].name).toBe('Personal Workspace');
      expect(workspaceStore.loaded()).toBe(true);
    });

    it('reuses loaded WorkspaceDropdownStore without triggering HTTP requests', () => {
      const workspaceStore = TestBed.inject(WorkspaceStore);
      store.setItems(mockResponse.data);

      workspaceStore.load();

      httpMock.expectNone(API_ENDPOINTS.workspaces.dropdown);
      httpMock.expectNone(API_ENDPOINTS.workspaces.getAll);
      expect(workspaceStore.workspaces().length).toBe(2);
      expect(workspaceStore.loaded()).toBe(true);
    });

    it('syncs WorkspaceDropdownStore when WorkspaceStore.setWorkspaces is called', () => {
      const workspaceStore = TestBed.inject(WorkspaceStore);
      workspaceStore.setWorkspaces([
        { id: 'w-custom', name: 'Custom Workspace', folders: [{ id: 'f-custom', name: 'Notes' }] },
      ]);

      expect(store.items().length).toBe(1);
      expect(store.items()[0].id).toBe('w-custom');
      expect(store.items()[0].folders.length).toBe(1);
    });
  });
});
