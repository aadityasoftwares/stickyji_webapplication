import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';

import {
  LucideArchive,
  LucideCheck,
  LucideCloud,
  LucideFlame,
  LucideInfo,
  LucideLeaf,
  LucidePalette,
  LucideSparkles,
  LucideStar,
  LucideStickyNote,
  LucideTriangleAlert,
  LucideUsers,
} from '@lucide/angular';

import {
  Badge,
  type BadgeShape,
  type BadgeSize,
  type BadgeVariant,
} from '../../shared/components/badge/badge';

interface VariantExample {
  readonly label: string;
  readonly value: BadgeVariant;
  readonly icon: unknown;
}

interface FilterBadge {
  readonly id: number;
  readonly label: string;
  readonly variant: BadgeVariant;
}

@Component({
  selector: 'app-badge-showcase',
  standalone: true,
  imports: [Badge],
  templateUrl: './badge-showcase.html',
  styleUrl: './badge-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeShowcase {
  protected readonly icons = {
    archive: LucideArchive,
    check: LucideCheck,
    cloud: LucideCloud,
    flame: LucideFlame,
    info: LucideInfo,
    leaf: LucideLeaf,
    palette: LucidePalette,
    sparkles: LucideSparkles,
    star: LucideStar,
    stickyNote: LucideStickyNote,
    warning: LucideTriangleAlert,
    users: LucideUsers,
  } as const;

  protected readonly standardVariants: ReadonlyArray<VariantExample> = [
    { label: 'Neutral', value: 'neutral', icon: this.icons.stickyNote },
    { label: 'Primary', value: 'primary', icon: this.icons.star },
    { label: 'Secondary', value: 'secondary', icon: this.icons.users },
    { label: 'Accent', value: 'accent', icon: this.icons.sparkles },
    { label: 'Success', value: 'success', icon: this.icons.check },
    { label: 'Warning', value: 'warning', icon: this.icons.warning },
    { label: 'Danger', value: 'danger', icon: this.icons.warning },
    { label: 'Information', value: 'info', icon: this.icons.info },
    { label: 'Outline', value: 'outline', icon: this.icons.stickyNote },
  ];

  protected readonly noteVariants: ReadonlyArray<VariantExample> = [
    { label: 'Yellow', value: 'noteYellow', icon: this.icons.stickyNote },
    { label: 'Orange', value: 'noteOrange', icon: this.icons.flame },
    { label: 'Pink', value: 'notePink', icon: this.icons.star },
    { label: 'Red', value: 'noteRed', icon: this.icons.warning },
    { label: 'Green', value: 'noteGreen', icon: this.icons.leaf },
    { label: 'Blue', value: 'noteBlue', icon: this.icons.cloud },
    { label: 'Purple', value: 'notePurple', icon: this.icons.palette },
    { label: 'Brown', value: 'noteBrown', icon: this.icons.archive },
    { label: 'Black', value: 'noteBlack', icon: this.icons.stickyNote },
  ];

  protected readonly sizes: ReadonlyArray<{
    readonly label: string;
    readonly value: BadgeSize;
  }> = [
      { label: 'Extra small', value: 'xs' },
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ];

  protected readonly shapes: ReadonlyArray<{
    readonly label: string;
    readonly value: BadgeShape;
  }> = [
      { label: 'Square', value: 'square' },
      { label: 'Rounded', value: 'rounded' },
      { label: 'Pill', value: 'pill' },
    ];

  protected readonly filters = signal<ReadonlyArray<FilterBadge>>([
    { id: 1, label: 'Important', variant: 'noteYellow' },
    { id: 2, label: 'Personal', variant: 'notePink' },
    { id: 3, label: 'Work', variant: 'noteBlue' },
    { id: 4, label: 'Shared', variant: 'noteGreen' },
  ]);

  protected readonly lastAction = signal('Remove a filter to test the output event.');

  protected removeFilter(filter: FilterBadge): void {
    this.filters.update((items) =>
      items.filter((item) => item.id !== filter.id),
    );

    this.lastAction.set(`Removed “${filter.label}” filter.`);
  }

  protected resetFilters(): void {
    this.filters.set([
      { id: 1, label: 'Important', variant: 'noteYellow' },
      { id: 2, label: 'Personal', variant: 'notePink' },
      { id: 3, label: 'Work', variant: 'noteBlue' },
      { id: 4, label: 'Shared', variant: 'noteGreen' },
    ]);

    this.lastAction.set('Filters restored.');
  }
}
