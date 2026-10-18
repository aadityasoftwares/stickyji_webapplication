import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideBell,
  LucideCheck,
  LucideFolderOpen,
  LucideLink,
  LucideListChecks,
  LucidePanelsTopLeft,
  LucidePaperclip,
  LucidePencil,
  LucidePlus,
  LucideStar,
  LucideStarOff,
  LucideStickyNote,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { MatMenuModule } from '@angular/material/menu';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Badge, type BadgeVariant } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { DatepickerInput } from '../../../shared/components/datepicker-input/datepicker-input';
import { Input as AppInput } from '../../../shared/components/input/input';
import { Label } from '../../../shared/components/label/label';
import { Loader } from '../../../shared/components/loader/loader';
import { Select, SelectOption, SelectValue } from '../../../shared/components/select/select';
import { SidePanel, SidePanelTone } from '../../../shared/components/side-panel/side-panel';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { COMMON_MESSAGES } from '../../../shared/constants/common.messages';

import {
  NOTE_BLOCK_OPTIONS,
  type NoteBlockOption,
  type NoteBlockType,
  NOTE_LIMITS,
  STICKY_NOTE_BACKGROUND_PATTERN_OPTIONS,
  STICKY_NOTE_COLOR_OPTIONS,
  STICKY_NOTE_SHAPE_OPTIONS,
  STICKY_NOTE_VARIANT_OPTIONS,
} from '../../../shared/constants/common.constants';
import { toDateKey, todayDateKey } from '../../../shared/functions/date.function';
import {
  extractErrorMessage,
  extractList,
  idOf,
  sortItemsByPosition,
} from '../../../shared/functions/common.function';
import {
  createChecklistFormGroup,
  createChecklistItemFormGroup,
  formatLivePreviewChecklists,
  getNoteColorBadgeVariant,
  getNotePanelTone,
  resolveDefaultColumnId,
  resolveDefaultFolderId,
  validateNoteForm,
} from '../../../shared/functions/sticky-note.function';

import { StickyNote } from '../sticky-note/sticky-note';
import { StickyNoteApiService } from '../services/sticky-notes.service';
import { StickyNoteChecklistApiService } from '../services/sticky-note-checklist.service';
import { StickyNoteChecklistItemApiService } from '../services/sticky-note-checklist-item.service';
import { StickyNoteColumnApiService } from '../services/sticky-note-column.service';
import { StickyNoteColumnStore } from '../services/sticky-note-column.store';
import { StickyNotesFavouriteService } from '../../sticky-notes-favourites/services/sticky-notes-favourite.service';
import { StickyNoteAssigneeApiService } from '../services/sticky-note-assignee.service';
import {
  StickyNoteAssigneeSelect,
  type AssigneePreviewItem,
} from '../sticky-note-assignee-select/sticky-note-assignee-select';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { WorkspaceFolderService } from '../../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../../workspacefolders/services/workspace-folder.store';
import {
  FocusNavigationDirective,
  focusAtEnd,
} from '../../../shared/directives/focus-navigation.directive';

