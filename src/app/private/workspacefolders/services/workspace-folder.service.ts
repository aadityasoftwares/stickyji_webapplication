import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { WorkspaceDropdownStore } from '../../workspace/services/workspace-dropdown.store';
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
  private readonly dropdownStore = inject(WorkspaceDropdownStore);

  // All selectors use the same accessible workspace/folder tree as Today.
  getFolderOptions(workspaceId: string, force = false): Observable<WorkspaceFolder[]> {
    return this.dropdownStore.load(undefined, force).pipe(
      map((items) => {
        if (items === null) throw new Error(this.dropdownStore.error() || 'Unable to load folders.');
        return (items.find((workspace) => workspace.id === workspaceId)?.folders ?? []).map(
          (folder, position) => ({
            ...folder, workspaceId, position, status: 'ACTIVE' as const,
            slug: '', isDefault: false, createdAt: '', updatedAt: '',
          }),
        );
      }),
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
