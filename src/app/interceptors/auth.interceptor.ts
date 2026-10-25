import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthRefreshService } from '../public/auth/services/auth-refresh.service';
import { AuthStore } from '../public/auth/state/auth.store';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  PUBLIC_AUTH_ENDPOINTS,
} from '../shared/constants/api.constants';
import { APP_ROUTES, routeCommands } from '../shared/constants/route.constants';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const refreshService = inject(AuthRefreshService);
  const router = inject(Router);

  const isOurApi = request.url.startsWith(API_BASE_URL);

  if (!isOurApi) {
    return next(request);
  }

  // Public catalogue failures must not redirect website visitors to sign in.
  if (request.method === 'GET' && request.url.split('?')[0] === API_ENDPOINTS.plans.getAll) {
    return next(request);
  }

  const isPublicAuthRequest = PUBLIC_AUTH_ENDPOINTS.some((endpoint) =>
    request.url.includes(endpoint),
  );

  const isLogoutRequest =
    request.url.startsWith(API_ENDPOINTS.auth.logout) ||
    request.url.startsWith(API_ENDPOINTS.auth.logoutAll) ||
    request.url.includes('/auth/logout') ||
    request.url.includes('/user/logout');

  const accessToken = authStore.accessToken();

  let authenticatedRequest = request;

  if (accessToken && !isPublicAuthRequest) {
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

  // Bypass 401 token refresh on logout so requests proceed directly to backend logoutAuthMiddleware
  if (isLogoutRequest) {
    return next(authenticatedRequest);
  }

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isPublicAuthRequest) {
        return throwError(() => error);
      }

      return refreshService.refreshSession().pipe(
        switchMap((session) => {
          const retryRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${session.tokens.accessToken}`,
            },
            withCredentials: true,
          });

          return next(retryRequest);
        }),
        catchError((refreshError) => {
          authStore.clearSession();

          const currentUrl = router.url;

          if (!currentUrl.startsWith(APP_ROUTES.LOGIN)) {
            void router.navigate(routeCommands(APP_ROUTES.LOGIN), {
              queryParams: {
                redirectUrl: currentUrl,
              },
            });
          }

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
