import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AddEditNoteSidePanel } from './add-edit-note-side-panel';
import { StickyNoteApiService } from '../services/sticky-notes.service';
import { StickyNoteChecklistApiService } from '../services/sticky-note-checklist.service';
import { StickyNoteAssigneeApiService } from '../services/sticky-note-assignee.service';
import { StickyNoteColumnStore } from '../services/sticky-note-column.store';
import { StickyNotesFavouriteService } from '../../sticky-notes-favourites/services/sticky-notes-favourite.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { WorkspaceFolderStore } from '../../workspacefolders/services/workspace-folder.store';
import { WorkspaceMemberApiService } from '../../workspace-members/services/workspace-member.service';

describe('AddEditNoteSidePanel', () => {
  let component: AddEditNoteSidePanel;
  let fixture: ComponentFixture<AddEditNoteSidePanel>;
  const column = { id: 'column-1', name: 'To do', color: 'YELLOW', workspaceId: 'workspace-1', workspaceFolderId: 'folder-1' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditNoteSidePanel],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WorkspaceStore, useValue: { workspaces: () => [{ id: 'workspace-1', name: 'Workspace' }] } },
        { provide: WorkspaceFolderStore, useValue: {
          initialized: () => true,
          workspaceId: () => 'workspace-1',
          activeFolders: () => [{ id: 'folder-1', name: 'Notes', status: 'ACTIVE' }]
        } },
        { provide: StickyNoteColumnStore, useValue: {
          initialized: () => true,
          workspaceId: () => 'workspace-1',
          workspaceFolderId: () => 'folder-1',
          contextMatches: () => true,
          findById: () => column,
          orderedColumns: () => [column]
        } },
        { provide: WorkspaceMemberApiService, useValue: { getAll: () => of({ data: [] }) } },
        { provide: StickyNoteChecklistApiService, useValue: { getByStickyNote: () => of({ data: [] }) } },
        { provide: StickyNoteAssigneeApiService, useValue: { getByStickyNote: () => of({ data: [] }) } }
      ]
    }).compileComponents();

    vi.spyOn(TestBed.inject(StickyNotesFavouriteService), 'getAll').mockReturnValue(of({ data: [] }));
    vi.spyOn(TestBed.inject(StickyNoteApiService), 'getById').mockImplementation(id => of({
      data: { id, title: `Note ${id}`, content: 'Details', workspaceId: 'workspace-1', workspaceFolderId: 'folder-1', columnId: 'column-1' }
    }));

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

  it.each(['create', 'edit'] as const)('settles after repeated %s open and close cycles', async mode => {
    fixture.componentRef.setInput('mode', mode);
    const closed = component.closed.subscribe(() => fixture.componentRef.setInput('open', false));

    for (let index = 0; index < 3; index += 1) {
      fixture.componentRef.setInput('id', mode === 'create' ? 'column-1' : `note-${index}`);
      fixture.componentRef.setInput('open', true);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
      expect(component.form.controls.title.value).toBe(mode === 'create' ? '' : `Note note-${index}`);

      fixture.nativeElement.querySelector('button[aria-label="Close side panel"]').click();
      await fixture.whenStable();
      await vi.waitFor(() => expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull());
      expect(fixture.isStable()).toBe(true);
    }

    closed.unsubscribe();
  });
});
