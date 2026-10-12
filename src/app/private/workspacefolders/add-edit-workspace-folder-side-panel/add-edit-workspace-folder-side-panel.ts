import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, finalize, of, switchMap, takeUntil, throwError } from 'rxjs';
import {
  LucideCheck,
  LucideFileText,
  LucideFolder,
  LucideFolderOpen,
  LucidePencil,
  LucidePlus
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Label } from '../../../shared/components/label/label';
import { Loader } from '../../../shared/components/loader/loader';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { WorkspaceFolderService } from '../services/workspace-folder.service';
import { WorkspaceFolderStore } from '../services/workspace-folder.store';
import { WorkspaceFolderWrapper } from '../../workspace/workspace-folder-wrapper/workspace-folder-wrapper';
import { extractErrorMessage, idOf } from '../../../shared/functions/common.function';
import { VALIDATION_MESSAGES } from '../../../shared/constants/common.messages';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { WorkspaceStore } from '../../workspace/services/workspace.store';
import { canFolderAction, type FolderWorkspaceAccess } from '../../../shared/functions/workspace-folder-access.function';
import type { WorkspaceFolder, WorkspaceFolderUpdateRequest } from '../models/workspace-folder.models';
import { WORKSPACE_FOLDER_MESSAGES } from '../messages/workspace-folder.messages';

