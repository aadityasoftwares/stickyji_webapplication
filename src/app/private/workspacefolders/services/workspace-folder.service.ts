import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';

@Injectable({
    providedIn: 'root',
})
export class WorkspaceFolderService {
    private readonly http = inject(HttpClient);


    getAllWorkspaceFolders(query: any = {}): Observable<any> {
        return this.http.post<any>(
            API_ENDPOINTS.workspaceFolders.getAll,
            query,
            {
                withCredentials: true,
            },
        );
    }

    getMyWorkspaceFolders(query: any = {}): Observable<any> {
        const params = buildHttpParams(query);

        return this.http.get<any>(
            API_ENDPOINTS.workspaceFolders.my,
            {
                params,
                withCredentials: true,
            },
        );
    }

    getById(id: any = ''): Observable<any> {
        return this.http.get<any>(
            API_ENDPOINTS.workspaceFolders.get(String(id)),
            {
                withCredentials: true,
            },
        );
    }

    create(payload: any): Observable<any> {
        return this.http.post<any>(
            API_ENDPOINTS.workspaceFolders.create,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    update(id: any = '', payload: any = {}): Observable<any> {
        return this.http.put<any>(
            API_ENDPOINTS.workspaceFolders.update(String(id)),
            payload,
            {
                withCredentials: true,
            },
        );
    }

    updateStatus(id: any = '', status: any): Observable<any> {
        return this.http.put<any>(
            API_ENDPOINTS.workspaceFolders.status(String(id)),
            { status },
            {
                withCredentials: true,
            },
        );
    }

    delete(id: any = ''): Observable<any> {
        return this.http.delete<any>(
            API_ENDPOINTS.workspaceFolders.delete(String(id)),
            {
                withCredentials: true,
            },
        );
    }

    restore(id: any = ''): Observable<any> {
        return this.http.put<any>(
            API_ENDPOINTS.workspaceFolders.restore(String(id)),
            {},
            {
                withCredentials: true,
            },
        );
    }

}
