import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../Environments/environments';

export interface IStickyJiBlogAuthor {
  _id: string;
  name: string;
  slug: string;
  designation?: string;
  biography?: string;
  profileImageMediaId?: {
    publicUrl?: string;
  } | string | null;
  socialLinks?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface IStickyJiBlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface IStickyJiBlogTag {
  _id: string;
  name: string;
  slug: string;
}

export interface IStickyJiBlog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  readingTime: number;
  wordCount: number;
  publishedAt?: string;
  updatedAt?: string;
  isFeatured?: boolean;
  featuredImageMediaId?: {
    publicUrl?: string;
    originalFileName?: string;
  } | null;
  featuredImageAlt?: string;
  categoryIds?: IStickyJiBlogCategory[];
  tagIds?: IStickyJiBlogTag[];
  authorId?: IStickyJiBlogAuthor;
  seo?: {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
}

export interface StickyJiPaginatedResponse<T> {
  status: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StickyJiApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class StickyJiBlogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/public/blog`;
  readonly websiteSlug = 'stickyji';

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'x-website-slug': this.websiteSlug,
    });
  }

  private buildParams(filterObj: Record<string, any>): HttpParams {
    let params = new HttpParams().set('websiteSlug', this.websiteSlug);
    Object.keys(filterObj).forEach((key) => {
      const val = filterObj[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, String(val));
      }
    });
    return params;
  }

  getArticles(filter: Record<string, any> = {}): Observable<StickyJiPaginatedResponse<IStickyJiBlog>> {
    return this.http.get<StickyJiPaginatedResponse<IStickyJiBlog>>(this.baseUrl, {
      headers: this.headers,
      params: this.buildParams(filter),
    });
  }

  getArticleBySlug(slug: string): Observable<StickyJiApiResponse<IStickyJiBlog>> {
    return this.http.get<StickyJiApiResponse<IStickyJiBlog>>(`${this.baseUrl}/${slug}`, {
      headers: this.headers,
      params: new HttpParams().set('websiteSlug', this.websiteSlug),
    });
  }

  getCategories(): Observable<StickyJiPaginatedResponse<IStickyJiBlogCategory>> {
    return this.http.get<StickyJiPaginatedResponse<IStickyJiBlogCategory>>(`${this.baseUrl}/categories`, {
      headers: this.headers,
      params: new HttpParams().set('websiteSlug', this.websiteSlug).set('limit', '100'),
    });
  }

  getCategoryBySlug(slug: string): Observable<StickyJiApiResponse<IStickyJiBlogCategory>> {
    return this.http.get<StickyJiApiResponse<IStickyJiBlogCategory>>(`${this.baseUrl}/categories/${slug}`, {
      headers: this.headers,
      params: new HttpParams().set('websiteSlug', this.websiteSlug),
    });
  }

  getTags(): Observable<StickyJiPaginatedResponse<IStickyJiBlogTag>> {
    return this.http.get<StickyJiPaginatedResponse<IStickyJiBlogTag>>(`${this.baseUrl}/tags`, {
      headers: this.headers,
      params: new HttpParams().set('websiteSlug', this.websiteSlug).set('limit', '100'),
    });
  }

  getTagBySlug(slug: string): Observable<StickyJiApiResponse<IStickyJiBlogTag>> {
    return this.http.get<StickyJiApiResponse<IStickyJiBlogTag>>(`${this.baseUrl}/tags/${slug}`, {
      headers: this.headers,
      params: new HttpParams().set('websiteSlug', this.websiteSlug),
    });
  }

  getAuthors(): Observable<StickyJiPaginatedResponse<IStickyJiBlogAuthor>> {
    return this.http.get<StickyJiPaginatedResponse<IStickyJiBlogAuthor>>(`${this.baseUrl}/authors`, {
      headers: this.headers,
      params: new HttpParams().set('websiteSlug', this.websiteSlug).set('limit', '50'),
    });
  }

  getAuthorBySlug(slug: string): Observable<StickyJiApiResponse<IStickyJiBlogAuthor>> {
    return this.http.get<StickyJiApiResponse<IStickyJiBlogAuthor>>(`${this.baseUrl}/authors/${slug}`, {
      headers: this.headers,
      params: new HttpParams().set('websiteSlug', this.websiteSlug),
    });
  }

  getRelatedArticles(blogId: string): Observable<StickyJiApiResponse<IStickyJiBlog[]>> {
    return this.http.get<StickyJiApiResponse<IStickyJiBlog[]>>(`${this.baseUrl}/related/${blogId}`, {
      headers: this.headers,
      params: new HttpParams().set('websiteSlug', this.websiteSlug),
    });
  }
}
