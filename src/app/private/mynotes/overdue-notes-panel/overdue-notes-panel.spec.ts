import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { OverdueNotesPanel } from './overdue-notes-panel';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { UserDateTimeFormatterService } from '../../../shared/services/user-date-time-formatter.service';

const notes = [
  {
    id: 'one',
    noteKey: 'ST-000001',
    title: 'Yesterday task',
    content: '',
    noteDate: '2026-10-04',
    daysOverdue: 1,
    workspaceId: 'workspace',
    workspaceFolderId: 'folder',
    column: { id: 'todo', name: 'To Do', type: 'TODO' },
  },
  {
    id: 'two',
    noteKey: 'ST-000002',
    title: 'Earlier task',
    content: '',
    noteDate: '2026-10-02',
    daysOverdue: 3,
    workspaceId: 'workspace',
    workspaceFolderId: 'folder',
    column: { id: 'doing', name: 'In Progress', type: 'IN_PROGRESS' },
  },
];
const data = {
  today: '2026-10-05',
  total: 2,
  notes,
  byColumn: [
    { columnId: 'todo', name: 'To Do', type: 'TODO', count: 1 },
    { columnId: 'doing', name: 'In Progress', type: 'IN_PROGRESS', count: 1 },
  ],
};

describe('OverdueNotesPanel', () => {
  let fixture: ComponentFixture<OverdueNotesPanel>;
  let component: OverdueNotesPanel;
  let element: HTMLElement;
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [OverdueNotesPanel],
      providers: [provideHttpClient()],
    });
    fixture = TestBed.createComponent(OverdueNotesPanel);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('data', data);
    await fixture.whenStable();
  });

  it('groups by backend date and formats planned dates with user preferences', () => {
    expect(component.groups().map((group) => group.date)).toEqual(['2026-10-04', '2026-10-02']);
    expect(element.querySelector('.overdue-group h3')?.textContent).toContain('Yesterday');
    const formatted = TestBed.inject(UserDateTimeFormatterService).formatDateKey(notes[1].noteDate);
    expect(element.textContent).toContain(`Planned: ${formatted}`);
    expect(element.textContent).toContain('3 days overdue');
  });

  it('supports individual and select-all selection without changing API notes', async () => {
    component.selectionChange.subscribe((ids) => fixture.componentRef.setInput('selectedIds', ids));
    const checkboxes = element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    checkboxes[1].click();
    await fixture.whenStable();
    expect([...component.selectedIds()]).toEqual(['one']);
    expect(checkboxes[0].indeterminate).toBe(true);
    checkboxes[0].click();
    await fixture.whenStable();
    expect([...component.selectedIds()]).toEqual(['one', 'two']);
    component.clearSelection();
    await fixture.whenStable();
    expect(component.selectedIds().size).toBe(0);
    expect(Object.keys(notes[0])).not.toContain('selected');
  });

  it('filters the loaded page and selects only visible IDs', async () => {
    const selection = vi.fn();
    component.selectionChange.subscribe(selection);
    fixture.componentRef.setInput('columnFilter', 'doing');
    await fixture.whenStable();
    expect(element.querySelectorAll('.overdue-note')).toHaveLength(1);
    component.selectVisible(true);
    expect([...selection.mock.calls[0][0]]).toEqual(['two']);
  });

  it('uses one action for single and bulk IDs and disables duplicate submissions', async () => {
    const bring = vi.fn();
    component.bringToToday.subscribe(bring);
    const single = element.querySelector<HTMLButtonElement>('.overdue-note-actions button');
    single?.click();
    expect(bring).toHaveBeenLastCalledWith(['one']);
    fixture.componentRef.setInput('selectedIds', new Set(['one', 'two']));
    await fixture.whenStable();
    const bulk = element.querySelector<HTMLButtonElement>(
      '.overdue-footer app-button:last-child button',
    );
    bulk?.click();
    expect(bring).toHaveBeenLastCalledWith(['one', 'two']);
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();
    expect(bulk?.disabled).toBe(true);
    expect(single?.disabled).toBe(true);
  });

  it('shows loading and error states without flashing an empty list', async () => {
    fixture.componentRef.setInput('data', null);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect(element.textContent).toContain('Loading overdue notes');
    expect(element.textContent).not.toContain("You're all caught up");
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', 'Unavailable');
    await fixture.whenStable();
    expect(element.textContent).toContain('Try again');
    fixture.componentRef.setInput('error', null);
    await fixture.whenStable();
    expect(element.textContent).toContain("You're all caught up");
  });

  it('keeps pagination accessible when a status has no notes on the current page', async () => {
    fixture.componentRef.setInput('columnFilter', 'review');
    fixture.componentRef.setInput('pagination', { page: 1, limit: 20, total: 21, totalPages: 2 });
    await fixture.whenStable();
    expect(element.textContent).toContain('No notes in this status on this page.');
    expect(element.querySelector('nav[aria-label="Overdue notes pages"]')).toBeTruthy();
    expect(element.textContent).toContain('Filters and Select all apply to this page.');
  });

  it('closes with Escape without changing note data', () => {
    const close = vi.fn();
    const bring = vi.fn();
    component.closed.subscribe(close);
    component.bringToToday.subscribe(bring);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(close).toHaveBeenCalledOnce();
    expect(bring).not.toHaveBeenCalled();
  });

  it('opens the existing editor only after the shared panel releases focus and scroll', async () => {
    const open = vi.fn();
    component.openNote.subscribe(open);
    component.closed.subscribe(() => fixture.componentRef.setInput('open', false));
    component.requestOpen(notes[0]);
    fixture.detectChanges();
    expect(open).not.toHaveBeenCalled();
    await fixture.whenStable();
    await vi.waitFor(() => expect(open).toHaveBeenCalledWith(notes[0]));
    const shell = fixture.debugElement.query(By.directive(SidePanel))
      .componentInstance as SidePanel;
    expect(shell.rendered()).toBe(false);
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
