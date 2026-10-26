import { Tooltip } from '../../shared/components/tooltip/tooltip';
import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import {
  LucideArrowRight,
  LucideBriefcaseBusiness,
  LucideCheck,
  LucideClock3,
  LucideGraduationCap,
  LucideHouse,
  LucidePalette,
  LucideEllipsis,
  LucideLeaf,
  LucideList,
  LucidePin,
  LucideUsersRound,
} from '@lucide/angular';
import { AvatarTone, Avatar } from '../../shared/components/avatar/avatar';
import { AppIconDefinition, AppIcon } from '../../shared/components/icon/icon';

export type UserPersonaId = 'student' | 'professional' | 'creator' | 'life' | 'team';

interface PersonaTask {
  label: string;
  description?: string;
  done: boolean;
}

interface UserPersona {
  id: UserPersonaId;
  label: string;
  shortLabel: string;
  icon: AppIconDefinition;
  avatarTone: AvatarTone;
  avatarName: string;
  avatarInitials: string;
  context: string;
  title: string;
  description: string;
  tasks: readonly PersonaTask[];
  sideNoteTitle: string;
  sideNoteText: string;
  outcome: string;
  quote: string;
}

@Component({
  standalone: true,
  imports: [Tooltip, AppIcon, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-use-cases',
  styleUrl: './use-cases.scss',
  templateUrl: './use-cases.html',
})
export class UseCases {
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideClock3 = LucideClock3;
  readonly LucideEllipsis = LucideEllipsis;
  readonly LucideLeaf = LucideLeaf;
  readonly LucideList = LucideList;
  readonly LucidePin = LucidePin;

  readonly personas: readonly UserPersona[] = [
    {
      id: 'student',
      label: 'Students',
      shortLabel: 'Study',
      icon: LucideGraduationCap,
      avatarTone: 'yellow',
      avatarName: 'Nina Kapoor',
      avatarInitials: 'NK',
      context: 'Exam week',
      title: 'Turn three subjects into one calm study plan',
      description:
        'Keep assignments, revision, and everyday reminders visible without building a complicated system.',
      tasks: [
        {
          label: 'Review chapter four',
          description: 'Highlight the five key formulas',
          done: true,
        },
        { label: 'Finish the lab summary', done: false },
        { label: 'Pack notes for study group', done: false },
      ],
      sideNoteTitle: 'Remember',
      sideNoteText: 'Ask Maya about the diagram after class.',
      outcome: 'Nothing important hiding in five different apps.',
      quote: 'I can see the whole week without feeling the whole week.',
    },
    {
      id: 'professional',
      label: 'Professionals',
      shortLabel: 'Work',
      icon: LucideBriefcaseBusiness,
      avatarTone: 'blue',
      avatarName: 'Arjun Mehta',
      avatarInitials: 'AM',
      context: 'Monday priorities',
      title: 'Keep meaningful work above the meeting noise',
      description:
        'Collect follow-ups, decisions, and your next focused block in one lightweight place.',
      tasks: [
        { label: 'Send the revised proposal', done: true },
        {
          label: 'Prepare three launch decisions',
          description: 'Keep it to one page',
          done: false,
        },
        { label: 'Follow up with product team', done: false },
      ],
      sideNoteTitle: '2:00 PM focus',
      sideNoteText: 'Close chat. Finish the launch story.',
      outcome: 'A workday guided by priorities, not notifications.',
      quote: 'It holds the small commitments my calendar cannot.',
    },
    {
      id: 'creator',
      label: 'Creators',
      shortLabel: 'Create',
      icon: LucidePalette,
      avatarTone: 'pink',
      avatarName: 'Sara Kim',
      avatarInitials: 'SK',
      context: 'Content day',
      title: 'Give unfinished ideas somewhere friendly to grow',
      description:
        'Capture sparks, shape rough concepts, and keep the next publishable idea close.',
      tasks: [
        { label: 'Choose the opening hook', done: true },
        { label: 'Sketch the thumbnail idea', done: true },
        { label: 'Record the first rough take', done: false },
      ],
      sideNoteTitle: 'Tiny spark',
      sideNoteText: 'A series about the messy middle, not just the final result.',
      outcome: 'Ideas stay playful while the process stays visible.',
      quote: 'My rough ideas finally have a home before they become projects.',
    },
    {
      id: 'life',
      label: 'Everyday life',
      shortLabel: 'Life',
      icon: LucideHouse,
      avatarTone: 'green',
      avatarName: 'Jamie Diaz',
      avatarInitials: 'JD',
      context: 'Life admin',
      title: 'Make ordinary life feel a little less scattered',
      description:
        'Groceries, appointments, personal goals, and the one thing you promised not to forget.',
      tasks: [
        { label: 'Book the dentist appointment', done: true },
        { label: 'Pick up groceries on the way home', done: false },
        { label: 'Call Dad before dinner', done: false },
      ],
      sideNoteTitle: 'For Saturday',
      sideNoteText: 'Take the blue jacket for repair.',
      outcome: 'Less remembering. More being present.',
      quote: 'It feels like the note on my fridge, only it comes with me.',
    },
    {
      id: 'team',
      label: 'Small teams',
      shortLabel: 'Team',
      icon: LucideUsersRound,
      avatarTone: 'purple',
      avatarName: 'Maya Shah',
      avatarInitials: 'MS',
      context: 'Launch room',
      title: 'Share the next move without adding process overhead',
      description: 'Give small teams a clear place for ownership, handoffs, and visible progress.',
      tasks: [
        { label: 'Approve the launch copy', done: true },
        { label: 'Confirm support coverage', done: true },
        { label: 'Share the final checklist', done: false },
      ],
      sideNoteTitle: 'Team promise',
      sideNoteText: 'If it changes, update the noteâ€”not another meeting.',
      outcome: 'Everyone sees what is moving and who needs help.',
      quote: 'Enough structure to stay aligned, never enough to slow us down.',
    },
  ];

  @Output() personaChange = new EventEmitter<UserPersonaId>();
  @Output() startClick = new EventEmitter<UserPersonaId>();

  selectedPersonaId: UserPersonaId = 'student';
  taskChecks = this.personas[0].tasks.map((task) => task.done);

  get activePersona(): UserPersona {
    return (
      this.personas.find((persona) => persona.id === this.selectedPersonaId) ?? this.personas[0]
    );
  }

  get completedTaskCount(): number {
    return this.taskChecks.filter(Boolean).length;
  }

  selectPersona(persona: UserPersona): void {
    if (persona.id === this.selectedPersonaId) {
      return;
    }

    this.selectedPersonaId = persona.id;
    this.taskChecks = persona.tasks.map((task) => task.done);
    this.personaChange.emit(persona.id);
  }

  updateTask(index: number, checked: boolean): void {
    this.taskChecks = this.taskChecks.map((value, taskIndex) =>
      taskIndex === index ? checked : value,
    );
  }

  onPersonaKeydown(event: KeyboardEvent, currentIndex: number): void {
    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;

    if (!direction && event.key !== 'Home' && event.key !== 'End') {
      return;
    }

    event.preventDefault();

    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? this.personas.length - 1
          : (currentIndex + direction + this.personas.length) % this.personas.length;
    const tabs = (
      event.currentTarget as HTMLElement
    ).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    this.selectPersona(this.personas[nextIndex]);
    tabs?.[nextIndex]?.focus();
  }

  startForSelectedPersona(): void {
    this.startClick.emit(this.selectedPersonaId);
  }
}
