import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../../Environments/environments';
import { idOf } from '../../../shared/functions/common.function';

@Injectable({
    providedIn: 'root'
})
export class StickyNoteApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
    private readonly stickyNoteBaseUrl = `${this.baseUrl}/stickynotes`;

    getById(id: string): Observable<any> {
        return this.http.get<any>(
            `${this.stickyNoteBaseUrl}/get/${encodeURIComponent(id)}`,
            { withCredentials: true }
        );
    }

    getAll(payload: any = {}): Observable<any> {
        return this.http.post<any>(
            `${this.stickyNoteBaseUrl}/getall`,
            this.sanitizeGetPayload(payload),
            { withCredentials: true }
        );
    }

    getByWorkspace(
        workspaceId: string,
        payload: any = {}
    ): Observable<any> {
        return this.getAll({
            ...payload,
            workspaceId
        });
    }

    getByWorkspaceFolder(
        workspaceId: string,
        workspaceFolderId: string,
        payload: any = {}
    ): Observable<any> {
        return this.getAll({
            ...payload,
            workspaceId,
            workspaceFolderId
        });
    }

    getByColumn(
        workspaceId: string,
        workspaceFolderId: string,
        columnId: string,
        payload: any = {}
    ): Observable<any> {
        return this.getAll({
            ...payload,
            workspaceId,
            workspaceFolderId,
            columnId
        });
    }

    create(payload: any): Observable<any> {
        return this.http.post<any>(
            `${this.stickyNoteBaseUrl}/create`,
            this.sanitizeCreatePayload(payload),
            { withCredentials: true }
        );
    }

    update(
        id: string,
        payload: any
    ): Observable<any> {
        return this.http.put<any>(
            `${this.stickyNoteBaseUrl}/update/${encodeURIComponent(id)}`,
            this.sanitizeUpdatePayload(payload),
            { withCredentials: true }
        );
    }

    updateStatus(
        id: string,
        status: any
    ): Observable<any> {
        return this.http.put<any>(
            `${this.stickyNoteBaseUrl}/status/${encodeURIComponent(id)}`,
            { status },
            { withCredentials: true }
        );
    }

    reorder(
        id: string,
        payload: any
    ): Observable<any> {
        const body: any = {};
        const colId = idOf(payload?.columnId);
        if (colId) {
            body.columnId = colId;
        }
        if (payload?.beforeId !== undefined) {
            body.beforeId = payload.beforeId ? idOf(payload.beforeId) : null;
        }
        if (payload?.afterId !== undefined) {
            body.afterId = payload.afterId ? idOf(payload.afterId) : null;
        }
        return this.http.put<any>(
            `${this.stickyNoteBaseUrl}/reorder/${encodeURIComponent(idOf(id))}`,
            body,
            { withCredentials: true }
        );
    }

    archive(id: string): Observable<any> {
        return this.updateStatus(id, 'ARCHIVED');
    }

    delete(id: string): Observable<any> {
        return this.http.delete<any>(
            `${this.stickyNoteBaseUrl}/delete/${encodeURIComponent(id)}`,
            { withCredentials: true }
        );
    }

    getTrash(
        workspaceId: string,
        page = 1,
        limit = 100
    ): Observable<any> {
        return this.getAll({
            workspaceId,
            status: 'TRASHED',
            page,
            limit,
            sortBy: 'updatedAt',
            sortOrder: 'desc'
        });
    }

    moveToTrash(id: string): Observable<any> {
        return this.http.put<any>(
            `${this.stickyNoteBaseUrl}/trash/${encodeURIComponent(id)}`,
            {},
            { withCredentials: true }
        );
    }

    restore(id: string): Observable<any> {
        return this.http.put<any>(
            `${this.stickyNoteBaseUrl}/restore/${encodeURIComponent(id)}`,
            {},
            { withCredentials: true }
        );
    }

    permanentlyDelete(id: string): Observable<any> {
        return this.http.delete<any>(
            `${this.stickyNoteBaseUrl}/permanent/${encodeURIComponent(id)}`,
            { withCredentials: true }
        );
    }

    private sanitizeCreatePayload(payload: any): any {
        if (!payload || typeof payload !== 'object') return payload;
        const allowed = [
            'workspaceId',
            'workspaceFolderId',
            'columnId',
            'title',
            'content',
            'color',
            'priority',
            'shape',
            'variant',
            'backgroundPattern',
            'position',
            'noteDate'
        ];
        const cleaned: any = {};
        for (const key of allowed) {
            if (payload[key] !== undefined && payload[key] !== null) {
                cleaned[key] = payload[key];
            }
        }
        return cleaned;
    }

    private sanitizeUpdatePayload(payload: any): any {
        if (!payload || typeof payload !== 'object') return payload;
        const allowed = [
            'workspaceId',
            'workspaceFolderId',
            'columnId',
            'title',
            'content',
            'color',
            'priority',
            'shape',
            'variant',
            'backgroundPattern',
            'position',
            'noteDate'
        ];
        const cleaned: any = {};
        for (const key of allowed) {
            if (payload[key] !== undefined) {
                cleaned[key] = payload[key];
            }
        }
        return cleaned;
    }

    private sanitizeGetPayload(payload: any): any {
        if (!payload || typeof payload !== 'object') return {};
        const cleaned: any = {};
        for (const [key, value] of Object.entries(payload)) {
            if (value !== undefined && value !== null && value !== '') {
                cleaned[key] = value;
            }
        }
        return cleaned;
    }
}
