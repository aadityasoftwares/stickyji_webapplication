import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideCalendar,
  LucideCheck,
  LucideClock,
  LucideCopy,
  LucideFileText,
  LucideMail,
  LucideMoreHorizontal,
  LucideShield,
  LucideUserCheck,
  LucideX
} from '@lucide/angular';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { Badge } from '../../../shared/components/badge/badge';
import { idOf } from '../../../shared/functions/common.function';
import { UserDateTimeFormatterService } from '../../../shared/services/user-date-time-formatter.service';
import type {
  WorkspaceInvitation,
  WorkspaceInvitationStatus
} from '../models/workspace-invitation.models';

@Component({
  selector: 'app-invitation-card-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    AppIcon,
    Avatar,
    Badge
  ],
  templateUrl: './invitation-card-wrapper.html',
  styleUrl: './invitation-card-wrapper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitationCardWrapper {
  private readonly dateTimeFormatter = inject(UserDateTimeFormatterService);

  @Input() invitation: WorkspaceInvitation | any = null;
  @Input() email = '';
  @Input() roleName = '';
  @Input() status: WorkspaceInvitationStatus | string = 'PENDING';
  @Input() invitedByName = '';
  @Input() invitedBy: any = null;
  @Input() createdAt: string | Date | null | undefined = null;
  @Input() expiresAt: string | Date | null | undefined = null;
  @Input() message = '';
  @Input() invitationId = '';
  @Input() interactive = true;
  @Input() busy = false;

  @Output() readonly cardClick = new EventEmitter<MouseEvent>();
  @Output() readonly cardDblClick = new EventEmitter<MouseEvent>();
  @Output() readonly cancel = new EventEmitter<void>();

  readonly LucideShield = LucideShield;
  readonly LucideMail = LucideMail;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideClock = LucideClock;
  readonly LucideCopy = LucideCopy;
  readonly LucideCheck = LucideCheck;
  readonly LucideUserCheck = LucideUserCheck;
  readonly LucideFileText = LucideFileText;
  readonly LucideX = LucideX;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;

  emailCopied = false;
  private _copyTimer: ReturnType<typeof setTimeout> | null = null;

  copyEmail(event: MouseEvent): void {
    event.stopPropagation();
    const email = this.resolvedEmail;
    if (!email || this.emailCopied) return;
    navigator.clipboard.writeText(email).then(() => {
      this.emailCopied = true;
      if (this._copyTimer) clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(() => {
        this.emailCopied = false;
        this._copyTimer = null;
      }, 1800);
    }).catch(() => {});
  }

  get resolvedEmail(): string {
    const direct = this.email.trim();
    if (direct) return direct;
    return this.invitation?.email || '';
  }

  get resolvedName(): string {
    const user = this.invitation?.user;
    if (user) {
      const uName = user.displayName || user.name;
      if (uName && String(uName).trim()) return String(uName).trim();
    }
    const direct = this.invitation?.displayName || this.invitation?.name;
    if (direct && String(direct).trim()) return String(direct).trim();
    const email = this.resolvedEmail;
    if (email.includes('@')) {
      const prefix = email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return email || 'Invited User';
  }

  get resolvedRole(): string {
    const direct = this.roleName.trim();
    if (direct) return direct;
    const role = this.invitation?.role;
    if (role && typeof role === 'object') {
      const name = role.name || role.displayName || role.code;
      if (name) return String(name);
    }
    const roleId = this.invitation?.roleId;
    if (roleId && typeof roleId === 'object') {
      const name = roleId.name || roleId.displayName || roleId.code;
      if (name) return String(name);
    }
    return 'Workspace Member';
  }

  get roleBadgeLabel(): string {
    return this.resolvedRole;
  }

  get resolvedStatus(): string {
    return String(this.status || this.invitation?.status || 'PENDING').toUpperCase();
  }

  get isPending(): boolean {
    return this.resolvedStatus === 'PENDING';
  }

  get isExpired(): boolean {
    if (this.resolvedStatus === 'EXPIRED') return true;
    const exp = this.expiresAt ?? this.invitation?.expiresAt;
    if (!exp) return false;
    const date = new Date(exp);
    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
  }

  get canCancel(): boolean {
    return this.isPending && !this.isExpired;
  }

  get displayId(): string {
    const raw = this.invitationId || idOf(this.invitation) || this.invitation?.id || this.invitation?._id || '';
    if (!raw) return '';
    return raw.length > 8 ? '#' + raw.slice(-5).toUpperCase() : raw;
  }

  get invitedByLabel(): string {
    const direct = this.invitedByName.trim();
    if (direct) return direct;
    const invBy = this.invitedBy || this.invitation?.invitedBy || this.invitation?.createdBy;
    if (!invBy) return 'Workspace Admin';
    if (typeof invBy === 'string') return invBy;
    const name = invBy.displayName || invBy.name;
    if (name && String(name).trim()) return String(name).trim();
    const email = invBy.email;
    if (email && String(email).trim()) return String(email).split('@')[0];
    return 'Workspace Admin';
  }

  get createdDateLabel(): string {
    const val = this.createdAt ?? this.invitation?.createdAt;
    return this.dateTimeFormatter.formatDate(val, 'Recently');
  }

  get expiresDateLabel(): string {
    const val = this.expiresAt ?? this.invitation?.expiresAt;
    return this.dateTimeFormatter.formatDate(val, '—');
  }

  get resolvedMessage(): string {
    return String(this.message || this.invitation?.message || '').trim();
  }

  get statusLabel(): string {
    if (this.isExpired && this.isPending) return 'Expired';
    const s = this.resolvedStatus.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  get statusBadgeVariant(): 'success' | 'noteYellow' | 'danger' | 'outline' {
    if (this.resolvedStatus === 'ACCEPTED') return 'success';
    if (this.isPending && !this.isExpired) return 'noteYellow';
    if (this.resolvedStatus === 'CANCELLED') return 'outline';
    return 'danger';
  }

  get themeClasses(): Record<string, boolean> {
    return {
      'invitation-card--pending':   this.isPending && !this.isExpired,
      'invitation-card--accepted':  this.resolvedStatus === 'ACCEPTED',
      'invitation-card--expired':   this.isExpired || this.resolvedStatus === 'EXPIRED',
      'invitation-card--cancelled': this.resolvedStatus === 'CANCELLED',
      'invitation-card--rejected':  this.resolvedStatus === 'REJECTED'
    };
  }

  onCardClick(event: MouseEvent): void {
    if (!this.interactive || this.busy) return;
    this.cardClick.emit(event);
  }

  onCardDblClick(event: MouseEvent): void {
    if (!this.interactive || this.busy) return;
    this.cardDblClick.emit(event);
  }
}
