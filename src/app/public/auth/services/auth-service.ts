import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, } from '@angular/core';
import { Observable, catchError, map, of, tap, } from 'rxjs';
import { environment } from '../../../../Environments/environments';
import {
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
    SessionType,
    VerifyEmailResponse,
} from '../models/auth.models';

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

    private readonly baseUrl =
        environment.apiUrl.replace(/\/+$/, '');

    private readonly loginUrl =
        `${this.baseUrl}/auth/login`;

    private readonly registerUrl =
        `${this.baseUrl}/auth/register`;

    private readonly verifyEmailUrl =
        `${this.baseUrl}/auth/verifyemail`;

    private readonly forgotPasswordUrl =
        `${this.baseUrl}/auth/forgotpassword`;

    private readonly resetPasswordUrl =
        `${this.baseUrl}/auth/resetpassword`;

    private readonly changePasswordUrl =
        `${this.baseUrl}/auth/changepassword`;

    private readonly logoutUrl =
        `${this.baseUrl}/auth/logout`;

    private readonly logoutAllUrl =
        `${this.baseUrl}/auth/logoutall`;

    private readonly sessionsUrl =
        `${this.baseUrl}/auth/sessions`;

    login(
        credentials: LoginCredentials,
    ): Observable<LoginResponse> {
        const payload: LoginRequest = {
            email: credentials.email
                .trim()
                .toLowerCase(),
            password: credentials.password,
            rememberMe: credentials.rememberMe,
            ...this.clientContext(),
        };

        return this.http
            .post<LoginResponse>(
                this.loginUrl,
                payload,
                {
                    withCredentials: true,
                },
            )
            .pipe(
                tap(response => {
                    this.storeSessionResponse(response);
                }),
            );
    }

    register(
        credentials: RegisterCredentials,
    ): Observable<RegisterResponse> {
        const payload: RegisterRequest = {
            ...credentials,
            email: credentials.email
                .trim()
                .toLowerCase(),
            phone:
                credentials.phone?.trim() ||
                undefined,
            ...this.clientContext(),
        };

        return this.http
            .post<RegisterResponse>(
                this.registerUrl,
                payload,
                {
                    withCredentials: true,
                },
            )
            .pipe(
                tap(response => {
                    this.storeSessionResponse(response);
                }),
            );
    }

    initializeSession(): Observable<boolean> {
        if (this.authStore.initialized()) {
            return of(
                this.authStore.isAuthenticated(),
            );
        }

        if (!isPlatformBrowser(this.platformId)) {
            this.authStore.markInitialized();

            return of(false);
        }

        return this.refreshService
            .refreshSession()
            .pipe(
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

    forgotPassword(
        email: string,
    ): Observable<ForgotPasswordResponse> {
        const payload: ForgotPasswordRequest = {
            email: email
                .trim()
                .toLowerCase(),
        };

        return this.http.post<ForgotPasswordResponse>(
            this.forgotPasswordUrl,
            payload,
            {
                withCredentials: true,
            },
        );
    }

    resetPassword(
        token: string,
        password: string,
    ): Observable<ResetPasswordResponse> {
        const payload: ResetPasswordRequest = {
            token: token.trim(),
            password,
        };

        return this.http
            .post<ResetPasswordResponse>(
                this.resetPasswordUrl,
                payload,
                {
                    withCredentials: true,
                },
            )
            .pipe(
                tap(response => {
                    if (response?.success) {
                        this.authStore.clearSession();
                    }
                }),
            );
    }

    verifyEmail(
        token: string,
    ): Observable<VerifyEmailResponse> {
        return this.http
            .post<VerifyEmailResponse>(
                this.verifyEmailUrl,
                {
                    token: token.trim(),
                },
                {
                    withCredentials: true,
                },
            )
            .pipe(
                tap(response => {
                    if (
                        response?.success &&
                        this.authStore.user()
                    ) {
                        this.authStore.patchUser({
                            isEmailVerified: true,
                        });
                    }
                }),
            );
    }

    changePassword(
        currentPassword: string,
        newPassword: string,
    ): Observable<ChangePasswordResponse> {
        const payload: ChangePasswordRequest = {
            currentPassword,
            newPassword,
        };

        return this.http
            .post<ChangePasswordResponse>(
                this.changePasswordUrl,
                payload,
                {
                    withCredentials: true,
                },
            )
            .pipe(
                tap(response => {
                    if (response?.success) {
                        this.authStore.clearSession();
                    }
                }),
            );
    }

    logout(): Observable<LogoutResponse> {
        return this.http
            .post<LogoutResponse>(
                this.logoutUrl,
                {},
                {
                    withCredentials: true,
                },
            )
            .pipe(
                tap(response => {
                    if (response?.success) {
                        this.authStore.clearSession();
                    }
                }),
            );
    }

    logoutAll(): Observable<LogoutResponse> {
        return this.http
            .post<LogoutResponse>(
                this.logoutAllUrl,
                {},
                {
                    withCredentials: true,
                },
            )
            .pipe(
                tap(response => {
                    if (response?.success) {
                        this.authStore.clearSession();
                    }
                }),
            );
    }

    getSessions():
        Observable<ApiResponse<unknown[]>> {
        return this.http.get<
            ApiResponse<unknown[]>
        >(
            this.sessionsUrl,
            {
                withCredentials: true,
            },
        );
    }

    private storeSessionResponse(
        response: AuthSessionResponse,
    ): void {
        if (
            !response?.success ||
            !response.data ||
            !response.data.tokens?.accessToken
        ) {
            return;
        }

        this.authStore.setSession(
            response.data,
        );
    }

    private clientContext(): ClientContext {
        return {
            sessionType: SessionType.WEB,
            deviceId:
                this.getOrCreateDeviceId(),
            deviceName:
                this.getDeviceName(),
        };
    }

    private getOrCreateDeviceId():
        string | undefined {
        if (!isPlatformBrowser(this.platformId)) {
            return undefined;
        }

        const storageKey =
            'mysticky_device_id';

        const existing =
            localStorage.getItem(storageKey);

        if (existing) {
            return existing;
        }

        const deviceId =
            typeof crypto !== 'undefined' &&
                typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `${Date.now().toString(36)
                }-${Math.random()
                    .toString(36)
                    .slice(2)
                }-${Math.random()
                    .toString(36)
                    .slice(2)
                }`;

        localStorage.setItem(
            storageKey,
            deviceId,
        );

        return deviceId;
    }

    private getDeviceName():
        string | undefined {
        if (!isPlatformBrowser(this.platformId)) {
            return undefined;
        }

        const nav =
            navigator as NavigatorWithUserAgentData;

        const userAgent =
            nav.userAgent;

        const platform =
            nav.userAgentData?.platform ||
            nav.platform ||
            this.detectOperatingSystem(
                userAgent,
            );

        const browser =
            this.detectBrowser(userAgent);

        const mobile =
            nav.userAgentData?.mobile ??
            /Android|iPhone|iPad|iPod|Mobile/i
                .test(userAgent);

        return (
            `${browser} on ${platform} ` +
            `(${mobile
                ? 'Mobile browser'
                : 'Desktop browser'
            })`
        ).slice(0, 200);
    }

    private detectBrowser(
        userAgent: string,
    ): string {
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

    private detectOperatingSystem(
        userAgent: string,
    ): string {
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
