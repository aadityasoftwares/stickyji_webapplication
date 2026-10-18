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
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LucideCheck, LucideLock, LucidePencil, LucidePlus } from '@lucide/angular';

import { Badge, type BadgeVariant } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Label } from '../../../shared/components/label/label';
import {
  Select,
  type SelectOption,
  type SelectValue,
} from '../../../shared/components/select/select';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { Switch } from '../../../shared/components/switch/switch';
import { ToastService } from '../../../shared/components/toast/services/toast.service';
import { extractErrorMessage, idOf } from '../../../shared/functions/common.function';
import { humanize } from '../../../shared/functions/string.functions';
import {
  Permission,
  PermissionAccess,
  PermissionAction,
  PermissionCreateRequest,
  PermissionUpdateRequest,
} from '../models/permission.models';
import { PermissionApiService } from '../services/permission.service';

export type PermissionEditorMode = 'create' | 'edit' | 'view';

const MODULE_OPTIONS: readonly SelectOption[] = [
  { label: 'Workspace', value: 'WORKSPACE' },
  { label: 'Roles', value: 'ROLES' },
  { label: 'Members', value: 'MEMBERS' },
  { label: 'Notes', value: 'NOTES' },
  { label: 'Folders', value: 'FOLDERS' },
  { label: 'Tasks', value: 'TASKS' },
];

