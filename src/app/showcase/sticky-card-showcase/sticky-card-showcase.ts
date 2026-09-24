import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Button } from '../../shared/components/button/button';
import {
  CardShape,
  CardVariant,
  StickyCard,
} from '../../shared/components/sticky-card/sticky-card';

interface FoldedNoteExample {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  variant: CardVariant;
  foldSize: number;
  label: string;
}

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
    'stickyFold',
  ];

  readonly foldedNotes: readonly FoldedNoteExample[] = [
    {
      id: 'fold-white',
      title: 'Clean paper note',
      subtitle: 'Default warm-white surface',
      description:
        'The bottom-right corner is physically cut and replaced with a small folded-paper triangle.',
      variant: 'default',
      foldSize: 18,
      label: 'Default',
    },
    {
      id: 'fold-yellow',
      title: 'Launch checklist',
      subtitle: 'Classic yellow sticky note',
      description:
        'Confirm the release build, prepare the announcement, and review the onboarding flow.',
      variant: 'noteYellow',
      foldSize: 20,
      label: 'In progress',
    },
    {
      id: 'fold-black',
      title: 'Important decision',
      subtitle: 'Dark sticky paper',
      description:
        'The fold automatically follows the active card palette and remains readable on dark notes.',
      variant: 'noteBlack',
      foldSize: 18,
      label: 'Priority',
    },
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
