import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../../Environments/environments';
import { buildHttpParams } from '../../../shared/functions/api.functions';
import type {
  StickyNoteAssigneeCreateRequest,
  StickyNoteAssigneePaginatedResponse,
  StickyNoteAssigneeQuery,
  StickyNoteAssigneeResponse,
  StickyNoteAssigneeSyncRequest,
  StickyNoteAssigneesListResponse
} from '../models/sticky-note-assignee.interface';

@Injectable({
  providedIn: 'root'
})
export class StickyNoteAssigneeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private readonly assigneeBaseUrl = `${this.baseUrl}/stickynotesassignees`;

  /**
   * Fetch all active assignees for a specific sticky note.
   * Backend route: GET /stickynotesassignees/sticky-note/:stickyNoteId
   */
  getByStickyNote(stickyNoteId: string): Observable<StickyNoteAssigneesListResponse> {
    return this.http.get<StickyNoteAssigneesListResponse>(
      `${this.assigneeBaseUrl}/sticky-note/${encodeURIComponent(stickyNoteId)}`,
      { withCredentials: true }
    );
  }

  /**
   * Synchronize all assignees for a sticky note in one atomic request.
   * Backend route: PUT /stickynotesassignees/sync/:id (where :id is the stickyNoteId)
   */
  sync(
    stickyNoteId: string,
    payload: StickyNoteAssigneeSyncRequest
  ): Observable<StickyNoteAssigneesListResponse> {
    return this.http.put<StickyNoteAssigneesListResponse>(
      `${this.assigneeBaseUrl}/sync/${encodeURIComponent(stickyNoteId)}`,
      payload,
      { withCredentials: true }
    );
  }

  /**
   * Add a single assignee to a sticky note.
   * Backend route: POST /stickynotesassignees/create
   */
  create(payload: StickyNoteAssigneeCreateRequest): Observable<StickyNoteAssigneeResponse> {
    return this.http.post<StickyNoteAssigneeResponse>(
      `${this.assigneeBaseUrl}/create`,
      payload,
      { withCredentials: true }
    );
  }

  /**
   * Remove an assignee assignment by assignment record ID.
   * Backend route: DELETE /stickynotesassignees/delete/:id
   */
  delete(id: string): Observable<StickyNoteAssigneeResponse> {
    return this.http.delete<StickyNoteAssigneeResponse>(
      `${this.assigneeBaseUrl}/delete/${encodeURIComponent(id)}`,
      { withCredentials: true }
    );
  }

  /**
   * Query sticky note assignees with filters and pagination.
   * Backend route: GET /stickynotesassignees/getall
   */
  getAll(query: StickyNoteAssigneeQuery = {}): Observable<StickyNoteAssigneePaginatedResponse> {
    return this.http.get<StickyNoteAssigneePaginatedResponse>(
      `${this.assigneeBaseUrl}/getall`,
      { params: buildHttpParams(query), withCredentials: true }
    );
  }
}
