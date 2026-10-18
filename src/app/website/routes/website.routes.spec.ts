import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RedirectFunction } from '@angular/router';
import { WEBSITE_ROUTES } from './website.routes';
import { routes } from '../../app.routes';

describe('Website routes', () => {
  it('keeps the website fallback after auth and app routes', () => {
    expect(routes.at(-1)?.path).toBe('');
    expect(routes.findIndex((route) => route.path === 'auth')).toBeLessThan(routes.length - 1);
    expect(routes.findIndex((route) => route.path === 'app')).toBeLessThan(routes.length - 1);
  });
  it('maps direct section URLs to homepage fragments', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const router = TestBed.inject(Router);
    for (const [path, fragment] of [
      ['pricing', 'pricing'],
      ['features', 'features'],
      ['stories', 'reviews'],
    ]) {
      const redirect = WEBSITE_ROUTES[0].children!.find((route) => route.path === path)!
        .redirectTo as RedirectFunction;
      const tree = TestBed.runInInjectionContext(() =>
        redirect({} as Parameters<RedirectFunction>[0]),
      );
      expect(router.serializeUrl(tree as ReturnType<Router['createUrlTree']>)).toBe(
        '/home#' + fragment,
      );
    }
  });
});
