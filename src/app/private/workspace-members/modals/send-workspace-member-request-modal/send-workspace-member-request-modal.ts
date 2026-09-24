import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  LucideCheck,
  LucideMail,
  LucideMessageSquareText,
  LucideSend,
  LucideShield,
  LucideUserPlus,
  LucideX
} from '@lucide/angular';

import { Button } from '../../../../shared/components/button/button';
import { Divider } from '../../../../shared/components/divider/divider';
import { AppIcon } from '../../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../../shared/components/input/input';
import { Label } from '../../../../shared/components/label/label';
import { Select, type SelectOption, type SelectValue } from '../../../../shared/components/select/select';
import { ToastService } from '../../../../shared/components/toast/services/toast.service';
import type { WorkspaceMember } from '../../models/workspace-member.models';
import { WorkspaceInvitationApiService } from '../../services/workspace-invitation.service';
import { WorkspaceMemberApiService } from '../../services/workspace-member.service';
import { WorkspaceRoleApiService } from '../../../roles/services/workspace-role.service';
import { WorkspaceRole } from '../../../roles/models/workspace-role.models';

type UnknownRecord = Record<string, unknown>;

@Component({
  selector: 'app-send-workspace-member-request-modal',
  standalone: true,
  imports: [FormsModule, AppIcon, AppInput, Button, Divider, Label, Select],
  templateUrl: './send-workspace-member-request-modal.html',
  styleUrl: './send-workspace-member-request-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SendWorkspaceMemberRequestModal implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly invitationApi = inject(WorkspaceInvitationApiService);
  private readonly memberApi = inject(WorkspaceMemberApiService);
  private readonly roleApi = inject(WorkspaceRoleApiService);
  private readonly toastService = inject(ToastService);

  @Input() open = false;
  @Input() workspaceId = '';
  @Input() member: WorkspaceMember | null = null;

  /** Optional fallback. Normally roles are loaded from WorkspaceRoleApiService. */
  @Input() roleOptions: readonly SelectOption[] = [];

  @Output() readonly closed = new EventEmitter<void>();

  /** Emits a member after role editing and null after sending an invitation. */
  @Output() readonly saved = new EventEmitter<WorkspaceMember | null>();

  readonly LucideCheck = LucideCheck;
  readonly LucideMail = LucideMail;
  readonly LucideMessageSquareText = LucideMessageSquareText;
  readonly LucideSend = LucideSend;
  readonly LucideShield = LucideShield;
  readonly LucideUserPlus = LucideUserPlus;
  readonly LucideX = LucideX;

  readonly email = signal('');
  readonly message = signal('');
  readonly roleId = signal('');
  readonly availableRoleOptions = signal<readonly SelectOption[]>([]);
  readonly loadingRoles = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  private roleRequestVersion = 0;

  get isEdit(): boolean {
    return !!this.member;
  }

  get title(): string {
    return this.isEdit ? 'Change member role' : 'Invite workspace member';
  }

  get eyebrow(): string {
    return this.isEdit ? 'Workspace permissions' : 'Share this sticky space';
  }

  get description(): string {
    return this.isEdit
      ? 'Update this member’s role without changing their membership.'
      : 'Send an email invitation with the access role they will receive after accepting.';
  }

  get submitLabel(): string {
    return this.isEdit ? 'Update role' : 'Send invitation';
  }

  get submitIcon() {
    return this.isEdit ? this.LucideCheck : this.LucideSend;
  }

  get headerIcon() {
    return this.isEdit ? this.LucideShield : this.LucideUserPlus;
  }

  get canSubmit(): boolean {
    const commonValid =
      this.isObjectId(this.workspaceId) &&
      this.isObjectId(this.roleId()) &&
      !this.loadingRoles() &&
      !this.saving();

    return this.isEdit ? commonValid : commonValid && this.isEmail(this.email());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) return;

    if (
      changes['open']?.currentValue === true ||
      changes['member'] ||
      changes['workspaceId']
    ) {
      this.initialize();
      this.loadRoles();
    }
  }

  updateEmail(value: InputValue): void {
    this.email.set(String(value ?? ''));
    this.error.set(null);
  }

  updateMessage(value: InputValue): void {
    this.message.set(String(value ?? ''));
    this.error.set(null);
  }

  updateRoleId(value: SelectValue | SelectValue[] | null): void {
    this.roleId.set(Array.isArray(value) || value === null ? '' : String(value));
    this.error.set(null);
  }

  submit(): void {
    if (this.saving()) return;

    const workspaceId = this.workspaceId.trim();
    const roleId = this.roleId().trim();
    const email = this.email().trim().toLowerCase();
    const message = this.message().trim();

    if (!this.isObjectId(workspaceId)) {
      this.error.set('Choose a valid workspace.');
      return;
    }

    if (!this.isEdit && !this.isEmail(email)) {
      this.error.set('Enter a valid email address.');
      return;
    }

    if (!this.isObjectId(roleId)) {
      this.error.set('Choose a valid workspace role.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    if (this.isEdit) {
      const memberId = this.memberId(this.member!);

      if (!this.isObjectId(memberId)) {
        this.saving.set(false);
        this.error.set('This workspace member is invalid.');
        return;
      }

      this.memberApi
        .assignRole(memberId, roleId)
        .pipe(
          finalize(() => this.saving.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: response => {
            this.toastService.success('Member role was updated.', {
              title: 'Role updated',
              dedupeKey: 'workspace-member-role-success'
            });
            this.saved.emit(response.data);
            this.closed.emit();
          },
          error: error => this.handleSubmitError(error, 'Unable to update member role.', 'Role update failed')
        });

      return;
    }

    this.invitationApi
      .create({
        workspaceId,
        email,
        roleId,
        ...(message ? { message } : {})
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toastService.success(`Invitation sent to ${email}.`, {
            title: 'Invitation sent',
            dedupeKey: `workspace-invitation-success-${email}`
          });
          this.saved.emit(null);
          this.closed.emit();
        },
        error: error => this.handleSubmitError(error, 'Unable to send workspace invitation.', 'Invitation failed')
      });
  }

  close(): void {
    if (this.saving()) return;
    this.closed.emit();
  }

  onBackdropMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }

  private initialize(): void {
    this.error.set(null);
    this.email.set('');
    this.message.set('');
    this.roleId.set(this.member ? this.refId(this.member.roleId) : '');
    this.availableRoleOptions.set(this.safeFallbackOptions());
  }

  private loadRoles(): void {
    const workspaceId = this.workspaceId.trim();
    const requestVersion = ++this.roleRequestVersion;

    if (!this.isObjectId(workspaceId)) {
      this.loadingRoles.set(false);
      this.availableRoleOptions.set(this.safeFallbackOptions());
      return;
    }

    this.loadingRoles.set(true);

    this.roleApi
      .getWorkspaceRoles(workspaceId)
      .pipe(
        finalize(() => {
          if (requestVersion === this.roleRequestVersion) this.loadingRoles.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: roles => {
          if (requestVersion !== this.roleRequestVersion) return;

          const options = roles
            .filter(role => this.canAssignRole(role, workspaceId))
            .map(role => ({
              label: role.displayName || role.name,
              value: this.roleRecordId(role),
              icon: LucideShield
            }));

          this.availableRoleOptions.set(options.length ? options : this.safeFallbackOptions());

          if (!this.isEdit && !this.roleId() && options.length) {
            const defaultRole = roles.find(role =>
              role.isDefault && this.canAssignRole(role, workspaceId)
            );
            this.roleId.set(defaultRole ? this.roleRecordId(defaultRole) : '');
          }
        },
        error: error => {
          if (requestVersion !== this.roleRequestVersion) return;

          const fallback = this.safeFallbackOptions();
          this.availableRoleOptions.set(fallback);

          if (!fallback.length) {
            this.error.set(this.errorMessage(error, 'Unable to load workspace roles.'));
          }
        }
      });
  }

  private canAssignRole(role: WorkspaceRole, workspaceId: string): boolean {
    const code = String(role.code ?? '').trim().toUpperCase();
    const scope = String(role.scope ?? '').trim().toUpperCase();
    const roleWorkspaceId = this.refId(role.workspaceId);

    if (!role.isActive || scope !== 'WORKSPACE' || code === 'WORKSPACE_OWNER') return false;
    return role.isSystem || roleWorkspaceId === workspaceId;
  }

  private safeFallbackOptions(): readonly SelectOption[] {
    return this.roleOptions.filter(option =>
      !String(option.label ?? '').toUpperCase().includes('OWNER')
    );
  }

  private handleSubmitError(error: unknown, fallback: string, title: string): void {
    const message = this.errorMessage(error, fallback);
    this.error.set(message);
    this.toastService.error(message, {
      title,
      dedupeKey: this.isEdit ? 'workspace-member-role-error' : 'workspace-invitation-error'
    });
  }

  private memberId(member: WorkspaceMember): string {
    return String(member.id ?? member._id ?? '');
  }

  private roleRecordId(role: WorkspaceRole): string {
    return String(role.id ?? role._id ?? '');
  }

  private refId(value: unknown): string {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return '';
    const record = value as UnknownRecord;
    return String(record['id'] ?? record['_id'] ?? '');
  }

  private isObjectId(value: unknown): boolean {
    return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value.trim());
  }

  private isEmail(value: unknown): boolean {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback;

    const record = error as UnknownRecord;
    const nested = record['error'];

    if (nested && typeof nested === 'object') {
      const nestedMessage = (nested as UnknownRecord)['message'];
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
    }

    const message = record['message'];
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
