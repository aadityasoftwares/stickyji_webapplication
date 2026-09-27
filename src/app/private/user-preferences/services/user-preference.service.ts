import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../Environments/environments';

const USER_PREFERENCE_ENDPOINTS = {
    my: '/userpreference/my',
    create: '/userpreference/create',
    update: '/userpreference/update',
    reset: '/userpreference/reset',
    resetAll: '/userpreference/resetall',
} as const;

@Injectable({
    providedIn: 'root',
})
export class UserPreferenceService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl.replace(/\/+$/, '');

    getMyPreferences(): Observable<any> {
        return this.http.get<any>(
            `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.my}`,
            { withCredentials: true },
        );
    }

    getPreference(key: string): Observable<any> {
        return this.http.get<any>(
            `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.my}/${encodeURIComponent(key)}`,
            { withCredentials: true },
        );
    }

    createPreference(key: string, value: any): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.create}`,
            { key, value },
            { withCredentials: true },
        );
    }

    updatePreference(key: string, value: any): Observable<any> {
        return this.http.put<any>(
            `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.update}`,
            { key, value },
            { withCredentials: true },
        );
    }

    deletePreference(key: string): Observable<any> {
        return this.http.delete<any>(
            `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.my}/${encodeURIComponent(key)}`,
            { withCredentials: true },
        );
    }

    resetPreference(key: string): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.reset}`,
            { key },
            { withCredentials: true },
        );
    }

    resetAllPreferences(): Observable<any> {
        return this.http.post<any>(
            `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.resetAll}`,
            {},
            { withCredentials: true },
        );
    }
}