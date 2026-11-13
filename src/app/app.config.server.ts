import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { HttpBackend, HttpEvent, HttpRequest } from '@angular/common/http';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { Observable } from 'rxjs';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/** Fail the build if a future marketing component tries to fetch account or API data. */
export class PrerenderHttpBackend implements HttpBackend {
  handle(_request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    throw new Error(
      'HTTP requests are forbidden during public-page prerendering. Load dynamic data in the browser.',
    );
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: HttpBackend, useClass: PrerenderHttpBackend },
  ],
};
export const config = mergeApplicationConfig(appConfig, serverConfig);
