import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../shared/constants/api.constants';

export interface WorkspaceInvitationWorkspacePreview {
  id: string;
  name: string;
  slug?: string;
}

export interface WorkspaceInvitationRolePreview {
  id: string;
  name: string;
  displayName?: string;
  code?: string;
}

export interface WorkspaceInvitationInviterPreview {
  id?: string;
  name: string;
  email?: string;
}

export interface WorkspaceInvitationPreview {
  invitationId: string;
  email: string;

  /**
   * true  -> invited email already belongs to an account.
   * false -> invitation page should show registration fields.
   */
  userExists: boolean;

  workspace: WorkspaceInvitationWorkspacePreview;
  role: WorkspaceInvitationRolePreview;
  invitedBy: WorkspaceInvitationInviterPreview;
  message?: string | null;
  expiresAt: string | Date;
}

export interface WorkspaceInvitationAcceptResult {
  invitationId: string;
  workspaceId: string;
  workspaceName: string;
  memberId?: string;
  roleName?: string;
  acceptedAt?: string | Date;
}

export interface WorkspaceInvitationApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceInvitationPublicService {
  private readonly http = inject(HttpClient);

  /**
   * PUBLIC endpoint.
   *
   * Used before login/signup to validate the invitation and return only
   * the safe preview required by the invitation screen.
   */
  validateToken(
    token: string,
  ): Observable<WorkspaceInvitationApiResponse<WorkspaceInvitationPreview>> {
    return this.http.post<WorkspaceInvitationApiResponse<WorkspaceInvitationPreview>>(
      API_ENDPOINTS.workspaceInvitations.validateToken,
      {
        token: token.trim(),
      },
      {
        withCredentials: true,
      },
    );
  }

  /**
   * AUTHENTICATED endpoint.
   *
   * accessToken is optional because your normal auth interceptor can attach it.
   * Passing the fresh token immediately after login/register avoids a timing
   * race between the auth response and the global session/interceptor state.
   */
  accept(
    token: string,
    accessToken?: string,
  ): Observable<WorkspaceInvitationApiResponse<WorkspaceInvitationAcceptResult>> {
    const normalizedAccessToken = accessToken?.trim() || '';

    const headers = normalizedAccessToken
      ? new HttpHeaders({
          Authorization: `Bearer ${normalizedAccessToken}`,
        })
      : undefined;

    return this.http.post<WorkspaceInvitationApiResponse<WorkspaceInvitationAcceptResult>>(
      API_ENDPOINTS.workspaceInvitations.accept,
      {
        token: token.trim(),
      },
      {
        withCredentials: true,
        ...(headers ? { headers } : {}),
      },
    );
  }
}
