import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkspaceFolderService } from './workspace-folder.service';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';

describe('Folder API contract', () => {
  let api: WorkspaceFolderService;
  let http: HttpTestingController;
  const base = API_ENDPOINTS.workspaceFolders.base;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(WorkspaceFolderService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('fetches every active folder page for navigation', () => {
    const result: string[] = [];
    api
      .getFolderOptions('w')
      .subscribe((folders) => result.push(...folders.map((folder) => folder.id)));
    const first = http.expectOne(`${base}/getall`);
    expect(first.request.body).toEqual({
      workspaceId: 'w',
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      sortBy: 'position',
      sortOrder: 'asc',
    });
    first.flush({
      data: [{ id: 'first' }],
      meta: { page: 1, limit: 100, total: 101, totalPages: 2 },
    });
    expect(result).toEqual([]);
    const second = http.expectOne(`${base}/getall`);
    expect(second.request.body.page).toBe(2);
    second.flush({
      data: [{ id: 'last' }],
      meta: { page: 2, limit: 100, total: 101, totalPages: 2 },
    });
    expect(result).toEqual(['first', 'last']);
  });

  it('uses distinct canonical routes for trash, restore, and permanent deletion', () => {
    api.delete('f').subscribe();
    const trash = http.expectOne(`${base}/delete/f`);
    expect(trash.request.method).toBe('DELETE');
    expect(trash.request.withCredentials).toBe(true);
    trash.flush({ data: { id: 'f', status: 'DELETED' } });
    api.restore('f').subscribe();
    const restore = http.expectOne(`${base}/restore/f`);
    expect(restore.request.method).toBe('PUT');
    expect(restore.request.body).toEqual({});
    restore.flush({ data: { id: 'f', status: 'ACTIVE' } });
    api.permanentlyDelete('f').subscribe();
    const permanent = http.expectOne(`${base}/permanent/f`);
    expect(permanent.request.method).toBe('DELETE');
    permanent.flush({ data: null });
  });

  it('sends status transitions through the status endpoint', () => {
    api.updateStatus('f', 'ARCHIVED').subscribe();
    const request = http.expectOne(`${base}/status/f`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ status: 'ARCHIVED' });
    request.flush({ data: { id: 'f', status: 'ARCHIVED' } });
  });
});
