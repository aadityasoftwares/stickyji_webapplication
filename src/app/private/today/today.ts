import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import {
  LucideAArrowUp,
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideChevronDown,
  LucideFolderOpen,
  LucideGrid2X2,
  LucideList,
  LucideMoreHorizontal,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideSearch,
  LucideTrash2,
  LucideType,
  LucideX
} from '@lucide/angular';

import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { Divider } from '../../shared/components/divider/divider';
import { Input as AppInput } from '../../shared/components/input/input';
import { Label } from '../../shared/components/label/label';
import { Loader } from '../../shared/components/loader/loader';
import { Select } from '../../shared/components/select/select';
import { Tabs } from '../../shared/components/tabs/tabs';
import { ToastService } from '../../shared/components/toast/services/toast.service';

import { MembersStack } from '../workspace-members/members-stack/members-stack';
import { AddEditNoteSidePanel } from '../mynotes/add-edit-note-side-panel/add-edit-note-side-panel';
import { AddEditStickyNoteColumnSidePanel } from '../sticky-note-columns/add-edit-sticky-note-column-side-panel/add-edit-sticky-note-column-side-panel';
import { StickyNote } from '../mynotes/sticky-note/sticky-note';

import {
  STICKY_NOTE_FONT_OPTIONS,
  STICKY_NOTE_FONT_SIZE_OPTIONS,
  STICKY_NOTE_LAYOUT_OPTIONS,
  STICKY_NOTE_VIEW_OPTIONS,
  USER_PREFERENCE_KEYS,
  VIEW,
  View
} from '../../shared/constants/common.constants';
import {
  buildQueryParams,
  entityNameOf,
  extractErrorMessage,
  extractList,
  idOf,
  sortItemsByPosition
} from '../../shared/functions/common.function';
import {
  getNoteColorAccent,
  getNoteColumnEyebrow,
  mapStickyNoteChecklists,
  mapStickyNoteColumn
} from '../../shared/functions/sticky-note.function';
import {
  getWorkspaceMemberAvatar,
  getWorkspaceMemberId,
  getWorkspaceMemberName,
  getWorkspaceMemberRole
} from '../../shared/functions/workspace-member.function';
import {
  formatDateKeyDisplay,
  todayDateKey
} from '../../shared/functions/date.function';

import { StickyNoteApiService } from '../mynotes/services/sticky-notes.service';
import { StickyNoteColumnApiService } from '../mynotes/services/sticky-note-column.service';
import { StickyNoteColumnStore } from '../mynotes/services/sticky-note-column.store';
import { UserPreferenceStore } from '../user-preferences/services/user-preference.store';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceFolderService } from '../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import { WorkspaceFolder, WorkspaceFolderQuery } from '../workspacefolders/models/workspace-folder.models';
import { WorkspaceMemberApiService } from '../workspace-members/services/workspace-member.service';

@Component({
  selector: 'app-today',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today.html',
  styleUrl: './today.scss',
  imports: [
    CommonModule,
    DatePipe,
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
    Divider,
    Loader,
    MembersStack,
    Select,
    StickyNote,
    Tabs,
    AddEditNoteSidePanel,
    AddEditStickyNoteColumnSidePanel
  ]
})
export class Today {

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly stickyNoteColumnStore = inject(StickyNoteColumnStore);

  private readonly workspaceApiService = inject(WorkspaceService);
  private readonly workspaceMemberApiService = inject(WorkspaceMemberApiService);
  private readonly workspaceFolderApiService = inject(WorkspaceFolderService);
  private readonly stickyNoteColumnApiService = inject(StickyNoteColumnApiService);
  private readonly stickyNoteApiService = inject(StickyNoteApiService);

  private folderRequestVersion = 0;
  private workspaceMemberRequestVersion = 0;

  readonly LucideAArrowUp = LucideAArrowUp;
  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideList = LucideList;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideSearch = LucideSearch;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideType = LucideType;
  readonly LucideX = LucideX;
  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;

  readonly today = signal(new Date());
  readonly VIEW = VIEW;
  readonly view = signal<View>(VIEW.KANBAN);
  readonly searchTerm = signal('');

  readonly stickyNoteViewOptions: any[] = STICKY_NOTE_VIEW_OPTIONS;
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

