import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../Environments/environments';
import {
    ApiResponse,
    DEFAULT_USER_PREFERENCES,
    UpdateUserPreferencesPayload,
    USER_PREFERENCE_KEY_LIST,
    UserPreferenceKey,
    UserPreferenceRecord,
    UserPreferencesM,
    UserPreferencesResponseData,
} from '../models/user-preference.models';

const USER_PREFERENCE_ENDPOINTS = {
    me: '/userpreference/me',
    update: '/userpreference/update',
} as const;

@Injectable({
    providedIn: 'root',
})
export class UserPreferenceService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl.replace(/\/+$/, '');

    getMyPreferences(): Observable<UserPreferencesM> {
        return this.http
            .get<ApiResponse<UserPreferencesResponseData>>(
                `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.me}`,
            )
            .pipe(
                map(response => this.normalizePreferences(response.data)),
            );
    }

    updateMyPreferences(
        preferences: UserPreferencesM,
    ): Observable<UserPreferencesM> {
        const payload: UpdateUserPreferencesPayload = {
            preferences: USER_PREFERENCE_KEY_LIST.map(key => ({
                key,
                value: preferences[key],
            })),
        };

        return this.http
            .put<ApiResponse<UserPreferencesResponseData>>(
                `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.update}`,
                payload,
            )
            .pipe(
                map(response =>
                    this.normalizePreferences(
                        response.data,
                        preferences,
                    ),
                ),
            );
    }

    private normalizePreferences(
        data: UserPreferencesResponseData | null | undefined,
        fallback: UserPreferencesM = { ...DEFAULT_USER_PREFERENCES },
    ): UserPreferencesM {
        const normalized: UserPreferencesM = {
            ...DEFAULT_USER_PREFERENCES,
            ...fallback,
        };

        const records = this.extractRecords(data);

        if (records) {
            for (const record of records) {
                const key = this.toCanonicalKey(record.key);

                if (key) {
                    this.assignPreference(normalized, key, record.value);
                }
            }

            return normalized;
        }

        if (data && typeof data === 'object') {
            for (const key of USER_PREFERENCE_KEY_LIST) {
                const value = (data as Partial<UserPreferencesM>)[key];

                if (value !== undefined) {
                    this.assignPreference(normalized, key, value);
                }
            }
        }

        return normalized;
    }

    private extractRecords(
        data: UserPreferencesResponseData | null | undefined,
    ): UserPreferenceRecord[] | null {
        if (Array.isArray(data)) {
            return data;
        }

        if (!data || typeof data !== 'object') {
            return null;
        }

        const collection = data as {
            preferences?: UserPreferenceRecord[];
            items?: UserPreferenceRecord[];
            rows?: UserPreferenceRecord[];
            records?: UserPreferenceRecord[];
        };

        return collection.preferences ??
            collection.items ??
            collection.rows ??
            collection.records ??
            null;
    }

    private toCanonicalKey(
        key: string,
    ): UserPreferenceKey | null {
        const normalizedKey = key.toLowerCase();

        return USER_PREFERENCE_KEY_LIST.find(
            preferenceKey =>
                preferenceKey.toLowerCase() === normalizedKey,
        ) ?? null;
    }

    private assignPreference(
        target: UserPreferencesM,
        key: UserPreferenceKey,
        value: unknown,
    ): void {
        switch (key) {
            case 'autosaveEnabled':
            case 'emailNotifications':
            case 'pushNotifications':
            case 'inAppNotifications':
            case 'marketingEmails':
            case 'profileVisible':
            case 'showOnlineStatus':
            case 'reduceMotion':
            case 'highContrast':
                target[key] = this.toBoolean(value);
                return;

            case 'autosaveInterval': {
                const interval = Number(value);
                target.autosaveInterval =
                    Number.isFinite(interval) && interval > 0
                        ? interval
                        : DEFAULT_USER_PREFERENCES.autosaveInterval;
                return;
            }

            case 'theme':
                if (value === 'SYSTEM' || value === 'LIGHT' || value === 'DARK') {
                    target.theme = value;
                }
                return;

            case 'defaultNoteColor':
                if (
                    typeof value === 'string' &&
                    [
                        'YELLOW',
                        'ORANGE',
                        'PINK',
                        'RED',
                        'GREEN',
                        'BLUE',
                        'PURPLE',
                        'BROWN',
                        'BLACK',
                    ].includes(value)
                ) {
                    target.defaultNoteColor =
                        value as UserPreferencesM['defaultNoteColor'];
                }
                return;

            case 'noteView':
                if (value === 'GRID' || value === 'LIST' || value === 'KANBAN') {
                    target.noteView = value;
                }
                return;
        }
    }

    private toBoolean(value: unknown): boolean {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }

        return Boolean(value);
    }
}

