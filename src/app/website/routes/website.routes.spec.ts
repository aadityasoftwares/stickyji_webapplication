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
  it('provides independent routes for features, how-it-works, use-cases, reviews, and pricing', () => {
    const childPaths = WEBSITE_ROUTES[0].children!.map((route) => route.path);
    expect(childPaths).toContain('features');
    expect(childPaths).toContain('how-it-works');
    expect(childPaths).toContain('use-cases');
    expect(childPaths).toContain('reviews');
    expect(childPaths).toContain('pricing');
  });

  it('redirects legacy stories alias to reviews', () => {
    const storiesRoute = WEBSITE_ROUTES[0].children!.find((route) => route.path === 'stories');
    expect(storiesRoute).toBeDefined();
    expect(storiesRoute?.redirectTo).toBe('reviews');
  });
});
