import { DOCUMENT } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SeoService, SEO_INDEXING_ENABLED } from './seo.service';
import { PUBLIC_PAGES } from '../seo/seo-config';

@Component({ template: '' })
class Page {}

describe('SEO route lifecycle', () => {
  let service: SeoService;
  let document: Document;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Page, title: PUBLIC_PAGES[''].title },
          { path: 'features', component: Page, title: PUBLIC_PAGES['features'].title },
          { path: 'auth/login', component: Page, title: 'Sign in' },
          { path: 'app/today', component: Page, title: 'Today' },
          { path: '**', component: Page, title: 'Page not found' },
        ]),
        { provide: SEO_INDEXING_ENABLED, useValue: true },
      ],
    });
    service = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
  });

  it('pins canonicals to production, strips query/fragment/matrix params, and deduplicates', () => {
    document.head.insertAdjacentHTML(
      'beforeend',
      '<link rel="canonical" href="https://wrong.example"><link rel="canonical" href="/">',
    );
    service.setCanonicalUrl(
      'https://staging.stickyji.com/features;view=grid/?utm_source=test#detail',
    );
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://stickyji.com/features',
    );
    service.setCanonicalUrl('/home?ref=test');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://stickyji.com/',
    );
  });

  it('updates public metadata and clears schema on navigation into auth or private routes', async () => {
    service.initRouteListener();
    service.initRouteListener();
    const harness = await RouterTestingHarness.create('/');
    expect(document.title).toBe(PUBLIC_PAGES[''].title);
    expect(document.querySelectorAll('script[type="application/ld+json"]').length).toBe(1);
    await harness.navigateByUrl('/features?utm_source=test#details');
    expect(document.title).toBe(PUBLIC_PAGES['features'].title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      PUBLIC_PAGES['features'].description,
    );
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://stickyji.com/features',
    );
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
    for (const path of [
      '/auth/login?returnUrl=/app/today',
      '/app/today',
      '/missing',
      '/constructor',
    ]) {
      await harness.navigateByUrl(path);
      expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain(
        'noindex',
      );
      expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
    }
    await harness.navigateByUrl('/');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).not.toContain(
      'noindex',
    );
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
  });

  it('resets overrides and removes obsolete keyword tags', () => {
    document.head.insertAdjacentHTML('beforeend', '<meta name="keywords" content="obsolete">');
    service.update({ title: 'Custom', ogType: 'article', jsonLd: { '@type': 'Article' } });
    service.update({ title: 'Next page', canonicalUrl: '/features' });
    expect(TestBed.inject(Title).getTitle()).toBe('Next page');
    expect(TestBed.inject(Meta).getTag('name="twitter:title"')?.content).toBe('Next page');
    expect(document.querySelector('meta[name="keywords"]')).toBeNull();
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe(
      'website',
    );
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('serializes schema safely and removes it when omitted', () => {
    const schema = { '@context': 'https://schema.org', name: '</script><script>bad</script>' };
    service.setJsonLd(schema);
    const text = document.getElementById('stickyji-jsonld-schema')!.textContent!;
    expect(text).not.toContain('<');
    expect(JSON.parse(text)).toEqual(schema);
    service.update();
    expect(document.getElementById('stickyji-jsonld-schema')).toBeNull();
  });
});

describe('Non-production SEO', () => {
  it('overrides an indexing request on staging/development', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SEO_INDEXING_ENABLED, useValue: false }],
    });
    TestBed.inject(SeoService).update({ robots: 'index, follow' });
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, nofollow');
  });
});
