import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  LucideActivity,
  LucideArrowRight,
  LucideCheck,
  LucideCrown,
  LucideEye,
  LucideMessageCircle,
  LucidePencilLine,
  LucideShieldCheck,
  LucideSparkles,
  LucideUserPlus,
  LucideUsersRound,
} from '@lucide/angular';
import { AvatarTone, AvatarStatus, Avatar } from '../../shared/components/avatar/avatar';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { Divider } from '../../shared/components/divider/divider';
import { AppIcon } from '../../shared/components/icon/icon';
import { Label } from '../../shared/components/label/label';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';


export type WorkspaceRole = 'Owner' | 'Editor' | 'Viewer';
export type CollaborationNoteVariant = 'noteYellow' | 'noteBlue' | 'notePink' | 'noteGreen' | 'notePurple';

export interface CollaborationMember {
  id: string;
  name: string;
  initials: string;
  role: WorkspaceRole;
  isOwner?: boolean;
  avatarTone: AvatarTone;
  status: AvatarStatus;
  noteVariant: CollaborationNoteVariant;
  currentNote: string;
  activity: string;
  activityTime: string;
  permissionSummary: string;
}

interface SharedWorkspaceTask {
  label: string;
  assigneeId: string;
  done: boolean;
}

export const DEMO_WORKSPACE_MEMBERS: readonly CollaborationMember[] = [
  {
    id: 'maya-owner',
    name: 'Maya Shah',
    initials: 'MS',
    role: 'Owner',
    isOwner: true,
    avatarTone: 'purple',
    status: 'online',
    noteVariant: 'notePurple',
    currentNote: 'Keep the launch room calm and clear',
    activity: 'Created the workspace and invited the launch team.',
    activityTime: 'Monday · 9:02 AM',
    permissionSummary: 'Controls members, roles, workspace settings, and billing.',
  },
  {
    id: 'alex-editor',
    name: 'Alex Patel',
    initials: 'AP',
    role: 'Editor',
    avatarTone: 'blue',
    status: 'online',
    noteVariant: 'noteBlue',
    currentNote: 'Polish the mobile onboarding flow',
    activity: 'Moved “Welcome copy” into review and mentioned Maya.',
    activityTime: '12 minutes ago',
    permissionSummary: 'Can create, edit, assign, move, and complete shared notes.',
  },
  {
    id: 'sara-editor',
    name: 'Sara Kim',
    initials: 'SK',
    role: 'Editor',
    avatarTone: 'pink',
    status: 'away',
    noteVariant: 'notePink',
    currentNote: 'Prepare the launch story and visuals',
    activity: 'Added two launch ideas and completed the thumbnail draft.',
    activityTime: '38 minutes ago',
    permissionSummary: 'Can create, edit, assign, move, and complete shared notes.',
  },
  {
    id: 'jordan-viewer',
    name: 'Jordan Lee',
    initials: 'JL',
    role: 'Viewer',
    avatarTone: 'green',
    status: 'offline',
    noteVariant: 'noteGreen',
    currentNote: 'Follow launch progress without changing the board',
    activity: 'Viewed the final checklist and left one comment.',
    activityTime: 'Yesterday · 4:20 PM',
    permissionSummary: 'Can view progress and comment without changing shared notes.',
  },
];

@Component({
  standalone: true,
  imports: [
    AppIcon,
    Avatar,
    Badge,
    Button,
    Checkbox,
    Divider,
    Label,
    StickyCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-collaboration',
  styleUrl: './collaboration.scss',
  templateUrl: './collaboration.html',
})
export class Collaboration {

  readonly LucideActivity = LucideActivity;
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideCrown = LucideCrown;
  readonly LucideEye = LucideEye;
  readonly LucideMessageCircle = LucideMessageCircle;
  readonly LucidePencilLine = LucidePencilLine;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideUserPlus = LucideUserPlus;
  readonly LucideUsersRound = LucideUsersRound;

  private memberItems: readonly CollaborationMember[] = DEMO_WORKSPACE_MEMBERS;

  @Input() workspaceName = 'Launch Room';

  @Input()
  set members(value: readonly CollaborationMember[] | null | undefined) {
    this.memberItems = value?.length ? value : DEMO_WORKSPACE_MEMBERS;

    if (!this.memberItems.some((member) => member.id === this.selectedMemberId)) {
      this.selectedMemberId = this.memberItems[0].id;
    }
  }

  get members(): readonly CollaborationMember[] {
    return this.memberItems;
  }

  @Output() memberChange = new EventEmitter<CollaborationMember>();
  @Output() inviteClick = new EventEmitter<void>();
  @Output() workspaceClick = new EventEmitter<void>();

  selectedMemberId = this.memberItems[0].id;

  readonly sharedTasks: readonly SharedWorkspaceTask[] = [
    { label: 'Approve the homepage copy', assigneeId: 'maya-owner', done: true },
    { label: 'Test mobile onboarding', assigneeId: 'alex-editor', done: false },
    { label: 'Share the launch checklist', assigneeId: 'sara-editor', done: false },
  ];

  taskChecks = this.sharedTasks.map((task) => task.done);

  get activeMember(): CollaborationMember {
    return this.memberItems.find((member) => member.id === this.selectedMemberId) ?? this.memberItems[0];
  }

  get owner(): CollaborationMember {
    return this.memberItems.find((member) => member.isOwner || member.role === 'Owner') ?? this.memberItems[0];
  }

  get completedTaskCount(): number {
    return this.taskChecks.filter(Boolean).length;
  }

  getMemberById(memberId: string): CollaborationMember {
    return this.memberItems.find((member) => member.id === memberId) ?? this.owner;
  }

  selectMember(member: CollaborationMember): void {
    if (member.id === this.selectedMemberId) {
      return;
    }

    this.selectedMemberId = member.id;
    this.memberChange.emit(member);
  }

  updateTask(index: number, checked: boolean): void {
    this.taskChecks = this.taskChecks.map((value, taskIndex) =>
      taskIndex === index ? checked : value,
    );
  }

  onMemberKeydown(event: KeyboardEvent, currentIndex: number): void {
    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;

    if (!direction) {
      return;
    }

    event.preventDefault();

    const nextIndex = (currentIndex + direction + this.memberItems.length) % this.memberItems.length;
    const tabs = (event.currentTarget as HTMLElement)
      .parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    this.selectMember(this.memberItems[nextIndex]);
    tabs?.[nextIndex]?.focus();
  }
}
