import { DOCUMENT } from '@angular/common';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../Environments/environments';
import { HOME_SCHEMA, PUBLIC_PAGES, SITE_URL, SeoConfig } from '../seo/seo-config';

export type { SeoConfig } from '../seo/seo-config';
export const SEO_INDEXING_ENABLED = new InjectionToken<boolean>('SEO_INDEXING_ENABLED', {
  providedIn: 'root',
  factory: () => environment.indexingEnabled,
});

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly indexingEnabled = inject(SEO_INDEXING_ENABLED);
  private routeListenerInitialized = false;

  initRouteListener(): void {
    if (this.routeListenerInitialized) return;
    this.routeListenerInitialized = true;
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      let route = this.activatedRoute.root;
      while (route.firstChild) route = route.firstChild;
      const path = this.path(this.router.url);
      const key = path.slice(1);
      const page = Object.hasOwn(PUBLIC_PAGES, key) ? PUBLIC_PAGES[key] : undefined;
      const data = route.snapshot.data;
      this.update({
        title: page?.title ?? route.snapshot.title ?? 'Sticky Ji Workspace',
        description:
          page?.description ?? data['description'] ?? 'Sign in to access your Sticky Ji workspace.',
        canonicalUrl: path,
        robots: page ? 'index, follow, max-image-preview:large' : 'noindex, follow',
        jsonLd: path === '/' ? HOME_SCHEMA : null,
      });
    });
  }

  update(config: SeoConfig = {}): void {
    const title = config.title || PUBLIC_PAGES[''].title;
    const description = config.description || PUBLIC_PAGES[''].description;
    this.document.documentElement.lang = 'en';
    this.setTitle(title);
    this.setDescription(description);
    this.metaService.removeTag('name="keywords"');
    this.setRobots(config.robots || 'noindex, follow');
    this.setCanonicalUrl(config.canonicalUrl || this.router.url || '/');
    this.metaService.updateTag({ property: 'og:title', content: config.ogTitle || title });
    this.metaService.updateTag({
      property: 'og:description',
      content: config.ogDescription || description,
    });
    this.metaService.updateTag({ property: 'og:type', content: config.ogType || 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Sticky Ji' });
    const image = SITE_URL + this.path(config.ogImage || '/StickyJiLogo.png');
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:image:alt', content: 'Sticky Ji logo' });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary' });
    this.metaService.updateTag({ name: 'twitter:image', content: image });
    this.metaService.updateTag({ name: 'twitter:image:alt', content: 'Sticky Ji logo' });
    this.setJsonLd(config.jsonLd ?? null);
  }

  setTitle(title: string): void {
    this.titleService.setTitle(title);
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
  }

  setDescription(description: string): void {
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
  }

  setRobots(robots: string): void {
    this.metaService.updateTag({
      name: 'robots',
      content: this.indexingEnabled ? robots : 'noindex, nofollow',
    });
  }

  setCanonicalUrl(url: string): void {
    const canonical = SITE_URL + this.path(url);
    this.document.querySelectorAll('link[rel="canonical"]').forEach((tag) => tag.remove());
    const link = this.document.createElement('link');
    link.rel = 'canonical';
    link.href = canonical;
    this.document.head.appendChild(link);
    this.metaService.updateTag({ property: 'og:url', content: canonical });
  }

  setJsonLd(schema: SeoConfig['jsonLd']): void {
    this.document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((tag) => tag.remove());
    if (!schema) return;
    const script = this.document.createElement('script');
    script.id = 'stickyji-jsonld-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }

  private path(value: string): string {
    const pathname = new URL(value, SITE_URL + '/').pathname
      .split('/')
      .map((segment) => segment.split(';')[0])
      .join('/')
      .replace(/\/+$/, '');
    return !pathname || pathname === '/home' ? '/' : pathname;
  }
}
