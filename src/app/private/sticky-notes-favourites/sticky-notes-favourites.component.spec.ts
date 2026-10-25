import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { StickyNotesFavouritesComponent } from './sticky-notes-favourites.component';
import { StickyNotesFavouriteService } from './services/sticky-notes-favourite.service';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { USER_PREFERENCE_KEYS } from '../../shared/constants/common.constants';

describe('StickyNotesFavouritesComponent', () => {
  let component: StickyNotesFavouritesComponent;
  let fixture: ComponentFixture<StickyNotesFavouritesComponent>;

  const favourites = [
    {
      _id: 'fav-1',
      createdAt: '2026-10-16T10:00:00.000Z',
      stickyNoteId: {
        _id: 'note-1',
        noteKey: 'ST-000001',
        title: 'Active note',
        content: 'First note',
        status: 'ACTIVE',
      },
    },
    {
      _id: 'fav-2',
      createdAt: '2026-10-15T10:00:00.000Z',
      stickyNoteId: {
        _id: 'note-2',
        noteKey: 'ST-000002',
        title: 'Archived note',
        content: 'Second note',
        status: 'ARCHIVED',
      },
    },
  ];

  beforeEach(async () => {
    vi.spyOn(StickyNotesFavouritesComponent.prototype, 'ngOnInit').mockImplementation(() => {});

    await TestBed.configureTestingModule({
      imports: [StickyNotesFavouritesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyNotesFavouritesComponent);
    component = fixture.componentInstance;
    component.rawFavorites.set(favourites);
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('normalizes favourite records and keeps active and archived counts', () => {
    expect(component.notes().map((note) => note.id)).toEqual(['note-1', 'note-2']);
    expect(component.totalCount()).toBe(2);
    expect(component.activeCount()).toBe(1);
    expect(component.archivedCount()).toBe(1);
  });

  it('filters favourites by status and search text', () => {
    component.setNoteTab('archived');
    expect(component.visibleNotes().map((note) => note.id)).toEqual(['note-2']);

    component.setNoteTab('all');
    component.updateSearch('first');
    expect(component.visibleNotes().map((note) => note.id)).toEqual(['note-1']);
  });

  it('renders the grouped list with the same status sections as Workspace', () => {
    component.setNoteView('list');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Active favourites');
    expect(text).toContain('Archived favourites');
    expect(text).toContain('ST-000001');
    expect(text).toContain('First note');
  });

  it('removes a note locally after it is unfavourited', () => {
    const service = TestBed.inject(StickyNotesFavouriteService);
    vi.spyOn(service, 'toggleFavorite').mockReturnValue(of({ isFavorite: false }));

    component.toggleFavorite(component.notes()[0]);

    expect(component.notes().map((note) => note.id)).toEqual(['note-2']);
  });

  it('rebuilds the shared favourite map without keeping stale notes', () => {
    const service = TestBed.inject(StickyNotesFavouriteService);
    service.populateFavorites(favourites);
    expect(service.isFavorite('note-1')).toBe(true);

    service.populateFavorites([favourites[1]]);
    expect(service.isFavorite('note-1')).toBe(false);
    expect(service.getFavoriteId('note-2')).toBe('fav-2');
  });

  it('normalizes backend payload when stickyNoteId is string ID and stickyNote is an object', () => {
    const backendPayload = [
      {
        id: '6adc8eca8f5dc13dcc656e76',
        _id: '6ade06e558a6f9d98d66db82',
        favoriteId: '6ade06e558a6f9d98d66db82',
        isFavorite: true,
        stickyNoteId: '6adc8eca8f5dc13dcc656e76',
        userId: '6ad59682326dc5646c51e557',
        status: 'ACTIVE',
        stickyNote: {
          id: '6adc8eca8f5dc13dcc656e76',
          noteKey: 'ST-000004',
          workspaceId: '6ad7a2bd96699829b7562a7b',
          workspaceFolderId: '6ada340d2a6b308c0a904019',
          folderName: 'Bugs Solutions',
          title: 'Test',
          content: 'Testing',
          color: 'YELLOW',
          shape: 'STRIP',
          status: 'ACTIVE',
        },
        title: 'Test',
        content: 'Testing',
      },
    ];

    component.rawFavorites.set(backendPayload);
    expect(component.notes().length).toBe(1);
    const note = component.notes()[0];
    expect(note.id).toBe('6adc8eca8f5dc13dcc656e76');
    expect(note.favoriteId).toBe('6ade06e558a6f9d98d66db82');
    expect(note.isFavorite).toBe(true);
    expect(note.title).toBe('Test');
    expect(note.content).toBe('Testing');
    expect(component.totalCount()).toBe(1);
    expect(component.activeCount()).toBe(1);
  });

  it('persists selected workspace under FAVORITE_SELECTED_WORKSPACE', () => {
    const userPrefStore = TestBed.inject(UserPreferenceStore);
    const saveSpy = vi.spyOn(userPrefStore, 'setAndSave');
    vi.spyOn(component, 'loadFavourites').mockImplementation(() => {});

    component.onWorkspaceChange('ws-fav-999');

    expect(saveSpy).toHaveBeenCalledWith(
      USER_PREFERENCE_KEYS.FAVORITE_SELECTED_WORKSPACE,
      'ws-fav-999',
    );
  });
});

