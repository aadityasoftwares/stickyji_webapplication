import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../../Environments/environments';

@Injectable({
    providedIn: 'root'
})
export class StickyNoteColumnApiService {
    private readonly http = inject(HttpClient);

    private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
    private readonly columnBaseUrl = `${this.baseUrl}/stickynotescolumns`;

    getById(id: string): Observable<any> {
        return this.http.get<any>(
            `${this.columnBaseUrl}/get/${encodeURIComponent(id)}`,
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
            `${this.columnBaseUrl}/getall`,
            {
                params,
                withCredentials: true
            }
        );
    }

    create(payload: any): Observable<any> {
        return this.http.post<any>(
            `${this.columnBaseUrl}/create`,
            payload,
            {
                withCredentials: true
            }
        );
    }

    update(id: string, payload: any): Observable<any> {
        return this.http.put<any>(
            `${this.columnBaseUrl}/update/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true
            }
        );
    }

    reorder(payload: any): Observable<any> {
        return this.http.put<any>(
            `${this.columnBaseUrl}/reorder`,
            payload,
            {
                withCredentials: true
            }
        );
    }

    delete(id: string): Observable<any> {
        return this.http.delete<any>(
            `${this.columnBaseUrl}/delete/${encodeURIComponent(id)}`,
            {
                withCredentials: true
            }
        );
    }
}