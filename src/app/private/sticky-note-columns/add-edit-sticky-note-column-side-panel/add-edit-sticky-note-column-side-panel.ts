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
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  LucideCheck,
  LucideColumns3,
  LucideFolderOpen,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideTrash2
} from '@lucide/angular';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Input as AppInput } from '../../../shared/components/input/input';
import { Label } from '../../../shared/components/label/label';
import { Loader } from '../../../shared/components/loader/loader';
import { Select, SelectOption, SelectValue } from '../../../shared/components/select/select';
import { SidePanel, SidePanelTone } from '../../../shared/components/side-panel/side-panel';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { COMMON_MESSAGES } from '../../../shared/constants/common.messages';

import {
  extractErrorMessage,
  extractList,
  idOf
} from '../../../shared/functions/common.function';
import {
  COLUMN_LIMITS,
  STICKY_NOTE_COLUMN_COLOR_OPTIONS
} from '../../../shared/constants/common.constants';
import {
  getColumnColorLabel,
  getColumnTypeLabel,
  getNotePanelTone,
  isValidColumnColor,
  resolveDefaultFolderId,
  toColorCssClass,
  validateColumnForm
} from '../../../shared/functions/sticky-note.function';

import { StickyNoteColumnApiService } from '../../mynotes/services/sticky-note-column.service';
import { StickyNoteColumnStore } from '../../mynotes/services/sticky-note-column.store';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { WorkspaceFolderService } from '../../workspacefolders/services/workspace-folder.service';
import { WorkspaceFolderStore } from '../../workspacefolders/services/workspace-folder.store';

