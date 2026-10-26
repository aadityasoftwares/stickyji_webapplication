import { Tooltip } from '../../../shared/components/tooltip/tooltip';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, finalize, map, takeUntil } from 'rxjs';
import { extractErrorMessage } from '../../../shared/functions/common.function';
import {
  LucideCheck,
  LucideMail,
  LucidePencil,
  LucideSend,
  LucideShield,
  LucideUserPlus,
  LucideX,
} from '@lucide/angular';

import { Badge } from '../../../shared/components/badge/badge';
import { Button } from '../../../shared/components/button/button';
import { AppIcon } from '../../../shared/components/icon/icon';
import { Input as AppInput, type InputValue } from '../../../shared/components/input/input';
import { Label } from '../../../shared/components/label/label';
import {
  Select,
  type SelectOption,
  type SelectValue,
} from '../../../shared/components/select/select';
import { SidePanel } from '../../../shared/components/side-panel/side-panel';
import { Tabs, type TabItem, type TabValue } from '../../../shared/components/tabs/tabs';
import { ToastService } from '../../../shared/components/toast/services/toast.service';

import type { WorkspaceRole } from '../../roles/interfaces/workspace-role.interface';
import { WorkspaceRoleApiService } from '../../roles/services/workspace-role.service';
import type { WorkspaceMember } from '../interfaces/workspace-member.interface';
import type {
  WorkspaceInvitationBatchCreateRequest,
  WorkspaceInvitationBatchCreateResult,
  WorkspaceInvitationCreateItem,
} from '../interfaces/workspace-invitation.interface';
import { WorkspaceInvitationApiService } from '../services/workspace-invitation.service';
import { WorkspaceMemberApiService } from '../services/workspace-member.service';

type InvitationRoleMode = 'same' | 'individual';

