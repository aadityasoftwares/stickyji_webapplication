import {
    HttpClient,
} from '@angular/common/http';
import {
    Injectable,
    inject
} from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';
import type {
    ApiResponse,
    PaginatedApiResponse,
    WorkspaceInvitation,
    WorkspaceInvitationBatchCreateRequest,
    WorkspaceInvitationBatchCreateResult,
    WorkspaceInvitationQuery,
    WorkspaceInvitationSingleCreateRequest,
    WorkspaceInvitationUpdateRequest
} from '../models/workspace-invitation.models';

@Injectable({
    providedIn: 'root'
})
export class WorkspaceInvitationApiService {
    private readonly http = inject(HttpClient);

    private readonly baseUrl =
        API_BASE_URL;

    /**
     * Keep this path equal to the prefix used when
     * workspaceMemberInvitationRoutes is mounted in Express.
     */
    private readonly invitationBaseUrl =
        `${this.baseUrl}/workspacememberinvitations`;

    private readonly createUrl =
        `${this.invitationBaseUrl}/create`;

    private readonly getUrl =
        `${this.invitationBaseUrl}/get`;

    private readonly getAllUrl =
        `${this.invitationBaseUrl}/getall`;

    private readonly updateUrl =
        `${this.invitationBaseUrl}/update`;

    private readonly cancelUrl =
        `${this.invitationBaseUrl}/cancel`;

    createBatch(
        payload: WorkspaceInvitationBatchCreateRequest
    ): Observable<
        ApiResponse<WorkspaceInvitationBatchCreateResult>
    > {
        return this.http.post<
            ApiResponse<WorkspaceInvitationBatchCreateResult>
        >(
            this.createUrl,
            payload,
            {
                withCredentials: true
            }
        );
    }

    /**
     * Legacy single-recipient create remains available because
     * the backend still supports it.
     */
    create(
        payload: WorkspaceInvitationSingleCreateRequest
    ): Observable<ApiResponse<WorkspaceInvitation>> {
        return this.http.post<
            ApiResponse<WorkspaceInvitation>
        >(
            this.createUrl,
            payload,
            {
                withCredentials: true
            }
        );
    }

    getById(
        id: string
    ): Observable<ApiResponse<WorkspaceInvitation>> {
        return this.http.get<
            ApiResponse<WorkspaceInvitation>
        >(
            `${this.getUrl}/${encodeURIComponent(id)}`,
            {
                withCredentials: true
            }
        );
    }

    getAll(
        query: WorkspaceInvitationQuery = {}
    ): Observable<
        PaginatedApiResponse<WorkspaceInvitation>
    > {
        return this.http.get<
            PaginatedApiResponse<WorkspaceInvitation>
        >(
            this.getAllUrl,
            {
                params:
                    buildHttpParams(query),
                withCredentials: true
            }
        );
    }

    update(
        id: string,
        payload: WorkspaceInvitationUpdateRequest
    ): Observable<ApiResponse<WorkspaceInvitation>> {
        return this.http.put<
            ApiResponse<WorkspaceInvitation>
        >(
            `${this.updateUrl}/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true
            }
        );
    }

    cancel(
        id: string
    ): Observable<ApiResponse<WorkspaceInvitation>> {
        return this.http.put<
            ApiResponse<WorkspaceInvitation>
        >(
            `${this.cancelUrl}/${encodeURIComponent(id)}`,
            {},
            {
                withCredentials: true
            }
        );
    }

}
