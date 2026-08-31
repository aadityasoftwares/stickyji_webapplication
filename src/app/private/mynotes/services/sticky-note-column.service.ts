import { HttpClient, HttpParams, } from '@angular/common/http';
import { Injectable, inject, } from '@angular/core';
import type { Observable, } from 'rxjs';
import { environment, } from '../../../../Environments/environments';
import {
    StickyNoteColumnResponse,
    StickyNoteColumnsResponse,
    StickyNoteColumnCreateRequest,
    StickyNoteColumnUpdateRequest,
    StickyNoteColumnReorderRequest,
    DeleteStickyNoteColumnResponse
} from '../models/mynotes.interface';

@Injectable({
    providedIn: 'root',
})

export class StickyNoteColumnApiService {
    private readonly http = inject(HttpClient);

    private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
    private readonly columnBaseUrl = `${this.baseUrl}/stickynotescolumns`;

    getById(id: string,): Observable<StickyNoteColumnResponse> {
        return this.http.get<StickyNoteColumnResponse>(
            `${this.columnBaseUrl}/get/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    getByWorkspaceFolder(workspaceId: string, workspaceFolderId: string,): Observable<StickyNoteColumnsResponse> {
        const params = new HttpParams()
            .set('workspaceId', workspaceId,)
            .set('workspaceFolderId', workspaceFolderId,);

        return this.http.get<StickyNoteColumnsResponse>(
            `${this.columnBaseUrl}/getall`,
            {
                params,
                withCredentials: true,
            },
        );
    }

    create(payload: StickyNoteColumnCreateRequest,): Observable<StickyNoteColumnResponse> {
        return this.http.post<StickyNoteColumnResponse>(
            `${this.columnBaseUrl}/create`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    update(id: string, payload: StickyNoteColumnUpdateRequest,): Observable<StickyNoteColumnResponse> {
        return this.http.put<StickyNoteColumnResponse>(
            `${this.columnBaseUrl}/update/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    reorder(payload: StickyNoteColumnReorderRequest,): Observable<StickyNoteColumnsResponse> {
        return this.http.put<StickyNoteColumnsResponse>(
            `${this.columnBaseUrl}/reorder`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    delete(id: string,): Observable<DeleteStickyNoteColumnResponse> {
        return this.http.delete<DeleteStickyNoteColumnResponse>(
            `${this.columnBaseUrl}/delete/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }
}