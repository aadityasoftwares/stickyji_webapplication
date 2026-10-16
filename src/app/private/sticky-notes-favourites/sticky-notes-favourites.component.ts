import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideArchive,
  LucideCheck,
  LucideClock3,
  LucideColumns3,
  LucideCopy,
  LucideFolderOpen,
  LucideMoreHorizontal,
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
import { Switch } from '../../shared/components/switch/switch';
import { Tabs } from '../../shared/components/tabs/tabs';
import { Tooltip } from '../../shared/components/tooltip/tooltip';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { AddEditNoteSidePanel } from '../mynotes/add-edit-note-side-panel/add-edit-note-side-panel';
import { StickyNote as StickyNoteCardComponent } from '../mynotes/sticky-note/sticky-note';
import { StickyNoteApiService } from '../mynotes/services/sticky-notes.service';
import { StickyNotesFavouriteService } from './services/sticky-notes-favourite.service';

import { VIEW_TABS } from '../../shared/constants/common.constants';
import {
  extractErrorMessage,
  extractList,
  idOf
} from '../../shared/functions/common.function';
import {
  getNoteContent,
  getNoteTimestamp,
  getNoteTitle,
  isNoteActive,
  isNoteArchived,
  isNoteDeleted,
  toColorCssClass
} from '../../shared/functions/sticky-note.function';
import { UserDatePipe } from '../../shared/pipes/user-date.pipe';
import { UserTimePipe } from '../../shared/pipes/user-time.pipe';
import { UserDateTimeFormatterService } from '../../shared/services/user-date-time-formatter.service';

type FavouriteFilter = 'all' | 'active' | 'archived';
type FavouriteView = 'grid' | 'list';
type FavouriteSort = 'favoritedAt' | 'updatedAt' | 'createdAt' | 'title';

