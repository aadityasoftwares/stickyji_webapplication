import { TestBed } from '@angular/core/testing';
import { HttpEventType, HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { API_BASE_URL } from '../../../shared/constants/api.constants';
import { DirectUploadService } from '../../../shared/services/direct-upload.service';
import { StickyNoteAttachmentService } from './sticky-note-attachment.service';
import { PendingAttachment } from '../interfaces/note-attachment.interface';

describe('StickyNoteAttachmentService', () => {
  let api: StickyNoteAttachmentService;
  let http: HttpTestingController;
  const base = `${API_BASE_URL}/stickynotes/note-1/attachments`;
  const directUpload = { upload: vi.fn() };
  const file = new File(['hello'], 'notes.csv', { type: 'application/vnd.ms-excel' });
  let pending: PendingAttachment;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DirectUploadService, useValue: directUpload },
      ],
    });
    api = TestBed.inject(StickyNoteAttachmentService);
    http = TestBed.inject(HttpTestingController);
    pending = { file, idempotencyKey: 'stable-upload-key', uploaded: false };
    directUpload.upload
      .mockReset()
      .mockReturnValue(
        of(
          { type: HttpEventType.UploadProgress, loaded: 5, total: 5 },
          new HttpResponse({ status: 200 }),
        ),
      );
  });

  afterEach(() => http.verify());

  it('requests, uploads with the required headers, then verifies before succeeding', () => {
    const next = vi.fn();
    const progress = vi.fn();
    api.upload('note-1', pending, progress).subscribe(next);
    const request = http.expectOne(`${base}/request-upload`);
    expect(request.request.body).toEqual({
      fileName: 'notes.csv',
      mimeType: 'text/csv',
      size: 5,
      idempotencyKey: 'stable-upload-key',
    });
    request.flush({
      data: {
        attachmentId: 'file-1',
        uploadUrl: 'https://storage.example/upload',
        requiredHeaders: { 'Content-Type': 'text/csv', 'If-None-Match': '*' },
      },
    });
    expect(directUpload.upload).toHaveBeenCalledWith('https://storage.example/upload', file, {
      'Content-Type': 'text/csv',
      'If-None-Match': '*',
    });
    expect(next).not.toHaveBeenCalled();
    expect(progress).toHaveBeenCalledWith(100);
    http
      .expectOne(`${base}/file-1/complete`)
      .flush({ data: { attachmentId: 'file-1', status: 'ACTIVE' } });
    expect(next).toHaveBeenCalledWith({ attachmentId: 'file-1', status: 'ACTIVE' });
  });

  it('retries only verification after the storage upload succeeded', () => {
    pending.attachmentId = 'file-1';
    pending.uploaded = true;
    api.upload('note-1', pending, vi.fn()).subscribe();
    http.expectOne(`${base}/file-1/complete`).flush({ data: { attachmentId: 'file-1' } });
    http.expectNone(`${base}/request-upload`);
    expect(directUpload.upload).not.toHaveBeenCalled();
  });

  it('accepts an already completed idempotent request without another upload', () => {
    api.upload('note-1', pending, vi.fn()).subscribe();
    http
      .expectOne(`${base}/request-upload`)
      .flush({ data: { attachmentId: 'file-1', uploadUrl: null, status: 'ACTIVE' } });
    expect(directUpload.upload).not.toHaveBeenCalled();
    http.expectNone(`${base}/file-1/complete`);
  });

  it('releases an expired upload before requesting a new reservation', () => {
    pending.attachmentId = 'old-file';
    pending.expiresAt = '2000-01-01T00:00:00Z';
    api.upload('note-1', pending, vi.fn()).subscribe();
    const remove = http.expectOne(`${base}/old-file`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ success: true });
    const request = http.expectOne(`${base}/request-upload`);
    expect(request.request.body.idempotencyKey).not.toBe('stable-upload-key');
    request.flush({ data: { attachmentId: 'new-file', uploadUrl: null } });
  });

  it('uses the backend pagination and note-scoped download and delete routes', () => {
    api.list('note-1', 2).subscribe();
    const list = http.expectOne(`${base}?page=2&limit=20`);
    list.flush({ data: [], meta: { total: 0, totalPages: 0 } });
    api.download('note-1', 'file-1').subscribe();
    http
      .expectOne(`${base}/file-1/download`)
      .flush({ data: { downloadUrl: 'https://storage.example/file' } });
    api.remove('note-1', 'file-1').subscribe();
    const remove = http.expectOne(`${base}/file-1`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ success: true });
  });
});
