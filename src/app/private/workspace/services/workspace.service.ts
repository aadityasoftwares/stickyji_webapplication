import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../Environments/environments';

const WORKSPACE_ENDPOINTS = {
    create: '/workspaces/create',
    get: '/workspaces/get',
    getAll: '/workspaces/getall',
    my: '/workspaces/my',
    update: '/workspaces/update',
    status: '/workspaces/status',
    delete: '/workspaces/delete',
    restore: '/workspaces/restore',
} as const;

@Injectable({
    providedIn: 'root',
})
export class WorkspaceService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl.replace(/\/+$/, '');

    getAllWorkspaces(query: any = {}): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}${WORKSPACE_ENDPOINTS.getAll}`,
            query,
            {
                withCredentials: true,
            },
        );
    }

    getMyWorkspaces(query: any = {}): Observable<any> {
        const params = this.createHttpParams(query);

        return this.http.get<any>(
            `${this.apiUrl}${WORKSPACE_ENDPOINTS.my}`,
            {
                params,
                withCredentials: true,
            },
        );
    }

    getById(id: any = ''): Observable<any> {
        return this.http.get<any>(
            `${this.apiUrl}${WORKSPACE_ENDPOINTS.get}/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    create(payload: any): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}${WORKSPACE_ENDPOINTS.create}`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    update(id: any = '', payload: any = {}): Observable<any> {
        return this.http.put<any>(
            `${this.apiUrl}${WORKSPACE_ENDPOINTS.update}/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    updateStatus(id: any = '', status: any): Observable<any> {
        return this.http.put<any>(
            `${this.apiUrl}${WORKSPACE_ENDPOINTS.status}/${encodeURIComponent(id)}`,
            { status },
            {
                withCredentials: true,
            },
        );
    }

    delete(id: any = ''): Observable<any> {
        return this.http.delete<any>(
            `${this.apiUrl}${WORKSPACE_ENDPOINTS.delete}/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    restore(id: any = ''): Observable<any> {
        return this.http.put<any>(
            `${this.apiUrl}${WORKSPACE_ENDPOINTS.restore}/${encodeURIComponent(id)}`,
            {},
            {
                withCredentials: true,
            },
        );
    }

    private createHttpParams(query: any = {}): HttpParams {
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