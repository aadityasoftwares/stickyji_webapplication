import { HttpRequest } from '@angular/common/http';
import { PrerenderHttpBackend } from './app.config.server';
import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

describe('Prerender privacy boundary', () => {
  it('rejects every network call during rendering, including public catalogues', () => {
    const backend = new PrerenderHttpBackend();
    expect(() => backend.handle(new HttpRequest('GET', '/api/v1/notes'))).toThrow(/forbidden/);
    expect(() => backend.handle(new HttpRequest('GET', '/api/v1/plans'))).toThrow(/forbidden/);
  });
  it('keeps auth and private paths outside the render allowlist', () => {
    expect(serverRoutes.at(-1)).toEqual({ path: '**', renderMode: RenderMode.Client });
    expect(
      serverRoutes.slice(0, -1).every((route) => route.renderMode === RenderMode.Prerender),
    ).toBe(true);
    expect(
      serverRoutes.some((route) => /^(app|auth|workspace-invitations)(\/|$)/.test(route.path)),
    ).toBe(false);
  });
});
