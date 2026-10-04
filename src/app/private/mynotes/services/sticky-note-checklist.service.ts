import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';
@Injectable({
    providedIn: 'root',
})

export class StickyNoteChecklistApiService {
    private readonly http = inject(HttpClient);

    getById(id: string): Observable<any> {
        return this.http.get<any>(
            API_ENDPOINTS.stickyNoteChecklists.get(id),
            { withCredentials: true },
        );
    }

    getAll(filters: any = {}): Observable<any> {
        return this.http.get<any>(API_ENDPOINTS.stickyNoteChecklists.getAll, {
            params: buildHttpParams(filters),
            withCredentials: true,
        });
    }

    getByStickyNote(
        stickyNoteId: string,
        filters: any = {},
    ): Observable<any> {
        return this.getAll({ ...filters, stickyNoteId });
    }

    create(payload: any): Observable<any> {
        return this.http.post<any>(API_ENDPOINTS.stickyNoteChecklists.create, payload, {
            withCredentials: true,
        });
    }

    update(id: string, payload: any): Observable<any> {
        return this.http.put<any>(
            API_ENDPOINTS.stickyNoteChecklists.update(id),
            payload,
            { withCredentials: true },
        );
    }

    updateStatus(id: string, status: any): Observable<any> {
        return this.http.put<any>(
            API_ENDPOINTS.stickyNoteChecklists.status(id),
            { status },
            { withCredentials: true },
        );
    }

    archive(id: string): Observable<any> {
        return this.updateStatus(id, 'ARCHIVED');
    }

    delete(id: string): Observable<any> {
        return this.http.delete<any>(
            API_ENDPOINTS.stickyNoteChecklists.delete(id),
            { withCredentials: true },
        );
    }

    restore(id: string): Observable<any> {
        return this.http.put<any>(
            API_ENDPOINTS.stickyNoteChecklists.restore(id),
            {},
            { withCredentials: true },
        );
    }

}
