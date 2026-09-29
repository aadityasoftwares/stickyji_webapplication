import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideCalendar,
  LucideCheck,
  LucideClock,
  LucideCopy,
  LucideCrown,
  LucideEye,
  LucideMail,
  LucideMoreHorizontal,
  LucidePencil,
  LucideRotateCcw,
  LucideShield,
  LucideStar,
  LucideUser,
  LucideUserCheck
} from '@lucide/angular';

import { AppIcon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { Badge } from '../../../shared/components/badge/badge';
import {
  getWorkspaceMemberAvatar,
  getWorkspaceMemberId,
  getWorkspaceMemberName,
  getWorkspaceMemberRole
} from '../../../shared/functions/workspace-member.function';
import { idOf } from '../../../shared/functions/common.function';
import type { WorkspaceMemberStatus } from '../models/workspace-member.models';

@Component({
  selector: 'app-member-card-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    AppIcon,
    Avatar,
    Badge
  ],
  templateUrl: './member-card-wrapper.html',
  styleUrl: './member-card-wrapper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberCardWrapper {
  @Input() member: any = null;
  @Input() name = '';
  @Input() email = '';
  @Input() roleName = '';
  @Input() status: WorkspaceMemberStatus | string = 'ACTIVE';
  @Input() avatarUrl: string | null = null;
  @Input() isOwner = false;
  @Input() isCurrentUser = false;
  @Input() isRemoved = false;
  @Input() joinedAt: string | Date | null | undefined = null;
  @Input() lastActiveAt: string | Date | null | undefined = null;
  @Input() addedBy: any = null;
  @Input() addedByName = '';
  @Input() memberId = '';
  @Input() interactive = true;
  @Input() busy = false;

  @Output() readonly cardClick = new EventEmitter<MouseEvent>();
  @Output() readonly cardDblClick = new EventEmitter<MouseEvent>();
  @Output() readonly viewAccess = new EventEmitter<void>();
  @Output() readonly editRole = new EventEmitter<void>();

  readonly LucideShield = LucideShield;
  readonly LucideMail = LucideMail;
  readonly LucideCalendar = LucideCalendar;
  readonly LucideClock = LucideClock;
  readonly LucideCopy = LucideCopy;
  readonly LucideCheck = LucideCheck;
  readonly LucideUser = LucideUser;
  readonly LucideUserCheck = LucideUserCheck;
  readonly LucideStar = LucideStar;
  readonly LucideCrown = LucideCrown;
  readonly LucideMoreHorizontal = LucideMoreHorizontal;
  readonly LucideEye = LucideEye;
  readonly LucidePencil = LucidePencil;
  readonly LucideRotateCcw = LucideRotateCcw;

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

  get resolvedName(): string {
    const direct = this.name.trim();
    if (direct) return direct;
    return getWorkspaceMemberName(this.member, 'Workspace member');
  }

  get resolvedEmail(): string {
    const direct = this.email.trim();
    if (direct) return direct;
    return this.member?.user?.email || this.member?.email || '';
  }

  /** Reads ownership flags only — no call to resolvedRole to avoid circular dependency. */
  private get _isOwnerRaw(): boolean {
    return this.isOwner || this.member?.isOwner === true;
  }

  get resolvedRole(): string {
    const direct = this.roleName.trim();
    if (direct) return direct;
    return getWorkspaceMemberRole(this.member, this._isOwnerRaw ? 'Owner' : 'Workspace Member');
  }

  get resolvedAvatar(): string | null {
    if (this.avatarUrl !== null && this.avatarUrl !== undefined) {
      return this.avatarUrl;
    }
    return getWorkspaceMemberAvatar(this.member);
  }

  get resolvedStatus(): string {
    return String(this.status || this.member?.status || 'ACTIVE').toUpperCase();
  }

  get resolvedIsOwner(): boolean {
    return (
      this._isOwnerRaw ||
      this.resolvedRole.toLowerCase() === 'owner'
    );
  }

  get resolvedIsCurrentUser(): boolean {
    return this.isCurrentUser || this.member?.isCurrentUser === true;
  }

  get resolvedIsRemoved(): boolean {
    return this.isRemoved || this.resolvedStatus === 'REMOVED';
  }

  get displayId(): string {
    const raw = this.memberId || idOf(this.member);
    if (!raw) return '';
    return raw.length > 8 ? '#' + raw.slice(-5).toUpperCase() : raw;
  }

  get addedByLabel(): string {
    const direct = this.addedByName.trim();
    if (direct) return direct;
    const addedByObj = this.addedBy || this.member?.addedBy;
    if (!addedByObj) {
      return this.resolvedIsOwner ? 'Workspace Creator' : 'Workspace Admin';
    }
    if (typeof addedByObj === 'string') {
      return addedByObj;
    }
    const name = addedByObj.displayName || addedByObj.name;
    if (name && String(name).trim()) {
      return String(name).trim();
    }
    const email = addedByObj.email;
    if (email && String(email).trim()) {
      return String(email).split('@')[0];
    }
    return this.resolvedIsOwner ? 'Workspace Creator' : 'Workspace Admin';
  }

  get joinedDateLabel(): string {
    const val = this.joinedAt ?? this.member?.joinedAt ?? this.member?.createdAt;
    if (!val) return 'Recently';
    const date = new Date(val);
    return Number.isNaN(date.getTime())
      ? 'Recently'
      : new Intl.DateTimeFormat('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(date);
  }

  get hasLastActive(): boolean {
    return Boolean(this.lastActiveAt ?? this.member?.lastActiveAt);
  }

  get lastActiveLabel(): string {
    const val = this.lastActiveAt ?? this.member?.lastActiveAt;
    if (!val) return 'Not active yet';
    const date = new Date(val);
    if (Number.isNaN(date.getTime())) return 'Not active yet';

    const diffMin = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (diffMin < 1) return 'Active just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
  }

  get statusLabel(): string {
    const s = this.resolvedStatus.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  get statusBadgeVariant(): 'success' | 'noteYellow' | 'danger' | 'outline' {
    if (this.resolvedIsRemoved) return 'outline';
    if (this.resolvedStatus === 'ACTIVE') return 'success';
    if (this.resolvedStatus === 'PENDING' || this.resolvedStatus === 'INVITED') return 'noteYellow';
    return 'outline';
  }

  get avatarStatus(): 'online' | 'offline' | 'away' {
    if (this.resolvedIsRemoved) return 'offline';
    if (this.resolvedStatus === 'ACTIVE') return 'online';
    return 'away';
  }

  get roleIcon() {
    if (this.resolvedIsOwner) return LucideCrown;
    return LucideShield;
  }

  get roleBadgeLabel(): string {
    if (this.resolvedIsOwner) return 'Owner';
    return this.resolvedRole;
  }

  get themeClasses(): Record<string, boolean> {
    return {
      'member-card--owner':   this.resolvedIsOwner,
      'member-card--removed': this.resolvedIsRemoved,
      'member-card--member':  !this.resolvedIsOwner && !this.resolvedIsRemoved
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
