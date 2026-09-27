import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, EventEmitter,
  Input, OnChanges, Output, SimpleChanges, ViewChild, computed, inject, signal,
  AfterViewInit, EmbeddedViewRef, PLATFORM_ID, Renderer2, TemplateRef, ViewContainerRef
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideCheck, LucideCircle, LucideFolderOpen, LucideFrame, LucideLayers,
  LucidePanelsTopLeft, LucidePencil, LucidePlus, LucideScissors, LucideSquare,
  LucideStickyNote, LucideTicket, LucideTrash2
} from '@lucide/angular';
import {
  Observable, Subject, catchError, concatMap, defaultIfEmpty, defer, filter,
  finalize, forkJoin, from, map, mergeMap, of, switchMap, take, takeUntil,
  tap, throwError, toArray
} from 'rxjs';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Badge } from '../../../shared/components/badge/badge';
import { Divider } from '../../../shared/components/divider/divider';
import { Button } from '../../../shared/components/button/button';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput } from '../../../shared/components/input/input';
import { DatepickerInput } from '../../../shared/components/datepicker-input/datepicker-input';
import { Label } from '../../../shared/components/label/label';
import { Loader } from '../../../shared/components/loader/loader';
import { Select, SelectOption, SelectValue } from '../../../shared/components/select/select';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { StickyNoteChecklistItemApiService } from '../services/sticky-note-checklist-item.service';
import { StickyNoteChecklistApiService } from '../services/sticky-note-checklist.service';
import { StickyNoteColumnApiService } from '../services/sticky-note-column.service';
import { StickyNoteColumnStore } from '../services/sticky-note-column.store';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { WorkspaceFolderApiService } from '../../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../../workspacefolders/services/workspace-folder.store';
import { StickyNoteApiService } from '../services/sticky-notes.service';
import { toDateKey, todayDateKey } from '../../../shared/functions/date.function';
import { StickyNote } from '../sticky-note/sticky-note';
/** Backend-aligned presentation contract. Place beside the side-panel files. */
enum StickyNoteColor {
  WHITE = 'WHITE', YELLOW = 'YELLOW', ORANGE = 'ORANGE', PINK = 'PINK',
  RED = 'RED', GREEN = 'GREEN', BLUE = 'BLUE', PURPLE = 'PURPLE',
  BROWN = 'BROWN', BLACK = 'BLACK'
}
enum StickyNoteShape {
  SQUARE = 'SQUARE', RECTANGLE = 'RECTANGLE', PORTRAIT = 'PORTRAIT',
  LANDSCAPE = 'LANDSCAPE', STRIP = 'STRIP'
}
enum StickyNoteVariant {
  PLAIN = 'PLAIN', ROUNDED = 'ROUNDED', SOFT = 'SOFT', FOLDED = 'FOLDED',
  CUT_CORNER = 'CUT_CORNER', TICKET = 'TICKET'
}
enum StickyNoteBackgroundPattern {
  NONE = 'NONE', HORIZONTAL_LINES = 'HORIZONTAL_LINES',
  VERTICAL_LINES = 'VERTICAL_LINES', GRID = 'GRID'
}
type StickyNotePresentation = {
  color: StickyNoteColor;
  shape: StickyNoteShape;
  variant: StickyNoteVariant;
  backgroundPattern: StickyNoteBackgroundPattern;
}
function normalizeColor(value: unknown): StickyNoteColor {
  return Object.values(StickyNoteColor).includes(value as StickyNoteColor)
    ? value as StickyNoteColor : StickyNoteColor.YELLOW;
}
function normalizeShape(value: unknown): StickyNoteShape {
  return Object.values(StickyNoteShape).includes(value as StickyNoteShape)
    ? value as StickyNoteShape : StickyNoteShape.SQUARE;
}
function normalizeVariant(value: unknown): StickyNoteVariant {
  return Object.values(StickyNoteVariant).includes(value as StickyNoteVariant)
    ? value as StickyNoteVariant : StickyNoteVariant.PLAIN;
}
function normalizeBackgroundPattern(value: unknown): StickyNoteBackgroundPattern {
  return Object.values(StickyNoteBackgroundPattern).includes(value as StickyNoteBackgroundPattern)
    ? value as StickyNoteBackgroundPattern : StickyNoteBackgroundPattern.NONE;
}
/** Matches the legacy-shape conversion in the supplied backend schema. */
function resolvePresentation(note: {
  color?: unknown; shape?: unknown; variant?: unknown; backgroundPattern?: unknown;
}): StickyNotePresentation {
  let shape = normalizeShape(note.shape);
  let variant = normalizeVariant(note.variant);
  if (!Object.values(StickyNoteShape).includes(note.shape as StickyNoteShape)) {
    switch (note.shape) {
      case 'ROUNDED': variant = StickyNoteVariant.ROUNDED; break;
      case 'SOFT': variant = StickyNoteVariant.SOFT; break;
      case 'FOLDED': variant = StickyNoteVariant.FOLDED; break;
      case 'CUT': variant = StickyNoteVariant.CUT_CORNER; break;
      case 'TICKET':
        shape = StickyNoteShape.RECTANGLE;
        variant = StickyNoteVariant.TICKET;
        break;
      default: variant = StickyNoteVariant.PLAIN;
    }
  }
  return {
    color: normalizeColor(note.color), shape, variant,
    backgroundPattern: normalizeBackgroundPattern(note.backgroundPattern)
  };
}
type SaveState = 'idle' | 'editing' | 'saving' | 'saved' | 'error';
type PresentationControl = 'color' | 'shape' | 'variant' | 'backgroundPattern';
type StringControl = 'workspaceId' | 'workspaceFolderId' | 'title' | 'content' | 'columnId' | PresentationControl;
type ItemSnapshot = {
  group: FormGroup;
  id: string;
  title: string;
  position: number;
  isCompleted: boolean;
  initialCompleted: boolean;
}
type ChecklistSnapshot = {
  group: FormGroup;
  id: string;
  title: string;
  position: number;
  items: ItemSnapshot[];
}
@Component({
  standalone: true,
  imports: [StickyNote, Checkbox, Badge, FormsModule, ReactiveFormsModule, AppIcon, AppInput, DatepickerInput, Button, Label, Loader, Select, SidePanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-edit-note-side-panel',
  styleUrl: './add-edit-note-side-panel.scss',
  templateUrl: './add-edit-note-side-panel.html'
})
export class AddEditNoteSidePanel implements OnChanges, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewDocument = inject(DOCUMENT);
  private readonly previewRenderer = inject(Renderer2);
  private readonly previewContainer = inject(ViewContainerRef);
  private readonly previewPlatform = inject(PLATFORM_ID);
  private desktopPreviewView?: EmbeddedViewRef<unknown>;
  private previewViewReady = false;
  @ViewChild('desktopPreview', { static: true }) private desktopPreviewTemplate!: TemplateRef<unknown>;
  ngAfterViewInit(): void {
    this.previewViewReady = true;
    this.scheduleDesktopPreview();
  }
  private scheduleDesktopPreview(): void {
    if (!this.previewViewReady || !isPlatformBrowser(this.previewPlatform)) return;
    queueMicrotask(() => {
      if (this.destroyRef.destroyed) return;
      if (!this.open) { this.removeDesktopPreview(); return; }
      if (this.desktopPreviewView) return;
      // Keep Angular ownership and change detection, but move the visual root to body.
      // Parent transforms, clipping and stacking contexts cannot contain the preview.
      const view = this.previewContainer.createEmbeddedView(this.desktopPreviewTemplate);
      this.desktopPreviewView = view;
      for (const node of view.rootNodes) {
        this.previewRenderer.appendChild(this.previewDocument.body, node);
      }
      view.detectChanges();
    });
  }
  private removeDesktopPreview(): void {
    const view = this.desktopPreviewView;
    if (!view) return;
    this.desktopPreviewView = undefined;
    const roots = [...view.rootNodes];
    const index = this.previewContainer.indexOf(view);
    if (index >= 0) this.previewContainer.remove(index);
    else if (!view.destroyed) view.destroy();
    for (const node of roots) {
      if (node.parentNode === this.previewDocument.body) {
        this.previewRenderer.removeChild(this.previewDocument.body, node);
      }
    }
  }
  private readonly fb = inject(FormBuilder);
  private readonly stickyNoteApi = inject(StickyNoteApiService);
  private readonly columnApi = inject(StickyNoteColumnApiService);
  private readonly columnStore = inject(StickyNoteColumnStore);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderApi = inject(WorkspaceFolderApiService);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);
  private readonly checklistApi = inject(StickyNoteChecklistApiService);
  private readonly checklistItemApi = inject(StickyNoteChecklistItemApiService);
  private readonly toastService = inject(ToastService);
  private readonly resetSession$ = new Subject<void>();
  private session = 0;
  private workspaceId = '';
  private workspaceFolderId = '';
  private savedNoteId = '';
  private changeRevision = 0;
  private checklistRevision = 0;
  private lastSyncedChecklistRevision = 0;
  private readonly originalChecklistIds = new Set<string>();
  private readonly originalItemIdsByChecklist = new Map<string, Set<string>>();
  private readonly foldersByWorkspace = new Map<string, any[]>();
  private readonly usableFoldersByWorkspace = new Map<string, any[]>();
  private readonly columnsByContext = new Map<string, any[]>();
  private readonly workspaceEligibility = new Map<string, boolean>();
  // Reactive context avoids caching column options against non-reactive form values.
  private readonly selectedContext = signal({ workspaceId: '', folderId: '' });
  @ViewChild('noteTitleInput', { read: ElementRef }) private noteTitleInput?: ElementRef<HTMLElement>;
  @Input() open = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() id = '';
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();
  readonly LucideCheck = LucideCheck;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideStickyNote = LucideStickyNote;
  readonly LucideTrash2 = LucideTrash2;
  readonly titleMaxLength = 200;
  readonly contentMaxLength = 10000;
  readonly checklistTitleMaxLength = 120;
  readonly checklistItemTitleMaxLength = 300;
  readonly loading = signal(false);
  readonly loadingData = signal(false);
  readonly loadingChecklist = signal(false);
  readonly loadingWorkspaces = signal(false);
  readonly loadingFolders = signal(false);
  readonly loadingColumns = signal(false);
  readonly error = signal('');
  readonly saveState = signal<SaveState>('idle');
  readonly panelWorkspaces = signal<any[]>([]);
  readonly panelFolders = signal<any[]>([]);
  readonly panelColumns = signal<any[]>([]);
  readonly workspaceOptions = computed<SelectOption[]>(() => this.panelWorkspaces()
    .filter(item => item?.status !== 'DELETED')
    .map(item => ({ label: item.name || 'Untitled workspace', value: this.idOf(item) }))
    .filter(item => !!item.value));
  readonly folderOptions = computed<SelectOption[]>(() => this.panelFolders()
    .filter(item => item?.status === 'ACTIVE')
    .map(item => ({ label: item.name || 'Untitled folder', value: this.idOf(item) }))
    .filter(item => !!item.value));
  readonly columnOptions = computed<SelectOption[]>(() => {
    const { workspaceId, folderId } = this.selectedContext();
    return this.panelColumns()
      .filter(item => this.columnBelongsTo(item, workspaceId, folderId))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(item => ({ label: item.name || item.title || 'Untitled column', value: this.idOf(item) }))
      .filter(item => !!item.value);
  });
  readonly colorOptions: readonly SelectOption[] = [
    { label: 'White', value: StickyNoteColor.WHITE, description: 'Neutral white paper', color: 'var(--app-select-swatch-white)' },
    { label: 'Yellow', value: StickyNoteColor.YELLOW, description: 'Classic sticky yellow', color: 'var(--app-select-swatch-yellow)' },
    { label: 'Orange', value: StickyNoteColor.ORANGE, description: 'Warm orange note', color: 'var(--app-select-swatch-orange)' },
    { label: 'Pink', value: StickyNoteColor.PINK, description: 'Soft pink note', color: 'var(--app-select-swatch-pink)' },
    { label: 'Red', value: StickyNoteColor.RED, description: 'Attention red note', color: 'var(--app-select-swatch-red)' },
    { label: 'Green', value: StickyNoteColor.GREEN, description: 'Fresh green note', color: 'var(--app-select-swatch-green)' },
    { label: 'Blue', value: StickyNoteColor.BLUE, description: 'Calm blue note', color: 'var(--app-select-swatch-blue)' },
    { label: 'Purple', value: StickyNoteColor.PURPLE, description: 'Soft purple note', color: 'var(--app-select-swatch-purple)' },
    { label: 'Brown', value: StickyNoteColor.BROWN, description: 'Earthy brown note', color: 'var(--app-select-swatch-brown)' },
    { label: 'Black', value: StickyNoteColor.BLACK, description: 'Dark paper', color: 'var(--app-select-swatch-black)' }
  ];
  readonly shapeOptions: readonly SelectOption[] = [
    { label: 'Square', value: StickyNoteShape.SQUARE, description: 'Classic square note', icon: LucideSquare },
    { label: 'Rectangle', value: StickyNoteShape.RECTANGLE, description: 'Rectangular note', icon: LucideFrame },
    { label: 'Portrait', value: StickyNoteShape.PORTRAIT, description: 'Tall note', icon: LucideFrame },
    { label: 'Landscape', value: StickyNoteShape.LANDSCAPE, description: 'Wide note', icon: LucideFrame },
    { label: 'Strip', value: StickyNoteShape.STRIP, description: 'Narrow paper strip', icon: LucideFrame }
  ];
  readonly variantOptions: readonly SelectOption[] = [
    { label: 'Plain', value: StickyNoteVariant.PLAIN, description: 'Simple paper edges', icon: LucideStickyNote },
    { label: 'Rounded', value: StickyNoteVariant.ROUNDED, description: 'Rounded corners', icon: LucideCircle },
    { label: 'Soft', value: StickyNoteVariant.SOFT, description: 'Soft modern edges', icon: LucideFrame },
    { label: 'Folded', value: StickyNoteVariant.FOLDED, description: 'Folded paper corner', icon: LucideLayers },
    { label: 'Cut corner', value: StickyNoteVariant.CUT_CORNER, description: 'Trimmed paper corner', icon: LucideScissors },
    { label: 'Ticket', value: StickyNoteVariant.TICKET, description: 'Ticket-style edges', icon: LucideTicket }
  ];
  readonly backgroundPatternOptions: readonly SelectOption[] = [
    { label: 'None', value: StickyNoteBackgroundPattern.NONE, description: 'Unprinted paper', icon: LucideSquare },
    { label: 'Horizontal lines', value: StickyNoteBackgroundPattern.HORIZONTAL_LINES, description: 'Ruled paper', icon: LucideLayers },
    { label: 'Vertical lines', value: StickyNoteBackgroundPattern.VERTICAL_LINES, description: 'Vertical ruling', icon: LucideFrame },
    { label: 'Grid', value: StickyNoteBackgroundPattern.GRID, description: 'Grid paper', icon: LucidePanelsTopLeft }
  ];
  readonly form = this.fb.group({
    workspaceId: ['', Validators.required],
    workspaceFolderId: ['', Validators.required],
    title: ['', Validators.maxLength(this.titleMaxLength)],
    content: ['', [Validators.required, Validators.maxLength(this.contentMaxLength)]],
    noteDate: [null as string | null],
    columnId: ['', Validators.required],
    color: [StickyNoteColor.YELLOW, Validators.required],
    shape: [StickyNoteShape.SQUARE, Validators.required],
    variant: [StickyNoteVariant.PLAIN, Validators.required],
    backgroundPattern: [StickyNoteBackgroundPattern.NONE, Validators.required],
    withChecklist: [false],
    checklists: this.fb.array([])
  });
  constructor() {
    // Datepicker changes update the local draft only; submit() is the sole save entry point.
    this.form.controls.noteDate.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.markEditorDirty());
    this.destroyRef.onDestroy(() => {
      this.removeDesktopPreview();
      this.resetSession$.complete();
    });
  }
  // Getters read the current reactive form; no computed() caches stale form values.
  get previewColor(): string { return this.controlString('color').toLowerCase(); }
  get previewShape(): string { return this.controlString('shape').toLowerCase(); }
  get previewVariant(): string { return this.controlString('variant').toLowerCase(); }
  get previewPattern(): string { return this.controlString('backgroundPattern').toLowerCase(); }
  get previewDate(): string { return toDateKey(this.form.controls.noteDate.value) || ''; }
  get previewItems() {
    return this.checklists.controls.flatMap((_, index) =>
      (this.checklistItems(index)?.controls ?? []).map((control) => ({
        control,
        title: String(control.get('title')?.value ?? '').trim(),
        completed: control.get('isCompleted')?.value === true
      }))
    ).filter(item => item.title.length > 0);
  }
  get previewCompleted(): number { return this.previewItems.filter(item => item.completed).length; }
  setChecklistItemCompleted(index: number, itemIndex: number, checked: boolean): void {
    if (this.isBusy) return;
    const item = this.checklistItemGroup(index, itemIndex);
    if (!item || item.get('isCompleted')?.value === checked) return;
    item.get('isCompleted')?.setValue(checked);
    this.markEditorDirty(true);
  }
  get previewColumnLabel(): string {
    return this.columnOptions().find(option => option.value === this.controlString('columnId'))?.label ?? '';
  }
  get previewColumnBadgeVariant(): any {
    const column = this.panelColumns().find(item => this.idOf(item) === this.controlString('columnId'));
    const variants: Record<string, string> = {
      WHITE: 'neutral', YELLOW: 'noteYellow', ORANGE: 'noteOrange', PINK: 'notePink',
      RED: 'noteRed', GREEN: 'noteGreen', BLUE: 'noteBlue', PURPLE: 'notePurple',
      BROWN: 'noteBrown', BLACK: 'noteBlack'
    };
    return variants[String(column?.color ?? '').toUpperCase()] ?? 'neutral';
  }
  get livePreviewData() {
    const checklists = this.checklists.controls.map((_, index) => {
      const items = (this.checklistItems(index)?.controls ?? []).map((control, itemIndex) => ({
        id: `preview-item-${index}-${itemIndex}`,
        title: String(control.get('title')?.value ?? ''),
        isCompleted: control.get('isCompleted')?.value === true
      }));
      return {
        id: `preview-list-${index}`,
        title: this.checklistTitle(index), items,
        totalCount: items.length,
        completedCount: items.filter(item => item.isCompleted).length
      };
    });
    return {
      id: 'editor-live-preview',
      columnLabel: this.previewColumnLabel,
      columnBadgeVariant: this.previewColumnBadgeVariant,
      title: this.controlString('title'),
      content: this.controlString('content'),
      color: this.controlString('color'),
      shape: this.controlString('shape'),
      variant: this.controlString('variant'),
      backgroundPattern: this.controlString('backgroundPattern'),
      noteDate: this.previewDate,
      checklists, layout: 'detail',
      showDragHandle: false, showMoveActions: false, inlineEditing: false
    };
  }
  updateNoteDate(value: string | null): void {
    this.form.controls.noteDate.setValue(value ? toDateKey(value) : null);
  }
  get checklists(): FormArray { return this.form.controls.checklists; }
  get panelTitle(): string { return this.mode === 'create' ? 'Create note' : 'Edit note'; }
  get eyebrow(): string { return this.mode === 'create' ? 'A fresh sticky thought' : 'Tidy up this note'; }
  get description(): string {
    return this.mode === 'create'
      ? 'Capture it now and organise it where it belongs.'
      : 'Update the note without leaving your current view.';
  }
  get headerIcon() { return this.mode === 'create' ? LucideStickyNote : LucidePencil; }
  readonly saveIndicatorLabel = computed(() => {
    switch (this.saveState()) {
      case 'editing': return 'Unsaved changes';
      case 'saving': return 'Saving…';
      case 'saved': return 'Saved';
      case 'error': return 'Save failed';
      default: return 'New note';
    }
  });
  get isBusy(): boolean {
    return this.loading() || this.loadingData() || this.loadingChecklist() || this.loadingWorkspaces()
      || this.loadingFolders() || this.loadingColumns();
  }
  get withChecklist(): boolean { return this.form.controls.withChecklist.value === true; }
  ngOnChanges(changes: SimpleChanges): void {
    this.scheduleDesktopPreview();
    if (this.open && (changes['open']?.currentValue === true || changes['id'] || changes['mode'])) {
      this.initialize();
    }
  }
  updateText(controlName: 'title' | 'content', value: unknown): void {
    if (this.isBusy) return;
    this.error.set('');
    this.form.controls[controlName].setValue(String(value ?? ''));
    this.markEditorDirty();
  }
  updateSelect(controlName: 'columnId' | PresentationControl, value: unknown): void {
    if (this.isBusy) return;
    if (typeof value !== 'string') return;
    this.error.set('');
    switch (controlName) {
      case 'color': this.form.controls.color.setValue(normalizeColor(value)); break;
      case 'shape': this.form.controls.shape.setValue(normalizeShape(value)); break;
      case 'variant': this.form.controls.variant.setValue(normalizeVariant(value)); break;
      case 'backgroundPattern':
        this.form.controls.backgroundPattern.setValue(normalizeBackgroundPattern(value)); break;
      default:
        this.form.controls.columnId.setValue(
          this.columnOptions().some(option => option.value === value) ? value : ''
        );
    }
    this.markEditorDirty();
  }
  updateWorkspace(value: SelectValue): void {
    if (this.isBusy) return;
    const workspaceId = value ? String(value) : '';
    if (workspaceId === this.workspaceId) return;
    this.error.set('');
    this.applyLocalContext(workspaceId, '', '');
    this.panelFolders.set([]);
    this.panelColumns.set([]);
    this.markEditorDirty();
    if (workspaceId) this.loadFoldersForWorkspace(workspaceId);
  }
  updateFolder(value: SelectValue): void {
    if (this.isBusy) return;
    const folderId = value ? String(value) : '';
    if (folderId === this.workspaceFolderId) return;
    this.error.set('');
    this.applyLocalContext(this.workspaceId, folderId, '');
    this.panelColumns.set([]);
    this.markEditorDirty();
    if (this.workspaceId && folderId) this.loadColumnsForContext(this.workspaceId, folderId);
  }
  addChecklist(): void {
    if (this.isBusy) return;
    this.form.controls.withChecklist.setValue(true);
    this.checklists.push(this.createChecklistGroup());
    this.markEditorDirty(true);
  }
  removeChecklist(index: number): void {
    if (this.isBusy || index < 0 || index >= this.checklists.length) return;
    this.checklists.removeAt(index);
    this.form.controls.withChecklist.setValue(this.checklists.length > 0);
    this.markEditorDirty(true);
  }
  updateChecklistTitle(index: number, value: unknown): void {
    if (this.isBusy) return;
    const group = this.checklistGroup(index);
    if (!group) return;
    this.error.set('');
    group.get('title')?.setValue(String(value ?? ''));
    this.markEditorDirty(true);
  }
  addChecklistItem(index: number): void {
    if (this.isBusy) return;
    this.checklistItems(index)?.push(this.createChecklistItemGroup());
    this.markEditorDirty(true);
  }
  removeChecklistItem(index: number, itemIndex: number): void {
    if (this.isBusy) return;
    const items = this.checklistItems(index);
    if (!items || itemIndex < 0 || itemIndex >= items.length) return;
    items.removeAt(itemIndex);
    if (!items.length) items.push(this.createChecklistItemGroup());
    this.markEditorDirty(true);
  }
  updateChecklistItemTitle(index: number, itemIndex: number, value: unknown): void {
    if (this.isBusy) return;
    const item = this.checklistItemGroup(index, itemIndex);
    if (!item) return;
    this.error.set('');
    item.get('title')?.setValue(String(value ?? ''));
    this.markEditorDirty(true);
  }
  toggleChecklistItem(index: number, itemIndex: number): void {
    if (this.isBusy) return;
    const item = this.checklistItemGroup(index, itemIndex);
    if (!item) return;
    item.get('isCompleted')?.setValue(item.get('isCompleted')?.value !== true);
    this.markEditorDirty(true);
  }
  checklistTitle(index: number): string { return String(this.checklistGroup(index)?.get('title')?.value ?? ''); }
  checklistItemTitle(index: number, itemIndex: number): string {
    return String(this.checklistItemGroup(index, itemIndex)?.get('title')?.value ?? '');
  }
  checklistItemCompleted(index: number, itemIndex: number): boolean {
    return this.checklistItemGroup(index, itemIndex)?.get('isCompleted')?.value === true;
  }
  controlString(name: StringControl): string { return String(this.form.get(name)?.value ?? ''); }
  // Only the footer Save note button calls this method.
  submit(): void {
    if (!this.open || this.isBusy) return;
    const message = this.validateBeforeSave();
    if (message || this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifyError(message || 'Check the date, field lengths and required selections.', 'Check note details');
      return;
    }
    this.persistEditor();
  }
  onTitleEnter(event: KeyboardEvent): void {
    event.preventDefault();
    (event.target as HTMLElement | null)?.blur();
  }
  onChecklistItemEnter(event: KeyboardEvent, index: number): void {
    event.preventDefault();
    this.addChecklistItem(index);
  }
  close(): void {
    if (this.isBusy) return;
    // Cancel/close discards the local draft; it never calls a write endpoint.
    this.closed.emit();
  }
  private markEditorDirty(checklistChanged = false): void {
    this.form.markAsDirty();
    this.changeRevision++;
    if (checklistChanged) this.checklistRevision++;
    this.saveState.set('editing');
  }
  private persistEditor(): void {
    const session = this.session;
    const revision = this.changeRevision;
    const checklistRevision = this.checklistRevision;
    const syncChecklist = checklistRevision > this.lastSyncedChecklistRevision;
    const checklistSnapshot = syncChecklist ? this.snapshotChecklists() : [];
    const title = this.controlString('title').trim();
    // All four presentation fields are sent on BOTH create and update.
    const payload = {
      workspaceId: this.workspaceId,
      workspaceFolderId: this.workspaceFolderId,
      columnId: this.controlString('columnId').trim(),
      title,
      content: this.controlString('content').trim(),
      noteDate: toDateKey(this.form.controls.noteDate.value),
      color: normalizeColor(this.form.controls.color.value),
      shape: normalizeShape(this.form.controls.shape.value),
      variant: normalizeVariant(this.form.controls.variant.value),
      backgroundPattern: normalizeBackgroundPattern(this.form.controls.backgroundPattern.value)
    };
    this.loading.set(true);
    this.saveState.set('saving');
    defer(() => this.saveNote(payload)).pipe(
      tap(response => {
        const noteId = this.idOf(response.data);
        if (!noteId) throw new Error('Note id was not returned by the server.');
        this.savedNoteId = noteId;
      }),
      switchMap(response => syncChecklist
        ? this.syncChecklists(this.savedNoteId, checklistSnapshot).pipe(map(() => response.data))
        : of(response.data)),
      takeUntil(this.resetSession$),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (session === this.session) this.loading.set(false);
      })
    ).subscribe({
      next: () => {
        this.error.set('');
        if (syncChecklist) this.lastSyncedChecklistRevision = checklistRevision;
        if (revision === this.changeRevision) {
          this.form.markAsPristine();
          this.saveState.set('saved');
        } else this.saveState.set('editing');
        this.loading.set(false);
        this.saved.emit(this.savedNoteId);
      },
      error: error => {
        this.saveState.set('error');
        this.notifyError(this.errorMessage(error, 'Unable to save the note changes.'), 'Save failed');
      }
    });
  }
  // Keep the supplied service contract; the same payload reaches both methods.
  private saveNote(payload: any): Observable<any> {
    if (this.mode === 'create' && !this.savedNoteId) return this.stickyNoteApi.create(payload);
    const noteId = this.savedNoteId || this.id;
    if (!noteId) return throwError(() => new Error('Cannot update note because its id is missing.'));
    return this.stickyNoteApi.update(noteId, payload);
  }
  private initialize(): void {
    this.resetEditor();
    const id = String(this.id ?? '').trim();
    if (!id) {
      this.notifyError(this.mode === 'create' ? 'A column id is required to create a note.' : 'A note id is required to edit a note.', 'Could not open note editor');
      return;
    }
    this.loadingData.set(true);
    this.ensureWorkspaceList$().pipe(
      switchMap(() => this.mode === 'edit' ? this.loadNoteContext$(id) : this.loadCreateContext$(id)),
      finalize(() => this.loadingData.set(false)),
      takeUntil(this.resetSession$), takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.focusTitle(),
      error: error => this.handleLoadError(error, 'Unable to prepare this note.')
    });
  }
  private loadNoteContext$(noteId: string): Observable<void> {
    return this.stickyNoteApi.getById(noteId).pipe(switchMap(response => {
      const note: any = response.data;
      const workspaceId = this.idOf(note?.workspaceId);
      const folderId = this.idOf(note?.workspaceFolderId);
      const columnId = this.idOf(note?.columnId);
      if (!workspaceId || !folderId || !columnId) {
        return throwError(() => new Error('Unable to resolve this note workspace, folder and column.'));
      }
      this.savedNoteId = this.idOf(note) || noteId;
      this.applyLocalContext(workspaceId, folderId, columnId);
      this.form.patchValue({
        title: String(note?.title ?? ''), content: this.noteContent(note),
        noteDate: toDateKey(note?.noteDate), ...resolvePresentation(note), withChecklist: false
      }, { emitEvent: false });
      this.loadChecklists(note, noteId);
      return this.prepareLocalContext$(workspaceId, folderId, columnId);
    }));
  }
  private loadCreateContext$(columnId: string): Observable<void> {
    const column = this.columnStore.findById(columnId);
    const workspaceId = this.columnStore.workspaceId();
    const folderId = this.columnStore.workspaceFolderId();
    if (column && workspaceId && folderId) {
      this.form.controls.color.setValue(normalizeColor(column.color));
      return this.prepareLocalContext$(workspaceId, folderId, columnId);
    }
    return this.columnApi.getById(columnId).pipe(switchMap(response => {
      const item = response.data;
      const workspace = this.idOf(item?.workspaceId);
      const folder = this.idOf(item?.workspaceFolderId);
      if (!workspace || !folder) return throwError(() => new Error('Unable to resolve this column workspace and folder.'));
      this.form.controls.color.setValue(normalizeColor(item?.color));
      return this.prepareLocalContext$(workspace, folder, this.idOf(item) || columnId);
    }));
  }
  private prepareLocalContext$(workspaceId: string, folderId: string, columnId: string): Observable<void> {
    this.applyLocalContext(workspaceId, folderId, columnId);
    return this.ensureWorkspaceAvailable$(workspaceId).pipe(
      switchMap(() => this.ensureFoldersForWorkspace$(workspaceId, folderId)),
      switchMap(resolved => {
        if (resolved !== folderId) return throwError(() => new Error('The selected folder does not belong to this workspace.'));
        return this.ensureColumnsForContext$(workspaceId, folderId, columnId);
      }),
      map(resolved => {
        if (resolved !== columnId) throw new Error('The selected column does not belong to this folder.');
        this.applyLocalContext(workspaceId, folderId, columnId);
      })
    );
  }
  private ensureWorkspaceList$(): Observable<void> {
    const stored = [...this.workspaceStore.workspaces()];
    this.loadingWorkspaces.set(true);
    const source$ = stored.length ? of(stored) : this.workspaceApi.getMyWorkspaces({
      page: 1, limit: 100, status: 'ACTIVE', sortBy: 'updatedAt', sortOrder: 'desc'
    }).pipe(map(response => response.data ?? []));
    return source$.pipe(
      switchMap(workspaces => this.filterUsableWorkspaces$(workspaces)),
      tap(workspaces => this.panelWorkspaces.set(workspaces)),
      map(() => void 0), finalize(() => this.loadingWorkspaces.set(false))
    );
  }
  private filterUsableWorkspaces$(workspaces: readonly any[]): Observable<any[]> {
    return from(workspaces.filter(item => this.idOf(item) && item?.status !== 'DELETED')).pipe(
      mergeMap((workspace, index) => this.workspaceHasUsableHierarchy$(workspace)
        .pipe(map(usable => ({ workspace, index, usable }))), 4),
      filter(result => result.usable), toArray(),
      map(results => results.sort((a, b) => a.index - b.index).map(item => item.workspace))
    );
  }
  private workspaceHasUsableHierarchy$(workspace: any): Observable<boolean> {
    const id = this.idOf(workspace);
    if (!id || workspace?.status === 'DELETED') return of(false);
    const cached = this.workspaceEligibility.get(id);
    if (cached !== undefined) return of(cached);
    return this.getActiveFoldersForWorkspace$(id).pipe(
      switchMap(folders => from(folders).pipe(
        concatMap(folder => this.folderHasColumns$(id, this.idOf(folder))),
        filter(Boolean), take(1), defaultIfEmpty(false)
      )),
      tap(usable => this.workspaceEligibility.set(id, usable)),
      catchError(() => of(false))
    );
  }
  private ensureWorkspaceAvailable$(id: string): Observable<void> {
    if (this.panelWorkspaces().some(item => this.idOf(item) === id)) return of(void 0);
    return this.workspaceApi.getById(id).pipe(switchMap(response =>
      this.workspaceHasUsableHierarchy$(response.data).pipe(map(usable => {
        if (!usable) throw new Error('This workspace has no folder with columns available for notes.');
        this.panelWorkspaces.update(current => [...current.filter(item => this.idOf(item) !== id), response.data]);
      }))
    ));
  }
  private getActiveFoldersForWorkspace$(workspaceId: string): Observable<any[]> {
    const cached = this.foldersByWorkspace.get(workspaceId);
    if (cached) return of([...cached]);
    if (this.workspaceFolderStore.initialized() && !this.workspaceFolderStore.error()
      && this.workspaceFolderStore.workspaceId() === workspaceId) {
      return of(this.cacheActiveFolders(workspaceId, this.workspaceFolderStore.activeFolders()));
    }
    return this.workspaceFolderApi.getByWorkspace(workspaceId, {
      page: 1, limit: 100, status: 'ACTIVE', sortBy: 'position', sortOrder: 'asc'
    }).pipe(map(response => this.cacheActiveFolders(workspaceId, response.data ?? [])));
  }
  private cacheActiveFolders(workspaceId: string, folders: readonly any[]): any[] {
    const safe = folders.filter(folder => folder?.status === 'ACTIVE'
      && (!this.idOf(folder.workspaceId) || this.idOf(folder.workspaceId) === workspaceId));
    this.foldersByWorkspace.set(workspaceId, safe);
    return safe;
  }
  private filterFoldersWithColumns$(workspaceId: string, folders: readonly any[]): Observable<any[]> {
    return from(folders).pipe(
      mergeMap((folder, index) => this.folderHasColumns$(workspaceId, this.idOf(folder))
        .pipe(map(hasColumns => ({ folder, index, hasColumns }))), 3),
      filter(result => result.hasColumns), toArray(),
      map(results => results.sort((a, b) => a.index - b.index).map(item => item.folder)),
      tap(folders => this.usableFoldersByWorkspace.set(workspaceId, folders))
    );
  }
  private folderHasColumns$(workspaceId: string, folderId: string): Observable<boolean> {
    if (!workspaceId || !folderId) return of(false);
    const cached = this.columnsByContext.get(this.contextKey(workspaceId, folderId));
    if (cached) return of(cached.length > 0);
    if (this.columnStore.initialized() && !this.columnStore.error()
      && this.columnStore.contextMatches(workspaceId, folderId)) {
      return of(this.cacheColumnsForContext(workspaceId, folderId, this.columnStore.orderedColumns()).length > 0);
    }
    return this.columnApi.getByWorkspaceFolder(workspaceId, folderId).pipe(
      map(response => this.cacheColumnsForContext(workspaceId, folderId, response.data ?? []).length > 0),
      catchError(() => of(false))
    );
  }
  private ensureFoldersForWorkspace$(workspaceId: string, preferred: string): Observable<string> {
    const cached = this.usableFoldersByWorkspace.get(workspaceId);
    const source$ = cached ? of(cached) : this.getActiveFoldersForWorkspace$(workspaceId)
      .pipe(switchMap(folders => this.filterFoldersWithColumns$(workspaceId, folders)));
    return source$.pipe(switchMap(folders => {
      this.panelFolders.set([...folders]);
      const resolved = this.resolveLocalFolderId(preferred);
      if (resolved || !preferred) return of(resolved);
      return this.workspaceFolderApi.getById(preferred).pipe(switchMap(response => {
        const folder = response.data;
        if (folder?.status !== 'ACTIVE' || this.idOf(folder?.workspaceId) !== workspaceId) {
          return throwError(() => new Error('The selected folder is not active in this workspace.'));
        }
        return this.folderHasColumns$(workspaceId, preferred).pipe(map(hasColumns => {
          if (!hasColumns) throw new Error('The selected folder has no columns available for notes.');
          const next = [...folders, folder];
          this.usableFoldersByWorkspace.set(workspaceId, next);
          this.panelFolders.set(next);
          return preferred;
        }));
      }));
    }));
  }
  private ensureColumnsForContext$(workspaceId: string, folderId: string, preferred: string): Observable<string> {
    const cached = this.columnsByContext.get(this.contextKey(workspaceId, folderId));
    if (cached) {
      this.panelColumns.set([...cached]);
      const resolved = this.resolveLocalColumnId(preferred);
      if (resolved || !preferred) return of(resolved);
    }
    if (this.columnStore.initialized() && !this.columnStore.error()
      && this.columnStore.contextMatches(workspaceId, folderId)) {
      this.setPanelColumns(workspaceId, folderId, this.columnStore.orderedColumns());
      const resolved = this.resolveLocalColumnId(preferred);
      if (resolved || !preferred) return of(resolved);
    }
    return this.columnApi.getByWorkspaceFolder(workspaceId, folderId).pipe(
      tap(response => this.setPanelColumns(workspaceId, folderId, response.data ?? [])),
      switchMap(() => {
        const resolved = this.resolveLocalColumnId(preferred);
        if (resolved || !preferred) return of(resolved);
        return this.columnApi.getById(preferred).pipe(map(response => {
          const column = response.data;
          if (this.idOf(column?.workspaceId) !== workspaceId || this.idOf(column?.workspaceFolderId) !== folderId) {
            throw new Error('The selected column does not belong to this workspace and folder.');
          }
          this.setPanelColumns(workspaceId, folderId, [...this.panelColumns(), column]);
          return preferred;
        }));
      })
    );
  }
  private loadFoldersForWorkspace(workspaceId: string): void {
    this.loadingFolders.set(true);
    this.ensureFoldersForWorkspace$(workspaceId, '').pipe(
      tap(folderId => this.applyLocalContext(workspaceId, folderId, '')),
      switchMap(folderId => {
        if (!folderId) return of('');
        this.loadingColumns.set(true);
        return this.ensureColumnsForContext$(workspaceId, folderId, '');
      }),
      finalize(() => { this.loadingFolders.set(false); this.loadingColumns.set(false); }),
      takeUntil(this.resetSession$), takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: columnId => { this.form.controls.columnId.setValue(columnId); },
      error: error => this.handleLoadError(error, 'Unable to load workspace folders.')
    });
  }
  private loadColumnsForContext(workspaceId: string, folderId: string): void {
    this.loadingColumns.set(true);
    this.ensureColumnsForContext$(workspaceId, folderId, '').pipe(
      finalize(() => this.loadingColumns.set(false)),
      takeUntil(this.resetSession$), takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: columnId => { this.form.controls.columnId.setValue(columnId); },
      error: error => this.handleLoadError(error, 'Unable to load note columns.')
    });
  }
  private resolveLocalFolderId(preferred: string): string {
    const folders = this.panelFolders();
    if (preferred) return folders.some(item => this.idOf(item) === preferred) ? preferred : '';
    return this.idOf(folders.find(item => item?.isDefault === true) ?? folders[0]);
  }
  private resolveLocalColumnId(preferred: string): string {
    const allowed = new Set(this.columnOptions().map(option => String(option.value)));
    if (preferred) return allowed.has(preferred) ? preferred : '';
    const columns = this.panelColumns().filter(item => allowed.has(this.idOf(item)));
    return this.idOf(columns.find(item => item?.type !== 'COMPLETED') ?? columns[0]);
  }
  private applyLocalContext(workspaceId: string, folderId: string, columnId: string): void {
    this.workspaceId = workspaceId;
    this.workspaceFolderId = folderId;
    this.selectedContext.set({ workspaceId, folderId });
    this.form.patchValue({ workspaceId, workspaceFolderId: folderId, columnId }, { emitEvent: false });
  }
  private columnBelongsTo(column: any, workspaceId: string, folderId: string): boolean {
    const workspace = this.idOf(column?.workspaceId);
    const folder = this.idOf(column?.workspaceFolderId);
    return (!workspace || workspace === workspaceId) && (!folder || folder === folderId);
  }
  private cacheColumnsForContext(workspaceId: string, folderId: string, columns: readonly any[]): any[] {
    const safe = columns.filter(item => this.columnBelongsTo(item, workspaceId, folderId))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    this.columnsByContext.set(this.contextKey(workspaceId, folderId), safe);
    return safe;
  }
  private setPanelColumns(workspaceId: string, folderId: string, columns: readonly any[]): void {
    this.panelColumns.set([...this.cacheColumnsForContext(workspaceId, folderId, columns)]);
  }
  private contextKey(workspaceId: string, folderId: string): string { return `${workspaceId}::${folderId}`; }
  private loadChecklists(note: any, noteId: string): void {
    const nested = this.noteChecklists(note);
    if (nested !== null) { this.applyChecklists(nested); return; }
    this.loadingChecklist.set(true);
    this.checklistApi.getByStickyNote(noteId, {
      page: 1, limit: 100, sortBy: 'position', sortOrder: 'asc'
    }).pipe(
      switchMap(response => {
        const lists = this.extractList(response).filter(item => item.status !== 'DELETED');
        if (!lists.length) return of([]);
        return forkJoin(lists.map(checklist => this.checklistItemApi.getByChecklist(this.idOf(checklist), {
          page: 1, limit: 250, sortBy: 'position', sortOrder: 'asc'
        }).pipe(map(response => ({ ...checklist, items: this.extractList(response) })))));
      }),
      finalize(() => { this.loadingChecklist.set(false); this.focusTitle(); }),
      takeUntil(this.resetSession$), takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: lists => this.applyChecklists(lists),
      error: error => this.handleLoadError(error, 'Unable to load this note checklists.')
    });
  }
  private applyChecklists(checklists: any[]): void {
    this.checklists.clear();
    this.originalChecklistIds.clear();
    this.originalItemIdsByChecklist.clear();
    checklists.filter(item => item?.status !== 'DELETED')
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).forEach(checklist => {
        const id = this.idOf(checklist);
        const items = (Array.isArray(checklist.items) ? [...checklist.items] : [])
          .filter(item => item?.status !== 'DELETED')
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        if (id) {
          this.originalChecklistIds.add(id);
          this.originalItemIdsByChecklist.set(id, new Set(items.map(item => this.idOf(item)).filter(Boolean)));
        }
        this.checklists.push(this.createChecklistGroup({ id, title: checklist.title ?? '', items }));
      });
    this.form.controls.withChecklist.setValue(this.checklists.length > 0);
  }
  private snapshotChecklists(): ChecklistSnapshot[] {
    if (!this.withChecklist) return [];
    return this.checklists.controls.map((control, position) => {
      const group = control as FormGroup;
      return {
        group, position, id: String(group.get('id')?.value ?? ''),
        title: String(group.get('title')?.value ?? '').trim(),
        items: (group.get('items') as FormArray).controls.map((item, itemPosition) => ({
          group: item as FormGroup, position: itemPosition,
          id: String(item.get('id')?.value ?? ''), title: String(item.get('title')?.value ?? '').trim(),
          isCompleted: item.get('isCompleted')?.value === true,
          initialCompleted: item.get('initialCompleted')?.value === true
        }))
      };
    });
  }
  private syncChecklists(noteId: string, groups: ChecklistSnapshot[]): Observable<void> {
    const ids = new Set(groups.map(group => group.id).filter(Boolean));
    const removed = [...this.originalChecklistIds].filter(id => !ids.has(id));
    return from(groups).pipe(
      concatMap(group => this.saveChecklist(noteId, group)), toArray(),
      switchMap(() => this.deleteChecklistTrees(removed)),
      tap(() => removed.forEach(id => {
        this.originalChecklistIds.delete(id);
        this.originalItemIdsByChecklist.delete(id);
      }))
    );
  }
  private saveChecklist(noteId: string, snapshot: ChecklistSnapshot): Observable<void> {
    const { id, title, position, group } = snapshot;
    const request = id ? this.checklistApi.update(id, { title, position })
      : this.checklistApi.create({ stickyNoteId: noteId, title, position });
    return request.pipe(
      map(response => this.idOf(response.data)),
      tap(checklistId => {
        if (!checklistId) throw new Error('Checklist id was not returned by the server.');
        group.get('id')?.setValue(checklistId, { emitEvent: false });
        this.originalChecklistIds.add(checklistId);
        if (!this.originalItemIdsByChecklist.has(checklistId)) this.originalItemIdsByChecklist.set(checklistId, new Set());
      }),
      switchMap(checklistId => this.syncChecklistItems(snapshot.items, checklistId))
    );
  }
  private syncChecklistItems(rows: ItemSnapshot[], checklistId: string): Observable<void> {
    const original = this.originalItemIdsByChecklist.get(checklistId) ?? new Set<string>();
    const current = new Set(rows.map(row => row.id).filter(Boolean));
    const removed = [...original].filter(id => !current.has(id));
    return from(rows).pipe(
      concatMap(row => this.saveChecklistItem(checklistId, row)), toArray(),
      switchMap(() => this.deleteChecklistItems(removed)),
      tap(() => {
        const latest = this.originalItemIdsByChecklist.get(checklistId) ?? original;
        removed.forEach(id => latest.delete(id));
        this.originalItemIdsByChecklist.set(checklistId, latest);
      })
    );
  }
  private saveChecklistItem(checklistId: string, row: ItemSnapshot): Observable<unknown> {
    if (row.id) {
      const request = this.checklistItemApi.update(row.id, { title: row.title, position: row.position });
      if (row.isCompleted === row.initialCompleted) return request;
      return request.pipe(
        switchMap(() => this.checklistItemApi.updateCompletion(row.id, row.isCompleted)),
        tap(() => row.group.get('initialCompleted')?.setValue(row.isCompleted, { emitEvent: false }))
      );
    }
    return this.checklistItemApi.create({ checklistId, title: row.title, position: row.position }).pipe(
      tap(response => {
        const id = this.idOf(response.data);
        if (!id) throw new Error('Checklist item id was not returned by the server.');
        row.group.get('id')?.setValue(id, { emitEvent: false });
        const ids = this.originalItemIdsByChecklist.get(checklistId) ?? new Set<string>();
        ids.add(id);
        this.originalItemIdsByChecklist.set(checklistId, ids);
      }),
      switchMap(response => {
        if (!row.isCompleted) return of(response);
        return this.checklistItemApi.updateCompletion(this.idOf(response.data), true).pipe(
          tap(() => row.group.get('initialCompleted')?.setValue(true, { emitEvent: false }))
        );
      })
    );
  }
  private deleteChecklistTrees(ids: string[]): Observable<void> {
    return from(ids).pipe(
      concatMap(id => this.deleteChecklistItems([...(this.originalItemIdsByChecklist.get(id) ?? [])])
        .pipe(switchMap(() => this.checklistApi.delete(id)))),
      toArray(), map(() => void 0)
    );
  }
  private deleteChecklistItems(ids: string[]): Observable<void> {
    return from(ids).pipe(concatMap(id => this.checklistItemApi.delete(id)), toArray(), map(() => void 0));
  }
  private createChecklistGroup(value: any = {}): FormGroup {
    const items = Array.isArray(value.items) && value.items.length
      ? value.items.map((item: any) => this.createChecklistItemGroup({
        id: this.idOf(item), title: item.title ?? '',
        isCompleted: item.isCompleted === true, initialCompleted: item.isCompleted === true
      })) : [this.createChecklistItemGroup()];
    return this.fb.group({
      id: [value.id ?? ''], title: [value.title ?? '', Validators.maxLength(this.checklistTitleMaxLength)],
      items: this.fb.array(items)
    });
  }
  private createChecklistItemGroup(value: any = {}): FormGroup {
    return this.fb.group({
      id: [value.id ?? ''], title: [value.title ?? '', Validators.maxLength(this.checklistItemTitleMaxLength)],
      isCompleted: [value.isCompleted ?? false], initialCompleted: [value.initialCompleted ?? false]
    });
  }
  private checklistGroup(index: number): FormGroup | null { return this.checklists.at(index) as FormGroup ?? null; }
  checklistItems(index: number): FormArray | null { return this.checklistGroup(index)?.get('items') as FormArray ?? null; }
  private checklistItemGroup(index: number, itemIndex: number): FormGroup | null {
    return this.checklistItems(index)?.at(itemIndex) as FormGroup ?? null;
  }
  private validateBeforeSave(): string | null {
    if (!this.workspaceId) return 'Choose a workspace for this note.';
    if (!this.workspaceFolderId) return 'Choose a folder for this note.';
    if (!this.controlString('content').trim()) return 'Write some details before saving your note.';
    if (this.controlString('title').length > this.titleMaxLength) return `Title must be at most ${this.titleMaxLength} characters.`;
    if (this.controlString('content').length > this.contentMaxLength) return `Details must be at most ${this.contentMaxLength} characters.`;
    if (!this.columnOptions().some(option => option.value === this.controlString('columnId'))) return 'Choose a column for this note.';
    if (!this.colorOptions.some(option => option.value === this.controlString('color'))) return 'Choose a valid note color.';
    if (!this.shapeOptions.some(option => option.value === this.controlString('shape'))) return 'Choose a valid note shape.';
    if (!this.variantOptions.some(option => option.value === this.controlString('variant'))) return 'Choose a valid paper style.';
    if (!this.backgroundPatternOptions.some(option => option.value === this.controlString('backgroundPattern'))) return 'Choose a valid background pattern.';
    const date = this.form.controls.noteDate.value;
    if (date && !toDateKey(date)) return 'Choose a valid note date.';
    if (!this.withChecklist) return null;
    if (!this.checklists.length) return 'Add at least one checklist.';
    const listTitles = new Set<string>();
    for (let i = 0; i < this.checklists.length; i++) {
      const title = this.checklistTitle(i).trim();
      if (!title) return `Enter a title for checklist ${i + 1}.`;
      if (title.length > this.checklistTitleMaxLength) return `Checklist titles must be at most ${this.checklistTitleMaxLength} characters.`;
      if (listTitles.has(title.toLowerCase())) return `Checklist "${title}" is repeated. Use a different title.`;
      listTitles.add(title.toLowerCase());
      const items = this.checklistItems(i);
      if (!items?.length) return `Add at least one item to "${title}".`;
      const itemTitles = new Set<string>();
      for (let j = 0; j < items.length; j++) {
        const itemTitle = this.checklistItemTitle(i, j).trim();
        if (!itemTitle) return `Fill or remove empty items from "${title}" before saving.`;
        if (itemTitle.length > this.checklistItemTitleMaxLength) return `Checklist items must be at most ${this.checklistItemTitleMaxLength} characters.`;
        if (itemTitles.has(itemTitle.toLowerCase())) return `"${itemTitle}" is repeated inside "${title}".`;
        itemTitles.add(itemTitle.toLowerCase());
      }
    }
    return null;
  }
  private noteChecklists(note: any): any[] | null {
    if (Array.isArray(note?.checklists)) return note.checklists;
    if (note?.checklist) return [note.checklist];
    if (note && (Object.prototype.hasOwnProperty.call(note, 'checklists') || Object.prototype.hasOwnProperty.call(note, 'checklist'))) return [];
    return null;
  }
  private resetEditor(): void {
    this.resetSession$.next();
    this.session++;
    this.workspaceId = '';
    this.workspaceFolderId = '';
    this.savedNoteId = '';
    this.changeRevision = 0;
    this.checklistRevision = 0;
    this.lastSyncedChecklistRevision = 0;
    this.saveState.set(this.mode === 'edit' ? 'saved' : 'idle');
    this.originalChecklistIds.clear();
    this.originalItemIdsByChecklist.clear();
    this.panelWorkspaces.set([]);
    this.panelFolders.set([]);
    this.panelColumns.set([]);
    this.selectedContext.set({ workspaceId: '', folderId: '' });
    this.foldersByWorkspace.clear();
    this.usableFoldersByWorkspace.clear();
    this.columnsByContext.clear();
    this.workspaceEligibility.clear();
    this.loadingWorkspaces.set(false);
    this.loadingFolders.set(false);
    this.loadingColumns.set(false);
    this.loadingData.set(false);
    this.loading.set(false);
    this.loadingChecklist.set(false);
    this.error.set('');
    this.checklists.clear();
    this.form.reset({
      workspaceId: '', workspaceFolderId: '', title: '', content: '',
      noteDate: this.mode === 'create' ? todayDateKey() : null, columnId: '',
      color: StickyNoteColor.YELLOW, shape: StickyNoteShape.SQUARE,
      variant: StickyNoteVariant.PLAIN, backgroundPattern: StickyNoteBackgroundPattern.NONE,
      withChecklist: false
    }, { emitEvent: false });
  }
  private noteContent(note: any): string {
    const content = String(note?.content ?? '').trim();
    return content;
  }
  private extractList(response: any): any[] {
    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    const result = data.items || data.checklists || data.checklistItems || data.docs || data.results;
    return Array.isArray(result) ? result : [];
  }
  private idOf(value: any): string {
    if (!value) return '';
    return typeof value === 'string' ? value : String(value.id ?? value._id ?? '');
  }
  private handleLoadError(error: unknown, fallback: string): void {
    this.loadingWorkspaces.set(false);
    this.loadingFolders.set(false);
    this.loadingColumns.set(false);
    this.notifyError(this.errorMessage(error, fallback), 'Could not open note editor');
  }
  private notifyError(message: string, title: string): void {
    this.error.set(message);
    this.toastService.error(message, { title, dedupeKey: `note-editor-${this.mode}-${this.id || 'new'}-${message}` });
  }
  private errorMessage(error: any, fallback: string): string { return error?.error?.message || error?.message || fallback; }
  private focusTitle(): void {
    const session = this.session;
    const focus = () => {
      if (!this.open || session !== this.session) return;
      const input = this.noteTitleInput?.nativeElement.querySelector('input:not([disabled])') as HTMLInputElement | null;
      if (!input || document.activeElement === input) return;
      input.focus({ preventScroll: true });
      if (this.mode === 'edit' && input.value) input.setSelectionRange(0, input.value.length);
    };
    requestAnimationFrame(() => requestAnimationFrame(focus));
    setTimeout(focus, 120);
  }
}
