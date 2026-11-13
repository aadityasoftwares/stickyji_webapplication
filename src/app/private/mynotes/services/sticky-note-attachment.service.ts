import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import {
  Observable,
  Subject,
  catchError,
  defer,
  filter,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { API_BASE_URL } from '../../../shared/constants/api.constants';
import { DirectUploadService } from '../../../shared/services/direct-upload.service';
import { attachmentMimeType } from '../constants/note-attachment.constants';
import {
  AttachmentResponse,
  AttachmentUpload,
  NoteAttachment,
  PendingAttachment,
} from '../interfaces/note-attachment.interface';

@Injectable({ providedIn: 'root' })
export class StickyNoteAttachmentService {
  private readonly http = inject(HttpClient);
  private readonly directUpload = inject(DirectUploadService);
  private readonly attachmentChanges = new Subject<string>();
  readonly changes$ = this.attachmentChanges.asObservable();

  list(noteId: string, page = 1): Observable<AttachmentResponse<NoteAttachment[]>> {
    return this.http.get<AttachmentResponse<NoteAttachment[]>>(this.base(noteId), {
      params: { page, limit: 20 },
    });
  }

  request(noteId: string, file: File, idempotencyKey: string) {
    return this.http.post<AttachmentResponse<AttachmentUpload>>(
      `${this.base(noteId)}/request-upload`,
      { fileName: file.name, mimeType: attachmentMimeType(file), size: file.size, idempotencyKey },
    );
  }

  complete(noteId: string, id: string) {
    return this.http
      .post<AttachmentResponse<NoteAttachment>>(
        `${this.base(noteId)}/${encodeURIComponent(id)}/complete`,
        {},
      )
      .pipe(tap(() => this.attachmentChanges.next(noteId)));
  }

  download(noteId: string, id: string) {
    return this.http.get<AttachmentResponse<{ downloadUrl: string }>>(
      `${this.base(noteId)}/${encodeURIComponent(id)}/download`,
    );
  }

  remove(noteId: string, id: string) {
    return this.http
      .delete(`${this.base(noteId)}/${encodeURIComponent(id)}`)
      .pipe(tap(() => this.attachmentChanges.next(noteId)));
  }

  upload(
    noteId: string,
    pending: PendingAttachment,
    onProgress: (percent: number) => void,
  ): Observable<NoteAttachment> {
    return defer(() => {
      // Retry verification without uploading the same file again.
      if (pending.uploaded && pending.attachmentId) {
        return this.complete(noteId, pending.attachmentId).pipe(map((response) => response.data));
      }
      // Expired, unfinished uploads need a fresh reservation and URL.
      if (
        pending.attachmentId &&
        pending.expiresAt &&
        Date.parse(pending.expiresAt) <= Date.now()
      ) {
        return this.remove(noteId, pending.attachmentId).pipe(
          catchError((error) => (error.status === 404 ? of(null) : throwError(() => error))),
          switchMap(() => {
            pending.attachmentId = undefined;
            pending.expiresAt = null;
            pending.idempotencyKey = crypto.randomUUID();
            return this.upload(noteId, pending, onProgress);
          }),
        );
      }
      return this.request(noteId, pending.file, pending.idempotencyKey).pipe(
        switchMap(({ data }) => {
          pending.attachmentId = data.attachmentId;
          pending.expiresAt = data.expiresAt;
          if (!data.uploadUrl) {
            this.attachmentChanges.next(noteId);
            return of(data);
          }
          return this.directUpload.upload(data.uploadUrl, pending.file, data.requiredHeaders).pipe(
            tap((event) => {
              if (event.type === HttpEventType.UploadProgress) {
                onProgress(
                  Math.min(
                    100,
                    Math.round((100 * event.loaded) / (event.total || pending.file.size)),
                  ),
                );
              }
            }),
            filter((event) => event.type === HttpEventType.Response),
            switchMap(() => {
              pending.uploaded = true;
              onProgress(100);
              return this.complete(noteId, data.attachmentId).pipe(
                map((response) => response.data),
              );
            }),
          );
        }),
      );
    });
  }

  private base(noteId: string): string {
    return `${API_BASE_URL}/stickynotes/${encodeURIComponent(noteId)}/attachments`;
  }
}
