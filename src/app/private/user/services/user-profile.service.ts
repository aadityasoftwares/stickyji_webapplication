import { DirectUploadService } from '../../../shared/services/direct-upload.service';
import { HttpClient, HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  catchError,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';

import { API_BASE_URL, API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { AuthStore } from '../../../public/auth/state/auth.store';
import type { ApiDataResponse as ApiResponse } from '../../../shared/interfaces/api.interface';
import type {
  CountryReference,
  CurrencyReference,
  IProfileImageSummary,
  LanguageReference,
  ProfileImageResponseData,
  ProfileReferenceData,
  RequestProfileImageUploadPayload,
  RequestProfileImageUploadResponse,
  TimezoneReference,
  UpdateUserProfilePayload,
  UserProfile,
} from '../interfaces/user-profile.interface';

const PROFILE_ENDPOINTS = {
  create: '/userprofile/create',
  me: '/userprofile/me',
  update: '/userprofile/update',
  image: '/userprofile/image',
  uploadRequest: '/userprofile/image/upload-request',
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
  private readonly directUpload = inject(DirectUploadService);
  private readonly authStore = inject(AuthStore);
  private readonly apiUrl = API_BASE_URL;

  readonly currentUserAvatarUrl = signal<string | null>(null);
  readonly currentUserProfileImage = signal<IProfileImageSummary | null>(null);

  private lastImageFetchedAt: number | null = null;
  private pendingRefresh$: Observable<ProfileImageResponseData | null> | null = null;

  setCurrentUserAvatar(url: string | null, image?: IProfileImageSummary | null): void {
    const cleanUrl = url && url.trim() ? url.trim() : null;
    const profileImg = image ?? (cleanUrl ? { id: '', url: cleanUrl } : null);

    this.currentUserAvatarUrl.set(cleanUrl);
    this.currentUserProfileImage.set(profileImg);
    this.lastImageFetchedAt = Date.now();

    this.authStore.patchUser({
      avatarUrl: cleanUrl,
      profileImage: profileImg,
    });
  }

  getMyProfile(): Observable<UserProfile | null> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.apiUrl}${PROFILE_ENDPOINTS.me}`).pipe(
      map((response) => response.data),
      tap((profile) => {
        if (profile) {
          const url = profile.profileImage?.url ?? profile.avatarUrl ?? null;
          this.setCurrentUserAvatar(url, profile.profileImage ?? null);
        }
      }),
      catchError((error) => (error?.status === 404 ? of(null) : throwError(() => error))),
    );
  }

  getMyProfileImage(): Observable<ProfileImageResponseData> {
    return this.http
      .get<ApiResponse<ProfileImageResponseData>>(API_ENDPOINTS.userProfile.image)
      .pipe(
        map((response) => response.data),
        tap((data) => {
          const url = data?.profileImage?.url ?? data?.avatarUrl ?? null;
          this.setCurrentUserAvatar(url, data?.profileImage ?? null);
        }),
      );
  }

  refreshProfileImageIfStale(force = false): Observable<ProfileImageResponseData | null> {
    const staleThreshold = 12 * 60 * 1000; // 12 minutes (presigned download URLs expire in ~15m)
    const isStale =
      !this.lastImageFetchedAt || Date.now() - this.lastImageFetchedAt > staleThreshold;

    if (!force && !isStale) {
      return of({
        profileImage: this.currentUserProfileImage(),
        avatarUrl: this.currentUserAvatarUrl(),
      });
    }

    if (this.pendingRefresh$) {
      return this.pendingRefresh$;
    }

    this.pendingRefresh$ = this.getMyProfileImage().pipe(
      catchError(() => of(null)),
      finalize(() => {
        this.pendingRefresh$ = null;
      }),
      shareReplay(1),
    );

    return this.pendingRefresh$;
  }

  requestProfileImageUpload(
    payload: RequestProfileImageUploadPayload,
  ): Observable<RequestProfileImageUploadResponse> {
    return this.http
      .post<ApiResponse<RequestProfileImageUploadResponse>>(
        API_ENDPOINTS.userProfile.uploadRequest,
        payload,
      )
      .pipe(map((response) => response.data));
  }

  uploadToR2(uploadUrl: string, file: File): Observable<HttpEvent<unknown>> {
    return this.directUpload.upload(uploadUrl, file, { 'Content-Type': file.type, 'If-None-Match': '*' });
  }

  completeMediaUpload(mediaId: string): Observable<unknown> {
    return this.http
      .post<ApiResponse<unknown>>(API_ENDPOINTS.media.complete(mediaId), {})
      .pipe(map((response) => response.data));
  }

  setProfileImage(mediaId: string): Observable<UserProfile> {
    return this.http
      .post<ApiResponse<UserProfile>>(API_ENDPOINTS.userProfile.image, { mediaId })
      .pipe(
        map((response) => response.data),
        tap((profile) => {
          const url = profile.profileImage?.url ?? profile.avatarUrl ?? null;
          this.setCurrentUserAvatar(url, profile.profileImage ?? null);
        }),
      );
  }

  removeProfileImage(): Observable<UserProfile> {
    return this.http
      .delete<ApiResponse<UserProfile>>(API_ENDPOINTS.userProfile.image)
      .pipe(
        map((response) => response.data),
        tap(() => {
          this.setCurrentUserAvatar(null, null);
        }),
      );
  }

  createMyProfile(payload: UpdateUserProfilePayload): Observable<UserProfile> {
    return this.http
      .post<ApiResponse<UserProfile>>(`${this.apiUrl}${PROFILE_ENDPOINTS.create}`, payload)
      .pipe(map((response) => response.data));
  }

  updateMyProfile(payload: UpdateUserProfilePayload): Observable<UserProfile> {
    return this.http
      .put<ApiResponse<UserProfile>>(`${this.apiUrl}${PROFILE_ENDPOINTS.update}`, payload)
      .pipe(map((response) => response.data));
  }

  /** All four requests run together, so the screen is not loaded sequentially. */
  getReferenceData(): Observable<ProfileReferenceData> {
    return forkJoin({
      countries: this.getCollection<CountryReference>(PROFILE_ENDPOINTS.countries),
      timezones: this.getCollection<TimezoneReference>(PROFILE_ENDPOINTS.timezones),
      languages: this.getCollection<LanguageReference>(PROFILE_ENDPOINTS.languages),
      currencies: this.getCollection<CurrencyReference>(PROFILE_ENDPOINTS.currencies),
    });
  }

  private getCollection<T>(path: string): Observable<T[]> {
    return this.http.get<CollectionResponse<T>>(`${this.apiUrl}${path}`).pipe(
      map((response) => {
        const data = response.data;

        if (Array.isArray(data)) {
          return data;
        }

        return data.items ?? data.rows ?? data.records ?? [];
      }),
    );
  }
}
