import { RenderMode, ServerRoute } from '@angular/ssr';
import { PUBLIC_PATHS } from './shared/seo/seo-config';

// Never discover or prerender authentication, invitation or workspace URLs.
export const serverRoutes: ServerRoute[] = [
  ...[...PUBLIC_PATHS, 'privacy-policy', 'terms-and-conditions', 'reviews', '404'].map(
    (path): ServerRoute => ({
      path,
      renderMode: RenderMode.Prerender,
    }),
  ),
  { path: '**', renderMode: RenderMode.Client },
];
