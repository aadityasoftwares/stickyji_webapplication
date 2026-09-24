import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../Environments/environments';
import {
    WorkspaceRole,
    WorkspaceRoleListResponse,
    WorkspaceRoleQuery
} from '../models/workspace-role.models';

@Injectable({ providedIn: 'root' })
export class WorkspaceRoleApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
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
            .get<WorkspaceRoleListResponse>(this.getAllUrl, {
                params: this.createHttpParams(query),
                withCredentials: true
            })
            .pipe(map(response => this.extractRoles(response)));
    }

    private extractRoles(response: WorkspaceRoleListResponse): WorkspaceRole[] {
        if (Array.isArray(response.data)) return response.data;
        if (response.data && Array.isArray(response.data.data)) return response.data.data;
        return [];
    }

    private createHttpParams(query: WorkspaceRoleQuery): HttpParams {
        let params = new HttpParams();

        for (const [key, value] of Object.entries(query)) {
            if (value === undefined || value === null || value === '') continue;
            params = params.set(key, String(value));
        }

        return params;
    }
}
