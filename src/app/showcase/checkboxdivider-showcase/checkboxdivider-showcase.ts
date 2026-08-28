import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Checkbox,
  type CheckboxSize,
  type CheckboxVariant,
} from '../../shared/components/checkbox/checkbox';
import {
  Divider,
  type DividerLabelAlign,
  type DividerVariant,
} from '../../shared/components/divider/divider';

interface CheckboxVariantExample {
  readonly label: string;
  readonly variant: CheckboxVariant;
}

interface DividerVariantExample {
  readonly label: string;
  readonly variant: DividerVariant;
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Checkbox,
    Divider,
  ],
  selector: 'app-checkboxdivider-showcase',
  styleUrl: './checkboxdivider-showcase.scss',
  templateUrl: './checkboxdivider-showcase.html',
})
export class CheckboxdividerShowcase {

  protected readonly semanticCheckboxes: ReadonlyArray<CheckboxVariantExample> = [
    { label: 'Primary', variant: 'primary' },
    { label: 'Secondary', variant: 'secondary' },
    { label: 'Accent', variant: 'accent' },
    { label: 'Success', variant: 'success' },
    { label: 'Warning', variant: 'warning' },
    { label: 'Danger', variant: 'danger' },
    { label: 'Information', variant: 'info' },
  ];

  protected readonly noteCheckboxes: ReadonlyArray<CheckboxVariantExample> = [
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

  protected readonly checkboxSizes: ReadonlyArray<{
    readonly label: string;
    readonly size: CheckboxSize;
  }> = [
      { label: 'Extra small', size: 'xs' },
      { label: 'Small', size: 'sm' },
      { label: 'Medium', size: 'md' },
      { label: 'Large', size: 'lg' },
    ];

  protected readonly dividerVariants: ReadonlyArray<DividerVariantExample> = [
    { label: 'Neutral', variant: 'neutral' },
    { label: 'Strong', variant: 'strong' },
    { label: 'Primary', variant: 'primary' },
    { label: 'Accent', variant: 'accent' },
    { label: 'Success', variant: 'success' },
    { label: 'Warning', variant: 'warning' },
    { label: 'Danger', variant: 'danger' },
    { label: 'Information', variant: 'info' },
    { label: 'Yellow', variant: 'noteYellow' },
    { label: 'Orange', variant: 'noteOrange' },
    { label: 'Pink', variant: 'notePink' },
    { label: 'Red', variant: 'noteRed' },
    { label: 'Green', variant: 'noteGreen' },
    { label: 'Blue', variant: 'noteBlue' },
    { label: 'Purple', variant: 'notePurple' },
    { label: 'Brown', variant: 'noteBrown' },
    { label: 'Black', variant: 'noteBlack' },
  ];

  protected readonly labelAlignments: ReadonlyArray<DividerLabelAlign> = [
    'start',
    'center',
    'end',
  ];

  protected readonly selectedNotes = signal<ReadonlyArray<boolean>>([
    true,
    false,
    true,
    false,
  ]);

  protected readonly allNotesSelected = computed(() =>
    this.selectedNotes().every(Boolean),
  );

  protected readonly someNotesSelected = computed(() => {
    const selected = this.selectedNotes().filter(Boolean).length;
    return selected > 0 && selected < this.selectedNotes().length;
  });

  protected pinned = true;
  protected archived = false;

  protected readonly settingsForm = new FormGroup({
    allowSharing: new FormControl(true, { nonNullable: true }),
    emailUpdates: new FormControl(false, { nonNullable: true }),
    showPresence: new FormControl(true, { nonNullable: true }),
    terms: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  protected readonly formMessage = signal('Change the options and save the form.');

  protected toggleAllNotes(checked: boolean): void {
    this.selectedNotes.update((items) => items.map(() => checked));
  }

  protected toggleNote(index: number, checked: boolean): void {
    this.selectedNotes.update((items) =>
      items.map((value, itemIndex) =>
        itemIndex === index ? checked : value,
      ),
    );
  }

  protected saveSettings(): void {
    this.settingsForm.markAllAsTouched();

    if (this.settingsForm.invalid) {
      this.formMessage.set('Accept the workspace terms before saving.');
      return;
    }

    const enabledCount = Object.values(this.settingsForm.getRawValue())
      .filter(Boolean)
      .length;

    this.formMessage.set(`Settings saved with ${enabledCount} enabled options.`);
  }
}
