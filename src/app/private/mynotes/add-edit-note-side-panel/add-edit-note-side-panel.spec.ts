import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { StickyMarkdownEditorComponent } from '../../../shared/components/sticky-markdown-editor/sticky-markdown-editor.component';
import { restoreStickySelection } from '../../../shared/utils/sticky-markdown/markdown-selection';
import { AddEditNoteSidePanel } from './add-edit-note-side-panel';
import { StickyNotePriority } from '../constants/sticky-note.constants';
import { Select } from '../../../shared/components/select/select';
import { DatepickerInput } from '../../../shared/components/datepicker-input/datepicker-input';
import { StickyNoteApiService } from '../services/sticky-notes.service';
import { StickyNoteChecklistApiService } from '../services/sticky-note-checklist.service';
import { StickyNoteAssigneeApiService } from '../services/sticky-note-assignee.service';
import { StickyNoteColumnStore } from '../services/sticky-note-column.store';
import { StickyNotesFavouriteService } from '../../sticky-notes-favourites/services/sticky-notes-favourite.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { WorkspaceDropdownStore } from '../../workspace/services/workspace-dropdown.store';
import { API_ENDPOINTS } from '../../../shared/constants/api.constants';
import { WorkspaceFolderStore } from '../../workspacefolders/services/workspace-folder.store';
import { WorkspaceMemberApiService } from '../../workspace-members/services/workspace-member.service';

