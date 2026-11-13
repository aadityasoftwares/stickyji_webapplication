import { extractErrorMessage } from '../../../shared/functions/api.functions';

// Matches the backend's mediaSecurity.constants.ts. Plan limits remain server-controlled.
export const ATTACHMENT_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  csv: 'text/csv',
};

export const ATTACHMENT_ACCEPT = Object.keys(ATTACHMENT_MIME_TYPES)
  .map((extension) => `.${extension}`)
  .join(',');

export function attachmentMimeType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ATTACHMENT_MIME_TYPES[extension] ?? '';
}

export function attachmentErrorMessage(error: unknown, fallback: string): string {
  const response = error as { status?: number };
  if (response?.status === 0) {
    return 'The file service could not be reached. Check your connection and try again.';
  }
  const message = extractErrorMessage(error, fallback);
  return !message.startsWith('Http failure') ? message : fallback;
}
