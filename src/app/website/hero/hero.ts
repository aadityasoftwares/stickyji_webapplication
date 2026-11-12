import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideCheck,
  LucideSparkles,
  LucideStar,
  LucideUsersRound,
} from '@lucide/angular';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [AppIcon, RouterLink, Button, Badge],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  @Output() readonly startFree = new EventEmitter<void>();
  @Output() readonly watchDemo = new EventEmitter<void>();

  readonly LucideCheck = LucideCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideStar = LucideStar;
  readonly LucideUsersRound = LucideUsersRound;

  onCreateAccountAction(): void {
    this.startFree.emit();
  }
}
