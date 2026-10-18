import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AddEditWorkspaceFolderSidePanel } from './add-edit-workspace-folder-side-panel';
import { WorkspaceFolderService } from '../services/workspace-folder.service';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

const folder = {
  id: 'f',
  workspaceId: 'w',
  name: 'Fresh name',
  description: 'Fresh details',
  status: 'ACTIVE',
};
describe('Folder editor sessions', () => {
  let fixture: ComponentFixture<AddEditWorkspaceFolderSidePanel>;
  const api = { getById: vi.fn(), create: vi.fn(), update: vi.fn() };
  const workspaceApi = { getById: vi.fn() };
  beforeEach(async () => {
    api.getById.mockReset().mockReturnValue(of({ data: folder }));
    api.create.mockReset().mockReturnValue(of({ data: folder }));
    api.update.mockReset().mockReturnValue(of({ data: folder }));
    workspaceApi.getById
      .mockReset()
      .mockReturnValue(of({ data: { id: 'w', status: 'ACTIVE', isOwner: true } }));
    await TestBed.configureTestingModule({
      imports: [AddEditWorkspaceFolderSidePanel],
      providers: [
        provideHttpClient(),
        { provide: WorkspaceFolderService, useValue: api },
        { provide: WorkspaceService, useValue: workspaceApi },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    })
      .overrideComponent(AddEditWorkspaceFolderSidePanel, {
        set: {
          template:
            '<ng-template #desktopPreview></ng-template><div #folderNameInput><input [value]="name()" /></div>',
          imports: [],
        },
      })
      .compileComponents();
    fixture = TestBed.createComponent(AddEditWorkspaceFolderSidePanel);
    fixture.componentRef.setInput('workspaceId', 'w');
    fixture.componentRef.setInput('open', true);
  });

  it('focuses the loaded name with the caret at the end', () => {
    const frames: FrameRequestCallback[] = [];
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    try {
      fixture.componentRef.setInput('id', 'f');
      fixture.detectChanges();
      while (frames.length) frames.shift()!(0);
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('Fresh name');
      expect(document.activeElement).toBe(input);
      expect(input.selectionStart).toBe(input.value.length);
      expect(input.selectionEnd).toBe(input.value.length);
    } finally {
      raf.mockRestore();
    }
  });

  it('accepts backend limits and associates creates with the current workspace', () => {
    fixture.detectChanges();
    const panel = fixture.componentInstance;
    panel.updateName('A');
    panel.updateDescription('x'.repeat(500));
    expect(panel.canSubmit).toBe(true);
    panel.submit();
    expect(api.create).toHaveBeenCalledWith({
      name: 'A',
      description: 'x'.repeat(500),
      workspaceId: 'w',
    });
    panel.updateName('x'.repeat(101));
    expect(panel.canSubmit).toBe(false);
  });

  it('loads fresh detail even when a cached folder was passed', () => {
    fixture.componentRef.setInput('folder', { ...folder, name: 'Stale name' });
    fixture.componentRef.setInput('id', 'f');
    fixture.detectChanges();
    expect(api.getById).toHaveBeenCalledWith('f');
    expect(fixture.componentInstance.name()).toBe('Fresh name');
    expect(fixture.componentInstance.canSubmit).toBe(false);
  });

  it('allows an invited editor to create a folder', () => {
    workspaceApi.getById.mockReturnValue(
      of({ data: { id: 'w', status: 'ACTIVE', isOwner: false, isInvited: true, role: 'editor' } }),
    );
    fixture.detectChanges();
    const panel = fixture.componentInstance;
    panel.updateName('Shared folder');
    expect(panel.canSubmit).toBe(true);
    panel.submit();
    expect(api.create).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'w', name: 'Shared folder' }),
    );
  });

  it('allows an invited editor to load and save an existing folder', () => {
    workspaceApi.getById.mockReturnValue(
      of({ data: { id: 'w', status: 'ACTIVE', isOwner: false, isInvited: true, role: 'editor' } }),
    );
    fixture.componentRef.setInput('id', 'f');
    fixture.detectChanges();
    const panel = fixture.componentInstance;
    expect(api.getById).toHaveBeenCalledWith('f');
    panel.updateName('Updated shared folder');
    expect(panel.canSubmit).toBe(true);
    panel.submit();
    expect(api.update).toHaveBeenCalledWith(
      'f',
      expect.objectContaining({ name: 'Updated shared folder' }),
    );
  });

  it('keeps unsaved input after a failed submission and prevents concurrent saves', () => {
    fixture.detectChanges();
    const response = new Subject();
    api.create.mockReturnValue(response);
    const panel = fixture.componentInstance;
    panel.updateName('Unsaved');
    panel.submit();
    panel.submit();
    expect(api.create).toHaveBeenCalledTimes(1);
    response.error({ status: 500, error: { message: 'Try again' } });
    expect(panel.name()).toBe('Unsaved');
    expect(panel.dirty()).toBe(true);
    expect(panel.loading()).toBe(false);
    expect(panel.error()).toBe('Try again');
  });

  it('cancels old detail requests when switching targets or closing', () => {
    const old = new Subject();
    api.getById.mockReturnValueOnce(old);
    fixture.componentRef.setInput('id', 'old');
    fixture.detectChanges();
    fixture.componentRef.setInput('id', 'f');
    fixture.detectChanges();
    expect(old.observed).toBe(false);
    old.next({ data: { ...folder, name: 'Wrong' } });
    expect(fixture.componentInstance.name()).toBe('Fresh name');
    const pending = new Subject();
    api.getById.mockReturnValueOnce(pending);
    fixture.componentRef.setInput('id', 'pending');
    fixture.detectChanges();
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(pending.observed).toBe(false);
    expect(fixture.componentInstance.loadingData()).toBe(false);
  });

  it('blocks submission for a trashed folder', () => {
    api.getById.mockReturnValue(of({ data: { ...folder, status: 'DELETED' } }));
    fixture.componentRef.setInput('id', 'f');
    fixture.detectChanges();
    fixture.componentInstance.updateName('Cannot edit');
    fixture.componentInstance.submit();
    expect(api.update).not.toHaveBeenCalled();
  });
});
