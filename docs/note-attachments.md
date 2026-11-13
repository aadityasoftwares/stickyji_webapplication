# Note attachments

The note editor uses the StickyJi backend's note-scoped attachment API. The contract was checked against `StickyJiBackend/src/modules/stickynoteattachment` and the media upload service.

## User flow

- Add an Attachment block on a new note, then choose or drop files. Files stay queued until Save.
- Save creates or updates the note first, then uploads queued files one at a time.
- Editing a note loads its saved files separately. Today cards use the `attachments` array from the notes response, including empty arrays, without a separate attachment-list request.
- Download requests a fresh private download URL. Removing a saved file requires confirmation and takes effect immediately.
- Upload failures keep the editor open. Completed files leave the queue; Save retries the remaining files against the same note ID.
- A file that fails permanent backend validation can be removed from the queue and replaced. Server-side permissions, plan limits and scanning restrictions are displayed through the normal API error message.
- Queued images get immediate local thumbnails and an enlarged preview. Object URLs are released when a file is removed, uploaded, or the editor is closed.
- Saved images load private thumbnails; documents show their extension, name, size and download action. Failed thumbnails fall back to a file card.
- Both editor live previews include queued and saved attachment cards. Detail-layout sticky notes use embedded attachments when supplied, falling back to the attachment list only when the field is absent. They provide preview/download controls without upload or delete controls.
- Attachment errors use toast notifications. A failed list keeps a retry button, and failed uploads retain the existing Save-to-retry flow. Network failures use a readable message rather than the raw HTTP response.

## API calls

All paths below are relative to `/stickynotes/:noteId/attachments`.

| Method | Path                        | Purpose                                                          |
| ------ | --------------------------- | ---------------------------------------------------------------- |
| GET    | `/` with `page`, `limit=20` | List saved files; pagination is in `meta`                        |
| POST   | `/request-upload`           | Send fileName, mimeType, size and idempotencyKey                 |
| PUT    | Returned uploadUrl          | Send the raw File with requiredHeaders using DirectUploadService |
| POST   | `/:attachmentId/complete`   | Verify the storage upload before showing success                 |
| GET    | `/:attachmentId/download`   | Obtain a private download URL                                    |
| DELETE | `/:attachmentId`            | Remove a saved file or abandoned pending reservation             |

The direct storage PUT bypasses application auth interceptors and cookies. A successful PUT followed by a failed verification retries verification only. An expired unfinished upload is removed before requesting a fresh reservation. Upload IDs and keys are retained in memory for retries while the editor stays open.

Supported file extensions match the backend's secure format list: jpg, jpeg, png, webp, pdf, docx, xlsx, txt and csv. PDF and Office availability depends on backend scanning configuration; actual size and storage limits are enforced by the backend.

## Checks

Run `npm run test:attachments` for the service, attachment component and editor integration tests. Run `npm run build -- --configuration development` for template and application compilation. These tests mock HTTP/storage responses; they do not verify deployed R2 CORS, scanning configuration or a live authenticated upload.
