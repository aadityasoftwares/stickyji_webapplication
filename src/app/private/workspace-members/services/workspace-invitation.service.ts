import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL, API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';
import type {
  ApiResult as ApiResponse,
  PaginatedResult as PaginatedApiResponse,
} from '../../../shared/interfaces/api.interface';
import type {
  WorkspaceInvitation,
  WorkspaceInvitationBatchCreateRequest,
  WorkspaceInvitationBatchCreateResult,
  WorkspaceInvitationQuery,
  WorkspaceInvitationSingleCreateRequest,
  WorkspaceInvitationUpdateRequest,
} from '../interfaces/workspace-invitation.interface';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceInvitationApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = API_BASE_URL;

  /**
   * Keep this path equal to the prefix used when
   * workspaceMemberInvitationRoutes is mounted in Express.
   */
  private readonly invitationBaseUrl = `${this.baseUrl}/workspacememberinvitations`;

  private readonly createUrl = `${this.invitationBaseUrl}/create`;

  private readonly getUrl = `${this.invitationBaseUrl}/get`;

  private readonly getAllUrl =
    API_ENDPOINTS?.workspaceInvitations?.getAll || `${this.invitationBaseUrl}/getall`;

  private readonly updateUrl = `${this.invitationBaseUrl}/update`;

  private readonly cancelUrl = `${this.invitationBaseUrl}/cancel`;

  createBatch(
    payload: WorkspaceInvitationBatchCreateRequest,
  ): Observable<ApiResponse<WorkspaceInvitationBatchCreateResult>> {
    return this.http.post<ApiResponse<WorkspaceInvitationBatchCreateResult>>(
      this.createUrl,
      payload,
      {
        withCredentials: true,
      },
    );
  }

  /**
   * Legacy single-recipient create remains available because
   * the backend still supports it.
   */
  create(
    payload: WorkspaceInvitationSingleCreateRequest,
  ): Observable<ApiResponse<WorkspaceInvitation>> {
    return this.http.post<ApiResponse<WorkspaceInvitation>>(this.createUrl, payload, {
      withCredentials: true,
    });
  }

  getById(id: string): Observable<ApiResponse<WorkspaceInvitation>> {
    return this.http.get<ApiResponse<WorkspaceInvitation>>(
      `${this.getUrl}/${encodeURIComponent(id)}`,
      {
        withCredentials: true,
      },
    );
  }

  /**
   * Get all workspace member invitations.
   * Calls POST /api/v1/workspacememberinvitations/getall matching the workspace getAll pattern.
   * Supports optional method override if needed.
   */
  getAll(
    query: WorkspaceInvitationQuery = {},
    method: 'post' | 'get' = 'post',
  ): Observable<PaginatedApiResponse<WorkspaceInvitation>> {
    if (method === 'get') {
      return this.http.get<PaginatedApiResponse<WorkspaceInvitation>>(this.getAllUrl, {
        params: buildHttpParams(query),
        withCredentials: true,
      });
    }

    return this.http.post<PaginatedApiResponse<WorkspaceInvitation>>(this.getAllUrl, query, {
      withCredentials: true,
    });
  }

  getAllInvitations(
    query: WorkspaceInvitationQuery = {},
    method: 'post' | 'get' = 'post',
  ): Observable<PaginatedApiResponse<WorkspaceInvitation>> {
    return this.getAll(query, method);
  }

  update(
    id: string,
    payload: WorkspaceInvitationUpdateRequest,
  ): Observable<ApiResponse<WorkspaceInvitation>> {
    return this.http.put<ApiResponse<WorkspaceInvitation>>(
      `${this.updateUrl}/${encodeURIComponent(id)}`,
      payload,
      {
        withCredentials: true,
      },
    );
  }

  cancel(id: string): Observable<ApiResponse<WorkspaceInvitation>> {
    return this.http.put<ApiResponse<WorkspaceInvitation>>(
      `${this.cancelUrl}/${encodeURIComponent(id)}`,
      {},
      {
        withCredentials: true,
      },
    );
  }
}
