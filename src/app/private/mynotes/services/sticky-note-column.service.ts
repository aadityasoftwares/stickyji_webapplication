import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class StickyNoteColumnApiService {
    private readonly http = inject(HttpClient);


    getById(id: string): Observable<any> {
        return this.http.get<any>(
            API_ENDPOINTS.stickyNoteColumns.get(id),
            {
                withCredentials: true
            }
        );
    }

    getByWorkspaceFolder(workspaceId: string, workspaceFolderId: string): Observable<any> {
        const params = new HttpParams()
            .set('workspaceId', workspaceId)
            .set('workspaceFolderId', workspaceFolderId);

        return this.http.get<any>(
            API_ENDPOINTS.stickyNoteColumns.getAll,
            {
                params,
                withCredentials: true
            }
        );
    }

    create(payload: any): Observable<any> {
        return this.http.post<any>(
            API_ENDPOINTS.stickyNoteColumns.create,
            payload,
            {
                withCredentials: true
            }
        );
    }

    update(id: string, payload: any): Observable<any> {
        return this.http.put<any>(
            API_ENDPOINTS.stickyNoteColumns.update(id),
            payload,
            {
                withCredentials: true
            }
        );
    }

    reorder(payload: any): Observable<any> {
        return this.http.put<any>(
            `${API_ENDPOINTS.stickyNoteColumns.base}/reorder`,
            payload,
            {
                withCredentials: true
            }
        );
    }

    delete(id: string): Observable<any> {
        return this.http.delete<any>(
            API_ENDPOINTS.stickyNoteColumns.delete(id),
            {
                withCredentials: true
            }
        );
    }
}
