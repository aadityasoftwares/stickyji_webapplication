import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Workspace } from './workspace';
import { WorkspaceService } from './services/workspace.service';
import { AuthStore } from '../../public/auth/state/auth.store';
import { UserPreferenceService } from '../user-preferences/services/user-preference.service';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { ToastService } from '../../shared/components/toast/services/toast.service';

const viewer = { id: 'viewer', name: 'Shared personal notes', status: 'ACTIVE', isPersonal: false,
  workspaceType: 'PERSONAL', workspaceTypeLabel: 'Personal', access: { label: 'Viewer', isOwner: false },
  allowedActions: { canView: true } };

describe('Workspace grid and list rendering', () => {
  let fixture: ComponentFixture<Workspace>;
  const api = { getAllWorkspaces: vi.fn(() => of({ data: [viewer], meta: { total: 1, counts: { all: 1, active: 1, archived: 0 },
    accessFilters: [{ value: 'ALL', label: 'All spaces', count: 1 }, { value: 'OWNED', label: 'My spaces', count: 0 },
      { value: 'SHARED', label: 'Shared with me', count: 1 }] } })) };
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Workspace], providers: [provideRouter([]),
      { provide: WorkspaceService, useValue: api },
      { provide: AuthStore, useValue: { canCreateWorkspace: signal(true), loadGlobalPermissions: vi.fn() } },
      { provide: UserPreferenceService, useValue: {
        getMyPreferences: () => of({ data: [] }),
        createPreference: (key: string, value: string) => of({ data: { key, value } }),
        updatePreference: (key: string, value: string) => of({ data: { key, value } }),
      } },
      { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(Workspace);
    fixture.detectChanges();
    await fixture.whenStable();
  });
  afterEach(() => fixture.destroy());

  it.each(['grid', 'list'])('renders backend labels and a view-only menu in %s', async view => {
    TestBed.inject(UserPreferenceStore).updatePreference('workspaceView', view.toUpperCase());
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Viewer');
    expect(root.textContent).toContain('Personal');
    expect(root.textContent).toContain('Shared with me');
    const trigger = root.querySelector<HTMLButtonElement>(view === 'grid' ? '.workspace-menu-trigger' : '.workspace-table-menu-button');
    trigger!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const menu = document.querySelector('.mat-mdc-menu-panel');
    expect(menu?.textContent).toContain('Open');
    expect(menu?.textContent).not.toContain('Edit workspace');
    expect(menu?.textContent).not.toContain('Move to trash');
    expect(menu?.textContent).not.toContain('Archive');
  });

  it('keeps global creation in the header but hides the creation card in shared spaces', () => {
    fixture.componentInstance.onAccessChange('SHARED');
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.workspace-new-button')).toBeTruthy();
    expect(root.querySelector('.workspace-create-folder')).toBeNull();
  });
});
