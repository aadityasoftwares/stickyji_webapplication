import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  readonly defaultTitle =
    'Sticky Ji — Visual Sticky Notes, Mindful Task Planner & Calmer Workspace';
  readonly defaultDescription =
    'Sticky Ji brings your notes, tasks, and everyday plans together on a calm, visual canvas with colorful sticky notes, smart folders, and a focused daily workflow.';
  readonly defaultKeywords =
    'sticky notes, visual notes, digital sticky notes, task manager, kanban board, personal productivity, thought organizer, workspace planner';
  readonly defaultImage = '/StickyJiLogo.png';
  readonly defaultRobots = 'index, follow';

  private routeListenerInitialized = false;

  /**
   * Initializes automatic route listening to apply SEO data specified in Route definition data.
   */
  initRouteListener(): void {
    if (this.routeListenerInitialized) return;
    this.routeListenerInitialized = true;

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        let currentRoute: ActivatedRoute | null = this.activatedRoute.root;
        while (currentRoute?.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        const snapshot = currentRoute?.snapshot;
        const routeData = snapshot?.data ?? {};
        const routeTitle = snapshot?.title ?? routeData['title'];

        this.update({
          title: routeTitle,
          description: routeData['description'],
          keywords: routeData['keywords'],
          canonicalUrl: routeData['canonicalUrl'] || this.router.url.split('?')[0],
          robots: routeData['robots'],
          ogTitle: routeData['ogTitle'] || routeTitle,
          ogDescription: routeData['ogDescription'] || routeData['description'],
          ogImage: routeData['ogImage'],
          ogType: routeData['ogType'],
          jsonLd: routeData['jsonLd'],
        });
      });
  }

  /**
   * Updates multiple SEO tags and structured data in one call.
   */
  update(config: SeoConfig = {}): void {
    const title = config.title?.trim() || this.defaultTitle;
    this.setTitle(title);

    const description = config.description?.trim() || this.defaultDescription;
    this.setDescription(description);

    const keywords = config.keywords ?? this.defaultKeywords;
    this.setKeywords(keywords);

    const robots = config.robots || this.defaultRobots;
    this.setRobots(robots);

    const canonical =
      config.canonicalUrl || (this.document.location ? this.document.location.pathname : '/');
    this.setCanonicalUrl(canonical);

    // Open Graph
    this.setOpenGraph({
      title: config.ogTitle || title,
      description: config.ogDescription || description,
      image: config.ogImage || this.defaultImage,
      type: config.ogType || 'website',
      url: config.ogUrl || this.getFullUrl(canonical),
    });

    // Twitter
    this.setTwitter({
      card: config.twitterCard || 'summary_large_image',
      title: config.twitterTitle || config.ogTitle || title,
      description: config.twitterDescription || config.ogDescription || description,
      image: config.twitterImage || config.ogImage || this.defaultImage,
    });

    // JSON-LD structured data
    if (config.jsonLd !== undefined) {
      this.setJsonLd(config.jsonLd);
    }
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

  setKeywords(keywords: string | string[]): void {
    const content = Array.isArray(keywords) ? keywords.join(', ') : keywords;
    this.metaService.updateTag({ name: 'keywords', content });
  }

  setRobots(robots: string): void {
    this.metaService.updateTag({ name: 'robots', content: robots });
  }

  setCanonicalUrl(url: string): void {
    const fullUrl = this.getFullUrl(url);
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', fullUrl);
    this.metaService.updateTag({ property: 'og:url', content: fullUrl });
  }

  setOpenGraph(data: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  }): void {
    if (data.title) this.metaService.updateTag({ property: 'og:title', content: data.title });
    if (data.description)
      this.metaService.updateTag({ property: 'og:description', content: data.description });
    if (data.image) {
      const fullImg = this.getFullUrl(data.image);
      this.metaService.updateTag({ property: 'og:image', content: fullImg });
    }
    if (data.type) this.metaService.updateTag({ property: 'og:type', content: data.type });
    if (data.url) this.metaService.updateTag({ property: 'og:url', content: data.url });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Sticky Ji' });
  }

  setTwitter(data: { card?: string; title?: string; description?: string; image?: string }): void {
    if (data.card) this.metaService.updateTag({ name: 'twitter:card', content: data.card });
    if (data.title) this.metaService.updateTag({ name: 'twitter:title', content: data.title });
    if (data.description)
      this.metaService.updateTag({ name: 'twitter:description', content: data.description });
    if (data.image) {
      const fullImg = this.getFullUrl(data.image);
      this.metaService.updateTag({ name: 'twitter:image', content: fullImg });
    }
  }

  setJsonLd(schema: Record<string, unknown> | Array<Record<string, unknown>> | null): void {
    const scriptId = 'stickyji-jsonld-schema';
    const existing = this.document.getElementById(scriptId);

    if (!schema) {
      existing?.remove();
      return;
    }

    let script = existing as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema, null, 2);
  }

  private getFullUrl(pathOrUrl: string): string {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    const origin =
      this.document.location?.origin && this.document.location.origin !== 'null'
        ? this.document.location.origin
        : 'https://stickyji.app';
    const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${origin}${cleanPath}`;
  }
}