@Component({
  selector: 'app-sticky-notes-favourites',
  standalone: true,
  imports: [
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
    Switch,
    Tabs,
    Tooltip,
    UserDatePipe,
    UserTimePipe
  ],
  templateUrl: './sticky-notes-favourites.component.html',
  styleUrl: './sticky-notes-favourites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StickyNotesFavouritesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly favouriteApi = inject(StickyNotesFavouriteService);
  private readonly stickyNoteApi = inject(StickyNoteApiService);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly toastService = inject(ToastService);
  private readonly dateTimeFormatter = inject(UserDateTimeFormatterService);

  /* -------------------------------------------------------------------------- */
  /*                                    Icons                                   */
  /* -------------------------------------------------------------------------- */
  readonly LucideArchive = LucideArchive;
  readonly LucideCheck = LucideCheck;
  readonly LucideClock3 = LucideClock3;
  readonly LucideColumns3 = LucideColumns3;
  readonly LucideCopy = LucideCopy;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
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
  readonly stickyNoteLayout = this.userPreferenceStore.stickyNoteLayout;
  readonly stickyNoteFont = this.userPreferenceStore.stickyNoteFont;
  readonly stickyNoteFontSize = this.userPreferenceStore.stickyNoteFontSize;

  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */
  readonly rawFavorites = signal<readonly any[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<FavouriteFilter>('all');
  readonly view = signal<FavouriteView>('grid');
  readonly searchTerm = signal('');
  readonly sortBy = signal<FavouriteSort>('favoritedAt');
  readonly busyIds = signal<ReadonlySet<string>>(new Set());
  readonly copiedKeys = signal<ReadonlySet<string>>(new Set());

  /* Side panel state */
  readonly notePanelOpen = signal(false);
  readonly notePanelMode = signal<'create' | 'edit'>('edit');
  readonly notePanelId = signal('');

  /* Delete confirmation dialog */
  readonly deleteTarget = signal<any | null>(null);
  readonly deleting = signal(false);

  /* Sort options */
  readonly sortOptions = [
    { label: 'Recently favourited', value: 'favoritedAt', icon: LucideClock3 },
    { label: 'Recently updated', value: 'updatedAt', icon: LucideClock3 },
    { label: 'Recently created', value: 'createdAt', icon: LucideClock3 },
    { label: 'Title A–Z', value: 'title', icon: LucideType }
  ] as const;

  /* View tabs */
  readonly viewTabs = VIEW_TABS;

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

  readonly noteGroups = computed(() => {
    const notes = this.visibleNotes();
    const tab = this.activeTab();
    const groups = [
      {
        id: 'active',
        label: 'Active favourites',
        status: 'ACTIVE',
        accent: '#10b981',
        items: notes.filter(note => isNoteActive(note))
      },
      {
        id: 'archived',
        label: 'Archived favourites',
        status: 'ARCHIVED',
        accent: '#64748b',
        items: notes.filter(note => isNoteArchived(note))
      }
    ];

    return groups
      .filter(group => tab === 'all' || group.id === tab)
      .map(group => ({ ...group, count: group.items.length }));
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
      .getAll({ status: 'ACTIVE', limit: 500, sortBy: 'createdAt', sortOrder: 'desc' })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          const list = extractList(response);
          this.rawFavorites.set(list);
          this.favouriteApi.populateFavorites(list);
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

    this.favouriteApi
      .toggleFavorite(noteId, favoriteId, this.noteTitle(note))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setBusy(noteId, false))
      )
      .subscribe({
        next: result => result.isFavorite ? this.refresh() : this.onNoteDeleted(noteId),
        error: () => undefined
      });
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

  onNoteUpdated(_updated: any): void {
    this.refresh();
  }

  onFavoriteToggled(event: { noteId: string; isFavorite: boolean }): void {
    if (!event.isFavorite) this.onNoteDeleted(event.noteId);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Toolbar / Filtering                           */
  /* -------------------------------------------------------------------------- */
  setNoteTab(tab: unknown): void {
    if (tab === 'all' || tab === 'active' || tab === 'archived') this.activeTab.set(tab);
  }

  setNoteView(view: unknown): void {
    if (view === 'grid') this.view.set('grid');
    if (view === 'list' || view === 'table') this.view.set('list');
  }

  updateSearch(value: any): void {
    this.searchTerm.set(String(value ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(sort: unknown): void {
    if (this.sortOptions.some(option => option.value === sort)) {
      this.sortBy.set(sort as FavouriteSort);
    }
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

  noteContent(note: any): string {
    return getNoteContent(note);
  }

  noteKey(note: any): string {
    if (note?.noteKey) return String(note.noteKey);
    return typeof note?.stickyNoteNumber === 'number'
      ? `ST-${String(note.stickyNoteNumber).padStart(6, '0')}`
      : '';
  }

  noteDateLabel(note: any): string {
    return note?.noteDate
      ? this.dateTimeFormatter.formatDateKey(note.noteDate, 'No date')
      : 'No date';
  }

  noteColumnName(note: any): string {
    const column = note?.columnId;
    if (column && typeof column === 'object') {
      return String(column?.name ?? column?.label ?? 'Notes');
    }
    return String(note?.columnName ?? 'Notes');
  }

  noteFolderName(note: any): string {
    const folder = note?.workspaceFolderId;
    if (folder && typeof folder === 'object') {
      return String(folder?.name ?? folder?.label ?? 'My Notes');
    }
    return String(note?.folderName ?? 'My Notes');
  }

  noteChecklistTotal(note: any): number {
    const checklists = Array.isArray(note?.checklists) ? note.checklists : [];
    return checklists.reduce((total: number, checklist: any) =>
      total + Number(checklist?.totalCount ?? checklist?.items?.length ?? 0), 0);
  }

  noteChecklistCompleted(note: any): number {
    const checklists = Array.isArray(note?.checklists) ? note.checklists : [];
    return checklists.reduce((total: number, checklist: any) => {
      const completed = checklist?.completedCount
        ?? checklist?.items?.filter((item: any) => item?.isCompleted === true).length
        ?? 0;
      return total + Number(completed);
    }, 0);
  }

  noteProgressPct(note: any): number {
    const total = this.noteChecklistTotal(note);
    return total ? Math.round((this.noteChecklistCompleted(note) / total) * 100) : 0;
  }

  noteUpdatedLabel(note: any): string {
    return this.dateTimeFormatter.formatRelativeDate(note?.updatedAt ?? note?.createdAt, 'Recently');
  }

  noteColorKey(note: any): string {
    return toColorCssClass(note?.color ?? 'WHITE');
  }

  isActive(note: any): boolean {
    return isNoteActive(note);
  }

  isArchived(note: any): boolean {
    return isNoteArchived(note);
  }

  changeNoteStatus(note: any, active: boolean): void {
    if (active === this.isActive(note)) return;
    active ? this.activateNote(note) : this.archiveNote(note);
  }

  copyNoteKey(key: string, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (!key || !navigator.clipboard) return;

    navigator.clipboard.writeText(key).then(() => {
      this.copiedKeys.update(keys => new Set(keys).add(key));
      this.toastService.info(`Copied ${key} to clipboard`);
      setTimeout(() => {
        this.copiedKeys.update(keys => {
          const next = new Set(keys);
          next.delete(key);
          return next;
        });
      }, 2000);
    }).catch(() => undefined);
  }

  isKeyCopied(key: string): boolean {
    return this.copiedKeys().has(key);
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
        ? this.dateTimeFormatter.formatDateKey(note.noteDate, '')
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
