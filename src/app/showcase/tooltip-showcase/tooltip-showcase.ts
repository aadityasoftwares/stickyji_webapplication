import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  LucideArchive,
  LucideBell,
  LucideCircleHelp,
  LucideCopy,
  LucideEllipsis,
  LucideInfo,
  LucidePalette,
  LucidePencil,
  LucidePin,
  LucideShare2,
  LucideStickyNote,
  LucideTrash2,
} from '@lucide/angular';

import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';
import {
  Tooltip,
  type TooltipPosition,
  type TooltipTone,
} from '../../shared/components/tooltip/tooltip';

@Component({
  selector: 'app-tooltip-showcase',
  standalone: true,
  imports: [Button, AppIcon, Tooltip],
  templateUrl: './tooltip-showcase.html',
  styleUrl: './tooltip-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipShowcase {
  protected readonly icons = {
    archive: LucideArchive,
    bell: LucideBell,
    copy: LucideCopy,
    ellipsis: LucideEllipsis,
    help: LucideCircleHelp,
    info: LucideInfo,
    palette: LucidePalette,
    pencil: LucidePencil,
    pin: LucidePin,
    share: LucideShare2,
    stickyNote: LucideStickyNote,
    trash: LucideTrash2,
  } as const;

  protected readonly positions: ReadonlyArray<{
    readonly label: string;
    readonly value: TooltipPosition;
  }> = [
    { label: 'Top', value: 'top' },
    { label: 'Top start', value: 'top-start' },
    { label: 'Top end', value: 'top-end' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Bottom start', value: 'bottom-start' },
    { label: 'Bottom end', value: 'bottom-end' },
    { label: 'Left', value: 'left' },
    { label: 'Left start', value: 'left-start' },
    { label: 'Left end', value: 'left-end' },
    { label: 'Right', value: 'right' },
    { label: 'Right start', value: 'right-start' },
    { label: 'Right end', value: 'right-end' },
  ];

  protected readonly tones: ReadonlyArray<{
    readonly label: string;
    readonly value: TooltipTone;
  }> = [
    { label: 'Dark', value: 'dark' },
    { label: 'Paper', value: 'paper' },
    { label: 'Accent', value: 'accent' },
    { label: 'Success', value: 'success' },
    { label: 'Warning', value: 'warning' },
    { label: 'Danger', value: 'danger' },
    { label: 'Information', value: 'info' },
    { label: 'Yellow note', value: 'noteYellow' },
    { label: 'Orange note', value: 'noteOrange' },
    { label: 'Pink note', value: 'notePink' },
    { label: 'Red note', value: 'noteRed' },
    { label: 'Green note', value: 'noteGreen' },
    { label: 'Blue note', value: 'noteBlue' },
    { label: 'Purple note', value: 'notePurple' },
    { label: 'Brown note', value: 'noteBrown' },
    { label: 'Black note', value: 'noteBlack' },
  ];

  protected readonly manualOpen = signal(false);
  protected readonly copied = signal(false);

  protected copyNote(): void {
    this.copied.set(true);

    window.setTimeout(() => {
      this.copied.set(false);
    }, 1400);
  }
}
