import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Subject } from 'rxjs';
import { appConfig } from '../../app.config';
import { AuthService } from '../../public/auth/services/auth-service';
import { AuthStore } from '../../public/auth/state/auth.store';
import { AppPreloadingStrategy } from './app-preloading.strategy';
import { SeoService } from './seo.service';

describe('Initial page performance', () => {
  it('does not hold application startup until the refresh endpoint responds', async () => {
    const pendingRefresh = new Subject<boolean>();
    const auth = { initializeSession: vi.fn(() => pendingRefresh) };
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        { provide: AuthService, useValue: auth },
        { provide: SeoService, useValue: { initRouteListener: vi.fn() } },
      ],
    });
    // TestBed runs the app initializers when it creates the injector.
    const status = TestBed.inject(ApplicationInitStatus);
    await status.donePromise;
    expect(status.done).toBe(true);
    expect(auth.initializeSession).toHaveBeenCalledOnce();
    pendingRefresh.complete();
  });

  it('preloads public navigation, skips showcase, and waits for login before private preloading', () => {
    let authenticated = false;
    TestBed.configureTestingModule({
      providers: [{ provide: AuthStore, useValue: { isAuthenticated: () => authenticated } }],
    });
    const strategy = TestBed.inject(AppPreloadingStrategy);
    const load = vi.fn(() => EMPTY);
    strategy.preload({ path: 'auth' }, load).subscribe();
    expect(load).toHaveBeenCalledTimes(1);
    strategy.preload({ path: 'showcase' }, load).subscribe();
    strategy.preload({ path: 'app' }, load).subscribe();
    expect(load).toHaveBeenCalledTimes(1);
    authenticated = true;
    strategy.preload({ path: 'app' }, load).subscribe();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
