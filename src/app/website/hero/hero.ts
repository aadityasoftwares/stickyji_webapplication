import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import {
  LucideArrowRight,
  LucideBell,
  LucideCheck,
  LucideCircleCheck,
  LucideHouse,
  LucideLeaf,
  LucideLightbulb,
  LucideNotebook,
  LucidePanelLeft,
  LucidePanelsTopLeft,
  LucideSearch,
  LucideSparkles,
  LucideUser,
} from '@lucide/angular';
import { AppIcon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  @Output() readonly startFree = new EventEmitter<void>();
  @Output() readonly watchDemo = new EventEmitter<void>();
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideBell = LucideBell;
  readonly LucideCheck = LucideCheck;
  readonly LucideCircleCheck = LucideCircleCheck;
  readonly LucideHouse = LucideHouse;
  readonly LucideNotebook = LucideNotebook;
  readonly LucidePanelLeft = LucidePanelLeft;
  readonly LucidePanelsTopLeft = LucidePanelsTopLeft;
  readonly LucideSearch = LucideSearch;
  readonly LucideSparkles = LucideSparkles;
  readonly previewCategories = [
    { title: 'Product Ideas', count: '5 notes', color: 'yellow', icon: LucideLightbulb },
    { title: 'Today’s Tasks', count: '8 tasks', color: 'pink', icon: LucideCheck },
    { title: 'Personal', count: '12 notes', color: 'blue', icon: LucideUser },
    { title: 'Inspiration', count: '6 notes', color: 'green', icon: LucideLeaf },
  ];
}
