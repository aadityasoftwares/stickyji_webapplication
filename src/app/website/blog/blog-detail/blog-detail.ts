import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IStickyJiBlog,
  IStickyJiBlogAuthor,
  IStickyJiBlogCategory,
  StickyJiBlogService,
} from '../services/stickyji-blog.service';

export interface StickyJiTocItem {
  id: string;
  text: string;
  level: number;
}

@Component({
  selector: 'app-stickyji-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-detail.html',
  styleUrls: ['./blog-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyJiBlogDetail implements OnInit, OnDestroy {
  private readonly blogService = inject(StickyJiBlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly article = signal<IStickyJiBlog | null>(null);
  readonly relatedArticles = signal<IStickyJiBlog[]>([]);
  readonly tocItems = signal<StickyJiTocItem[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isCopied = signal<boolean>(false);
  readonly safeContent = signal<SafeHtml>('');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading.set(false);
      return;
    }

    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadArticle(slug);
      }
    });
  }

  ngOnDestroy(): void {
    this.removeJsonLd();
  }

  loadArticle(slug: string): void {
    this.isLoading.set(true);

    this.blogService.getArticleBySlug(slug).subscribe({
      next: (res) => {
        const blog = res.data;
        if (!blog) {
          this.router.navigate(['/blog']);
          return;
        }

        this.article.set(blog);

        // Sanitize & build TOC
        const rawHtml = typeof blog.content === 'string' ? blog.content : '';
        const { processedHtml, toc } = this.processContentAndToc(rawHtml);
        this.safeContent.set(this.sanitizer.bypassSecurityTrustHtml(processedHtml));
        this.tocItems.set(toc);

        // Apply SEO & Structured Data
        this.applySeoMetadata(blog);

        // Related articles
        this.blogService.getRelatedArticles(blog._id).subscribe({
          next: (relatedRes) => this.relatedArticles.set(relatedRes?.data || []),
        });

        this.isLoading.set(false);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/blog']);
      },
    });
  }

  private processContentAndToc(html: string): { processedHtml: string; toc: StickyJiTocItem[] } {
    const toc: StickyJiTocItem[] = [];
    if (!html) return { processedHtml: '', toc: [] };

    let headingIndex = 0;
    const processedHtml = html.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (_match, tag, attrs, text) => {
      headingIndex++;
      const plainText = text.replace(/<[^>]+>/g, '').trim();
      const slugId =
        plainText
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-') || `section-${headingIndex}`;

      toc.push({
        id: slugId,
        text: plainText,
        level: tag.toLowerCase() === 'h2' ? 2 : 3,
      });

      return `<${tag} id="${slugId}"${attrs}>${text}</${tag}>`;
    });

    return { processedHtml, toc };
  }

  scrollToSection(id: string): void {
    const el = this.document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getPrimaryCategory(article: IStickyJiBlog): IStickyJiBlogCategory | null {
    if (article.categoryIds && article.categoryIds.length > 0) {
      return article.categoryIds[0];
    }
    return null;
  }

  getCoverImageUrl(article: IStickyJiBlog): string {
    if (article.featuredImageMediaId?.publicUrl) {
      return article.featuredImageMediaId.publicUrl;
    }
    return '/placeholders/sticky-blog-placeholder.jpg';
  }

  shareOnTwitter(): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(this.article()?.title || '');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  }

  shareOnLinkedIn(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2500);
    });
  }

  private applySeoMetadata(blog: IStickyJiBlog): void {
    const seo = blog.seo || {};
    const title = seo.title || blog.title;
    const description = seo.description || blog.excerpt;
    const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://stickyji.com/blog/${blog.slug}`;
    const coverUrl = blog.featuredImageMediaId?.publicUrl || '';

    this.titleService.setTitle(`${title} | Sticky Ji`);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'robots', content: seo.robots || 'index, follow' });

    // OG & Twitter
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:title', content: seo.ogTitle || title });
    this.metaService.updateTag({ property: 'og:description', content: seo.ogDescription || description });
    this.metaService.updateTag({ property: 'og:url', content: pageUrl });
    if (coverUrl) this.metaService.updateTag({ property: 'og:image', content: coverUrl });

    this.injectJsonLd(blog, pageUrl, coverUrl);
  }

  private injectJsonLd(blog: IStickyJiBlog, url: string, imageUrl: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.removeJsonLd();

    const category = this.getPrimaryCategory(blog);

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          '@id': `${url}#article`,
          author: {
            '@type': 'Person',
            name: blog.authorId?.name || 'Sticky Ji Team',
            jobTitle: blog.authorId?.designation,
          },
          headline: blog.title,
          description: blog.excerpt,
          datePublished: blog.publishedAt,
          dateModified: blog.updatedAt || blog.publishedAt,
          mainEntityOfPage: url,
          image: imageUrl || undefined,
          publisher: {
            '@type': 'Organization',
            name: 'Sticky Ji',
            url: 'https://stickyji.com',
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://stickyji.com',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Blog',
              item: 'https://stickyji.com/blog',
            },
            ...(category
              ? [
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: category.name,
                    item: `https://stickyji.com/blog/category/${category.slug}`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 4,
                    name: blog.title,
                    item: url,
                  },
                ]
              : [
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: blog.title,
                    item: url,
                  },
                ]),
          ],
        },
      ],
    };

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'stickyji-blog-jsonld';
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  private removeJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.document.getElementById('stickyji-blog-jsonld');
    if (el) el.remove();
  }
}
