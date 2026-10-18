import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, shareReplay, tap, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../../../shared/constants/api.constants';

import { AuthSession, AuthSessionResponse } from '../models/auth.models';
import { AuthStore } from '../state/auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthRefreshService {
  private readonly httpBackend = inject(HttpBackend);
  private readonly authStore = inject(AuthStore);
  private readonly http = new HttpClient(this.httpBackend);

  private refreshRequest$: Observable<AuthSession> | null = null;

  refreshSession(): Observable<AuthSession> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.http
      .post<AuthSessionResponse>(
        API_ENDPOINTS.auth.refreshToken,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        map((response) => {
          if (!response?.success || !response.data || !response.data.tokens?.accessToken) {
            throw new HttpErrorResponse({
              status: 401,
              statusText: 'Unauthorized',
              url: API_ENDPOINTS.auth.refreshToken,
              error: {
                success: response?.success ?? false,
                message: response?.message ?? 'Invalid or expired refresh token.',
                data: response?.data ?? null,
              },
            });
          }

          return response.data;
        }),

        tap((session) => {
          this.authStore.setSession(session);
        }),

        catchError((error: HttpErrorResponse | Error) => {
          this.authStore.clearSession();

          return throwError(() => error);
        }),

        finalize(() => {
          this.refreshRequest$ = null;
        }),

        shareReplay({
          bufferSize: 1,
          refCount: false,
        }),
      );

    return this.refreshRequest$;
  }
}
