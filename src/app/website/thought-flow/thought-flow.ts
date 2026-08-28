import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  LucideArrowRight,
  LucideCheck,
  LucideCircleCheckBig,
  LucideClock3,
  LucideLightbulb,
  LucideListChecks,
  LucideSparkles,
  LucideUsers,
} from '@lucide/angular';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { Divider } from '../../shared/components/divider/divider';
import { AppIconDefinition, AppIcon } from '../../shared/components/icon/icon';
import { LabelVariant, Label } from '../../shared/components/label/label';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';


export type ThoughtFlowStageId = 'capture' | 'organize' | 'finish';

interface ThoughtFlowStage {
  id: ThoughtFlowStageId;
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: AppIconDefinition;
  labelVariant: LabelVariant;
}

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
  selector: 'app-thought-flow',
  styleUrl: './thought-flow.scss',
  templateUrl: './thought-flow.html',
})
export class ThoughtFlow {

  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideClock3 = LucideClock3;
  readonly LucideLightbulb = LucideLightbulb;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideUsers = LucideUsers;

  readonly stages: readonly ThoughtFlowStage[] = [
    {
      id: 'capture',
      number: '01',
      eyebrow: 'Catch it',
      title: 'Capture the thought',
      description: 'Save the idea in seconds, before your attention moves somewhere else.',
      icon: LucideLightbulb,
      labelVariant: 'noteYellow',
    },
    {
      id: 'organize',
      number: '02',
      eyebrow: 'Make it clear',
      title: 'Shape the next step',
      description: 'Add a tiny checklist, a gentle deadline, or the person who can help.',
      icon: LucideListChecks,
      labelVariant: 'noteBlue',
    },
    {
      id: 'finish',
      number: '03',
      eyebrow: 'Feel the progress',
      title: 'Move it to done',
      description: 'Finish without friction and leave your mind with a little more room.',
      icon: LucideCircleCheckBig,
      labelVariant: 'noteGreen',
    },
  ];

  @Output() stageChange = new EventEmitter<ThoughtFlowStageId>();
  @Output() exploreClick = new EventEmitter<void>();

  selectedStage: ThoughtFlowStageId = 'capture';

  checklist = {
    headline: true,
    mobileCopy: true,
    finalReview: false,
  };

  get activeStage(): ThoughtFlowStage {
    return this.stages.find((stage) => stage.id === this.selectedStage) ?? this.stages[0];
  }

  get completedTaskCount(): number {
    return Object.values(this.checklist).filter(Boolean).length;
  }

  selectStage(stage: ThoughtFlowStageId): void {
    if (this.selectedStage === stage) {
      return;
    }

    this.selectedStage = stage;
    this.stageChange.emit(stage);
  }

  onStageKeydown(event: KeyboardEvent, currentIndex: number): void {
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

    const nextIndex = (currentIndex + direction + this.stages.length) % this.stages.length;
    const nextStage = this.stages[nextIndex];
    const tabs = (event.currentTarget as HTMLElement)
      .parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    this.selectStage(nextStage.id);
    tabs?.[nextIndex]?.focus();
  }

  updateTask(task: keyof any['checklist'], checked: boolean): void {
    this.checklist = {
      ...this.checklist,
      [task]: checked,
    };
  }
}
