import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { AvatarSize, AvatarShape, AvatarTone, AvatarStatus, Avatar } from '../../../shared/components/avatar/avatar';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';


/**
 * Public aliases preserve a clean members-stack API while keeping every
 * value synchronized with the underlying Avatar component.
 */
export type MembersStackSize = AvatarSize;
export type MembersStackShape = AvatarShape;
export type MembersStackTone = AvatarTone;
export type MembersStackStatus = AvatarStatus;

/**
 * Small UI model intentionally kept independent from workspace members,
 * sticky-note assignees, and API response models.
 */
export interface MembersStackItem {
  id: string;
  name: string;
  src?: string | null;
  alt?: string;
  initials?: string;
  tone?: MembersStackTone;
  status?: MembersStackStatus;
  tooltip?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-members-stack',
  standalone: true,
  imports: [Avatar, Tooltip],
  templateUrl: './members-stack.html',
  styleUrl: './members-stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MembersStack {
  @Input({ required: true }) members: readonly MembersStackItem[] = [];
  @Input() maxVisible = 4;
  @Input() size: MembersStackSize = 'sm';
  @Input() shape: MembersStackShape = 'circle';
  @Input() overlap = 9;
  @Input() showOverflow = true;
  @Input() bordered = true;
  @Input() elevated = false;
  @Input() interactive = false;
  @Input() disabled = false;
  @Input() ariaLabel = 'Members';

  @Output() readonly memberClick =
    new EventEmitter<MembersStackItem>();

  @Output() readonly overflowClick =
    new EventEmitter<number>();

  private readonly automaticTones: readonly AvatarTone[] = [
    'yellow',
    'pink',
    'blue',
    'green',
    'orange',
    'purple'
  ];

  get normalizedMaxVisible(): number {
    if (!Number.isFinite(this.maxVisible)) {
      return 4;
    }

    return Math.max(1, Math.floor(this.maxVisible));
  }

  get visibleMembers(): readonly MembersStackItem[] {
    return this.members.slice(0, this.normalizedMaxVisible);
  }

  get overflowCount(): number {
    return Math.max(
      0,
      this.members.length - this.normalizedMaxVisible
    );
  }

  get hasOverflow(): boolean {
    return this.showOverflow && this.overflowCount > 0;
  }

  get stackLabel(): string {
    const count = this.members.length;

    return `${this.ariaLabel}: ${count} ${count === 1 ? 'person' : 'people'
      }`;
  }

  get sizeName(): string | null {
    return typeof this.size === 'string'
      ? this.size
      : null;
  }

  get customSize(): number | null {
    if (typeof this.size !== 'number') {
      return null;
    }

    return Math.max(20, Math.round(this.size));
  }

  resolvedTone(member: MembersStackItem): AvatarTone {
    if (member.tone) {
      return member.tone;
    }

    const source = `${member.id}:${member.name}`;
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
      hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
    }

    return this.automaticTones[
      (hash >>> 0) % this.automaticTones.length
    ];
  }

  memberTitle(member: MembersStackItem): string {
    return member.tooltip?.trim() || member.name;
  }

  overflowInitials(): string {
    return this.overflowCount > 99
      ? '99+'
      : `+${this.overflowCount}`;
  }

  overflowTitle(): string {
    return `${this.overflowCount} more ${this.overflowCount === 1 ? 'member' : 'members'
      }`;
  }

  itemZIndex(index: number): number {
    return this.visibleMembers.length - index + 1;
  }

  selectMember(
    member: MembersStackItem,
    event: Event
  ): void {
    event.stopPropagation();

    if (
      !this.interactive ||
      this.disabled ||
      member.disabled
    ) {
      return;
    }

    this.memberClick.emit(member);
  }

  selectOverflow(event: Event): void {
    event.stopPropagation();

    if (!this.interactive || this.disabled) {
      return;
    }

    this.overflowClick.emit(this.overflowCount);
  }
}