const ACTION_OPTIONS: readonly SelectOption[] = [
  { label: 'Create', value: 'CREATE' },
  { label: 'Read', value: 'READ' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Manage', value: 'MANAGE' },
  { label: 'Invite', value: 'INVITE' },
  { label: 'Assign', value: 'ASSIGN' },
  { label: 'Remove', value: 'REMOVE' },
  { label: 'Archive', value: 'ARCHIVE' },
  { label: 'Move', value: 'MOVE' },
  { label: 'Share', value: 'SHARE' },
  { label: 'Export', value: 'EXPORT' },
  { label: 'Import', value: 'IMPORT' },
  { label: 'Settings', value: 'SETTINGS' },
  { label: 'Transfer', value: 'TRANSFER' },
];

const ACCESS_OPTIONS: readonly SelectOption[] = [
  { label: 'General (Workspace level)', value: 'GENERAL' },
  { label: 'Own (User-owned records)', value: 'OWN' },
  { label: 'Any (All records)', value: 'ANY' },
];

@Component({
  selector: 'app-add-edit-permission-side-panel',
  standalone: true,
  imports: [FormsModule, AppInput, Badge, Button, Label, Select, SidePanel, Switch],
  templateUrl: './add-edit-permission-side-panel.html',
  styleUrl: './add-edit-permission-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditPermissionSidePanel implements OnChanges {
  private readonly permissionApi = inject(PermissionApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  @ViewChild('displayNameInput', { read: ElementRef })
  private displayNameInput?: ElementRef<HTMLElement>;

  @Input() open = false;
  @Input() permission: Permission | null = null;
  @Input() readOnly = false;

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<Permission>();

  readonly LucideCheck = LucideCheck;
  readonly LucideLock = LucideLock;
  readonly LucidePencil = LucidePencil;
  readonly LucidePlus = LucidePlus;

  readonly moduleOptions = MODULE_OPTIONS;
  readonly actionOptions = ACTION_OPTIONS;
  readonly accessOptions = ACCESS_OPTIONS;

  readonly displayName = signal('');
  readonly name = signal('');
  readonly code = signal('');
  readonly module = signal('NOTES');
  readonly action = signal<PermissionAction>('READ');
  readonly access = signal<PermissionAccess>('GENERAL');
  readonly description = signal('');
  readonly sortOrder = signal(0);
  readonly active = signal(true);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  private codeEditedManually = false;

  get mode(): PermissionEditorMode {
    if (this.readOnly) return 'view';
    return this.permission ? 'edit' : 'create';
  }

  get isReadOnly(): boolean {
    return this.mode === 'view';
  }

  get titleText(): string {
    if (this.mode === 'create') return 'Create Permission';
    if (this.mode === 'view') return this.permission?.displayName || 'View Permission';
    return 'Edit Permission';
  }

  get descriptionText(): string {
    if (this.mode === 'view') {
      return this.permission?.isSystem
        ? 'This system permission represents a core application capability and is read-only.'
        : 'Review details and access definition for this permission.';
    }
    return this.mode === 'create'
      ? 'Define a new application permission with module, action, and access constraints.'
      : 'Update permission display name, description, access level, and active status.';
  }

  get headerNote(): string {
    if (this.mode === 'create') return 'New';
    return this.mode === 'view' ? 'Protected' : 'Editing';
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Create permission' : 'Save changes';
  }

  get canSubmit(): boolean {
    if (this.isReadOnly || this.saving()) return false;
    const displayName = this.displayName().trim();
    const code = this.code().trim();
    const name = this.name().trim();
    const module = this.module().trim();
    const action = this.action();

    return (
      displayName.length >= 2 &&
      code.length >= 2 &&
      name.length >= 2 &&
      module.length >= 2 &&
      !!action &&
      /^[A-Z][A-Z0-9_]{1,79}$/.test(code)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.initialize();
      this.focusInput();
    } else if (changes['permission'] && this.open) {
      this.initialize();
    }
  }

  updateDisplayName(value: InputValue): void {
    const text = String(value ?? '').slice(0, 100);
    this.displayName.set(text);
    this.error.set(null);

    if (this.mode === 'create') {
      if (!this.codeEditedManually) {
        this.code.set(this.generateCode(this.module(), this.action(), this.access(), text));
      }
      this.name.set(text.trim().toLowerCase());
    }
  }

  updateCode(value: InputValue): void {
    this.codeEditedManually = true;
    this.code.set(this.normalizeCode(String(value ?? '')).slice(0, 80));
    this.error.set(null);
  }

  updateName(value: InputValue): void {
    this.name.set(
      String(value ?? '')
        .trim()
        .toLowerCase()
        .slice(0, 100),
    );
    this.error.set(null);
  }

  updateModule(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string') return;
    const mod = value.trim().toUpperCase();
    this.module.set(mod);
    this.error.set(null);
    if (this.mode === 'create' && !this.codeEditedManually) {
      this.code.set(this.generateCode(mod, this.action(), this.access(), this.displayName()));
    }
  }

  updateAction(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string') return;
    const act = value.trim().toUpperCase() as PermissionAction;
    this.action.set(act);
    this.error.set(null);
    if (this.mode === 'create' && !this.codeEditedManually) {
      this.code.set(this.generateCode(this.module(), act, this.access(), this.displayName()));
    }
  }

  updateAccess(value: SelectValue | SelectValue[] | null): void {
    if (typeof value !== 'string') return;
    const acc = value.trim().toUpperCase() as PermissionAccess;
    this.access.set(acc);
    this.error.set(null);
    if (this.mode === 'create' && !this.codeEditedManually) {
      this.code.set(this.generateCode(this.module(), this.action(), acc, this.displayName()));
    }
  }

  updateDescription(value: InputValue): void {
    this.description.set(String(value ?? '').slice(0, 400));
    this.error.set(null);
  }

  updateSortOrder(value: InputValue): void {
    const num = Number(value);
    this.sortOrder.set(isNaN(num) ? 0 : Math.max(0, num));
  }

  toggleActive(): void {
    if (this.isReadOnly || this.saving()) return;
    this.active.update((val) => !val);
  }

  submit(): void {
    if (!this.canSubmit) {
      if (!this.isReadOnly) {
        this.error.set('Please fill in all required permission fields with valid values.');
      }
      return;
    }

    const displayName = this.displayName().trim();
    const code = this.code().trim();
    const name = this.name().trim() || displayName.toLowerCase();
    const module = this.module().trim().toUpperCase();
    const action = this.action();
    const access = this.access();
    const description = this.description().trim();
    const sortOrder = this.sortOrder();
    const isActive = this.active();

    this.saving.set(true);
    this.error.set(null);

    if (this.mode === 'create') {
      const payload: PermissionCreateRequest = {
        name,
        displayName,
        code,
        module,
        action,
        access,
        description,
        sortOrder,
        isActive,
      };

      this.permissionApi
        .create(payload)
        .pipe(
          finalize(() => this.saving.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (response) => {
            this.toastService.success(`“${response.data.displayName}” permission created.`, {
              title: 'Permission created',
              dedupeKey: 'permission-create-success',
            });
            this.saved.emit(response.data);
            this.closed.emit();
          },
          error: (error) => {
            const message = extractErrorMessage(error, 'Unable to create permission.');
            this.error.set(message);
            this.toastService.error(message, {
              title: 'Permission creation failed',
              dedupeKey: 'permission-create-error',
            });
          },
        });
      return;
    }

    const permissionId = idOf(this.permission);
    if (!permissionId) {
      this.saving.set(false);
      this.error.set('Invalid permission ID.');
      return;
    }

    const payload: PermissionUpdateRequest = {
      name,
      displayName,
      code,
      module,
      action,
      access,
      description,
      sortOrder,
      isActive,
    };

    this.permissionApi
      .update(permissionId, payload)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.toastService.success(`“${response.data.displayName}” permission updated.`, {
            title: 'Permission updated',
            dedupeKey: 'permission-update-success',
          });
          this.saved.emit(response.data);
          this.closed.emit();
        },
        error: (error) => {
          const message = extractErrorMessage(error, 'Unable to update permission.');
          this.error.set(message);
          this.toastService.error(message, {
            title: 'Permission update failed',
            dedupeKey: 'permission-update-error',
          });
        },
      });
  }

  close(): void {
    if (!this.saving()) {
      this.closed.emit();
    }
  }

  private initialize(): void {
    this.error.set(null);
    this.codeEditedManually = this.mode !== 'create';

    if (!this.permission) {
      this.displayName.set('');
      this.name.set('');
      this.code.set('');
      this.module.set('NOTES');
      this.action.set('READ');
      this.access.set('GENERAL');
      this.description.set('');
      this.sortOrder.set(0);
      this.active.set(true);
      return;
    }

    this.displayName.set(String(this.permission.displayName ?? '').trim());
    this.name.set(String(this.permission.name ?? '').trim());
    this.code.set(
      String(this.permission.code ?? '')
        .trim()
        .toUpperCase(),
    );
    this.module.set(
      String(this.permission.module ?? 'NOTES')
        .trim()
        .toUpperCase(),
    );
    this.action.set(
      String(this.permission.action ?? 'READ')
        .trim()
        .toUpperCase() as PermissionAction,
    );
    this.access.set(
      String(this.permission.access ?? 'GENERAL')
        .trim()
        .toUpperCase() as PermissionAccess,
    );
    this.description.set(String(this.permission.description ?? '').trim());
    this.sortOrder.set(this.permission.sortOrder ?? 0);
    this.active.set(this.permission.isActive !== false);
  }

  private focusInput(): void {
    if (this.isReadOnly) return;
    setTimeout(() => {
      const inputEl = this.displayNameInput?.nativeElement?.querySelector(
        'input',
      ) as HTMLInputElement | null;
      inputEl?.focus();
    }, 100);
  }

  private generateCode(
    module: string,
    action: string,
    access: string,
    displayName: string,
  ): string {
    const mod = this.normalizeCode(module);
    const act = this.normalizeCode(action);
    const acc = access === 'GENERAL' ? '' : `_${this.normalizeCode(access)}`;
    if (mod && act) return `${mod}_${act}${acc}`;
    return this.normalizeCode(displayName);
  }

  private normalizeCode(value: string): string {
    return value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  }

  readonly humanize = humanize;
}