@Component({
  selector: 'app-send-workspace-member-request-side-panel',
  standalone: true,
  imports: [Tooltip, FormsModule, AppIcon, AppInput, Badge, Button, Label, Select, SidePanel, Tabs],
  templateUrl: './send-workspace-member-request-side-panel.html',
  styleUrl: './send-workspace-member-request-side-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendWorkspaceMemberRequestSidePanel implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly invitationApi = inject(WorkspaceInvitationApiService);
  private readonly memberApi = inject(WorkspaceMemberApiService);
  private readonly roleApi = inject(WorkspaceRoleApiService);
  private readonly toastService = inject(ToastService);

  @Input() open = false;
  @Input() workspaceId = '';
  @Input() member: WorkspaceMember | null = null;
  @Input() roleOptions: readonly SelectOption[] = [];

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<WorkspaceMember | null>();

  readonly LucideCheck = LucideCheck;
  readonly LucideMail = LucideMail;
  readonly LucidePencil = LucidePencil;
  readonly LucideSend = LucideSend;
  readonly LucideShield = LucideShield;
  readonly LucideUserPlus = LucideUserPlus;
  readonly LucideX = LucideX;

  readonly messageMaxLength = 500;
  readonly maxInviteEmails = 50;

  readonly invitationMode = signal<InvitationRoleMode>('same');
  readonly invitationModeTabs: readonly TabItem[] = [
    {
      value: 'same',
      label: 'Same role',
      icon: LucideShield,
      ariaLabel: 'Assign the same role to all recipients',
    },
    {
      value: 'individual',
      label: 'Individual roles',
      icon: LucideUserPlus,
      ariaLabel: 'Choose a different role for each recipient',
    },
  ];

  @ViewChild('emailInput') emailInput?: AppInput;

  readonly emailDraft = signal('');
  readonly emailInputError = signal<string | null>(null);
  readonly emails = signal<readonly string[]>([]);
  readonly roleId = signal('');
  readonly individualRoleIds = signal<Record<string, string>>({});
  readonly message = signal('');
  readonly availableRoleOptions = signal<readonly SelectOption[]>([]);
  readonly loadingRoles = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  get isEdit(): boolean {
    return !!this.member;
  }

  get title(): string {
    return this.isEdit ? 'Change member role' : 'Invite workspace members';
  }

  get eyebrow(): string {
    return this.isEdit ? 'Workspace permissions' : 'Share this sticky space';
  }

  get description(): string {
    return this.isEdit
      ? 'Update this member’s role without changing their membership.'
      : 'Invite people and choose the access they receive after accepting.';
  }

  get headerNote(): string {
    return this.isEdit ? 'Editing' : 'Invite';
  }

  get headerIcon() {
    return this.isEdit ? this.LucideShield : this.LucideUserPlus;
  }

  get submitIcon() {
    return this.isEdit ? this.LucideCheck : this.LucideSend;
  }

  get panelWidth(): number {
    return this.isEdit ? 580 : 620;
  }

  get isBusy(): boolean {
    return this.saving() || this.loadingRoles();
  }

  get submitLabel(): string {
    if (this.isEdit) return 'Update role';

    const draft = this.emailDraft().trim().toLowerCase();
    const count = this.emails().length || (this.isEmail(draft) ? 1 : 0);
    return count > 1 ? `Send ${count} invitations` : 'Send invitation';
  }

  get statusText(): string {
    if (this.saving()) {
      if (this.isEdit) return 'Updating role…';

      const count = this.emails().length;
      return count > 1 ? `Sending ${count} invitations…` : 'Sending invitation…';
    }

    if (this.loadingRoles()) return 'Loading workspace roles…';
    if (this.isEdit) return 'Workspace permissions';

    const count = this.emails().length;
    if (!count) return `Up to ${this.maxInviteEmails} recipients`;

    const mode = this.invitationMode() === 'same' ? 'Same role' : 'Individual roles';
    return `${count} ${count === 1 ? 'recipient' : 'recipients'} · ${mode}`;
  }

  get canSubmit(): boolean {
    if (this.isBusy || !this.isObjectId(this.workspaceId)) return false;
    if (this.isEdit) return this.isObjectId(this.roleId());

    const emails = this.emails();
    const hasEmails = emails.length > 0 || this.isEmail(this.emailDraft().trim().toLowerCase());
    if (!hasEmails) return false;

    if (this.invitationMode() === 'same') {
      return this.isObjectId(this.roleId());
    }

    return (
      emails.length > 0 && emails.every((email) => this.isObjectId(this.individualRoleId(email)))
    );
  }

  private readonly contextChanged = new Subject<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] || changes['workspaceId'] || changes['member']) {
      this.contextChanged.next();
      this.saving.set(false);
    }
    if (!this.open) return;

    if (changes['open']?.currentValue === true || changes['workspaceId'] || changes['member']) {
      this.resetForm();
      this.loadRoles();
    }
  }

  updateInvitationMode(value: TabValue): void {
    if (this.isEdit || this.saving()) return;

    const mode = String(value);
    if (mode !== 'same' && mode !== 'individual') return;

    this.invitationMode.set(mode);
    if (mode === 'individual') this.syncIndividualRoles();
    this.error.set(null);
  }

  updateEmailDraft(value: InputValue): void {
    this.emailDraft.set(String(value ?? ''));
    this.emailInputError.set(null);
    this.error.set(null);
  }

  clearEmailDraft(): void {
    this.emailDraft.set('');
    this.emailInputError.set(null);
  }

  onEmailBlur(event?: FocusEvent): void {
    if (this.isBusy || !this.open) return;

    const draft = this.emailDraft().trim().toLowerCase();
    if (!draft) return;

    // Check if blur was triggered by clicking cancel, close, or a chip action
    const relatedTarget = event?.relatedTarget as HTMLElement | null;
    if (
      relatedTarget &&
      (relatedTarget.closest('.side-panel-close') ||
        relatedTarget.closest('.invite-cancel-btn') ||
        relatedTarget.closest('.invite-chip-btn'))
    ) {
      if (this.isEmail(draft)) {
        this.addEmail();
      }
      return;
    }

    this.addEmail();
  }

  addEmail(event?: KeyboardEvent): boolean {
    event?.preventDefault();
    if (this.isBusy) return false;

    const raw = this.emailDraft().trim();
    if (!raw) return false;

    const entries = raw
      .split(/[,;\s]+/)
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);

    if (entries.length === 0) return false;

    if (entries.length === 1) {
      const email = entries[0];
      if (this.emails().length >= this.maxInviteEmails) {
        const msg = `You can invite up to ${this.maxInviteEmails} people at once.`;
        this.emailInputError.set(msg);
        this.toastService.error(msg, {
          title: 'Invitation error',
          dedupeKey: 'invite-email-max',
        });
        return false;
      }

      if (!this.isEmail(email)) {
        const msg = 'Enter a valid email address.';
        this.emailInputError.set(msg);
        this.toastService.error(msg, {
          title: 'Validation error',
          dedupeKey: 'invite-email-invalid',
        });
        return false;
      }

      if (this.emails().includes(email)) {
        const msg = 'This email has already been added.';
        this.emailInputError.set(msg);
        this.toastService.error(msg, {
          title: 'Validation error',
          dedupeKey: 'invite-email-duplicate',
        });
        return false;
      }

      this.emails.update((current) => [...current, email]);
      this.emailDraft.set('');
      this.emailInputError.set(null);
      this.error.set(null);
      this.syncIndividualRoles();
      return true;
    }

    // Multiple entries
    let addedCount = 0;
    const currentEmails = [...this.emails()];

    for (const email of entries) {
      if (currentEmails.length >= this.maxInviteEmails) break;
      if (this.isEmail(email) && !currentEmails.includes(email)) {
        currentEmails.push(email);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      this.emails.set(currentEmails);
      this.emailDraft.set('');
      this.emailInputError.set(null);
      this.error.set(null);
      this.syncIndividualRoles();
      return true;
    } else {
      const msg = 'Enter valid email addresses.';
      this.emailInputError.set(msg);
      this.toastService.error(msg, {
        title: 'Validation error',
        dedupeKey: 'invite-email-invalid',
      });
      return false;
    }
  }

  removeEmail(email: string): void {
    if (this.saving()) return;

    const normalizedEmail = email.trim().toLowerCase();
    this.emails.update((current) =>
      current.filter((item) => item.trim().toLowerCase() !== normalizedEmail),
    );

    this.syncIndividualRoles();
    this.emailInputError.set(null);
    this.error.set(null);
  }

  editEmail(email: string): void {
    if (this.saving()) return;
    this.removeEmail(email);
    this.emailDraft.set(email.trim().toLowerCase());
    this.emailInputError.set(null);
    this.error.set(null);
    queueMicrotask(() => {
      this.emailInput?.focus('end');
    });
  }

  updateRoleId(value: SelectValue | SelectValue[] | null): void {
    const roleId = Array.isArray(value) || value === null ? '' : String(value);
    this.roleId.set(roleId);

    if (this.invitationMode() === 'individual') {
      this.syncIndividualRoles();
    }

    this.error.set(null);
  }

  updateIndividualRole(email: string, value: SelectValue | SelectValue[] | null): void {
    if (this.saving()) return;

    const key = email.trim().toLowerCase();
    const roleId = Array.isArray(value) || value === null ? '' : String(value);

    this.individualRoleIds.update((current) => ({
      ...current,
      [key]: roleId,
    }));

    this.error.set(null);
  }

  individualRoleId(email: string): string {
    return this.individualRoleIds()[email.trim().toLowerCase()] ?? '';
  }

  updateMessage(value: InputValue): void {
    this.message.set(String(value ?? '').slice(0, this.messageMaxLength));
    this.error.set(null);
  }

  submit(): void {
    if (this.saving()) return;

    const workspaceId = this.workspaceId.trim();
    if (!this.isObjectId(workspaceId)) {
      this.setError('Choose a valid workspace.', 'invite-workspace-error');
      return;
    }

    if (this.isEdit) {
      this.updateMemberRole();
      return;
    }

    if (this.emailDraft().trim() && !this.addEmail()) return;

    const invitations = this.buildInvitations();
    if (!invitations.length) {
      this.setError('Add at least one email address.', 'invite-emails-empty');
      return;
    }

    const invalidRole = invitations.find((item) => !this.isObjectId(item.roleId));
    if (invalidRole) {
      this.setError(
        this.invitationMode() === 'individual'
          ? `Choose a workspace role for ${invalidRole.email}.`
          : 'Choose a workspace role.',
        'invite-role-invalid',
      );
      return;
    }

    const message = this.message().trim();
    const payload: WorkspaceInvitationBatchCreateRequest = {
      workspaceId,
      invitations: invitations.map((item) => ({
        ...item,
        ...(message ? { message } : {}),
      })),
    };

    this.saving.set(true);
    this.error.set(null);

    this.invitationApi
      .createBatch(payload)
      .pipe(
        map((response) => {
          if (response?.success === false)
            throw new Error(response.message || 'Workspace access update failed.');
          return response;
        }),
        finalize(() => this.saving.set(false)),
        takeUntil(this.contextChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (!response?.data) {
            this.handleError(
              response,
              'Unable to send workspace invitations.',
              'Invitation failed',
            );
            return;
          }
          this.handleInvitationResult(response.data);
        },
        error: (error) =>
          this.handleError(error, 'Unable to send workspace invitations.', 'Invitation failed'),
      });
  }

  close(): void {
    if (!this.saving()) this.closed.emit();
  }

  private updateMemberRole(): void {
    const memberId = this.memberId(this.member);
    const roleId = this.roleId().trim();

    if (!this.isObjectId(memberId)) {
      this.setError('This workspace member is invalid.', 'member-id-invalid');
      return;
    }

    if (!this.isObjectId(roleId)) {
      this.setError('Choose a valid workspace role.', 'member-role-invalid');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.memberApi
      .assignRole(memberId, roleId)
      .pipe(
        map((response) => {
          if (response?.success === false)
            throw new Error(response.message || 'Workspace access update failed.');
          return response;
        }),
        finalize(() => this.saving.set(false)),
        takeUntil(this.contextChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.toastService.success('Member role was updated.', {
            title: 'Role updated',
            dedupeKey: 'workspace-member-role-success',
          });

          this.saved.emit(response?.data ?? null);
          this.closed.emit();
        },
        error: (error) =>
          this.handleError(error, 'Unable to update member role.', 'Role update failed'),
      });
  }

  private buildInvitations(): WorkspaceInvitationCreateItem[] {
    if (this.invitationMode() === 'same') {
      const roleId = this.roleId().trim();
      return this.emails().map((email) => ({ email, roleId }));
    }

    return this.emails().map((email) => ({
      email,
      roleId: this.individualRoleId(email).trim(),
    }));
  }

  private handleInvitationResult(result: WorkspaceInvitationBatchCreateResult): void {
    if (!result?.summary || !Number.isFinite(result.summary.created)) {
      this.handleError(result, 'Unable to read the invitation result.', 'Invitation failed');
      return;
    }
    const { created, emailSent, emailFailed } = result.summary;
    const skippedItems = Array.isArray(result.skipped) ? result.skipped.filter((item) => item) : [];

    if (created > 0) {
      this.toastService.success(
        created === 1
          ? 'Workspace invitation created.'
          : `${created} workspace invitations created.`,
        {
          title: created === 1 ? 'Invitation created' : 'Invitations created',
          dedupeKey: 'workspace-invitations-success',
        },
      );
      this.saved.emit(null);
    }

    if (emailFailed > 0) {
      this.toastService.warning(
        `${emailSent} email${emailSent === 1 ? '' : 's'} sent. ${emailFailed} could not be delivered, but the invitation was created.`,
        {
          title: 'Email delivery issue',
          dedupeKey: 'workspace-invitations-email-warning',
        },
      );
    }

    if (skippedItems.length > 0) {
      const firstSkipped = skippedItems[0];
      const message =
        skippedItems.length === 1
          ? firstSkipped.message
          : `${skippedItems.length} recipients were skipped. ${firstSkipped.message}`;

      this.toastService.warning(message, {
        title: created > 0 ? 'Some recipients were skipped' : 'Invitations not created',
        dedupeKey: 'workspace-invitations-skipped',
      });

      if (created === 0) {
        this.error.set(message);
        return;
      }
    }

    this.closed.emit();
  }

  private loadRoles(): void {
    const workspaceId = this.workspaceId.trim();

    if (!this.isObjectId(workspaceId)) {
      this.availableRoleOptions.set(this.fallbackRoleOptions());
      return;
    }

    this.loadingRoles.set(true);

    this.roleApi
      .getWorkspaceRoles(workspaceId)
      .pipe(
        finalize(() => this.loadingRoles.set(false)),
        takeUntil(this.contextChanged),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (roles) => {
          const assignableRoles = (Array.isArray(roles) ? roles : []).filter(
            (role) => role && this.canAssignRole(role, workspaceId),
          );
          const options = assignableRoles.map<SelectOption>((role) => ({
            label: role.displayName || role.name,
            value: this.roleRecordId(role),
            icon: LucideShield,
          }));

          this.availableRoleOptions.set(options.length ? options : this.fallbackRoleOptions());

          if (!this.isEdit && !this.roleId()) {
            const defaultRole = assignableRoles.find((role) => role.isDefault);
            if (defaultRole) {
              this.roleId.set(this.roleRecordId(defaultRole));
              this.syncIndividualRoles();
            }
          }
        },
        error: (error) => {
          const fallback = this.fallbackRoleOptions();
          this.availableRoleOptions.set(fallback);

          if (!fallback.length) {
            this.setError(
              extractErrorMessage(error, 'Unable to load workspace roles.'),
              'roles-load-error',
            );
          }
        },
      });
  }

  private syncIndividualRoles(): void {
    const current = this.individualRoleIds();
    const defaultRoleId = this.roleId().trim();
    const next: Record<string, string> = {};

    for (const email of this.emails()) {
      const key = email.trim().toLowerCase();
      next[key] = this.isObjectId(current[key])
        ? current[key]
        : this.isObjectId(defaultRoleId)
          ? defaultRoleId
          : '';
    }

    this.individualRoleIds.set(next);
  }

  private resetForm(): void {
    this.emailDraft.set('');
    this.emailInputError.set(null);
    this.emails.set([]);
    this.message.set('');
    this.error.set(null);
    this.invitationMode.set('same');
    this.individualRoleIds.set({});
    this.roleId.set(this.member ? this.refId(this.member.roleId) : '');
    this.availableRoleOptions.set(this.fallbackRoleOptions());
  }

  private canAssignRole(role: WorkspaceRole, workspaceId: string): boolean {
    const code = String(role.code ?? '')
      .trim()
      .toUpperCase();
    const scope = String(role.scope ?? '')
      .trim()
      .toUpperCase();
    const roleWorkspaceId = this.refId(role.workspaceId);

    if (!role.isActive || scope !== 'WORKSPACE' || code === 'WORKSPACE_OWNER') {
      return false;
    }

    return role.isSystem || roleWorkspaceId === workspaceId;
  }

  private fallbackRoleOptions(): readonly SelectOption[] {
    return this.roleOptions.filter(
      (option) =>
        !String(option.label ?? '')
          .toUpperCase()
          .includes('OWNER'),
    );
  }

  private memberId(member: WorkspaceMember | null): string {
    return member ? String(member.id ?? member._id ?? '') : '';
  }

  private roleRecordId(role: WorkspaceRole): string {
    return String(role.id ?? role._id ?? '');
  }

  private refId(value: unknown): string {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return '';

    const record = value as Record<string, unknown>;
    return String(record['id'] ?? record['_id'] ?? '');
  }

  private isObjectId(value: unknown): boolean {
    return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value.trim());
  }

  private isEmail(value: unknown): boolean {
    return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private setError(message: string, dedupeKey?: string): void {
    this.error.set(message);
    this.toastService.error(message, {
      title: 'Invitation error',
      dedupeKey: dedupeKey ?? 'workspace-member-error',
    });
  }

  private handleError(error: any, fallback: string, title: string): void {
    const message = extractErrorMessage(error, fallback);
    this.error.set(message);

    this.toastService.error(message, {
      title,
      dedupeKey: this.isEdit ? 'workspace-member-role-error' : 'workspace-invitation-error',
    });
  }
}
