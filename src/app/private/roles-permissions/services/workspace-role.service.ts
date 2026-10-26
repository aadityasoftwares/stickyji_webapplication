import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';
import type { ApiResult as ApiResponse } from '../../../shared/interfaces/api.interface';
import type {
  WorkspaceRole,
  WorkspaceRoleCollection,
  WorkspaceRoleCreateRequest,
  WorkspaceRoleListResponse,
  WorkspaceRoleQuery,
  WorkspaceRoleUpdateRequest,
} from '../interfaces/workspace-role.interface';

@Injectable({ providedIn: 'root' })
export class WorkspaceRoleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  /**
   * Change only this prefix if your Express role router is mounted elsewhere.
   */
  private readonly roleBaseUrl = `${this.baseUrl}/roles`;
  private readonly createUrl = `${this.roleBaseUrl}/create`;
  private readonly getAllUrl = `${this.roleBaseUrl}/getall`;
  private readonly getUrl = `${this.roleBaseUrl}/get`;
  private readonly updateUrl = `${this.roleBaseUrl}/update`;
  private readonly deleteUrl = `${this.roleBaseUrl}/delete`;

  getAll(query: WorkspaceRoleQuery = {}): Observable<WorkspaceRoleListResponse> {
    return this.http.post<WorkspaceRoleListResponse>(this.getAllUrl, query, {
      withCredentials: true,
    });
  }

  /**
   * Kept intentionally because your workspace-member invitation side panel
   * already calls this method.
   */
  getWorkspaceRoles(workspaceId: string): Observable<WorkspaceRole[]> {
    return this.getAll({
      workspaceId,
      page: 1,
      limit: 100,
      scope: 'WORKSPACE',
      sortBy: 'priority',
      sortOrder: 'desc',
    }).pipe(
      map((response) =>
        this.extractRoles(response).filter((role) => role && typeof role === 'object'),
      ),
    );
  }

  getById(id: string): Observable<ApiResponse<WorkspaceRole>> {
    return this.http.get<ApiResponse<WorkspaceRole>>(`${this.getUrl}/${encodeURIComponent(id)}`, {
      withCredentials: true,
    });
  }

  getByCode(code: string, workspaceId?: string): Observable<ApiResponse<WorkspaceRole>> {
    const params = buildHttpParams(workspaceId ? { workspaceId } : {});
    return this.http.get<ApiResponse<WorkspaceRole>>(
      `${this.getUrl}/code/${encodeURIComponent(code)}`,
      { params, withCredentials: true },
    );
  }

  create(payload: WorkspaceRoleCreateRequest): Observable<ApiResponse<WorkspaceRole>> {
    return this.http
      .post<ApiResponse<WorkspaceRole>>(this.createUrl, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => this.requireRole(response)));
  }

  update(id: string, payload: WorkspaceRoleUpdateRequest): Observable<ApiResponse<WorkspaceRole>> {
    return this.http
      .put<ApiResponse<WorkspaceRole>>(`${this.updateUrl}/${encodeURIComponent(id)}`, payload, {
        withCredentials: true,
      })
      .pipe(map((response) => this.requireRole(response)));
  }

  changeStatus(id: string, isActive: boolean): Observable<ApiResponse<WorkspaceRole>> {
    return this.http
      .patch<ApiResponse<WorkspaceRole>>(
        `${this.updateUrl}/${encodeURIComponent(id)}/status`,
        { isActive },
        { withCredentials: true },
      )
      .pipe(map((response) => this.requireRole(response)));
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.deleteUrl}/${encodeURIComponent(id)}`, {
      withCredentials: true,
    });
  }

  private requireRole(response: ApiResponse<WorkspaceRole>): ApiResponse<WorkspaceRole> {
    if (!response?.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
      throw new Error(
        response?.message ||
          'The server returned an invalid role. Refresh roles before trying again.',
      );
    }
    return response;
  }

  private extractRoles(response: WorkspaceRoleListResponse): readonly WorkspaceRole[] {
    const data = response?.data as
      readonly WorkspaceRole[] | WorkspaceRoleCollection | null | undefined;

    if (Array.isArray(data)) return data as readonly WorkspaceRole[];
    if (!data || typeof data !== 'object') return [];

    const collection = data as WorkspaceRoleCollection;
    const candidates = [
      collection.data,
      collection.items,
      collection.roles,
      collection.docs,
      collection.results,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as readonly WorkspaceRole[];
    }

    return [];
  }
}
