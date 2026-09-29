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
import { Subject, finalize, takeUntil } from 'rxjs';
import {
  LucideCheck,
  LucideFolder,
  LucideFolderOpen,
  LucidePencil,
  LucidePlus,
  LucideStar
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Label } from '../../../shared/components/label/label';
import { Loader } from '../../../shared/components/loader/loader';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { WorkspaceFolderService } from '../services/workspace-folder.service';
import { WorkspaceFolderWrapper } from '../../workspace/workspace-folder-wrapper/workspace-folder-wrapper';
import { extractErrorMessage, idOf } from '../../../shared/functions/common.function';

@Component({
  selector: 'app-add-edit-workspace-folder-side-panel',
  standalone: true,
  imports: [
    Badge,
    FormsModule,
    AppIcon,
    AppInput,
    Button,
    Label,
    Loader,
    SidePanel,
    WorkspaceFolderWrapper
  ],
  templateUrl: './add-edit-workspace-folder-side-panel.html',
  styleUrl: './add-edit-workspace-folder-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditWorkspaceFolderSidePanel implements OnChanges, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly folderApi = inject(WorkspaceFolderService);
  private readonly toastService = inject(ToastService);
  private readonly previewDocument = inject(DOCUMENT);
  private readonly previewRenderer = inject(Renderer2);
  private readonly previewContainer = inject(ViewContainerRef);
  private readonly previewPlatform = inject(PLATFORM_ID);
  private readonly sessionEnd$ = new Subject<void>();

  private desktopPreviewView?: EmbeddedViewRef<unknown>;
  private previewViewReady = false;
  private editorId = '';
  private focusFrame: number | null = null;

  @ViewChild('desktopPreview', { static: true })
  private desktopPreviewTemplate!: TemplateRef<unknown>;

  @ViewChild('folderNameInput', { read: ElementRef })
  private folderNameInput?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() id = '';
  @Input() workspaceId = '';
  @Input() workspaceName = '';
  @Input() folder: any = null;
  @Input() position = 0;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();

  readonly LucideFolder = LucideFolder;
  readonly LucideFolderOpen = LucideFolderOpen;
  readonly LucideStar = LucideStar;
  readonly nameMinLength = 2;
  readonly nameMaxLength = 80;
  readonly descriptionMaxLength = 240;

  readonly loading = signal(false);
  readonly loadingData = signal(false);
  readonly loadFailed = signal(false);
  readonly error = signal('');
  readonly dirty = signal(false);
  readonly name = signal('');
  readonly folderDescription = signal('');
  readonly previewSource = signal<any>(null);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.removeDesktopPreview();
      this.cancelFocus();
      this.sessionEnd$.next();
      this.sessionEnd$.complete();
    });
  }

  ngAfterViewInit(): void {
    this.previewViewReady = true;
    this.scheduleDesktopPreview();
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

  get isBusy(): boolean {
    return this.loading() || this.loadingData();
  }

  get statusText(): string {
    return this.dirty() ? 'Not saved' : this.isEdit ? 'Saved' : 'New folder';
  }

  get canSubmit(): boolean {
    const length = this.name().trim().length;
    return (
      !this.isBusy &&
      !this.loadFailed() &&
      !!this.workspaceId &&
      length >= this.nameMinLength &&
      length <= this.nameMaxLength &&
      this.folderDescription().length <= this.descriptionMaxLength
    );
  }

  get isDefaultFolder(): boolean {
    return this.previewSource()?.isDefault === true;
  }

  get previewPosition(): number {
    if (this.isEdit) {
      const pos = Number(this.previewSource()?.position);
      return Number.isFinite(pos) ? pos + 1 : 1;
    }
    return Math.max(0, Number(this.position) || 0) + 1;
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
    if (this.isBusy || this.loadFailed()) return;
    if (!this.canSubmit) {
      this.error.set(`Folder name must contain ${this.nameMinLength}–${this.nameMaxLength} characters.`);
      this.focusName(false);
      return;
    }

    const id = this.editorId;
    const isEdit = !!id;
    const payload: any = {
      name: this.name().trim().replace(/\s+/g, ' '),
      description: this.folderDescription().trim() || null
    };

    if (!isEdit) {
      payload.workspaceId = this.workspaceId;
      payload.position = Math.max(0, Number(this.position) || 0);
    }

    this.loading.set(true);
    this.error.set('');

    const request$ = isEdit ? this.folderApi.update(id, payload) : this.folderApi.create(payload);

    request$
      .pipe(
        takeUntil(this.sessionEnd$),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response: any) => {
          const savedId = idOf(response?.data) || id;
          this.dirty.set(false);
          this.toastService.success(isEdit ? 'Folder changes were saved.' : 'Folder created successfully.', {
            title: isEdit ? 'Folder updated' : 'Folder created',
            dedupeKey: `workspace-folder-saved-${savedId || 'new'}`
          });
          this.saved.emit(savedId);
        },
        error: error => this.showError(error, isEdit ? 'Unable to update folder.' : 'Unable to create folder.')
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

    if (!this.editorId) {
      this.previewSource.set({
        workspaceId: this.workspaceId,
        position: Math.max(0, Number(this.position) || 0),
        isDefault: false,
        status: 'ACTIVE'
      });
      this.focusName(false);
      return;
    }

    if (this.folder && idOf(this.folder) === this.editorId) {
      this.applyFolder(this.folder);
      this.focusName(true);
      return;
    }

    const id = this.editorId;
    this.loadingData.set(true);
    this.folderApi
      .getById(id)
      .pipe(
        takeUntil(this.sessionEnd$),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingData.set(false))
      )
      .subscribe({
        next: (response: any) => {
          if (!this.open || this.editorId !== id) return;
          this.applyFolder(response?.data);
          this.focusName(true);
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
    const message = extractErrorMessage(error, fallback);
    this.error.set(message);
    this.toastService.error(message, {
      title: 'Workspace folder',
      dedupeKey: `workspace-folder-editor-${this.editorId || 'new'}`
    });
  }

  private scheduleDesktopPreview(): void {
    if (!this.previewViewReady || !isPlatformBrowser(this.previewPlatform)) return;
    queueMicrotask(() => {
      if (this.destroyRef.destroyed) return;
      if (!this.open) {
        this.removeDesktopPreview();
        return;
      }
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

  private focusName(select: boolean): void {
    this.cancelFocus();
    if (typeof requestAnimationFrame !== 'function') return;
    this.focusFrame = requestAnimationFrame(() => {
      this.focusFrame = requestAnimationFrame(() => {
        this.focusFrame = null;
        if (!this.open || this.loadingData()) return;
        const input = this.folderNameInput?.nativeElement.querySelector<HTMLInputElement>('input:not([disabled])');
        input?.focus({ preventScroll: true });
        if (select) input?.select();
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