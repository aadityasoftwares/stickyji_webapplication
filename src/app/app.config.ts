import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { AppPreloadingStrategy } from './shared/services/app-preloading.strategy';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './public/auth/services/auth-service';
import { AppErrorHandler } from './shared/services/app-error-handler.service';
import { SeoService } from './shared/services/seo.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: ErrorHandler,
      useClass: AppErrorHandler,
    },

    provideRouter(
      routes,
      withPreloading(AppPreloadingStrategy),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),

    provideHttpClient(withInterceptors([authInterceptor])),

    provideAppInitializer(() => {
      const authService = inject(AuthService);
      const seoService = inject(SeoService);
      seoService.initRouteListener();
      // Public pages can render while the cookie-based session is restored.
      // Protected routes await the same shared request in authGuard.
      authService.initializeSession().subscribe();
    }),
  ],
};
