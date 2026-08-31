import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
    catchError,
    forkJoin,
    map,
    Observable,
    of,
    throwError,
} from 'rxjs';

import { environment } from '../../../../Environments/environments';
import { ApiResponse, CountryReference, CurrencyReference, LanguageReference, ProfileReferenceData, TimezoneReference, UpdateUserProfilePayload, UserProfile } from '../models/user-profile.models';

const PROFILE_ENDPOINTS = {
    create: '/user-profiles/create',
    me: '/user-profiles/me',
    update: '/user-profiles/update',
    countries: '/countries/getall',
    timezones: '/timezones/getall',
    languages: '/languages/getall',
    currencies: '/currencies/getall',
} as const;

type CollectionResponse<T> = ApiResponse<
    | T[]
    | {
        items?: T[];
        rows?: T[];
        records?: T[];
    }
>;

@Injectable({ providedIn: 'root' })
export class UserProfileService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl.replace(/\/+$/, '');

    getMyProfile(): Observable<UserProfile | null> {
        return this.http
            .get<ApiResponse<UserProfile>>(
                `${this.apiUrl}${PROFILE_ENDPOINTS.me}`
            )
            .pipe(
                map(response => response.data),
                catchError(error =>
                    error?.status === 404 ? of(null) : throwError(() => error)
                )
            );
    }

    createMyProfile(
        payload: UpdateUserProfilePayload
    ): Observable<UserProfile> {
        return this.http
            .post<ApiResponse<UserProfile>>(
                `${this.apiUrl}${PROFILE_ENDPOINTS.create}`,
                payload
            )
            .pipe(map(response => response.data));
    }

    updateMyProfile(
        payload: UpdateUserProfilePayload
    ): Observable<UserProfile> {
        return this.http
            .put<ApiResponse<UserProfile>>(
                `${this.apiUrl}${PROFILE_ENDPOINTS.update}`,
                payload
            )
            .pipe(map(response => response.data));
    }

    /** All four requests run together, so the screen is not loaded sequentially. */
    getReferenceData(): Observable<ProfileReferenceData> {
        return forkJoin({
            countries: this.getCollection<CountryReference>(
                PROFILE_ENDPOINTS.countries
            ),
            timezones: this.getCollection<TimezoneReference>(
                PROFILE_ENDPOINTS.timezones
            ),
            languages: this.getCollection<LanguageReference>(
                PROFILE_ENDPOINTS.languages
            ),
            currencies: this.getCollection<CurrencyReference>(
                PROFILE_ENDPOINTS.currencies
            ),
        });
    }

    private getCollection<T>(path: string): Observable<T[]> {
        return this.http
            .get<CollectionResponse<T>>(`${this.apiUrl}${path}`)
            .pipe(
                map(response => {
                    const data = response.data;

                    if (Array.isArray(data)) {
                        return data;
                    }

                    return data.items ?? data.rows ?? data.records ?? [];
                })
            );
    }
}