@Component({
  selector: 'app-add-edit-workspace-folder-side-panel',
  standalone: true,
  imports: [
    Badge,
    FormsModule,
    AppInput,
    Button,
    Label,
    Loader,
    SidePanel,
    Tooltip,
    WorkspaceFolderWrapper
  ],
  templateUrl: './add-edit-workspace-folder-side-panel.html',
  styleUrl: './add-edit-workspace-folder-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditWorkspaceFolderSidePanel implements OnChanges, AfterViewInit {
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

  private readonly folderApi = inject(WorkspaceFolderService);
  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly folderStore = inject(WorkspaceFolderStore);
  private readonly toastService = inject(ToastService);
  private readonly sessionEnd$ = new Subject<void>();
  private readonly accessWorkspace = signal<FolderWorkspaceAccess | null>(null);
  private editorId = '';
  private focusFrame: number | null = null;

  @ViewChild('folderNameInput', { read: ElementRef })
  private folderNameInput?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() id = '';
  @Input() workspaceId = '';
  @Input() workspaceName = '';
  @Input() folder: WorkspaceFolder | null = null;
  @Input() position = 0;

  @Output() readonly accessDenied = new EventEmitter<void>();
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<WorkspaceFolder>();

  readonly LucideFolder = LucideFolder;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideFileText = LucideFileText;
  readonly nameMinLength = 1;
  readonly nameMaxLength = 100;
  readonly descriptionMaxLength = 500;

  readonly loading = signal(false);
  readonly loadingData = signal(false);
  readonly loadFailed = signal(false);
  readonly error = signal('');
  readonly name = signal('');
  readonly folderDescription = signal('');
  readonly dirty = signal(false);
  readonly previewSource = signal<any | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.removeDesktopPreview();
      this.cancelFocus();
      this.sessionEnd$.next();
      this.sessionEnd$.complete();
    });
  }

  get isEdit(): boolean {
    return !!this.editorId;
  }

  get panelTitle(): string {
    return this.isEdit ? 'Edit folder' : 'Create folder';
  }

  get eyebrow(): string {
    return this.isEdit ? 'Tidy up this folder' : 'A fresh sticky folder';
  }

  get description(): string {
    return 'A focused home for notes inside your workspace.';
  }

  get headerIcon() {
    return this.isEdit ? LucidePencil : LucideFolderOpen;
  }

  get submitIcon() {
    return this.isEdit ? LucideCheck : LucidePlus;
  }

  get submitLabel(): string {
    return this.isEdit ? 'Save changes' : 'Create folder';
  }

  get submitTooltip(): string {
    if (this.loadingData()) return 'Loading folder details';
    if (this.loading()) return this.isEdit ? 'Saving folder changes' : 'Creating folder';
    if (this.loadFailed()) return 'Reload the folder before saving';
    if (!this.authorized) return 'You do not have permission to modify folders in this workspace';
    const length = this.name().trim().length;
    if (length < this.nameMinLength) return `Enter at least ${this.nameMinLength} character for the folder name`;
    if (length > this.nameMaxLength) return `Use no more than ${this.nameMaxLength} characters for the folder name`;
    if (this.folderDescription().length > this.descriptionMaxLength) {
      return `Use no more than ${this.descriptionMaxLength} characters for description`;
    }
    if (this.isEdit && !this.dirty()) return 'Make changes to save';
    return this.isEdit ? 'Save folder changes' : 'Create this folder';
  }

  get isBusy(): boolean {
    return this.loading() || this.loadingData();
  }

  get statusText(): string {
    return this.dirty() ? 'Not saved' : this.isEdit ? 'Saved' : 'New folder';
  }

  get authorized(): boolean {
    return canFolderAction(this.accessWorkspace(), this.isEdit ? this.previewSource() as WorkspaceFolder : null, this.isEdit ? 'canEdit' : 'canCreate');
  }

  get canSubmit(): boolean {
    const length = this.name().trim().length;
    return (
      this.authorized &&
      !this.isBusy &&
      !this.loadFailed() &&
      (!this.isEdit || this.dirty()) &&
      length >= this.nameMinLength &&
      length <= this.nameMaxLength &&
      this.folderDescription().length <= this.descriptionMaxLength
    );
  }

  get isDefaultFolder(): boolean {
    return this.previewSource()?.isDefault === true;
  }

  get previewNotesCountLabel(): string | undefined {
    const folder = this.previewSource();
    if (!folder) return undefined;
    const summary = folder.summary;
    const total = summary?.total ?? summary?.stickyNoteCount ?? summary?.stickyNotesCount ?? folder?.stickyNoteCount ?? folder?.stickyNotesCount;
    if (typeof total === 'number') {
      return `${total} ${total === 1 ? 'note' : 'notes'}`;
    }
    return undefined;
  }

  get previewNotesTooltip(): string | undefined {
    const folder = this.previewSource();
    if (!folder) return undefined;
    const summary = folder.summary;
    const total = summary?.total ?? summary?.stickyNoteCount ?? summary?.stickyNotesCount ?? folder?.stickyNoteCount ?? folder?.stickyNotesCount;
    if (typeof total === 'number') {
      const active = summary?.active ?? total;
      const archived = summary?.archived ?? 0;
      if (summary?.archived !== undefined || archived > 0) {
        return `${total} ${total === 1 ? 'note' : 'notes'} (${active} active, ${archived} archived)`;
      }
      return `${total} ${total === 1 ? 'note' : 'notes'} (${active} active)`;
    }
    return undefined;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.scheduleDesktopPreview();
    if (!this.open) {
      this.removeDesktopPreview();
      this.sessionEnd$.next();
      this.cancelFocus();
      return;
    }
    if (changes['open'] || changes['id'] || changes['workspaceId'] || changes['folder']) {
      this.initialize();
    }
  }

  updateName(value: InputValue): void {
    this.name.set(String(value ?? ''));
    this.markDirty();
  }

  updateDescription(value: InputValue): void {
    this.folderDescription.set(String(value ?? ''));
    this.markDirty();
  }

  submit(): void {
    if (this.isBusy || this.loadFailed() || !this.authorized) return;
    if (!this.canSubmit) {
      this.error.set(VALIDATION_MESSAGES.LENGTH_RANGE('Folder name', this.nameMinLength, this.nameMaxLength));
      this.focusName();
      return;
    }

    const id = this.editorId;
    const isEdit = !!id;
    const payload: WorkspaceFolderUpdateRequest = {
      name: this.name().trim().replace(/\s+/g, ' '),
      description: this.folderDescription().trim() || null
    };

    this.loading.set(true);
    this.error.set('');

    const request$ = isEdit
      ? this.folderApi.update(id, payload)
      : this.folderApi.create({ ...payload, name: payload.name!, workspaceId: this.workspaceId });

    request$.pipe(
      takeUntil(this.sessionEnd$),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: response => {
        this.dirty.set(false);
        const savedId = idOf(response?.data) || id || '';
        this.toastService.success(
          isEdit ? WORKSPACE_FOLDER_MESSAGES.SUCCESS.CHANGES_SAVED : WORKSPACE_FOLDER_MESSAGES.SUCCESS.CREATED,
          {
            title: isEdit ? 'Folder updated' : 'Folder created',
            dedupeKey: `workspace-folder-saved-${savedId || 'new'}`
          }
        );
        if (response?.data) {
          this.folderStore.upsert(response.data);
        }
        this.saved.emit(response?.data);
      },
      error: error => this.showError(
        error,
        isEdit ? WORKSPACE_FOLDER_MESSAGES.ERROR.UPDATE_FAILED : WORKSPACE_FOLDER_MESSAGES.ERROR.CREATE_FAILED
      )
    });
  }

  close(): void {
    if (this.isBusy) return;
    this.sessionEnd$.next();
    this.cancelFocus();
    this.error.set('');
    this.removeDesktopPreview();
    this.closed.emit();
  }

  private initialize(): void {
    this.sessionEnd$.next();
    this.cancelFocus();
    this.error.set('');
    this.loadFailed.set(false);
    this.loading.set(false);
    this.loadingData.set(false);
    this.dirty.set(false);
    this.previewSource.set(null);
    this.name.set('');
    this.folderDescription.set('');

    this.editorId = idOf(this.id || this.folder);

    if (this.folder && idOf(this.folder) === this.editorId) {
      this.applyFolder(this.folder);
    }

    this.accessWorkspace.set(null);
    const id = this.editorId;
    this.loadingData.set(true);
    this.workspaceApi.getById(this.workspaceId).pipe(
      switchMap(response => {
        const workspace = response.data;
        this.accessWorkspace.set(workspace);
        this.workspaceStore.updateWorkspace(this.workspaceId, workspace);
        if (!canFolderAction(workspace, null, 'canCreate')) {
          return throwError(() => ({ status: 403, error: { message: 'Folder write permission is unavailable for this workspace.' } }));
        }
        if (!id) {
          return of({ data: { workspaceId: this.workspaceId, name: '', description: '', position: 0, isDefault: false, status: 'ACTIVE' } as WorkspaceFolder });
        }
        return this.folderApi.getById(id);
      }),
      takeUntil(this.sessionEnd$),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingData.set(false))
    ).subscribe({
      next: response => {
        if (!this.open || this.editorId !== id) return;
        this.applyFolder(response?.data);
        this.focusName();
      },
      error: error => {
        this.loadFailed.set(true);
        this.showError(error, 'Unable to load this folder. Close the panel and try again.');
      }
    });
  }

  private applyFolder(folder: any): void {
    this.previewSource.set(folder);
    this.name.set(String(folder?.name || ''));
    this.folderDescription.set(String(folder?.description || ''));
    this.dirty.set(false);
  }

  private markDirty(): void {
    if (!this.loadFailed()) this.error.set('');
    this.dirty.set(true);
  }

  private showError(error: unknown, fallback: string): void {
    const status = (error as { status?: number } | null)?.status;
    if (status === 401 || status === 403) {
      this.accessWorkspace.set(null);
      this.loadFailed.set(true);
      this.workspaceStore.load(true);
      this.accessDenied.emit();
    }
    const message = extractErrorMessage(error, status === 403 ? 'You do not have permission to perform this action.' : status === 401 ? 'Your session has expired. Please sign in again.' : fallback);
    this.error.set(message);
    this.toastService.error(message, {
      title: 'Workspace folder',
      dedupeKey: `workspace-folder-editor-${this.editorId || 'new'}`
    });
  }

  private focusName(): void {
    this.cancelFocus();
    if (typeof requestAnimationFrame !== 'function') return;
    this.focusFrame = requestAnimationFrame(() => {
      this.focusFrame = requestAnimationFrame(() => {
        this.focusFrame = null;
        if (!this.open || this.loadingData()) return;
        const input = this.folderNameInput?.nativeElement.querySelector<HTMLInputElement>('input:not([disabled])');
        if (!input) return;
        input.focus({ preventScroll: true });
        input.setSelectionRange(input.value.length, input.value.length);
      });
    });
  }

  private cancelFocus(): void {
    if (this.focusFrame !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.focusFrame);
    }
    this.focusFrame = null;
  }
}
