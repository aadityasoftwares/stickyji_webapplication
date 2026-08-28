import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '../../shared/components/button/button';
import { CardVariant, CardShape, StickyCard } from '../../shared/components/sticky-card/sticky-card';


@Component({
  selector: 'app-sticky-card-showcase',
  imports: [CommonModule, StickyCard, Button],
  styleUrl: './sticky-card-showcase.scss',
  templateUrl: './sticky-card-showcase.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyCardShowcase {
  selectedCard = 'yellow';

  readonly variants: CardVariant[] = [
    'default',
    'paper',
    'glass',
    'dark',
    'noteYellow',
    'noteOrange',
    'notePink',
    'noteRed',
    'noteGreen',
    'noteBlue',
    'notePurple',
    'noteBrown',
  ];

  readonly shapes: CardShape[] = [
    'rounded',
    'soft',
    'square',
    'note',
    'cut',
    'ticket',
    'folded',
  ];

  selectCard(card: string): void {
    this.selectedCard = card;
  }

  displayName(value: string): string {
    return value
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (letter) => letter.toUpperCase());
  }
}
