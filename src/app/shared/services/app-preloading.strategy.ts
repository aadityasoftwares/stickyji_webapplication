import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY, Observable, catchError } from 'rxjs';
import { AuthStore } from '../../public/auth/state/auth.store';

/** Warm navigation chunks after routing, without loading private screens for guests. */
@Injectable({ providedIn: 'root' })
export class AppPreloadingStrategy implements PreloadingStrategy {
  private readonly platform = inject(PLATFORM_ID);
  private readonly auth = inject(AuthStore);

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (!isPlatformBrowser(this.platform) || !this.auth.isAuthenticated()) return EMPTY;
    const connection =
      typeof navigator === 'undefined'
        ? undefined
        : (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
            .connection;
    if (connection?.saveData || connection?.effectiveType?.includes('2g')) return EMPTY;
    if (route.path === 'showcase') return EMPTY;
    if (route.path === 'app' && !this.auth.isAuthenticated()) return EMPTY;
    return load().pipe(catchError(() => EMPTY));
  }
}
