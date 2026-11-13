export interface NoteAttachment {
  attachmentId: string;
  mediaId: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: string;
  uploadedAt: string | null;
  addedBy: string;
  url?: string | null;
}

export interface AttachmentResponse<T> {
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface AttachmentUpload extends NoteAttachment {
  uploadUrl: string | null;
  requiredHeaders: Record<string, string>;
  expiresAt: string | null;
}

export interface PendingAttachment {
  file: File;
  idempotencyKey: string;
  attachmentId?: string;
  expiresAt?: string | null;
  uploaded: boolean;
  previewUrl?: string;
}

export interface AttachmentPreview {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
  pending?: boolean;
}
