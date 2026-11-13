import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Observable,
  Subscription,
  concatMap,
  defer,
  finalize,
  from,
  map,
  of,
  tap,
  toArray,
} from 'rxjs';
import {
  LucideDownload,
  LucideEye,
  LucideFile,
  LucideImage,
  LucidePaperclip,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { Button } from '../../../shared/components/button/button';
import { AppIcon } from '../../../shared/components/icon/icon';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { StickyNoteAttachmentService } from '../services/sticky-note-attachment.service';
import {
  AttachmentPreview,
  NoteAttachment,
  PendingAttachment,
} from '../interfaces/note-attachment.interface';
import {
  ATTACHMENT_ACCEPT,
  attachmentMimeType,
  attachmentErrorMessage,
} from '../constants/note-attachment.constants';

@Component({
  selector: 'app-note-attachments',
  standalone: true,
  imports: [Button, AppIcon],
  templateUrl: './note-attachments.html',
  styleUrl: './note-attachments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteAttachments implements OnChanges, OnDestroy {
  @Input() noteId = '';
  @Input() disabled = false;
  @Input() readOnly = false;
  @Input() savedFiles: NoteAttachment[] | null = null;
  @Input() previewItems: AttachmentPreview[] | null = null;
  @Output() readonly busyChange = new EventEmitter<boolean>();
  @Output() readonly changed = new EventEmitter<void>();

  private readonly api = inject(StickyNoteAttachmentService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private destroyed = false;
  private subscriptions = new Subscription();
  private readonly thumbnailRequests = new Set<string>();
  private readonly previewRequestedIds = new Set<string>();
  private page = 0;
  private reloadAfterLoad = false;
  readonly files = signal<NoteAttachment[]>([]);
  readonly pending = signal<PendingAttachment[]>([]);
  readonly total = signal(0);
  readonly hasMore = signal(false);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly progress = signal(0);
  readonly uploadingName = signal('');
  readonly error = signal('');
  readonly listError = signal('');
  readonly confirmId = signal('');
  readonly dragging = signal(false);
  readonly accept = ATTACHMENT_ACCEPT;
  readonly thumbnailUrls = signal<Record<string, string>>({});
  readonly selectedPreview = signal<AttachmentPreview | null>(null);
  @ViewChild('previewDialog') private previewDialog?: ElementRef<HTMLDialogElement>;
  readonly previewFiles = computed<AttachmentPreview[]>(() => [
    ...this.files().map((file) => ({
      id: file.attachmentId,
      name: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      previewUrl: file.url || this.thumbnailUrls()[file.attachmentId],
    })),
    ...this.pending().map((item) => ({
      id: item.idempotencyKey,
      name: item.file.name,
      mimeType: attachmentMimeType(item.file),
      size: item.file.size,
      previewUrl: item.previewUrl,
      pending: true,
    })),
  ]);
  readonly LucideEye = LucideEye;
  readonly LucideDownload = LucideDownload;
  readonly LucideFile = LucideFile;
  readonly LucideImage = LucideImage;
  readonly LucidePaperclip = LucidePaperclip;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;

  constructor() {
    this.api.changes$.pipe(takeUntilDestroyed()).subscribe((noteId) => {
      if (
        !this.readOnly ||
        this.savedFiles !== null ||
        this.previewItems !== null ||
        noteId !== this.noteId
      )
        return;
      if (this.loading()) this.reloadAfterLoad = true;
      else this.load();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['noteId'] && !changes['savedFiles']) return;
    if (changes['noteId']?.previousValue) {
      this.subscriptions.unsubscribe();
      this.subscriptions = new Subscription();
      this.files.set([]);
      this.releasePreviews();
      this.pending.set([]);
      this.thumbnailUrls.set({});
      this.closePreview();
      this.page = 0;
      this.listError.set('');
      this.total.set(0);
      this.hasMore.set(false);
      this.confirmId.set('');
      this.error.set('');
    }
    if (this.savedFiles !== null) {
      this.files.set(this.savedFiles);
      this.total.set(this.savedFiles.length);
      this.hasMore.set(false);
      this.listError.set('');
    } else if (this.noteId && !this.busy()) this.load();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.subscriptions.unsubscribe();
    this.releasePreviews();
  }

  get canHide(): boolean {
    return (
      !this.loading() &&
      !this.busy() &&
      !this.total() &&
      !this.pending().length &&
      !this.listError()
    );
  }

  size(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  load(more = false, noteId = this.noteId): void {
    if (this.savedFiles !== null || !noteId || this.loading()) return;
    const page = more ? this.page + 1 : 1;
    this.loading.set(true);
    this.listError.set('');
    this.subscriptions.add(
      this.api
        .list(noteId, page)
        .pipe(
          finalize(() => {
            this.loading.set(false);
            const reload = this.reloadAfterLoad;
            this.reloadAfterLoad = false;
            if (reload && !this.destroyed && noteId === this.noteId) this.load();
          }),
        )
        .subscribe({
          next: (result) => {
            if (this.savedFiles !== null) return;
            this.page = page;
            this.files.set(more ? [...this.files(), ...result.data] : result.data);
            this.total.set(result.meta?.total ?? result.data.length);
            this.hasMore.set(page < (result.meta?.totalPages ?? 1));
          },
          error: (error) => {
            if (this.savedFiles !== null) return;
            const message = attachmentErrorMessage(error, 'Unable to load attachments.');
            this.listError.set(message);
            this.notify(message);
          },
        }),
    );
  }

  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  addFiles(files: File[]): void {
    if (this.readOnly || this.disabled || this.busy()) return;
    const errors: string[] = [];
    const queued: PendingAttachment[] = [];
    for (const file of files) {
      if (!file.size) errors.push(`${file.name} is empty.`);
      else if (file.name.length > 255) errors.push('File names must be 255 characters or fewer.');
      else if (!attachmentMimeType(file))
        errors.push(`${file.name}: this file type is not supported.`);
      else
        queued.push({
          file,
          idempotencyKey: crypto.randomUUID(),
          uploaded: false,
          previewUrl: attachmentMimeType(file).startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined,
        });
    }
    this.error.set(errors.join(' '));
    if (errors.length) this.notify(this.error());
    this.pending.update((items) => [...items, ...queued]);
    if (queued.length) this.changed.emit();
  }

  // The editor calls this after saving the note, so uploads always use a real note ID.
  uploadPending(noteId: string): Observable<void> {
    return defer(() => {
      const queue = [...this.pending()];
      if (!queue.length) return of(undefined);
      this.setBusy(true);
      this.error.set('');
      return from(queue).pipe(
        concatMap((item) => {
          this.uploadingName.set(item.file.name);
          this.progress.set(0);
          return this.api
            .upload(noteId, item, (percent) => this.progress.set(percent))
            .pipe(
              tap(() => {
                if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
                this.pending.update((items) => items.filter((pending) => pending !== item));
              }),
            );
        }),
        toArray(),
        tap({
          error: (error) =>
            this.error.set(
              attachmentErrorMessage(error, 'Unable to upload the file. Save again to retry.'),
            ),
        }),
        map(() => undefined),
        finalize(() => {
          this.setBusy(false);
          this.uploadingName.set('');
          if (!this.destroyed) this.load(false, noteId);
        }),
        takeUntilDestroyed(this.destroyRef),
      );
    });
  }

  removePending(item: PendingAttachment): void {
    if (this.readOnly || this.disabled || this.busy()) return;
    const remove = () => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      this.pending.update((items) => items.filter((pending) => pending !== item));
      this.error.set('');
      this.changed.emit();
      if (item.attachmentId) this.load();
    };
    if (!item.attachmentId || !this.noteId) {
      remove();
      return;
    }
    this.setBusy(true);
    this.subscriptions.add(
      this.api
        .remove(this.noteId, item.attachmentId)
        .pipe(finalize(() => this.setBusy(false)))
        .subscribe({
          next: remove,
          error: (error) => {
            if (error.status === 404) remove();
            else this.notify(attachmentErrorMessage(error, 'Unable to remove the pending upload.'));
          },
        }),
    );
  }

  download(file: NoteAttachment): void {
    if (this.disabled || this.busy()) return;
    this.setBusy(true);
    this.error.set('');
    this.subscriptions.add(
      this.api
        .download(this.noteId, file.attachmentId)
        .pipe(finalize(() => this.setBusy(false)))
        .subscribe({
          next: ({ data }) => {
            const anchor = this.document.createElement('a');
            anchor.href = data.downloadUrl;
            anchor.download = file.fileName;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.referrerPolicy = 'no-referrer';
            this.document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
          },
          error: (error) =>
            this.notify(attachmentErrorMessage(error, 'Unable to download the file.')),
        }),
    );
  }

  remove(file: NoteAttachment): void {
    if (this.readOnly || this.disabled || this.busy()) return;
    this.setBusy(true);
    this.error.set('');
    this.subscriptions.add(
      this.api
        .remove(this.noteId, file.attachmentId)
        .pipe(finalize(() => this.setBusy(false)))
        .subscribe({
          next: () => {
            this.confirmId.set('');
            this.load();
          },
          error: (error) =>
            this.notify(attachmentErrorMessage(error, 'Unable to remove the file.')),
        }),
    );
  }

  fileType(name: string): string {
    return name.split('.').pop()?.toUpperCase() || 'FILE';
  }

  openPreview(item: AttachmentPreview): void {
    if (this.disabled || this.previewItems !== null) return;
    if (!item.previewUrl) {
      const file = this.files().find((file) => file.attachmentId === item.id);
      if (file) this.loadThumbnail(file, this.noteId, true);
      return;
    }
    this.showPreview(item);
  }

  private showPreview(item: AttachmentPreview): void {
    this.selectedPreview.set(item);
    this.cdr.detectChanges();
    this.previewDialog?.nativeElement.showModal();
  }

  closePreview(): void {
    if (this.previewDialog?.nativeElement.open) this.previewDialog.nativeElement.close();
    this.selectedPreview.set(null);
  }

  thumbnailFailed(id: string): void {
    const pending = this.pending().find((item) => item.idempotencyKey === id);
    if (pending?.previewUrl) {
      URL.revokeObjectURL(pending.previewUrl);
      pending.previewUrl = undefined;
      this.pending.update((items) => [...items]);
    }
    this.thumbnailUrls.update((urls) => {
      const next = { ...urls };
      delete next[id];
      return next;
    });
  }

  downloadItem(item: AttachmentPreview): void {
    const file = this.files().find((file) => file.attachmentId === item.id);
    if (file) this.download(file);
  }

  removeItem(item: AttachmentPreview): void {
    const pending = this.pending().find((file) => file.idempotencyKey === item.id);
    if (pending) this.removePending(pending);
    else this.confirmId.set(item.id);
  }

  confirmRemove(id: string): void {
    const file = this.files().find((file) => file.attachmentId === id);
    if (file) this.remove(file);
  }

  private loadThumbnail(file: NoteAttachment, noteId: string, openAfterLoad = false): void {
    const id = file.attachmentId;
    if (file.url && file.mimeType.startsWith('image/')) {
      this.thumbnailUrls.update((urls) => ({ ...urls, [id]: file.url! }));
      if (openAfterLoad) {
        this.showPreview({
          id,
          name: file.fileName,
          mimeType: file.mimeType,
          size: file.size,
          previewUrl: file.url,
        });
      }
      return;
    }
    if (!file.mimeType.startsWith('image/') || this.thumbnailUrls()[id] || !noteId) return;
    if (openAfterLoad) this.previewRequestedIds.add(id);
    if (this.thumbnailRequests.has(id)) return;

    this.thumbnailRequests.add(id);
    const subscription = this.api
      .download(noteId, id)
      .pipe(
        finalize(() => {
          this.thumbnailRequests.delete(id);
          this.previewRequestedIds.delete(id);
        }),
      )
      .subscribe({
        next: ({ data }) => {
          this.thumbnailUrls.update((urls) => ({ ...urls, [id]: data.downloadUrl }));
          if (this.previewRequestedIds.has(id) && noteId === this.noteId) {
            this.showPreview({
              id,
              name: file.fileName,
              mimeType: file.mimeType,
              size: file.size,
              previewUrl: data.downloadUrl,
            });
          }
        },
        error: (error) => {
          if (this.previewRequestedIds.has(id)) {
            this.notify(attachmentErrorMessage(error, 'Unable to preview the image.'));
          }
        },
      });
    this.subscriptions.add(subscription);
  }

  private releasePreviews(): void {
    for (const item of this.pending()) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
  }

  private notify(message: string): void {
    this.error.set(message);
    this.toast.error(message, {
      title: 'Attachments',
      dedupeKey: `attachments-${this.noteId}-${message}`,
    });
  }

  private setBusy(value: boolean): void {
    this.busy.set(value);
    this.busyChange.emit(value);
  }
}
