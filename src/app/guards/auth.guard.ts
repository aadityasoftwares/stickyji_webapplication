import { inject } from '@angular/core';
import {
    CanActivateFn,
    Router,
} from '@angular/router';
import { AuthStore } from '../public/auth/state/auth.store';
import { APP_ROUTES, routeCommands } from '../shared/constants/route.constants';


export const authGuard: CanActivateFn = (
    route,
    state,
) => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (authStore.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(
        routeCommands(APP_ROUTES.LOGIN),
        {
            queryParams: {
                redirectUrl: state.url,
            },
        },
    );
};

export const guestGuard: CanActivateFn = () => {
    const authStore = inject(AuthStore);
    const router = inject(Router);

    if (!authStore.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(routeCommands(APP_ROUTES.APP));
};
