import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IStickyJiBlog,
  IStickyJiBlogAuthor,
  IStickyJiBlogCategory,
  IStickyJiBlogTag,
  StickyJiBlogService,
} from '../services/stickyji-blog.service';

@Component({
  selector: 'app-stickyji-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-list.html',
  styleUrls: ['./blog-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyJiBlogList implements OnInit {
  private readonly blogService = inject(StickyJiBlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly platformId = inject(PLATFORM_ID);

  readonly articles = signal<IStickyJiBlog[]>([]);
  readonly featuredArticle = signal<IStickyJiBlog | null>(null);
  readonly categories = signal<IStickyJiBlogCategory[]>([]);
  readonly currentCategory = signal<IStickyJiBlogCategory | null>(null);
  readonly currentTag = signal<IStickyJiBlogTag | null>(null);
  readonly currentAuthor = signal<IStickyJiBlogAuthor | null>(null);

  readonly isLoading = signal<boolean>(true);
  readonly searchQuery = signal<string>('');

  // Pagination
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(9);
  readonly totalArticles = signal<number>(0);
  readonly totalPages = signal<number>(1);

  readonly filterType = signal<'all' | 'category' | 'tag' | 'author'>('all');
  readonly filterSlug = signal<string | null>(null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading.set(false);
      return;
    }

    this.route.paramMap.subscribe((params) => {
      const url = this.router.url;
      this.currentPage.set(1);

      if (url.includes('/blog/category/')) {
        this.filterType.set('category');
        this.filterSlug.set(params.get('slug'));
      } else if (url.includes('/blog/tag/')) {
        this.filterType.set('tag');
        this.filterSlug.set(params.get('slug'));
      } else if (url.includes('/blog/author/')) {
        this.filterType.set('author');
        this.filterSlug.set(params.get('slug'));
      } else {
        this.filterType.set('all');
        this.filterSlug.set(null);
      }

      this.loadCategories();
      this.loadArticles();
    });
  }

  loadCategories(): void {
    this.blogService.getCategories().subscribe({
      next: (res) => this.categories.set(res?.data || []),
    });
  }

  loadArticles(): void {
    this.isLoading.set(true);

    const filter: Record<string, any> = {
      page: this.currentPage(),
      limit: this.pageSize(),
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    };

    if (this.searchQuery().trim()) {
      filter['search'] = this.searchQuery().trim();
    }

    if (this.filterType() === 'category' && this.filterSlug()) {
      this.blogService.getCategoryBySlug(this.filterSlug()!).subscribe({
        next: (catRes) => {
          this.currentCategory.set(catRes.data);
          this.updateCategorySeo(catRes.data);
          filter['categoryId'] = catRes.data._id;
          this.fetchArticlesList(filter);
        },
        error: () => this.fetchArticlesList(filter),
      });
      return;
    }

    if (this.filterType() === 'tag' && this.filterSlug()) {
      this.blogService.getTagBySlug(this.filterSlug()!).subscribe({
        next: (tagRes) => {
          this.currentTag.set(tagRes.data);
          this.updateTagSeo(tagRes.data);
          filter['tagId'] = tagRes.data._id;
          this.fetchArticlesList(filter);
        },
        error: () => this.fetchArticlesList(filter),
      });
      return;
    }

    if (this.filterType() === 'author' && this.filterSlug()) {
      this.blogService.getAuthorBySlug(this.filterSlug()!).subscribe({
        next: (authRes) => {
          this.currentAuthor.set(authRes.data);
          this.updateAuthorSeo(authRes.data);
          filter['authorId'] = authRes.data._id;
          this.fetchArticlesList(filter);
        },
        error: () => this.fetchArticlesList(filter),
      });
      return;
    }

    this.setDefaultSeo();
    this.fetchArticlesList(filter);
  }

  private fetchArticlesList(filter: Record<string, any>): void {
    this.blogService.getArticles(filter).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.totalArticles.set(res.pagination?.total || 0);
        this.totalPages.set(res.pagination?.pages || 1);

        if (this.currentPage() === 1 && this.filterType() === 'all' && !this.searchQuery()) {
          const featured = list.find((a) => a.isFeatured) || list[0] || null;
          this.featuredArticle.set(featured);
          this.articles.set(featured ? list.filter((a) => a._id !== featured._id) : list);
        } else {
          this.featuredArticle.set(null);
          this.articles.set(list);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.articles.set([]);
        this.isLoading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
    this.loadArticles();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadArticles();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  }

  getCoverImageUrl(article: IStickyJiBlog): string {
    if (article.featuredImageMediaId?.publicUrl) {
      return article.featuredImageMediaId.publicUrl;
    }
    return '/placeholders/sticky-blog-placeholder.jpg';
  }

  getCategory(article: IStickyJiBlog): IStickyJiBlogCategory | null {
    if (article.categoryIds && article.categoryIds.length > 0) {
      return article.categoryIds[0];
    }
    return null;
  }

  private setDefaultSeo(): void {
    const title = 'Productivity, Notes & Organization Blog | Sticky Ji';
    const desc =
      'Practical productivity tips, digital sticky note workflows, student organization hacks, and task management guides from the Sticky Ji team.';
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: desc });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: desc });
  }

  private updateCategorySeo(category: IStickyJiBlogCategory): void {
    const title = `${category.name} Tips & Guides | Sticky Ji Blog`;
    this.titleService.setTitle(title);
  }

  private updateTagSeo(tag: IStickyJiBlogTag): void {
    const title = `#${tag.name} Productivity Guides | Sticky Ji`;
    this.titleService.setTitle(title);
  }

  private updateAuthorSeo(author: IStickyJiBlogAuthor): void {
    const title = `Articles by ${author.name} | Sticky Ji Blog`;
    this.titleService.setTitle(title);
  }
}
