import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, reduce } from 'rxjs';
import type { ApiDataResponse as ApiResponse } from '../../../shared/interfaces/api.interface';
import type {
  PaginatedApiResponse,
  WorkspaceFolder,
  WorkspaceFolderQuery,
  WorkspaceFolderCreateRequest,
  WorkspaceFolderUpdateRequest,
  WorkspaceFolderStatus,
} from '../interfaces/workspace-folder.interface';

import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceFolderService {
  private readonly http = inject(HttpClient);

  // Navigation needs all active folders, independently of the explorer's current page.
  getFolderOptions(workspaceId: string): Observable<WorkspaceFolder[]> {
    const query: WorkspaceFolderQuery = {
      workspaceId,
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      sortBy: 'position',
      sortOrder: 'asc',
    };
    return this.getAllWorkspaceFolders(query).pipe(
      expand((response) => {
        const meta = response.meta;
        return meta && meta.page < (meta.totalPages ?? Math.ceil(meta.total / meta.limit))
          ? this.getAllWorkspaceFolders({ ...query, page: meta.page + 1 })
          : EMPTY;
      }),
      reduce((folders, response) => [...folders, ...response.data], [] as WorkspaceFolder[]),
    );
  }

  getAllWorkspaceFolders(
    query: WorkspaceFolderQuery = {},
  ): Observable<PaginatedApiResponse<WorkspaceFolder>> {
    return this.http.post<PaginatedApiResponse<WorkspaceFolder>>(
      API_ENDPOINTS.workspaceFolders.getAll,
      query,
      {
        withCredentials: true,
      },
    );
  }

  getMyWorkspaceFolders(
    query: WorkspaceFolderQuery = {},
  ): Observable<PaginatedApiResponse<WorkspaceFolder>> {
    const params = buildHttpParams(query);

    return this.http.get<PaginatedApiResponse<WorkspaceFolder>>(API_ENDPOINTS.workspaceFolders.my, {
      params,
      withCredentials: true,
    });
  }

  getById(id: string = ''): Observable<ApiResponse<WorkspaceFolder>> {
    return this.http.get<ApiResponse<WorkspaceFolder>>(
      API_ENDPOINTS.workspaceFolders.get(String(id)),
      {
        withCredentials: true,
      },
    );
  }

  create(payload: WorkspaceFolderCreateRequest): Observable<ApiResponse<WorkspaceFolder>> {
    return this.http.post<ApiResponse<WorkspaceFolder>>(
      API_ENDPOINTS.workspaceFolders.create,
      payload,
      {
        withCredentials: true,
      },
    );
  }

  update(
    id: string = '',
    payload: WorkspaceFolderUpdateRequest = {},
  ): Observable<ApiResponse<WorkspaceFolder>> {
    return this.http.put<ApiResponse<WorkspaceFolder>>(
      API_ENDPOINTS.workspaceFolders.update(String(id)),
      payload,
      {
        withCredentials: true,
      },
    );
  }

  updateStatus(
    id: string = '',
    status: Exclude<WorkspaceFolderStatus, 'DELETED'>,
  ): Observable<ApiResponse<WorkspaceFolder>> {
    return this.http.put<ApiResponse<WorkspaceFolder>>(
      API_ENDPOINTS.workspaceFolders.status(String(id)),
      { status },
      {
        withCredentials: true,
      },
    );
  }

  delete(id: string = ''): Observable<ApiResponse<WorkspaceFolder>> {
    return this.http.delete<ApiResponse<WorkspaceFolder>>(
      API_ENDPOINTS.workspaceFolders.delete(String(id)),
      {
        withCredentials: true,
      },
    );
  }

  restore(id: string = ''): Observable<ApiResponse<WorkspaceFolder>> {
    return this.http.put<ApiResponse<WorkspaceFolder>>(
      API_ENDPOINTS.workspaceFolders.restore(String(id)),
      {},
      {
        withCredentials: true,
      },
    );
  }

  permanentlyDelete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${API_ENDPOINTS.workspaceFolders.base}/permanent/${encodeURIComponent(id)}`,
      { withCredentials: true },
    );
  }
}
