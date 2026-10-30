import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  Subject,
  catchError,
  finalize,
  map,
  shareReplay,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';

import { API_ENDPOINTS } from '../../../shared/constants/api.constants';

import type { AuthSession, AuthSessionResponse } from '../interfaces/auth.interface';
import { AuthStore } from '../state/auth.store';
import { SessionLifecycleService } from '../../../shared/services/session-lifecycle.service';

@Injectable({
  providedIn: 'root',
})
export class AuthRefreshService {
  private readonly cancelled$ = new Subject<void>();
  private applyingSession = false;
  private readonly lifecycle = inject(SessionLifecycleService);
  private readonly httpBackend = inject(HttpBackend);
  private readonly authStore = inject(AuthStore);
  private readonly http = new HttpClient(this.httpBackend);

  private refreshRequest$: Observable<AuthSession> | null = null;
  private requestRevision = -1;

  constructor() {
    this.lifecycle.registerReset(() => {
      if (!this.applyingSession) this.cancelPending();
    });
  }

  cancelPending(): void {
    this.cancelled$.next();
    this.refreshRequest$ = null;
  }

  refreshSession(): Observable<AuthSession> {
    if (this.refreshRequest$ && this.requestRevision === this.lifecycle.revision) {
      return this.refreshRequest$;
    }

    const revision = this.lifecycle.revision;
    this.requestRevision = revision;
    const request$ = this.http
      .post<AuthSessionResponse>(
        API_ENDPOINTS.auth.refreshToken,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        takeUntil(this.cancelled$),
        map((response) => {
          if (revision !== this.lifecycle.revision) {
            throw new Error('The session changed while refreshing authentication.');
          }
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
          this.applyingSession = true;
          try {
            this.authStore.setSession(session);
          } finally {
            this.applyingSession = false;
          }
        }),

        catchError((error: HttpErrorResponse | Error) => {
          if (revision === this.lifecycle.revision) this.authStore.clearSession();

          return throwError(() => error);
        }),

        finalize(() => {
          if (this.refreshRequest$ === request$) this.refreshRequest$ = null;
        }),

        shareReplay({
          bufferSize: 1,
          refCount: true,
        }),
      );

    this.refreshRequest$ = request$;
    return request$;
  }
}
