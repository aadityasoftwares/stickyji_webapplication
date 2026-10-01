import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideAArrowUp,
  LucideArchive,
  LucideClock3,
  LucideLayoutGrid,
  LucideList,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideStar,
  LucideStarOff,
  LucideStickyNote,
  LucideTrash2,
  LucideType,
  LucideX
} from '@lucide/angular';

import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Input as AppInput } from '../../shared/components/input/input';
import { Loader } from '../../shared/components/loader/loader';
import { Select } from '../../shared/components/select/select';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { Tabs } from '../../shared/components/tabs/tabs';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { AddEditNoteSidePanel } from '../mynotes/add-edit-note-side-panel/add-edit-note-side-panel';
import { StickyNote as StickyNoteCardComponent } from '../mynotes/sticky-note/sticky-note';
import { StickyNoteApiService } from '../mynotes/services/sticky-notes.service';
import { StickyNotesFavouriteService } from './services/sticky-notes-favourite.service';

import {
  STICKY_NOTE_FONT_OPTIONS,
  STICKY_NOTE_FONT_SIZE_OPTIONS,
  STICKY_NOTE_LAYOUT_OPTIONS,
  USER_PREFERENCE_KEYS,
  VIEW,
  View
} from '../../shared/constants/common.constants';
import {
  extractErrorMessage,
  extractList,
  idOf
} from '../../shared/functions/common.function';
import {
  getNotePreview,
  getNoteTimestamp,
  getNoteTitle,
  getNoteUpdatedLabel,
  isNoteActive,
  isNoteArchived,
  isNoteDeleted,
  toColorCssClass
} from '../../shared/functions/sticky-note.function';
import { formatDateKeyDisplay } from '../../shared/functions/date.function';

