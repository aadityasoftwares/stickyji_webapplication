import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { PAGINATION } from '../../../shared/constants/app.constants';
import { idOf } from '../../../shared/functions/common.function';
import { removeEmptyValues } from '../../../shared/functions/object.functions';

@Injectable({
  providedIn: 'root',
})
export class StickyNoteApiService {
  private readonly http = inject(HttpClient);

  getOverdueNotes(payload: any = {}): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.stickyNotes.overdue, payload, {
      withCredentials: true,
    });
  }

  bringOverdueNotesToToday(stickyNoteIds: readonly string[]): Observable<any> {
    return this.http.put<any>(
      API_ENDPOINTS.stickyNotes.bringToday,
      { stickyNoteIds },
      { withCredentials: true },
    );
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.stickyNotes.get(id), { withCredentials: true });
  }

  getAll(payload: any = {}): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.stickyNotes.getAll, this.sanitizeGetPayload(payload), {
      withCredentials: true,
    });
  }

  getByWorkspace(workspaceId: string, payload: any = {}): Observable<any> {
    return this.getAll({
      ...payload,
      workspaceId,
    });
  }

  getByWorkspaceFolder(
    workspaceId: string,
    workspaceFolderId: string,
    payload: any = {},
  ): Observable<any> {
    return this.getAll({
      ...payload,
      workspaceId,
      workspaceFolderId,
    });
  }

  getByColumn(
    workspaceId: string,
    workspaceFolderId: string,
    columnId: string,
    payload: any = {},
  ): Observable<any> {
    return this.getAll({
      ...payload,
      workspaceId,
      workspaceFolderId,
      columnId,
    });
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(
      API_ENDPOINTS.stickyNotes.create,
      this.sanitizeCreatePayload(payload),
      { withCredentials: true },
    );
  }

  update(id: string, payload: any): Observable<any> {
    return this.http.put<any>(
      API_ENDPOINTS.stickyNotes.update(id),
      this.sanitizeUpdatePayload(payload),
      { withCredentials: true },
    );
  }

  updateStatus(id: string, status: any): Observable<any> {
    return this.http.put<any>(
      API_ENDPOINTS.stickyNotes.status(id),
      { status },
      { withCredentials: true },
    );
  }

  reorder(id: string, payload: any): Observable<any> {
    const body: any = {};
    const colId = idOf(payload?.columnId);
    if (colId) {
      body.columnId = colId;
    }
    if (payload?.beforeId !== undefined) {
      body.beforeId = payload.beforeId ? idOf(payload.beforeId) : null;
    }
    if (payload?.afterId !== undefined) {
      body.afterId = payload.afterId ? idOf(payload.afterId) : null;
    }
    return this.http.put<any>(
      `${API_ENDPOINTS.stickyNotes.base}/reorder/${encodeURIComponent(idOf(id))}`,
      body,
      { withCredentials: true },
    );
  }

  archive(id: string): Observable<any> {
    return this.updateStatus(id, 'ARCHIVED');
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(API_ENDPOINTS.stickyNotes.delete(id), { withCredentials: true });
  }

  getTrash(
    workspaceId: string,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.LARGE_LIMIT,
  ): Observable<any> {
    return this.getAll({
      workspaceId,
      status: 'TRASHED',
      page,
      limit,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  }

  moveToTrash(id: string): Observable<any> {
    return this.http.put<any>(
      `${API_ENDPOINTS.stickyNotes.base}/trash/${encodeURIComponent(id)}`,
      {},
      { withCredentials: true },
    );
  }

  restore(id: string): Observable<any> {
    return this.http.put<any>(API_ENDPOINTS.stickyNotes.restore(id), {}, { withCredentials: true });
  }

  permanentlyDelete(id: string): Observable<any> {
    return this.http.delete<any>(
      `${API_ENDPOINTS.stickyNotes.base}/permanent/${encodeURIComponent(id)}`,
      { withCredentials: true },
    );
  }

  private sanitizeCreatePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;
    const allowed = [
      'workspaceId',
      'workspaceFolderId',
      'columnId',
      'title',
      'content',
      'color',
      'priority',
      'shape',
      'variant',
      'backgroundPattern',
      'position',
      'noteDate',
      'isCompleted',
      'completedAt',
      'completedBy',
    ];
    const cleaned: any = {};
    for (const key of allowed) {
      if (payload[key] !== undefined && payload[key] !== null) {
        cleaned[key] = payload[key];
      }
    }
    return cleaned;
  }

  private sanitizeUpdatePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;
    const allowed = [
      'workspaceId',
      'workspaceFolderId',
      'columnId',
      'title',
      'content',
      'color',
      'priority',
      'shape',
      'variant',
      'backgroundPattern',
      'position',
      'noteDate',
      'isCompleted',
      'completedAt',
      'completedBy',
    ];
    const cleaned: any = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) {
        cleaned[key] = payload[key];
      }
    }
    return cleaned;
  }

  private sanitizeGetPayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return {};
    return removeEmptyValues(payload);
  }
}
