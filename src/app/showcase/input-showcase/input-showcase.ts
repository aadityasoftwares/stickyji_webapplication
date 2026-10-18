import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAtSign,
  LucideCalendarDays,
  LucideDollarSign,
  LucideFileText,
  LucideLink,
  LucideLockKeyhole,
  LucideMail,
  LucideSearch,
  LucideTag,
  LucideUser,
} from '@lucide/angular';

import {
  Input,
  type InputAppearance,
  type InputDecoration,
  type InputShape,
  type InputSize,
  type InputVariant,
} from '../../shared/components/input/input';

@Component({
  selector: 'app-input-showcase',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Input],
  templateUrl: './input-showcase.html',
  styleUrl: './input-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputShowcase {
  readonly LucideAtSign = LucideAtSign;
  readonly LucideCalendarDays = LucideCalendarDays;
  readonly LucideDollarSign = LucideDollarSign;
  readonly LucideFileText = LucideFileText;
  readonly LucideLink = LucideLink;
  readonly LucideLockKeyhole = LucideLockKeyhole;
  readonly LucideMail = LucideMail;
  readonly LucideSearch = LucideSearch;
  readonly LucideTag = LucideTag;
  readonly LucideUser = LucideUser;

  name = 'Aaditya';
  search = '';
  password = 'sticky-notes';
  estimate = 125;
  noteContent = 'Remember to review the product launch checklist.';

  readonly emailControl = new FormControl('aaditya@example.com', {
    nonNullable: true,
  });

  readonly titleControl = new FormControl('Product launch ideas', {
    nonNullable: true,
  });

  readonly variants: InputVariant[] = [
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
    'noteBlack',
  ];

  readonly appearances: InputAppearance[] = ['outlined', 'filled', 'underlined'];

  readonly decorations: InputDecoration[] = ['standard', 'tape'];
  readonly shapes: InputShape[] = ['rounded', 'soft', 'square', 'pill'];
  readonly sizes: InputSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

  displayName(value: string): string {
    return value
      .replace(/^note/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (letter) => letter.toUpperCase())
      .trim();
  }

  isNoteVariant(variant: InputVariant): boolean {
    return variant.startsWith('note');
  }

  sizeHeight(size: InputSize): string {
    const heights: Record<InputSize, string> = {
      xs: '28px',
      sm: '36px',
      md: '42px',
      lg: '48px',
      xl: '56px',
    };

    return heights[size];
  }
}
