import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Today } from './today';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import { StickyNoteColumnStore } from '../mynotes/services/sticky-note-column.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { USER_PREFERENCE_KEYS } from '../../shared/constants/common.constants';

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
    TestBed.inject(WorkspaceStore).setWorkspaces([{ id: 'workspace', name: 'Workspace' }] as any);
    TestBed.inject(WorkspaceFolderStore).setFolders('workspace', [{ id: 'folder', name: 'Notes', status: 'ACTIVE' }] as any);
    TestBed.inject(StickyNoteColumnStore).setColumns('workspace', 'folder', [
      { id: 'todo', name: 'To do', position: 0, type: 'TODO' },
      { id: 'doing', name: 'In progress', position: 1, type: 'IN_PROGRESS' },
      { id: 'done', name: 'Done', position: 2, type: 'COMPLETED' }
    ] as any);
    TestBed.inject(UserPreferenceStore).updatePreference(USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT, 'DETAIL');
    component.stickyNotes.set([
      { id: 'second', title: 'Second note', description: 'Later task', columnId: 'todo', rank: 'b' },
      { id: 'first', title: 'First note', description: 'Matching task', columnId: 'todo', rank: 'a', creatorEmail: 'owner@example.test', updatedAt: '2026-10-04T00:00:00Z' },
      { id: 'third', title: 'Third note', description: 'Active task', columnId: 'doing', rank: 'a' }
    ]);
    component.setView('table');
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });

  it('groups notes in column and rank order, retaining empty stages', () => {
    expect(component.tableGroups().map(group => [group.id, group.count])).toEqual([
      ['todo', 2], ['doing', 1], ['done', 0]
    ]);
    expect(component.tableGroups()[0].notes.map(note => note.id)).toEqual(['first', 'second']);
    expect(fixture.nativeElement.querySelectorAll('.today-group-empty')).toHaveLength(1);
  });

  it('updates group counts and hides empty groups during search', async () => {
    component.updateSearch('Matching');
    await fixture.whenStable();
    expect(component.tableGroups().map(group => [group.id, group.count])).toEqual([['todo', 1]]);
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
    expect(fixture.nativeElement.querySelector('#group-body-todo')).toBeNull();
    expect(fixture.nativeElement.querySelector('#group-body-doing')).not.toBeNull();
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#group-body-todo')).not.toBeNull();
  });

  it('keeps the add action independent from group collapse', () => {
    const create = vi.spyOn(component, 'openNoteCreatePanel').mockImplementation(() => {});
    fixture.nativeElement.querySelector('button[aria-label="Add note to To do"]').click();
    expect(create).toHaveBeenCalledWith('todo');
    expect(component.isGroupCollapsed('todo')).toBe(false);
  });

  it('preserves detail metadata and compact view columns', async () => {
    expect(fixture.nativeElement.querySelectorAll('.today-gtable')[0].querySelectorAll('th')).toHaveLength(8);
    expect(fixture.nativeElement.querySelector('.today-gt-owner').textContent).toContain('owner@example.test');
    TestBed.inject(UserPreferenceStore).updatePreference(USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT, 'COMPACT');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.today-gtable')[0].querySelectorAll('th')).toHaveLength(5);
    expect(fixture.nativeElement.querySelector('td.today-gt-updated')).toBeNull();
  });

  it('keeps inline rename and edit actions attached to the correct note', async () => {
    const rename = vi.spyOn(component, 'startTableTitleEdit');
    fixture.nativeElement.querySelector('button[aria-label="Rename First note"]').click();
    await fixture.whenStable();
    expect(rename.mock.calls[0][0].id).toBe('first');
    expect(fixture.nativeElement.querySelector('[data-inline-note-title]').value).toBe('First note');
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
});
