import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../../Environments/environments';
import type {
    DeleteStickyNoteResponse,
    StickyNoteCreateRequest,
    StickyNoteFilters,
    StickyNoteResponse,
    StickyNotesResponse,
    StickyNoteStatus,
    StickyNoteUpdateRequest
} from '../models/mynotes.interface';

@Injectable({
    providedIn: 'root'
})
export class StickyNoteApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
    private readonly stickyNoteBaseUrl = `${this.baseUrl}/stickynotes`;

    getById(id: string): Observable<StickyNoteResponse> {
        return this.http.get<StickyNoteResponse>(
            `${this.stickyNoteBaseUrl}/get/${encodeURIComponent(id)}`,
            { withCredentials: true }
        );
    }

    getAll(filters: any): Observable<any> {
        return this.http.get<any>(`${this.stickyNoteBaseUrl}/getall`, {
            params: this.buildParams(filters),
            withCredentials: true
        });
    }

    getByWorkspace(
        workspaceId: string,
        filters: Omit<StickyNoteFilters, 'workspaceId'> = {}
    ): Observable<StickyNotesResponse> {
        return this.getAll({
            ...filters,
            workspaceId
        });
    }

    getByWorkspaceFolder(
        workspaceId: string,
        workspaceFolderId: string,
        filters: Omit<StickyNoteFilters, 'workspaceId' | 'workspaceFolderId'> = {}
    ): Observable<StickyNotesResponse> {
        return this.getAll({
            ...filters,
            workspaceId,
            workspaceFolderId
        });
    }

    getByColumn(
        workspaceId: string,
        workspaceFolderId: string,
        columnId: string,
        filters: Omit<
            StickyNoteFilters,
            'workspaceId' | 'workspaceFolderId' | 'columnId'
        > = {}
    ): Observable<StickyNotesResponse> {
        return this.getAll({
            ...filters,
            workspaceId,
            workspaceFolderId,
            columnId
        });
    }

    create(payload: StickyNoteCreateRequest): Observable<StickyNoteResponse> {
        return this.http.post<StickyNoteResponse>(
            `${this.stickyNoteBaseUrl}/create`,
            payload,
            { withCredentials: true }
        );
    }

    update(
        id: string,
        payload: StickyNoteUpdateRequest
    ): Observable<StickyNoteResponse> {
        return this.http.put<StickyNoteResponse>(
            `${this.stickyNoteBaseUrl}/update/${encodeURIComponent(id)}`,
            payload,
            { withCredentials: true }
        );
    }

    updateStatus(
        id: string,
        status: StickyNoteStatus
    ): Observable<StickyNoteResponse> {
        return this.http.put<StickyNoteResponse>(
            `${this.stickyNoteBaseUrl}/status/${encodeURIComponent(id)}`,
            { status },
            { withCredentials: true }
        );
    }

    archive(id: string): Observable<StickyNoteResponse> {
        return this.updateStatus(id, 'ARCHIVED');
    }

    delete(id: string): Observable<DeleteStickyNoteResponse> {
        return this.http.delete<DeleteStickyNoteResponse>(
            `${this.stickyNoteBaseUrl}/delete/${encodeURIComponent(id)}`,
            { withCredentials: true }
        );
    }

    getTrash(
        workspaceId: string,
        page = 1,
        limit = 100
    ): Observable<StickyNotesResponse> {
        return this.getAll({
            workspaceId,
            status: 'TRASHED',
            page,
            limit,
            sortBy: 'updatedAt',
            sortOrder: 'desc'
        });
    }

    moveToTrash(id: string): Observable<StickyNoteResponse> {
        return this.http.put<StickyNoteResponse>(
            `${this.stickyNoteBaseUrl}/trash/${encodeURIComponent(id)}`,
            {},
            { withCredentials: true }
        );
    }

    restore(id: string): Observable<StickyNoteResponse> {
        return this.http.put<StickyNoteResponse>(
            `${this.stickyNoteBaseUrl}/restore/${encodeURIComponent(id)}`,
            {},
            { withCredentials: true }
        );
    }

    permanentlyDelete(id: string): Observable<DeleteStickyNoteResponse> {
        return this.http.delete<DeleteStickyNoteResponse>(
            `${this.stickyNoteBaseUrl}/permanent/${encodeURIComponent(id)}`,
            { withCredentials: true }
        );
    }

    private buildParams(filters: StickyNoteFilters): HttpParams {
        let params = new HttpParams();

        if (filters.workspaceId) {
            params = params.set('workspaceId', filters.workspaceId);
        }

        if (filters.workspaceFolderId) {
            params = params.set('workspaceFolderId', filters.workspaceFolderId);
        }

        if (filters.columnId) {
            params = params.set('columnId', filters.columnId);
        }

        if (filters.search) {
            params = params.set('search', filters.search);
        }

        if (filters.color) {
            params = params.set('color', filters.color);
        }

        if (filters.status) {
            params = params.set('status', filters.status);
        }

        if (filters.createdBy) {
            params = params.set('createdBy', filters.createdBy);
        }

        if (filters.page !== undefined) {
            params = params.set('page', String(filters.page));
        }

        if (filters.limit !== undefined) {
            params = params.set('limit', String(filters.limit));
        }

        if (filters.sortBy) {
            params = params.set('sortBy', filters.sortBy);
        }

        if (filters.sortOrder) {
            params = params.set('sortOrder', filters.sortOrder);
        }

        return params;
    }
}
