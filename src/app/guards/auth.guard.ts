import { inject } from '@angular/core';
import { filter, map, take } from 'rxjs';
import { UserPreferenceStore } from '../private/user-preferences/services/user-preference.store';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../public/auth/state/auth.store';
import { APP_ROUTES, routeCommands } from '../shared/constants/route.constants';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    const preferences = inject(UserPreferenceStore);
    if (preferences.ready()) return true;
    preferences.load();
    return preferences.ready$.pipe(
      filter((ready) => ready && preferences.ready()),
      take(1),
      map(() => true),
    );
  }

  return router.createUrlTree(routeCommands(APP_ROUTES.LOGIN), {
    queryParams: {
      redirectUrl: state.url,
    },
  });
};

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(routeCommands(APP_ROUTES.APP));
};
