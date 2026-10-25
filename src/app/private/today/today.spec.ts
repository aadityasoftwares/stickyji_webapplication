import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Today } from './today';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceDropdownStore } from '../workspace/services/workspace-dropdown.store';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import { StickyNoteColumnStore } from '../mynotes/services/sticky-note-column.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { USER_PREFERENCE_KEYS, VIEW } from '../../shared/constants/common.constants';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';
import { StickyNoteApiService } from '../mynotes/services/sticky-notes.service';
import { of, Subject, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { StickyNote } from '../mynotes/sticky-note/sticky-note';

describe('Today', () => {
  let component: Today;
  let fixture: ComponentFixture<Today>;

  beforeEach(async () => {
    vi.spyOn(Today.prototype, 'ngOnInit').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [Today],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Today);
    component = fixture.componentInstance;
    const preferences = TestBed.inject(UserPreferenceStore);
    vi.spyOn(preferences, 'setAndSave').mockImplementation((key, value) => {
      preferences.updatePreference(key, value);
    });
    TestBed.inject(WorkspaceStore).setWorkspaces([{ id: 'workspace', name: 'Workspace' }] as any);
    TestBed.inject(WorkspaceFolderStore).setFolders('workspace', [
      { id: 'folder', name: 'Notes', status: 'ACTIVE' },
    ] as any);
    TestBed.inject(StickyNoteColumnStore).setColumns('workspace', 'folder', [
      { id: 'todo', name: 'To do', position: 0, type: 'TODO' },
      { id: 'doing', name: 'In progress', position: 1, type: 'IN_PROGRESS' },
      { id: 'done', name: 'Done', position: 2, type: 'COMPLETED' },
    ] as any);
    TestBed.inject(UserPreferenceStore).updatePreference(
      USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT,
      'DETAIL',
    );
    component.stickyNotes.set([
      {
        id: 'second',
        title: 'Second note',
        description: 'Later task',
        columnId: 'todo',
        rank: 'b',
      },
      {
        id: 'first',
        title: 'First note',
        description: 'Matching task',
        columnId: 'todo',
        rank: 'a',
        creatorEmail: 'owner@example.test',
        updatedAt: '2026-10-04T00:00:00Z',
      },
      {
        id: 'third',
        title: 'Third note',
        description: 'Active task',
        columnId: 'doing',
        rank: 'a',
      },
    ]);
    component.setView('table');
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });

  it('groups notes in column and rank order, retaining empty stages', () => {
    expect(component.tableGroups().map((group) => [group.id, group.count])).toEqual([
      ['todo', 2],
      ['doing', 1],
      ['done', 0],
    ]);
    expect(component.tableGroups()[0].notes.map((note) => note.id)).toEqual(['first', 'second']);
    expect(fixture.nativeElement.querySelectorAll('.today-group-empty')).toHaveLength(1);
  });

  it('updates group counts and hides empty groups during search', async () => {
    component.updateSearch('Matching');
    await fixture.whenStable();
    expect(component.tableGroups().map((group) => [group.id, group.count])).toEqual([['todo', 1]]);
    expect(fixture.nativeElement.querySelectorAll('.today-gtable tbody tr')).toHaveLength(1);
    component.clearSearch();
    await fixture.whenStable();
    expect(component.tableGroups()).toHaveLength(3);
  });

  it('collapses only the chosen group with an accessible button', async () => {
    const toggle = fixture.nativeElement.querySelector('#group-heading-todo') as HTMLButtonElement;
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#todo-table-drop-list')).toBeNull();
    expect(fixture.nativeElement.querySelector('#doing-table-drop-list')).not.toBeNull();
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#todo-table-drop-list')).not.toBeNull();
  });

  it('keeps the add action independent from group collapse', () => {
    const create = vi.spyOn(component, 'openNoteCreatePanel').mockImplementation(() => {});
    fixture.nativeElement.querySelector('button[aria-label="Add note to To do"]').click();
    expect(create).toHaveBeenCalledWith('todo');
    expect(component.isGroupCollapsed('todo')).toBe(false);
  });

  it('preserves detail metadata and compact view columns', async () => {
    expect(
      fixture.nativeElement.querySelectorAll('.today-gtable')[0].querySelectorAll('th'),
    ).toHaveLength(10);
    expect(fixture.nativeElement.querySelector('.today-gt-owner').textContent).toContain(
      'owner@example.test',
    );
    TestBed.inject(UserPreferenceStore).updatePreference(
      USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT,
      'COMPACT',
    );
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('.today-gtable')[0].querySelectorAll('th'),
    ).toHaveLength(6);
    expect(fixture.nativeElement.querySelector('td.today-gt-updated')).toBeNull();
  });

  it('keeps inline rename and edit actions attached to the correct note', async () => {
    const rename = vi.spyOn(component, 'startTableTitleEdit');
    fixture.nativeElement.querySelector('button[aria-label="Rename First note"]').click();
    await fixture.whenStable();
    expect(rename.mock.calls[0][0].id).toBe('first');
    expect(fixture.nativeElement.querySelector('[data-inline-note-title]').value).toBe(
      'First note',
    );
    component.cancelTableTitleEdit();
    const edit = vi.spyOn(component, 'openNoteEditPanel').mockImplementation(() => {});
    fixture.nativeElement.querySelector('button[aria-label="Edit Third note"]').click();
    expect(edit.mock.calls[0][0].id).toBe('third');
  });

  it('shows the existing empty state instead of an empty table when search finds nothing', async () => {
    component.updateSearch('no matching text');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.today-gtable')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No matching notes found');
  });

  it('keeps Kanban and Table available alongside the overdue banner', async () => {
    component.overdue.data.set({ today: '2026-10-05', total: 2, byColumn: [], notes: [] });
    component.setView('kanban');
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.today-kanban')).toBeTruthy();
    expect(element.querySelector('app-overdue-topbar')).toBeTruthy();
    component.setView('table');
    await fixture.whenStable();
    expect(element.querySelector('.today-gtable')).toBeTruthy();
    expect(element.querySelector('app-overdue-topbar')).toBeTruthy();
  });

  it('persists Today and overdue display choices', async () => {
    const preferences = TestBed.inject(UserPreferenceStore);
    component.setView('kanban');
    expect(preferences.todayView()).toBe('KANBAN');

    component.overdue.data.set({ today: '2026-10-05', total: 2, byColumn: [], notes: [] });
    component.dismissOverdueBar();
    await fixture.whenStable();

    expect(preferences.overdueView()).toBe('BUTTON');
    expect(component.overdueButtonVisible()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-overdue-topbar')).toBeNull();
  });

  it('keeps wheel scrolling vertical inside a column and moves the board horizontally at its edge', () => {
    const board = document.createElement('div');
    const noteColumn = document.createElement('div');
    noteColumn.className = 'today-column-notes';
    board.appendChild(noteColumn);
    Object.defineProperties(board, {
      clientWidth: { value: 300 },
      clientHeight: { value: 400 },
      scrollWidth: { value: 900 },
      scrollLeft: { value: 0, writable: true },
    });
    Object.defineProperties(noteColumn, {
      clientHeight: { value: 200 },
      scrollHeight: { value: 600 },
      scrollTop: { value: 100, writable: true },
    });
    const preventDefault = vi.fn();

    component.onKanbanWheel(
      {
        target: noteColumn,
        deltaX: 0,
        deltaY: 80,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        ctrlKey: false,
        shiftKey: false,
        defaultPrevented: false,
        preventDefault,
      } as unknown as WheelEvent,
      board,
    );

    expect(board.scrollLeft).toBe(0);
    expect(preventDefault).not.toHaveBeenCalled();

    noteColumn.scrollTop = 400;
    component.onKanbanWheel(
      {
        target: noteColumn,
        deltaX: 0,
        deltaY: 80,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        ctrlKey: false,
        shiftKey: false,
        defaultPrevented: false,
        preventDefault,
      } as unknown as WheelEvent,
      board,
    );

    expect(board.scrollLeft).toBe(80);
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('refreshes today notes and overdue data once after Bring to Today succeeds', () => {
    vi.spyOn(component.overdue, 'bringToToday').mockImplementation((_ids, refresh) => refresh());
    const overdueRefresh = vi.spyOn(component.overdue, 'refresh').mockImplementation(() => {});
    const notesRefresh = vi.spyOn(component, 'getNotesForToday').mockImplementation(() => {});
    vi.spyOn(component, 'getStickyNoteColumns').mockImplementation(() => {});
    component.bringOverdueToToday(['one', 'two']);
    expect(overdueRefresh).toHaveBeenCalledOnce();
    expect(notesRefresh).toHaveBeenCalledOnce();
  });

  it('manages Zoho-style expandable search state properly', () => {
    expect(component.isSearchExpanded()).toBe(false);

    component.openSearch();
    expect(component.searchExpanded()).toBe(true);
    expect(component.isSearchExpanded()).toBe(true);

    // Blurring when empty collapses search
    component.onSearchBlur();
    expect(component.searchExpanded()).toBe(false);
    expect(component.isSearchExpanded()).toBe(false);

    // When there is an active search query, blurring keeps it expanded
    component.updateSearch('ideas');
    component.onSearchBlur();
    expect(component.isSearchExpanded()).toBe(true);

    // Escape clears search and collapses
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onSearchEscape(escapeEvent);
    expect(component.searchTerm()).toBe('');
    expect(component.searchExpanded()).toBe(false);
    expect(component.isSearchExpanded()).toBe(false);
  });

  it('calculates font select width within configured min and max limits according to text', () => {
    const preferences = TestBed.inject(UserPreferenceStore);

    // Short font: Caveat (6 chars) -> should clamp to min 155
    preferences.updatePreference(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT, 'CAVEAT');
    expect(component.fontSelectWidth()).toBe(155);

    // Medium font: Comic Neue (10 chars) -> 87 + 75 + 14 = 176
    preferences.updatePreference(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT, 'COMIC_NEUE');
    expect(component.fontSelectWidth()).toBe(176);

    // Long font: Architects Daughter (19 chars) -> should clamp to max 215
    preferences.updatePreference(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT, 'ARCHITECTS_DAUGHTER');
    expect(component.fontSelectWidth()).toBe(215);
  });

  it('applies has-search-expanded on today-toolbar and has-search-active on today-search in template', async () => {
    fixture.detectChanges();
    const toolbarEl = fixture.nativeElement.querySelector('.today-toolbar') as HTMLElement;
    const searchEl = fixture.nativeElement.querySelector('.today-search') as HTMLElement;

    expect(toolbarEl.classList.contains('has-search-expanded')).toBe(false);
    expect(searchEl.classList.contains('has-search-active')).toBe(false);

    component.openSearch();
    fixture.detectChanges();

    expect(toolbarEl.classList.contains('has-search-expanded')).toBe(true);
    expect(searchEl.classList.contains('has-search-active')).toBe(true);
  });

  it('defaults to Notes view and partitions incomplete and completed notes', async () => {
    const preferences = TestBed.inject(UserPreferenceStore);
    preferences.updatePreference(USER_PREFERENCE_KEYS.TODAY_VIEW, 'NOTES');
    await fixture.whenStable();

    expect(component.view()).toBe(VIEW.NOTES);
    expect(component.isNotesView()).toBe(true);

    // Initial notes in beforeEach:
    // 'first' (todo), 'second' (todo), 'third' (doing) -> all incomplete
    expect(component.todayIncompleteNotes()).toHaveLength(3);
    expect(component.todayCompletedNotes()).toHaveLength(0);

    // Mark 'first' as completed
    component.stickyNotes.update((notes) =>
      notes.map((n) => (n.id === 'first' ? { ...n, isCompleted: true } : n)),
    );
    expect(component.todayIncompleteNotes().map((n) => n.id)).toEqual(['second', 'third']);
    expect(component.todayCompletedNotes().map((n) => n.id)).toEqual(['first']);
    expect(component.incompleteNoteCount()).toBe(2);
    expect(component.completedNoteCount()).toBe(1);
  });

  it('renders 70/30 layout in Notes view with Today Notes and Completed sections', async () => {
    component.setView('notes');
    await fixture.whenStable();
    fixture.detectChanges();

    const canvasEl = fixture.nativeElement.querySelector('.today-notes-canvas');
    const notesSection = fixture.nativeElement.querySelector('.today-notes-section');
    const completedSection = fixture.nativeElement.querySelector('.today-completed-section');
    const notesGrid = fixture.nativeElement.querySelector('#today-notes-drop-list');
    const completedList = fixture.nativeElement.querySelector('#today-completed-drop-list');

    expect(canvasEl).toBeTruthy();
    expect(notesSection).toBeTruthy();
    expect(completedSection).toBeTruthy();
    expect(notesGrid).toBeTruthy();
    expect(completedList).toBeTruthy();
  });

  it.each(['DETAIL', 'COMPACT'])(
    'shows decorative paper tape only in Notes view (%s)',
    async (layout) => {
      TestBed.inject(UserPreferenceStore).updatePreference(
        USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT,
        layout,
      );
      component.stickyNotes.update((notes) =>
        notes.map((note) => (note.id === 'first' ? { ...note, isCompleted: true } : note)),
      );
      component.setView('notes');
      await fixture.whenStable();
      fixture.detectChanges();

      const tapes = fixture.nativeElement.querySelectorAll('.sticky-note__tape');
      expect(tapes).toHaveLength(3);
      for (const tape of tapes) {
        expect(tape.getAttribute('aria-hidden')).toBe('true');
      }
      expect(
        fixture.nativeElement.querySelector('.today-completed-list .sticky-note__tape'),
      ).toBeTruthy();
      expect(fixture.nativeElement.querySelectorAll('.sticky-note__edit-trigger')).toHaveLength(3);
      expect(fixture.nativeElement.querySelectorAll('.sticky-note__menu-trigger')).toHaveLength(3);

      component.setView('kanban');
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.sticky-note__tape')).toHaveLength(0);
    },
  );

  it('toggles note completion optimistically and calls update API', async () => {
    const noteApi = TestBed.inject(StickyNoteApiService);
    const updateSpy = vi
      .spyOn(noteApi, 'update')
      .mockReturnValue(of({ data: { id: 'second', isCompleted: true } }));

    component.toggleNoteCompletion('second', true);
    expect(component.isNoteCompleted(component.stickyNotes().find((n) => n.id === 'second'))).toBe(
      true,
    );
    expect(updateSpy).toHaveBeenCalledWith(
      'second',
      expect.objectContaining({ columnId: 'done', isCompleted: true }),
    );
  });

  it('rolls back note completion when update API fails', async () => {
    const noteApi = TestBed.inject(StickyNoteApiService);
    vi.spyOn(noteApi, 'update').mockReturnValue(throwError(() => new Error('Server error')));

    const originalNote = component.stickyNotes().find((n) => n.id === 'second');
    expect(component.isNoteCompleted(originalNote)).toBe(false);

    component.toggleNoteCompletion('second', true);
    const rolledBackNote = component.stickyNotes().find((n) => n.id === 'second');
    expect(component.isNoteCompleted(rolledBackNote)).toBe(false);
  });

  it.each([true, false])(
    'uses the reorder endpoint when moving across sections (completed: %s)',
    (completed) => {
      vi.spyOn(component.overdue, 'refresh').mockImplementation(() => {});
      component.stickyNotes.set([
        {
          id: 'first',
          title: 'First note',
          columnId: completed ? 'todo' : 'done',
          isCompleted: !completed,
        },
      ]);
      component.onNotesDrop(
        {
          item: { data: component.stickyNotes()[0] },
          previousContainer: {},
          container: {},
          previousIndex: 0,
          currentIndex: 0,
          isPointerOverContainer: true,
        } as any,
        completed,
      );
      const request = TestBed.inject(HttpTestingController).expectOne(
        API_ENDPOINTS.stickyNotes.base + '/reorder/first',
      );
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({
        columnId: completed ? 'done' : 'todo',
        beforeId: null,
        afterId: null,
      });
      expect(component.isNoteCompleted(component.stickyNotes()[0])).toBe(completed);
      request.flush({ data: { id: 'first' } });
      expect(component.isNoteCompleted(component.stickyNotes()[0])).toBe(completed);
    },
  );

  it('restores completion and column after a failed cross-section reorder while retaining edits', () => {
    const pending = new Subject<any>();
    vi.spyOn(TestBed.inject(StickyNoteApiService), 'reorder').mockReturnValue(pending);
    const note = component.stickyNotes()[0];
    component.onNotesDrop(
      { item: { data: note }, previousContainer: {}, container: {}, currentIndex: 0 } as any,
      true,
    );
    expect(component.todayCompletedNotes()).toHaveLength(1);
    component.onNoteUpdated({ id: note.id, title: 'Edited during request' });
    pending.error(new Error('Reorder failed'));
    expect(component.todayCompletedNotes()).toHaveLength(0);
    expect(component.stickyNotes().find((item) => item.id === note.id)).toMatchObject({
      columnId: 'todo',
      title: 'Edited during request',
    });
  });

  it('keeps note details when completion returns only changed fields', () => {
    vi.spyOn(component.overdue, 'refresh').mockImplementation(() => {});
    vi.spyOn(TestBed.inject(StickyNoteApiService), 'update').mockReturnValue(
      of({ data: { id: 'second', isCompleted: true } }),
    );
    component.toggleNoteCompletion('second', true);
    expect(component.stickyNotes().find((note) => note.id === 'second')).toMatchObject({
      title: 'Second note',
      description: 'Later task',
      columnId: 'done',
      isCompleted: true,
    });
    expect(component.movingNoteId()).toBeNull();
  });

  it('serializes completion changes and only rolls back completion fields on failure', () => {
    const pending = new Subject<any>();
    const update = vi
      .spyOn(TestBed.inject(StickyNoteApiService), 'update')
      .mockReturnValue(pending);
    component.toggleNoteCompletion('second', true);
    component.toggleNoteCompletion('second', false);
    component.toggleNoteCompletion('third', true);
    expect(update).toHaveBeenCalledTimes(1);
    expect(component.noteDragDisabled()).toBe(true);

    component.onNoteUpdated({ id: 'second', title: 'Edited while saving' });
    component.onNoteUpdated({ id: 'third', title: 'Another edit' });
    pending.error(new Error('Save failed'));

    expect(component.stickyNotes().find((note) => note.id === 'second')).toMatchObject({
      title: 'Edited while saving',
      isCompleted: false,
    });
    expect(component.stickyNotes().find((note) => note.id === 'third')?.title).toBe('Another edit');
    expect(component.movingNoteId()).toBeNull();
  });

  it('ignores completion responses after leaving the folder', () => {
    const pending = new Subject<any>();
    vi.spyOn(TestBed.inject(StickyNoteApiService), 'update').mockReturnValue(pending);
    component.toggleNoteCompletion('second', true);
    component.onFolderSelection(null);
    component.stickyNotes.set([{ id: 'new-folder-note', title: 'Different folder' }]);
    pending.error(new Error('Old request failed'));
    expect(component.stickyNotes().map((note) => note.id)).toEqual(['new-folder-note']);
    expect(component.movingNoteId()).toBeNull();
  });

  it('moves a dropped note into the default completed column and retains its details', () => {
    vi.spyOn(component.overdue, 'refresh').mockImplementation(() => {});
    TestBed.inject(StickyNoteColumnStore).setColumns('workspace', 'folder', [
      { id: 'todo', name: 'To do', type: 'TODO', position: 0 },
      { id: 'done-other', name: 'Other completed', type: 'COMPLETED', position: 1 },
      { id: 'done', name: 'Completed', type: 'COMPLETED', isDefault: true, position: 2 },
    ]);
    const update = vi
      .spyOn(TestBed.inject(StickyNoteApiService), 'reorder')
      .mockReturnValue(of({ data: { id: 'first', isCompleted: true } }));
    component.onNotesDrop(
      {
        item: { data: component.stickyNotes().find((note) => note.id === 'first') },
        previousContainer: { id: 'today-notes-drop-list' },
        container: { id: 'today-completed-drop-list' },
        isPointerOverContainer: true,
      } as any,
      true,
    );
    expect(update).toHaveBeenCalledWith('first', {
      columnId: 'done',
      beforeId: null,
      afterId: null,
    });
    expect(component.todayCompletedNotes()[0]).toMatchObject({
      id: 'first',
      columnId: 'done',
      columnName: 'Completed',
      title: 'First note',
    });
    expect(component.tableGroups().find((group) => group.id === 'done')?.count).toBe(1);
  });

  it('reopens a completed-column note in To do and clears completion metadata', () => {
    vi.spyOn(component.overdue, 'refresh').mockImplementation(() => {});
    component.stickyNotes.update((notes) =>
      notes.map((note) =>
        note.id === 'first'
          ? { ...note, columnId: 'done', isCompleted: true, completedAt: '2026-10-25T00:00:00Z' }
          : note,
      ),
    );
    const update = vi
      .spyOn(TestBed.inject(StickyNoteApiService), 'reorder')
      .mockReturnValue(of({ data: { id: 'first' } }));
    component.onNotesDrop(
      {
        item: { data: component.stickyNotes().find((note) => note.id === 'first') },
        previousContainer: { id: 'today-completed-drop-list' },
        container: { id: 'today-notes-drop-list' },
        isPointerOverContainer: true,
      } as any,
      false,
    );
    expect(update).toHaveBeenCalledWith('first', {
      columnId: 'todo',
      beforeId: null,
      afterId: 'second',
    });
    expect(component.todayCompletedNotes()).toHaveLength(0);
    expect(component.todayIncompleteNotes().find((note) => note.id === 'first')?.columnId).toBe(
      'todo',
    );
  });

  it('restores the original column after a completion save fails without undoing edits', () => {
    const pending = new Subject<any>();
    vi.spyOn(TestBed.inject(StickyNoteApiService), 'update').mockReturnValue(pending);
    component.toggleNoteCompletion('third', true);
    expect(component.stickyNotes().find((note) => note.id === 'third')?.columnId).toBe('done');
    component.onNoteUpdated({ id: 'third', title: 'Updated title' });
    pending.error(new Error('Save failed'));
    expect(component.stickyNotes().find((note) => note.id === 'third')).toMatchObject({
      columnId: 'doing',
      title: 'Updated title',
      isCompleted: false,
    });
  });

  it('does not save a completion flag when no completed column exists', () => {
    TestBed.inject(StickyNoteColumnStore).setColumns('workspace', 'folder', [
      { id: 'todo', name: 'To do', type: 'TODO', position: 0 },
    ]);
    const update = vi.spyOn(TestBed.inject(StickyNoteApiService), 'update');
    component.toggleNoteCompletion('first', true);
    expect(update).not.toHaveBeenCalled();
    expect(component.todayCompletedNotes()).toHaveLength(0);
    expect(component.movingNoteId()).toBeNull();
  });

  it('ignores a drop outside the board and blocks drops during loading', () => {
    const complete = vi.spyOn(component, 'toggleNoteCompletion');
    const event = {
      item: { data: component.stickyNotes()[0] },
      previousContainer: {},
      container: {},
      isPointerOverContainer: false,
    } as any;
    component.onNotesDrop(event, true);
    component.loadingNotes.set(true);
    component.onNotesDrop({ ...event, isPointerOverContainer: true }, true);
    expect(complete).not.toHaveBeenCalled();
  });

  it('reorders a canvas note using only neighbors from its own column', () => {
    const pending = new Subject<any>();
    const reorder = vi
      .spyOn(TestBed.inject(StickyNoteApiService), 'reorder')
      .mockReturnValue(pending);
    const notes = [
      { id: 'first', title: 'First note', columnId: 'todo', rank: 'a' },
      { id: 'second', title: 'Second note', columnId: 'todo', rank: 'b' },
      { id: 'third', title: 'Third note', columnId: 'doing', rank: 'a' },
    ];
    component.stickyNotes.set(notes);
    const container = { data: notes };
    component.onNotesDrop(
      {
        item: { data: notes[1] },
        previousContainer: container,
        container,
        previousIndex: 1,
        currentIndex: 0,
        isPointerOverContainer: true,
      } as any,
      false,
    );
    expect(reorder).toHaveBeenCalledWith('second', {
      columnId: 'todo',
      beforeId: null,
      afterId: 'first',
    });
    expect(component.visibleNotesFor('todo').map((note) => note.id)).toEqual(['second', 'first']);
    pending.next({ data: { id: 'second', rank: '0' } });
    pending.complete();
    expect(component.visibleNotesFor('todo').map((note) => note.id)).toEqual(['second', 'first']);
    expect(component.stickyNotes().find((note) => note.id === 'second')?.title).toBe('Second note');
  });

  it('moves a canvas note into the destination column with column-local neighbors', () => {
    vi.spyOn(component.overdue, 'refresh').mockImplementation(() => {});
    const reorder = vi
      .spyOn(TestBed.inject(StickyNoteApiService), 'reorder')
      .mockReturnValue(of({ data: { id: 'second', columnId: 'doing', rank: 'b' } }));
    const container = { data: component.todayIncompleteNotes() };
    const drag = { data: component.stickyNotes()[0], dropContainer: container };
    expect(component.canSortCanvasNote(2, drag, container)).toBe(true);
    component.onNotesDrop(
      {
        item: drag,
        previousContainer: container,
        container,
        previousIndex: 0,
        currentIndex: 2,
      } as any,
      false,
    );
    expect(reorder).toHaveBeenCalledWith('second', {
      columnId: 'doing',
      beforeId: 'third',
      afterId: null,
    });
    expect(component.todayIncompleteNotes().map((note) => note.id)).toEqual([
      'first',
      'third',
      'second',
    ]);
  });

  it('inserts a canvas note before a target when dragged upwards across columns', () => {
    vi.spyOn(component.overdue, 'refresh').mockImplementation(() => {});
    const reorder = vi
      .spyOn(TestBed.inject(StickyNoteApiService), 'reorder')
      .mockReturnValue(of({ data: { id: 'third', columnId: 'todo', rank: '0' } }));
    const notes = component.todayIncompleteNotes();
    const container = { data: notes };
    component.onNotesDrop(
      {
        item: { data: notes[2] },
        previousContainer: container,
        container,
        previousIndex: 2,
        currentIndex: 1,
        isPointerOverContainer: true,
      } as any,
      false,
    );
    expect(reorder).toHaveBeenCalledWith('third', {
      columnId: 'todo',
      beforeId: null,
      afterId: 'first',
    });
  });

  it('restores a failed reorder without discarding another note edit or resurrecting a deleted note', () => {
    const pending = new Subject<any>();
    vi.spyOn(TestBed.inject(StickyNoteApiService), 'reorder').mockReturnValue(pending);
    const note = component.stickyNotes().find((item) => item.id === 'first');
    component.dropNote(
      {
        item: { data: note },
        previousContainer: {},
        container: {},
        currentIndex: 1,
      },
      'doing',
    );
    component.onNoteUpdated({ id: 'third', title: 'Keep this edit' });
    component.onNoteDeleted('second', false);
    pending.error(new Error('Reorder failed'));
    expect(component.stickyNotes().find((item) => item.id === 'first')?.columnId).toBe('todo');
    expect(component.stickyNotes().find((item) => item.id === 'third')?.title).toBe(
      'Keep this edit',
    );
    expect(component.stickyNotes().some((item) => item.id === 'second')).toBe(false);
  });

  it('uses grid-aware drop lists and registers a handle inside each note', async () => {
    component.setView('notes');
    await fixture.whenStable();
    const lists = fixture.debugElement.queryAll(By.directive(CdkDropList));
    expect(lists).toHaveLength(2);
    for (const list of lists) {
      expect(list.injector.get(CdkDropList).orientation).toBe('mixed');
    }
    const drag = fixture.debugElement.query(By.directive(CdkDrag)).injector.get(CdkDrag);
    expect(drag._dragRef.getRootElement().querySelector('.cdk-drag-handle')).toBeTruthy();
    const refresh = vi.spyOn(component.overdue, 'refresh').mockImplementation(() => {});
    const card = fixture.debugElement.query(By.directive(StickyNote))
      .componentInstance as StickyNote;
    card.deleted.emit(card.data.id);
    card.deleteRequested.emit(card.data);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('handles completion from a Kanban card menu', async () => {
    component.setView('kanban');
    await fixture.whenStable();
    const complete = vi.spyOn(component, 'toggleNoteCompletion').mockImplementation(() => {});
    const card = fixture.debugElement.query(By.directive(StickyNote))
      .componentInstance as StickyNote;
    card.completionToggled.emit({ noteId: card.data.id, isCompleted: true });
    expect(complete).toHaveBeenCalledWith(card.data.id, true);
  });

  it('keeps visible notes when a background refresh fails', () => {
    vi.spyOn(TestBed.inject(StickyNoteApiService), 'getAll').mockReturnValue(
      throwError(() => new Error('Refresh failed')),
    );
    const ids = component.stickyNotes().map((note) => note.id);
    component.getNotesForToday();
    expect(component.stickyNotes().map((note) => note.id)).toEqual(ids);
    expect(component.loadingNotes()).toBe(false);
  });

  it('updates cascading workspace and folder options from workspaceDropdownStore and resets folder on workspace change', async () => {
    vi.spyOn(component as any, 'loadWorkspaceMembers').mockImplementation(() => {});
    vi.spyOn(component as any, 'loadBoard').mockImplementation(() => {});

    const dropdownStore = TestBed.inject(WorkspaceDropdownStore);
    dropdownStore.setItems([
      {
        id: 'ws-alpha',
        name: 'Alpha Workspace',
        folders: [
          { id: 'f-alpha-1', name: 'Alpha Default' },
          { id: 'f-alpha-2', name: 'Alpha Secondary' },
        ],
      },
      {
        id: 'ws-beta',
        name: 'Beta Workspace',
        folders: [{ id: 'f-beta-1', name: 'Beta Default' }],
      },
    ]);

    await fixture.whenStable();

    expect(component.workspaceOptions().map((opt) => opt.value)).toEqual(['ws-alpha', 'ws-beta']);
    expect(component.activeWorkspaceId()).toBe('ws-alpha');
    expect(component.activeFolder()).toBe('f-alpha-1');
    expect(component.folderOptions().map((opt) => opt.value)).toEqual(['f-alpha-1', 'f-alpha-2']);

    component.onWorkspaceSelection('ws-beta');
    await fixture.whenStable();

    expect(component.activeWorkspaceId()).toBe('ws-beta');
    expect(component.activeFolder()).toBe('f-beta-1');
    expect(component.folderOptions().map((opt) => opt.value)).toEqual(['f-beta-1']);
  });

  it('reflects empty state when no workspaces with folders are found', async () => {
    const dropdownStore = TestBed.inject(WorkspaceDropdownStore);
    dropdownStore.setItems([]);
    TestBed.inject(WorkspaceStore).setWorkspaces([]);
    TestBed.inject(WorkspaceFolderStore).clear();

    await fixture.whenStable();

    expect(component.hasWorkspaces()).toBe(false);
    expect(component.activeWorkspaceId()).toBeNull();
    expect(component.activeFolder()).toBeNull();
  });

  it('shares the session dropdown request and waits for preferences before loading the board', async () => {
    const http = TestBed.inject(HttpTestingController);
    const preferences = TestBed.inject(UserPreferenceStore);
    TestBed.inject(WorkspaceDropdownStore).reset();
    const members = vi.spyOn(component, 'loadWorkspaceMembers').mockImplementation(() => {});
    const board = vi.spyOn(component as any, 'loadBoard').mockImplementation(() => {});

    preferences.load(true);
    TestBed.inject(WorkspaceStore).load(true);
    component.getWorkspaces(true);
    http.expectOne(API_ENDPOINTS.workspaces.dropdown).flush({
      data: [
        { id: 'first', name: 'First', folders: [{ id: 'f-first', name: 'First' }] },
        { id: 'saved', name: 'Saved', folders: [{ id: 'f-saved', name: 'Saved' }] },
      ],
    });
    await fixture.whenStable();
    expect(board).not.toHaveBeenCalled();
    http.expectOne(API_ENDPOINTS.userPreferences.my).flush({
      data: {
        [USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID]: 'saved',
        [USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID]: 'f-saved',
      },
    });
    await fixture.whenStable();
    expect(members).toHaveBeenCalledExactlyOnceWith('saved');
    expect(board).toHaveBeenCalledTimes(1);
    expect(component.activeFolder()).toBe('f-saved');
  });

  it('calls GET /workspaces/dropdown and never calls POST /workspaces/getall when loading workspaces', async () => {
    const httpMock = TestBed.inject(HttpTestingController);
    const dropdownStore = TestBed.inject(WorkspaceDropdownStore);
    dropdownStore.reset();

    vi.spyOn(component, 'loadWorkspaceMembers').mockImplementation(() => {});
    vi.spyOn(component as any, 'loadBoard').mockImplementation(() => {});

    component.getWorkspaces(true);

    const req = httpMock.expectOne(API_ENDPOINTS.workspaces.dropdown);
    expect(req.request.method).toBe('GET');
    httpMock.expectNone(API_ENDPOINTS.workspaces.getAll);

    req.flush({
      success: true,
      data: [
        {
          id: 'ws-new',
          name: 'New Workspace',
          folders: [{ id: 'f-new', name: 'General' }],
        },
      ],
    });

    await fixture.whenStable();

    expect(component.activeWorkspaceId()).toBe('ws-new');
    expect(component.activeFolder()).toBe('f-new');
    httpMock.expectNone(API_ENDPOINTS.workspaces.getAll);
  });
});
