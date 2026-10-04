import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '../../../../Environments/environments';
import { buildHttpParams } from '../../../shared/functions/api.functions';
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
  getByStickyNote(stickyNoteId: string): Observable<any> {
    return this.http.get<any>(
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
    payload: any
  ): Observable<any> {
    return this.http.put<any>(
      `${this.assigneeBaseUrl}/sync/${encodeURIComponent(stickyNoteId)}`,
      payload,
      { withCredentials: true }
    );
  }

  /**
   * Add a single assignee to a sticky note.
   * Backend route: POST /stickynotesassignees/create
   */
  create(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.assigneeBaseUrl}/create`,
      payload,
      { withCredentials: true }
    );
  }

  /**
   * Remove an assignee assignment by assignment record ID.
   * Backend route: DELETE /stickynotesassignees/delete/:id
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.assigneeBaseUrl}/delete/${encodeURIComponent(id)}`,
      { withCredentials: true }
    );
  }

  /**
   * Query sticky note assignees with filters and pagination.
   * Backend route: GET /stickynotesassignees/getall
   */
  getAll(query: any = {}): Observable<any> {
    return this.http.get<any>(
      `${this.assigneeBaseUrl}/getall`,
      { params: buildHttpParams(query), withCredentials: true }
    );
  }
}
