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
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, finalize, takeUntil, timer } from 'rxjs';
import { LucideCheck, LucideLock, LucidePencil, LucidePlus, LucideShield } from '@lucide/angular';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Checkbox } from '../../../shared/components/checkbox/checkbox';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Label } from '../../../shared/components/label/label';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { Switch } from '../../../shared/components/switch/switch';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { extractErrorMessage, idOf } from '../../../shared/functions/common.function';
import { humanize } from '../../../shared/functions/string.functions';
import type { PermissionGroup, Permission } from '../interfaces/permission.interface';
import type {
  WorkspaceRole,
  WorkspaceRoleCreateRequest,
  WorkspaceRoleUpdateRequest,
} from '../interfaces/workspace-role.interface';
import { WorkspaceRoleApiService } from '../services/workspace-role.service';
import { WorkspaceRoleWrapper } from '../../workspace/workspace-role-wrapper/workspace-role-wrapper';

type RoleEditorMode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-add-edit-workspace-role-side-panel',
  standalone: true,
  imports: [
    FormsModule,
    AppIcon,
    AppInput,
    Badge,
    Button,
    Checkbox,
    Label,
    SidePanel,
    Switch,
    WorkspaceRoleWrapper,
  ],
  templateUrl: './add-edit-workspace-role-side-panel.html',
  styleUrl: './add-edit-workspace-role-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditWorkspaceRoleSidePanel implements OnChanges, AfterViewInit {
  private readonly roleApi = inject(WorkspaceRoleApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly previewDocument = inject(DOCUMENT);
  private readonly previewRenderer = inject(Renderer2);
  private readonly previewContainer = inject(ViewContainerRef);
  private readonly previewPlatform = inject(PLATFORM_ID);

  private desktopPreviewView?: EmbeddedViewRef<unknown>;
  private previewViewReady = false;

  @ViewChild('desktopPreview', { static: true })
  private desktopPreviewTemplate!: TemplateRef<unknown>;

  @ViewChild('roleNameInput', { read: ElementRef })
  private roleNameInput?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() workspaceId = '';
  @Input() workspaceLabel = '';
  @Input() role: WorkspaceRole | null = null;
  @Input() permissionGroups: readonly PermissionGroup[] = [];

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<WorkspaceRole>();

  readonly LucideCheck = LucideCheck;
  readonly LucideLock = LucideLock;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;
  readonly LucideShield = LucideShield;

  readonly displayName = signal('');
  readonly code = signal('');
  readonly description = signal('');
  readonly active = signal(true);
  readonly selectedPermissionIds = signal<ReadonlySet<string>>(new Set());
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  private codeEditedManually = false;
  private readonly editorReset = new Subject<void>();
  private readonly permissionGroupsState = signal<readonly PermissionGroup[]>([]);

  readonly totalPermissionCount = computed(() =>
    this.permissionGroupsState().reduce((total, group) => total + group.permissions.length, 0),
  );

  readonly selectedCount = computed(() => this.selectedPermissionIds().size);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.removeDesktopPreview();
    });
  }

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

  get mode(): RoleEditorMode {
    if (!this.role) return 'create';
    return this.role.isDefault ? 'view' : 'edit';
  }

  get isReadOnly(): boolean {
    return this.mode === 'view';
  }

  get isDefaultRole(): boolean {
    return !!this.role?.isDefault;
  }

  get previewPriorityLabel(): string {
    if (this.isDefaultRole) return 'Default role';
    if (this.role?.isSystem) return 'System role';
    return 'Custom role';
  }

  get panelTitle(): string {
    if (this.mode === 'create') return 'Create workspace role';
    if (this.mode === 'view') return this.roleDisplayName(this.role!);
    return 'Edit workspace role';
  }

  get eyebrow(): string {
    if (this.mode === 'create') return 'Workspace permissions';
    return this.role?.isSystem ? 'System role' : 'Custom role';
  }

  get descriptionText(): string {
    if (this.mode === 'view') {
      return 'This protected role is managed by Sticky Ji. You can review its access here.';
    }

    return this.mode === 'create'
      ? `Create a role for ${this.workspaceLabel || 'this workspace'} and choose exactly what it can do.`
      : 'Update this role’s name, status and workspace permissions.';
  }

  get headerNote(): string {
    if (this.mode === 'create') return 'New';
    return 'Editing';
  }

  get headerIcon() {
    if (this.mode === 'view') return this.LucideLock;
    return this.mode === 'create' ? this.LucidePlus : this.LucidePencil;
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Create role' : 'Save changes';
  }

  get submitIcon() {
    return this.mode === 'create' ? this.LucidePlus : this.LucideCheck;
  }

  get isBusy(): boolean {
    return this.saving();
  }

  get statusText(): string {
    if (this.saving()) {
      return this.mode === 'create' ? 'Creating role…' : 'Saving changes…';
    }

    if (this.mode === 'view') return 'Default role · read only';
    return `${this.selectedCount()} of ${this.totalPermissionCount()} permissions selected`;
  }

  get canSubmit(): boolean {
    if (this.isReadOnly || this.saving()) return false;

    const displayName = this.displayName().trim();
    const code = this.code().trim();

    return (
      this.isObjectId(this.workspaceId) &&
      displayName.length >= 2 &&
      displayName.length <= 80 &&
      /^[A-Z][A-Z0-9_]{1,59}$/.test(code)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['permissionGroups']) this.permissionGroupsState.set(this.permissionGroups ?? []);
    if (changes['open'] || changes['role'] || changes['workspaceId']) this.editorReset.next();
    this.scheduleDesktopPreview();
    if (!this.open) {
      this.removeDesktopPreview();
      return;
    }

    if (changes['open']?.currentValue === true || changes['role'] || changes['workspaceId']) {
      this.initialize();
      this.focusInput();
    }
  }

  private focusInput(): void {
    if (this.isReadOnly || !isPlatformBrowser(this.previewPlatform)) return;
    timer(120)
      .pipe(takeUntil(this.editorReset), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const inputEl = this.roleNameInput?.nativeElement?.querySelector(
          'input',
        ) as HTMLInputElement | null;
        inputEl?.focus();
      });
  }

  updateDisplayName(value: InputValue): void {
    const next = String(value ?? '').slice(0, 80);
    this.displayName.set(next);
    this.error.set(null);

    if (!this.codeEditedManually && this.mode === 'create') {
      const generated = this.toRoleCode(next);
      this.code.set(
        (/^[A-Z]/.test(generated) && generated.length >= 2
          ? generated
          : `ROLE_${generated || 'CUSTOM'}`
        ).slice(0, 60),
      );
    }
  }

  updateCode(value: InputValue): void {
    this.codeEditedManually = true;
    this.code.set(this.toRoleCode(String(value ?? '')).slice(0, 60));
    this.error.set(null);
  }

  updateDescription(value: unknown): void {
    this.description.set(String(value ?? '').slice(0, 300));
    this.error.set(null);
  }

  toggleActive(): void {
    if (this.isReadOnly || this.saving()) return;
    this.active.update((value) => !value);
  }

  isPermissionSelected(permission: Permission): boolean {
    const id = this.permissionId(permission);
    return !!id && this.selectedPermissionIds().has(id);
  }

  togglePermission(permission: Permission): void {
    if (this.isReadOnly || this.saving() || permission.isActive === false) return;

    const id = this.permissionId(permission);
    if (!id) return;

    const next = new Set(this.selectedPermissionIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedPermissionIds.set(next);
    this.error.set(null);
  }

  selectedInGroup(group: PermissionGroup): number {
    return group.permissions.reduce(
      (count, permission) => count + (this.isPermissionSelected(permission) ? 1 : 0),
      0,
    );
  }

  isGroupSelected(group: PermissionGroup): boolean {
    return group.permissions.length > 0 && this.selectedInGroup(group) === group.permissions.length;
  }

  isGroupPartiallySelected(group: PermissionGroup): boolean {
    const selected = this.selectedInGroup(group);
    return selected > 0 && selected < group.permissions.length;
  }

  toggleGroup(group: PermissionGroup): void {
    if (this.isReadOnly || this.saving()) return;

    const next = new Set(this.selectedPermissionIds());
    const shouldSelect = !this.isGroupSelected(group);

    for (const permission of group.permissions) {
      if (permission.isActive === false) continue;
      const id = this.permissionId(permission);
      if (!id) continue;
      shouldSelect ? next.add(id) : next.delete(id);
    }

    this.selectedPermissionIds.set(next);
    this.error.set(null);
  }

  submit(): void {
    if (!this.canSubmit) {
      if (!this.isReadOnly) {
        this.setError('Enter a role name and a valid role code before saving.');
      }
      return;
    }

    const displayName = this.displayName().trim();
    const code = this.code().trim();
    const description = this.description().trim();
    const permissions = [...this.selectedPermissionIds()];

    this.saving.set(true);
    this.error.set(null);

    if (this.mode === 'create') {
      const payload: WorkspaceRoleCreateRequest = {
        name: this.toRoleName(displayName),
        displayName,
        code,
        description,
        scope: 'WORKSPACE',
        workspaceId: this.workspaceId.trim(),
        permissions,
        isActive: this.active(),
      };

      this.roleApi
        .create(payload)
        .pipe(
          finalize(() => this.saving.set(false)),
          takeUntil(this.editorReset),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (response) => {
            this.toastService.success(`“${response.data.displayName}” is ready to use.`, {
              title: 'Role created',
              dedupeKey: 'workspace-role-create-success',
            });

            this.removeDesktopPreview();
            this.saved.emit(response.data);
            this.closed.emit();
          },
          error: (error) =>
            this.handleSubmitError(
              error,
              'Unable to create workspace role.',
              'Role creation failed',
            ),
        });

      return;
    }

    const roleId = this.roleId(this.role);
    if (!this.isObjectId(roleId)) {
      this.saving.set(false);
      this.setError('This workspace role is invalid.');
      return;
    }

    const payload: WorkspaceRoleUpdateRequest = {
      name: this.toRoleName(displayName),
      displayName,
      code,
      description,
      permissions,
      isActive: this.active(),
    };

    this.roleApi
      .update(roleId, payload)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntil(this.editorReset),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.toastService.success(`“${response.data.displayName}” was updated.`, {
            title: 'Role updated',
            dedupeKey: 'workspace-role-update-success',
          });

          this.removeDesktopPreview();
          this.saved.emit(response.data);
          this.closed.emit();
        },
        error: (error) =>
          this.handleSubmitError(error, 'Unable to update workspace role.', 'Role update failed'),
      });
  }

  close(): void {
    if (!this.saving()) {
      this.removeDesktopPreview();
      this.closed.emit();
    }
  }

  permissionAccessLabel(permission: Permission): string {
    const access = String(permission.access ?? 'GENERAL').toUpperCase();
    if (access === 'OWN') return 'Own only';
    if (access === 'ANY') return 'Any';
    return 'General';
  }

  permissionActionLabel(permission: Permission): string {
    return this.humanize(permission.action);
  }

  moduleLabel(module: string): string {
    return this.humanize(module);
  }

  permissionId(permission: Permission): string {
    return idOf(permission) || String(permission.code ?? '');
  }

  private initialize(): void {
    this.error.set(null);
    this.codeEditedManually = this.mode !== 'create';

    if (!this.role) {
      this.displayName.set('');
      this.code.set('');
      this.description.set('');
      this.active.set(true);
      this.selectedPermissionIds.set(new Set());
      return;
    }

    this.displayName.set(this.roleDisplayName(this.role));
    this.code.set(
      String(this.role.code ?? '')
        .trim()
        .toUpperCase(),
    );
    this.description.set(String(this.role.description ?? '').trim());
    this.active.set(this.role.isActive !== false);

    const allKnown = this.permissionGroupsState().flatMap((g) => g.permissions);
    const selected = new Set<string>();
    for (const raw of Array.isArray(this.role.permissions) ? this.role.permissions : []) {
      const id = idOf(raw);
      if (id) {
        const match = allKnown.find((p) => p.code?.toUpperCase() === id.toUpperCase());
        selected.add(match ? idOf(match) || id : id);
      } else {
        const code = typeof raw === 'string' ? raw : (raw as { code?: string })?.code;
        if (code) {
          const match = allKnown.find((p) => p.code?.toUpperCase() === String(code).toUpperCase());
          selected.add(match ? idOf(match) || String(code) : String(code));
        }
      }
    }

    this.selectedPermissionIds.set(selected);
  }

  private roleId(role: WorkspaceRole | null | undefined): string {
    return idOf(role);
  }

  private roleDisplayName(role: WorkspaceRole): string {
    return String(role.displayName ?? role.name ?? role.code ?? 'Workspace role').trim();
  }

  private toRoleCode(value: string): string {
    return value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  }

  private toRoleName(value: string): string {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
    return slug || value.trim().toLowerCase();
  }

  private readonly humanize = humanize;

  private isObjectId(value: unknown): boolean {
    return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value.trim());
  }

  private setError(message: string): void {
    this.error.set(message);
    this.toastService.error(message, {
      title: 'Role error',
      dedupeKey: 'workspace-role-validation-error',
    });
  }

  private handleSubmitError(error: unknown, fallback: string, title: string): void {
    const message = extractErrorMessage(error, fallback);
    this.error.set(message);

    this.toastService.error(message, {
      title,
      dedupeKey:
        this.mode === 'create' ? 'workspace-role-create-error' : 'workspace-role-update-error',
    });
  }
}
