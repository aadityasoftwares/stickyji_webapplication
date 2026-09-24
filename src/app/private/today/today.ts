import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LucideCheck, LucideChevronDown, LucideArrowLeft, LucideArrowRight, LucideFolderOpen, LucideGrid2X2, LucideList, LucidePanelsTopLeft, LucidePencil, LucidePlus, LucideRefreshCw, LucideSearch, LucideTrash2, LucideX } from '@lucide/angular';
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
import { AddEditNoteSidePanel } from '../mynotes/add-edit-note-side-panel/add-edit-note-side-panel';
import { StickyNote } from '../mynotes/sticky-note/sticky-note';
import { StickyNoteColumnApiService } from '../mynotes/services/sticky-note-column.service';
import { StickyNoteColumnStore } from '../mynotes/services/sticky-note-column.store';
import { StickyNoteChecklistItemApiService } from '../mynotes/services/sticky-note-checklist-item.service';
import { StickyNoteApiService } from '../mynotes/services/sticky-notes.service';
import { WorkspaceApiService } from '../workspace/services/workspace.service';
import { WorkspaceStore } from '../workspace/services/workspace.store';
import { WorkspaceFolderApiService } from '../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../workspacefolders/services/workspace-folder.store';
import { ToastService } from '../../shared/components/toast/services/toast.service';
import { MembersStack } from '../workspace-members/members-stack/members-stack';
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
    AppIcon,
    AppInput,
    Badge,
    Button,
    Checkbox,
    Divider,
    Label,
    Loader,
    MembersStack,
    Select,
    StickyNote,
    Tabs,
    AddEditNoteSidePanel
  ]
})
export class Today {
  private readonly destroyRef = inject(DestroyRef);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly workspaceApiService = inject(WorkspaceApiService);
  private readonly workspaceMemberApiService = inject(WorkspaceMemberApiService);
  private readonly workspaceFolderApiService = inject(WorkspaceFolderApiService);
  private readonly stickyNoteColumnApiService = inject(StickyNoteColumnApiService);
  private readonly stickyNoteColumnStore = inject(StickyNoteColumnStore);
  private readonly stickyNoteChecklistItemApiService = inject(StickyNoteChecklistItemApiService);
  private readonly stickyNoteApiService = inject(StickyNoteApiService);
  private readonly toastService = inject(ToastService);
  private workspaceMemberRequestVersion = 0;
  private readonly stickyNoteFontStorageKey = 'mystickynotes.note-font';
  readonly LucideArrowLeft = LucideArrowLeft;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideGrid2X2 = LucideGrid2X2;
  readonly LucideList = LucideList;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideSearch = LucideSearch;
  readonly LucideX = LucideX;
  readonly today = signal(new Date());
  readonly view = signal<any>('kanban');
  readonly searchTerm = signal('');
  /**
   * Sticky-note information density.
   * This is intentionally separate from the page Kanban/List view.
   */
  readonly stickyNoteLayout = signal<any>('plain');
  readonly stickyNoteLayoutOptions: any[] = [
    {
      label: 'Plan',
      value: 'plain',
      icon: LucideList
    },
    {
      label: 'Detail',
      value: 'detail',
      icon: LucidePanelsTopLeft
    }
  ];
  readonly stickyNoteFontOptions: any[] = [
    { label: 'Clean · DM Sans', value: 'dmSans' },
    { label: 'Caveat', value: 'caveat' },
    { label: 'Patrick Hand', value: 'patrickHand' },
    { label: 'Kalam', value: 'kalam' },
    { label: 'Architects Daughter', value: 'architectsDaughter' },
    { label: 'Indie Flower', value: 'indieFlower' },
    { label: 'Nanum Pen', value: 'nanumPen' },
    { label: 'Shadows Into Light', value: 'shadowsIntoLight' },
    { label: 'Comic Neue', value: 'comicNeue' },
    { label: 'Sriracha', value: 'sriracha' },
    { label: 'Short Stack', value: 'shortStack' },
    { label: 'Gochi Hand', value: 'gochiHand' }
  ];
  // Options must exist before restoring the saved font preference.
  readonly stickyNoteFont = signal<any>(this.readStoredStickyNoteFont());
  readonly selectedFontOption = computed(() =>
    this.stickyNoteFontOptions.find(option => option.value === this.stickyNoteFont()) ?? this.stickyNoteFontOptions[0]
  );
  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly fontMenuOpen = signal(false);
  private activeFontIndex = 0;
  @ViewChild('fontTrigger') private fontTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('fontMenu') private fontMenu?: ElementRef<HTMLElement>;
  readonly fontFamilies: Record<string, string> = {
    dmSans: '"DM Sans", sans-serif',
    caveat: '"Caveat", cursive',
    patrickHand: '"Patrick Hand", cursive',
    kalam: '"Kalam", cursive',
    architectsDaughter: '"Architects Daughter", cursive',
    indieFlower: '"Indie Flower", cursive',
    nanumPen: '"Nanum Pen Script", cursive',
    shadowsIntoLight: '"Shadows Into Light", cursive',
    comicNeue: '"Comic Neue", cursive',
    sriracha: '"Sriracha", cursive',
    shortStack: '"Short Stack", cursive',
    gochiHand: '"Gochi Hand", cursive'
  };
  fontFamilyFor(value: string): string {
    return this.fontFamilies[value] ?? this.fontFamilies['dmSans'];
  }
  toggleFontMenu(): void {
    if (this.fontMenuOpen()) { this.closeFontMenu(); return; }
    this.activeFontIndex = Math.max(0, this.stickyNoteFontOptions.findIndex(option => option.value === this.stickyNoteFont()));
    this.fontMenuOpen.set(true);
  }
  closeFontMenu(restoreFocus = true): void {
    this.fontMenuOpen.set(false);
    if (restoreFocus) this.fontTrigger?.nativeElement.focus();
  }
  chooseFont(value: string): void {
    this.onStickyNoteFontSelection(value);
    this.closeFontMenu();
  }
  onFontTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.activeFontIndex = event.key === 'ArrowUp' ? this.stickyNoteFontOptions.length - 1 : 0;
    this.fontMenuOpen.set(true);
    this.focusFontOption();
  }
  focusFontOption(): void {
    queueMicrotask(() => {
      if (this.destroyRef.destroyed || !this.fontMenuOpen()) return;
      const option = this.fontMenu?.nativeElement.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')[this.activeFontIndex];
      option?.focus({ preventScroll: true });
      option?.scrollIntoView({ block: 'nearest' });
    });
  }
  onFontMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeFontMenu();
      return;
    }
    if (event.key === 'Tab') { this.closeFontMenu(); return; }
    const count = this.stickyNoteFontOptions.length;
    switch (event.key) {
      case 'ArrowDown': this.activeFontIndex = (this.activeFontIndex + 1) % count; break;
      case 'ArrowUp': this.activeFontIndex = (this.activeFontIndex - 1 + count) % count; break;
      case 'Home': this.activeFontIndex = 0; break;
      case 'End': this.activeFontIndex = count - 1; break;
      default: return;
    }
    event.preventDefault();
    this.focusFontOption();
  }
  onFontOptionFocus(index: number): void { this.activeFontIndex = index; }
  readonly stickyNotes = signal<any[]>([]);
  readonly loadingNotes = signal(false);
  readonly workspaceMembers = signal<readonly any[]>([]);
  readonly loadingWorkspaceMembers = signal(false);
  readonly stickyNoteColumns = computed(() => this.stickyNoteColumnStore
    .orderedColumns()
    .map(column => this.mapColumn(column)));
  readonly loadingColumns = this.stickyNoteColumnStore.loading;
  readonly boardError = signal<string | null>(null);
  readonly movingNoteId = signal<string | null>(null);
  readonly updatingChecklistItemIds = signal<readonly string[]>([]);
  readonly updatingTitleIds = signal<readonly string[]>([]);
  readonly updatingDescriptionIds = signal<readonly string[]>([]);
  readonly tableEditingTitleId = signal<string | null>(null);
  readonly tableTitleDraft = signal('');
  readonly notePanelOpen = signal(false);
  readonly notePanelMode = signal<'create' | 'edit'>('create');
  readonly notePanelId = signal('');
  readonly activeWorkspaceId = this.workspaceStore.selectedId;
  readonly loadingWorkspaces = this.workspaceStore.loading;
  readonly activeFolder = this.workspaceFolderStore.selectedId;
  readonly loadingFolders = this.workspaceFolderStore.loading;
  readonly folders = this.workspaceFolderStore.activeFolders;
  readonly foldersError = this.workspaceFolderStore.error;
  readonly workspaceOptions = computed<any[]>(() => this.workspaceStore.workspaces().map(workspace => ({ label: workspace.name, value: workspace.id })));
  readonly folderOptions = computed<any[]>(() => this.folders().map(folder => ({ label: folder.name, value: folder.id })));
  readonly workspaceMemberStack = computed<readonly any[]>(() => this.workspaceMembers().map(member => ({
    id: this.workspaceMemberId(member),
    name: this.workspaceMemberName(member),
    src: this.workspaceMemberAvatar(member),
    tooltip: `${this.workspaceMemberName(member)} · ${this.workspaceMemberRole(member)}`
  })));
  readonly boardLoading = computed(() => this.loadingWorkspaces() || this.loadingFolders() || this.loadingColumns() || this.loadingNotes());
  readonly noteCount = computed(() => this.stickyNotes().length);
  readonly hasColumns = computed(() => this.stickyNoteColumns().length > 0);
  readonly firstActionColumnId = computed(() => this.stickyNoteColumns()[0]?.id ?? '');
  readonly visibleListNotes = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    if (!search)
      return this.stickyNotes();
    return this.stickyNotes().filter(note => `${note.title ?? ''} ${note.description ?? ''}`.toLowerCase().includes(search));
  });
  readonly viewTabs = [
    {
      value: 'kanban',
      label: 'Kanban',
      icon: LucideGrid2X2,
    },
    {
      value: 'list',
      label: 'List',
      icon: LucideList,
    },
    {
      value: 'trash',
      label: 'Trash',
      icon: LucideTrash2,
      tone: 'danger',
    },
  ] as any;
  ngOnInit(): void {
    this.getWorkspaces();
  }
  getWorkspaces(): void {
    if (this.workspaceStore.initialized() &&
      this.workspaceStore.workspaces().length > 0) {
      const workspaceId = this.activeWorkspaceId() ?? this.workspaceStore.workspaces()[0]?.id ?? null;
      if (workspaceId) {
        this.workspaceStore.select(workspaceId);
        this.loadWorkspaceMembers(workspaceId);
        this.getWorkspaceFolders(workspaceId);
      }
      return;
    }
    this.workspaceStore.setLoading(true);
    this.workspaceApiService.getMyWorkspaces()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const workspaces = response.data ?? [];
          this.workspaceStore.setWorkspaces(workspaces, response.pagination ?? null);
          const workspaceId = this.activeWorkspaceId() ?? workspaces[0]?.id ?? null;
          if (!workspaceId) {
            this.workspaceFolderStore.clear();
            this.stickyNoteColumnStore.clear();
            this.clearWorkspaceMembers();
            this.clearBoard();
            return;
          }
          this.workspaceStore.select(workspaceId);
          this.loadWorkspaceMembers(workspaceId);
          this.getWorkspaceFolders(workspaceId);
        },
        error: error => {
          console.error(error);
          this.workspaceStore.setError(this.errorMessage(error, 'Failed to load workspaces'));
          this.workspaceFolderStore.clear();
          this.stickyNoteColumnStore.clear();
          this.clearWorkspaceMembers();
          this.clearBoard();
        }
      });
  }
  onWorkspaceSelection(value: any): void {
    const workspaceId = value ? String(value) : null;
    this.workspaceStore.select(workspaceId);
    this.workspaceFolderStore.clear();
    this.stickyNoteColumnStore.clear();
    this.clearWorkspaceMembers();
    this.clearBoard();
    if (workspaceId) {
      this.loadWorkspaceMembers(workspaceId);
      this.getWorkspaceFolders(workspaceId);
    }
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
        next: response => {
          if (requestVersion !== this.workspaceMemberRequestVersion ||
            this.activeWorkspaceId() !== id) {
            return;
          }
          this.workspaceMembers.set(response.data ?? []);
          this.loadingWorkspaceMembers.set(false);
        },
        error: error => {
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
  getWorkspaceFolders(workspaceId: string): void {
    if (this.workspaceFolderStore.initialized() &&
      !this.workspaceFolderStore.error() &&
      this.workspaceFolderStore.workspaceId() === workspaceId) {
      this.selectFolderAndLoad();
      return;
    }
    this.workspaceFolderStore.resetForWorkspace(workspaceId);
    this.workspaceFolderStore.setLoading(true);
    this.workspaceFolderApiService.getByWorkspace(workspaceId, {
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      sortBy: 'position',
      sortOrder: 'asc'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (this.activeWorkspaceId() !== workspaceId)
            return;
          this.workspaceFolderStore.setFolders(workspaceId, response.data ?? [], response.pagination ?? null);
          this.selectFolderAndLoad();
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId)
            return;
          console.error(error);
          this.workspaceFolderStore.setError(this.errorMessage(error, 'Failed to load workspace folders'));
          this.clearBoard();
        }
      });
  }
  onFolderSelection(value: any): void {
    const folderId = value ? String(value) : null;
    this.workspaceFolderStore.select(folderId);
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
          this.stickyNoteColumnStore.setColumns(workspaceId, folderId, response.data ?? []);
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId ||
            this.activeFolder() !== folderId) {
            return;
          }
          console.error(error);
          const message = this.errorMessage(error, 'Failed to load columns');
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
    this.stickyNoteApiService.getAll(this.buildParams({
      workspaceId,
      workspaceFolderId: folderId,
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      datePreset: 'TODAY',
      sortBy: 'position',
      sortOrder: 'asc'
    }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId)
            return;
          const notes = [...(response.data ?? [])]
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map(note => this.mapNote(note));
          this.stickyNotes.set(notes);
          this.loadingNotes.set(false);
        },
        error: error => {
          if (this.activeWorkspaceId() !== workspaceId || this.activeFolder() !== folderId)
            return;
          console.error(error);
          this.stickyNotes.set([]);
          this.boardError.set(this.errorMessage(error, 'Failed to load notes'));
          this.loadingNotes.set(false);
        }
      });
  }
  refreshBoard(): void {
    const workspaceId = this.activeWorkspaceId();
    if (!workspaceId)
      return;
    this.loadWorkspaceMembers(workspaceId);
    if (!this.activeFolder()) {
      this.getWorkspaceFolders(workspaceId);
      return;
    }
    this.loadBoard(true);
  }
  setView(value: string | number | null): void {
    if (value === 'kanban' || value === 'list')
      this.view.set(value);
  }
  updateSearch(value: any): void {
    this.searchTerm.set(value ?? '');
  }
  clearSearch(): void {
    this.searchTerm.set('');
  }
  onStickyNoteLayoutSelection(value: any): void {
    const layout = String(value ?? '').trim();
    if (layout === 'detail' || layout === 'plain') {
      this.stickyNoteLayout.set(layout);
    }
  }
  onStickyNoteFontSelection(value: any): void {
    if (!this.isStickyNoteFont(value))
      return;
    this.stickyNoteFont.set(value);
    try {
      localStorage.setItem(this.stickyNoteFontStorageKey, value);
    }
    catch {
      // Storage can be unavailable in private browsing or during SSR.
    }
  }
  isNoteTitleUpdating(noteId: string): boolean {
    return this.updatingTitleIds().includes(noteId);
  }
  isNoteDescriptionUpdating(noteId: string): boolean {
    return this.updatingDescriptionIds().includes(noteId);
  }
  startTableTitleEdit(note: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const noteId = String(note?.id ?? '').trim();
    if (!noteId ||
      this.isNoteTitleUpdating(noteId) ||
      this.movingNoteId()) {
      return;
    }
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
    if (!noteId ||
      this.tableEditingTitleId() !== noteId) {
      return;
    }
    const currentTitle = String(note?.title ?? '').trim();
    const nextTitle = String(this.tableTitleDraft() ?? '').trim();
    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
    if (!nextTitle || nextTitle === currentTitle) {
      return;
    }
    this.updateNoteTitle({
      noteId,
      title: nextTitle
    });
  }
  cancelTableTitleEdit(note?: any): void {
    const noteId = String(note?.id ?? '').trim();
    if (noteId &&
      this.tableEditingTitleId() !== noteId) {
      return;
    }
    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
  }
  visibleNotesFor(columnId: string): any[] {
    const search = this.searchTerm().trim().toLowerCase();
    return this.stickyNotes().filter(note => {
      if (note.columnId !== columnId)
        return false;
      if (!search)
        return true;
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
    if (this.searchTerm().trim() || this.movingNoteId())
      return;
    const note = event.item.data;
    if (!note?.id || !targetColumnId)
      return;
    this.moveNote(note, targetColumnId, event.currentIndex);
  }
  moveBackward(note: any): void {
    const index = this.columnIndex(note.columnId);
    if (index <= 0)
      return;
    const targetColumn = this.stickyNoteColumns()[index - 1];
    this.moveNote(note, targetColumn.id, this.notesInColumn(targetColumn.id).length);
  }
  moveForward(note: any): void {
    const index = this.columnIndex(note.columnId);
    if (index < 0 || index >= this.stickyNoteColumns().length - 1)
      return;
    const targetColumn = this.stickyNoteColumns()[index + 1];
    this.moveNote(note, targetColumn.id, this.notesInColumn(targetColumn.id).length);
  }
  isNoteCompleted(note: any): boolean {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.type === 'COMPLETED';
  }
  noteEyebrow(note: any): string {
    const type = this.stickyNoteColumns().find(column => column.id === note.columnId)?.type;
    if (type === 'COMPLETED')
      return 'Completed';
    if (type === 'IN_PROGRESS')
      return 'In progress';
    if (type === 'TODO')
      return 'To do';
    return 'Note';
  }
  noteColumnLabel(note: any): string {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.label ?? 'Unknown';
  }
  noteColumnAccent(note: any): string {
    return this.stickyNoteColumns().find(column => column.id === note.columnId)?.accent ?? this.columnAccent('YELLOW');
  }
  stickyNoteData(note: any, column: any): any {
    const content = String(note?.content ?? note?.description ?? '');
    return {
      ...note,
      id: note?.id ?? note?._id,
      title: note?.title || 'Untitled note',
      content,
      description: content || undefined,
      eyebrow: this.noteEyebrow(note),
      columnLabel: column?.label ?? column?.name ?? 'Note',
      color: note?.color ?? 'WHITE',
      shape: note?.shape ?? 'SQUARE',
      variant: note?.variant ?? 'PLAIN',
      backgroundPattern: note?.backgroundPattern ?? 'NONE',
      checkboxVariant: column?.checkboxVariant,
      completed: this.isNoteCompleted(note),
      compact: note?.compact,
      progress: note?.progress,
      dueLabel: note?.noteDate ?? note?.dueLabel,
      timeEstimate: note?.timeEstimate,
      tag: note?.tag,
      tagVariant: note?.tagVariant,
      assignees: note?.assignees,
      checklists: (note?.checklists ?? []).map((checklist: any) => ({
        id: checklist?.id ?? checklist?._id,
        title: checklist?.title,
        completedCount: checklist?.completedCount,
        totalCount: checklist?.totalCount,
        items: (checklist?.items ?? []).map((item: any) => ({
          id: item?.id ?? item?._id,
          title: item?.title,
          isCompleted: item?.isCompleted === true,
          updating: this.isChecklistItemUpdating(item?.id ?? item?._id)
        }))
      })),
      showDragHandle: true,
      showEditAction: true,
      layout: this.stickyNoteLayout(),
      font: this.stickyNoteFont(),
      showMoveActions: true,
      canMoveBackward: this.canMoveBackward(note),
      canMoveForward: this.canMoveForward(note),
      actionsDisabled: this.movingNoteId() === (note?.id ?? note?._id),
      titleUpdating: this.isNoteTitleUpdating(note?.id ?? note?._id),
      descriptionUpdating: this.isNoteDescriptionUpdating(note?.id ?? note?._id)
    };
  }
  updateNoteTitle(change: any): void {
    const noteId = String(change?.noteId ?? '').trim();
    const nextTitle = String(change?.title ?? '').trim();
    if (!noteId ||
      !nextTitle ||
      this.isNoteTitleUpdating(noteId)) {
      return;
    }
    const note = this.stickyNotes().find(item => item.id === noteId);
    if (!note) {
      return;
    }
    const previousTitle = String(note.title ?? '').trim();
    if (previousTitle === nextTitle) {
      return;
    }
    // Optimistic UI: title changes immediately.
    this.stickyNotes.update(notes => notes.map(item => item.id === noteId
      ? { ...item, title: nextTitle }
      : item));
    this.setNoteTitleUpdating(noteId, true);
    this.stickyNoteApiService
      .update(noteId, { title: nextTitle })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const serverTitle = String((response as any)?.data?.title ?? nextTitle).trim();
          if (serverTitle && serverTitle !== nextTitle) {
            this.stickyNotes.update(notes => notes.map(item => item.id === noteId
              ? { ...item, title: serverTitle }
              : item));
          }
          this.setNoteTitleUpdating(noteId, false);
        },
        error: error => {
          console.error(error);
          this.stickyNotes.update(notes => notes.map(item => item.id === noteId
            ? { ...item, title: previousTitle }
            : item));
          this.setNoteTitleUpdating(noteId, false);
          this.toastService.error(this.errorMessage(error, 'Unable to rename note.'), {
            title: 'Title not updated',
            dedupeKey: `note-title-${noteId}`
          });
        }
      });
  }
  updateNoteDescription(change: any): void {
    const noteId = String(change?.noteId ?? '')
      .trim();
    const nextDescription = String(change?.description ?? '')
      .trim();
    if (!noteId ||
      this.isNoteDescriptionUpdating(noteId)) {
      return;
    }
    const note = this.stickyNotes()
      .find(item => item.id === noteId);
    if (!note) {
      return;
    }
    const previousDescription = String(note.description ?? '').trim();
    if (previousDescription ===
      nextDescription) {
      return;
    }
    // Optimistic UI.
    this.stickyNotes.update(notes => notes.map(item => item.id === noteId
      ? {
        ...item,
        description: nextDescription,
        compact: !nextDescription
      }
      : item));
    this.setNoteDescriptionUpdating(noteId, true);
    /*
     * Backend note text is stored in `content`.
     * The frontend maps it to `description`.
     */
    this.stickyNoteApiService
      .update(noteId, {
        content: nextDescription
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const serverDescription = String((response as any)
            ?.data?.content ??
            nextDescription).trim();
          this.stickyNotes.update(notes => notes.map(item => item.id === noteId
            ? {
              ...item,
              description: serverDescription,
              compact: !serverDescription
            }
            : item));
          this.setNoteDescriptionUpdating(noteId, false);
        },
        error: error => {
          console.error(error);
          this.stickyNotes.update(notes => notes.map(item => item.id === noteId
            ? {
              ...item,
              description: previousDescription,
              compact: !previousDescription
            }
            : item));
          this.setNoteDescriptionUpdating(noteId, false);
          this.toastService.error(this.errorMessage(error, 'Unable to update note description.'), {
            title: 'Description not updated',
            dedupeKey: `note-description-${noteId}`
          });
        }
      });
  }
  isChecklistItemUpdating(itemId: string): boolean {
    return this.updatingChecklistItemIds().includes(itemId);
  }
  updateChecklistItemStatus(noteId: string, itemId: string, checked: boolean): void {
    if (!noteId || !itemId || this.isChecklistItemUpdating(itemId))
      return;
    const note = this.stickyNotes().find(item => item.id === noteId);
    const checklistItem = note?.checklists
      ?.flatMap((checklist: any) => checklist.items ?? [])
      .find((item: any) => item.id === itemId);
    if (!checklistItem || checklistItem.isCompleted === checked)
      return;
    this.setChecklistItemCompletion(noteId, itemId, checked);
    this.setChecklistItemUpdating(itemId, true);
    this.stickyNoteChecklistItemApiService.updateCompletion(itemId, checked)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const confirmed = response?.data?.isCompleted;
          if (typeof confirmed === 'boolean' && confirmed !== checked) {
            this.setChecklistItemCompletion(noteId, itemId, confirmed);
          }
          this.setChecklistItemUpdating(itemId, false);
        },
        error: error => {
          console.error(error);
          this.setChecklistItemCompletion(noteId, itemId, !checked);
          this.setChecklistItemUpdating(itemId, false);
          this.toastService.error(this.errorMessage(error, 'Unable to update checklist item.'), {
            title: 'Checklist not updated',
            dedupeKey: `checklist-item-${itemId}`
          });
        }
      });
  }
  requestWorkspaceEdit(): void { }
  requestFolderEdit(): void { }
  openFolderCreateModal(): void { }
  openColumnCreateModal(): void { }
  requestColumnEdit(_column: any): void { }
  openNoteCreatePanel(columnId: string): void {
    if (!columnId || this.movingNoteId())
      return;
    this.notePanelMode.set('create');
    this.notePanelId.set(columnId);
    this.notePanelOpen.set(true);
  }
  openNoteEditPanel(note: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const noteId = note?.id ?? note?._id ?? '';
    if (!noteId || this.movingNoteId())
      return;
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
    if (this.movingNoteId())
      return;
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
    if (!updates.length)
      return;
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
          this.boardError.set(this.errorMessage(error, 'Failed to move note'));
          this.getNotesForToday();
        }
      });
  }
  private notesInColumn(columnId: string): any[] {
    return this.stickyNotes()
      .filter(note => note.columnId === columnId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }
  private sortNotes(notes: any[]): any[] {
    return [...notes].sort((a, b) => {
      const columnDifference = this.columnIndex(a.columnId) - this.columnIndex(b.columnId);
      return columnDifference || (a.position ?? 0) - (b.position ?? 0);
    });
  }
  private selectFolderAndLoad(): void {
    const folders = this.folders();
    if (!folders.length) {
      this.workspaceFolderStore.select(null);
      this.stickyNoteColumnStore.clear();
      this.clearBoard();
      return;
    }
    const folderId = this.activeFolder() ?? this.workspaceFolderStore.defaultFolder()?.id ?? folders[0].id;
    this.workspaceFolderStore.select(folderId);
    this.loadBoard();
  }
  private loadBoard(forceColumns = false): void {
    this.boardError.set(null);
    this.getStickyNoteColumns(forceColumns);
    this.getNotesForToday();
  }
  private clearBoard(): void {
    this.closeNotePanel();
    this.stickyNotes.set([]);
    this.boardError.set(null);
    this.loadingNotes.set(false);
    this.movingNoteId.set(null);
    this.updatingChecklistItemIds.set([]);
    this.updatingTitleIds.set([]);
    this.updatingDescriptionIds.set([]);
    this.tableEditingTitleId.set(null);
    this.tableTitleDraft.set('');
  }
  private clearWorkspaceMembers(): void {
    this.workspaceMemberRequestVersion += 1;
    this.workspaceMembers.set([]);
    this.loadingWorkspaceMembers.set(false);
  }
  private workspaceMemberId(member: any): string {
    const user = member.user as unknown as Record<string, unknown> | undefined;
    return String(user?.['id'] ??
      user?.['_id'] ??
      member.id ??
      '').trim();
  }
  private workspaceMemberName(member: any): string {
    const displayName = String(member.user?.displayName ?? '').trim();
    const email = String(member.user?.email ?? '').trim();
    if (displayName)
      return displayName;
    if (email)
      return email.split('@')[0] || email;
    return 'Workspace member';
  }
  private workspaceMemberRole(member: any): string {
    return String(member.role?.name ??
      member.role?.code ??
      'Member').trim();
  }
  private workspaceMemberAvatar(member: any): string | null {
    const user = member.user as unknown as Record<string, unknown> | undefined;
    const profile = user?.['profile'] as Record<string, unknown> | undefined;
    const value = user?.['avatarUrl'] ??
      user?.['profileImage'] ??
      user?.['imageUrl'] ??
      profile?.['avatarUrl'] ??
      profile?.['profileImage'];
    return typeof value === 'string' && value.trim()
      ? value.trim()
      : null;
  }
  private columnIndex(columnId: string): number {
    return this.stickyNoteColumns().findIndex(column => column.id === columnId);
  }
  private mapColumn(column: any): any {
    const color = String(column.color || 'YELLOW').toUpperCase();
    return {
      ...column,
      id: column.id ?? column._id,
      label: column.name || 'Untitled column',
      type: column.type || 'CUSTOM',
      color,
      position: column.position ?? 0,
      accent: this.columnAccent(color),
      checkboxVariant: this.noteVariant(color)
    };
  }
  private mapNote(note: any): any {
    const title = String(note?.title || '').trim() || 'Untitled note';
    const content = String(note?.content || '').trim();
    const checklists = this.mapChecklists(
      Array.isArray(note?.checklists)
        ? note.checklists
        : note?.checklist
          ? [note.checklist]
          : []
    );
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
      id: note?.id ?? note?._id,
      columnId: this.referenceId(note?.columnId),
      folderId: this.referenceId(note?.workspaceFolderId),
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
  private mapChecklists(checklists: any[]): any[] {
    return [...checklists]
      .filter(checklist => checklist?.status !== 'DELETED')
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(checklist => {
        const items = Array.isArray(checklist.items)
          ? [...checklist.items]
            .filter(item => item?.status !== 'DELETED')
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map(item => ({
              ...item,
              id: item.id ?? item._id,
              title: String(item.title || '').trim(),
              isCompleted: item.isCompleted === true
            }))
          : [];
        return {
          ...checklist,
          id: checklist.id ?? checklist._id,
          title: String(checklist.title || '').trim() || 'Checklist',
          items,
          totalCount: items.length,
          completedCount: items.filter(item => item.isCompleted).length
        };
      });
  }
  private setChecklistItemCompletion(noteId: string, itemId: string, isCompleted: boolean): void {
    this.stickyNotes.update(notes => notes.map(note => {
      if (note.id !== noteId || !note.checklists?.length)
        return note;
      const checklists = note.checklists.map((checklist: any) => {
        const items = (checklist.items ?? []).map((item: any) => item.id === itemId ? { ...item, isCompleted } : item);
        return {
          ...checklist,
          items,
          totalCount: items.length,
          completedCount: items.filter((item: any) => item.isCompleted).length
        };
      });
      const totalCount = checklists.reduce((total: number, checklist: any) => total + checklist.totalCount, 0);
      const completedCount = checklists.reduce((total: number, checklist: any) => total + checklist.completedCount, 0);
      return {
        ...note,
        checklists,
        checklistCount: checklists.length,
        checklistItemCount: totalCount,
        completedChecklistItemCount: completedCount,
        progress: totalCount
          ? Math.round((completedCount / totalCount) * 100)
          : undefined
      };
    }));
  }
  private setNoteTitleUpdating(noteId: string, updating: boolean): void {
    this.updatingTitleIds.update(ids => {
      if (updating) {
        return ids.includes(noteId)
          ? ids
          : [...ids, noteId];
      }
      return ids.filter(id => id !== noteId);
    });
  }
  private setNoteDescriptionUpdating(noteId: string, updating: boolean): void {
    this.updatingDescriptionIds.update(ids => {
      if (updating) {
        return ids.includes(noteId)
          ? ids
          : [...ids, noteId];
      }
      return ids.filter(id => id !== noteId);
    });
  }
  private setChecklistItemUpdating(itemId: string, updating: boolean): void {
    this.updatingChecklistItemIds.update(ids => {
      if (updating)
        return ids.includes(itemId) ? ids : [...ids, itemId];
      return ids.filter(id => id !== itemId);
    });
  }
  private referenceId(value: any): string {
    if (!value)
      return '';
    return typeof value === 'string' ? value : value.id ?? value._id ?? '';
  }
  private noteVariant(color: string): any {
    const variants: Record<string, string> = {
      YELLOW: 'noteYellow',
      BLUE: 'noteBlue',
      GREEN: 'noteGreen',
      PINK: 'notePink',
      PURPLE: 'notePurple',
      ORANGE: 'noteOrange',
      RED: 'noteRed',
      BROWN: 'noteBrown',
      BLACK: 'noteBlack'
    };
    return variants[String(color || 'YELLOW').toUpperCase()] ?? 'noteYellow';
  }
  private columnAccent(color: string): string {
    const accents: Record<string, string> = {
      YELLOW: 'var(--note-yellow, #eab308)',
      BLUE: 'var(--note-blue, #3b82f6)',
      GREEN: 'var(--note-green, #22c55e)',
      PINK: 'var(--note-pink, #ec4899)',
      PURPLE: 'var(--note-purple, #a855f7)',
      ORANGE: 'var(--note-orange, #f97316)',
      RED: 'var(--note-red, #ef4444)',
      BROWN: 'var(--note-brown, #92400e)',
      BLACK: 'var(--note-black, #171717)'
    };
    return accents[String(color || 'YELLOW').toUpperCase()] ?? accents['YELLOW'];
  }
  private buildParams(filters: Record<string, unknown>): Record<string, string> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined)
        params[key] = String(value);
    });
    return params;
  }
  private isStickyNoteFont(value: any): boolean {
    const normalized = String(value ?? '').trim();
    return this.stickyNoteFontOptions.some(option => option.value === normalized);
  }
  private readStoredStickyNoteFont(): any {
    try {
      const value = localStorage.getItem(this.stickyNoteFontStorageKey);
      return this.isStickyNoteFont(value) ? value : 'dmSans';
    }
    catch {
      return 'dmSans';
    }
  }
  private errorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.message || fallback;
  }
}
