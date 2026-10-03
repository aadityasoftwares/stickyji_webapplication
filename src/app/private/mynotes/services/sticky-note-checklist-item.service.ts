import {
    HttpClient,
    HttpParams,
} from '@angular/common/http';

import {
    Injectable,
    inject,
} from '@angular/core';

import type {
    Observable,
} from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constants';
import { StickyNoteChecklistItemResponse, StickyNoteChecklistItemFilters, StickyNoteChecklistItemsResponse, StickyNoteChecklistItemCreateRequest, StickyNoteChecklistItemUpdateRequest, StickyNoteChecklistItemStatus, ApiDeleteResponse } from '../models/sticky-note-checklist.interface';


@Injectable({
    providedIn: 'root',
})
export class StickyNoteChecklistItemApiService {

    private readonly http =
        inject(HttpClient);

    private readonly baseUrl = API_BASE_URL;

    /**
     * This assumes your Express router is mounted as:
     * app.use('/stickynotechecklistitems', stickyNoteChecklistItemRoutes)
     */
    private readonly base =
        `${this.baseUrl}/stickynoteschecklistitems`;

    getById(
        id: string,
    ): Observable<StickyNoteChecklistItemResponse> {

        return this.http.get<StickyNoteChecklistItemResponse>(
            `${this.base}/get/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    getAll(
        filters: StickyNoteChecklistItemFilters = {},
    ): Observable<StickyNoteChecklistItemsResponse> {

        return this.http.get<StickyNoteChecklistItemsResponse>(
            `${this.base}/getall`,
            {
                params: this.buildParams(filters),
                withCredentials: true,
            },
        );
    }

    getByChecklist(
        checklistId: string,
        filters: Omit<
            StickyNoteChecklistItemFilters,
            'checklistId'
        > = {},
    ): Observable<StickyNoteChecklistItemsResponse> {

        return this.getAll({
            ...filters,
            checklistId,
        });
    }

    create(
        payload: StickyNoteChecklistItemCreateRequest,
    ): Observable<StickyNoteChecklistItemResponse> {

        return this.http.post<StickyNoteChecklistItemResponse>(
            `${this.base}/create`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    update(
        id: string,
        payload: StickyNoteChecklistItemUpdateRequest,
    ): Observable<StickyNoteChecklistItemResponse> {

        return this.http.put<StickyNoteChecklistItemResponse>(
            `${this.base}/update/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    updateStatus(
        id: string,
        status: StickyNoteChecklistItemStatus,
    ): Observable<StickyNoteChecklistItemResponse> {

        return this.http.put<StickyNoteChecklistItemResponse>(
            `${this.base}/status/${encodeURIComponent(id)}`,
            {
                status,
            },
            {
                withCredentials: true,
            },
        );
    }

    updateCompletion(
        id: string,
        isCompleted: boolean,
    ): Observable<StickyNoteChecklistItemResponse> {

        return this.http.put<StickyNoteChecklistItemResponse>(
            `${this.base}/completion/${encodeURIComponent(id)}`,
            {
                isCompleted,
            },
            {
                withCredentials: true,
            },
        );
    }

    delete(
        id: string,
    ): Observable<ApiDeleteResponse> {

        return this.http.delete<ApiDeleteResponse>(
            `${this.base}/delete/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    restore(
        id: string,
    ): Observable<StickyNoteChecklistItemResponse> {

        return this.http.put<StickyNoteChecklistItemResponse>(
            `${this.base}/restore/${encodeURIComponent(id)}`,
            {},
            {
                withCredentials: true,
            },
        );
    }

    private buildParams(
        filters: StickyNoteChecklistItemFilters,
    ): HttpParams {

        let params =
            new HttpParams();

        if (filters.checklistId) {
            params = params.set(
                'checklistId',
                filters.checklistId,
            );
        }

        if (filters.status) {
            params = params.set(
                'status',
                filters.status,
            );
        }

        if (filters.isCompleted !== undefined) {
            params = params.set(
                'isCompleted',
                String(filters.isCompleted),
            );
        }

        if (filters.page !== undefined) {
            params = params.set(
                'page',
                String(filters.page),
            );
        }

        if (filters.limit !== undefined) {
            params = params.set(
                'limit',
                String(filters.limit),
            );
        }

        if (filters.sortBy) {
            params = params.set(
                'sortBy',
                filters.sortBy,
            );
        }

        if (filters.sortOrder) {
            params = params.set(
                'sortOrder',
                filters.sortOrder,
            );
        }

        return params;
    }
}
