import { ComponentFixture, TestBed } from '@angular/core/testing';
import { lastValueFrom, of } from 'rxjs';
import { MyNotes } from './mynotes';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { StickyNoteApiService } from './services/sticky-notes.service';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { USER_PREFERENCE_KEYS } from '../../shared/constants/common.constants';

describe('MyNotes', () => {
  let component: MyNotes;
  let fixture: ComponentFixture<MyNotes>;

  beforeEach(async () => {
    vi.spyOn(MyNotes.prototype, 'ngOnInit').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [MyNotes],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MyNotes);
    component = fixture.componentInstance;
    const preferences = TestBed.inject(UserPreferenceStore);
    vi.spyOn(preferences, 'setAndSave').mockImplementation((key, value) => {
      preferences.updatePreference(key, value);
    });
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dismisses the overdue banner without opening a drawer or changing notes', async () => {
    component.overdue.data.set({ today: '2026-10-05', total: 3, byColumn: [], notes: [] });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('3 overdue notes');
    element.querySelector<HTMLButtonElement>('button[aria-label="Dismiss overdue banner"]')?.click();
    await fixture.whenStable();
    expect(element.querySelector('app-overdue-topbar')).toBeNull();
    expect(TestBed.inject(UserPreferenceStore).overdueView()).toBe('BUTTON');
    expect(component.overdue.open()).toBe(false);
  });

  it('opens review and closes only the side panel, leaving the banner visible', async () => {
    component.overdue.data.set({ today: '2026-10-05', total: 3, byColumn: [], notes: [] });
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const review = [...element.querySelectorAll<HTMLButtonElement>('app-overdue-topbar button')]
      .find(button => button.textContent?.includes('Review overdue'));
    review?.click();
    await fixture.whenStable();
    expect(element.querySelector('app-overdue-notes-panel [role="dialog"]')).toBeTruthy();
    element.querySelector<HTMLButtonElement>('button[aria-label="Close side panel"]')?.click();
    await fixture.whenStable();
    expect(component.overdue.open()).toBe(false);
    expect(element.querySelector('app-overdue-topbar')).toBeTruthy();
  });

  it('delegates successful bulk refresh to the existing folder loader', () => {
    const bring = vi.spyOn(component.overdue, 'bringToToday').mockImplementation((_ids, refresh) => refresh());
    const load = vi.spyOn(component, 'loadSelectedFolder').mockImplementation(() => {});
    component.bringOverdueToToday(['note']);
    expect(bring).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledOnce();
  });

  it('selects and deselects all visible notes', () => {
    component.notes.set([
      { id: 'n1', title: 'Note 1', status: 'ACTIVE' },
      { id: 'n2', title: 'Note 2', status: 'ACTIVE' },
    ]);
    expect(component.isAllSelected()).toBe(false);

    component.toggleSelectAll(true);
    expect(component.selectedCount()).toBe(2);
    expect(component.isAllSelected()).toBe(true);

    component.toggleSelectAll(false);
    expect(component.selectedCount()).toBe(0);
    expect(component.isAllSelected()).toBe(false);
  });

  it('bulk archives selected notes and clears selection', () => {
    const api = TestBed.inject(StickyNoteApiService);
    const archiveSpy = vi.spyOn(api, 'archive').mockReturnValue(of({ success: true, data: { id: 'n1', status: 'ARCHIVED' } } as any));
    component.notes.set([
      { id: 'n1', title: 'Note 1', status: 'ACTIVE' },
      { id: 'n2', title: 'Note 2', status: 'ACTIVE' },
    ]);
    component.toggleNoteSelection({ id: 'n1' }, true);
    expect(component.selectedCount()).toBe(1);

    component.bulkArchiveSelected();
    expect(archiveSpy).toHaveBeenCalledWith('n1');
    expect(component.selectedCount()).toBe(0);
  });

  it('bulk deletes selected notes and removes them from the notes list', () => {
    const api = TestBed.inject(StickyNoteApiService);
    const deleteSpy = vi.spyOn(api, 'delete').mockReturnValue(of({ success: true } as any));
    component.notes.set([
      { id: 'n1', title: 'Note 1', status: 'ACTIVE' },
      { id: 'n2', title: 'Note 2', status: 'ACTIVE' },
    ]);
    component.toggleNoteSelection({ id: 'n1' }, true);
    expect(component.selectedCount()).toBe(1);

    component.bulkDeleteSelected();
    expect(deleteSpy).toHaveBeenCalledWith('n1');
    expect(component.notes().length).toBe(1);
    expect(component.selectedCount()).toBe(0);
  });

  it('switches view mode and updates search term', () => {
    expect(component.view()).toBe('grid');
    component.setNoteView('table');
    expect(component.view()).toBe('list');

    component.updateSearch('ideas');
    expect(component.searchTerm()).toBe('ideas');
    component.clearSearch();
    expect(component.searchTerm()).toBe('');
  });

  it('loads every notes page when the API caps the requested page size', async () => {
    const api = TestBed.inject(StickyNoteApiService);
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      id: `n${index + 1}`,
      title: `Note ${index + 1}`,
      status: 'ACTIVE',
    }));
    const secondPage = Array.from({ length: 3 }, (_, index) => ({
      id: `n${index + 21}`,
      title: `Note ${index + 21}`,
      status: 'ACTIVE',
    }));
    const getNotes = vi.spyOn(api, 'getByWorkspaceFolder').mockImplementation((_workspaceId, _folderId, query) =>
      of({
        data: query.page === 1 ? firstPage : secondPage,
        pagination: { page: query.page, limit: 20, total: 23, totalPages: 2 },
      } as any)
    );

    const notes = await lastValueFrom<any[]>((component as any).loadAllNotes('workspace-1', 'folder-1'));

    expect(notes).toHaveLength(23);
    expect(notes.at(-1)?.id).toBe('n23');
    expect(getNotes).toHaveBeenCalledTimes(2);
    expect(getNotes.mock.calls.map(call => call[2].page)).toEqual([1, 2]);
  });

  it('configures note tabs with status icons and counts', () => {
    component.notes.set([
      { id: 'n1', title: 'Active 1', status: 'ACTIVE' },
      { id: 'n2', title: 'Active 2', status: 'ACTIVE' },
      { id: 'n3', title: 'Archived 1', status: 'ARCHIVED' },
    ]);

    const tabs = component.noteTabs();
    expect(tabs.length).toBe(3);
    expect(tabs[0]).toMatchObject({ value: 'all', label: 'All', count: 3, icon: component.LucideStickyNote });
    expect(tabs[1]).toMatchObject({ value: 'active', label: 'Active', count: 2, icon: component.LucideCheck });
    expect(tabs[2]).toMatchObject({ value: 'archived', label: 'Archived', count: 1, icon: component.LucideArchive });
  });

  it('shows status-less API notes in the active list group', () => {
    component.notes.set([
      { id: 'n1', title: 'Projected note without status' },
      { id: 'n2', title: 'Archived projection', archivedAt: '2026-10-15T10:00:00.000Z' },
      { id: 'n3', title: 'Deleted projection', deletedAt: '2026-10-15T10:00:00.000Z' },
    ]);

    expect(component.totalCount()).toBe(2);
    expect(component.activeCount()).toBe(1);
    expect(component.archivedCount()).toBe(1);
    expect(component.noteGroups().map(group => [group.id, group.count])).toEqual([
      ['active', 1],
      ['archived', 1],
    ]);
  });

  it('changes table status through the shared switch contract', () => {
    const api = TestBed.inject(StickyNoteApiService);
    const archive = vi.spyOn(api, 'archive').mockReturnValue(of({
      data: { id: 'n1', title: 'Active note', status: 'ARCHIVED' },
    } as any));
    const activate = vi.spyOn(api, 'updateStatus').mockReturnValue(of({
      data: { id: 'n2', title: 'Archived note', status: 'ACTIVE' },
    } as any));
    const activeNote = { id: 'n1', title: 'Active note', status: 'ACTIVE' };
    const archivedNote = { id: 'n2', title: 'Archived note', status: 'ARCHIVED' };
    component.notes.set([activeNote, archivedNote]);

    component.changeNoteStatus(activeNote, false);
    component.changeNoteStatus(archivedNote, true);

    expect(archive).toHaveBeenCalledWith('n1');
    expect(activate).toHaveBeenCalledWith('n2', 'ACTIVE');
    expect(component.notes().map(note => note.status)).toEqual(['ARCHIVED', 'ACTIVE']);
  });

  it('filters visible notes by from and to date range', () => {
    component.notes.set([
      { id: 'n1', title: 'October 10 Note', status: 'ACTIVE', noteDate: '2026-10-10' },
      { id: 'n2', title: 'October 15 Note', status: 'ACTIVE', noteDate: '2026-10-15' },
      { id: 'n3', title: 'October 20 Note', status: 'ACTIVE', noteDate: '2026-10-20' },
    ]);

    expect(component.visibleNotes().length).toBe(3);

    component.setFromDate('2026-10-12');
    expect(component.visibleNotes().map(n => n.id)).toEqual(['n2', 'n3']);

    component.setToDate('2026-10-18');
    expect(component.visibleNotes().map(n => n.id)).toEqual(['n2']);

    component.setFromDate(null);
    expect(component.visibleNotes().map(n => n.id)).toEqual(['n1', 'n2']);

    component.setToDate(null);
    expect(component.visibleNotes().length).toBe(3);
  });

  it('resets invalid boundaries when fromDate is after toDate or vice versa', () => {
    component.setFromDate('2026-10-15');
    component.setToDate('2026-10-20');
    expect(component.fromDate()).toBe('2026-10-15');
    expect(component.toDate()).toBe('2026-10-20');

    component.setFromDate('2026-10-25');
    expect(component.fromDate()).toBe('2026-10-25');
    expect(component.toDate()).toBeNull();

    component.setToDate('2026-10-20');
    expect(component.toDate()).toBe('2026-10-20');
    expect(component.fromDate()).toBeNull();
  });
});
