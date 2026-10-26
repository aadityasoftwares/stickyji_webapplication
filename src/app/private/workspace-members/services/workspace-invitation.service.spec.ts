import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkspaceInvitationApiService } from './workspace-invitation.service';
import { API_BASE_URL, API_ENDPOINTS } from '../../../shared/constants/api.constants';
import type { WorkspaceInvitationQuery } from '../interfaces/workspace-invitation.interface';

describe('WorkspaceInvitationApiService', () => {
  let service: WorkspaceInvitationApiService;
  let http: HttpTestingController;
  const getAllUrl =
    API_ENDPOINTS?.workspaceInvitations?.getAll || `${API_BASE_URL}/workspacememberinvitations/getall`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), WorkspaceInvitationApiService],
    });
    service = TestBed.inject(WorkspaceInvitationApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('getAll', () => {
    it('calls POST /api/v1/workspacememberinvitations/getall with query in the request body', () => {
      const query: WorkspaceInvitationQuery = {
        workspaceId: 'ws-123',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      let responseData: any = null;
      service.getAll(query).subscribe((res) => {
        responseData = res;
      });

      const req = http.expectOne(getAllUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual(query);

      const mockResponse = {
        success: true,
        message: 'Invitations fetched',
        data: [
          {
            id: 'inv-1',
            email: 'user@example.com',
            workspaceId: 'ws-123',
            roleId: 'role-1',
            status: 'PENDING',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      req.flush(mockResponse);
      expect(responseData).toEqual(mockResponse);
    });

    it('defaults to empty query object in POST request body if not provided', () => {
      service.getAll().subscribe();

      const req = http.expectOne(getAllUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({});
      req.flush({ success: true, data: [] });
    });

    it('supports alias getAllInvitations', () => {
      const query = { workspaceId: 'ws-abc' };
      service.getAllInvitations(query).subscribe();

      const req = http.expectOne(getAllUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush({ success: true, data: [] });
    });

    it('allows GET fallback if method explicitly set to get', () => {
      const query = { workspaceId: 'ws-123' };
      service.getAll(query, 'get').subscribe();

      const req = http.expectOne((r) => r.url === getAllUrl && r.method === 'GET');
      expect(req.request.params.get('workspaceId')).toBe('ws-123');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ success: true, data: [] });
    });
  });
});
