import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constants';
import { extractList } from '../../../shared/functions/common.function';
import {
    WorkspaceRole,
    WorkspaceRoleListResponse,
    WorkspaceRoleQuery
} from '../models/workspace-role.models';

@Injectable({ providedIn: 'root' })
export class WorkspaceRoleApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = API_BASE_URL;
    private readonly getAllUrl = `${this.baseUrl}/roles/getall`;

    getWorkspaceRoles(workspaceId: string): Observable<WorkspaceRole[]> {
        const query: WorkspaceRoleQuery = {
            workspaceId,
            scope: 'WORKSPACE',
            isActive: true,
            page: 1,
            limit: 100,
            sortBy: 'priority',
            sortOrder: 'desc'
        };

        return this.http
            .post<WorkspaceRoleListResponse>(this.getAllUrl, query, {
                withCredentials: true
            })
            .pipe(map(response => this.extractRoles(response)));
    }

    private extractRoles(response: WorkspaceRoleListResponse): WorkspaceRole[] {
        if (response?.success === false) throw new Error(response.message || 'Unable to load workspace roles.');
        return extractList<WorkspaceRole>(response);
    }

}
