import {
    HttpClient,
} from '@angular/common/http';

import {
    Injectable,
    inject,
} from '@angular/core';

import {
    Observable,
    map,
} from 'rxjs';

import {
    environment,
} from '../../../../Environments/environments';

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

    private readonly http =
        inject(HttpClient);

    private readonly apiUrl =
        environment.apiUrl.replace(
            /\/+$/,
            '',
        );


    /* ==========================================================================
       Get preferences
       ========================================================================== */

    getMyPreferences():
        Observable<UserPreferencesM> {

        return this.http
            .get<
                ApiResponse<
                    UserPreferencesResponseData
                >
            >(
                `${this.apiUrl}${USER_PREFERENCE_ENDPOINTS.me}`,
            )
            .pipe(
                map(response =>
                    this.normalizePreferences(
                        response.data,
                    ),
                ),
            );
    }


    /* ==========================================================================
       Update preferences
       ========================================================================== */

    updateMyPreferences(
        preferences: UserPreferencesM,
    ): Observable<UserPreferencesM> {

        const payload:
            UpdateUserPreferencesPayload = {

            preferences:
                USER_PREFERENCE_KEY_LIST.map(
                    key => ({
                        key,
                        value: preferences[key],
                    }),
                ),
        };

        return this.http
            .put<
                ApiResponse<
                    UserPreferencesResponseData
                >
            >(
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


    /* ==========================================================================
       Normalize
       ========================================================================== */

    private normalizePreferences(
        data:
            | UserPreferencesResponseData
            | null
            | undefined,

        fallback: UserPreferencesM = {
            ...DEFAULT_USER_PREFERENCES,
        },
    ): UserPreferencesM {

        const normalized:
            UserPreferencesM = {

            ...DEFAULT_USER_PREFERENCES,

            ...fallback,
        };


        const records =
            this.extractRecords(data);


        /*
         * Backend returned preference records.
         */
        if (records) {

            for (const record of records) {

                const key =
                    this.toCanonicalKey(
                        record.key,
                    );


                if (!key) {
                    continue;
                }


                this.assignPreference(
                    normalized,
                    key,
                    record.value,
                );
            }


            return normalized;
        }


        /*
         * Backend returned a preference object.
         */
        if (
            data &&
            typeof data === 'object'
        ) {

            for (
                const key
                of USER_PREFERENCE_KEY_LIST
            ) {

                const value =
                    (
                        data as
                        Partial<UserPreferencesM>
                    )[key];


                if (
                    value === undefined
                ) {
                    continue;
                }


                this.assignPreference(
                    normalized,
                    key,
                    value,
                );
            }
        }


        return normalized;
    }


    /* ==========================================================================
       Extract preference records
       ========================================================================== */

    private extractRecords(
        data:
            | UserPreferencesResponseData
            | null
            | undefined,
    ): UserPreferenceRecord[] | null {

        if (
            Array.isArray(data)
        ) {
            return data;
        }


        if (
            !data ||
            typeof data !== 'object'
        ) {
            return null;
        }


        const collection = data as {

            preferences?:
            UserPreferenceRecord[];

            items?:
            UserPreferenceRecord[];

            rows?:
            UserPreferenceRecord[];

            records?:
            UserPreferenceRecord[];
        };


        return (
            collection.preferences ??
            collection.items ??
            collection.rows ??
            collection.records ??
            null
        );
    }


    /* ==========================================================================
       Normalize preference key
       ========================================================================== */

    private toCanonicalKey(
        key: string,
    ): UserPreferenceKey | null {

        const normalizedKey =
            String(key)
                .trim()
                .toLowerCase();


        return (
            USER_PREFERENCE_KEY_LIST.find(
                preferenceKey =>
                    preferenceKey
                        .toLowerCase() ===
                    normalizedKey,
            ) ??
            null
        );
    }


    /* ==========================================================================
       Assign typed preference
       ========================================================================== */

    private assignPreference(
        target: UserPreferencesM,
        key: UserPreferenceKey,
        value: unknown,
    ): void {

        switch (key) {

            /* --------------------------------------------------------------
               Booleans
               -------------------------------------------------------------- */

            case 'autosaveEnabled':

            case 'emailNotifications':

            case 'pushNotifications':

            case 'inAppNotifications':

            case 'marketingEmails':

            case 'profileVisible':

            case 'showOnlineStatus':

            case 'reduceMotion':

            case 'highContrast':

                target[key] =
                    this.toBoolean(value);

                return;


            /* --------------------------------------------------------------
               Autosave interval
               -------------------------------------------------------------- */

            case 'autosaveInterval': {

                const interval =
                    Number(value);


                target.autosaveInterval =
                    Number.isFinite(interval) &&
                        interval > 0
                        ? interval
                        : DEFAULT_USER_PREFERENCES
                            .autosaveInterval;

                return;
            }


            /* --------------------------------------------------------------
               Theme
               -------------------------------------------------------------- */

            case 'theme':

                if (
                    value === 'SYSTEM' ||
                    value === 'LIGHT' ||
                    value === 'DARK'
                ) {

                    target.theme = value;
                }

                return;


            /* --------------------------------------------------------------
               Default note color
               -------------------------------------------------------------- */

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
                        value as
                        UserPreferencesM[
                        'defaultNoteColor'
                        ];
                }

                return;


            /* --------------------------------------------------------------
               Note view
               -------------------------------------------------------------- */

            case 'noteView':

                if (
                    value === 'GRID' ||
                    value === 'LIST' ||
                    value === 'KANBAN'
                ) {

                    target.noteView = value;
                }

                return;


            /* --------------------------------------------------------------
               Workspace view
               -------------------------------------------------------------- */

            case 'workspaceView':

                if (
                    value === 'GRID' ||
                    value === 'LIST'
                ) {

                    target.workspaceView =
                        value;
                }

                return;


            /* --------------------------------------------------------------
               Workspace sort
               -------------------------------------------------------------- */

            case 'workspaceSort':

                if (
                    value === 'UPDATED_AT' ||
                    value === 'CREATED_AT' ||
                    value === 'NAME_ASC' ||
                    value === 'NAME_DESC'
                ) {

                    target.workspaceSort =
                        value;
                }

                return;
        }
    }


    /* ==========================================================================
       Boolean normalization
       ========================================================================== */

    private toBoolean(
        value: unknown,
    ): boolean {

        if (
            typeof value === 'boolean'
        ) {
            return value;
        }


        if (
            typeof value === 'string'
        ) {

            const normalized =
                value
                    .trim()
                    .toLowerCase();


            if (
                normalized === 'true' ||
                normalized === '1' ||
                normalized === 'yes'
            ) {
                return true;
            }


            if (
                normalized === 'false' ||
                normalized === '0' ||
                normalized === 'no'
            ) {
                return false;
            }
        }


        if (
            typeof value === 'number'
        ) {
            return value !== 0;
        }


        return Boolean(value);
    }
}