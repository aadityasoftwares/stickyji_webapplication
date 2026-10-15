import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkspaceRoleApiService } from './workspace-role.service';
import { PermissionApiService } from './permission.service';
import { WorkspaceRoleApiService as MemberRoleApiService } from '../../roles/services/workspace-role.service';

describe('Roles and permissions API safety', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sends the member role picker filters in a JSON POST body', () => {
    TestBed.inject(MemberRoleApiService).getWorkspaceRoles('workspace').subscribe();
    const request = http.expectOne(req => req.url.endsWith('/roles/getall'));
    expect(request.request.method).toBe('POST');
    expect(request.request.params.keys()).toEqual([]);
    expect(request.request.body).toEqual({
      workspaceId: 'workspace', scope: 'WORKSPACE', isActive: true, page: 1,
      limit: 100, sortBy: 'priority', sortOrder: 'desc'
    });
    expect(request.request.withCredentials).toBe(true);
    request.flush({ success: true, data: [] });
  });

  it('preserves the role query and handles a missing collection safely', () => {
    const next = vi.fn();
    TestBed.inject(WorkspaceRoleApiService).getWorkspaceRoles('workspace').subscribe(next);
    const request = http.expectOne(req => req.url.endsWith('/roles/getall'));
    expect(request.request.method).toBe('POST');
    expect(request.request.params.keys()).toEqual([]);
    expect(request.request.body).toEqual({
      workspaceId: 'workspace', page: 1, limit: 100, scope: 'WORKSPACE',
      sortBy: 'priority', sortOrder: 'desc'
    });
    expect(request.request.withCredentials).toBe(true);
    request.flush({ data: null });
    expect(next).toHaveBeenCalledWith([]);
  });

  it('reports malformed mutation responses through the error channel', () => {
    const error = vi.fn();
    TestBed.inject(WorkspaceRoleApiService).changeStatus('role', false).subscribe({ error });
    const request = http.expectOne(req => req.url.endsWith('/roles/update/role/status'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ isActive: false });
    request.flush({ data: null });
    expect(error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('handles missing permission names, null entries and malformed groups', () => {
    const next = vi.fn();
    TestBed.inject(PermissionApiService).getGrouped().subscribe(next);
    http.expectOne(req => req.url.endsWith('/permissions/grouped')).flush({ data: [
      null, { module: 'EMPTY', permissions: {} },
      { module: 'NOTES', permissions: [null, { id: 'one' }, { id: 'two' }, { id: 'off', isActive: false }] }
    ] });
    expect(next).toHaveBeenCalledWith([{ module: 'NOTES', permissions: [{ id: 'one' }, { id: 'two' }] }]);
  });

  it('keeps inactive permissions when loading the management catalog', () => {
    const next = vi.fn();
    TestBed.inject(PermissionApiService).getGrouped(true).subscribe(next);
    const request = http.expectOne(req => req.url.endsWith('/permissions/getall'));
    expect(request.request.method).toBe('POST');
    expect(request.request.params.keys()).toEqual([]);
    expect(request.request.body).toEqual({
      page: 1,
      limit: 100,
      sortBy: 'sortOrder',
      sortOrder: 'asc'
    });
    expect(request.request.withCredentials).toBe(true);
    request.flush({ data: [
      { id: 'on', module: 'NOTES', displayName: 'Active', sortOrder: 1, isActive: true },
      { id: 'off', module: 'NOTES', displayName: 'Inactive', sortOrder: 2, isActive: false }
    ] });
    expect(next).toHaveBeenCalledWith([{
      module: 'NOTES',
      permissions: [
        { id: 'on', module: 'NOTES', displayName: 'Active', sortOrder: 1, isActive: true },
        { id: 'off', module: 'NOTES', displayName: 'Inactive', sortOrder: 2, isActive: false }
      ]
    }]);
  });

  it('integrates role getByCode endpoint', () => {
    const next = vi.fn();
    TestBed.inject(WorkspaceRoleApiService).getByCode('WORKSPACE_ADMIN').subscribe(next);
    const req = http.expectOne(r => r.url.endsWith('/roles/get/code/WORKSPACE_ADMIN'));
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ success: true, message: 'Role retrieved', data: { code: 'WORKSPACE_ADMIN' } });
    expect(next).toHaveBeenCalledWith({ success: true, message: 'Role retrieved', data: { code: 'WORKSPACE_ADMIN' } });
  });

  it('integrates permission CRUD endpoints', () => {
    const permApi = TestBed.inject(PermissionApiService);

    // getAll
    const allNext = vi.fn();
    permApi.getAll({ page: 1, limit: 10, module: 'NOTES' }).subscribe(allNext);
    const getAllReq = http.expectOne(r => r.url.endsWith('/permissions/getall'));
    expect(getAllReq.request.method).toBe('POST');
    expect(getAllReq.request.params.keys()).toEqual([]);
    expect(getAllReq.request.body).toEqual({ page: 1, limit: 10, module: 'NOTES' });
    expect(getAllReq.request.withCredentials).toBe(true);
    getAllReq.flush({ success: true, data: [] });

    // getById
    permApi.getById('perm123').subscribe();
    const getReq = http.expectOne(r => r.url.endsWith('/permissions/get/perm123'));
    expect(getReq.request.method).toBe('GET');
    getReq.flush({ success: true, data: { id: 'perm123' } });

    // getByCode
    permApi.getByCode('NOTES_CREATE').subscribe();
    const getCodeReq = http.expectOne(r => r.url.endsWith('/permissions/get/code/NOTES_CREATE'));
    expect(getCodeReq.request.method).toBe('GET');
    getCodeReq.flush({ success: true, data: { code: 'NOTES_CREATE' } });

    // create
    permApi.create({
      displayName: 'Notes Create',
      name: 'notes-create',
      code: 'NOTES_CREATE',
      module: 'NOTES',
      action: 'CREATE',
      access: 'GENERAL',
      isActive: true
    }).subscribe();
    const createReq = http.expectOne(r => r.url.endsWith('/permissions/create'));
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body.code).toBe('NOTES_CREATE');
    createReq.flush({ success: true, data: { id: 'new_id' } });

    // update
    permApi.update('perm123', { displayName: 'Updated Name', action: 'UPDATE' }).subscribe();
    const updateReq = http.expectOne(r => r.url.endsWith('/permissions/update/perm123'));
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body.displayName).toBe('Updated Name');
    updateReq.flush({ success: true, data: { id: 'perm123' } });

    // changeStatus
    permApi.changeStatus('perm123', false).subscribe();
    const statusReq = http.expectOne(r => r.url.endsWith('/permissions/update/perm123/status'));
    expect(statusReq.request.method).toBe('PATCH');
    expect(statusReq.request.body).toEqual({ isActive: false });
    statusReq.flush({ success: true, data: { id: 'perm123', isActive: false } });

    // delete
    permApi.delete('perm123').subscribe();
    const delReq = http.expectOne(r => r.url.endsWith('/permissions/delete/perm123'));
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({ success: true, message: 'Deleted', data: null });
  });
});
