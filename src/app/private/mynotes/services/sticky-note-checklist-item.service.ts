import {
    HttpClient,
} from '@angular/common/http';

import {
    Injectable,
    inject,
} from '@angular/core';

import type {
    Observable,
} from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';

@Injectable({
    providedIn: 'root',
})
export class StickyNoteChecklistItemApiService {

    private readonly http =
        inject(HttpClient);

    private readonly baseUrl = API_BASE_URL;

    private readonly base =
        `${this.baseUrl}/stickynoteschecklistitems`;

    getById(
        id: string,
    ): Observable<any> {
        return this.http.get<any>(
            `${this.base}/get/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    getAll(
        filters: any = {},
    ): Observable<any> {
        return this.http.get<any>(
            `${this.base}/getall`,
            {
                params: buildHttpParams(filters),
                withCredentials: true,
            },
        );
    }

    getByChecklist(
        checklistId: string,
        filters: any = {},
    ): Observable<any> {
        return this.getAll({
            ...filters,
            checklistId,
        });
    }

    create(
        payload: any,
    ): Observable<any> {
        return this.http.post<any>(
            `${this.base}/create`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    update(
        id: string,
        payload: any,
    ): Observable<any> {
        return this.http.put<any>(
            `${this.base}/update/${encodeURIComponent(id)}`,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    updateStatus(
        id: string,
        status: any,
    ): Observable<any> {
        return this.http.put<any>(
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
    ): Observable<any> {
        return this.http.put<any>(
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
    ): Observable<any> {
        return this.http.delete<any>(
            `${this.base}/delete/${encodeURIComponent(id)}`,
            {
                withCredentials: true,
            },
        );
    }

    restore(
        id: string,
    ): Observable<any> {
        return this.http.put<any>(
            `${this.base}/restore/${encodeURIComponent(id)}`,
            {},
            {
                withCredentials: true,
            },
        );
    }

}
