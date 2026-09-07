import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../../Environments/environments';
import {
    ApiDeleteResponse,
    StickyNoteChecklistCreateRequest,
    StickyNoteChecklistFilters,
    StickyNoteChecklistResponse,
    StickyNoteChecklistsResponse,
    StickyNoteChecklistStatus,
    StickyNoteChecklistUpdateRequest,
} from '../models/sticky-note-checklist.interface';

@Injectable({
    providedIn: 'root',
})

export class StickyNoteChecklistApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
    private readonly base = `${this.baseUrl}/stickynoteschecklist`;

    getById(id: string): Observable<StickyNoteChecklistResponse> {
        return this.http.get<StickyNoteChecklistResponse>(
            `${this.base}/get/${encodeURIComponent(id)}`,
            { withCredentials: true },
        );
    }

    getAll(filters: StickyNoteChecklistFilters = {}): Observable<StickyNoteChecklistsResponse> {
        return this.http.get<StickyNoteChecklistsResponse>(`${this.base}/getall`, {
            params: this.buildParams(filters),
            withCredentials: true,
        });
    }

    getByStickyNote(
        stickyNoteId: string,
        filters: Omit<StickyNoteChecklistFilters, 'stickyNoteId'> = {},
    ): Observable<StickyNoteChecklistsResponse> {
        return this.getAll({ ...filters, stickyNoteId });
    }

    create(payload: StickyNoteChecklistCreateRequest): Observable<StickyNoteChecklistResponse> {
        return this.http.post<StickyNoteChecklistResponse>(`${this.base}/create`, payload, {
            withCredentials: true,
        });
    }

    update(id: string, payload: StickyNoteChecklistUpdateRequest): Observable<StickyNoteChecklistResponse> {
        return this.http.put<StickyNoteChecklistResponse>(
            `${this.base}/update/${encodeURIComponent(id)}`,
            payload,
            { withCredentials: true },
        );
    }

    updateStatus(id: string, status: StickyNoteChecklistStatus): Observable<StickyNoteChecklistResponse> {
        return this.http.put<StickyNoteChecklistResponse>(
            `${this.base}/status/${encodeURIComponent(id)}`,
            { status },
            { withCredentials: true },
        );
    }

    archive(id: string): Observable<StickyNoteChecklistResponse> {
        return this.updateStatus(id, 'ARCHIVED');
    }

    delete(id: string): Observable<ApiDeleteResponse> {
        return this.http.delete<ApiDeleteResponse>(
            `${this.base}/delete/${encodeURIComponent(id)}`,
            { withCredentials: true },
        );
    }

    restore(id: string): Observable<StickyNoteChecklistResponse> {
        return this.http.put<StickyNoteChecklistResponse>(
            `${this.base}/restore/${encodeURIComponent(id)}`,
            {},
            { withCredentials: true },
        );
    }

    private buildParams(filters: StickyNoteChecklistFilters): HttpParams {
        let params = new HttpParams();

        if (filters.stickyNoteId) params = params.set('stickyNoteId', filters.stickyNoteId);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.page !== undefined) params = params.set('page', String(filters.page));
        if (filters.limit !== undefined) params = params.set('limit', String(filters.limit));
        if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
        if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

        return params;
    }
}