@Component({
  selector: 'app-add-edit-sticky-note-column-side-panel',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Label,
    Loader,
    Select,
    SidePanel
  ],
  templateUrl: './add-edit-sticky-note-column-side-panel.html',
  styleUrl: './add-edit-sticky-note-column-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditStickyNoteColumnSidePanel implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);

  private readonly columnApi = inject(StickyNoteColumnApiService);
  private readonly columnStore = inject(StickyNoteColumnStore);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderApi = inject(WorkspaceFolderService);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);

  @Input() open = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() id = '';
  @Input() workspaceId = '';
  @Input() workspaceFolderId = '';
  @Input() column: any = null;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();

  @ViewChild('columnNameInput', { read: ElementRef })
  private columnNameInput?: ElementRef<HTMLElement>;

  readonly LucideCheck = LucideCheck;
  readonly LucideColumns3 = LucideColumns3;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideTrash2 = LucideTrash2;

  readonly nameMinLength = COLUMN_LIMITS.NAME_MIN_LENGTH;
  readonly nameMaxLength = COLUMN_LIMITS.NAME_MAX_LENGTH;

  readonly colorOptions: readonly SelectOption[] = STICKY_NOTE_COLUMN_COLOR_OPTIONS;

  readonly loading = signal(false);
  readonly loadingData = signal(false);
  readonly loadingWorkspaces = signal(false);
  readonly loadingFolders = signal(false);
  readonly error = signal('');
  readonly saveState = signal<'idle' | 'editing' | 'saving' | 'saved' | 'error'>('idle');

  readonly panelWorkspaces = signal<any[]>([]);
  readonly panelFolders = signal<any[]>([]);
  readonly columnMeta = signal<any>(null);

  private editorId = '';

  readonly workspaceOptions = computed<SelectOption[]>(() =>
    this.panelWorkspaces()
      .filter(item => item?.status !== 'DELETED')
      .map(item => ({ label: item.name || 'Untitled workspace', value: idOf(item) }))
      .filter(item => Boolean(item.value))
  );

  readonly folderOptions = computed<SelectOption[]>(() =>
    this.panelFolders()
      .filter(item => item?.status === 'ACTIVE')
      .map(item => ({ label: item.name || 'Untitled folder', value: idOf(item) }))
      .filter(item => Boolean(item.value))
  );

  readonly form = this.fb.group({
    workspaceId: ['', Validators.required],
    workspaceFolderId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(this.nameMaxLength)]],
    color: ['YELLOW', Validators.required]
  });

  get isBusy(): boolean {
    return (
      this.loading() ||
      this.loadingData() ||
      this.loadingWorkspaces() ||
      this.loadingFolders()
    );
  }

  get isEdit(): boolean {
    return this.mode === 'edit';
  }

  get panelTitle(): string {
    return this.mode === 'edit' ? 'Edit column' : 'Create column';
  }

  get eyebrow(): string {
    return this.mode === 'edit' ? 'Update board stage' : 'Add board stage';
  }

  get description(): string {
    return this.mode === 'edit'
      ? 'Update the column details and visual tone.'
      : 'Organise your sticky notes across workflows.';
  }

  get headerIcon() {
    return this.mode === 'edit' ? LucidePencil : LucideColumns3;
  }

  get submitIcon() {
    return this.mode === 'edit' ? LucideCheck : LucidePlus;
  }

  get submitLabel(): string {
    return this.mode === 'edit' ? 'Save column' : 'Create column';
  }

  get panelTone(): SidePanelTone {
    return getNotePanelTone(this.previewColor);
  }

  get previewColor(): string {
    return this.controlString('color').toLowerCase();
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
        return this.mode === 'edit' ? 'Saved' : 'New column';
    }
  });

  get isSystemColumn(): boolean {
    return this.columnMeta()?.isSystem === true;
  }

  get columnTypeLabel(): string {
    return getColumnTypeLabel(this.columnMeta()?.type);
  }

  get canSubmit(): boolean {
    const validationError = validateColumnForm({
      name: this.controlString('name'),
      workspaceId: this.controlString('workspaceId'),
      workspaceFolderId: this.controlString('workspaceFolderId')
    }, {
      NAME_MIN_LENGTH: this.nameMinLength,
      NAME_MAX_LENGTH: this.nameMaxLength
    });

    return !this.isBusy && !validationError;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.open &&
      (changes['open']?.currentValue === true ||
        changes['id'] ||
        changes['mode'] ||
        changes['column'] ||
        changes['workspaceId'] ||
        changes['workspaceFolderId'])
    ) {
      this.initialize();
    }
  }

  controlString(controlName: string): string {
    const value = this.form.get(controlName)?.value;
    return typeof value === 'string' ? value : '';
  }

  updateText(controlName: 'name', value: unknown): void {
    if (this.isBusy) return;
    this.error.set('');
    this.form.controls[controlName].setValue(String(value ?? ''));
    this.saveState.set('editing');
    this.cdr.markForCheck();
  }

  updateSelect(controlName: string, value: unknown): void {
    if (this.isBusy || typeof value !== 'string') return;
    this.error.set('');

    if (controlName === 'color') {
      this.form.controls.color.setValue(value);
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
    this.panelFolders.set([]);
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
    this.saveState.set('editing');
  }

  colorLabel(value: string): string {
    return getColumnColorLabel(value, this.colorOptions);
  }

  colorClass(value: unknown): string {
    return toColorCssClass(value);
  }

  onNameEnter(event: KeyboardEvent): void {
    event.preventDefault();
    (event.target as HTMLElement | null)?.blur();
    if (this.canSubmit) {
      this.submit();
    }
  }

  close(): void {
    if (this.isBusy) return;
    this.error.set('');
    this.closed.emit();
  }

  submit(): void {
    if (!this.canSubmit) return;

    const workspaceId = this.controlString('workspaceId');
    const workspaceFolderId = this.controlString('workspaceFolderId');
    const name = this.controlString('name').trim().replace(/\s+/g, ' ');
    const color = (this.controlString('color') || 'YELLOW') as any;
    const id = this.editorId;

    const isEdit = this.isEdit;

    this.loading.set(true);
    this.saveState.set('saving');
    this.error.set('');

    const request$ = (isEdit && id)
      ? this.columnApi.update(id, { name, color })
      : this.columnApi.create({ workspaceId, workspaceFolderId, name, color });

    request$
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          const savedId = response?.data?.id || response?.data?._id || id;
          this.saveState.set('saved');
          this.form.markAsPristine();

          this.toastService.success(
            isEdit
              ? 'Column updated successfully.'
              : 'Column created successfully.',
            {
              title: isEdit ? 'Column updated' : 'Column created',
              dedupeKey: `column-${savedId || 'new'}`
            }
          );

          this.saved.emit(savedId);
        },
        error: (error: any) => {
          this.saveState.set('error');
          const message = extractErrorMessage(
            error,
            isEdit ? 'Unable to update column.' : 'Unable to create column.'
          );
          this.error.set(message);
          this.toastService.error(message, {
            title: isEdit ? 'Column update failed' : 'Column creation failed',
            dedupeKey: `column-error-${id || 'new'}`
          });
        }
      });
  }

  private resetEditor(): void {
    this.editorId = '';
    this.saveState.set(this.mode === 'edit' ? 'saved' : 'idle');
    this.panelFolders.set([]);
    this.loadingWorkspaces.set(false);
    this.loadingFolders.set(false);
    this.loadingData.set(false);
    this.loading.set(false);
    this.error.set('');
    this.columnMeta.set(null);
    this.form.reset(
      {
        workspaceId: '',
        workspaceFolderId: '',
        name: '',
        color: 'YELLOW'
      },
      { emitEvent: false }
    );
  }

  private initialize(): void {
    this.resetEditor();

    this.editorId = String(this.id || this.column?.id || this.column?._id || '').trim();
    const effectiveWorkspaceId =
      this.workspaceId || idOf(this.column?.workspaceId) || this.columnStore.workspaceId() || '';
    const effectiveFolderId =
      this.workspaceFolderId || idOf(this.column?.workspaceFolderId) || this.columnStore.workspaceFolderId() || '';

    this.loadWorkspaces();

    if (this.mode === 'create') {
      this.setupCreateForm(effectiveWorkspaceId, effectiveFolderId);
      this.focusName();
      return;
    }

    if (this.column) {
      this.setColumnData(this.column, effectiveWorkspaceId, effectiveFolderId);
      this.focusName();
      return;
    }

    if (this.editorId) {
      this.loadColumn(this.editorId, effectiveWorkspaceId, effectiveFolderId);
    }
  }

  private setupCreateForm(workspaceId: string, folderId: string): void {
    this.columnMeta.set({
      type: 'CUSTOM',
      position: 0,
      isSystem: false
    });
    this.form.reset(
      {
        workspaceId,
        workspaceFolderId: folderId,
        name: '',
        color: 'YELLOW'
      },
      { emitEvent: false }
    );

    if (workspaceId) {
      this.loadFolders(workspaceId, folderId);
    }
  }

  private setColumnData(column: any, fallbackWorkspaceId = '', fallbackFolderId = ''): void {
    this.columnMeta.set(column);

    const workspaceId = idOf(column?.workspaceId) || fallbackWorkspaceId;
    const folderId = idOf(column?.workspaceFolderId) || fallbackFolderId;
    const name = column?.name || column?.label || '';
    const color = this.validColor(column?.color) ? column.color : 'YELLOW';

    this.form.patchValue(
      {
        workspaceId,
        workspaceFolderId: folderId,
        name,
        color
      },
      { emitEvent: false }
    );

    if (workspaceId) {
      this.loadFolders(workspaceId, folderId);
    }
  }

  private loadColumn(columnId: string, fallbackWorkspaceId = '', fallbackFolderId = ''): void {
    this.loadingData.set(true);

    this.columnApi
      .getById(columnId)
      .pipe(
        finalize(() => this.loadingData.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          this.setColumnData(response.data, fallbackWorkspaceId, fallbackFolderId);
          this.focusName();
        },
        error: error => {
          const message = extractErrorMessage(error, 'Unable to load column details.');
          this.error.set(message);
          this.toastService.error(message, {
            title: 'Column not loaded',
            dedupeKey: `column-load-${columnId}`
          });
        }
      });
  }

  private loadWorkspaces(): void {
    const stored = this.workspaceStore.workspaces();
    if (stored.length > 0) {
      this.panelWorkspaces.set(stored.filter(item => item?.status !== 'DELETED'));
      return;
    }

    this.loadingWorkspaces.set(true);
    this.workspaceApi
      .getMyWorkspaces({ page: 1, limit: 100, status: 'ACTIVE' })
      .pipe(
        finalize(() => this.loadingWorkspaces.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const list = extractList(response);
          this.panelWorkspaces.set(list.filter((item: any) => item?.status !== 'DELETED'));
        },
        error: error => {
          this.error.set(extractErrorMessage(error, 'Unable to load workspaces.'));
        }
      });
  }

  private loadFolders(workspaceId: string, preferredFolderId?: string): void {
    if (!workspaceId) {
      this.panelFolders.set([]);
      return;
    }

    if (this.workspaceFolderStore.initialized() && this.workspaceFolderStore.workspaceId() === workspaceId) {
      this.setFoldersAndSelect(workspaceId, this.workspaceFolderStore.activeFolders(), preferredFolderId);
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
        sortOrder: 'asc'
      })
      .pipe(
        finalize(() => this.loadingFolders.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          const list = extractList(response);
          const active = list.filter((folder: any) => folder?.status === 'ACTIVE');
          this.setFoldersAndSelect(workspaceId, active, preferredFolderId);
        },
        error: error => {
        this.error.set(
          extractErrorMessage(error, COMMON_MESSAGES.ERROR.LOAD_FAILED('workspace folders'))
        );
        }
      });
  }

  private setFoldersAndSelect(workspaceId: string, folders: readonly any[], preferredFolderId?: string): void {
    const folderList = [...folders];
    this.panelFolders.set(folderList);

    const currentFolderId = this.form.controls.workspaceFolderId.value;
    const resolvedFolderId = resolveDefaultFolderId(folderList, preferredFolderId || currentFolderId);
    this.form.controls.workspaceFolderId.setValue(resolvedFolderId);
  }

  private validColor(value: any): boolean {
    return isValidColumnColor(value, this.colorOptions);
  }

  private focusName(): void {
    setTimeout(() => {
      if (!this.open) return;
      const input = this.columnNameInput?.nativeElement.querySelector('input:not([disabled])') as HTMLInputElement | null;
      if (!input || document.activeElement === input) return;
      input.focus({ preventScroll: true });
      if (this.mode === 'edit' && input.value) {
        input.setSelectionRange(0, input.value.length);
      }
    }, 100);
  }
}
