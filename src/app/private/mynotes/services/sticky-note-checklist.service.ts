import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
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

    getById(id: string): Observable<StickyNoteChecklistResponse> {
        return this.http.get<StickyNoteChecklistResponse>(
            API_ENDPOINTS.stickyNoteChecklists.get(id),
            { withCredentials: true },
        );
    }

    getAll(filters: StickyNoteChecklistFilters = {}): Observable<StickyNoteChecklistsResponse> {
        return this.http.get<StickyNoteChecklistsResponse>(API_ENDPOINTS.stickyNoteChecklists.getAll, {
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
        return this.http.post<StickyNoteChecklistResponse>(API_ENDPOINTS.stickyNoteChecklists.create, payload, {
            withCredentials: true,
        });
    }

    update(id: string, payload: StickyNoteChecklistUpdateRequest): Observable<StickyNoteChecklistResponse> {
        return this.http.put<StickyNoteChecklistResponse>(
            API_ENDPOINTS.stickyNoteChecklists.update(id),
            payload,
            { withCredentials: true },
        );
    }

    updateStatus(id: string, status: StickyNoteChecklistStatus): Observable<StickyNoteChecklistResponse> {
        return this.http.put<StickyNoteChecklistResponse>(
            API_ENDPOINTS.stickyNoteChecklists.status(id),
            { status },
            { withCredentials: true },
        );
    }

    archive(id: string): Observable<StickyNoteChecklistResponse> {
        return this.updateStatus(id, 'ARCHIVED');
    }

    delete(id: string): Observable<ApiDeleteResponse> {
        return this.http.delete<ApiDeleteResponse>(
            API_ENDPOINTS.stickyNoteChecklists.delete(id),
            { withCredentials: true },
        );
    }

    restore(id: string): Observable<StickyNoteChecklistResponse> {
        return this.http.put<StickyNoteChecklistResponse>(
            API_ENDPOINTS.stickyNoteChecklists.restore(id),
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
