import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SeoService,
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { root: { firstChild: null } } },
      ],
    });

    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    document = TestBed.inject(DOCUMENT);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update title and open graph title', () => {
    service.setTitle('Test Page Title | Sticky Ji');
    expect(titleService.getTitle()).toBe('Test Page Title | Sticky Ji');
    const tag = metaService.getTag('property="og:title"');
    expect(tag?.content).toBe('Test Page Title | Sticky Ji');
  });

  it('should update description and twitter description', () => {
    service.setDescription('A test description for Sticky Ji');
    const metaDesc = metaService.getTag('name="description"');
    expect(metaDesc?.content).toBe('A test description for Sticky Ji');
    const twDesc = metaService.getTag('name="twitter:description"');
    expect(twDesc?.content).toBe('A test description for Sticky Ji');
  });

  it('should set canonical link in document head', () => {
    service.setCanonicalUrl('/auth/login');
    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).toBeTruthy();
    expect(canonical?.getAttribute('href')).toContain('/auth/login');
  });

  it('should set and remove JSON-LD schema', () => {
    const schema = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Sticky Ji' };
    service.setJsonLd(schema);
    let script = document.getElementById('stickyji-jsonld-schema');
    expect(script).toBeTruthy();
    expect(script?.textContent).toContain('Sticky Ji');

    service.setJsonLd(null);
    script = document.getElementById('stickyji-jsonld-schema');
    expect(script).toBeNull();
  });
});
