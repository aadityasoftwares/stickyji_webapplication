import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../Environments/environments';
import { WorkspaceFolderQuery, PaginatedApiResponse, WorkspaceFolder, ApiResponse, WorkspaceFolderCreateRequest, WorkspaceFolderUpdateRequest, WorkspaceFolderStatus } from '../models/workspace-folder.models';


@Injectable({
    providedIn: 'root',
})
export class WorkspaceFolderApiService {
    private readonly http = inject(HttpClient);

    private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
    private readonly workspaceFolderBaseUrl = `${this.baseUrl}/workspacefolders`;
    private readonly createWorkspaceFolderUrl = `${this.workspaceFolderBaseUrl}/create`;
    private readonly getWorkspaceFolderUrl = `${this.workspaceFolderBaseUrl}/get`;
    private readonly getWorkspaceFoldersByWorkspaceUrl = `${this.workspaceFolderBaseUrl}/workspace`;
    private readonly updateWorkspaceFolderUrl = `${this.workspaceFolderBaseUrl}/update`;
    private readonly updateWorkspaceFolderStatusUrl = `${this.workspaceFolderBaseUrl}/status`;
    private readonly deleteWorkspaceFolderUrl = `${this.workspaceFolderBaseUrl}/delete`;
    private readonly restoreWorkspaceFolderUrl = `${this.workspaceFolderBaseUrl}/restore`;

    getByWorkspace(workspaceId: string, query: WorkspaceFolderQuery = {},): Observable<PaginatedApiResponse<WorkspaceFolder>> {
        const params = this.createHttpParams(query);

        return this.http.get<PaginatedApiResponse<WorkspaceFolder>>(
            `${this.getWorkspaceFoldersByWorkspaceUrl}/${encodeURIComponent(workspaceId)}`,
            {
                params,
                withCredentials: true,
            },
        );
    }

    getById(id: string): Observable<ApiResponse<WorkspaceFolder>> {
        return this.http.get<ApiResponse<WorkspaceFolder>>(
            `${this.getWorkspaceFolderUrl}/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    create(
        payload: WorkspaceFolderCreateRequest,
    ): Observable<ApiResponse<WorkspaceFolder>> {
        return this.http.post<ApiResponse<WorkspaceFolder>>(
            this.createWorkspaceFolderUrl,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    update(
        id: string,
        payload: WorkspaceFolderUpdateRequest,
    ): Observable<ApiResponse<WorkspaceFolder>> {
        return this.http.put<ApiResponse<WorkspaceFolder>>(
            `${this.updateWorkspaceFolderUrl}/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    updateStatus(
        id: string,
        status: WorkspaceFolderStatus,
    ): Observable<ApiResponse<WorkspaceFolder>> {
        return this.http.put<ApiResponse<WorkspaceFolder>>(
            `${this.updateWorkspaceFolderStatusUrl}/${encodeURIComponent(id)}`,
            { status },
            {
                withCredentials: true,
            },
        );
    }

    delete(id: string): Observable<ApiResponse<null>> {
        return this.http.delete<ApiResponse<null>>(
            `${this.deleteWorkspaceFolderUrl}/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    restore(id: string): Observable<ApiResponse<WorkspaceFolder>> {
        return this.http.put<ApiResponse<WorkspaceFolder>>(
            `${this.restoreWorkspaceFolderUrl}/${encodeURIComponent(id)}`,
            {},
            {
                withCredentials: true,
            },
        );
    }

    private createHttpParams(query: WorkspaceFolderQuery): HttpParams {
        let params = new HttpParams();

        for (const [key, value] of Object.entries(query)) {
            if (value === undefined || value === null || value === '') {
                continue;
            }

            params = params.set(key, String(value));
        }

        return params;
    }
}
