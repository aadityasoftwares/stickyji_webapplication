import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { NoteAttachments } from './note-attachments';
import { StickyNoteAttachmentService } from '../services/sticky-note-attachment.service';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

describe('NoteAttachments', () => {
  let fixture: ComponentFixture<NoteAttachments>;
  let component: NoteAttachments;
  const changes = new Subject<string>();
  const api = { list: vi.fn(), upload: vi.fn(), remove: vi.fn(), download: vi.fn() };
  const file = { attachmentId: 'file-1', fileName: 'note.txt', mimeType: 'text/plain', size: 5 };

  beforeEach(async () => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.list.mockReturnValue(of({ data: [], meta: { total: 0, totalPages: 0 } }));
    api.remove.mockReturnValue(of({ success: true }));
    await TestBed.configureTestingModule({
      imports: [NoteAttachments],
      providers: [
        { provide: StickyNoteAttachmentService, useValue: { ...api, changes$: changes } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NoteAttachments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('queues multiple files for an unsaved note without calling any upload API', () => {
    component.addFiles([new File(['one'], 'one.txt'), new File(['two'], 'two.csv')]);
    expect(component.pending().length).toBe(2);
    expect(api.upload).not.toHaveBeenCalled();
    expect(api.list).not.toHaveBeenCalled();
    expect(component.canHide).toBe(false);
    component.removePending(component.pending()[0]);
    expect(component.pending()[0].file.name).toBe('two.csv');
  });

  it('rejects empty and unsupported files while keeping valid files', () => {
    component.addFiles([
      new File([], 'empty.txt'),
      new File(['svg'], 'image.svg'),
      new File(['ok'], 'note.txt'),
    ]);
    expect(component.pending().map((item) => item.file.name)).toEqual(['note.txt']);
    expect(component.error()).toContain('empty.txt is empty');
    expect(component.error()).toContain('image.svg');
    fixture.detectChanges();
    expect(TestBed.inject(ToastService).toasts()[0].message).toContain('image.svg');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows queued image thumbnails and releases their URLs on removal and destruction', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    component.addFiles([new File(['image'], 'photo.jpg')]);
    fixture.detectChanges();
    expect(create).toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('.attachment-thumbnail img').getAttribute('src'),
    ).toBe('blob:preview');
    expect(component.previewFiles()[0].pending).toBe(true);
    component.removePending(component.pending()[0]);
    expect(revoke).toHaveBeenCalledWith('blob:preview');
    component.addFiles([new File(['image'], 'photo.png')]);
    fixture.destroy();
    expect(revoke).toHaveBeenCalledTimes(2);
    create.mockRestore();
    revoke.mockRestore();
  });

  it('loads saved thumbnails in read-only detail mode without upload or deletion controls', () => {
    const image = { ...file, fileName: 'photo.jpg', mimeType: 'image/jpeg' };
    api.list.mockReturnValue(of({ data: [image] }));
    api.download.mockReturnValue(of({ data: { downloadUrl: 'https://files.example/photo.jpg' } }));
    fixture.componentRef.setInput('readOnly', true);
    fixture.componentRef.setInput('noteId', 'note-1');
    fixture.detectChanges();
    expect(api.list).toHaveBeenCalledWith('note-1', 1);
    expect(component.previewFiles()[0].previewUrl).toBe('https://files.example/photo.jpg');
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Remove photo.jpg"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Download photo.jpg"]')).not.toBeNull();
    component.remove(image as any);
    component.addFiles([new File(['x'], 'note.txt')]);
    expect(api.remove).not.toHaveBeenCalled();
    expect(component.pending()).toEqual([]);
  });

  it('refreshes detail attachments after mutations and waits for an active list to finish', () => {
    const firstLoad = new Subject<any>();
    api.list.mockReturnValueOnce(firstLoad).mockReturnValue(of({ data: [file] }));
    fixture.componentRef.setInput('readOnly', true);
    fixture.componentRef.setInput('noteId', 'note-1');
    fixture.detectChanges();
    changes.next('another-note');
    changes.next('note-1');
    expect(api.list).toHaveBeenCalledTimes(1);
    firstLoad.next({ data: [] });
    firstLoad.complete();
    expect(api.list).toHaveBeenCalledTimes(2);
    expect(component.files()).toEqual([file]);
  });

  it('uses embedded saved attachments, including empty arrays, without list requests or mutation reloads', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.componentRef.setInput('noteId', 'note-1');
    fixture.componentRef.setInput('savedFiles', []);
    fixture.detectChanges();
    expect(api.list).not.toHaveBeenCalled();
    fixture.componentRef.setInput('savedFiles', [file]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('note.txt');
    expect(component.total()).toBe(1);
    changes.next('note-1');
    component.load();
    expect(api.list).not.toHaveBeenCalled();
    fixture.componentRef.setInput('savedFiles', []);
    fixture.detectChanges();
    expect(component.files()).toEqual([]);
    expect(component.total()).toBe(0);
  });

  it('renders supplied live previews without fetching attachments', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.componentRef.setInput('previewItems', [
      { id: 'queued', name: 'draft.pdf', size: 100, mimeType: 'application/pdf', pending: true },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('draft.pdf');
    expect(fixture.nativeElement.textContent).toContain('Ready to upload');
    expect(api.list).not.toHaveBeenCalled();
    expect(api.download).not.toHaveBeenCalled();
  });

  it('notifies about connection errors and keeps a retry action without an inline error', () => {
    api.list.mockReturnValue(
      throwError(() => ({ status: 0, message: 'Http failure response for (unknown url)' })),
    );
    fixture.componentRef.setInput('noteId', 'note-1');
    fixture.detectChanges();
    expect(TestBed.inject(ToastService).toasts()[0].message).toContain('Check your connection');
    expect(fixture.nativeElement.textContent).toContain('Retry loading attachments');
    expect(fixture.nativeElement.textContent).not.toContain('Http failure');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('keeps only failed and remaining files queued for retry after partial success', () => {
    component.addFiles([new File(['one'], 'one.txt'), new File(['two'], 'two.txt')]);
    const retryItem = component.pending()[1];
    api.upload
      .mockReturnValueOnce(of(file))
      .mockReturnValueOnce(throwError(() => new Error('Storage unavailable')));
    const error = vi.fn();
    component.uploadPending('saved-note').subscribe({ error });
    expect(error).toHaveBeenCalled();
    expect(component.pending()).toEqual([retryItem]);
    expect(component.busy()).toBe(false);
    api.upload.mockReturnValue(of(file));
    component.uploadPending('saved-note').subscribe();
    expect(api.upload).toHaveBeenLastCalledWith('saved-note', retryItem, expect.any(Function));
    expect(component.pending()).toEqual([]);
  });

  it('loads saved attachments independently, paginates, and clears files when switching notes', () => {
    api.list.mockReturnValueOnce(of({ data: [file], meta: { total: 2, totalPages: 2 } }));
    fixture.componentRef.setInput('noteId', 'note-1');
    fixture.detectChanges();
    expect(component.files()).toEqual([file]);
    expect(component.hasMore()).toBe(true);
    api.list.mockReturnValueOnce(
      of({ data: [{ ...file, attachmentId: 'file-2' }], meta: { total: 2, totalPages: 2 } }),
    );
    component.load(true);
    expect(api.list).toHaveBeenLastCalledWith('note-1', 2);
    expect(component.files().length).toBe(2);
    expect(component.hasMore()).toBe(false);
    component.addFiles([new File(['queued'], 'queued.txt')]);
    fixture.componentRef.setInput('noteId', 'note-2');
    fixture.detectChanges();
    expect(component.files()).toEqual([]);
    expect(component.pending()).toEqual([]);
  });

  it('keeps files after a failed deletion and releases the editor busy state', () => {
    fixture.componentRef.setInput('noteId', 'note-1');
    fixture.detectChanges();
    const deletion = new Subject();
    api.remove.mockReturnValue(deletion);
    component.files.set([file as any]);
    component.confirmId.set('file-1');
    const busy = vi.spyOn(component.busyChange, 'emit');
    component.remove(file as any);
    expect(busy).toHaveBeenCalledWith(true);
    deletion.error(new Error('Not allowed'));
    expect(component.files()).toHaveLength(1);
    expect(component.error()).toContain('Not allowed');
    expect(busy).toHaveBeenLastCalledWith(false);
  });

  it('cancels an in-flight upload when the attachment editor is destroyed', () => {
    component.addFiles([new File(['hello'], 'note.txt')]);
    const upload = new Subject();
    api.upload.mockReturnValue(upload);
    const complete = vi.fn();
    component.uploadPending('saved-note').subscribe({ complete });
    expect(upload.observed).toBe(true);
    fixture.destroy();
    expect(upload.observed).toBe(false);
    expect(complete).toHaveBeenCalled();
    expect(api.list).not.toHaveBeenCalled();
  });
});
