import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../Environments/environments';

const WORKSPACE_FOLDER_ENDPOINTS = {
    create: '/workspacefolders/create',
    get: '/workspacefolders/get',
    getAll: '/workspacefolders/getall',
    my: '/workspacefolders/my',
    update: '/workspacefolders/update',
    status: '/workspacefolders/status',
    delete: '/workspacefolders/delete',
    restore: '/workspacefolders/restore',
} as const;

@Injectable({
    providedIn: 'root',
})
export class WorkspaceFolderService {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = environment.apiUrl.replace(/\/+$/, '');

    getAllWorkspaceFolders(query: any = {}): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}${WORKSPACE_FOLDER_ENDPOINTS.getAll}`,
            query,
            {
                withCredentials: true,
            },
        );
    }

    getMyWorkspaceFolders(query: any = {}): Observable<any> {
        const params = this.createHttpParams(query);

        return this.http.get<any>(
            `${this.apiUrl}${WORKSPACE_FOLDER_ENDPOINTS.my}`,
            {
                params,
                withCredentials: true,
            },
        );
    }

    getById(id: any = ''): Observable<any> {
        return this.http.get<any>(
            `${this.apiUrl}${WORKSPACE_FOLDER_ENDPOINTS.get}/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    create(payload: any): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}${WORKSPACE_FOLDER_ENDPOINTS.create}`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    update(id: any = '', payload: any = {}): Observable<any> {
        return this.http.put<any>(
            `${this.apiUrl}${WORKSPACE_FOLDER_ENDPOINTS.update}/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    updateStatus(id: any = '', status: any): Observable<any> {
        return this.http.put<any>(
            `${this.apiUrl}${WORKSPACE_FOLDER_ENDPOINTS.status}/${encodeURIComponent(id)}`,
            { status },
            {
                withCredentials: true,
            },
        );
    }

    delete(id: any = ''): Observable<any> {
        return this.http.delete<any>(
            `${this.apiUrl}${WORKSPACE_FOLDER_ENDPOINTS.delete}/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    restore(id: any = ''): Observable<any> {
        return this.http.put<any>(
            `${this.apiUrl}${WORKSPACE_FOLDER_ENDPOINTS.restore}/${encodeURIComponent(id)}`,
            {},
            {
                withCredentials: true,
            },
        );
    }

    private createHttpParams(query: any = {}): HttpParams {
        let params = new HttpParams();

        for (const [key, value] of Object.entries(query)) {
            if (
                value === undefined ||
                value === null ||
                value === ''
            ) {
                continue;
            }

            params = params.set(key, String(value));
        }

        return params;
    }
}