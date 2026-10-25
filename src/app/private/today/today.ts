import { StickyMarkdownEditorComponent } from '../../shared/components/sticky-markdown-editor/sticky-markdown-editor.component';
import { StickyMarkdownRendererComponent } from '../../shared/components/sticky-markdown-renderer/sticky-markdown-renderer.component';
import { stickyMarkdownToPlainText } from '../../shared/utils/sticky-markdown/markdown-plain-text';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  LucideAArrowUp,
  LucideArrowLeft,
  LucideArrowRight,
  LucideCalendarDays,
  LucideCheck,
  LucideCheckCheck,
  LucideCheckCircle2,
  LucideChevronDown,
  LucideChevronRight,
  LucideClock3,
  LucideClockAlert,
  LucideClipboardCheck,
  LucideCopy,
  LucideFileText,
  LucideFolderOpen,
  LucideGrip,
  LucideList,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideSparkles,
  LucideStar,
  LucideStarOff,
  LucideStickyNote,
  LucideTrash2,
  LucideType,
  LucideUsers,
  LucideX,
} from '@lucide/angular';

import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Input as AppInput } from '../../shared/components/input/input';
import { Loader } from '../../shared/components/loader/loader';
import { Select } from '../../shared/components/select/select';
import { Tabs } from '../../shared/components/tabs/tabs';
import { Tooltip } from '../../shared/components/tooltip/tooltip';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { APP_ROUTES, routeCommands } from '../../shared/constants/route.constants';
import { COMMON_MESSAGES } from '../../shared/constants/common.messages';
import { UI } from '../../shared/constants/ui.constants';

import { MembersStack } from '../workspace-members/members-stack/members-stack';
import { AddEditNoteSidePanel } from '../mynotes/add-edit-note-side-panel/add-edit-note-side-panel';
import { OverdueTopbar } from '../mynotes/overdue-topbar/overdue-topbar';
import { OverdueNotesPanel } from '../mynotes/overdue-notes-panel/overdue-notes-panel';
import { OverdueNotesStore } from '../mynotes/services/overdue-notes.store';
import { AddEditStickyNoteColumnSidePanel } from '../sticky-note-columns/add-edit-sticky-note-column-side-panel/add-edit-sticky-note-column-side-panel';
import { StickyNote } from '../mynotes/sticky-note/sticky-note';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import {
  BulkActionPanel,
  BulkActionPanelOrientation,
  BulkActionPanelPosition,
  BulkActionPanelVariant,
} from '../../shared/components/bulk-action-panel/bulk-action-panel';

import {
  STICKY_NOTE_FONT_OPTIONS,
  STICKY_NOTE_FONT_SIZE_OPTIONS,
  STICKY_NOTE_LAYOUT_OPTIONS,
  STICKY_NOTE_VIEW_OPTIONS,
  USER_PREFERENCE_KEYS,
  VIEW,
  View,
} from '../../shared/constants/common.constants';
import {
  entityNameOf,
  extractErrorMessage,
  extractList,
  idOf,
} from '../../shared/functions/common.function';
import {
  compareNotesByRank,
  getNeighborNoteIds,
  getNoteColorAccent,
  getNoteColorBadgeVariant,
  getNoteColumnEyebrow,
  isColumnDragItem,
  isNoteDragItem,
  mapStickyNoteChecklists,
  mapStickyNoteColumn,
  sortNotesByRank,
  mapNoteAssignees,
} from '../../shared/functions/sticky-note.function';
import {
  getWorkspaceMemberAvatar,
  getWorkspaceMemberId,
  getWorkspaceMemberName,
  getWorkspaceMemberRole,
} from '../../shared/functions/workspace-member.function';
import { UserDatePipe } from '../../shared/pipes/user-date.pipe';
import { UserTimePipe } from '../../shared/pipes/user-time.pipe';
import { UserDateTimePipe } from '../../shared/pipes/user-date-time.pipe';
import { UserDateTimeFormatterService } from '../../shared/services/user-date-time-formatter.service';

import { StickyNoteApiService } from '../mynotes/services/sticky-notes.service';
import { StickyNotesFavouriteService } from '../sticky-notes-favourites/services/sticky-notes-favourite.service';
import { STICKY_NOTE_MESSAGES } from '../mynotes/messages/sticky-note.messages';
import { StickyNoteColumnApiService } from '../mynotes/services/sticky-note-column.service';
import { StickyNoteColumnStore } from '../mynotes/services/sticky-note-column.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceDropdownStore } from '../workspace/services/workspace-dropdown.store';
import { WorkspaceDropdownItem } from '../workspace/models/workspace-dropdown.models';
import { WorkspaceFolderService } from '../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import {
  WorkspaceFolder,
  WorkspaceFolderQuery,
} from '../workspacefolders/models/workspace-folder.models';
import { WorkspaceMemberApiService } from '../workspace-members/services/workspace-member.service';
import { WorkspaceMemberQuery } from '../workspace-members/models/workspace-member.models';
import { AuthStore } from '../../public/auth/state/auth.store';
import { TODAY_MESSAGES } from './messages/today.messages';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const ACTIVE_STATUS = 'ACTIVE';
const TODAY_DATE_PRESET = 'TODAY';
const SORT_ASC = 'asc';
const SORT_DESC = 'desc';
type TodayLoadErrorKind = 'network' | 'server';
type OverdueView = 'bar' | 'button';

@Component({
  selector: 'app-today',
  providers: [OverdueNotesStore],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today.html',
  styleUrl: './today.scss',
  imports: [
    StickyMarkdownEditorComponent,
    StickyMarkdownRendererComponent,
    CommonModule,
    FormsModule,
    DragDropModule,
    OverlayModule,
    MatDividerModule,
    MatMenuModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Checkbox,
    BulkActionPanel,
    Loader,
    MembersStack,
    Select,
    StickyNote,
    Tabs,
    Tooltip,
    UserDatePipe,
    UserTimePipe,
    AddEditNoteSidePanel,
    OverdueTopbar,
    OverdueNotesPanel,
    AddEditStickyNoteColumnSidePanel,
  ],
})
export class Today {
  readonly plainText = stickyMarkdownToPlainText;
  readonly overdue = inject(OverdueNotesStore);

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly dateTimeFormatter = inject(UserDateTimeFormatterService);
  private readonly authStore = inject(AuthStore);

  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly workspaceDropdownStore = inject(WorkspaceDropdownStore);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly stickyNoteColumnStore = inject(StickyNoteColumnStore);

  private readonly workspaceApiService = inject(WorkspaceService);
  private readonly workspaceMemberApiService = inject(WorkspaceMemberApiService);
  private readonly workspaceFolderApiService = inject(WorkspaceFolderService);
  private readonly stickyNoteColumnApiService = inject(StickyNoteColumnApiService);
  private readonly stickyNoteApiService = inject(StickyNoteApiService);
  private readonly stickyNotesFavouriteService = inject(StickyNotesFavouriteService);

  private folderRequestVersion = 0;
  private workspaceMemberRequestVersion = 0;
  private notesRequestVersion = 0;
  private readonly pendingWorkspaceActivation = signal(false);
  private readonly stickyNoteDataCache = new Map<string, { key: string; value: any }>();

  readonly LucideAArrowUp = LucideAArrowUp;
  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheck = LucideCheck;
  readonly LucideCheckCheck = LucideCheckCheck;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucideClock3 = LucideClock3;
  readonly LucideClockAlert = LucideClockAlert;
  readonly LucideClipboardCheck = LucideClipboardCheck;
  readonly LucideCopy = LucideCopy;
  readonly LucideFileText = LucideFileText;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideList = LucideList;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideRotateCcw = LucideRotateCcw;
  readonly LucideSearch = LucideSearch;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideStickyNote = LucideStickyNote;
  readonly LucideStar = LucideStar;
  readonly LucideStarOff = LucideStarOff;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideType = LucideType;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;
  readonly LucideGrip = LucideGrip;

  readonly currentUserId = computed(() => this.authStore.user()?.id ?? '');

  readonly copiedKeyMap = signal<Record<string, boolean>>({});

