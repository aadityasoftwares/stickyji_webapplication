import { inject } from '@angular/core';
import { filter, map, of, switchMap, take } from 'rxjs';
import { AuthService } from '../public/auth/services/auth-service';
import { UserPreferenceStore } from '../private/user-preferences/services/user-preference.store';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../public/auth/state/auth.store';
import { APP_ROUTES, routeCommands } from '../shared/constants/route.constants';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const preferences = inject(UserPreferenceStore);
  const initialized$ = authStore.initialized()
    ? of(authStore.isAuthenticated())
    : inject(AuthService).initializeSession();

  return initialized$.pipe(
    switchMap(() => {
      if (authStore.isAuthenticated()) {
        if (preferences.ready()) return of(true);
        preferences.load();
        return preferences.ready$.pipe(
          filter((ready) => ready && preferences.ready()),
          take(1),
          map(() => true),
        );
      }

      return of(
        router.createUrlTree(routeCommands(APP_ROUTES.LOGIN), {
          queryParams: {
            redirectUrl: state.url,
          },
        }),
      );
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const initialized$ = authStore.initialized()
    ? of(authStore.isAuthenticated())
    : inject(AuthService).initializeSession();
  return initialized$.pipe(
    map(() =>
      authStore.isAuthenticated() ? router.createUrlTree(routeCommands(APP_ROUTES.APP)) : true,
    ),
  );
};