  readonly workspaceOptions = computed<any[]>(() =>
    this.workspaceStore.workspaces().map(workspace => ({
      label: entityNameOf(workspace, 'Untitled workspace'),
      value: idOf(workspace),
      icon: LucidePanelsTopLeft
    }))
  );

  readonly activeWorkspaceId = this.workspaceStore.selectedId;
  readonly selectedWorkspaceId = computed(() => this.workspaceStore.selectedId() ?? '');
  readonly loadingWorkspaces = this.workspaceStore.loading;

  readonly activeFolder = this.workspaceFolderStore.selectedId;
  readonly selectedFolderId = computed(() => this.workspaceFolderStore.selectedId() ?? '');
  readonly loadingFolders = this.workspaceFolderStore.loading;
  readonly folders = this.workspaceFolderStore.activeFolders;
  readonly foldersError = this.workspaceFolderStore.error;

  readonly folderOptions = computed<any[]>(() =>
    this.folders().map(folder => ({
      label: entityNameOf(folder, 'Untitled folder'),
      value: idOf(folder),
      icon: LucideFolderOpen
    }))
  );

  readonly stickyNotes = signal<any[]>([]);
  readonly loadingNotes = signal(false);
  readonly workspaceMembers = signal<readonly any[]>([]);
  readonly loadingWorkspaceMembers = signal(false);

  readonly stickyNoteColumns = computed(() =>
    this.stickyNoteColumnStore.orderedColumns().map(column => mapStickyNoteColumn(column))
  );
  readonly loadingColumns = this.stickyNoteColumnStore.loading;

  readonly boardError = signal<string | null>(null);
  readonly movingNoteId = signal<string | null>(null);
  readonly tableEditingTitleId = signal<string | null>(null);
  readonly tableTitleDraft = signal('');

  readonly notePanelOpen = signal(false);
  readonly notePanelMode = signal<'create' | 'edit'>('create');
  readonly notePanelId = signal('');

  readonly columnPanelOpen = signal(false);
  readonly columnPanelId = signal('');
  readonly columnPanelColumn = signal<any | null>(null);

  readonly workspaceMemberStack = computed<readonly any[]>(() =>
    this.workspaceMembers().map(member => {
      const name = getWorkspaceMemberName(member);
      const role = getWorkspaceMemberRole(member);
      return {
        id: getWorkspaceMemberId(member),
        name,
        src: getWorkspaceMemberAvatar(member),
        tooltip: `${name} · ${role}`
      };
    })
  );

  readonly boardLoading = computed(() =>
    this.loadingWorkspaces() || this.loadingFolders() || this.loadingColumns() || this.loadingNotes()
  );

  readonly noteCount = computed(() => this.stickyNotes().length);
  readonly hasColumns = computed(() => this.stickyNoteColumns().length > 0);
  readonly firstActionColumnId = computed(() => this.stickyNoteColumns()[0]?.id ?? '');

