import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../shared/constants/api.constants';
import { DirectUploadService } from '../../../shared/services/direct-upload.service';

export interface NoteAttachment {
  attachmentId: string; mediaId: string; fileName: string; mimeType: string; size: number;
  status: string; uploadedAt: string | null; addedBy: string;
}
interface Envelope<T> { data: T; meta?: { total: number; totalPages: number }; }
export interface AttachmentUpload extends NoteAttachment {
  uploadUrl: string | null; requiredHeaders: Record<string, string>; expiresAt: string | null;
}
@Injectable({ providedIn: 'root' })
export class StickyNoteAttachmentService {
  private readonly http = inject(HttpClient);
  readonly directUpload = inject(DirectUploadService);
  private base(noteId: string) { return `${API_BASE_URL}/stickynotes/${encodeURIComponent(noteId)}/attachments`; }
  list(noteId: string, page = 1) { return this.http.get<Envelope<NoteAttachment[]>>(this.base(noteId), { params: { page, limit: 20 } }); }
  request(noteId: string, file: File, idempotencyKey: string) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type || (extension === 'csv' ? 'text/csv' : extension === 'txt' ? 'text/plain' : '');
    return this.http.post<Envelope<AttachmentUpload>>(`${this.base(noteId)}/request-upload`, { fileName: file.name, mimeType, size: file.size, idempotencyKey });
  }
  complete(noteId: string, id: string) { return this.http.post<Envelope<NoteAttachment>>(`${this.base(noteId)}/${encodeURIComponent(id)}/complete`, {}); }
  download(noteId: string, id: string) { return this.http.get<Envelope<{ downloadUrl: string }>>(`${this.base(noteId)}/${encodeURIComponent(id)}/download`); }
  remove(noteId: string, id: string) { return this.http.delete(`${this.base(noteId)}/${encodeURIComponent(id)}`); }
}
