import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
  AfterViewInit,
  EmbeddedViewRef,
  PLATFORM_ID,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, finalize, takeUntil } from 'rxjs';
import { LucideCheck, LucideFolder, LucidePencil, LucidePlus } from '@lucide/angular';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Label } from '../../../shared/components/label/label';
import { Loader } from '../../../shared/components/loader/loader';
import {
  Select,
  type SelectOption,
  type SelectValue,
} from '../../../shared/components/select/select';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { extractErrorMessage } from '../../../shared/functions/api.functions';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceStore } from '../services/workspace.store';
import { WorkspaceFolderWrapper } from '../workspace-folder-wrapper/workspace-folder-wrapper';

@Component({
  selector: 'app-add-edit-workspace-side-panel',
  standalone: true,
  imports: [
    Badge,
    FormsModule,
    AppInput,
    Button,
    Label,
    Loader,
    Select,
    SidePanel,
    Tooltip,
    WorkspaceFolderWrapper,
  ],
  templateUrl: './add-edit-workspace-side-panel.html',
  styleUrl: './add-edit-workspace-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditWorkspaceSidePanel implements OnChanges, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewDocument = inject(DOCUMENT);
  private readonly previewRenderer = inject(Renderer2);
  private readonly previewContainer = inject(ViewContainerRef);
  private readonly previewPlatform = inject(PLATFORM_ID);
  private desktopPreviewView?: EmbeddedViewRef<unknown>;
  private previewViewReady = false;
  @ViewChild('desktopPreview', { static: true })
  private desktopPreviewTemplate!: TemplateRef<unknown>;

  ngAfterViewInit(): void {
    this.previewViewReady = true;
    this.scheduleDesktopPreview();
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

  private readonly workspaceApi = inject(WorkspaceService);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly toastService = inject(ToastService);
  private readonly sessionEnd$ = new Subject<void>();
  private editorId = '';
  private focusFrame: number | null = null;

  @ViewChild('workspaceNameInput', { read: ElementRef })
  private workspaceNameInput?: ElementRef<HTMLElement>;
  @Input() open = false;
  @Input() id = '';
  @Input() workspace: any | null = null;
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<string>();

  readonly LucideFolder = LucideFolder;
  readonly nameMinLength = 2;
  readonly nameMaxLength = 80;
  readonly loading = signal(false);
  readonly loadingData = signal(false);
  readonly loadFailed = signal(false);
  readonly error = signal('');
  readonly name = signal('');
  readonly workspaceDescription = signal('');
  readonly visibility = signal<string>('PRIVATE');
  readonly isPersonal = signal(false);
  readonly dirty = signal(false);
  readonly previewSource = signal<any | null>(null);

  readonly visibilityOptions: readonly SelectOption[] = [
    { label: 'Private', value: 'PRIVATE' },
    { label: 'Invite only', value: 'INVITE_ONLY' },
    { label: 'Public', value: 'PUBLIC' },
  ];

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
    return this.isEdit ? 'Edit workspace' : 'Create workspace';
  }
  get eyebrow(): string {
    return this.isEdit ? 'Tidy up this space' : 'A fresh sticky space';
  }
  get description(): string {
    return 'A space for your notes, folders and ideas.';
  }
  get headerIcon() {
    return this.isEdit ? LucidePencil : LucideFolder;
  }
  get submitIcon() {
    return this.isEdit ? LucideCheck : LucidePlus;
  }
  get submitLabel(): string {
    return this.isEdit ? 'Save changes' : 'Create workspace';
  }
  get submitTooltip(): string {
    if (this.loadingData()) return 'Loading workspace details';
    if (this.loading()) return this.isEdit ? 'Saving workspace changes' : 'Creating workspace';
    if (this.loadFailed()) return 'Reload the workspace before saving';
    const length = this.name().trim().length;
    if (length < this.nameMinLength)
      return `Enter at least ${this.nameMinLength} characters for the workspace name`;
    if (length > this.nameMaxLength)
      return `Use no more than ${this.nameMaxLength} characters for the workspace name`;
    return this.isEdit ? 'Save workspace changes' : 'Create this workspace';
  }
  get isBusy(): boolean {
    return this.loading() || this.loadingData();
  }
  get statusText(): string {
    return this.dirty() ? 'Not saved' : this.isEdit ? 'Saved' : 'New workspace';
  }
  get canSubmit(): boolean {
    const length = this.name().trim().length;
    return (
      !this.isBusy &&
      !this.loadFailed() &&
      length >= this.nameMinLength &&
      length <= this.nameMaxLength
    );
  }
  get previewRole(): string {
    const source = this.previewSource();
    if (source?.role) return source.role;
    if (this.isPersonal()) return 'Personal';
    return 'Owner';
  }
  get previewFolders(): any[] {
    const source = this.previewSource();
    return Array.isArray(source?.summary?.folders)
      ? source.summary.folders
      : Array.isArray(source?.folders)
        ? source.folders
        : [];
  }
  get previewMembers(): any[] {
    const source = this.previewSource();
    const members = Array.isArray(source?.summary?.members)
      ? source.summary.members
      : Array.isArray(source?.members)
        ? source.members
        : [];
    return members.map((member: any, index: number) => {
      const name = String(
        member?.displayName ?? member?.name ?? member?.email ?? 'Workspace member',
      ).trim();
      return {
        id: String(member?.id ?? `preview-member-${index}`),
        name,
        src: member?.avatar ?? member?.avatarUrl,
        alt: name,
        tooltip: member?.role ? `${name} - ${member.role}` : name,
      };
    });
  }
  get previewMemberCount(): number | null {
    const source = this.previewSource();
    if (!source) return null;
    const value = source?.summary?.memberCount ?? source?.memberCount;
    const count = Number(value);
    return Number.isFinite(count) ? Math.max(0, count) : this.previewMembers.length;
  }
  get previewFolderCount(): number | null {
    const source = this.previewSource();
    const value = source?.summary?.folderCount ?? source?.folderCount;
    if (value === undefined || value === null)
      return this.isEdit ? this.previewFolders.length : null;
    const count = Number(value);
    return Number.isFinite(count) ? Math.max(0, count) : null;
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.scheduleDesktopPreview();
    if (!this.open) {
      this.removeDesktopPreview();
      this.sessionEnd$.next();
      this.cancelFocus();
      return;
    }
    if (changes['open'] || changes['id'] || changes['workspace']) this.initialize();
  }

  updateName(value: InputValue): void {
    this.name.set(String(value ?? ''));
    this.markDirty();
  }
  updateDescription(value: InputValue): void {
    this.workspaceDescription.set(String(value ?? ''));
    this.markDirty();
  }
  updateVisibility(value: SelectValue): void {
    if (this.isPersonal()) return;
    const visibility = this.normalizeVisibility(value);
    if (visibility && visibility !== this.visibility()) {
      this.visibility.set(visibility);
      this.markDirty();
    }
  }

  submit(): void {
    if (this.isBusy || this.loadFailed()) return;
    if (!this.canSubmit) {
      const message = `Workspace name must contain ${this.nameMinLength}–${this.nameMaxLength} characters.`;
      this.error.set(message);
      this.toastService.error(message, {
        title: 'Validation error',
        dedupeKey: 'workspace-validation-error',
      });
      return;
    }
    const id = this.editorId;
    const isEdit = !!id;
    const payload: { name: string; description: string | null; visibility?: string } = {
      name: this.name().trim(),
      description: this.workspaceDescription().trim() || null,
      ...(!this.isPersonal() ? { visibility: this.visibility() } : {}),
    };
    const request$ = isEdit
      ? this.workspaceApi.update(id, payload)
      : this.workspaceApi.create(payload);
    this.loading.set(true);
    this.error.set('');
    request$
      .pipe(
        takeUntil(this.sessionEnd$),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.dirty.set(false);
          const savedId = response?.data?.id || id || '';
          this.toastService.success(
            isEdit ? 'Workspace changes were saved.' : 'Workspace created successfully.',
            {
              title: isEdit ? 'Workspace updated' : 'Workspace created',
              dedupeKey: `workspace-saved-${savedId || 'new'}`,
            },
          );
          if (response?.data) {
            this.workspaceStore.upsert(response.data);
          }
          this.saved.emit(savedId);
        },
        error: (error) =>
          this.showError(
            error,
            isEdit ? 'Unable to update workspace.' : 'Unable to create workspace.',
          ),
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
    this.workspaceDescription.set('');
    this.visibility.set('PRIVATE');
    this.isPersonal.set(false);
    this.editorId = String(this.id || this.workspace?.id || '').trim();

    if (!this.editorId) {
      this.focusName();
      return;
    }
    if (this.workspace?.id === this.editorId) {
      this.applyWorkspace(this.workspace);
    }
    const id = this.editorId;
    this.loadingData.set(true);
    this.workspaceApi
      .getById(id)
      .pipe(
        takeUntil(this.sessionEnd$),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingData.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!this.open || this.editorId !== id) return;
          this.applyWorkspace(response.data);
          this.focusName();
        },
        error: (error) => {
          this.loadFailed.set(true);
          this.showError(error, 'Unable to load this workspace. Close the panel and try again.');
        },
      });
  }

  private applyWorkspace(workspace: any): void {
    this.previewSource.set(workspace);
    this.name.set(workspace.name || '');
    this.workspaceDescription.set(workspace.description || '');
    this.isPersonal.set(
      Boolean(
        workspace.isPersonal ||
        workspace.workspaceType === 'PERSONAL' ||
        workspace.label === 'PERSONAL',
      ),
    );
    this.visibility.set(
      this.isPersonal() ? 'PRIVATE' : this.normalizeVisibility(workspace.visibility) || 'PRIVATE',
    );
    this.dirty.set(false);
  }

  private normalizeVisibility(value: unknown): string | null {
    return value === 'PRIVATE' || value === 'PUBLIC' || value === 'INVITE_ONLY' ? value : null;
  }

  private markDirty(): void {
    if (!this.loadFailed()) this.error.set('');
    this.dirty.set(true);
  }

  private showError(error: unknown, fallback: string): void {
    const status = (error as { status?: number } | null)?.status;
    if (status === 401 || status === 403) {
      this.loadFailed.set(true);
    }
    const text = extractErrorMessage(
      error,
      status === 403
        ? 'You do not have permission to perform this action.'
        : status === 401
          ? 'Your session has expired. Please sign in again.'
          : fallback,
    );
    this.error.set(text);
    this.toastService.error(text, {
      title: 'Workspace',
      dedupeKey: `workspace-editor-${this.editorId || 'new'}`,
    });
  }

  private focusName(): void {
    this.cancelFocus();
    if (typeof requestAnimationFrame !== 'function') return;
    this.focusFrame = requestAnimationFrame(() => {
      this.focusFrame = requestAnimationFrame(() => {
        this.focusFrame = null;
        if (!this.open || this.loadingData()) return;
        const input =
          this.workspaceNameInput?.nativeElement.querySelector<HTMLInputElement>(
            'input:not([disabled])',
          );
        if (!input) return;
        input.focus({ preventScroll: true });
        input.setSelectionRange(input.value.length, input.value.length);
      });
    });
  }

  private cancelFocus(): void {
    if (this.focusFrame !== null && typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(this.focusFrame);
    this.focusFrame = null;
  }
}