  readonly visibleListNotes = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    if (!search) {
      return this.stickyNotes();
    }
    return this.stickyNotes().filter(note =>
      `${note.title ?? ''} ${note.description ?? ''}`.toLowerCase().includes(search)
    );
  });

  readonly viewTabs = STICKY_NOTE_VIEW_OPTIONS;

  private readonly syncPreferredWorkspace = effect(() => {
    if (!this.userPreferenceStore.loaded() || !this.workspaceStore.loaded()) return;

    const preferredWorkspaceId = this.userPreferenceStore.selectedWorkspaceId();
    if (!preferredWorkspaceId) return;

    const exists = this.workspaceStore.workspaces().some(
      workspace => workspace.id === preferredWorkspaceId
    );
    if (!exists) return;

    const currentWorkspaceId = this.activeWorkspaceId();

    if (currentWorkspaceId !== preferredWorkspaceId) {
      this.workspaceStore.select(preferredWorkspaceId);
      this.workspaceFolderStore.clear();
      this.stickyNoteColumnStore.clear();
      this.clearWorkspaceMembers();
      this.clearBoard();
    }

    untracked(() => {
      this.loadWorkspaceMembers(preferredWorkspaceId);
      this.getWorkspaceFolders(preferredWorkspaceId);
    });
  });

  ngOnInit(): void {
    this.userPreferenceStore.load();
    this.getWorkspaces();
  }

  setView(view: any): void {
    const raw = String(view ?? '').toLowerCase();
    if (raw === VIEW.TABLE || raw === 'list' || raw === 'table') {
      this.view.set(VIEW.TABLE);
    } else {
      this.view.set(VIEW.KANBAN);
    }
    this.searchTerm.set('');
  }

  isKanbanView(): boolean {
    return this.view() === VIEW.KANBAN;
  }

  isTableView(): boolean {
    return this.view() === VIEW.TABLE;
  }

  isCompactLayout(): boolean {
    const layout = String(this.stickyNoteLayout() ?? 'DETAIL').trim().toUpperCase();
    return layout === 'COMPACT' || layout === 'PLAIN';
  }

  isDetailLayout(): boolean {
    return !this.isCompactLayout();
  }

  fontFamilyFor(value: string): string {
    return this.stickyNoteFontOptions.find(option => option.value === value)?.family ??
      this.stickyNoteFontOptions[0]?.family ??
      '"DM Sans", sans-serif';
  }

  chooseFont(value: any): void {
    const font = String(value ?? '').trim();
    if (!this.isStickyNoteFont(font)) return;
    this.userPreferenceStore.setAndSave(USER_PREFERENCE_KEYS.STICKY_NOTE_FONT, font);
  }

  onStickyNoteFontSelection(value: any): void {
    this.chooseFont(value);
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
    if (this.workspaceStore.loaded() && !force) {
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

    if (this.workspaceStore.loading()) return;

    this.workspaceStore.setLoading(true);
    this.workspaceStore.clearError();

    this.workspaceApiService.getMyWorkspaces()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.workspaceStore.setLoading(false))
      )
      .subscribe({
        next: (response: any) => {
          const workspaces = extractList(response);
          const pagination = response?.data?.meta ?? response?.meta ?? null;

          this.workspaceStore.setWorkspaces(
            workspaces,
            pagination
          );

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
          console.error(error);
          this.workspaceStore.setError(
            extractErrorMessage(error, 'Failed to load workspaces')
          );
          this.workspaceFolderStore.clear();
          this.stickyNoteColumnStore.clear();
          this.clearWorkspaceMembers();
          this.clearBoard();
        }
      });
  }

  onWorkspaceSelection(value: any): void {
    const workspaceId = String(value ?? '').trim();
    if (!workspaceId || workspaceId === this.activeWorkspaceId()) return;

    this.workspaceStore.select(workspaceId);
    this.userPreferenceStore.setAndSave(
      USER_PREFERENCE_KEYS.SELECTED_WORKSPACE_ID,
      workspaceId
    );

    this.workspaceFolderStore.clear();
    this.stickyNoteColumnStore.clear();
    this.clearWorkspaceMembers();
    this.clearBoard();

    this.loadWorkspaceMembers(workspaceId);
    this.getWorkspaceFolders(workspaceId);
  }

  loadWorkspaceMembers(workspaceId: string): void {
    const id = workspaceId.trim();
    const requestVersion = ++this.workspaceMemberRequestVersion;
    if (!id) {
      this.clearWorkspaceMembers();
      return;
    }

    this.loadingWorkspaceMembers.set(true);

    this.workspaceMemberApiService.getAll({
      workspaceId: id,
      status: 'ACTIVE',
      page: 1,
      limit: 100,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (requestVersion !== this.workspaceMemberRequestVersion ||
            this.activeWorkspaceId() !== id) {
            return;
          }
          this.workspaceMembers.set(extractList(response));
          this.loadingWorkspaceMembers.set(false);
        },
        error: (error: any) => {
          if (requestVersion !== this.workspaceMemberRequestVersion ||
            this.activeWorkspaceId() !== id) {
            return;
          }
          console.error(error);
          this.workspaceMembers.set([]);
          this.loadingWorkspaceMembers.set(false);
        }
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

    if (!force &&
      this.workspaceFolderStore.initialized() &&
      !this.workspaceFolderStore.error() &&
      this.workspaceFolderStore.workspaceId() === id) {
      this.selectFolderAndLoad();
      return;
    }

    const requestVersion = ++this.folderRequestVersion;
    this.workspaceFolderStore.resetForWorkspace(id);
    this.workspaceFolderStore.setLoading(true);

    const query: WorkspaceFolderQuery = {
      workspaceId: id,
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      sortBy: 'position',
      sortOrder: 'asc'
    };

    this.workspaceFolderApiService.getAllWorkspaceFolders(query)
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

          console.error(error);
          const message = extractErrorMessage(error, 'Failed to load workspace folders');
          this.workspaceFolderStore.setError(message);
          this.clearBoard();
        }
      });
  }

  onFolderSelection(value: any): void {
    const folderId = value ? String(value).trim() : null;
    if (folderId === this.activeFolder()) return;

    this.workspaceFolderStore.select(folderId);
    if (folderId) {
      this.userPreferenceStore.setAndSave(
        USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID,
        folderId
      );
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

    if (!force &&
      this.stickyNoteColumnStore.initialized() &&
      !this.stickyNoteColumnStore.error() &&
      this.stickyNoteColumnStore.contextMatches(workspaceId, folderId)) {
      return;
    }

    this.stickyNoteColumnStore.resetForContext(workspaceId, folderId);
    this.stickyNoteColumnStore.setLoading(true);

    this.stickyNoteColumnApiService
      .getByWorkspaceFolder(workspaceId, folderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (this.activeWorkspaceId() !== workspaceId ||
            this.activeFolder() !== folderId) {
            return;
          }
          this.stickyNoteColumnStore.setColumns(workspaceId, folderId, extractList(response));
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId ||
            this.activeFolder() !== folderId) {
            return;
          }
          console.error(error);
          const message = extractErrorMessage(error, 'Failed to load columns');
          this.stickyNoteColumnStore.setError(message);
          this.boardError.set(message);
        }
      });
  }

  getNotesForToday(): void {
    const workspaceId = this.activeWorkspaceId();
    const folderId = this.activeFolder();
    if (!workspaceId || !folderId) {
      this.stickyNotes.set([]);
      return;
    }

    this.loadingNotes.set(true);

    this.stickyNoteApiService.getAll(buildQueryParams({
      workspaceId,
      workspaceFolderId: folderId,
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      datePreset: 'TODAY',
      sortBy: 'position',
      sortOrder: 'asc',
    }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId) {
            return;
          }
          const notes = sortItemsByPosition(extractList(response))
            .map(note => this.mapNote(note));
          this.stickyNotes.set(notes);
          this.loadingNotes.set(false);
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId) {
            return;
          }
          console.error(error);
          this.stickyNotes.set([]);
          this.boardError.set(extractErrorMessage(error, 'Failed to load notes'));
          this.loadingNotes.set(false);
        }
      });
  }

  refreshBoard(): void {
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
    this.router.navigate(['/mynotes/trash'], {
      queryParams: workspaceId
        ? { workspaceId }
        : undefined
    });
  }

  updateSearch(value: any): void {
    this.searchTerm.set(value ?? '');
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  startTableTitleEdit(note: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const noteId = String(note?.id ?? '').trim();
    if (!noteId || this.movingNoteId()) return;

    this.tableEditingTitleId.set(noteId);
    this.tableTitleDraft.set(String(note?.title ?? ''));

    const sourceElement = event?.currentTarget as HTMLElement | null;
    setTimeout(() => {
      const row = sourceElement?.closest('tr');
      const input = row?.querySelector<HTMLInputElement>('[data-inline-note-title]');
      input?.focus();
      input?.select();
    });
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

    this.stickyNotes.update(notes =>
      notes.map(item => item.id === noteId ? { ...item, title: nextTitle } : item)
    );

    this.stickyNoteApiService.update(noteId, { title: nextTitle })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const serverTitle = String(response?.data?.title ?? nextTitle).trim();
          if (serverTitle && serverTitle !== nextTitle) {
            this.stickyNotes.update(notes =>
              notes.map(item => item.id === noteId ? { ...item, title: serverTitle } : item)
            );
          }
        },
        error: (error: any) => {
          this.stickyNotes.update(notes =>
            notes.map(item => item.id === noteId ? { ...item, title: currentTitle } : item)
          );
          this.toastService.error(extractErrorMessage(error, 'Unable to rename note.'), {
            title: 'Title not updated',
            dedupeKey: `note-title-${noteId}`
          });
        }
      });
  }

  cancelTableTitleEdit(note?: any): void {
    const noteId = String(note?.id ?? '').trim();
    if (noteId && this.tableEditingTitleId() !== noteId) return;

    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
  }

  visibleNotesFor(columnId: string): any[] {
    const search = this.searchTerm().trim().toLowerCase();
    return this.stickyNotes().filter(note => {
      if (note.columnId !== columnId) return false;
      if (!search) return true;
      return `${note.title ?? ''} ${note.description ?? ''}`.toLowerCase().includes(search);
    });
  }

  canMoveBackward(note: any): boolean {
    return this.columnIndex(note.columnId) > 0;
  }

  canMoveForward(note: any): boolean {
    const index = this.columnIndex(note.columnId);
    return index >= 0 && index < this.stickyNoteColumns().length - 1;
  }

  dropNote(event: any, targetColumnId: string): void {
    if (this.searchTerm().trim() || this.movingNoteId()) return;

    const note = event.item.data;
    if (!note?.id || !targetColumnId) return;

    this.moveNote(note, targetColumnId, event.currentIndex);
  }

  moveBackward(note: any): void {
    const index = this.columnIndex(note.columnId);
    if (index <= 0) return;

    const targetColumn = this.stickyNoteColumns()[index - 1];
    this.moveNote(note, targetColumn.id, this.notesInColumn(targetColumn.id).length);
  }

  moveForward(note: any): void {
    const index = this.columnIndex(note.columnId);
    if (index < 0 || index >= this.stickyNoteColumns().length - 1) return;

    const targetColumn = this.stickyNoteColumns()[index + 1];
    this.moveNote(note, targetColumn.id, this.notesInColumn(targetColumn.id).length);
  }

  isNoteCompleted(note: any): boolean {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.type === 'COMPLETED';
  }

  noteEyebrow(note: any): string {
    const type = this.stickyNoteColumns().find(column => column.id === note.columnId)?.type;
    return getNoteColumnEyebrow(type);
  }

  noteColumnLabel(note: any): string {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.label
      ?? note?.columnName
      ?? 'Note';
  }

  noteDateLabel(value: unknown): string {
    return formatDateKeyDisplay(value);
  }

  todayDateKey(): string {
    return todayDateKey(this.today());
  }

  noteColumnAccent(note: any): string {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.accent ?? getNoteColorAccent('YELLOW');
  }

  stickyNoteData(note: any, column: any): any {
    return {
      ...note,
      eyebrow: this.noteEyebrow(note),
      columnLabel: column?.label ?? column?.name ?? 'Note',
      checkboxVariant: column?.checkboxVariant,
      completed: this.isNoteCompleted(note),
      view: this.view(),
      layout: this.stickyNoteLayout(),
      font: this.stickyNoteFont(),
      fontSize: this.stickyNoteFontSize(),
      canMoveBackward: this.canMoveBackward(note),
      canMoveForward: this.canMoveForward(note),
      actionsDisabled: this.movingNoteId() === (note?.id ?? note?._id)
    };
  }

  deleteNote(note: any): void {
    const noteId = idOf(note);
    if (!noteId) return;

    this.stickyNoteApiService.moveToTrash(noteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.onNoteDeleted(noteId);
          this.toastService.success('Moved to Trash. You can restore this note for 60 days.', {
            title: 'Note safely moved',
            dedupeKey: `trash-note-${noteId}`
          });
        },
        error: (error: any) => {
          this.toastService.error(extractErrorMessage(error, 'Unable to move note to Trash.'), {
            title: 'Note not moved',
            dedupeKey: `trash-note-${noteId}`
          });
        }
      });
  }

  onNoteDeleted(noteId: string): void {
    if (!noteId) return;
    this.stickyNotes.update(notes => notes.filter(item => idOf(item) !== noteId));
  }

  onNoteUpdated(updated: any): void {
    const id = idOf(updated);
    if (!id) return;
    this.stickyNotes.update(notes => notes.map(item => idOf(item) === id ? { ...item, ...updated } : item));
  }

  retryFolders(): void {
    const workspaceId = this.activeWorkspaceId();
    if (!workspaceId) return;
    this.getWorkspaceFolders(workspaceId, true);
  }

  openFolderCreateModal(): void {
    const workspaceId = this.activeWorkspaceId();
    this.router.navigate(['/workspacefolders'], {
      queryParams: workspaceId ? { workspaceId } : undefined
    });
  }

  openColumnCreateModal(): void {
    if (!this.activeWorkspaceId() || !this.activeFolder() || this.boardLoading()) return;
    this.columnPanelId.set('');
    this.columnPanelColumn.set(null);
    this.columnPanelOpen.set(true);
  }

  requestColumnEdit(column: any): void {
    const id = idOf(column);
    if (!id || this.boardLoading()) return;
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

  onNoteSaved(_noteId: string): void {
    this.closeNotePanel();
    this.loadBoard();
  }

  private moveNote(note: any, targetColumnId: string, targetIndex: number): void {
    if (this.movingNoteId()) return;

    const snapshot = this.stickyNotes().map(item => ({ ...item }));
    const sourceColumnId = note.columnId;
    const sourceNotes = this.notesInColumn(sourceColumnId).filter(item => item.id !== note.id);
    const targetNotes = sourceColumnId === targetColumnId
      ? sourceNotes
      : this.notesInColumn(targetColumnId).filter(item => item.id !== note.id);

    const index = Math.max(0, Math.min(targetIndex, targetNotes.length));
    targetNotes.splice(index, 0, { ...note, columnId: targetColumnId });

    const changed = new Map<string, any>();
    targetNotes.forEach((item, itemIndex) => {
      changed.set(item.id, {
        ...item,
        columnId: targetColumnId,
        position: itemIndex + 1
      });
    });

    if (sourceColumnId !== targetColumnId) {
      sourceNotes.forEach((item, itemIndex) => {
        changed.set(item.id, {
          ...item,
          columnId: sourceColumnId,
          position: itemIndex + 1
        });
      });
    }

    const nextNotes = snapshot.map(item => changed.get(item.id) ?? item);
    const updates = [...changed.values()].filter(item => {
      const previous = snapshot.find(current => current.id === item.id);
      return previous && (previous.columnId !== item.columnId ||
        previous.position !== item.position);
    });

    if (!updates.length) return;

    this.stickyNotes.set(this.sortNotes(nextNotes));
    this.movingNoteId.set(note.id);
    this.boardError.set(null);

    forkJoin(updates.map(item => this.stickyNoteApiService.update(item.id, {
      columnId: item.columnId,
      position: item.position
    })))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.movingNoteId.set(null),
        error: error => {
          console.error(error);
          this.movingNoteId.set(null);
          this.boardError.set(extractErrorMessage(error, 'Failed to move note'));
          this.getNotesForToday();
        }
      });
  }

  private notesInColumn(columnId: string): any[] {
    return sortItemsByPosition(
      this.stickyNotes().filter(note => note.columnId === columnId)
    );
  }

  private sortNotes(notes: any[]): any[] {
    return [...notes].sort((a, b) => {
      const columnDifference = this.columnIndex(a.columnId) - this.columnIndex(b.columnId);
      return columnDifference || (a.position ?? 0) - (b.position ?? 0);
    });
  }

  private resolveWorkspaceSelection(): string | null {
    const workspaces = this.workspaceStore.workspaces();
    if (!workspaces.length) return null;

    const preferredWorkspaceId = this.userPreferenceStore.selectedWorkspaceId();

    if (
      preferredWorkspaceId &&
      workspaces.some(workspace => workspace.id === preferredWorkspaceId)
    ) {
      return preferredWorkspaceId;
    }

    const currentWorkspaceId = this.workspaceStore.selectedId();

    if (
      currentWorkspaceId &&
      workspaces.some(workspace => workspace.id === currentWorkspaceId)
    ) {
      return currentWorkspaceId;
    }

    return workspaces[0]?.id ?? null;
  }

  private activateWorkspace(workspaceId: string): void {
    this.workspaceStore.select(workspaceId);
    this.loadWorkspaceMembers(workspaceId);
    this.getWorkspaceFolders(workspaceId);
  }

  private resolveFolderSelection(): string | null {
    const folders = this.folders();
    if (!folders.length) return null;

    const preferredFolderId = this.userPreferenceStore.selectedFolderId();

    if (
      preferredFolderId &&
      folders.some(folder => idOf(folder) === preferredFolderId)
    ) {
      return preferredFolderId;
    }

    const currentFolderId = this.activeFolder();

    if (
      currentFolderId &&
      folders.some(folder => idOf(folder) === currentFolderId)
    ) {
      return currentFolderId;
    }

    const defaultFolder = this.workspaceFolderStore.defaultFolder();
    return idOf(defaultFolder) || idOf(folders[0]) || null;
  }

  private selectFolderAndLoad(): void {
    const folders = this.folders();
    if (!folders.length) {
      this.workspaceFolderStore.select(null);
      this.stickyNoteColumnStore.clear();
      this.clearBoard();
      return;
    }

    const folderId = this.resolveFolderSelection();
    this.workspaceFolderStore.select(folderId);

    const preferredFolderId = this.userPreferenceStore.selectedFolderId();
    if (folderId && folderId !== preferredFolderId) {
      this.userPreferenceStore.setAndSave(
        USER_PREFERENCE_KEYS.SELECTED_FOLDER_ID,
        folderId
      );
    }

    this.loadBoard();
  }

  private loadBoard(forceColumns = false): void {
    this.boardError.set(null);
    this.getStickyNoteColumns(forceColumns);
    this.getNotesForToday();
  }

  private clearBoard(): void {
    this.closeNotePanel();
    this.closeColumnPanel();
    this.stickyNotes.set([]);
    this.boardError.set(null);
    this.loadingNotes.set(false);
    this.movingNoteId.set(null);
    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
  }

  private clearWorkspaceMembers(): void {
    this.workspaceMemberRequestVersion += 1;
    this.workspaceMembers.set([]);
    this.loadingWorkspaceMembers.set(false);
  }

  private columnIndex(columnId: string): number {
    return this.stickyNoteColumns().findIndex(column => column.id === columnId);
  }

  private mapNote(note: any): any {
    const title = String(note?.title || '').trim() || 'Untitled note';
    const content = String(note?.content || '').trim();
    const rawChecklists = Array.isArray(note?.checklists)
      ? note.checklists
      : note?.checklist
        ? [note.checklist]
        : [];
    const checklists = mapStickyNoteChecklists(rawChecklists);
    const totalCount = checklists.reduce(
      (total: number, checklist: any) => total + checklist.totalCount,
      0
    );
    const completedCount = checklists.reduce(
      (total: number, checklist: any) => total + checklist.completedCount,
      0
    );

    return {
      ...note,
      id: idOf(note),
      columnId: idOf(note?.columnId),
      folderId: idOf(note?.workspaceFolderId),
      columnName: entityNameOf(note?.columnId, 'Note'),
      folderName: entityNameOf(note?.workspaceFolderId, 'My Notes'),
      workspaceName: entityNameOf(note?.workspaceId, 'Workspace'),
      creatorEmail: String(note?.createdBy?.email ?? '').trim(),
      updatedByEmail: String(note?.updatedBy?.email ?? '').trim(),
      title,
      content,
      description: content && content !== title ? content : '',
      color: note?.color ?? 'WHITE',
      shape: note?.shape ?? 'SQUARE',
      variant: note?.variant ?? 'PLAIN',
      backgroundPattern: note?.backgroundPattern ?? 'NONE',
      checklists,
      checklistCount: checklists.length,
      checklistItemCount: totalCount,
      completedChecklistItemCount: completedCount,
      progress: totalCount
        ? Math.round((completedCount / totalCount) * 100)
        : undefined,
      compact: !content || content === title
    };
  }

  private isStickyNoteFont(value: any): boolean {
    const font = String(value ?? '').trim();
    return this.stickyNoteFontOptions.some(option => option.value === font);
  }

  private isStickyNoteFontSize(value: any): boolean {
    const size = Number(value);
    return this.stickyNoteFontSizeOptions.some(option => Number(option.value) === size);
  }

  private isStickyNoteLayout(value: any): boolean {
    const layout = String(value ?? '').trim();
    return this.stickyNoteLayoutOptions.some(option => option.value === layout);
  }
}
