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
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import {
  LucideCheck,
  LucideColumns3,
  LucideFolderOpen,
  LucidePanelsTopLeft,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
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

import { extractErrorMessage, extractList, idOf } from '../../../shared/functions/common.function';
import {
  COLUMN_LIMITS,
  STICKY_NOTE_COLUMN_COLOR_OPTIONS,
} from '../../../shared/constants/common.constants';
import {
  getColumnColorLabel,
  getColumnTypeLabel,
  getNotePanelTone,
  isValidColumnColor,
  resolveDefaultFolderId,
  toColorCssClass,
  validateColumnForm,
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
    SidePanel,
  ],
  templateUrl: './add-edit-sticky-note-column-side-panel.html',
  styleUrl: './add-edit-sticky-note-column-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly folderColumns = signal<any[]>([]);
  readonly columnMeta = signal<any>(null);

  private editorId = '';
  private focusFrame: number | null = null;
  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cancelFocus();
    });
  }

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

  readonly positionOptions = computed<SelectOption[]>(() => {
    const columns = this.folderColumns();
    const isEdit = this.isEdit;
    const currentId = this.editorId;
    const currentPos = this.controlNumber('position');

    const total = isEdit ? Math.max(1, columns.length) : columns.length + 1;

    const options: SelectOption[] = [];

    for (let i = 0; i < total; i++) {
      let suffix = '';
      if (isEdit) {
        const colAtIdx = columns[i];
        if (
          idOf(colAtIdx) === currentId ||
          (i === currentPos && (!colAtIdx || idOf(colAtIdx) === currentId))
        ) {
          suffix = ' (Current)';
        } else if (colAtIdx) {
          const colName = colAtIdx.name || colAtIdx.label;
          if (colName) suffix = ` (${colName})`;
        }
      } else {
        if (i < columns.length) {
          const colName = columns[i]?.name || columns[i]?.label;
          if (colName) suffix = ` (${colName})`;
        } else {
          suffix = ' (At end)';
        }
      }

      options.push({
        label: `Position ${i + 1}${suffix}`,
        value: i,
      });
    }

    return options;
  });

  readonly form = this.fb.group({
    workspaceId: ['', Validators.required],
    workspaceFolderId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(this.nameMaxLength)]],
    color: ['YELLOW', Validators.required],
    position: [0],
  });

  get isBusy(): boolean {
    return (
      this.loading() || this.loadingData() || this.loadingWorkspaces() || this.loadingFolders()
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

  private get validationError(): string | null {
    return validateColumnForm(
      {
        name: this.controlString('name'),
        workspaceId: this.controlString('workspaceId'),
        workspaceFolderId: this.controlString('workspaceFolderId'),
      },
      {
        NAME_MIN_LENGTH: this.nameMinLength,
        NAME_MAX_LENGTH: this.nameMaxLength,
      },
    );
  }

  get canSubmit(): boolean {
    return !this.isBusy && !this.validationError;
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
    } else if (changes['open'] && !this.open) {
      this.cancelFocus();
    }
  }

  controlString(controlName: string): string {
    const value = this.form.get(controlName)?.value;
    return typeof value === 'string' ? value : '';
  }

  controlNumber(controlName: string): number {
    const value = this.form.get(controlName)?.value;
    return typeof value === 'number' ? value : Number(value) || 0;
  }

  updateText(controlName: 'name', value: unknown): void {
    if (this.isBusy) return;
    this.error.set('');
    this.form.controls[controlName].setValue(String(value ?? ''));
    this.saveState.set('editing');
    this.cdr.markForCheck();
  }

  updateSelect(controlName: string, value: unknown): void {
    if (this.isBusy) return;
    this.error.set('');

    if (controlName === 'color' && typeof value === 'string') {
      this.form.controls.color.setValue(value);
    } else if (controlName === 'position') {
      const pos = Number(value);
      if (!Number.isNaN(pos)) {
        this.form.controls.position.setValue(pos);
      }
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
    this.folderColumns.set([]);
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

    const workspaceId = this.controlString('workspaceId');
    if (workspaceId && folderId) {
      this.loadFolderColumns(workspaceId, folderId);
    } else {
      this.folderColumns.set([]);
    }
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
    this.cancelFocus();
    this.error.set('');
    this.closed.emit();
  }

  submit(): void {
    if (!this.canSubmit) {
      const err = this.validationError;
      if (err) {
        this.error.set(err);
        this.toastService.error(err, {
          title: 'Validation error',
          dedupeKey: 'column-validation-error',
        });
      }
      return;
    }

    const workspaceId = this.controlString('workspaceId');
    const workspaceFolderId = this.controlString('workspaceFolderId');
    const name = this.controlString('name').trim().replace(/\s+/g, ' ');
    const color = (this.controlString('color') || 'YELLOW') as any;
    const newPosition = this.controlNumber('position');
    const id = this.editorId;

    const isEdit = this.isEdit;

    this.loading.set(true);
    this.saveState.set('saving');
    this.error.set('');

    let currentColumns = [...this.folderColumns()];
    if (
      currentColumns.length === 0 &&
      this.columnStore.contextMatches(workspaceId, workspaceFolderId)
    ) {
      currentColumns = [...this.columnStore.orderedColumns()];
    }

    const originalPosition = Number(this.columnMeta()?.position ?? -1);
    const positionChanged = isEdit && originalPosition >= 0 && newPosition !== originalPosition;

    let reorderedColumnIds: string[] = [];
    let updatedColumnsForStore: any[] = [];

    if (isEdit && positionChanged && currentColumns.length > 1) {
      const prevIdx = currentColumns.findIndex((c) => idOf(c) === id);
      if (prevIdx >= 0) {
        const item = currentColumns.splice(prevIdx, 1)[0];
        currentColumns.splice(newPosition, 0, item);
        updatedColumnsForStore = currentColumns.map((col, idx) => ({ ...col, position: idx }));
        reorderedColumnIds = updatedColumnsForStore.map((col) => idOf(col)).filter(Boolean);
      }
    }

    const baseRequest$ =
      isEdit && id
        ? this.columnApi.update(id, { name, color, position: newPosition })
        : this.columnApi.create({
            workspaceId,
            workspaceFolderId,
            name,
            color,
            position: newPosition,
          });

    const request$ = baseRequest$.pipe(
      switchMap((response: any) => {
        const savedId = response?.data?.id || response?.data?._id || id;

        if (!isEdit && savedId && newPosition < currentColumns.length) {
          const newCols = [...currentColumns];
          newCols.splice(newPosition, 0, { id: savedId, ...response?.data });
          const createReorderIds = newCols.map((c) => idOf(c)).filter(Boolean);
          if (createReorderIds.length > 1) {
            return this.columnApi
              .reorder({
                workspaceId,
                workspaceFolderId,
                columnIds: createReorderIds,
              })
              .pipe(
                map(() => response),
                catchError(() => of(response)),
              );
          }
        }

        if (isEdit && positionChanged && reorderedColumnIds.length > 1) {
          return this.columnApi
            .reorder({
              workspaceId,
              workspaceFolderId,
              columnIds: reorderedColumnIds,
            })
            .pipe(
              map(() => response),
              catchError(() => of(response)),
            );
        }

        return of(response);
      }),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    );

    request$.subscribe({
      next: (response: any) => {
        const savedId = response?.data?.id || response?.data?._id || id;
        this.saveState.set('saved');
        this.form.markAsPristine();

        if (updatedColumnsForStore.length > 0) {
          this.columnStore.setColumns(workspaceId, workspaceFolderId, updatedColumnsForStore);
        }

        this.toastService.success(
          isEdit ? 'Column updated successfully.' : 'Column created successfully.',
          {
            title: isEdit ? 'Column updated' : 'Column created',
            dedupeKey: `column-${savedId || 'new'}`,
          },
        );

        this.saved.emit(savedId);
      },
      error: (error: any) => {
        this.saveState.set('error');
        const message = extractErrorMessage(
          error,
          isEdit ? 'Unable to update column.' : 'Unable to create column.',
        );
        this.error.set(message);
        this.toastService.error(message, {
          title: isEdit ? 'Column update failed' : 'Column creation failed',
          dedupeKey: `column-error-${id || 'new'}`,
        });
      },
    });
  }

  private resetEditor(): void {
    this.cancelFocus();
    this.editorId = '';
    this.saveState.set(this.mode === 'edit' ? 'saved' : 'idle');
    this.panelFolders.set([]);
    this.folderColumns.set([]);
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
        color: 'YELLOW',
        position: 0,
      },
      { emitEvent: false },
    );
  }

  private initialize(): void {
    this.resetEditor();

    this.editorId = String(this.id || this.column?.id || this.column?._id || '').trim();
    const effectiveWorkspaceId =
      this.workspaceId || idOf(this.column?.workspaceId) || this.columnStore.workspaceId() || '';
    const effectiveFolderId =
      this.workspaceFolderId ||
      idOf(this.column?.workspaceFolderId) ||
      this.columnStore.workspaceFolderId() ||
      '';

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
      position: this.folderColumns().length,
      isSystem: false,
    });
    this.form.reset(
      {
        workspaceId,
        workspaceFolderId: folderId,
        name: '',
        color: 'YELLOW',
        position: this.folderColumns().length,
      },
      { emitEvent: false },
    );

    if (workspaceId) {
      this.loadFolders(workspaceId, folderId);
      if (folderId) {
        this.loadFolderColumns(workspaceId, folderId);
      }
    }
  }

  private setColumnData(column: any, fallbackWorkspaceId = '', fallbackFolderId = ''): void {
    this.columnMeta.set(column);

    const workspaceId = idOf(column?.workspaceId) || fallbackWorkspaceId;
    const folderId = idOf(column?.workspaceFolderId) || fallbackFolderId;
    const name = column?.name || column?.label || '';
    const color = this.validColor(column?.color) ? column.color : 'YELLOW';
    const position = Number(column?.position ?? 0) || 0;

    this.form.patchValue(
      {
        workspaceId,
        workspaceFolderId: folderId,
        name,
        color,
        position,
      },
      { emitEvent: false },
    );

    if (workspaceId) {
      this.loadFolders(workspaceId, folderId);
      if (folderId) {
        this.loadFolderColumns(workspaceId, folderId);
      }
    }
  }

  private loadColumn(columnId: string, fallbackWorkspaceId = '', fallbackFolderId = ''): void {
    this.loadingData.set(true);

    this.columnApi
      .getById(columnId)
      .pipe(
        finalize(() => this.loadingData.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.setColumnData(response.data, fallbackWorkspaceId, fallbackFolderId);
          this.focusName();
        },
        error: (error) => {
          const message = extractErrorMessage(error, 'Unable to load column details.');
          this.error.set(message);
          this.toastService.error(message, {
            title: 'Column not loaded',
            dedupeKey: `column-load-${columnId}`,
          });
        },
      });
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
        error: (error) => {
          const message = extractErrorMessage(error, 'Unable to load workspaces.');
          this.error.set(message);
          this.toastService.error(message, {
            title: 'Workspace error',
            dedupeKey: 'column-workspaces-load-error',
          });
        },
      });
  }

  private loadFolders(workspaceId: string, preferredFolderId?: string): void {
    if (!workspaceId) {
      this.panelFolders.set([]);
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
        error: (error) => {
          const message = extractErrorMessage(
            error,
            COMMON_MESSAGES.ERROR.LOAD_FAILED('workspace folders'),
          );
          this.error.set(message);
          this.toastService.error(message, {
            title: 'Folders error',
            dedupeKey: 'column-folders-load-error',
          });
        },
      });
  }

  private setFoldersAndSelect(
    workspaceId: string,
    folders: readonly any[],
    preferredFolderId?: string,
  ): void {
    const folderList = [...folders];
    this.panelFolders.set(folderList);

    const currentFolderId = this.form.controls.workspaceFolderId.value;
    const resolvedFolderId = resolveDefaultFolderId(
      folderList,
      preferredFolderId || currentFolderId,
    );
    this.form.controls.workspaceFolderId.setValue(resolvedFolderId);

    if (workspaceId && resolvedFolderId) {
      this.loadFolderColumns(workspaceId, resolvedFolderId);
    }
  }

  private loadFolderColumns(workspaceId: string, folderId: string): void {
    if (!workspaceId || !folderId) {
      this.folderColumns.set([]);
      return;
    }

    if (
      this.columnStore.initialized() &&
      this.columnStore.contextMatches(workspaceId, folderId) &&
      this.columnStore.columns().length > 0
    ) {
      const cols = [...this.columnStore.orderedColumns()];
      this.folderColumns.set(cols);
      if (this.mode === 'create' && this.controlNumber('position') === 0 && cols.length > 0) {
        this.form.controls.position.setValue(cols.length);
      }
      return;
    }

    this.columnApi
      .getAll({ workspaceId, workspaceFolderId: folderId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const list = extractList(response);
          const sorted = [...list].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          this.folderColumns.set(sorted);
          if (this.mode === 'create' && this.controlNumber('position') === 0 && sorted.length > 0) {
            this.form.controls.position.setValue(sorted.length);
          }
        },
        error: () => {
          this.folderColumns.set([]);
        },
      });
  }

  private validColor(value: any): boolean {
    return isValidColumnColor(value, this.colorOptions);
  }

  private focusName(retries = 2): void {
    this.cancelFocus();
    if (typeof requestAnimationFrame !== 'function') {
      this.focusTimer = setTimeout(() => {
        this.focusTimer = null;
        this.applyInputFocus(retries);
      }, 50);
      return;
    }

    this.focusFrame = requestAnimationFrame(() => {
      this.focusFrame = requestAnimationFrame(() => {
        this.focusFrame = null;
        this.applyInputFocus(retries);
      });
    });
  }

  private cancelFocus(): void {
    if (this.focusFrame !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.focusFrame);
    }
    this.focusFrame = null;

    if (this.focusTimer !== null) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }
  }

  private applyInputFocus(retries: number): void {
    if (!this.open || this.loadingData()) return;
    const input =
      this.columnNameInput?.nativeElement.querySelector<HTMLInputElement>('input:not([disabled])');
    if (!input) {
      if (retries > 0) {
        this.focusTimer = setTimeout(() => {
          this.focusTimer = null;
          this.applyInputFocus(retries - 1);
        }, 50);
      }
      return;
    }

    input.focus({ preventScroll: true });
    const len = input.value?.length ?? this.controlString('name').length;
    if (typeof input.setSelectionRange === 'function') {
      try {
        input.setSelectionRange(len, len);
      } catch {
        // Safe fallback
      }
    }
  }
}
