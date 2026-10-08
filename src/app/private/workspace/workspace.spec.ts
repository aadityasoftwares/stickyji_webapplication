import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Workspace } from './workspace';
import { WorkspaceService } from './services/workspace.service';
import { UserPreferenceService } from '../user-preferences/services/user-preference.service';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';

describe('Workspace', () => {
  let component: Workspace;
  let fixture: ComponentFixture<Workspace>;
  let preferences: UserPreferenceStore;
  let loadedPreferences: Subject<any>;
  let preferenceApi: {
    getMyPreferences: ReturnType<typeof vi.fn>;
    createPreference: ReturnType<typeof vi.fn>;
    updatePreference: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    loadedPreferences = new Subject();
    preferenceApi = {
      getMyPreferences: vi.fn(() => loadedPreferences),
      createPreference: vi.fn((key, value) => of({ data: { key, value } })),
      updatePreference: vi.fn((key, value) => of({ data: { key, value } })),
    };
    await TestBed.configureTestingModule({
      imports: [Workspace],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UserPreferenceService, useValue: preferenceApi },
        { provide: WorkspaceService, useValue: { getAllWorkspaces: () => of({ data: [] }) } },
      ],
    })
      .overrideComponent(Workspace, { set: { template: '', imports: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(Workspace);
    component = fixture.componentInstance;
    preferences = TestBed.inject(UserPreferenceStore);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(preferenceApi.getMyPreferences).toHaveBeenCalledOnce();
    expect([component.activeTab(), component.sortBy(), component.view()]).toEqual(['all', 'recent', 'grid']);
  });

  it('restores preferences that arrive after initialization', () => {
    loadedPreferences.next({ data: [
      { key: 'workspaceStatusFilter', value: 'ARCHIVED' },
      { key: 'workspaceSortOrder', value: 'NAME_DESC' },
      { key: 'workspaceView', value: 'LIST' },
    ] });
    expect([component.activeTab(), component.sortBy(), component.view()]).toEqual(['archived', 'name-desc', 'list']);
    expect(preferenceApi.createPreference).not.toHaveBeenCalled();
    expect(preferenceApi.updatePreference).not.toHaveBeenCalled();
  });

  it('creates new preferences and updates existing ones with the API values', () => {
    loadedPreferences.next({ data: [] });
    component.onStatusChange('archived');
    component.onSortChange('created');
    component.onViewChange('list');
    expect(preferenceApi.createPreference.mock.calls).toEqual([
      ['workspaceStatusFilter', 'ARCHIVED'],
      ['workspaceSortOrder', 'RECENTLY_CREATED'],
      ['workspaceView', 'LIST'],
    ]);
    component.onStatusChange('all');
    component.onSortChange('recent');
    component.onViewChange('grid');
    expect(preferenceApi.updatePreference.mock.calls).toEqual([
      ['workspaceStatusFilter', 'ALL'],
      ['workspaceSortOrder', 'RECENTLY_UPDATED'],
      ['workspaceView', 'GRID'],
    ]);
  });

  it('rolls back the displayed settings when saves fail', () => {
    loadedPreferences.next({ data: [] });
    preferenceApi.createPreference.mockImplementation(() => throwError(() => new Error('Save failed')));
    component.onStatusChange('archived');
    component.onSortChange('oldest');
    component.onViewChange('list');
    expect([component.activeTab(), component.sortBy(), component.view()]).toEqual(['all', 'recent', 'grid']);
    expect(preferences.error()).toBeTruthy();
  });

  it('ignores invalid control values and falls back for invalid saved preferences', () => {
    loadedPreferences.next({ data: [
      { key: 'workspaceStatusFilter', value: 'INVALID' },
      { key: 'workspaceSortOrder', value: 'INVALID' },
      { key: 'workspaceView', value: 'INVALID' },
    ] });
    component.onStatusChange('invalid');
    component.onSortChange('invalid');
    component.onViewChange('invalid');
    expect([component.activeTab(), component.sortBy(), component.view()]).toEqual(['all', 'recent', 'grid']);
    expect(preferenceApi.createPreference).not.toHaveBeenCalled();
    expect(preferenceApi.updatePreference).not.toHaveBeenCalled();
  });

  it.each([
    ['RECENTLY_UPDATED', ['a', 'b', 'c']],
    ['RECENTLY_CREATED', ['c', 'b', 'a']],
    ['NAME_ASC', ['b', 'a', 'c']],
    ['NAME_DESC', ['c', 'a', 'b']],
    ['OLDEST_FIRST', ['c', 'b', 'a']],
  ])('applies the saved %s sort order', (value, expected) => {
    component.workspaces.set([
      { id: 'a', name: 'Beta', status: 'ACTIVE', createdAt: '2026-01-01', updatedAt: '2026-03-03' },
      { id: 'b', name: 'Alpha', status: 'ARCHIVED', createdAt: '2026-01-02', updatedAt: '2026-03-02' },
      { id: 'c', name: 'Gamma', status: 'ACTIVE', createdAt: '2026-01-03', updatedAt: '2026-03-01' },
    ]);
    preferences.updatePreference('workspaceSortOrder', value);
    expect(component.visibleWorkspaces().map(item => item.id)).toEqual(expected);
    preferences.updatePreference('workspaceStatusFilter', 'ARCHIVED');
    expect(component.visibleWorkspaces().map(item => item.id)).toEqual(['b']);
  });
});
