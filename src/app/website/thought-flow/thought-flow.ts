import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import {
  LucideArrowRight,
  LucideCheck,
  LucideCircleCheckBig,
  LucideInfo,
  LucideLightbulb,
  LucideListChecks,
  LucideSparkles,
  LucideSprout,
} from '@lucide/angular';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Checkbox } from '../../shared/components/checkbox/checkbox';
import { AppIconDefinition, AppIcon } from '../../shared/components/icon/icon';

export type ThoughtFlowStageId = 'capture' | 'organize' | 'finish';

interface ThoughtFlowStage {
  id: ThoughtFlowStageId;
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: AppIconDefinition;
}

@Component({
  standalone: true,
  imports: [AppIcon, Avatar, Checkbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-thought-flow',
  styleUrl: './thought-flow.scss',
  templateUrl: './thought-flow.html',
})
export class ThoughtFlow {
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideInfo = LucideInfo;
  readonly LucideLightbulb = LucideLightbulb;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideSprout = LucideSprout;

  readonly stages: readonly ThoughtFlowStage[] = [
    {
      id: 'capture',
      number: '01',
      eyebrow: 'Catch it',
      title: 'Capture the thought',
      description: 'Save the idea in seconds, before your attention moves somewhere else.',
      icon: LucideLightbulb,
    },
    {
      id: 'organize',
      number: '02',
      eyebrow: 'Make it clear',
      title: 'Shape the next step',
      description: 'Add a tiny checklist, a gentle deadline, or the person who can help.',
      icon: LucideListChecks,
    },
    {
      id: 'finish',
      number: '03',
      eyebrow: 'Feel the progress',
      title: 'Move it to done',
      description: 'Finish without friction and leave your mind with a little more room.',
      icon: LucideCircleCheckBig,
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

    if (!direction && event.key !== 'Home' && event.key !== 'End') {
      return;
    }

    event.preventDefault();

    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? this.stages.length - 1
          : (currentIndex + direction + this.stages.length) % this.stages.length;
    const nextStage = this.stages[nextIndex];
    const tabs = (
      event.currentTarget as HTMLElement
    ).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    this.selectStage(nextStage.id);
    tabs?.[nextIndex]?.focus();
  }

  updateTask(task: keyof ThoughtFlow['checklist'], checked: boolean): void {
    this.checklist = {
      ...this.checklist,
      [task]: checked,
    };
  }
}
