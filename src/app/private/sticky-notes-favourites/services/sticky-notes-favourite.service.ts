import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../../Environments/environments';
import { idOf } from '../../../shared/functions/common.function';

@Injectable({
  providedIn: 'root'
})
export class StickyNotesFavouriteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private readonly favoriteBaseUrl = `${this.baseUrl}/stickynotefavorites`;

  /**
   * Fetch all favourite sticky notes with optional filters and pagination.
   * Query params: stickyNoteId, status, page, limit, sortBy, sortOrder
   */
  getAll(payload: any = {}): Observable<any> {
    const params = this.createHttpParams(payload);
    return this.http.get<any>(
      `${this.favoriteBaseUrl}/getall`,
      {
        params,
        withCredentials: true
      }
    );
  }

  /**
   * Fetch a single favourite record by its favourite ID.
   */
  getById(id: string): Observable<any> {
    const targetId = idOf(id);
    return this.http.get<any>(
      `${this.favoriteBaseUrl}/get/${encodeURIComponent(targetId)}`,
      { withCredentials: true }
    );
  }

  /**
   * Add a sticky note to favourites.
   * Backend expects { stickyNoteId: string }
   */
  create(payload: any): Observable<any> {
    const stickyNoteId = idOf(
      typeof payload === 'string'
        ? payload
        : payload?.stickyNoteId ?? payload?.id ?? payload?._id
    );

    return this.http.post<any>(
      `${this.favoriteBaseUrl}/create`,
      { stickyNoteId },
      { withCredentials: true }
    );
  }

  /**
   * Helper alias to add a sticky note to favourites by note ID.
   */
  addFavorite(stickyNoteId: string): Observable<any> {
    return this.create({ stickyNoteId });
  }

  /**
   * Update favourite status (e.g. 'ACTIVE' or 'DELETED').
   */
  updateStatus(id: string, status: any): Observable<any> {
    const targetId = idOf(id);
    return this.http.put<any>(
      `${this.favoriteBaseUrl}/status/${encodeURIComponent(targetId)}`,
      { status },
      { withCredentials: true }
    );
  }

  /**
   * Remove a sticky note from favourites (soft-delete).
   */
  delete(id: string): Observable<any> {
    const targetId = idOf(id);
    return this.http.delete<any>(
      `${this.favoriteBaseUrl}/delete/${encodeURIComponent(targetId)}`,
      { withCredentials: true }
    );
  }

  /**
   * Helper alias to remove from favourites by favourite ID.
   */
  removeFavorite(id: string): Observable<any> {
    return this.delete(id);
  }

  /**
   * Restore a soft-deleted favourite record.
   */
  restore(id: string): Observable<any> {
    const targetId = idOf(id);
    return this.http.put<any>(
      `${this.favoriteBaseUrl}/restore/${encodeURIComponent(targetId)}`,
      {},
      { withCredentials: true }
    );
  }

  /**
   * Toggles a note's favourite state:
   * If currentFavoriteId is provided, removes it.
   * Otherwise, creates a new favourite for stickyNoteId.
   */
  toggle(stickyNoteId: string, currentFavoriteId?: string): Observable<any> {
    if (currentFavoriteId) {
      return this.delete(currentFavoriteId);
    }
    return this.addFavorite(stickyNoteId);
  }

  private createHttpParams(payload: any): HttpParams {
    let params = new HttpParams();
    if (!payload || typeof payload !== 'object') {
      return params;
    }

    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}

/** Export alias for consistency across components */
export { StickyNotesFavouriteService as StickyNoteFavoriteApiService };
export { StickyNotesFavouriteService as StickyNoteFavoriteService };