@Component({
  selector: 'app-add-edit-note-side-panel',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Checkbox,
    DatepickerInput,
    FocusNavigationDirective,
    Label,
    Loader,
    MatMenuModule,
    Select,
    SidePanel,
    StickyNote,
    StickyNoteAssigneeSelect,
  ],
  templateUrl: './add-edit-note-side-panel.html',
  styleUrl: './add-edit-note-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditNoteSidePanel implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);

  private readonly stickyNoteApi = inject(StickyNoteApiService);
  private readonly columnApi = inject(StickyNoteColumnApiService);
  private readonly columnStore = inject(StickyNoteColumnStore);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderApi = inject(WorkspaceFolderService);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly checklistApi = inject(StickyNoteChecklistApiService);
  private readonly checklistItemApi = inject(StickyNoteChecklistItemApiService);
  private readonly assigneeApi = inject(StickyNoteAssigneeApiService);
  readonly favoriteService = inject(StickyNotesFavouriteService);

  @Input() open = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() id = '';

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();

  @ViewChild('noteTitleInput', { read: ElementRef })
  private noteTitleInput?: ElementRef<HTMLElement>;

  readonly LucideBell = LucideBell;
  readonly LucideCheck = LucideCheck;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideLink = LucideLink;
  readonly LucideListChecks = LucideListChecks;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePaperclip = LucidePaperclip;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideStar = LucideStar;
  readonly LucideStarOff = LucideStarOff;
  readonly LucideStickyNote = LucideStickyNote;
  readonly LucideTrash2 = LucideTrash2;
  readonly LucideX = LucideX;

  readonly noteBlockOptions = NOTE_BLOCK_OPTIONS;
  readonly selectedBlocks = signal<NoteBlockType[]>([]);
  readonly isBlockSelected = (type: NoteBlockType): boolean => this.selectedBlocks().includes(type);
  readonly availableBlocks = computed(() => {
    const selected = new Set(this.selectedBlocks());
    return this.noteBlockOptions.filter((item) => !selected.has(item.type));
  });

  readonly titleMaxLength = NOTE_LIMITS.TITLE_MAX_LENGTH;
  readonly contentMaxLength = NOTE_LIMITS.CONTENT_MAX_LENGTH;
  readonly checklistTitleMaxLength = NOTE_LIMITS.CHECKLIST_TITLE_MAX_LENGTH;
  readonly checklistItemTitleMaxLength = NOTE_LIMITS.CHECKLIST_ITEM_TITLE_MAX_LENGTH;

  readonly colorOptions: readonly SelectOption[] = STICKY_NOTE_COLOR_OPTIONS;
  readonly shapeOptions: readonly SelectOption[] = STICKY_NOTE_SHAPE_OPTIONS;
  readonly variantOptions: readonly SelectOption[] = STICKY_NOTE_VARIANT_OPTIONS;
  readonly backgroundPatternOptions: readonly SelectOption[] =
    STICKY_NOTE_BACKGROUND_PATTERN_OPTIONS;

  readonly loading = signal(false);
  readonly loadingData = signal(false);
  readonly loadingChecklist = signal(false);
  readonly loadingWorkspaces = signal(false);
  readonly loadingFolders = signal(false);
  readonly loadingColumns = signal(false);
  readonly error = signal('');
  readonly saveState = signal<string>('idle');
  readonly isFavorite = signal(false);
  readonly favoriteId = signal<string | null>(null);
  readonly togglingFavorite = signal(false);

  readonly panelWorkspaces = signal<any[]>([]);
  readonly panelFolders = signal<any[]>([]);
  readonly panelColumns = signal<any[]>([]);

  readonly selectedAssigneeIds = signal<string[]>([]);
  readonly originalAssigneeIds = signal<string[]>([]);
  readonly selectedAssignees = signal<AssigneePreviewItem[]>([]);

  private savedNoteId = '';
  private savedNoteKey = '';
  private livePreviewCacheKey = '';
  private livePreviewCache: any = null;
  private readonly originalChecklistIds = new Set<string>();
  private readonly originalItemIdsByChecklist = new Map<string, Set<string>>();

  readonly workspaceOptions = computed<SelectOption[]>(() =>
    this.panelWorkspaces()
      .filter((item) => item?.status !== 'DELETED')
      .map((item) => ({ label: item.name || 'Untitled workspace', value: idOf(item) }))
      .filter((item) => Boolean(item.value)),
  );

  readonly folderOptions = computed<SelectOption[]>(() =>
    this.panelFolders()
      .filter((item) => item?.status === 'ACTIVE')
      .map((item) => ({ label: item.name || 'Untitled folder', value: idOf(item) }))
      .filter((item) => Boolean(item.value)),
  );

  readonly columnOptions = computed<SelectOption[]>(() =>
    this.panelColumns()
      .map((item) => ({ label: item.name || item.title || 'Untitled column', value: idOf(item) }))
      .filter((item) => Boolean(item.value)),
  );

  readonly form = this.fb.group({
    workspaceId: ['', Validators.required],
    workspaceFolderId: ['', Validators.required],
    columnId: ['', Validators.required],
    title: ['', Validators.maxLength(this.titleMaxLength)],
    content: ['', [Validators.required, Validators.maxLength(this.contentMaxLength)]],
    noteDate: [null as string | null],
    color: ['YELLOW', Validators.required],
    shape: ['SQUARE', Validators.required],
    variant: ['PLAIN', Validators.required],
    backgroundPattern: ['NONE', Validators.required],
    withChecklist: [false],
    checklists: this.fb.array([]),
  });

  get checklists(): FormArray {
    return this.form.controls.checklists;
  }

  get withChecklist(): boolean {
    return this.form.controls.withChecklist.value === true;
  }

  get isBusy(): boolean {
    return (
      this.loading() ||
      this.loadingData() ||
      this.loadingChecklist() ||
      this.loadingWorkspaces() ||
      this.loadingFolders() ||
      this.loadingColumns()
    );
  }

  get panelTitle(): string {
    return this.mode === 'create' ? 'Create note' : 'Edit note';
  }

  get eyebrow(): string {
    return this.mode === 'create' ? 'A fresh sticky thought' : 'Tidy up this note';
  }

  get description(): string {
    return this.mode === 'create'
      ? 'Capture it now and organise it where it belongs.'
      : 'Update the note without leaving your current view.';
  }

  get headerIcon() {
    return this.mode === 'create' ? LucideStickyNote : LucidePencil;
  }

  get panelTone(): SidePanelTone {
    return getNotePanelTone(this.previewColor);
  }

  get previewColor(): string {
    return this.controlString('color').toLowerCase();
  }

  get previewShape(): string {
    return this.controlString('shape').toLowerCase();
  }

  get previewVariant(): string {
    return this.controlString('variant').toLowerCase();
  }

  get previewPattern(): string {
    return this.controlString('backgroundPattern').toLowerCase();
  }

  get previewDate(): string {
    return toDateKey(this.form.controls.noteDate.value) || '';
  }

  get previewColumnLabel(): string {
    return (
      this.columnOptions().find((option) => option.value === this.controlString('columnId'))
        ?.label ?? ''
    );
  }

  get previewColumnBadgeVariant(): BadgeVariant {
    const column = this.panelColumns().find(
      (item) => idOf(item) === this.controlString('columnId'),
    );
    return getNoteColorBadgeVariant(column?.color);
  }

  readonly saveIndicatorLabel = computed(() => {
    switch (this.saveState()) {
      case 'editing':
        return 'Unsaved changes';
      case 'saving':
        return 'Saving…';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return 'New note';
    }
  });

  get livePreviewData() {
    const isChecklistActive = this.selectedBlocks().includes('CHECKLIST');
    const checklists = isChecklistActive
      ? formatLivePreviewChecklists(this.checklists.controls as FormGroup[])
      : [];
    const previewDate = this.previewDate;
    const columnLabel = this.previewColumnLabel;
    const columnBadgeVariant = this.previewColumnBadgeVariant;
    const title = this.controlString('title');
    const content = this.controlString('content');
    const color = this.controlString('color');
    const shape = this.controlString('shape');
    const variant = this.controlString('variant');
    const backgroundPattern = this.controlString('backgroundPattern');
    const favoriteId = this.favoriteId() || undefined;
    const isFavorite = this.isFavorite();
    const assignees = this.selectedAssignees().map((item) => ({
      id: item.id,
      name: item.displayName || item.name,
      displayName: item.displayName,
      email: item.email,
      initials: item.initials,
    }));
    const cacheKey = JSON.stringify({
      noteKey: this.savedNoteKey,
      columnLabel,
      columnBadgeVariant,
      title,
      content,
      color,
      shape,
      variant,
      backgroundPattern,
      noteDate: previewDate,
      checklists,
      assignees,
      isFavorite,
      favoriteId,
    });

    if (cacheKey === this.livePreviewCacheKey && this.livePreviewCache) {
      return this.livePreviewCache;
    }

    this.livePreviewCacheKey = cacheKey;
    this.livePreviewCache = {
      id: 'editor-live-preview',
      noteKey: this.savedNoteKey,
      columnLabel,
      columnBadgeVariant,
      title,
      content,
      color,
      shape,
      variant,
      backgroundPattern,
      noteDate: previewDate,
      checklists,
      assignees,
      layout: 'detail',
      isFavorite,
      favoriteId,
      showDragHandle: false,
      showMoveActions: false,
      inlineEditing: false,
    };
    return this.livePreviewCache;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.open && (changes['open']?.currentValue === true || changes['id'] || changes['mode'])) {
      this.initialize();
    }
  }

  updateText(controlName: 'title' | 'content', value: unknown): void {
    if (this.isBusy) return;
    this.error.set('');
    this.form.controls[controlName].setValue(String(value ?? ''));
    this.saveState.set('editing');
    this.cdr.markForCheck();
  }

  updateSelect(controlName: string, value: unknown): void {
    if (this.isBusy || typeof value !== 'string') return;
    this.error.set('');

    switch (controlName) {
      case 'color':
        this.form.controls.color.setValue(value);
        break;
      case 'shape':
        this.form.controls.shape.setValue(value);
        break;
      case 'variant':
        this.form.controls.variant.setValue(value);
        break;
      case 'backgroundPattern':
        this.form.controls.backgroundPattern.setValue(value);
        break;
      default:
        this.form.controls.columnId.setValue(value);
    }

    this.saveState.set('editing');
    this.cdr.markForCheck();
  }

  updateWorkspace(value: SelectValue): void {
    if (this.isBusy) return;
    const workspaceId = value ? String(value) : '';
    if (workspaceId === this.form.controls.workspaceId.value) return;

    this.error.set('');
    this.form.controls.workspaceId.setValue(workspaceId);
    this.form.controls.workspaceFolderId.setValue('');
    this.form.controls.columnId.setValue('');
    this.panelFolders.set([]);
    this.panelColumns.set([]);
    this.selectedAssigneeIds.set([]);
    this.selectedAssignees.set([]);
    this.saveState.set('editing');

    if (workspaceId) {
      this.loadFolders(workspaceId);
    }
  }

  updateFolder(value: SelectValue): void {
    if (this.isBusy) return;
    const folderId = value ? String(value) : '';
    if (folderId === this.form.controls.workspaceFolderId.value) return;

    this.error.set('');
    this.form.controls.workspaceFolderId.setValue(folderId);
    this.form.controls.columnId.setValue('');
    this.panelColumns.set([]);
    this.saveState.set('editing');

    const workspaceId = this.form.controls.workspaceId.value;
    if (workspaceId && folderId) {
      this.loadColumns(workspaceId, folderId);
    }
  }

  updateNoteDate(value: string | null): void {
    this.form.controls.noteDate.setValue(value ? toDateKey(value) : null);
    this.saveState.set('editing');
  }

  onAssigneeIdsChange(ids: string[]): void {
    if (this.isBusy) return;
    this.selectedAssigneeIds.set(ids);

    const origSet = new Set(this.originalAssigneeIds());
    const isDirty = ids.length !== origSet.size || ids.some((id) => !origSet.has(id));
    if (isDirty) {
      this.saveState.set('editing');
    }
    this.cdr.markForCheck();
  }

  onAssigneeObjectsChange(items: AssigneePreviewItem[]): void {
    this.selectedAssignees.set(items);
    this.cdr.markForCheck();
  }

  onTitleEnter(event: KeyboardEvent): void {
    event.preventDefault();
    const contentInput = document.querySelector<HTMLTextAreaElement>(
      '#note-content, textarea[name="note-content"]',
    );
    if (contentInput) {
      focusAtEnd(contentInput);
    } else {
      (event.target as HTMLElement | null)?.blur();
    }
  }

  close(): void {
    if (this.isBusy) return;
    this.closed.emit();
  }

  addBlock(type: NoteBlockType): void {
    if (this.isBusy) return;
    if (!this.selectedBlocks().includes(type)) {
      this.selectedBlocks.update((blocks) => [...blocks, type]);
      if (type === 'CHECKLIST') {
        this.form.controls.withChecklist.setValue(true);
        if (this.checklists.length === 0) {
          this.checklists.push(this.createChecklistGroup());
        }
      }
      this.saveState.set('editing');
      this.cdr.markForCheck();
      this.scrollAndFocusNewBlock(type);
    }
  }

  removeBlock(type: NoteBlockType): void {
    if (this.isBusy) return;
    this.selectedBlocks.update((blocks) => blocks.filter((b) => b !== type));
    if (type === 'CHECKLIST') {
      this.form.controls.withChecklist.setValue(false);
      this.checklists.clear();
    }
    this.saveState.set('editing');
    this.cdr.markForCheck();
  }

  addChecklist(): void {
    if (this.isBusy) return;
    if (!this.selectedBlocks().includes('CHECKLIST')) {
      this.selectedBlocks.update((blocks) => [...blocks, 'CHECKLIST']);
    }
    this.form.controls.withChecklist.setValue(true);
    this.checklists.push(this.createChecklistGroup());
    const newIndex = this.checklists.length - 1;
    this.saveState.set('editing');
    this.cdr.markForCheck();

    setTimeout(() => {
      this.scrollPanelToBottom();
      const groups = document.querySelectorAll('.checklist-group');
      const targetGroup = groups[newIndex] || groups[groups.length - 1];
      if (targetGroup) {
        targetGroup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        this.focusFirstInput(targetGroup);
      }
    }, 60);
  }

  removeChecklist(index: number): void {
    if (this.isBusy || index < 0 || index >= this.checklists.length) return;
    this.checklists.removeAt(index);
    this.form.controls.withChecklist.setValue(this.checklists.length > 0);
    this.saveState.set('editing');
  }

  updateChecklistTitle(index: number, value: unknown): void {
    if (this.isBusy) return;
    const group = this.checklistGroup(index);
    if (!group) return;
    this.error.set('');
    group.get('title')?.setValue(String(value ?? ''));
    this.saveState.set('editing');
  }

  onChecklistTitleEnter(event: KeyboardEvent, index: number): void {
    event.preventDefault();
    const group = (event.target as HTMLElement)?.closest('.checklist-group');
    const firstTaskInput = group?.querySelector(
      '.checklist-items input:not([disabled])',
    ) as HTMLInputElement | null;
    if (firstTaskInput) {
      focusAtEnd(firstTaskInput);
    } else {
      this.addChecklistItem(index);
    }
  }

  onChecklistNoNextFocus(
    event: { current: HTMLElement; key: string },
    checklistIndex: number,
  ): void {
    if (event.key === 'Enter') {
      this.addChecklistItem(checklistIndex);
    }
  }

  addChecklistItem(index: number): void {
    if (this.isBusy) return;
    this.checklistItems(index)?.push(this.createChecklistItemGroup());
    this.saveState.set('editing');
    this.cdr.markForCheck();

    setTimeout(() => {
      this.scrollPanelToBottom();
      const groups = document.querySelectorAll('.checklist-group');
      const targetGroup = groups[index] || groups[groups.length - 1];
      const items = targetGroup?.querySelectorAll('.checklist-item');
      const lastItem = items && items.length > 0 ? items[items.length - 1] : null;
      if (lastItem) {
        lastItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        this.focusFirstInput(lastItem);
      }
    }, 60);
  }

  removeChecklistItem(index: number, itemIndex: number): void {
    if (this.isBusy) return;
    const items = this.checklistItems(index);
    if (!items || itemIndex < 0 || itemIndex >= items.length) return;
    items.removeAt(itemIndex);
    if (!items.length) items.push(this.createChecklistItemGroup());
    this.saveState.set('editing');
  }

  updateChecklistItemTitle(index: number, itemIndex: number, value: unknown): void {
    if (this.isBusy) return;
    const item = this.checklistItemGroup(index, itemIndex);
    if (!item) return;
    this.error.set('');
    item.get('title')?.setValue(String(value ?? ''));
    this.saveState.set('editing');
  }

  toggleChecklistItem(index: number, itemIndex: number): void {
    if (this.isBusy) return;
    const item = this.checklistItemGroup(index, itemIndex);
    if (!item) return;
    item.get('isCompleted')?.setValue(item.get('isCompleted')?.value !== true);
    this.saveState.set('editing');
  }

  setChecklistItemCompleted(index: number, itemIndex: number, checked: boolean): void {
    if (this.isBusy) return;
    const item = this.checklistItemGroup(index, itemIndex);
    if (!item || item.get('isCompleted')?.value === checked) return;
    item.get('isCompleted')?.setValue(checked);
    this.saveState.set('editing');
  }

  onChecklistItemEnter(event: KeyboardEvent, index: number): void {
    event.preventDefault();
    this.addChecklistItem(index);
  }

  private scrollPanelToBottom(): void {
    const panelBody = document.querySelector('.app-side-panel-body');
    if (panelBody) {
      panelBody.scrollTo({
        top: panelBody.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  private focusFirstInput(container: Element | null): void {
    if (!container) return;
    const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input:not([disabled]):not([type="checkbox"]):not([type="radio"]), textarea:not([disabled])',
    );
    if (input) {
      focusAtEnd(input);
    }
  }

  private scrollAndFocusNewBlock(type: NoteBlockType): void {
    setTimeout(() => {
      this.scrollPanelToBottom();
      const blockCard = document.querySelector(`.note-block-card[data-block-type="${type}"]`);
      if (blockCard) {
        blockCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        this.focusFirstInput(blockCard);
      }
    }, 60);
  }

  checklistTitle(index: number): string {
    return String(this.checklistGroup(index)?.get('title')?.value ?? '');
  }

  checklistItems(index: number): FormArray | null {
    return (this.checklistGroup(index)?.get('items') as FormArray) ?? null;
  }

  checklistItemTitle(index: number, itemIndex: number): string {
    return String(this.checklistItemGroup(index, itemIndex)?.get('title')?.value ?? '');
  }

  checklistItemCompleted(index: number, itemIndex: number): boolean {
    return this.checklistItemGroup(index, itemIndex)?.get('isCompleted')?.value === true;
  }

  private checklistGroup(index: number): FormGroup | null {
    return (this.checklists.at(index) as FormGroup) ?? null;
  }

  private checklistItemGroup(index: number, itemIndex: number): FormGroup | null {
    return (this.checklistItems(index)?.at(itemIndex) as FormGroup) ?? null;
  }

  submit(): void {
    if (!this.open || this.isBusy) return;

    const validationError = this.validateBeforeSave();
    if (validationError || this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifyError(
        validationError || 'Check the date, field lengths and required selections.',
        'Check note details',
      );
      return;
    }

    const payload: any = {
      workspaceId: this.controlString('workspaceId'),
      workspaceFolderId: this.controlString('workspaceFolderId'),
      columnId: this.controlString('columnId').trim(),
      title: this.controlString('title').trim(),
      content: this.controlString('content').trim(),
      noteDate: toDateKey(this.form.controls.noteDate.value) || null,
      color: this.form.controls.color.value,
      shape: this.form.controls.shape.value,
      variant: this.form.controls.variant.value,
      backgroundPattern: this.form.controls.backgroundPattern.value,
      assigneeIds: this.selectedAssigneeIds(),
    };

    this.loading.set(true);
    this.saveState.set('saving');

    const save$ =
      this.mode === 'create' && !this.savedNoteId
        ? this.stickyNoteApi.create(payload)
        : this.stickyNoteApi.update(this.savedNoteId || this.id, payload);

    save$
      .pipe(
        tap((response) => {
          const noteId = idOf(response.data);
          if (!noteId) throw new Error('Note ID was not returned by the server.');
          this.savedNoteId = noteId;
        }),
        switchMap((response) =>
          forkJoin({
            checklists: this.syncChecklists(this.savedNoteId),
            assignees: this.assigneeApi
              .sync(this.savedNoteId, { assigneeIds: this.selectedAssigneeIds() })
              .pipe(catchError(() => of(null))),
          }).pipe(map(() => response.data)),
        ),
        switchMap((noteData) => {
          if (this.mode === 'create' && this.isFavorite() && this.savedNoteId) {
            return this.favoriteService.addFavorite(this.savedNoteId).pipe(
              tap((favRes) => {
                const favId = idOf(favRes?.data) || idOf(favRes);
                this.favoriteId.set(favId);
                this.favoriteService.setFavoriteLocal(this.savedNoteId, true, favId);
              }),
              catchError(() => of(null)),
              map(() => noteData),
            );
          }
          return of(noteData);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.error.set('');
          this.saveState.set('saved');
          this.originalAssigneeIds.set([...this.selectedAssigneeIds()]);
          this.form.markAsPristine();
          this.toastService.success(
            this.mode === 'create' ? 'Your sticky note is ready.' : 'Your note changes were saved.',
            {
              title: this.mode === 'create' ? 'Note created' : 'Note updated',
              dedupeKey: `note-saved-${this.savedNoteId}`,
            },
          );
          this.saved.emit(this.savedNoteId);
        },
        error: (error) => {
          this.saveState.set('error');
          this.notifyError(
            extractErrorMessage(error, 'Unable to save the note changes.'),
            'Save failed',
          );
        },
      });
  }

  private syncChecklists(noteId: string): Observable<any> {
    const isChecklistActive = this.selectedBlocks().includes('CHECKLIST');
    const formChecklists = this.checklists.controls as FormGroup[];

    if (!isChecklistActive || !this.withChecklist || formChecklists.length === 0) {
      if (this.originalChecklistIds.size === 0) return of(null);
      const deleteTasks = [...this.originalChecklistIds].map((id) => this.checklistApi.delete(id));
      return forkJoin(deleteTasks);
    }

    const currentListIds = new Set(formChecklists.map((g) => g.get('id')?.value).filter(Boolean));
    const deleteListTasks = [...this.originalChecklistIds]
      .filter((id) => !currentListIds.has(id))
      .map((id) => this.checklistApi.delete(id));

    const saveListTasks = formChecklists.map((group, position) => {
      const listId = group.get('id')?.value;
      const title = (group.get('title')?.value || '').trim();

      const saveList$ = listId
        ? this.checklistApi.update(listId, { title, position }).pipe(map(() => listId))
        : this.checklistApi.create({ stickyNoteId: noteId, title, position }).pipe(
            map((res) => idOf(res.data)),
            tap((newId) => group.get('id')?.setValue(newId)),
          );

      return saveList$.pipe(
        switchMap((targetListId) =>
          this.syncChecklistItems(targetListId, group.get('items') as FormArray),
        ),
      );
    });

    const allTasks = [...deleteListTasks, ...saveListTasks];
    return allTasks.length > 0 ? forkJoin(allTasks) : of(null);
  }

  private syncChecklistItems(checklistId: string, itemsArray: FormArray): Observable<any> {
    const itemGroups = itemsArray.controls as FormGroup[];
    const currentItemIds = new Set(itemGroups.map((g) => g.get('id')?.value).filter(Boolean));
    const originalItemIds = this.originalItemIdsByChecklist.get(checklistId) || new Set<string>();

    const deleteItemTasks = [...originalItemIds]
      .filter((id) => !currentItemIds.has(id))
      .map((id) => this.checklistItemApi.delete(id));

    const saveItemTasks = itemGroups.map((itemGroup, position) => {
      const itemId = itemGroup.get('id')?.value;
      const title = (itemGroup.get('title')?.value || '').trim();
      const isCompleted = itemGroup.get('isCompleted')?.value === true;
      const initialCompleted = itemGroup.get('initialCompleted')?.value === true;

      if (itemId) {
        const update$ = this.checklistItemApi.update(itemId, { title, position });
        if (isCompleted !== initialCompleted) {
          return update$.pipe(
            switchMap(() => this.checklistItemApi.updateCompletion(itemId, isCompleted)),
            tap(() => itemGroup.get('initialCompleted')?.setValue(isCompleted)),
          );
        }
        return update$;
      } else {
        return this.checklistItemApi.create({ checklistId, title, position }).pipe(
          switchMap((res) => {
            const newItemId = idOf(res.data);
            itemGroup.get('id')?.setValue(newItemId);
            if (isCompleted) {
              return this.checklistItemApi
                .updateCompletion(newItemId, true)
                .pipe(tap(() => itemGroup.get('initialCompleted')?.setValue(true)));
            }
            return of(res);
          }),
        );
      }
    });

    const allTasks = [...deleteItemTasks, ...saveItemTasks];
    return allTasks.length > 0 ? forkJoin(allTasks) : of(null);
  }

  private initialize(): void {
    this.resetEditor();
    const id = String(this.id ?? '').trim();

    if (!id) {
      this.notifyError(
        this.mode === 'create'
          ? 'A column id is required to create a note.'
          : 'A note id is required to edit a note.',
        'Could not open note editor',
      );
      return;
    }

    this.loadingData.set(true);
    this.loadWorkspaces();

    if (this.mode === 'create') {
      this.loadCreateContext(id);
    } else {
      this.loadNote(id);
    }
  }

  private loadCreateContext(columnId: string): void {
    const column = this.columnStore.findById(columnId);
    const workspaceId = this.columnStore.workspaceId() || idOf(column?.workspaceId);
    const folderId = this.columnStore.workspaceFolderId() || idOf(column?.workspaceFolderId);

    if (column && workspaceId && folderId) {
      this.setupCreateForm(workspaceId, folderId, columnId, column.color);
      this.loadingData.set(false);
      this.focusTitle();
      return;
    }

    this.columnApi
      .getById(columnId)
      .pipe(
        finalize(() => this.loadingData.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          const col = response.data;
          const resolvedWorkspaceId = idOf(col?.workspaceId);
          const resolvedFolderId = idOf(col?.workspaceFolderId);
          this.setupCreateForm(resolvedWorkspaceId, resolvedFolderId, columnId, col?.color);
          this.focusTitle();
        },
        error: (error) => this.handleLoadError(error, 'Unable to load column details.'),
      });
  }

  private setupCreateForm(
    workspaceId: string,
    folderId: string,
    columnId: string,
    color?: string,
  ): void {
    this.form.patchValue({
      workspaceId,
      workspaceFolderId: folderId,
      columnId,
      color: color || 'YELLOW',
      noteDate: todayDateKey(),
    });

    if (workspaceId) {
      this.loadFolders(workspaceId, folderId);
    }
  }

  private loadNote(noteId: string): void {
    this.stickyNoteApi
      .getById(noteId)
      .pipe(
        finalize(() => this.loadingData.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          const note: any = response.data;
          this.savedNoteId = idOf(note) || noteId;
          this.savedNoteKey =
            note?.noteKey ||
            (typeof note?.stickyNoteNumber === 'number'
              ? `ST-${String(note.stickyNoteNumber).padStart(6, '0')}`
              : '');

          const workspaceId = idOf(note?.workspaceId);
          const folderId = idOf(note?.workspaceFolderId);
          const columnId = idOf(note?.columnId);

          this.form.patchValue({
            workspaceId,
            workspaceFolderId: folderId,
            columnId,
            title: String(note?.title ?? ''),
            content: String(note?.content ?? '').trim(),
            noteDate: toDateKey(note?.noteDate) || null,
            color: note?.color || 'YELLOW',
            shape: note?.shape || 'SQUARE',
            variant: note?.variant || 'PLAIN',
            backgroundPattern: note?.backgroundPattern || 'NONE',
          });

          if (
            typeof note?.workspaceId === 'object' &&
            !this.panelWorkspaces().some((w) => idOf(w) === workspaceId)
          ) {
            this.panelWorkspaces.update((items) => [...items, note.workspaceId]);
          }

          if (workspaceId) {
            this.loadFolders(workspaceId, folderId);
          }

          if (note?.reminder || (Array.isArray(note?.reminders) && note.reminders.length > 0)) {
            this.selectedBlocks.update((b) => (b.includes('REMINDER') ? b : [...b, 'REMINDER']));
          }
          if (Array.isArray(note?.attachments) && note.attachments.length > 0) {
            this.selectedBlocks.update((b) =>
              b.includes('ATTACHMENT') ? b : [...b, 'ATTACHMENT'],
            );
          }
          if (Array.isArray(note?.links) && note.links.length > 0) {
            this.selectedBlocks.update((b) => (b.includes('LINK') ? b : [...b, 'LINK']));
          }

          this.loadChecklists(note, noteId);
          this.loadAssignees(note, noteId);
          this.checkFavoriteStatus(note, noteId);
          this.focusTitle();
        },
        error: (error) => this.handleLoadError(error, 'Unable to load this note.'),
      });
  }

  private checkFavoriteStatus(note: any, noteId: string): void {
    if (this.favoriteService.isFavorite(noteId)) {
      this.isFavorite.set(true);
      this.favoriteId.set(this.favoriteService.getFavoriteId(noteId) || null);
    } else {
      this.favoriteService
        .getAll({ stickyNoteId: noteId, status: 'ACTIVE' })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            const list = extractList(res);
            if (list.length > 0) {
              const favId = idOf(list[0]);
              this.isFavorite.set(true);
              this.favoriteId.set(favId);
              this.favoriteService.setFavoriteLocal(noteId, true, favId);
            } else {
              const noteFav = Boolean(note?.isFavorite);
              this.isFavorite.set(noteFav);
              this.favoriteId.set(note?.favoriteId || null);
            }
            this.cdr.markForCheck();
          },
          error: () => {
            const noteFav = Boolean(note?.isFavorite);
            this.isFavorite.set(noteFav);
            this.favoriteId.set(note?.favoriteId || null);
            this.cdr.markForCheck();
          },
        });
    }
  }

  toggleFavorite(): void {
    if (this.isBusy || this.togglingFavorite()) return;

    const noteId = this.savedNoteId || (this.mode === 'edit' ? this.id : '');
    if (noteId) {
      this.togglingFavorite.set(true);
      const favId = this.favoriteId() || this.favoriteService.getFavoriteId(noteId);
      const title = this.controlString('title') || 'Note';

      this.favoriteService
        .toggleFavorite(noteId, favId || undefined, title)
        .pipe(
          finalize(() => this.togglingFavorite.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (res) => {
            this.isFavorite.set(res.isFavorite);
            this.favoriteId.set(res.favoriteId || null);
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.notifyError(
              extractErrorMessage(error, 'Unable to update favourite status.'),
              'Favourite not updated',
            );
            this.cdr.markForCheck();
          },
        });
    } else {
      this.isFavorite.update((v) => !v);
      this.cdr.markForCheck();
    }
  }

  private loadWorkspaces(): void {
    const stored = this.workspaceStore.workspaces();
    if (stored.length > 0) {
      this.panelWorkspaces.set(stored.filter((item) => item?.status !== 'DELETED'));
      return;
    }

    this.loadingWorkspaces.set(true);
    this.workspaceApi
      .getAll({ page: 1, limit: 100, status: 'ACTIVE' })
      .pipe(
        finalize(() => this.loadingWorkspaces.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          const list = extractList(response);
          this.panelWorkspaces.set(list.filter((item: any) => item?.status !== 'DELETED'));
        },
        error: (error) =>
          this.notifyError(extractErrorMessage(error, 'Unable to load workspaces.'), 'Error'),
      });
  }

  private loadFolders(workspaceId: string, preferredFolderId?: string): void {
    if (!workspaceId) {
      this.panelFolders.set([]);
      this.panelColumns.set([]);
      return;
    }

    if (
      this.workspaceFolderStore.initialized() &&
      this.workspaceFolderStore.workspaceId() === workspaceId
    ) {
      this.setFoldersAndSelect(
        workspaceId,
        this.workspaceFolderStore.activeFolders(),
        preferredFolderId,
      );
      return;
    }

    this.loadingFolders.set(true);
    this.workspaceFolderApi
      .getAllWorkspaceFolders({
        workspaceId,
        page: 1,
        limit: 100,
        status: 'ACTIVE',
        sortBy: 'position',
        sortOrder: 'asc',
      })
      .pipe(
        finalize(() => this.loadingFolders.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          const list = extractList(response);
          const active = list.filter((folder: any) => folder?.status === 'ACTIVE');
          this.setFoldersAndSelect(workspaceId, active, preferredFolderId);
        },
        error: (error) =>
          this.notifyError(
            extractErrorMessage(error, COMMON_MESSAGES.ERROR.LOAD_FAILED('workspace folders')),
            'Error',
          ),
      });
  }

  private setFoldersAndSelect(
    workspaceId: string,
    folders: readonly any[],
    preferredFolderId?: string,
  ): void {
    const folderList = [...folders];
    this.panelFolders.set(folderList);

    const resolvedFolderId = resolveDefaultFolderId(folderList, preferredFolderId);
    this.form.controls.workspaceFolderId.setValue(resolvedFolderId);

    if (resolvedFolderId) {
      this.loadColumns(workspaceId, resolvedFolderId, this.controlString('columnId'));
    } else {
      this.panelColumns.set([]);
      this.form.controls.columnId.setValue('');
    }
  }

  private loadColumns(workspaceId: string, folderId: string, preferredColumnId?: string): void {
    if (!workspaceId || !folderId) {
      this.panelColumns.set([]);
      return;
    }

    if (this.columnStore.initialized() && this.columnStore.contextMatches(workspaceId, folderId)) {
      this.setColumnsAndSelect(this.columnStore.orderedColumns(), preferredColumnId);
      return;
    }

    this.loadingColumns.set(true);
    this.columnApi
      .getByWorkspaceFolder(workspaceId, folderId)
      .pipe(
        finalize(() => this.loadingColumns.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          const list = extractList(response);
          this.setColumnsAndSelect(list, preferredColumnId);
        },
        error: (error) =>
          this.notifyError(extractErrorMessage(error, 'Unable to load columns.'), 'Error'),
      });
  }

  private setColumnsAndSelect(columns: readonly any[], preferredColumnId?: string): void {
    const sorted = sortItemsByPosition(columns);
    this.panelColumns.set(sorted);

    const resolvedColumnId = resolveDefaultColumnId(sorted, preferredColumnId);
    this.form.controls.columnId.setValue(resolvedColumnId);
  }

  private loadChecklists(note: any, noteId: string): void {
    if (Array.isArray(note?.checklists) && note.checklists.length > 0) {
      this.applyChecklists(note.checklists);
      return;
    }

    this.loadingChecklist.set(true);
    this.checklistApi
      .getByStickyNote(noteId, {
        page: 1,
        limit: 100,
        sortBy: 'position',
        sortOrder: 'asc',
      })
      .pipe(
        switchMap((response) => {
          const lists = extractList(response).filter((item) => item?.status !== 'DELETED');
          if (!lists.length) return of([]);

          const tasks = lists.map((checklist) =>
            this.checklistItemApi
              .getByChecklist(idOf(checklist), {
                page: 1,
                limit: 250,
                sortBy: 'position',
                sortOrder: 'asc',
              })
              .pipe(
                map((itemResponse) => ({
                  ...checklist,
                  items: extractList(itemResponse).filter((i) => i?.status !== 'DELETED'),
                })),
              ),
          );
          return forkJoin(tasks);
        }),
        finalize(() => {
          this.loadingChecklist.set(false);
          this.focusTitle();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lists) => this.applyChecklists(lists),
        error: (error) =>
          this.notifyError(extractErrorMessage(error, 'Unable to load checklists.'), 'Checklists'),
      });
  }

  private applyChecklists(checklists: any[]): void {
    this.checklists.clear();
    this.originalChecklistIds.clear();
    this.originalItemIdsByChecklist.clear();

    const sortedLists = sortItemsByPosition(
      [...checklists].filter((item) => item?.status !== 'DELETED'),
    );

    for (const checklist of sortedLists) {
      const id = idOf(checklist);
      const items = sortItemsByPosition(
        (Array.isArray(checklist.items) ? [...checklist.items] : []).filter(
          (item) => item?.status !== 'DELETED',
        ),
      );

      if (id) {
        this.originalChecklistIds.add(id);
        this.originalItemIdsByChecklist.set(
          id,
          new Set(items.map((item) => idOf(item)).filter(Boolean)),
        );
      }

      this.checklists.push(this.createChecklistGroup({ id, title: checklist.title ?? '', items }));
    }

    const hasLists = this.checklists.length > 0;
    this.form.controls.withChecklist.setValue(hasLists);
    if (hasLists) {
      this.selectedBlocks.update((blocks) =>
        blocks.includes('CHECKLIST') ? blocks : [...blocks, 'CHECKLIST'],
      );
    }
  }

  private validateBeforeSave(): string | null {
    const isChecklistActive = this.selectedBlocks().includes('CHECKLIST');
    const checklistsData = isChecklistActive
      ? this.checklists.controls.map((_, index) => ({
          title: this.checklistTitle(index),
          items: (this.checklistItems(index)?.controls ?? []).map((control) => ({
            title: control.get('title')?.value,
          })),
        }))
      : [];

    return validateNoteForm({
      workspaceId: this.controlString('workspaceId'),
      workspaceFolderId: this.controlString('workspaceFolderId'),
      columnId: this.controlString('columnId'),
      title: this.controlString('title'),
      content: this.controlString('content'),
      color: this.controlString('color'),
      shape: this.controlString('shape'),
      variant: this.controlString('variant'),
      backgroundPattern: this.controlString('backgroundPattern'),
      withChecklist: isChecklistActive && this.withChecklist,
      checklists: checklistsData,
      colorOptions: this.colorOptions,
      shapeOptions: this.shapeOptions,
      variantOptions: this.variantOptions,
      backgroundPatternOptions: this.backgroundPatternOptions,
      titleMaxLength: this.titleMaxLength,
      contentMaxLength: this.contentMaxLength,
      checklistTitleMaxLength: this.checklistTitleMaxLength,
      checklistItemTitleMaxLength: this.checklistItemTitleMaxLength,
    });
  }

  private createChecklistGroup(value: any = {}): FormGroup {
    return createChecklistFormGroup(this.fb, value, {
      checklistTitleMaxLength: this.checklistTitleMaxLength,
      checklistItemTitleMaxLength: this.checklistItemTitleMaxLength,
    });
  }

  private createChecklistItemGroup(value: any = {}): FormGroup {
    return createChecklistItemFormGroup(this.fb, value, this.checklistItemTitleMaxLength);
  }

  controlString(name: string): string {
    return String(this.form.get(name)?.value ?? '');
  }

  private resetEditor(): void {
    this.savedNoteId = '';
    this.savedNoteKey = '';
    this.livePreviewCacheKey = '';
    this.livePreviewCache = null;
    this.saveState.set(this.mode === 'edit' ? 'saved' : 'idle');
    this.isFavorite.set(false);
    this.favoriteId.set(null);
    this.togglingFavorite.set(false);
    this.selectedBlocks.set([]);
    this.selectedAssigneeIds.set([]);
    this.originalAssigneeIds.set([]);
    this.selectedAssignees.set([]);
    this.originalChecklistIds.clear();
    this.originalItemIdsByChecklist.clear();
    this.panelFolders.set([]);
    this.panelColumns.set([]);
    this.loadingWorkspaces.set(false);
    this.loadingFolders.set(false);
    this.loadingColumns.set(false);
    this.loadingData.set(false);
    this.loading.set(false);
    this.loadingChecklist.set(false);
    this.error.set('');
    this.checklists.clear();
    this.form.reset(
      {
        workspaceId: '',
        workspaceFolderId: '',
        columnId: '',
        title: '',
        content: '',
        noteDate: this.mode === 'create' ? todayDateKey() : null,
        color: 'YELLOW',
        shape: 'SQUARE',
        variant: 'PLAIN',
        backgroundPattern: 'NONE',
        withChecklist: false,
      },
      { emitEvent: false },
    );
  }

  private loadAssignees(note: any, noteId: string): void {
    if (Array.isArray(note?.assignees) && note.assignees.length > 0) {
      const userIds = note.assignees
        .map((a: any) => {
          if (typeof a.userId === 'object' && a.userId !== null) {
            return a.userId._id || a.userId.id || String(a.userId);
          }
          return a.userId ? String(a.userId) : idOf(a);
        })
        .filter(Boolean);

      this.selectedAssigneeIds.set(userIds);
      this.originalAssigneeIds.set([...userIds]);
    }

    this.assigneeApi
      .getByStickyNote(noteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const list = extractList(res) as any[];
          if (Array.isArray(list)) {
            const userIds = list
              .filter((item) => item?.status !== 'REMOVED')
              .map((item) => {
                if (typeof item.userId === 'object' && item.userId !== null) {
                  return (item.userId as any)._id || (item.userId as any).id || String(item.userId);
                }
                return String(item.userId);
              })
              .filter(Boolean);

            this.selectedAssigneeIds.set(userIds);
            this.originalAssigneeIds.set([...userIds]);
            this.cdr.markForCheck();
          }
        },
        error: () => {},
      });
  }

  private handleLoadError(error: unknown, fallback: string): void {
    this.loadingWorkspaces.set(false);
    this.loadingFolders.set(false);
    this.loadingColumns.set(false);
    this.notifyError(extractErrorMessage(error, fallback), 'Could not open note editor');
  }

  private notifyError(message: string, title: string): void {
    this.error.set(message);
    this.toastService.error(message, {
      title,
      dedupeKey: `note-editor-${this.mode}-${this.id || 'new'}-${message}`,
    });
  }

  private focusTitle(): void {
    setTimeout(() => {
      if (!this.open) return;
      const input = (this.noteTitleInput?.nativeElement?.querySelector('input:not([disabled])') ||
        document.querySelector<HTMLInputElement>(
          '#note-title input:not([disabled]), #note-title',
        )) as HTMLInputElement | null;
      if (!input) return;
      focusAtEnd(input);
    }, 100);
  }
}
