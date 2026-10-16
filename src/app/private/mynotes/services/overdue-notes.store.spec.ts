import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { OverdueNotesStore } from './overdue-notes.store';

const note = {
  id: 'note-1', noteKey: 'ST-000001', title: 'Overdue task', content: '',
  workspaceId: 'workspace', workspaceFolderId: 'folder', noteDate: '2026-10-04', daysOverdue: 1,
  column: { id: 'todo', name: 'To Do', type: 'TODO' }
};

function response(notes: readonly any[] = [note], total = notes.length, page = 1) {
  return {
    success: true, message: 'Loaded',
    data: { today: '2026-10-05', total, notes, byColumn: [{ columnId: 'todo', name: 'To Do', type: 'TODO', count: total }] },
    meta: { page, limit: 20, total, totalPages: Math.ceil(total / 20) }
  };
}

describe('OverdueNotesStore', () => {
  let store: OverdueNotesStore;
  let http: HttpTestingController;
  const getRequest = () => http.expectOne(request => request.url === API_ENDPOINTS.stickyNotes.overdue);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), OverdueNotesStore] });
    store = TestBed.inject(OverdueNotesStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads the actual contract once, scoped and paginated without sending a client date', () => {
    store.refresh('workspace', 'folder');
    expect(store.loading()).toBe(true);
    expect(store.bannerVisible()).toBe(false);
    const request = getRequest();
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().sort()).toEqual(['limit', 'page', 'sort', 'workspaceFolderId', 'workspaceId']);
    expect(request.request.params.get('workspaceFolderId')).toBe('folder');
    request.flush(response([note], 7));
    expect(store.data()?.total).toBe(7);
    expect(store.bannerVisible()).toBe(true);
    expect(store.loading()).toBe(false);
  });

  it('retains the open panel on refresh and resets it when context changes', () => {
    store.refresh('workspace', 'folder');
    getRequest().flush(response());
    store.open.set(true);
    store.refresh();
    getRequest().flush(response());
    expect(store.bannerVisible()).toBe(true);
    expect(store.open()).toBe(true);
    store.refresh('workspace', 'other-folder');
    getRequest().flush(response());
    expect(store.open()).toBe(false);
    expect(store.bannerVisible()).toBe(true);
  });

  it('cancels obsolete requests and resets selection when context changes', () => {
    store.refresh('workspace', 'folder');
    const old = getRequest();
    store.selectedIds.set(new Set(['note-1']));
    store.refresh('workspace', 'other-folder');
    expect(old.cancelled).toBe(true);
    expect(store.selectedIds().size).toBe(0);
    getRequest().flush(response([], 0));
    expect(store.bannerVisible()).toBe(false);
  });

  it('keeps selections and notes intact when bulk update fails and permits retry', () => {
    store.refresh('workspace', 'folder');
    getRequest().flush(response());
    store.selectedIds.set(new Set([note.id]));
    const refresh = vi.fn();
    store.bringToToday([note.id], refresh);
    const request = http.expectOne(API_ENDPOINTS.stickyNotes.bringToday);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ stickyNoteIds: [note.id] });
    request.flush({ message: 'Try again' }, { status: 500, statusText: 'Server error' });
    expect(store.selectedIds().has(note.id)).toBe(true);
    expect(store.data()?.notes).toEqual([note]);
    expect(store.busy()).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
    store.bringToToday([note.id], refresh);
    http.expectOne(API_ENDPOINTS.stickyNotes.bringToday).flush({ success: false, message: 'Failed' });
    expect(store.selectedIds().has(note.id)).toBe(true);
  });

  it('honors partial success, refreshes once and retains only skipped selections still overdue', () => {
    const skipped = { ...note, id: 'note-2' };
    store.refresh('workspace', 'folder');
    getRequest().flush(response([note, skipped]));
    store.selectedIds.set(new Set([note.id, skipped.id]));
    const refresh = vi.fn(() => store.refresh());
    store.bringToToday([note.id, skipped.id], refresh);
    store.bringToToday([note.id], refresh);
    http.expectOne(API_ENDPOINTS.stickyNotes.bringToday).flush({
      success: true,
      data: { today: '2026-10-05', requested: 2, updated: 1, skipped: 1,
        skippedNotes: [{ id: skipped.id, reason: 'NOT_OVERDUE_OR_UNAVAILABLE' }] }
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    getRequest().flush(response([skipped]));
    expect([...store.selectedIds()]).toEqual([skipped.id]);
    expect(TestBed.inject(ToastService).toasts().some(toast => toast.variant === 'warning')).toBe(true);
  });

  it('closes the panel and hides the banner after the final note is brought to today', () => {
    store.refresh('workspace', 'folder');
    getRequest().flush(response());
    store.open.set(true);
    store.selectedIds.set(new Set([note.id]));
    store.bringToToday([note.id], () => store.refresh());
    http.expectOne(API_ENDPOINTS.stickyNotes.bringToday).flush({
      success: true, data: { today: '2026-10-05', requested: 1, updated: 1, skipped: 0, skippedNotes: [] }
    });
    getRequest().flush(response([]));
    expect(store.open()).toBe(false);
    expect(store.bannerVisible()).toBe(false);
    expect(store.selectedIds().size).toBe(0);
  });

  it('does not let a previous-context bulk response refresh or clear the new context', () => {
    store.refresh('workspace', 'folder');
    getRequest().flush(response());
    const refresh = vi.fn();
    store.bringToToday([note.id], refresh);
    const update = http.expectOne(API_ENDPOINTS.stickyNotes.bringToday);
    store.refresh('workspace', 'other-folder');
    getRequest().flush(response());
    update.flush({ success: true, data: { today: '2026-10-05', requested: 1, updated: 1, skipped: 0, skippedNotes: [] } });
    expect(refresh).not.toHaveBeenCalled();
    expect(store.bannerVisible()).toBe(true);
  });

  it('hides the banner on list failure and reloads successfully on retry', () => {
    store.refresh('workspace', 'folder');
    getRequest().flush(response());
    store.open.set(true);
    store.refresh();
    getRequest().flush({}, { status: 500, statusText: 'Server error' });
    expect(store.bannerVisible()).toBe(false);
    expect(store.error()).toBeTruthy();
    expect(store.open()).toBe(true);
    store.refresh();
    getRequest().flush(response());
    expect(store.error()).toBeNull();
    expect(store.bannerVisible()).toBe(true);
  });

  it('clears page selection and recovers when deletion makes the requested page empty', () => {
    store.refresh('workspace', 'folder');
    getRequest().flush(response([note], 21));
    store.selectedIds.set(new Set([note.id]));
    store.changePage(2);
    expect(store.selectedIds().size).toBe(0);
    getRequest().flush(response([], 20, 2));
    const retry = getRequest();
    expect(retry.request.params.get('page')).toBe('1');
    retry.flush(response([note], 20));
    expect(store.pagination()?.page).toBe(1);
  });
});