describe('AddEditNoteSidePanel', () => {
  let component: AddEditNoteSidePanel;
  let fixture: ComponentFixture<AddEditNoteSidePanel>;
  const column = {
    id: 'column-1',
    name: 'To do',
    color: 'YELLOW',
    workspaceId: 'workspace-1',
    workspaceFolderId: 'folder-1',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditNoteSidePanel],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: WorkspaceStore,
          useValue: { workspaces: () => [{ id: 'workspace-1', name: 'Workspace' }] },
        },
        {
          provide: WorkspaceFolderStore,
          useValue: {
            initialized: () => true,
            workspaceId: () => 'workspace-1',
            activeFolders: () => [{ id: 'folder-1', name: 'Notes', status: 'ACTIVE' }],
          },
        },
        {
          provide: StickyNoteColumnStore,
          useValue: {
            initialized: () => true,
            workspaceId: () => 'workspace-1',
            workspaceFolderId: () => 'folder-1',
            contextMatches: () => true,
            findById: () => column,
            orderedColumns: () => [column],
          },
        },
        { provide: WorkspaceMemberApiService, useValue: { getAll: () => of({ data: [] }) } },
        {
          provide: StickyNoteChecklistApiService,
          useValue: { getByStickyNote: () => of({ data: [] }) },
        },
        {
          provide: StickyNoteAssigneeApiService,
          useValue: { getByStickyNote: () => of({ data: [] }), sync: () => of({ data: [] }) },
        },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(StickyNotesFavouriteService), 'getAll').mockReturnValue(
      of({ data: [] }),
    );
    vi.spyOn(TestBed.inject(StickyNoteApiService), 'getById').mockImplementation((id) =>
      of({
        data: {
          id,
          title: `Note ${id}`,
          content: 'Details',
          workspaceId: 'workspace-1',
          workspaceFolderId: 'folder-1',
          columnId: 'column-1',
        },
      }),
    );

    TestBed.inject(WorkspaceDropdownStore).setItems([
      { id: 'workspace-1', name: 'Workspace', folders: [{ id: 'folder-1', name: 'Notes' }] },
    ]);
    fixture = TestBed.createComponent(AddEditNoteSidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it.each(Object.values(StickyNotePriority))(
    'creates, reloads and clears %s priority through the API',
    async (priority) => {
      fixture.componentRef.setInput('id', 'column-1');
      fixture.componentRef.setInput('open', true);
      await fixture.whenStable();
      expect(component.form.controls.priority.value).toBe(StickyNotePriority.NONE);
      component.updateText('title', 'Priority test');
      component.updateText('content', 'Details');
      const select = fixture.debugElement.query(By.css('app-select[name="note-priority"]'))
        .componentInstance as Select;
      select.selectOption(select.options.find((option) => option.value === priority)!);
      await fixture.whenStable();
      expect(component.livePreviewData.priority).toBe(priority);
      const badge = fixture.nativeElement.querySelector(
        '.note-external-preview .sticky-note__priority-badge',
      );
      expect(Boolean(badge)).toBe(priority !== StickyNotePriority.NONE);

      component.submit();
      const http = TestBed.inject(HttpTestingController);
      const create = http.expectOne(API_ENDPOINTS.stickyNotes.create);
      expect(create.request.method).toBe('POST');
      expect(create.request.body.priority).toBe(priority);
      const saved = { id: 'saved-note', ...create.request.body };
      create.flush({ data: saved });
      expect(component.saveState()).toBe('saved');

      vi.mocked(TestBed.inject(StickyNoteApiService).getById).mockReturnValue(of({ data: saved }));
      fixture.componentRef.setInput('open', false);
      await fixture.whenStable();
      fixture.componentRef.setInput('mode', 'edit');
      fixture.componentRef.setInput('id', 'saved-note');
      fixture.componentRef.setInput('open', true);
      await fixture.whenStable();
      expect(component.form.controls.priority.value).toBe(priority);
      component.updateSelect('priority', StickyNotePriority.NONE);
      expect(component.saveIndicatorLabel()).toBe('Unsaved changes');
      component.submit();
      const update = http.expectOne(API_ENDPOINTS.stickyNotes.update('saved-note'));
      expect(update.request.method).toBe('PUT');
      expect(update.request.body.priority).toBe('NONE');
      update.flush({ data: { ...saved, priority: 'NONE' } });
      expect(component.saveState()).toBe('saved');
      expect(component.livePreviewData.priority).toBe('NONE');
    },
  );

  it('defaults older notes to NONE and resets priority when starting a new note', async () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('id', 'note-1');
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    expect(component.form.controls.priority.value).toBe('NONE');
    component.updateSelect('priority', 'URGENT');
    component.updateSelect('priority', 'INVALID');
    expect(component.form.controls.priority.value).toBe('URGENT');
    fixture.componentRef.setInput('mode', 'create');
    fixture.componentRef.setInput('id', 'column-1');
    await fixture.whenStable();
    expect(component.form.controls.priority.value).toBe('NONE');
  });

  it('updates both save badges when the date changes', async () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('id', 'note-1');
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    const datepicker = fixture.debugElement.query(By.directive(DatepickerInput))
      .componentInstance as DatepickerInput;
    datepicker.valueChange.emit('2026-11-01');
    await fixture.whenStable();
    expect(component.form.controls.noteDate.value).toBe('2026-11-01');
    expect(
      fixture.nativeElement.querySelector('.app-side-panel-note .app-badge-warning')?.textContent,
    ).toContain('Unsaved changes');
    expect(
      fixture.nativeElement.querySelector('.note-editor-footer .app-badge-warning')?.textContent,
    ).toContain('Unsaved changes');
  });

  it('shows id/name-only dropdown folders and accepts empty workspaces', () => {
    const dropdown = TestBed.inject(WorkspaceDropdownStore);
    component.form.controls.workspaceId.setValue('workspace-1');
    (component as any).loadFolders('workspace-1', 'folder-1');
    expect(component.folderOptions()).toEqual([{ label: 'Notes', value: 'folder-1' }]);
    dropdown.setItems([{ id: 'workspace-1', name: 'Workspace', folders: [] }]);
    (component as any).loadFolders('workspace-1');
    expect(component.folderOptions()).toEqual([]);
    expect(component.form.controls.workspaceFolderId.value).toBe('');
    expect(component.form.controls.columnId.value).toBe('');
    TestBed.inject(HttpTestingController).expectNone(API_ENDPOINTS.workspaceFolders.getAll);
  });

  it('shares a cold dropdown request and ignores folders for a previous workspace', () => {
    TestBed.inject(WorkspaceDropdownStore).reset();
    component.form.controls.workspaceId.setValue('old');
    (component as any).loadWorkspaces();
    (component as any).loadFolders('old');
    component.form.controls.workspaceId.setValue('new');
    (component as any).loadFolders('new');
    TestBed.inject(HttpTestingController)
      .expectOne(API_ENDPOINTS.workspaces.dropdown)
      .flush({
        data: [
          { id: 'old', name: 'Old', folders: [{ id: 'old-folder', name: 'Old folder' }] },
          { id: 'new', name: 'New', folders: [] },
        ],
      });
    expect(component.folderOptions()).toEqual([]);
    expect(component.form.controls.workspaceFolderId.value).toBe('');
  });

  it.each(['create', 'edit'] as const)(
    'sends Markdown strings through the existing %s payload and renders the reloaded note',
    async (mode) => {
      fixture.componentRef.setInput('mode', mode);
      fixture.componentRef.setInput('id', mode === 'create' ? 'column-1' : 'note-1');
      fixture.componentRef.setInput('open', true);
      await fixture.whenStable();
      const editors = fixture.debugElement.queryAll(By.directive(StickyMarkdownEditorComponent));
      const title = editors[0].componentInstance as StickyMarkdownEditorComponent;
      const details = editors[1].componentInstance as StickyMarkdownEditorComponent;
      component.form.controls.title.setValue('Launch');
      component.form.controls.content.setValue('Ship it');
      await fixture.whenStable();
      restoreStickySelection(title.surface.nativeElement, { start: 0, end: 6 });
      title.refreshSelection();
      title.command('bold');
      restoreStickySelection(details.surface.nativeElement, { start: 0, end: 4 });
      details.refreshSelection();
      details.applyHighlight({ color: 'green', style: 'soft' });
      await fixture.whenStable();
      expect(component.form.controls.title.value).toBe('**Launch**');
      expect(component.form.controls.content.value).toBe('=={green:soft}Ship== it');
      expect(component.form.dirty).toBe(true);
      const api = TestBed.inject(StickyNoteApiService);
      let saved: any;
      const capture = (payload: any) => {
        saved = { id: 'saved-note', ...payload };
        return of({ data: saved });
      };
      const create = vi.spyOn(api, 'create').mockImplementation(capture);
      const update = vi.spyOn(api, 'update').mockImplementation((_id, payload) => capture(payload));
      component.submit();
      expect(mode === 'create' ? create : update).toHaveBeenCalledOnce();
      expect(saved).toMatchObject({
        title: '**Launch**',
        content: '=={green:soft}Ship== it',
        workspaceId: 'workspace-1',
        workspaceFolderId: 'folder-1',
        columnId: 'column-1',
      });
      expect(saved.titleRichText).toBeUndefined();
      expect(saved.contentRichText).toBeUndefined();
      expect(component.saveState()).toBe('saved');
      vi.mocked(api.getById).mockReturnValue(of({ data: saved }));
      fixture.componentRef.setInput('open', false);
      await fixture.whenStable();
      fixture.componentRef.setInput('mode', 'edit');
      fixture.componentRef.setInput('id', 'saved-note');
      fixture.componentRef.setInput('open', true);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('#note-title strong')?.textContent).toBe('Launch');
      expect(fixture.nativeElement.querySelector('#note-content mark')?.dataset.color).toBe(
        'green',
      );
      expect(
        fixture.nativeElement.querySelector('.note-external-preview strong')?.textContent,
      ).toBe('Launch');
    },
  );

  it('keeps checklist text, completion, IDs and ordering independent', async () => {
    fixture.componentRef.setInput('id', 'column-1');
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    component.addBlock('CHECKLIST');
    component.updateChecklistTitle(0, '**Checks**');
    component.updateChecklistItemTitle(0, 0, '++Task++');
    component.setChecklistItemCompleted(0, 0, true);
    const item = component.checklistItems(0)!.at(0);
    item.get('id')!.setValue('existing-item');
    component.updateChecklistItemTitle(0, 0, '=={blue}Task==');
    expect(item.getRawValue()).toMatchObject({
      id: 'existing-item',
      title: '=={blue}Task==',
      isCompleted: true,
    });
    expect(component.checklistItems(0)!.length).toBe(1);
    expect(component.form.controls.withChecklist.value).toBe(true);
  });

  it.each(['create', 'edit'] as const)(
    'settles after repeated %s open and close cycles',
    async (mode) => {
      fixture.componentRef.setInput('mode', mode);
      const closed = component.closed.subscribe(() => fixture.componentRef.setInput('open', false));

      for (let index = 0; index < 3; index += 1) {
        fixture.componentRef.setInput('id', mode === 'create' ? 'column-1' : `note-${index}`);
        fixture.componentRef.setInput('open', true);
        await fixture.whenStable();

        expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
        expect(component.form.controls.title.value).toBe(
          mode === 'create' ? '' : `Note note-${index}`,
        );

        fixture.nativeElement.querySelector('button[aria-label="Close side panel"]').click();
        await fixture.whenStable();
        await vi.waitFor(() =>
          expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull(),
        );
        expect(fixture.isStable()).toBe(true);
      }

      closed.unsubscribe();
    },
  );

  it('controls assignees row visibility based on workspace members availability and selected assignees', async () => {
    fixture.componentRef.setInput('mode', 'create');
    fixture.componentRef.setInput('id', 'column-1');
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    // Default mock returns data: [], no assignees selected -> row is hidden
    const row: HTMLElement = fixture.nativeElement.querySelector('.note-assignees-row');
    expect(row).toBeTruthy();
    expect(component.hasAssignees()).toBe(false);
    expect(row.hidden).toBe(true);
    expect(row.classList.contains('is-hidden')).toBe(true);

    // When members exist, row becomes visible
    component.onHasWorkspaceMembersChange(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.hasAssignees()).toBe(true);
    expect(row.hidden).toBe(false);
    expect(row.classList.contains('is-hidden')).toBe(false);

    // If members become false but assignees are selected, row remains visible
    component.onHasWorkspaceMembersChange(false);
    component.selectedAssigneeIds.set(['user-1']);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.hasAssignees()).toBe(true);
    expect(row.hidden).toBe(false);
  });
});
