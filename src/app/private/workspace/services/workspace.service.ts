import { HttpClient, HttpParams, } from '@angular/common/http';
import { Injectable, inject, } from '@angular/core';
import { Observable, } from 'rxjs';
import { environment } from '../../../../Environments/environments';

import {
    ApiResponse,
    MyWorkspaceQuery,
    PaginatedApiResponse,
    Workspace,
    WorkspaceCreateRequest,
    WorkspaceStatus,
    WorkspaceUpdateRequest,
} from '../models/workspace.models';

@Injectable({
    providedIn: 'root',
})

export class WorkspaceApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
    private readonly workspaceBaseUrl = `${this.baseUrl}/workspaces`;
    private readonly createWorkspaceUrl = `${this.workspaceBaseUrl}/create`;
    private readonly getWorkspaceUrl = `${this.workspaceBaseUrl}/get`;
    private readonly getMyWorkspacesUrl = `${this.workspaceBaseUrl}/my`;
    private readonly updateWorkspaceUrl = `${this.workspaceBaseUrl}/update`;
    private readonly updateWorkspaceStatusUrl = `${this.workspaceBaseUrl}/status`;
    private readonly deleteWorkspaceUrl = `${this.workspaceBaseUrl}/delete`;
    private readonly restoreWorkspaceUrl = `${this.workspaceBaseUrl}/restore`;

    getMyWorkspaces(query: MyWorkspaceQuery = {},): Observable<PaginatedApiResponse<Workspace>> {

        const params = this.createHttpParams(query);

        return this.http.get<PaginatedApiResponse<Workspace>>(
            this.getMyWorkspacesUrl,
            {
                params,
                withCredentials: true,
            },
        );
    }

    getById(id: string,): Observable<ApiResponse<Workspace>> {
        return this.http.get<ApiResponse<Workspace>>(
            `${this.getWorkspaceUrl}/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    create(payload: WorkspaceCreateRequest,): Observable<ApiResponse<Workspace>> {
        return this.http.post<ApiResponse<Workspace>>(
            this.createWorkspaceUrl,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    update(id: string, payload: WorkspaceUpdateRequest,): Observable<ApiResponse<Workspace>> {
        return this.http.put<ApiResponse<Workspace>>(
            `${this.updateWorkspaceUrl}/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    updateStatus(id: string, status: WorkspaceStatus,): Observable<ApiResponse<Workspace>> {
        return this.http.put<ApiResponse<Workspace>>(
            `${this.updateWorkspaceStatusUrl}/${encodeURIComponent(id)}`,
            {
                status,
            },
            {
                withCredentials: true,
            },
        );
    }

    delete(id: string,): Observable<ApiResponse<null>> {
        return this.http.delete<ApiResponse<null>>(
            `${this.deleteWorkspaceUrl}/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    restore(id: string,): Observable<ApiResponse<Workspace>> {
        return this.http.put<ApiResponse<Workspace>>(
            `${this.restoreWorkspaceUrl}/${encodeURIComponent(id)}`,
            {},
            {
                withCredentials: true,
            },
        );
    }

    private createHttpParams(query: MyWorkspaceQuery,): HttpParams {
        let params = new HttpParams();

        for (const [key, value] of Object.entries(query)) {
            if (value === undefined || value === null || value === '') {
                continue;
            }
            params = params.set(key, String(value),);
        }

        return params;
    }
}