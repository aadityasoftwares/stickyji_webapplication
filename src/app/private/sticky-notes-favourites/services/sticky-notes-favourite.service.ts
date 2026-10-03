import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../shared/constants/api.constants';
import { buildHttpParams } from '../../../shared/functions/api.functions';
import { extractErrorMessage, extractList, idOf } from '../../../shared/functions/common.function';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class StickyNotesFavouriteService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
    private readonly baseUrl = API_BASE_URL;
  private readonly favoriteBaseUrl = `${this.baseUrl}/stickynotefavorites`;

  /** Reactive map of stickyNoteId -> favoriteId */
  readonly favoriteMap = signal<ReadonlyMap<string, string>>(new Map());
  /** Set of stickyNoteIds currently toggling favorite */
  readonly busyIds = signal<ReadonlySet<string>>(new Set());
  readonly loading = signal(false);
  private loaded = false;

  /**
   * Check if a note is currently favorited
   */
  isFavorite(noteId: string): boolean {
    const id = idOf(noteId);
    return Boolean(id && this.favoriteMap().has(id));
  }

  /**
   * Get the favoriteId for a noteId if known
   */
  getFavoriteId(noteId: string): string | undefined {
    const id = idOf(noteId);
    return id ? this.favoriteMap().get(id) : undefined;
  }

  /**
   * Check if a note is busy toggling favorite
   */
  isBusy(noteId: string): boolean {
    const id = idOf(noteId);
    return Boolean(id && this.busyIds().has(id));
  }

  /**
   * Directly update local map state
   */
  setFavoriteLocal(noteId: string, isFav: boolean, favId?: string): void {
    const targetNoteId = idOf(noteId);
    if (!targetNoteId) return;
    const nextMap = new Map(this.favoriteMap());
    if (isFav) {
      nextMap.set(targetNoteId, favId || nextMap.get(targetNoteId) || targetNoteId);
    } else {
      nextMap.delete(targetNoteId);
    }
    this.favoriteMap.set(nextMap);
  }

  /**
   * Populate favoriteMap from a list of favorite records
   */
  populateFavorites(list: any[]): void {
    const nextMap = new Map(this.favoriteMap());
    for (const item of list) {
      const noteDoc = item?.stickyNote ?? item?.noteDoc ?? item?.note ?? item;
      const noteId = idOf(noteDoc) || idOf(item?.stickyNoteId);
      const favId = idOf(item);
      if (noteId && favId) {
        nextMap.set(noteId, favId);
      }
    }
    this.favoriteMap.set(nextMap);
  }

  /**
   * Load all active favorites into memory
   */
  loadFavorites(force = false): Observable<ReadonlyMap<string, string>> {
    if (this.loaded && !force) {
      return of(this.favoriteMap());
    }
    this.loading.set(true);
    return this.getAll({ status: 'ACTIVE', limit: 500 }).pipe(
      tap(res => {
        const list = extractList(res);
        this.populateFavorites(list);
        this.loaded = true;
      }),
      map(() => this.favoriteMap()),
      catchError(() => of(this.favoriteMap())),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * Toggles a note's favourite state with optimistic update and toast feedback
   */
  toggleFavorite(
    noteId: string,
    currentFavoriteId?: string,
    noteTitle?: string
  ): Observable<{ isFavorite: boolean; favoriteId?: string }> {
    const targetNoteId = idOf(noteId);
    if (!targetNoteId) {
      return throwError(() => new Error('Invalid note id'));
    }

    const resolvedFavId = currentFavoriteId
      ? idOf(currentFavoriteId)
      : this.getFavoriteId(targetNoteId);

    this.setBusy(targetNoteId, true);

    if (resolvedFavId) {
      // Remove from favorites
      return this.delete(resolvedFavId).pipe(
        tap(() => {
          this.setFavoriteLocal(targetNoteId, false);
          this.toastService.success(
            noteTitle ? `Removed "${noteTitle}" from favourites` : 'Removed from favourites',
            { dedupeKey: `fav-rem-${targetNoteId}` }
          );
        }),
        map(() => ({ isFavorite: false, favoriteId: undefined })),
        catchError(error => {
          this.toastService.error(
            extractErrorMessage(error, 'Could not remove from favourites.'),
            { dedupeKey: `fav-err-${targetNoteId}` }
          );
          return throwError(() => error);
        }),
        finalize(() => this.setBusy(targetNoteId, false))
      );
    } else {
      // Add to favorites
      return this.addFavorite(targetNoteId).pipe(
        map(res => {
          const newFavId = idOf(res?.data) || idOf(res);
          this.setFavoriteLocal(targetNoteId, true, newFavId);
          this.toastService.success(
            noteTitle ? `Added "${noteTitle}" to favourites` : 'Added to favourites',
            { dedupeKey: `fav-add-${targetNoteId}` }
          );
          return { isFavorite: true, favoriteId: newFavId };
        }),
        catchError(error => {
          this.toastService.error(
            extractErrorMessage(error, 'Could not add to favourites.'),
            { dedupeKey: `fav-err-${targetNoteId}` }
          );
          return throwError(() => error);
        }),
        finalize(() => this.setBusy(targetNoteId, false))
      );
    }
  }

  private setBusy(noteId: string, busy: boolean): void {
    const current = new Set(this.busyIds());
    if (busy) {
      current.add(noteId);
    } else {
      current.delete(noteId);
    }
    this.busyIds.set(current);
  }

  /**
   * Fetch all favourite sticky notes with optional filters and pagination.
   * Query params: stickyNoteId, status, page, limit, sortBy, sortOrder
   */
  getAll(payload: any = {}): Observable<any> {
    return this.http.get<any>(
      `${this.favoriteBaseUrl}/getall`,
      {
        params: buildHttpParams(payload),
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

}

/** Export alias for consistency across components */
export { StickyNotesFavouriteService as StickyNoteFavoriteApiService };
export { StickyNotesFavouriteService as StickyNoteFavoriteService };
