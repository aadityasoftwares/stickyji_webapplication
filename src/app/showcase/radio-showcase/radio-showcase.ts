import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Radio,
  type RadioSize,
  type RadioValue,
  type RadioVariant,
} from '../../shared/components/radio/radio';
import { Divider } from '../../shared/components/divider/divider';

interface RadioVariantExample {
  readonly label: string;
  readonly variant: RadioVariant;
}

interface Workspace {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly tone: RadioVariant;
}

@Component({
  selector: 'app-radio-showcase',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Radio,
    Divider,
  ],
  templateUrl: './radio-showcase.html',
  styleUrl: './radio-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioShowcase {
  protected readonly semanticVariants: ReadonlyArray<RadioVariantExample> = [
    { label: 'Primary', variant: 'primary' },
    { label: 'Secondary', variant: 'secondary' },
    { label: 'Accent', variant: 'accent' },
    { label: 'Success', variant: 'success' },
    { label: 'Warning', variant: 'warning' },
    { label: 'Danger', variant: 'danger' },
    { label: 'Information', variant: 'info' },
  ];

  protected readonly noteVariants: ReadonlyArray<RadioVariantExample> = [
    { label: 'Yellow note', variant: 'noteYellow' },
    { label: 'Orange note', variant: 'noteOrange' },
    { label: 'Pink note', variant: 'notePink' },
    { label: 'Red note', variant: 'noteRed' },
    { label: 'Green note', variant: 'noteGreen' },
    { label: 'Blue note', variant: 'noteBlue' },
    { label: 'Purple note', variant: 'notePurple' },
    { label: 'Brown note', variant: 'noteBrown' },
    { label: 'Black note', variant: 'noteBlack' },
  ];

  protected readonly sizes: ReadonlyArray<{
    readonly label: string;
    readonly size: RadioSize;
  }> = [
      { label: 'Extra small', size: 'xs' },
      { label: 'Small', size: 'sm' },
      { label: 'Medium', size: 'md' },
      { label: 'Large', size: 'lg' },
    ];

  protected readonly workspaces: ReadonlyArray<Workspace> = [
    {
      id: 1,
      name: 'Product design',
      description: 'Roadmaps, research, and design reviews.',
      tone: 'noteYellow',
    },
    {
      id: 2,
      name: 'Engineering',
      description: 'Technical notes, incidents, and decisions.',
      tone: 'noteBlue',
    },
    {
      id: 3,
      name: 'Personal',
      description: 'Private ideas, reminders, and lists.',
      tone: 'notePink',
    },
  ];

  protected selectedTone = 'yellow';
  protected selectedPriority = 'normal';

  protected readonly settingsForm = new FormGroup({
    view: new FormControl('grid', { nonNullable: true }),
    reminder: new FormControl('daily', { nonNullable: true }),
    visibility: new FormControl('workspace', { nonNullable: true }),
    requiredChoice: new FormControl<string | null>(null, {
      validators: [Validators.required],
    }),
  });

  protected readonly workspaceForm = new FormGroup({
    workspace: new FormControl<Workspace | null>(this.workspaces[0]),
  });

  protected readonly formMessage = signal('Choose the settings and save the form.');

  protected selectTone(value: RadioValue): void {
    if (typeof value === 'string') {
      this.selectedTone = value;
    }
  }

  protected selectPriority(value: RadioValue): void {
    if (typeof value === 'string') {
      this.selectedPriority = value;
    }
  }

  protected compareWorkspace(
    left: RadioValue,
    right: RadioValue,
  ): boolean {
    const leftWorkspace = left as Workspace | null;
    const rightWorkspace = right as Workspace | null;
    return leftWorkspace?.id === rightWorkspace?.id;
  }

  protected saveSettings(): void {
    this.settingsForm.markAllAsTouched();

    if (this.settingsForm.invalid) {
      this.formMessage.set('Choose an export format before saving.');
      return;
    }

    const value = this.settingsForm.getRawValue();
    this.formMessage.set(
      `Saved: ${value.view} view, ${value.reminder} reminders, ${value.visibility} visibility.`,
    );
  }
}
