import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { Subscription, filter, switchMap, tap, of } from 'rxjs';
import { Button } from '../../../shared/components/button/button';
import { extractErrorMessage } from '../../../shared/functions/common.function';
import { StickyNoteAttachmentService, NoteAttachment } from '../services/sticky-note-attachment.service';

@Component({
  selector: 'app-note-attachments', standalone: true, imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-label="Note attachments" (dragover)="$event.preventDefault()" (drop)="drop($event)">
      @if (!noteId) { <p>Save this note before adding files.</p> }
      @else {
        <p><strong>Attachments ({{ total() }})</strong></p>
        <label class="picker">Choose a file or drop it here
          <input type="file" [disabled]="busy()" accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.txt,.csv" (change)="choose($event)" />
        </label>
        <p class="hint">Your plan's file size and storage limits apply. Documents require enabled scanning.</p>
        @if (busy()) {
          <progress [value]="progress()" max="100" aria-label="Upload progress"></progress>
          <p role="status">{{ status() }}</p>
          <app-button label="Cancel upload" size="xs" variant="secondary" (buttonClick)="cancel()" />
        }
        @if (error()) {
          <p role="alert">{{ error() }}</p>
          @if (retryFile && !busy()) { <app-button label="Retry upload" size="xs" (buttonClick)="upload(retryFile, true)" /> }
        }
        <ul>
          @for (file of files(); track file.attachmentId) {
            <li>
              <span class="file-icon" aria-hidden="true">{{ file.mimeType.startsWith('image/') ? '▧' : '▤' }}</span>
              <span class="filename">{{ file.fileName }} <small>{{ size(file.size) }} · {{ file.mimeType }}</small></span>
              <app-button label="Download" size="xs" variant="secondary" [disabled]="working() === file.attachmentId" (buttonClick)="download(file)" />
              @if (confirmId() === file.attachmentId) {
                <span role="status">Remove this attachment?</span>
                <app-button label="Confirm removal" size="xs" [disabled]="working() === file.attachmentId" (buttonClick)="remove(file)" />
                <app-button label="Keep file" size="xs" variant="secondary" (buttonClick)="confirmId.set('')" />
              } @else {
                <app-button label="Remove" size="xs" variant="secondary" [disabled]="!!working()" (buttonClick)="confirmId.set(file.attachmentId)" />
              }
            </li>
          } @empty { <li>No attachments yet.</li> }
        </ul>
        @if (page < pages()) { <app-button label="Load more attachments" size="xs" (buttonClick)="load(true)" /> }
      }
    </section>`,
  styles: [`section { padding: .75rem; } .picker { display: grid; gap: .5rem; padding: .75rem; border: 1px dashed currentColor; border-radius: .5rem; } .hint, small { font-size: .75rem; opacity: .8; } ul { padding: 0; list-style: none; } li { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; padding: .5rem 0; } .filename { flex: 1; min-width: 8rem; overflow-wrap: anywhere; } small { display: block; } progress { width: 100%; }`],
})
export class NoteAttachments implements OnChanges, OnDestroy {
  @Input() noteId = '';
  private readonly api = inject(StickyNoteAttachmentService);
  private subscriptions = new Subscription();
  private uploadSubscription?: Subscription;
  private operationId = '';
  private pendingId = '';
  private putFinished = false;
  retryFile: File | null = null;
  page = 1;
  readonly files = signal<NoteAttachment[]>([]);
  readonly total = signal(0);
  readonly pages = signal(1);
  readonly busy = signal(false);
  readonly progress = signal(0);
  readonly status = signal('');
  readonly error = signal('');
  readonly working = signal('');
  readonly confirmId = signal('');
  ngOnChanges() {
    this.subscriptions.unsubscribe(); this.subscriptions = new Subscription();
    this.cancel(); this.files.set([]); this.total.set(0); this.error.set(''); this.retryFile = null; this.pendingId = ''; this.page = 1;
    if (this.noteId) this.load();
  }
  ngOnDestroy() { this.subscriptions.unsubscribe(); this.uploadSubscription?.unsubscribe(); }
  size(bytes: number) { return bytes < 1048576 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`; }
  load(more = false) {
    const page = more ? this.page + 1 : 1;
    this.subscriptions.add(this.api.list(this.noteId, page).subscribe({
      next: result => { this.page = page; this.files.set(more ? [...this.files(), ...result.data] : result.data); this.total.set(result.meta?.total ?? result.data.length); this.pages.set(result.meta?.totalPages ?? 1); },
      error: error => this.error.set(extractErrorMessage(error)),
    }));
  }
  choose(event: Event) { const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (file) this.upload(file); input.value = ''; }
  drop(event: DragEvent) { event.preventDefault(); const file = event.dataTransfer?.files[0]; if (file && this.noteId && !this.busy()) this.upload(file); }
  upload(file: File, retry = false) {
    if (!this.noteId || this.busy()) return;
    if (!file.size) { this.error.set('Choose a nonempty file.'); return; }
    if (!retry) { this.operationId = crypto.randomUUID(); this.pendingId = ''; this.putFinished = false; }
    this.retryFile = file; this.busy.set(true); this.error.set(''); this.progress.set(0); this.status.set('Preparing upload…');
    const noteId = this.noteId;
    const completion = retry && this.pendingId && this.putFinished;
    const request = completion ? this.api.complete(noteId, this.pendingId) : this.api.request(noteId, file, this.operationId).pipe(
      switchMap(response => {
        this.pendingId = response.data.attachmentId;
        if (!response.data.uploadUrl) return of(response);
        this.status.set('Uploading…');
        return this.api.directUpload.upload(response.data.uploadUrl, file, response.data.requiredHeaders).pipe(
          tap(event => { if (event.type === HttpEventType.UploadProgress) this.progress.set(Math.round(100 * event.loaded / (event.total || file.size))); }),
          filter(event => event.type === HttpEventType.Response),
          switchMap(() => { this.putFinished = true; this.status.set('Verifying file…'); return this.api.complete(noteId, this.pendingId); }),
        );
      }),
    );
    this.uploadSubscription = request.subscribe({
      next: () => { this.busy.set(false); this.retryFile = null; this.pendingId = ''; this.status.set('Upload complete'); this.load(); },
      error: error => { this.busy.set(false); this.error.set(extractErrorMessage(error)); },
    });
  }
  cancel() { this.uploadSubscription?.unsubscribe(); this.busy.set(false); this.status.set('Upload cancelled. You can retry.'); }
  download(file: NoteAttachment) {
    this.working.set(file.attachmentId); this.error.set('');
    this.subscriptions.add(this.api.download(this.noteId, file.attachmentId).subscribe({
      next: response => { this.working.set(''); const anchor = document.createElement('a'); anchor.href = response.data.downloadUrl; anchor.rel = 'noopener noreferrer'; anchor.referrerPolicy = 'no-referrer'; anchor.click(); },
      error: error => { this.working.set(''); this.error.set(extractErrorMessage(error)); },
    }));
  }
  remove(file: NoteAttachment) {
    this.working.set(file.attachmentId); this.error.set('');
    this.subscriptions.add(this.api.remove(this.noteId, file.attachmentId).subscribe({
      next: () => { this.working.set(''); this.confirmId.set(''); this.load(); },
      error: error => { this.working.set(''); this.error.set(extractErrorMessage(error)); },
    }));
  }
}
