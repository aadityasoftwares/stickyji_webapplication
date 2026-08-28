import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  LucideArrowRight,
  LucideBell,
  LucideCalendarDays,
  LucideCheck,
  LucideClock,
  LucidePlay,
  LucidePlus,
  LucideSearch,
  LucideSparkles,
  LucideZap,
} from '@lucide/angular';

import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [AppIcon, Badge, Button, StickyCard],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  @Output() readonly startFree = new EventEmitter<void>();
  @Output() readonly watchDemo = new EventEmitter<void>();

  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideBell = LucideBell;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideCheck = LucideCheck;
  readonly LucideClock = LucideClock;
  readonly LucidePlay = LucidePlay;
  readonly LucidePlus = LucidePlus;
  readonly LucideSearch = LucideSearch;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideZap = LucideZap;
}