  readonly today = signal(new Date());
  readonly todayDay = computed(() => {
    const { locale, timezone } = this.dateTimeFormatter.preferences();
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      calendar: 'gregory',
      day: 'numeric',
    }).format(this.today());
  });
  readonly VIEW = VIEW;
  readonly todayMonth = computed(() => {
    const { locale, timezone } = this.dateTimeFormatter.preferences();
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      calendar: 'gregory',
      month: 'short',
    }).format(this.today());
  });
  readonly todayWeekday = computed(() => {
    const { locale, timezone } = this.dateTimeFormatter.preferences();
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      calendar: 'gregory',
      weekday: 'long',
    }).format(this.today());
  });
  readonly TODAY_MESSAGES: any = TODAY_MESSAGES;
  readonly UI = UI;
  readonly view = computed<View>(() => {
    const raw = String(this.userPreferenceStore.todayView() ?? '').toUpperCase();
    if (raw === 'TABLE') return VIEW.TABLE;
    if (raw === 'KANBAN') return VIEW.KANBAN;
    return VIEW.NOTES;
  });
  readonly overdueView = computed<OverdueView>(() =>
    String(this.userPreferenceStore.overdueView() ?? '').toUpperCase() === 'BUTTON'
      ? 'button'
      : 'bar',
  );
  readonly overdueBarVisible = computed(
    () => this.overdueView() === 'bar' && this.overdue.bannerVisible(),
  );
  readonly overdueButtonVisible = computed(
    () =>
      this.overdueView() === 'button' &&
      !this.overdue.error() &&
      (this.overdue.data()?.total ?? 0) > 0,
  );
  readonly searchTerm = signal('');
  readonly searchExpanded = signal(false);
  readonly isSearchExpanded = computed(() => this.searchExpanded() || !!this.searchTerm().trim());
  readonly todaySearchInput = viewChild<AppInput>('todaySearchInput');
  readonly movingColumn = signal(false);

  readonly stickyNoteLayoutOptions: any[] = STICKY_NOTE_LAYOUT_OPTIONS;
  readonly stickyNoteFontOptions: any[] = STICKY_NOTE_FONT_OPTIONS.map((option) => ({
    ...option,
    icon: LucideType,
  }));
  readonly stickyNoteFontSizeOptions: any[] = STICKY_NOTE_FONT_SIZE_OPTIONS.map((option) => ({
    ...option,
    icon: LucideAArrowUp,
  }));

  readonly stickyNoteLayout = this.userPreferenceStore.stickyNoteLayout;
  readonly stickyNoteFont = this.userPreferenceStore.stickyNoteFont;
  readonly stickyNoteFontSize = this.userPreferenceStore.stickyNoteFontSize;

  readonly fontSelectWidth = computed(() => {
    const font = this.stickyNoteFont();
    const option = this.stickyNoteFontOptions.find((o) => o.value === font);
    const label = option?.label ?? 'Note font';
    const textWidth = Math.ceil(label.length * 7.5);
    const calculated = 87 + textWidth + 14;
    return Math.min(Math.max(calculated, 155), 215);
  });

  readonly workspaceOptions = computed<any[]>(() => {
    const dropdownItems = this.workspaceDropdownStore.items();
    if (dropdownItems.length > 0) {
      return dropdownItems.map((workspace) => ({
        label: entityNameOf(workspace, 'Untitled workspace'),
        value: idOf(workspace),
        icon: LucidePanelsTopLeft,
      }));
    }
    return this.workspaceStore.workspaces().map((workspace) => ({
      label: entityNameOf(workspace, 'Untitled workspace'),
      value: idOf(workspace),
      icon: LucidePanelsTopLeft,
    }));
  });

  readonly activeWorkspaceId = computed<string | null>(() => {
    if (!this.hasWorkspaces()) return null;
    return this.workspaceDropdownStore.selectedWorkspaceId() ?? this.workspaceStore.selectedId();
  });
  readonly loadingWorkspaces = computed(() => this.workspaceDropdownStore.loading());
  readonly workspaceError = computed(() => this.workspaceDropdownStore.error());
  readonly workspacesLoaded = computed(
    () => this.workspaceDropdownStore.loaded() || this.workspaceStore.loaded(),
  );
  readonly hasWorkspaces = computed(
    () =>
      this.workspaceDropdownStore.hasWorkspaces() || this.workspaceStore.workspaces().length > 0,
  );
  readonly workspaceErrorKind = signal<TodayLoadErrorKind>('server');

  readonly activeFolder = computed<string | null>(() => {
    if (!this.activeWorkspaceId()) return null;
    return this.workspaceDropdownStore.selectedFolderId() ?? this.workspaceFolderStore.selectedId();
  });
  readonly loadingFolders = computed(
    () => !this.workspaceDropdownStore.loaded() && this.workspaceFolderStore.loading(),
  );
  readonly folders = computed<readonly any[]>(() => {
    const dropdownFolders = this.workspaceDropdownStore.folders();
    if (dropdownFolders.length > 0) {
      return dropdownFolders;
    }
    return this.workspaceFolderStore.activeFolders();
  });
  readonly foldersError = computed<string | null>(() => {
    if (this.workspaceDropdownStore.loaded()) return null;
    return this.workspaceFolderStore.error();
  });
  readonly foldersErrorKind = signal<TodayLoadErrorKind>('server');

  readonly folderOptions = computed<any[]>(() =>
    this.folders().map((folder) => ({
      label: entityNameOf(folder, 'Untitled folder'),
      value: idOf(folder),
      icon: LucideFolderOpen,
    })),
  );

  readonly stickyNotes = signal<any[]>([]);
  readonly loadingNotes = signal(false);
  readonly workspaceMembers = signal<readonly any[]>([]);
  readonly loadingWorkspaceMembers = signal(false);

  readonly stickyNoteColumns = computed(() =>
    this.stickyNoteColumnStore.orderedColumns().map((column) => mapStickyNoteColumn(column)),
  );
  readonly stickyNoteColumnById = computed(() => {
    const columns = new Map<string, any>();
    for (const column of this.stickyNoteColumns()) {
      const id = idOf(column);
      if (id) {
        columns.set(id, column);
      }
    }
    return columns;
  });
  readonly loadingColumns = this.stickyNoteColumnStore.loading;

  readonly boardError = signal<string | null>(null);
  readonly boardErrorKind = signal<TodayLoadErrorKind>('server');
  readonly movingNoteId = signal<string | null>(null);
  readonly draggingNoteId = signal<string | null>(null);
  readonly noteDragDisabled = computed(
    () => this.hasSearch() || this.boardLoading() || !!this.movingNoteId() || this.movingColumn(),
  );
  readonly tableEditingTitleId = signal<string | null>(null);
  readonly tableTitleDraft = signal('');
  readonly collapsedGroups = signal<Set<string>>(new Set());

  readonly selectedNoteIds = signal<Set<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedNoteIds().size);

  readonly bulkActionPosition = signal<BulkActionPanelPosition>('bottom-center');
  readonly bulkActionOrientation = signal<BulkActionPanelOrientation>('horizontal');
  readonly bulkActionVariant = signal<BulkActionPanelVariant>('floating');

  /** Groups visible list notes by their column, preserving column order. */
  readonly tableGroups = computed(() => {
    const columns = this.stickyNoteColumns();
    const grouped = this.visibleNotesByColumn();

    return columns
      .map((column) => {
        const colId = idOf(column) || '';
        const columnNotes = grouped.get(colId) ?? [];
        return {
          id: colId,
          label: column.label || 'Untitled',
          type: column.type || 'CUSTOM',
          accent: column.accent,
          column,
          notes: columnNotes,
          count: columnNotes.length,
        };
      })
      .filter((group) => group.count > 0 || !this.hasSearch());
  });

  readonly notePanelOpen = signal(false);
  readonly notePanelMode = signal<'create' | 'edit'>('create');
  readonly notePanelId = signal('');

  readonly columnPanelOpen = signal(false);
  readonly columnPanelMode = signal<'create' | 'edit'>('create');
  readonly columnPanelId = signal('');
  readonly columnPanelColumn = signal<any>(null);

  readonly workspaceMemberStack = computed<readonly any[]>(() =>
    this.workspaceMembers().map((member) => {
      const name = getWorkspaceMemberName(member);
      const role = getWorkspaceMemberRole(member);
      return {
        id: getWorkspaceMemberId(member),
        name,
        src: getWorkspaceMemberAvatar(member),
        tooltip: `${name} · ${role}`,
      };
    }),
  );

  readonly boardLoading = computed(
    () =>
      this.loadingWorkspaces() ||
      this.loadingFolders() ||
      this.loadingColumns() ||
      this.loadingNotes(),
  );

  readonly noteCount = computed(() => this.stickyNotes().length);
  readonly hasNotes = computed(() => this.noteCount() > 0);
  readonly hasVisibleNotes = computed(() => this.visibleListNotes().length > 0);
  readonly hasSearch = computed(() => !!this.searchTerm().trim());
  readonly hasColumns = computed(() => this.stickyNoteColumns().length > 0);
  readonly firstActionColumnId = computed(
    () =>
      this.stickyNoteColumns().find((column) => column.type !== 'COMPLETED')?.id ??
      this.stickyNoteColumns()[0]?.id ??
      '',
  );

  /** IDs of all note drop-lists — used by [cdkDropListConnectedTo] so that
   *  notes can be dragged across columns even when the drop lists are nested
   *  inside cdkDrag column elements (cdkDropListGroup cannot reach them). */
  readonly columnDropListIds = computed<string[]>(() =>
    this.stickyNoteColumns().flatMap((col) => [col.id + '-drop-list', col.id + '-table-drop-list']),
  );

  readonly visibleListNotes = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    return search
      ? this.stickyNotes().filter((note) => this.noteMatchesSearch(note, search))
      : this.stickyNotes();
  });

  readonly todayIncompleteNotes = computed(() =>
    this.visibleListNotes().filter((note) => !this.isNoteCompleted(note)),
  );

  readonly todayCompletedNotes = computed(() =>
    this.visibleListNotes().filter((note) => this.isNoteCompleted(note)),
  );

  readonly incompleteNoteCount = computed(() => this.todayIncompleteNotes().length);
  readonly completedNoteCount = computed(() => this.todayCompletedNotes().length);

  readonly notesByColumn = computed(() => {
    const grouped = new Map<string, any[]>();
    for (const note of this.stickyNotes()) {
      const columnId = idOf(note?.columnId);
      if (!columnId) continue;

      const notes = grouped.get(columnId) ?? [];
      notes.push(note);
      grouped.set(columnId, notes);
    }

    for (const [columnId, notes] of grouped) {
      grouped.set(columnId, this.movingNoteId() ? notes : sortNotesByRank(notes));
    }

    return grouped;
  });

  readonly visibleNotesByColumn = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    if (!search) {
      return this.notesByColumn();
    }

    const filtered = new Map<string, any[]>();
    for (const [columnId, notes] of this.notesByColumn()) {
      filtered.set(
        columnId,
        notes.filter((note) => this.noteMatchesSearch(note, search)),
      );
    }
    return filtered;
  });

  readonly viewTabs = STICKY_NOTE_VIEW_OPTIONS;

  private readonly syncPreferredWorkspace = effect(() => {
    if (this.userPreferenceStore.loading()) return;
    if (this.pendingWorkspaceActivation()) {
      untracked(() => {
        this.pendingWorkspaceActivation.set(false);
        const workspaceId = this.resolveWorkspaceSelection();
        if (workspaceId) this.activateWorkspace(workspaceId);
      });
      return;
    }
    if (!this.userPreferenceStore.loaded() || !this.workspacesLoaded()) return;

    const preferredWorkspaceId = this.userPreferenceStore.selectedWorkspaceId();
    const preferredFolderId = this.userPreferenceStore.selectedFolderId();
    const currentWorkspaceId = this.activeWorkspaceId();
    const currentFolderId = this.activeFolder();

    if (
      preferredWorkspaceId &&
      this.workspaceOptions().some((opt) => opt.value === preferredWorkspaceId)
    ) {
      if (currentWorkspaceId !== preferredWorkspaceId) {
        untracked(() => this.activateWorkspace(preferredWorkspaceId));
        return;
      }
    }

    if (preferredFolderId && this.folders().some((f) => idOf(f) === preferredFolderId)) {
      if (currentFolderId !== preferredFolderId) {
        untracked(() => {
          this.workspaceDropdownStore.selectFolder(preferredFolderId);
          this.workspaceFolderStore.select(preferredFolderId);
          this.loadBoard();
        });
      }
    }
  });

  ngOnInit(): void {
    this.userPreferenceStore.load();
    this.getWorkspaces();
  }

  setView(view: any): void {
    const raw = String(view ?? '').toLowerCase();
    let nextView: 'NOTES' | 'KANBAN' | 'TABLE' = 'NOTES';
    if (raw === VIEW.TABLE || raw === 'list' || raw === 'table') {
      nextView = 'TABLE';
    } else if (raw === VIEW.KANBAN || raw === 'kanban') {
      nextView = 'KANBAN';
    } else {
      nextView = 'NOTES';
    }
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.TODAY_VIEW, nextView);
    this.searchTerm.set('');
  }

  dismissOverdueBar(): void {
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.OVERDUE_VIEW, 'BUTTON');
  }

  isNotesView(): boolean {
    return this.view() === VIEW.NOTES;
  }

  isKanbanView(): boolean {
    return this.view() === VIEW.KANBAN;
  }

  isTableView(): boolean {
    return this.view() === VIEW.TABLE;
  }

  onKanbanWheel(event: WheelEvent, board: HTMLElement): void {
    if (event.ctrlKey || event.defaultPrevented) return;

    const deltaX = this.wheelPixels(event.deltaX, event.deltaMode, board.clientWidth);
    const deltaY = this.wheelPixels(event.deltaY, event.deltaMode, board.clientHeight);
    const verticalIntent = !event.shiftKey && Math.abs(deltaY) >= Math.abs(deltaX);
    const noteColumn =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('.today-column-notes')
        : null;

    if (verticalIntent && noteColumn && this.canScrollVertically(noteColumn, deltaY)) {
      return;
    }

    const delta = event.shiftKey
      ? deltaY || deltaX
      : Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX
        : deltaY;
    const maxScrollLeft = Math.max(0, board.scrollWidth - board.clientWidth);
    if (!delta || !maxScrollLeft) return;

    const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, board.scrollLeft + delta));
    if (nextScrollLeft === board.scrollLeft) return;

    board.scrollLeft = nextScrollLeft;
    event.preventDefault();
  }

  isCompactLayout(): boolean {
    const layout = String(this.stickyNoteLayout() ?? 'DETAIL')
      .trim()
      .toUpperCase();
    return layout === 'COMPACT' || layout === 'PLAIN';
  }

  isDetailLayout(): boolean {
    return !this.isCompactLayout();
  }

  fontFamilyFor(value: string): string {
    return (
      this.stickyNoteFontOptions.find((option) => option.value === value)?.family ??
      this.stickyNoteFontOptions[0]?.family ??
      '"DM Sans", sans-serif'
    );
  }

  chooseFont(value: any): void {
    const font = String(value ?? '').trim();
    if (!this.isStickyNoteFont(font)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT, font);
  }

  onStickyNoteFontSizeSelection(value: any): void {
    const size = Number(value);
    if (!this.isStickyNoteFontSize(size)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT_SIZE, size);
  }

  onStickyNoteLayoutSelection(value: any): void {
    const layout = String(value ?? '').trim();
    if (!this.isStickyNoteLayout(layout)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_LAYOUT, layout);
  }

  getWorkspaces(force = false): void {
    if (this.workspaceDropdownStore.loaded() && !force) {
      const workspaceId = this.resolveWorkspaceSelection();

      if (!workspaceId) {
        this.workspaceFolderStore.clear();
        this.stickyNoteColumnStore.clear();
        this.clearWorkspaceMembers();
        this.clearBoard();
        return;
      }

      this.activateWorkspace(workspaceId);
      return;
    }

    if (this.workspaceDropdownStore.loading()) return;

    this.workspaceDropdownStore.setLoading(true);
    this.workspaceDropdownStore.clearError();
    this.workspaceErrorKind.set('server');

    this.workspaceApiService
      .getWorkspaceDropdown()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.workspaceDropdownStore.setLoading(false)),
      )
      .subscribe({
        next: (response: any) => {
          const workspaces: WorkspaceDropdownItem[] = Array.isArray(response?.data)
            ? response.data
            : extractList(response);

          const preferredWorkspaceId = this.userPreferenceStore.selectedWorkspaceId();
          const preferredFolderId = this.userPreferenceStore.selectedFolderId();
          const hasPreferredWs =
            !!preferredWorkspaceId && workspaces.some((w) => idOf(w) === preferredWorkspaceId);
          const initialWsId = hasPreferredWs ? preferredWorkspaceId : idOf(workspaces[0]);

          this.workspaceDropdownStore.setItems(
            workspaces,
            initialWsId || undefined,
            preferredFolderId || undefined,
          );
          this.syncLegacyStores(workspaces);

          const workspaceId = this.resolveWorkspaceSelection();

          if (!workspaceId) {
            this.workspaceFolderStore.clear();
            this.stickyNoteColumnStore.clear();
            this.clearWorkspaceMembers();
            this.clearBoard();
            return;
          }

          this.activateWorkspace(workspaceId);
        },
        error: (error: any) => {
          this.workspaceErrorKind.set(this.errorKind(error));
          const message = extractErrorMessage(error, TODAY_MESSAGES.ERROR.WORKSPACES_LOAD_FAILED);
          this.workspaceDropdownStore.setError(message);
          this.workspaceStore.setError(message);
          this.workspaceFolderStore.clear();
          this.stickyNoteColumnStore.clear();
          this.clearWorkspaceMembers();
          this.clearBoard();
        },
      });
  }

  onWorkspaceSelection(value: any): void {
    const workspaceId = String(value ?? '').trim();
    if (!workspaceId || workspaceId === this.activeWorkspaceId()) return;

    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID, workspaceId);

    this.stickyNoteColumnStore.clear();
    this.clearWorkspaceMembers();
    this.clearBoard();

    this.activateWorkspace(workspaceId);

    const activeFolder = this.activeFolder();
    if (activeFolder) {
      this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID, activeFolder);
    }
  }

  loadWorkspaceMembers(workspaceId: string): void {
    const id = workspaceId.trim();
    if (!id) {
      this.clearWorkspaceMembers();
      return;
    }

    const requestVersion = ++this.workspaceMemberRequestVersion;
    this.loadingWorkspaceMembers.set(true);

    const query: WorkspaceMemberQuery = {
      workspaceId: id,
      status: ACTIVE_STATUS,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      sortBy: 'updatedAt',
      sortOrder: SORT_DESC,
    };

    this.workspaceMemberApiService
      .getAllWorkspaceMembers(query)
      .pipe(
        finalize(() => {
          if (requestVersion === this.workspaceMemberRequestVersion) {
            this.loadingWorkspaceMembers.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          if (
            requestVersion !== this.workspaceMemberRequestVersion ||
            this.activeWorkspaceId() !== id
          ) {
            return;
          }
          this.workspaceMembers.set(extractList(response));
        },
        error: () => {
          if (
            requestVersion !== this.workspaceMemberRequestVersion ||
            this.activeWorkspaceId() !== id
          ) {
            return;
          }
          this.workspaceMembers.set([]);
        },
      });
  }

  getWorkspaceFolders(workspaceId: string, force = false): void {
    const id = String(workspaceId ?? '').trim();
    if (!id) {
      this.workspaceFolderStore.clear();
      this.stickyNoteColumnStore.clear();
      this.clearBoard();
      return;
    }

    if (
      !force &&
      this.workspaceFolderStore.initialized() &&
      !this.workspaceFolderStore.error() &&
      this.workspaceFolderStore.workspaceId() === id
    ) {
      this.selectFolderAndLoad();
      return;
    }

    const requestVersion = ++this.folderRequestVersion;
    this.workspaceFolderStore.resetForWorkspace(id);
    this.workspaceFolderStore.setLoading(true);
    this.foldersErrorKind.set('server');

    const query: WorkspaceFolderQuery = {
      workspaceId: id,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      status: ACTIVE_STATUS,
      sortBy: 'position',
      sortOrder: SORT_ASC,
    };

    this.workspaceFolderApiService
      .getAllWorkspaceFolders(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (requestVersion !== this.folderRequestVersion || this.activeWorkspaceId() !== id) {
            return;
          }

          const folders = extractList<WorkspaceFolder>(response);
          const pagination =
            response?.meta ??
            response?.data?.meta ??
            response?.pagination ??
            response?.data?.pagination ??
            null;

          this.workspaceFolderStore.setFolders(id, folders, pagination);
          this.selectFolderAndLoad();
        },
        error: (error: any) => {
          if (requestVersion !== this.folderRequestVersion || this.activeWorkspaceId() !== id) {
            return;
          }

          const message = extractErrorMessage(error, TODAY_MESSAGES.ERROR.FOLDERS_LOAD_FAILED);
          this.foldersErrorKind.set(this.errorKind(error));
          this.workspaceFolderStore.setError(message);
          this.clearBoard();
        },
      });
  }

  onFolderSelection(value: any): void {
    const folderId = value ? String(value).trim() : null;
    if (folderId === this.activeFolder()) return;

    this.workspaceDropdownStore.selectFolder(folderId);
    this.workspaceFolderStore.select(folderId);
    if (folderId) {
      this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID, folderId);
    }

    this.stickyNoteColumnStore.clear();
    this.clearBoard();

    if (folderId) {
      this.loadBoard();
    }
  }

  getStickyNoteColumns(force = false): void {
    const workspaceId = this.activeWorkspaceId();
    const folderId = this.activeFolder();
    if (!workspaceId || !folderId) {
      this.stickyNoteColumnStore.clear();
      return;
    }

    if (
      !force &&
      this.stickyNoteColumnStore.initialized() &&
      !this.stickyNoteColumnStore.error() &&
      this.stickyNoteColumnStore.contextMatches(workspaceId, folderId)
    ) {
      return;
    }

    this.stickyNoteColumnStore.resetForContext(workspaceId, folderId);
    this.stickyNoteColumnStore.setLoading(true);
    this.boardErrorKind.set('server');

    this.stickyNoteColumnApiService
      .getAll({
        workspaceId,
        workspaceFolderId: folderId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId) {
            return;
          }
          this.boardError.set(null);
          this.stickyNoteColumnStore.setColumns(workspaceId, folderId, extractList(response));
        },
        error: (error) => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId) {
            return;
          }
          const message = extractErrorMessage(error, TODAY_MESSAGES.ERROR.COLUMNS_LOAD_FAILED);
          this.stickyNoteColumnStore.setError(message);
          this.boardErrorKind.set(this.errorKind(error));
          if (this.hasNotes() || this.hasColumns()) {
            this.toastService.error(message, {
              title: this.errorTitle(this.boardErrorKind()),
              dedupeKey: 'today-columns-load-error',
            });
            return;
          }
          this.boardError.set(message);
        },
      });
  }

  getNotesForToday(): void {
    const workspaceId = this.activeWorkspaceId();
    const folderId = this.activeFolder();
    if (!workspaceId || !folderId) {
      this.notesRequestVersion += 1;
      this.stickyNotes.set([]);
      this.loadingNotes.set(false);
      return;
    }

    const requestVersion = ++this.notesRequestVersion;
    const hadNotes = this.hasNotes();
    this.loadingNotes.set(true);

    this.stickyNoteApiService
      .getAll({
        workspaceId,
        workspaceFolderId: folderId,
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        status: ACTIVE_STATUS,
        datePreset: TODAY_DATE_PRESET,
        sortBy: 'position',
        sortOrder: SORT_ASC,
      })
      .pipe(
        finalize(() => {
          if (requestVersion === this.notesRequestVersion) {
            this.loadingNotes.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (
            requestVersion !== this.notesRequestVersion ||
            this.activeWorkspaceId() !== workspaceId ||
            this.activeFolder() !== folderId
          ) {
            return;
          }
          const notes = this.sortNotes(extractList(response).map((note) => this.mapNote(note)));
          this.boardError.set(null);
          this.stickyNotes.set(notes);
        },
        error: (error) => {
          if (
            requestVersion !== this.notesRequestVersion ||
            this.activeWorkspaceId() !== workspaceId ||
            this.activeFolder() !== folderId
          ) {
            return;
          }
          const message = extractErrorMessage(error, TODAY_MESSAGES.ERROR.NOTES_LOAD_FAILED);
          this.boardErrorKind.set(this.errorKind(error));
          if (hadNotes) {
            this.toastService.error(message, {
              title: this.errorTitle(this.boardErrorKind()),
              dedupeKey: 'today-notes-refresh-error',
            });
            return;
          }
          this.boardError.set(message);
        },
      });
  }

  refreshBoard(): void {
    if (this.movingNoteId() || this.movingColumn()) return;
    const workspaceId = this.activeWorkspaceId();
    if (!workspaceId) return;

    this.loadWorkspaceMembers(workspaceId);

    if (!this.activeFolder() || this.foldersError()) {
      this.getWorkspaceFolders(workspaceId, true);
      return;
    }

    this.loadBoard(true);
  }

  openStickyNoteTrash(): void {
    const workspaceId = this.activeWorkspaceId();
    this.router.navigate(routeCommands(APP_ROUTES.TRASH), {
      queryParams: workspaceId ? { workspaceId } : undefined,
    });
  }

  openSearch(): void {
    this.searchExpanded.set(true);
    setTimeout(() => {
      this.todaySearchInput()?.focus();
    }, 0);
  }

  onSearchFocus(): void {
    this.searchExpanded.set(true);
  }

  onSearchBlur(): void {
    if (!this.searchTerm().trim()) {
      this.searchExpanded.set(false);
    }
  }

  onSearchEscape(event: Event): void {
    event.preventDefault();
    this.searchTerm.set('');
    this.searchExpanded.set(false);
  }

  updateSearch(value: any): void {
    this.searchTerm.set(value ?? '');
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  toggleGroup(groupId: string): void {
    this.collapsedGroups.update((set) => {
      const next = new Set(set);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  isGroupCollapsed(groupId: string): boolean {
    return this.collapsedGroups().has(groupId);
  }

  errorTitle(kind: TodayLoadErrorKind): string {
    return kind === 'network' ? 'Unable to connect' : 'Could not load today';
  }

  errorMessage(kind: TodayLoadErrorKind, fallback: string | null): string {
    return kind === 'network'
      ? TODAY_MESSAGES.ERROR.NETWORK
      : fallback || COMMON_MESSAGES.ERROR.GENERIC;
  }

  startTableTitleEdit(note: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const noteId = String(note?.id ?? '').trim();
    if (!noteId || this.movingNoteId()) return;

    this.tableEditingTitleId.set(noteId);
    this.tableTitleDraft.set(String(note?.title ?? ''));

    const sourceElement = event?.currentTarget as HTMLElement | null;
    this.cdr.markForCheck();
    setTimeout(() => {
      const row =
        (sourceElement?.isConnected ? sourceElement.closest('tr') : null) ||
        document.querySelector(`tr[data-note-id="${noteId}"]`) ||
        document.querySelector('tr:has([data-inline-note-title])');
      const editor = (row || document).querySelector<HTMLElement>('[data-inline-note-title]');
      const surface =
        editor?.querySelector<HTMLElement>('.sticky-markdown-surface, [contenteditable]') || editor;
      surface?.focus();
      if (surface && surface.isContentEditable) {
        const range = document.createRange();
        range.selectNodeContents(surface);
        range.collapse(false);
        const selection = document.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  }

  onTableEditorBlur(event: FocusEvent, note: any): void {
    if ((event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) return;
    this.commitTableTitleEdit(note);
  }

  onTableTitleInput(event: Event): void {
    this.tableTitleDraft.set((event.target as HTMLInputElement).value);
  }

  onTableTitleKeydown(event: KeyboardEvent, note: any): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLInputElement).blur();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancelTableTitleEdit(note);
    }
  }

  commitTableTitleEdit(note: any): void {
    const noteId = String(note?.id ?? '').trim();
    if (!noteId || this.tableEditingTitleId() !== noteId) return;

    const currentTitle = String(note?.title ?? '').trim();
    const nextTitle = String(this.tableTitleDraft() ?? '').trim();

    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');

    if (!nextTitle || nextTitle === currentTitle) return;

    this.stickyNotes.update((notes) =>
      notes.map((item) => (item.id === noteId ? { ...item, title: nextTitle } : item)),
    );

    this.stickyNoteApiService
      .update(noteId, { title: nextTitle })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const serverTitle = String(response?.data?.title ?? nextTitle).trim();
          if (serverTitle && serverTitle !== nextTitle) {
            this.stickyNotes.update((notes) =>
              notes.map((item) => (item.id === noteId ? { ...item, title: serverTitle } : item)),
            );
          }
        },
        error: (error: any) => {
          this.stickyNotes.update((notes) =>
            notes.map((item) => (item.id === noteId ? { ...item, title: currentTitle } : item)),
          );
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.RENAME_FAILED),
            {
              title: 'Title not updated',
              dedupeKey: `note-title-${noteId}`,
            },
          );
        },
      });
  }

  cancelTableTitleEdit(note?: any): void {
    const noteId = String(note?.id ?? '').trim();
    if (noteId && this.tableEditingTitleId() !== noteId) return;

    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
  }

  visibleNotesFor(columnId: string): any[] {
    return this.visibleNotesByColumn().get(idOf(columnId)) ?? [];
  }

  noteAssignees(note: any): any[] {
    return mapNoteAssignees(note, this.workspaceMembers());
  }

  openWorkspaceCreatePage(): void {
    this.router.navigate(routeCommands(APP_ROUTES.WORKSPACES));
  }

  canMoveBackward(note: any): boolean {
    return this.columnIndex(note.columnId) > 0;
  }

  canMoveForward(note: any): boolean {
    const index = this.columnIndex(note.columnId);
    return index >= 0 && index < this.stickyNoteColumns().length - 1;
  }

  readonly canDropColumn = (drag: any) => isColumnDragItem(drag?.data);
  readonly canDropNote = (drag: any) => isNoteDragItem(drag?.data);
  // Canvas cards span workflow columns. Resolve the destination column on drop,
  // just as Kanban does, rather than blocking positions in a different column.
  readonly canSortCanvasNote = (index: number, drag: any, drop: any): boolean => {
    if (drag.dropContainer !== drop) return true;
    const target = drop.data?.[index];
    return !!target && this.stickyNoteColumnById().has(idOf(target.columnId));
  };

  dropColumn(event: CdkDragDrop<any[]>): void {
    if (
      event.previousIndex === event.currentIndex ||
      this.movingColumn() ||
      this.movingNoteId() ||
      this.boardLoading() ||
      event.isPointerOverContainer === false
    ) {
      return;
    }

    const workspaceId = this.activeWorkspaceId();
    const folderId = this.activeFolder();
    if (!workspaceId || !folderId) return;

    const previousColumns = [...this.stickyNoteColumns()];
    const reordered = [...previousColumns];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    const updatedColumns = reordered.map((col, idx) => ({ ...col, position: idx }));
    this.stickyNoteColumnStore.setColumns(workspaceId, folderId, updatedColumns as any);
    this.movingColumn.set(true);

    const columnIds = updatedColumns.map((col) => col.id);
    this.stickyNoteColumnApiService
      .reorder({
        workspaceId,
        workspaceFolderId: folderId,
        columnIds,
      })
      .pipe(
        finalize(() => this.movingColumn.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          const items = extractList(response);
          if (items.length > 0) {
            this.stickyNoteColumnStore.setColumns(workspaceId, folderId, items);
          }
          this.toastService.success(
            this.responseMessage(response, TODAY_MESSAGES.SUCCESS.COLUMNS_REORDERED),
            {
              title: 'Column order updated',
              dedupeKey: 'columns-reordered',
            },
          );
        },
        error: (error: any) => {
          this.stickyNoteColumnStore.setColumns(workspaceId, folderId, previousColumns as any);
          this.toastService.error(
            extractErrorMessage(error, TODAY_MESSAGES.ERROR.COLUMNS_REORDER_FAILED),
            {
              title: 'Rearrange failed',
              dedupeKey: 'columns-reorder-error',
            },
          );
        },
      });
  }

  dropNote(event: any, targetColumnId: string): void {
    if (this.noteDragDisabled() || event.isPointerOverContainer === false) return;

    const note = event.item.data;
    const noteId = idOf(note);
    const colId = idOf(targetColumnId);
    if (!noteId || !colId) return;

    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }

    this.moveNote(note, colId, event.currentIndex);
  }

  onNotesDrop(event: CdkDragDrop<any[]>, targetIsCompleted: boolean): void {
    this.draggingNoteId.set(null);
    if (this.noteDragDisabled() || event.isPointerOverContainer === false) return;

    const note = event.item.data;
    const noteId = idOf(note);
    if (!noteId) return;

    // Moving across sections (Today Notes <-> Completed)
    if (event.previousContainer !== event.container) {
      const destination = targetIsCompleted
        ? this.todayCompletedNotes()
        : this.todayIncompleteNotes();
      const index = Math.max(0, Math.min(event.currentIndex ?? 0, destination.length));
      const anchor = destination[index] ?? destination[index - 1];
      const columns = this.stickyNoteColumns();
      const candidates = columns.filter(
        (column) => (column.type === 'COMPLETED') === targetIsCompleted,
      );
      const fallback = targetIsCompleted
        ? (candidates.find((column) => column.isDefault) ?? candidates[0])
        : (candidates.find((column) => column.type === 'TODO') ?? candidates[0]);
      const columnId = idOf(anchor?.columnId) || idOf(fallback);
      if (!columnId) {
        this.toastService.warning(
          'The destination column is unavailable. Refresh the board and try again.',
        );
        return;
      }
      const columnNotes = this.notesInColumn(columnId).filter((item) => idOf(item) !== noteId);
      const anchorIndex = anchor ? columnNotes.findIndex((item) => idOf(item) === idOf(anchor)) : 0;
      const insertionIndex = anchorIndex + (anchor && index === destination.length ? 1 : 0);
      this.moveNote(note, columnId, Math.max(0, insertionIndex));
      return;
    }

    // Reordering within the same section
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const currentList = targetIsCompleted
      ? this.todayCompletedNotes()
      : this.todayIncompleteNotes();
    const targetNote = currentList[event.currentIndex];
    const columnId = idOf(targetNote?.columnId);
    if (!targetNote || !columnId) return;

    const targetIndex = this.notesInColumn(columnId)
      .filter((item) => idOf(item) !== noteId)
      .findIndex((item) => idOf(item) === idOf(targetNote));
    if (targetIndex >= 0) {
      const insertionIndex = targetIndex + (event.currentIndex > event.previousIndex ? 1 : 0);
      this.moveNote(note, columnId, insertionIndex);
    }
  }

  toggleNoteCompletion(noteId: string, isCompleted: boolean): void {
    const id = idOf(noteId);
    if (!id || this.movingNoteId() || this.boardLoading()) return;

    const previousNotes = [...this.stickyNotes()];
    const targetNote = previousNotes.find((n) => idOf(n) === id);
    if (!targetNote) return;

    if (this.isNoteCompleted(targetNote) === isCompleted) return;

    const columns = this.stickyNoteColumns();
    const completedColumns = columns.filter((column) => column.type === 'COMPLETED');
    const currentColumn = this.stickyNoteColumnById().get(idOf(targetNote.columnId));
    const targetColumn = isCompleted
      ? (completedColumns.find((column) => column.isDefault) ?? completedColumns[0])
      : currentColumn && currentColumn.type !== 'COMPLETED'
        ? currentColumn
        : (columns.find((column) => column.type === 'TODO') ??
          columns.find((column) => column.type !== 'COMPLETED'));
    if (!targetColumn) {
      this.toastService.warning(
        isCompleted
          ? 'The completed column is unavailable. Refresh the board and try again.'
          : 'No active column is available to reopen this note.',
      );
      return;
    }
    const columnId = idOf(targetColumn);
    const columnName = targetColumn.label;
    const completedAt = isCompleted ? new Date().toISOString() : null;
    const completedBy = isCompleted ? this.currentUserId() : null;
    const requestVersion = this.notesRequestVersion;

    this.movingNoteId.set(id);
    this.stickyNoteDataCache.delete(id);
    this.stickyNotes.update((notes) =>
      notes.map((item) =>
        idOf(item) === id
          ? {
              ...item,
              columnId,
              columnName,
              isCompleted,
              completed: isCompleted,
              completedAt,
              completedBy,
            }
          : item,
      ),
    );

    const updatePayload: any = {
      columnId,
      isCompleted,
      completedAt,
      completedBy,
    };

    this.stickyNoteApiService
      .update(id, updatePayload)
      .pipe(
        finalize(() => {
          if (requestVersion === this.notesRequestVersion) this.movingNoteId.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          if (requestVersion !== this.notesRequestVersion) return;
          const updated = response?.data ?? response;
          if (updated && idOf(updated) === id) {
            this.stickyNoteDataCache.delete(id);
            this.stickyNotes.update((notes) =>
              notes.map((item) =>
                idOf(item) === id
                  ? {
                      ...item,
                      ...this.mapNote({ ...item, ...updated }),
                      columnId,
                      columnName,
                      isCompleted,
                      completed: isCompleted,
                    }
                  : item,
              ),
            );
          }
          this.overdue.refresh();
          this.toastService.success(
            isCompleted ? 'Note marked as completed' : 'Note moved back to Today Notes',
            {
              title: isCompleted ? 'Completed' : 'Reopened',
              dedupeKey: `note-completion-${id}`,
            },
          );
        },
        error: (error: any) => {
          if (requestVersion !== this.notesRequestVersion) return;
          this.stickyNoteDataCache.delete(id);
          this.stickyNotes.update((notes) =>
            notes.map((item) =>
              idOf(item) === id
                ? {
                    ...item,
                    columnId: targetNote.columnId,
                    columnName: targetNote.columnName,
                    isCompleted: this.isNoteCompleted(targetNote),
                    completed: this.isNoteCompleted(targetNote),
                    completedAt: targetNote.completedAt,
                    completedBy: targetNote.completedBy,
                  }
                : item,
            ),
          );
          this.toastService.error(
            extractErrorMessage(
              error,
              isCompleted ? 'Failed to complete note' : 'Failed to uncomplete note',
            ),
            {
              title: 'Action failed',
              dedupeKey: `note-completion-err-${id}`,
            },
          );
        },
      });
  }

  moveBackward(note: any): void {
    const colId = idOf(note?.columnId);
    const index = this.columnIndex(colId);
    if (index <= 0) return;

    const targetColumn = this.stickyNoteColumns()[index - 1];
    const targetColId = idOf(targetColumn?.id);
    if (!targetColId) return;
    this.moveNote(note, targetColId, this.notesInColumn(targetColId).length);
  }

  moveForward(note: any): void {
    const colId = idOf(note?.columnId);
    const index = this.columnIndex(colId);
    if (index < 0 || index >= this.stickyNoteColumns().length - 1) return;

    const targetColumn = this.stickyNoteColumns()[index + 1];
    const targetColId = idOf(targetColumn?.id);
    if (!targetColId) return;
    this.moveNote(note, targetColId, this.notesInColumn(targetColId).length);
  }

  isNoteCompleted(note: any): boolean {
    if (note?.isCompleted !== undefined && note?.isCompleted !== null) {
      return Boolean(note.isCompleted);
    }
    if (note?.completed !== undefined && note?.completed !== null) {
      return Boolean(note.completed);
    }
    return this.columnForNote(note)?.type === 'COMPLETED';
  }

  noteEyebrow(note: any): string {
    return getNoteColumnEyebrow(this.columnForNote(note)?.type);
  }

  noteColumnLabel(note: any): string {
    return this.columnForNote(note)?.label ?? note?.columnName ?? 'Note';
  }

  noteFolderName(note: any): string {
    const rawName = String(note?.folderName ?? '').trim();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(rawName);
    if (rawName && !isObjectId) {
      return rawName;
    }

    const targetFolderId = idOf(
      note?.workspaceFolderId || note?.folderId || note?.folder || rawName,
    );
    if (targetFolderId && this.folders().length > 0) {
      const matchedFolder = this.folders().find((f: any) => idOf(f) === targetFolderId);
      if (matchedFolder) {
        return entityNameOf(matchedFolder, 'My Notes');
      }
    }

    return rawName && !isObjectId ? rawName : 'My Notes';
  }

  noteColumnBadgeVariant(note: any): any {
    const column = this.columnForNote(note);
    return (
      column?.checkboxVariant || getNoteColorBadgeVariant(column?.color || note?.color) || 'neutral'
    );
  }

  noteDateLabel(value: unknown): string {
    return this.dateTimeFormatter.formatDateKey(value, 'No date');
  }

  todayDateKey(): string {
    return this.dateTimeFormatter.todayDateKey();
  }

  noteColumnAccent(note: any): string {
    return this.columnForNote(note)?.accent ?? getNoteColorAccent('YELLOW');
  }

  noteChecklistTotal(note: any): number {
    return Number(note?.checklistSummary?.total ?? note?.checklistItemCount ?? 0) || 0;
  }

  noteChecklistCompleted(note: any): number {
    return Number(note?.checklistSummary?.completed ?? note?.completedChecklistItemCount ?? 0) || 0;
  }

  noteProgressPct(note: any): number {
    const total = this.noteChecklistTotal(note);
    if (total <= 0) return 0;
    const completed = this.noteChecklistCompleted(note);
    return Math.round((completed / total) * 100);
  }

  isNoteFavorite(note: any): boolean {
    const noteId = idOf(note) || String(note?.id ?? note?._id ?? '');
    if (!noteId) return false;
    if (note?.isFavorite !== undefined && note?.isFavorite !== null) {
      return Boolean(note.isFavorite);
    }
    return this.stickyNotesFavouriteService.isFavorite(noteId);
  }

  isFavoriteBusy(note: any): boolean {
    const noteId = idOf(note) || String(note?.id ?? note?._id ?? '');
    return noteId ? this.stickyNotesFavouriteService.isBusy(noteId) : false;
  }

  toggleNoteFavorite(note: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const noteId = idOf(note) || String(note?.id ?? note?._id ?? '');
    if (!noteId || this.isFavoriteBusy(note)) return;

    const currentFavId = note?.favoriteId || this.stickyNotesFavouriteService.getFavoriteId(noteId);
    const title = note?.title || 'note';
    this.stickyNotesFavouriteService
      .toggleFavorite(noteId, currentFavId, title)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.stickyNotes.update((notes) =>
            notes.map((n) =>
              idOf(n) === noteId || n?.id === noteId
                ? { ...n, isFavorite: res.isFavorite, favoriteId: res.favoriteId }
                : n,
            ),
          );
          this.stickyNoteDataCache.delete(noteId);
        },
      });
  }

  stickyNoteData(note: any, column?: any): any {
    const resolvedColumn = column ?? this.columnForNote(note);
    const noteId = idOf(note) || String(note?.id ?? note?._id ?? '');
    const columnLabel = resolvedColumn?.label ?? resolvedColumn?.name ?? note?.columnName ?? 'Note';
    const columnBadgeVariant = this.noteColumnBadgeVariant(note);
    const layout = this.stickyNoteLayout();
    const font = this.stickyNoteFont();
    const fontSize = this.stickyNoteFontSize();
    const movingNoteId = this.movingNoteId();
    const canMoveBackward = this.canMoveBackward(note);
    const canMoveForward = this.canMoveForward(note);
    const isCompleted = this.isNoteCompleted(note);
    const isNotesView = this.isNotesView();
    const effectiveShape = isNotesView ? 'SQUARE' : (note?.shape ?? 'SQUARE');
    const effectiveVariant = isNotesView ? 'PLAIN' : (note?.variant ?? 'PLAIN');
    const effectivePattern = isNotesView ? 'NONE' : (note?.backgroundPattern ?? 'NONE');
    const effectiveNoteKey =
      note?.noteKey ??
      (typeof note?.stickyNoteNumber === 'number'
        ? `ST-${String(note.stickyNoteNumber).padStart(6, '0')}`
        : '');
    const key = JSON.stringify([
      noteId,
      note?.title,
      note?.content,
      note?.description,
      note?.columnId,
      note?.color,
      effectiveShape,
      effectiveVariant,
      effectivePattern,
      effectiveNoteKey,
      note?.noteDate,
      note?.updatedAt,
      note?.isFavorite,
      note?.favoriteId,
      note?.progress,
      note?.checklistCount,
      note?.checklistItemCount,
      note?.completedChecklistItemCount,
      note?.assignees?.length,
      note?.checklists?.length,
      resolvedColumn?.id,
      columnLabel,
      columnBadgeVariant,
      resolvedColumn?.checkboxVariant,
      this.view(),
      layout,
      font,
      fontSize,
      Boolean(this.searchTerm().trim()),
      movingNoteId,
      canMoveBackward,
      canMoveForward,
      isCompleted,
      isNotesView,
      this.noteDragDisabled(),
    ]);
    const cached = this.stickyNoteDataCache.get(noteId);
    if (cached?.key === key) {
      return cached.value;
    }

    const value = {
      ...note,
      shape: effectiveShape,
      variant: effectiveVariant,
      backgroundPattern: effectivePattern,
      color: note?.color ?? 'WHITE',
      noteKey: effectiveNoteKey,
      eyebrow: this.noteEyebrow(note),
      columnLabel,
      columnBadgeVariant,
      notesCanvas: isNotesView,
      checkboxVariant: resolvedColumn?.checkboxVariant,
      completed: isCompleted,
      isCompleted,
      showCompletionAction: true,
      view: this.view(),
      layout,
      font,
      fontSize,
      showDragHandle: !this.noteDragDisabled(),
      showFavoriteAction: !isNotesView,
      showMoveActions: !isNotesView && this.isKanbanView(),
      canMoveBackward,
      canMoveForward,
      actionsDisabled: !!movingNoteId,
    };

    if (noteId) {
      this.stickyNoteDataCache.set(noteId, { key, value });
    }
    return value;
  }

  deleteNote(note: any): void {
    const noteId = idOf(note);
    if (!noteId) return;

    this.stickyNoteApiService
      .moveToTrash(noteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.onNoteDeleted(noteId);
          this.toastService.success(
            this.responseMessage(
              response,
              STICKY_NOTE_MESSAGES.SUCCESS.MOVED_TO_TRASH_WITH_RETENTION,
            ),
            {
              title: 'Note safely moved',
              dedupeKey: `trash-note-${noteId}`,
            },
          );
        },
        error: (error: any) => {
          this.toastService.error(
            extractErrorMessage(error, STICKY_NOTE_MESSAGES.ERROR.MOVE_TO_TRASH_FAILED),
            {
              title: 'Note not moved',
              dedupeKey: `trash-note-${noteId}`,
            },
          );
        },
      });
  }

  onNoteDeleted(noteId: string, refreshOverdue = true): void {
    if (!noteId) return;
    if (refreshOverdue) this.overdue.refresh();
    this.stickyNoteDataCache.delete(noteId);
    this.stickyNotes.update((notes) => notes.filter((item) => idOf(item) !== noteId));
  }

  onNoteUpdated(updated: any): void {
    const id = idOf(updated);
    if (!id) return;
    this.stickyNoteDataCache.delete(id);
    this.stickyNotes.update((notes) =>
      notes.map((item) => (idOf(item) === id ? { ...item, ...updated } : item)),
    );
  }

  retryFolders(): void {
    const workspaceId = this.activeWorkspaceId();
    if (!workspaceId) return;
    this.getWorkspaceFolders(workspaceId, true);
  }

  openFolderCreateModal(): void {
    const workspaceId = this.activeWorkspaceId();
    this.router.navigate(routeCommands(APP_ROUTES.WORKSPACE_FOLDERS), {
      queryParams: workspaceId ? { workspaceId } : undefined,
    });
  }

  openColumnCreateSidePanel(): void {
    if (!this.activeWorkspaceId() || !this.activeFolder() || this.boardLoading()) return;
    this.columnPanelMode.set('create');
    this.columnPanelId.set('');
    this.columnPanelColumn.set(null);
    this.columnPanelOpen.set(true);
  }

  requestColumnEdit(column: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const id = idOf(column);
    if (!id || this.boardLoading()) return;
    this.columnPanelMode.set('edit');
    this.columnPanelId.set(id);
    this.columnPanelColumn.set(column);
    this.columnPanelOpen.set(true);
  }

  closeColumnPanel(): void {
    this.columnPanelOpen.set(false);
    this.columnPanelId.set('');
    this.columnPanelColumn.set(null);
  }

  onColumnSaved(_columnId: string): void {
    this.closeColumnPanel();
    this.loadBoard(true);
  }

  openNoteCreatePanel(columnId: string): void {
    if (!columnId || this.movingNoteId()) return;
    this.notePanelMode.set('create');
    this.notePanelId.set(columnId);
    this.notePanelOpen.set(true);
  }

  openNoteEditPanel(note: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const noteId = idOf(note);
    if (!noteId || this.movingNoteId()) return;

    this.notePanelMode.set('edit');
    this.notePanelId.set(noteId);
    this.notePanelOpen.set(true);
  }

  closeNotePanel(): void {
    this.notePanelOpen.set(false);
    this.notePanelId.set('');
  }

  openOverdueNote(note: any): void {
    if (
      note.workspaceId !== this.activeWorkspaceId() ||
      note.workspaceFolderId !== this.activeFolder()
    )
      return;
    this.openNoteEditPanel(note);
  }

  bringOverdueToToday(ids: readonly string[]): void {
    this.overdue.bringToToday(ids, () => this.loadBoard());
  }

  onNoteSaved(_noteId: string): void {
    this.closeNotePanel();
    this.loadBoard();
  }

  private moveNote(note: any, targetColumnId: string, targetIndex: number): void {
    const noteId = idOf(note);
    const targetColId = idOf(targetColumnId);
    if (!noteId || !this.stickyNoteColumnById().has(targetColId) || this.noteDragDisabled()) return;

    const previousNotes = [...this.stickyNotes()];
    const requestVersion = this.notesRequestVersion;

    const targetColumnNotes = this.notesInColumn(targetColId).filter(
      (item) => idOf(item) !== noteId,
    );
    const boundedIndex = Math.max(0, Math.min(targetIndex, targetColumnNotes.length));

    const { beforeId, afterId } = getNeighborNoteIds(targetColumnNotes, boundedIndex, noteId);

    const optimisticTargetNotes = [...targetColumnNotes];
    const targetColumn = this.stickyNoteColumnById().get(targetColId)!;
    const changedColumn = idOf(note.columnId) !== targetColId;
    const completion = targetColumn.type === 'COMPLETED';
    const moveFields = changedColumn
      ? {
          columnId: targetColId,
          columnName: targetColumn.label,
          isCompleted: completion,
          completed: completion,
          completedAt: completion ? new Date().toISOString() : null,
          completedBy: completion ? this.currentUserId() : null,
        }
      : { columnId: targetColId };
    optimisticTargetNotes.splice(boundedIndex, 0, { ...note, ...moveFields });

    const otherNotes = previousNotes.filter(
      (item) => idOf(item) !== noteId && idOf(item.columnId ?? item?.columnId) !== targetColId,
    );
    const nextNotes = [...otherNotes, ...optimisticTargetNotes];

    this.movingNoteId.set(noteId);
    // Keep the optimistic insertion order until the server returns the new rank.
    this.stickyNotes.set(
      nextNotes.sort((a, b) => this.columnIndex(a.columnId) - this.columnIndex(b.columnId)),
    );
    this.boardError.set(null);

    this.stickyNoteApiService
      .reorder(noteId, {
        columnId: targetColId,
        beforeId,
        afterId,
      })
      .pipe(
        finalize(() => {
          if (requestVersion === this.notesRequestVersion) this.movingNoteId.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response: any) => {
          if (requestVersion !== this.notesRequestVersion) return;
          const updated = response?.data ?? response;
          if (idOf(note.columnId) !== targetColId) this.overdue.refresh();
          if (updated && idOf(updated) === noteId) {
            this.stickyNotes.update((notes) =>
              notes.map((item) =>
                idOf(item) === noteId ? this.mapNote({ ...item, ...updated }) : item,
              ),
            );
          }
        },
        error: (error: any) => {
          if (requestVersion !== this.notesRequestVersion) return;
          const previousOrder = new Map(previousNotes.map((item, index) => [idOf(item), index]));
          this.stickyNotes.update((notes) =>
            notes
              .map((item) =>
                idOf(item) === noteId
                  ? {
                      ...item,
                      ...Object.fromEntries(Object.keys(moveFields).map((key) => [key, note[key]])),
                    }
                  : item,
              )
              .sort(
                (a, b) =>
                  (previousOrder.get(idOf(a)) ?? previousNotes.length) -
                  (previousOrder.get(idOf(b)) ?? previousNotes.length),
              ),
          );
          this.toastService.error(
            extractErrorMessage(error, TODAY_MESSAGES.ERROR.NOTE_MOVE_FAILED),
            { title: 'Note not moved', dedupeKey: `note-reorder-${noteId}` },
          );
        },
      });
  }

  private notesInColumn(columnId: string): any[] {
    return this.notesByColumn().get(idOf(columnId)) ?? [];
  }

  private canScrollVertically(element: HTMLElement, delta: number): boolean {
    if (!delta || element.scrollHeight <= element.clientHeight) return false;
    if (delta < 0) return element.scrollTop > 0;
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  }

  private wheelPixels(delta: number, mode: number, pageSize: number): number {
    if (mode === WheelEvent.DOM_DELTA_LINE) return delta * 16;
    if (mode === WheelEvent.DOM_DELTA_PAGE) return delta * pageSize;
    return delta;
  }

  private sortNotes(notes: any[]): any[] {
    return [...notes].sort((a, b) => {
      const columnDifference = this.columnIndex(a.columnId) - this.columnIndex(b.columnId);
      return columnDifference || compareNotesByRank(a, b);
    });
  }

  private resolveWorkspaceSelection(): string | null {
    const workspaces = this.workspaceOptions();
    if (!workspaces.length) return null;

    const preferredWorkspaceId = this.userPreferenceStore.selectedWorkspaceId();

    if (
      preferredWorkspaceId &&
      workspaces.some((workspace) => workspace.value === preferredWorkspaceId)
    ) {
      return preferredWorkspaceId;
    }

    const currentWorkspaceId = this.activeWorkspaceId();

    if (
      currentWorkspaceId &&
      workspaces.some((workspace) => workspace.value === currentWorkspaceId)
    ) {
      return currentWorkspaceId;
    }

    return workspaces[0]?.value ?? null;
  }

  private activateWorkspace(workspaceId: string): void {
    // Resolve the saved selection before loading members and board data.
    if (this.userPreferenceStore.loading()) {
      this.pendingWorkspaceActivation.set(true);
      return;
    }
    const preferredFolderId = this.userPreferenceStore.selectedFolderId();
    this.workspaceDropdownStore.selectWorkspace(workspaceId, preferredFolderId);
    this.workspaceStore.select(workspaceId);
    this.loadWorkspaceMembers(workspaceId);

    const activeWs = this.workspaceDropdownStore.selectedWorkspace();
    if (activeWs && activeWs.folders.length > 0) {
      this.workspaceFolderStore.setFolders(
        workspaceId,
        activeWs.folders.map((f, i) => ({
          id: idOf(f),
          name: f.name,
          workspaceId,
          status: 'ACTIVE',
          isDefault: i === 0,
          position: i,
        })) as any,
      );
      this.selectFolderAndLoad();
      return;
    }

    this.getWorkspaceFolders(workspaceId);
  }

  private resolveFolderSelection(): string | null {
    const folders = this.folders();
    if (!folders.length) return null;

    const preferredFolderId = this.userPreferenceStore.selectedFolderId();

    if (preferredFolderId && folders.some((folder) => idOf(folder) === preferredFolderId)) {
      return preferredFolderId;
    }

    const currentFolderId = this.activeFolder();

    if (currentFolderId && folders.some((folder) => idOf(folder) === currentFolderId)) {
      return currentFolderId;
    }

    const defaultFolder = this.workspaceFolderStore.defaultFolder();
    return idOf(defaultFolder) || idOf(folders[0]) || null;
  }

  private selectFolderAndLoad(): void {
    const folders = this.folders();
    if (!folders.length) {
      this.workspaceDropdownStore.selectFolder(null);
      this.workspaceFolderStore.select(null);
      this.stickyNoteColumnStore.clear();
      this.clearBoard();
      return;
    }

    const folderId = this.resolveFolderSelection();
    this.workspaceDropdownStore.selectFolder(folderId);
    this.workspaceFolderStore.select(folderId);

    this.loadBoard();
  }

  private syncLegacyStores(workspaces: WorkspaceDropdownItem[]): void {
    this.workspaceStore.setWorkspaces(
      workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        status: ACTIVE_STATUS,
      })),
    );
  }

  private loadBoard(forceColumns = false): void {
    this.overdue.refresh(this.activeWorkspaceId() ?? '', this.activeFolder() ?? '');
    this.boardError.set(null);
    this.getStickyNoteColumns(forceColumns);
    this.getNotesForToday();
  }

  private clearBoard(): void {
    this.overdue.reset();
    this.notesRequestVersion += 1;
    this.stickyNoteDataCache.clear();
    this.closeNotePanel();
    this.closeColumnPanel();
    this.stickyNotes.set([]);
    this.boardError.set(null);
    this.loadingNotes.set(false);
    this.movingNoteId.set(null);
    this.draggingNoteId.set(null);
    this.selectedNoteIds.set(new Set());
    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
  }

  private clearWorkspaceMembers(): void {
    this.workspaceMemberRequestVersion += 1;
    this.workspaceMembers.set([]);
    this.loadingWorkspaceMembers.set(false);
  }

  private columnIndex(columnId: string): number {
    const colId = idOf(columnId);
    return this.stickyNoteColumns().findIndex((column) => idOf(column.id) === colId);
  }

  private columnForNote(note: any): any {
    return this.stickyNoteColumnById().get(idOf(note?.columnId)) ?? null;
  }

  private noteMatchesSearch(note: any, search: string): boolean {
    if (!search) return true;
    return stickyMarkdownToPlainText(
      `${note?.title ?? ''} ${note?.content ?? note?.description ?? ''}`,
    )
      .toLowerCase()
      .includes(search);
  }

  private responseMessage(response: any, fallback: string): string {
    const message = String(response?.message ?? response?.data?.message ?? '').trim();
    return message || fallback || COMMON_MESSAGES.ERROR.GENERIC;
  }

  private errorKind(error: any): TodayLoadErrorKind {
    return this.isNetworkError(error) ? 'network' : 'server';
  }

  private isNetworkError(error: any): boolean {
    const status = Number(error?.status);
    if (status === 0) return true;

    const message = String(
      error?.message ?? error?.error?.message ?? error?.statusText ?? '',
    ).toLowerCase();

    return (
      message.includes('network') ||
      message.includes('internet') ||
      message.includes('offline') ||
      message.includes('timeout') ||
      message.includes('connection')
    );
  }

  private mapNote(note: any): any {
    const title = String(note?.title || '').trim() || 'Untitled note';
    const content = String(note?.content ?? note?.description ?? '').trim();
    const rawChecklists = Array.isArray(note?.checklists)
      ? note.checklists
      : note?.checklist
        ? [note.checklist]
        : [];
    const checklists = mapStickyNoteChecklists(rawChecklists);
    const totalCount = checklists.reduce(
      (total: number, checklist: any) => total + checklist.totalCount,
      0,
    );
    const completedCount = checklists.reduce(
      (total: number, checklist: any) => total + checklist.completedCount,
      0,
    );

    const isCompleted = this.isNoteCompleted(note);

    return {
      ...note,
      id: idOf(note),
      noteKey:
        note?.noteKey ??
        (typeof note?.stickyNoteNumber === 'number'
          ? `ST-${String(note.stickyNoteNumber).padStart(6, '0')}`
          : undefined),
      columnId: idOf(note?.columnId),
      folderId: idOf(note?.workspaceFolderId),
      columnName: entityNameOf(note?.columnId, note?.columnName ?? 'Note'),
      folderName: entityNameOf(note?.workspaceFolderId, note?.folderName ?? 'My Notes'),
      workspaceName: entityNameOf(note?.workspaceId, note?.workspaceName ?? 'Workspace'),
      creatorEmail: String(note?.createdBy?.email ?? '').trim(),
      updatedByEmail: String(note?.updatedBy?.email ?? '').trim(),
      title,
      content,
      description: content && content !== title ? content : '',
      color: note?.color ?? 'WHITE',
      shape: note?.shape ?? 'SQUARE',
      variant: note?.variant ?? 'PLAIN',
      backgroundPattern: note?.backgroundPattern ?? 'NONE',
      isCompleted,
      completed: isCompleted,
      completedAt: note?.completedAt ?? null,
      completedBy: note?.completedBy ?? null,
      checklists,
      checklistCount: checklists.length,
      checklistItemCount: totalCount,
      completedChecklistItemCount: completedCount,
      progress: totalCount ? Math.round((completedCount / totalCount) * 100) : undefined,
      compact: !content || content === title,
    };
  }

  isKeyCopied(key?: string): boolean {
    return !!(key && this.copiedKeyMap()[key]);
  }

  copyNoteKey(key?: string, event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (!key) return;
    navigator.clipboard
      .writeText(key)
      .then(() => {
        this.copiedKeyMap.update((map) => ({ ...map, [key]: true }));
        this.toastService.info(`Copied ${key} to clipboard`);
        setTimeout(() => {
          this.copiedKeyMap.update((map) => {
            const next = { ...map };
            delete next[key];
            return next;
          });
        }, 2000);
      })
      .catch(() => {
        // Fallback if clipboard API is not available
      });
  }

  isNoteSelected(note: any): boolean {
    const id = idOf(note);
    return !!id && this.selectedNoteIds().has(id);
  }

  toggleNoteSelection(note: any, checked: boolean): void {
    const id = idOf(note);
    if (!id) return;

    this.selectedNoteIds.update((set) => {
      const next = new Set(set);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  isAllSelected(notes?: any[]): boolean {
    const targetNotes = notes ?? this.visibleListNotes();
    if (!targetNotes.length) return false;
    const set = this.selectedNoteIds();
    return targetNotes.every((note) => set.has(idOf(note)));
  }

  isSomeSelected(notes?: any[]): boolean {
    const targetNotes = notes ?? this.visibleListNotes();
    if (!targetNotes.length) return false;
    const set = this.selectedNoteIds();
    const selectedInList = targetNotes.filter((note) => set.has(idOf(note)));
    return selectedInList.length > 0 && selectedInList.length < targetNotes.length;
  }

  toggleSelectAll(checked: boolean, notes?: any[]): void {
    const targetNotes = notes ?? this.visibleListNotes();
    if (!targetNotes.length) return;

    this.selectedNoteIds.update((set) => {
      const next = new Set(set);
      targetNotes.forEach((note) => {
        const id = idOf(note);
        if (id) {
          if (checked) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
      });
      return next;
    });
  }

  clearSelection(): void {
    this.selectedNoteIds.set(new Set());
  }

  bulkDeleteSelectedNotes(): void {
    const ids = Array.from(this.selectedNoteIds());
    if (!ids.length) return;

    let completed = 0;
    let deletedCount = 0;
    ids.forEach((id) => {
      this.stickyNoteApiService
        .moveToTrash(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.onNoteDeleted(id, false);
            completed++;
            deletedCount++;
            if (completed === ids.length) {
              this.overdue.refresh();
              this.toastService.info(
                `Moved ${deletedCount} ${deletedCount === 1 ? 'note' : 'notes'} to trash`,
              );
              this.clearSelection();
            }
          },
          error: () => {
            completed++;
            if (completed === ids.length) {
              if (deletedCount > 0) {
                this.overdue.refresh();
                this.toastService.info(
                  `Moved ${deletedCount} ${deletedCount === 1 ? 'note' : 'notes'} to trash`,
                );
              }
              this.clearSelection();
            }
          },
        });
    });
  }

  private isStickyNoteFont(value: any): boolean {
    const font = String(value ?? '').trim();
    return this.stickyNoteFontOptions.some((option) => option.value === font);
  }

  private isStickyNoteFontSize(value: any): boolean {
    const size = Number(value);
    return this.stickyNoteFontSizeOptions.some((option) => Number(option.value) === size);
  }

  private isStickyNoteLayout(value: any): boolean {
    const layout = String(value ?? '').trim();
    return this.stickyNoteLayoutOptions.some((option) => option.value === layout);
  }
}
