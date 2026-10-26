import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap, switchMap, throwError } from 'rxjs';
import { UserPreferenceService } from '../../../private/user-preferences/services/user-preference.service';
import {
  USER_PREFERENCE_KEYS,
  DEFAULT_USER_PREFERENCES,
} from '../../../shared/constants/common.constants';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { STORAGE_KEYS } from '../../../shared/constants/app.constants';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '../../../shared/functions/storage.functions';
import type {
  ApiResponse,
  AuthSession,
  AuthSessionResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ClientContext,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginCredentials,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterCredentials,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyEmailResponse,
} from '../interfaces/auth.interface';
import { SESSION_TYPES } from '../constants/auth.constants';

import { AuthStore } from '../state/auth.store';
import { AuthRefreshService } from './auth-refresh.service';

interface NavigatorUserAgentData {
  platform?: string;
  mobile?: boolean;
}

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: NavigatorUserAgentData;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly refreshService = inject(AuthRefreshService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly userPreferenceService = inject(UserPreferenceService);

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    const payload: LoginRequest = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
      rememberMe: credentials.rememberMe,
      ...this.clientContext(),
    };

    return this.http
      .post<LoginResponse>(API_ENDPOINTS.auth.login, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.storeSessionResponse(response);
        }),
      );
  }

  register(credentials: RegisterCredentials): Observable<RegisterResponse> {
    const payload: RegisterRequest = {
      ...credentials,
      email: credentials.email.trim().toLowerCase(),
      phone: credentials.phone?.trim() || undefined,
      ...this.clientContext(),
    };

    return this.http
      .post<RegisterResponse>(API_ENDPOINTS.auth.register, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.storeSessionResponse(response);
        }),
        switchMap((response) => {
          if (!response?.success || !response.data?.tokens?.accessToken) return of(response);
          // Only initialize new accounts; login must retain the user's chosen view.
          const key = USER_PREFERENCE_KEYS.TODAY_VIEW;
          const value = DEFAULT_USER_PREFERENCES[key];
          return this.userPreferenceService.updatePreference(key, value).pipe(
            catchError((error) =>
              error?.status === 404
                ? this.userPreferenceService.createPreference(key, value)
                : throwError(() => error),
            ),
            map(() => response),
            // A preference failure must not turn successful registration into an error.
            catchError(() => of(response)),
          );
        }),
      );
  }

  initializeSession(): Observable<boolean> {
    if (this.authStore.initialized()) {
      return of(this.authStore.isAuthenticated());
    }

    if (!isPlatformBrowser(this.platformId)) {
      this.authStore.markInitialized();

      return of(false);
    }

    return this.refreshService.refreshSession().pipe(
      map(() => true),
      catchError(() => {
        this.authStore.clearSession();

        return of(false);
      }),
    );
  }

  refreshSession(): Observable<AuthSession> {
    return this.refreshService.refreshSession();
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    const payload: ForgotPasswordRequest = {
      email: email.trim().toLowerCase(),
    };

    return this.http.post<ForgotPasswordResponse>(API_ENDPOINTS.auth.forgotPassword, payload, {
      withCredentials: true,
    });
  }

  resetPassword(token: string, password: string): Observable<ResetPasswordResponse> {
    const payload: ResetPasswordRequest = {
      token: token.trim(),
      password,
    };

    return this.http
      .post<ResetPasswordResponse>(API_ENDPOINTS.auth.resetPassword, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          if (response?.success) {
            this.authStore.clearSession();
          }
        }),
      );
  }

  verifyEmail(token: string): Observable<VerifyEmailResponse> {
    return this.http
      .post<VerifyEmailResponse>(
        API_ENDPOINTS.auth.verifyEmail,
        {
          token: token.trim(),
        },
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((response) => {
          if (response?.success && this.authStore.user()) {
            this.authStore.patchUser({
              isEmailVerified: true,
            });
          }
        }),
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<ChangePasswordResponse> {
    const payload: ChangePasswordRequest = {
      currentPassword,
      newPassword,
    };

    return this.http
      .post<ChangePasswordResponse>(API_ENDPOINTS.auth.changePassword, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          if (response?.success) {
            this.authStore.clearSession();
          }
        }),
      );
  }

  logout(payload?: {
    sessionId?: string;
    method?: 'POST' | 'GET';
    endpoint?: string;
  }): Observable<LogoutResponse> {
    const sessionId = payload?.sessionId ?? this.authStore.sessionId() ?? undefined;
    const body: Record<string, any> = {};
    if (sessionId) {
      body['sessionId'] = sessionId;
    }

    const targetUrl = payload?.endpoint ?? API_ENDPOINTS.auth.logout;
    const request$ =
      payload?.method === 'GET'
        ? this.http.get<LogoutResponse>(targetUrl, {
            params: body,
            withCredentials: true,
          })
        : this.http.post<LogoutResponse>(targetUrl, body, {
            withCredentials: true,
          });

    return request$.pipe(
      finalize(() => {
        this.authStore.clearSession();
      }),
    );
  }

  logoutAll(payload?: { endpoint?: string }): Observable<LogoutResponse> {
    const targetUrl = payload?.endpoint ?? API_ENDPOINTS.auth.logoutAll;
    return this.http
      .post<LogoutResponse>(
        targetUrl,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        finalize(() => {
          this.authStore.clearSession();
        }),
      );
  }

  getSessions(): Observable<ApiResponse<unknown[]>> {
    return this.http.get<ApiResponse<unknown[]>>(API_ENDPOINTS.auth.sessions, {
      withCredentials: true,
    });
  }

  private storeSessionResponse(response: AuthSessionResponse): void {
    if (!response?.success || !response.data || !response.data.tokens?.accessToken) {
      return;
    }

    this.authStore.setSession(response.data);
  }

  private clientContext(): ClientContext {
    return {
      sessionType: SESSION_TYPES.WEB,
      deviceId: this.getOrCreateDeviceId(),
      deviceName: this.getDeviceName(),
    };
  }

  private getOrCreateDeviceId(): string | undefined {
    if (!isPlatformBrowser(this.platformId)) {
      return undefined;
    }

    const existing = getLocalStorageItem(STORAGE_KEYS.DEVICE_ID);

    if (existing) {
      return existing;
    }

    const deviceId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
            .toString(36)
            .slice(2)}`;

    setLocalStorageItem(STORAGE_KEYS.DEVICE_ID, deviceId);

    return deviceId;
  }

  private getDeviceName(): string | undefined {
    if (!isPlatformBrowser(this.platformId)) {
      return undefined;
    }

    const nav = navigator as NavigatorWithUserAgentData;

    const userAgent = nav.userAgent;

    const platform =
      nav.userAgentData?.platform || nav.platform || this.detectOperatingSystem(userAgent);

    const browser = this.detectBrowser(userAgent);

    const mobile = nav.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

    return (
      `${browser} on ${platform} ` + `(${mobile ? 'Mobile browser' : 'Desktop browser'})`
    ).slice(0, 200);
  }

  private detectBrowser(userAgent: string): string {
    if (/Edg\//i.test(userAgent)) {
      return 'Microsoft Edge';
    }

    if (/OPR\//i.test(userAgent)) {
      return 'Opera';
    }

    if (/Chrome\//i.test(userAgent)) {
      return 'Google Chrome';
    }

    if (/Firefox\//i.test(userAgent)) {
      return 'Mozilla Firefox';
    }

    if (/Safari\//i.test(userAgent)) {
      return 'Safari';
    }

    return 'Web browser';
  }

  private detectOperatingSystem(userAgent: string): string {
    if (/Windows NT/i.test(userAgent)) {
      return 'Windows';
    }

    if (/Android/i.test(userAgent)) {
      return 'Android';
    }

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return 'iOS';
    }

    if (/Mac OS X|Macintosh/i.test(userAgent)) {
      return 'macOS';
    }

    if (/Linux/i.test(userAgent)) {
      return 'Linux';
    }

    return 'Unknown platform';
  }
}
