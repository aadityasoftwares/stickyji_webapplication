import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './public/auth/services/auth-service';
import { AppErrorHandler } from './shared/services/app-error-handler.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: ErrorHandler,
      useClass: AppErrorHandler,
    },

    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),

    provideHttpClient(withInterceptors([authInterceptor])),

    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return firstValueFrom(authService.initializeSession());
    }),
  ],
};
