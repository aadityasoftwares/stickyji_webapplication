import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideCalendarDays,
  LucideFileText,
  LucideFolder,
  LucideGlobe,
  LucideHash,
  LucideLock,
  LucideShield,
  LucideStar,
  LucideUsers
} from '@lucide/angular';
import { AppIcon } from '../../../shared/components/icon/icon';
import { MembersStack } from '../../workspace-members/members-stack/members-stack';
import { UserDateTimeFormatterService } from '../../../shared/services/user-date-time-formatter.service';

@Component({
  standalone: true,
  imports: [CommonModule, AppIcon, MembersStack],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-workspace-folder-wrapper',
  styleUrl: './workspace-folder-wrapper.scss',
  templateUrl: './workspace-folder-wrapper.html',
})
export class WorkspaceFolderWrapper {
  private readonly dateTimeFormatter = inject(UserDateTimeFormatterService);

  @Input() name = '';
  @Input() description = '';
  @Input() personal = false;
  @Input() visibility = 'PRIVATE';
  @Input() visibilityLabelOverride?: string;
  @Input() roleLabel = 'Owner';
  @Input() roleIconOverride?: any;
  @Input() typeLabel?: string;
  @Input() typeIconOverride?: any;
  @Input() status = 'ACTIVE';
  @Input() updatedAt: string | Date | null | undefined = null;
  @Input() folderCount: number | null = null;
  @Input() countLabel?: string;
  @Input() countIconOverride?: any;
  @Input() members: any[] = [];
  @Input() memberCount: number | null = null;
  @Input() interactive = false;
  @Input() busy = false;
  @Output() readonly opened = new EventEmitter<MouseEvent>();
  @Output() readonly edited = new EventEmitter<MouseEvent>();
  @Output() readonly keyboardOpened = new EventEmitter<void>();

  readonly Folder = LucideFolder;
  readonly Calendar = LucideCalendarDays;
  readonly Shield = LucideShield;
  readonly Users = LucideUsers;
  readonly Star = LucideStar;
  readonly Hash = LucideHash;
  readonly FileText = LucideFileText;

  get resolvedTypeLabel(): string {
    if (this.typeLabel) return this.typeLabel;
    return this.personal ? 'Personal' : 'Team';
  }

  get typeIcon() {
    if (this.typeIconOverride) return this.typeIconOverride;
    if (this.typeLabel === 'Default') return LucideStar;
    return this.personal ? LucideFolder : LucideUsers;
  }

  get roleIcon() {
    if (this.roleIconOverride) return this.roleIconOverride;
    if (this.roleLabel?.startsWith('#')) return LucideHash;
    if (this.roleLabel === 'Default') return LucideStar;
    return LucideShield;
  }

  get countIcon() {
    if (this.countIconOverride) return this.countIconOverride;
    if (this.countLabel?.includes('note')) return LucideFileText;
    return LucideFolder;
  }

  get visibilityLabel(): string {
    if (this.visibilityLabelOverride) return this.visibilityLabelOverride;
    const value = this.personal ? 'private' : this.visibility.toLowerCase().replaceAll('_', ' ');
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  get visibilityIcon() {
    return this.visibilityLabel === 'Public' ? LucideGlobe : LucideLock;
  }

  get dateLabel(): string {
    return this.dateTimeFormatter.formatDate(this.updatedAt, 'Not saved yet');
  }

  get statusLabel(): string {
    return this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }

  get resolvedCountLabel(): string | null {
    if (this.countLabel) return this.countLabel;
    if (this.folderCount !== null) {
      const count = this.folderCount;
      return `${count} ${count === 1 ? 'folder' : 'folders'}`;
    }
    return null;
  }

  get memberCountLabel(): string {
    const count = this.memberCount ?? this.members?.length ?? 0;
    return `${count} ${count === 1 ? 'member' : 'members'}`;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget || !this.interactive || this.busy) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.keyboardOpened.emit();
    }
  }
}
