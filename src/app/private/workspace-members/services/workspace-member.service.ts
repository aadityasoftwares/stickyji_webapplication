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
    WorkspaceMember,
    WorkspaceMemberAssignRoleRequest,
    WorkspaceMemberCreateRequest,
    WorkspaceMemberListItem,
    WorkspaceMemberQuery,
    WorkspaceMemberUpdateRequest
} from '../models/workspace-member.models';

@Injectable({
    providedIn: 'root'
})
export class WorkspaceMemberApiService {
    private readonly http = inject(HttpClient);

    private readonly baseUrl =
        API_BASE_URL;

    private readonly workspaceMemberBaseUrl =
        `${this.baseUrl}/workspacemembers`;

    private readonly createUrl =
        `${this.workspaceMemberBaseUrl}/create`;

    private readonly getUrl =
        `${this.workspaceMemberBaseUrl}/get`;

    private readonly getAllUrl =
        `${this.workspaceMemberBaseUrl}/getall`;

    private readonly updateUrl =
        `${this.workspaceMemberBaseUrl}/update`;

    private readonly roleUrl =
        `${this.workspaceMemberBaseUrl}/role`;

    private readonly deleteUrl =
        `${this.workspaceMemberBaseUrl}/delete`;

    private readonly restoreUrl =
        `${this.workspaceMemberBaseUrl}/restore`;

    /**
     * Lightweight people-table endpoint.
     *
     * Response shape:
     * {
     *   success,
     *   message,
     *   data: WorkspaceMemberListItem[],
     *   meta: { page, limit, total, totalPages }
     * }
     */
    getAll(
        query: WorkspaceMemberQuery
    ): Observable<
        PaginatedApiResponse<WorkspaceMemberListItem>
    > {
        return this.http.get<
            PaginatedApiResponse<WorkspaceMemberListItem>
        >(
            this.getAllUrl,
            {
                params: buildHttpParams(query),
                withCredentials: true
            }
        );
    }

    getById(
        id: string
    ): Observable<ApiResponse<WorkspaceMember>> {
        return this.http.get<
            ApiResponse<WorkspaceMember>
        >(
            `${this.getUrl}/${encodeURIComponent(id)}`,
            {
                withCredentials: true
            }
        );
    }

    create(
        payload: WorkspaceMemberCreateRequest
    ): Observable<ApiResponse<WorkspaceMember>> {
        return this.http.post<
            ApiResponse<WorkspaceMember>
        >(
            this.createUrl,
            payload,
            {
                withCredentials: true
            }
        );
    }

    update(
        id: string,
        payload: WorkspaceMemberUpdateRequest
    ): Observable<ApiResponse<WorkspaceMember>> {
        return this.http.put<
            ApiResponse<WorkspaceMember>
        >(
            `${this.updateUrl}/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true
            }
        );
    }

    assignRole(
        id: string,
        roleId: string
    ): Observable<ApiResponse<WorkspaceMember>> {
        const payload:
            WorkspaceMemberAssignRoleRequest = {
            roleId
        };

        return this.http.put<
            ApiResponse<WorkspaceMember>
        >(
            `${this.roleUrl}/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true
            }
        );
    }

    remove(
        id: string
    ): Observable<ApiResponse<null>> {
        return this.http.delete<
            ApiResponse<null>
        >(
            `${this.deleteUrl}/${encodeURIComponent(id)}`,
            {
                withCredentials: true
            }
        );
    }

    restore(
        id: string
    ): Observable<ApiResponse<WorkspaceMember>> {
        return this.http.put<
            ApiResponse<WorkspaceMember>
        >(
            `${this.restoreUrl}/${encodeURIComponent(id)}`,
            {},
            {
                withCredentials: true
            }
        );
    }

}
