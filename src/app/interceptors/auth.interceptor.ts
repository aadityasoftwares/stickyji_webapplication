import {
    HttpErrorResponse,
    HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
    catchError,
    switchMap,
    throwError,
} from 'rxjs';
import { environment } from '../../Environments/environments';
import { AuthRefreshService } from '../public/auth/services/auth-refresh.service';
import { AuthStore } from '../public/auth/state/auth.store';

const PUBLIC_AUTH_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/auth/refreshtoken',
    '/auth/forgotpassword',
    '/auth/resetpassword',
    '/auth/verifyemail',
];

export const authInterceptor: HttpInterceptorFn = (
    request,
    next,
) => {
    const authStore = inject(AuthStore);
    const refreshService = inject(AuthRefreshService);
    const router = inject(Router);

    const apiBaseUrl =
        environment.apiUrl.replace(/\/+$/, '');

    const isOurApi =
        request.url.startsWith(apiBaseUrl);

    if (!isOurApi) {
        return next(request);
    }

    const isPublicAuthRequest =
        PUBLIC_AUTH_ENDPOINTS.some(endpoint =>
            request.url.includes(endpoint),
        );

    const accessToken =
        authStore.accessToken();

    let authenticatedRequest = request;

    if (
        accessToken &&
        !isPublicAuthRequest
    ) {
        authenticatedRequest = request.clone({
            setHeaders: {
                Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
        });
    } else {
        authenticatedRequest = request.clone({
            withCredentials: true,
        });
    }

    return next(authenticatedRequest).pipe(
        catchError(
            (error: HttpErrorResponse) => {
                if (
                    error.status !== 401 ||
                    isPublicAuthRequest
                ) {
                    return throwError(() => error);
                }

                return refreshService
                    .refreshSession()
                    .pipe(
                        switchMap(session => {
                            const retryRequest =
                                request.clone({
                                    setHeaders: {
                                        Authorization:
                                            `Bearer ${session.tokens.accessToken}`,
                                    },
                                    withCredentials: true,
                                });

                            return next(retryRequest);
                        }),
                        catchError(refreshError => {
                            authStore.clearSession();

                            const currentUrl = router.url;

                            if (
                                !currentUrl.startsWith(
                                    '/auth/login',
                                )
                            ) {
                                void router.navigate(
                                    ['/auth/login'],
                                    {
                                        queryParams: {
                                            redirectUrl:
                                                currentUrl,
                                        },
                                    },
                                );
                            }

                            return throwError(
                                () => refreshError,
                            );
                        }),
                    );
            },
        ),
    );
};