@Component({
  selector: 'app-sticky-notes-favourites',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    AddEditNoteSidePanel,
    Badge,
    Button,
    Loader,
    Select,
    StickyCard,
    StickyNoteCardComponent,
    Tabs
  ],
  templateUrl: './sticky-notes-favourites.component.html',
  styleUrl: './sticky-notes-favourites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StickyNotesFavouritesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly favouriteApi = inject(StickyNotesFavouriteService);
  private readonly stickyNoteApi = inject(StickyNoteApiService);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly toastService = inject(ToastService);

  /* -------------------------------------------------------------------------- */
  /*                                    Icons                                   */
  /* -------------------------------------------------------------------------- */
  readonly LucideAArrowUp = LucideAArrowUp;
  readonly LucideArchive = LucideArchive;
  readonly LucideClock3 = LucideClock3;
  readonly LucideLayoutGrid = LucideLayoutGrid;
  readonly LucideList = LucideList;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideStar = LucideStar;
  readonly LucideStarOff = LucideStarOff;
  readonly LucideStickyNote = LucideStickyNote;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideType = LucideType;
  readonly LucideX = LucideX;

  /* -------------------------------------------------------------------------- */
  /*                               Preferences                                  */
  /* -------------------------------------------------------------------------- */
  readonly stickyNoteLayoutOptions: any[] = STICKY_NOTE_LAYOUT_OPTIONS;
  readonly stickyNoteFontOptions: any[] = STICKY_NOTE_FONT_OPTIONS.map(option => ({
    ...option,
    icon: LucideType
  }));
  readonly stickyNoteFontSizeOptions: any[] = STICKY_NOTE_FONT_SIZE_OPTIONS.map(option => ({
    ...option,
    icon: LucideAArrowUp
  }));

  readonly stickyNoteLayout = this.userPreferenceStore.stickyNoteLayout;
  readonly stickyNoteFont = this.userPreferenceStore.stickyNoteFont;
  readonly stickyNoteFontSize = this.userPreferenceStore.stickyNoteFontSize;

  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */
  readonly rawFavorites = signal<readonly any[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<any>('all');
  readonly view = signal<View>(VIEW.GRID);
  readonly searchTerm = signal('');
  readonly sortBy = signal<any>('favoritedAt');
  readonly busyIds = signal<ReadonlySet<string>>(new Set());

  /* Side panel state */
  readonly notePanelOpen = signal(false);
  readonly notePanelMode = signal<'create' | 'edit'>('edit');
  readonly notePanelId = signal('');

  /* Delete confirmation dialog */
  readonly deleteTarget = signal<any | null>(null);
  readonly deleting = signal(false);

  /* Sort options */
  readonly sortOptions: readonly any[] = [
    { label: 'Recently favourited', value: 'favoritedAt', icon: LucideClock3 },
    { label: 'Recently updated',    value: 'updatedAt',   icon: LucideClock3 },
    { label: 'Recently created',    value: 'createdAt',   icon: LucideClock3 },
    { label: 'Title A–Z',           value: 'title',       icon: LucideType   }
  ];

  /* View tabs */
  readonly viewTabs: readonly any[] = [
    { value: VIEW.GRID,  label: 'Grid',  icon: LucideLayoutGrid, ariaLabel: 'Grid view' },
    { value: VIEW.TABLE, label: 'Table', icon: LucideList,       ariaLabel: 'Table view' }
  ];

  /* -------------------------------------------------------------------------- */
  /*                              Computed Signals                              */
  /* -------------------------------------------------------------------------- */
  /**
   * Normalizes the backend favorite records into note objects
   * with favoriteId and isFavorite attached.
   */
  readonly notes = computed<readonly any[]>(() => {
    const list = this.rawFavorites();
    const result: any[] = [];

    for (const item of list) {
      if (!item) continue;
      // Backend populates stickyNoteId
      const noteDoc = item?.stickyNoteId ?? item?.stickyNote ?? item;
      if (!noteDoc || typeof noteDoc !== 'object') continue;

      const noteId = idOf(noteDoc);
      if (!noteId) continue;

      const favoriteId = idOf(item);

      result.push({
        ...noteDoc,
        id: noteId,
        favoriteId: favoriteId || noteId,
        isFavorite: true,
        favoritedAt: item?.createdAt ?? noteDoc?.createdAt
      });
    }

    return result;
  });

  readonly totalCount = computed(() => this.notes().filter(note => !isNoteDeleted(note)).length);
  readonly activeCount = computed(() => this.notes().filter(note => isNoteActive(note)).length);
  readonly archivedCount = computed(() => this.notes().filter(note => isNoteArchived(note)).length);

  readonly noteTabs = computed<readonly any[]>(() => [
    { value: 'all',      label: 'All',      count: this.totalCount(),    icon: LucideStar,       ariaLabel: 'All favourites' },
    { value: 'active',   label: 'Active',   count: this.activeCount(),   icon: LucideStickyNote, ariaLabel: 'Active favourites' },
    { value: 'archived', label: 'Archived', count: this.archivedCount(), icon: LucideArchive,    ariaLabel: 'Archived favourites' }
  ]);

  readonly visibleNotes = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    return [...this.notes()]
      .filter(note => {
        if (isNoteDeleted(note)) return false;
        if (tab === 'active' && !isNoteActive(note)) return false;
        if (tab === 'archived' && !isNoteArchived(note)) return false;

        if (!search) return true;

        const title = this.noteTitle(note).toLowerCase();
        const content = (note?.content ?? note?.description ?? '').toLowerCase();
        const key = (note?.noteKey ?? '').toLowerCase();

        return title.includes(search) || content.includes(search) || key.includes(search);
      })
      .sort((a, b) => {
        if (sort === 'title') {
          return this.noteTitle(a).localeCompare(this.noteTitle(b));
        }

        if (sort === 'favoritedAt') {
          const timeA = a?.favoritedAt ? new Date(a.favoritedAt).getTime() : 0;
          const timeB = b?.favoritedAt ? new Date(b.favoritedAt).getTime() : 0;
          return timeB - timeA;
        }

        return getNoteTimestamp(b, sort) - getNoteTimestamp(a, sort);
      });
  });

  /* -------------------------------------------------------------------------- */
  /*                                 Lifecycle                                  */
  /* -------------------------------------------------------------------------- */
  ngOnInit(): void {
    this.userPreferenceStore.load();
    this.loadFavourites();
  }

  /* -------------------------------------------------------------------------- */
  /*                              Data Fetching                                 */
  /* -------------------------------------------------------------------------- */
  loadFavourites(force = false): void {
    if (this.loading() && !force) return;

    this.loading.set(true);
    this.error.set(null);

    this.favouriteApi
      .getAll({ status: 'ACTIVE', limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          const list = extractList(response);
          this.rawFavorites.set(list);
          this.error.set(null);
        },
        error: (err: any) => {
          const message = extractErrorMessage(err, 'Could not load favourite notes.');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  refresh(): void {
    this.loadFavourites(true);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Favourite Actions                             */
  /* -------------------------------------------------------------------------- */
  toggleFavorite(note: any, event?: Event): void {
    event?.stopPropagation();
    const noteId = idOf(note);
    const favoriteId = note?.favoriteId ? idOf(note.favoriteId) : '';

    if (!noteId || this.isBusy(note)) return;

    this.setBusy(noteId, true);

    if (favoriteId) {
      // Removing from favourites
      this.favouriteApi
        .delete(favoriteId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.setBusy(noteId, false))
        )
        .subscribe({
          next: () => {
            this.rawFavorites.update(favs =>
              favs.filter(item => {
                const itemNoteId = idOf(item?.stickyNoteId ?? item);
                const itemFavId = idOf(item);
                return itemFavId !== favoriteId && itemNoteId !== noteId;
              })
            );
            this.toastService.success('Removed from favourites');
          },
          error: (err: any) => {
            this.toastService.error(
              extractErrorMessage(err, 'Could not remove from favourites.')
            );
          }
        });
    } else {
      // Adding to favourites
      this.favouriteApi
        .create({ stickyNoteId: noteId })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.setBusy(noteId, false))
        )
        .subscribe({
          next: (res: any) => {
            this.toastService.success('Added to favourites');
            this.refresh();
          },
          error: (err: any) => {
            this.toastService.error(
              extractErrorMessage(err, 'Could not add to favourites.')
            );
          }
        });
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              Note Actions                                  */
  /* -------------------------------------------------------------------------- */
  openEditEditor(note: any, event?: Event): void {
    event?.stopPropagation();
    const noteId = idOf(note);
    if (!noteId) return;

    this.notePanelId.set(noteId);
    this.notePanelMode.set('edit');
    this.notePanelOpen.set(true);
  }

  closeNotePanel(): void {
    this.notePanelOpen.set(false);
    this.notePanelId.set('');
  }

  onNoteSaved(noteId: string): void {
    this.closeNotePanel();
    this.refresh();
  }

  archiveNote(note: any): void {
    const noteId = idOf(note);
    if (!noteId || this.isBusy(note)) return;

    this.setBusy(noteId, true);
    this.stickyNoteApi
      .archive(noteId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setBusy(noteId, false))
      )
      .subscribe({
        next: () => {
          this.toastService.success('Note archived');
          this.refresh();
        },
        error: (err: any) => {
          this.toastService.error(extractErrorMessage(err, 'Could not archive note.'));
        }
      });
  }

  activateNote(note: any): void {
    const noteId = idOf(note);
    if (!noteId || this.isBusy(note)) return;

    this.setBusy(noteId, true);
    this.stickyNoteApi
      .updateStatus(noteId, 'ACTIVE')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setBusy(noteId, false))
      )
      .subscribe({
        next: () => {
          this.toastService.success('Note restored to active');
          this.refresh();
        },
        error: (err: any) => {
          this.toastService.error(extractErrorMessage(err, 'Could not restore note.'));
        }
      });
  }

  requestDelete(note: any): void {
    this.deleteTarget.set(note);
  }

  closeDeleteDialog(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
  }

  confirmDelete(): void {
    const note = this.deleteTarget();
    const noteId = idOf(note);
    if (!noteId || this.deleting()) return;

    this.deleting.set(true);
    this.stickyNoteApi
      .moveToTrash(noteId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.deleting.set(false);
          this.closeDeleteDialog();
        })
      )
      .subscribe({
        next: () => {
          this.toastService.success('Note moved to trash');
          this.refresh();
        },
        error: (err: any) => {
          this.toastService.error(extractErrorMessage(err, 'Could not delete note.'));
        }
      });
  }

  updateNoteTitle(change: any): void {
    const noteId = String(change?.noteId ?? '').trim();
    const title = String(change?.title ?? '').trim();
    const note = this.notes().find(item => idOf(item) === noteId);

    if (!noteId || !title || !note || this.isBusy(note)) return;
    if (this.noteTitle(note) === title) return;

    this.setBusy(noteId, true);
    this.stickyNoteApi
      .update(noteId, { title })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setBusy(noteId, false))
      )
      .subscribe({
        next: () => {
          this.refresh();
        },
        error: (err: any) => {
          this.toastService.error(extractErrorMessage(err, 'Could not rename note.'));
        }
      });
  }

  updateNoteDescription(change: any): void {
    const noteId = String(change?.noteId ?? '').trim();
    const content = String(change?.description ?? change?.content ?? '').trim();
    const note = this.notes().find(item => idOf(item) === noteId);

    if (!noteId || !note || this.isBusy(note)) return;

    this.setBusy(noteId, true);
    this.stickyNoteApi
      .update(noteId, { content })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setBusy(noteId, false))
      )
      .subscribe({
        next: () => {
          this.refresh();
        },
        error: (err: any) => {
          this.toastService.error(extractErrorMessage(err, 'Could not update note content.'));
        }
      });
  }

  onNoteDeleted(noteId: string): void {
    this.rawFavorites.update(favs =>
      favs.filter(item => idOf(item?.stickyNoteId ?? item) !== noteId)
    );
  }

  onNoteUpdated(updated: any): void {
    this.refresh();
  }

  /* -------------------------------------------------------------------------- */
  /*                              Toolbar / Filtering                           */
  /* -------------------------------------------------------------------------- */
  setNoteTab(tab: any): void {
    this.activeTab.set(tab);
  }

  setNoteView(view: any): void {
    this.view.set(view);
  }

  updateSearch(value: any): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(sort: any): void {
    this.sortBy.set(sort);
  }

  chooseFont(value: any): void {
    const font = String(value ?? '').trim();
    if (!font) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT, font);
  }

  onStickyNoteFontSizeSelection(value: any): void {
    const size = Number(value);
    if (!size) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT_SIZE, size);
  }

  onStickyNoteLayoutSelection(value: any): void {
    const layout = String(value ?? '').trim();
    if (!layout) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT, layout);
  }

  isCompactLayout(): boolean {
    const layout = String(this.stickyNoteLayout() ?? 'DETAIL').trim().toUpperCase();
    return layout === 'COMPACT' || layout === 'PLAIN';
  }

  /* -------------------------------------------------------------------------- */
  /*                             Template Helpers                               */
  /* -------------------------------------------------------------------------- */
  noteId(note: any): string {
    return idOf(note);
  }

  noteTitle(note: any): string {
    return getNoteTitle(note);
  }

  notePreview(note: any): string {
    return getNotePreview(note);
  }

  noteUpdatedLabel(note: any): string {
    return getNoteUpdatedLabel(note);
  }

  noteColorKey(note: any): string {
    return toColorCssClass(note?.color ?? 'WHITE');
  }

  noteColorLabel(note: any): string {
    const raw = String(note?.color ?? 'WHITE').toLowerCase();
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  isActive(note: any): boolean {
    return isNoteActive(note);
  }

  isArchived(note: any): boolean {
    return isNoteArchived(note);
  }

  isBusy(note: any): boolean {
    const id = idOf(note);
    return id ? this.busyIds().has(id) : false;
  }

  private setBusy(id: string, busy: boolean): void {
    this.busyIds.update(current => {
      const next = new Set(current);
      if (busy) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  /**
   * Transforms note data for app-sticky-note component
   */
  stickyNoteData(note: any): any {
    const content = note?.content ?? note?.description ?? '';
    const title = this.noteTitle(note);

    return {
      ...note,
      id: idOf(note),
      noteKey: note?.noteKey ?? (typeof note?.stickyNoteNumber === 'number'
        ? `ST-${String(note.stickyNoteNumber).padStart(6, '0')}`
        : undefined),
      title,
      content,
      description: content && content !== title ? content : '',
      eyebrow: 'Favourite Note',
      view: this.view(),
      layout: this.stickyNoteLayout(),
      font: this.stickyNoteFont(),
      fontSize: this.stickyNoteFontSize(),
      color: note?.color ?? 'WHITE',
      shape: note?.shape ?? 'SQUARE',
      variant: note?.variant ?? 'PLAIN',
      backgroundPattern: note?.backgroundPattern ?? 'NONE',
      compact: this.isCompactLayout(),
      dueLabel: note?.noteDate
        ? formatDateKeyDisplay(note.noteDate, '', 'en')
        : this.noteUpdatedLabel(note),
      tag: isNoteArchived(note) ? 'Archived' : 'Active',
      tagVariant: isNoteArchived(note) ? 'neutral' : 'success',
      assignees: note?.assignees ?? [],
      checklists: note?.checklists ?? [],
      showDragHandle: false,
      showEditAction: true,
      showMoveActions: false,
      actionsDisabled: this.isBusy(note),
      minHeight: 156,
      padding: 12
    };
  }
}
