import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  LucideBell,
  LucideBellOff,
  LucideCheck,
  LucideCloud,
  LucideCloudOff,
  LucideEye,
  LucideEyeOff,
  LucideFlame,
  LucideLeaf,
  LucideLock,
  LucideMoon,
  LucidePalette,
  LucideShieldCheck,
  LucideSparkles,
  LucideStickyNote,
  LucideSun,
  LucideTriangleAlert,
  LucideUsers,
  LucideVolume2,
  LucideVolumeX,
} from '@lucide/angular';

import {
  Switch,
  type SwitchSize,
  type SwitchVariant,
} from '../../shared/components/switch/switch';
import type { AppIconDefinition } from '../../shared/components/icon/icon';

interface VariantExample {
  readonly label: string;
  readonly value: SwitchVariant;
  readonly icon: AppIconDefinition;
}

@Component({
  selector: 'app-switch-showcase',
  standalone: true,
  imports: [ReactiveFormsModule, Switch],
  templateUrl: './switch-showcase.html',
  styleUrl: './switch-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchShowcase {
  protected readonly icons = {
    bell: LucideBell,
    bellOff: LucideBellOff,
    check: LucideCheck,
    cloud: LucideCloud,
    cloudOff: LucideCloudOff,
    eye: LucideEye,
    eyeOff: LucideEyeOff,
    flame: LucideFlame,
    leaf: LucideLeaf,
    lock: LucideLock,
    moon: LucideMoon,
    palette: LucidePalette,
    shield: LucideShieldCheck,
    sparkles: LucideSparkles,
    stickyNote: LucideStickyNote,
    sun: LucideSun,
    warning: LucideTriangleAlert,
    users: LucideUsers,
    volume: LucideVolume2,
    volumeOff: LucideVolumeX,
  } as const;

  protected readonly semanticVariants: ReadonlyArray<VariantExample> = [
    { label: 'Primary', value: 'primary', icon: this.icons.stickyNote },
    { label: 'Accent', value: 'accent', icon: this.icons.sparkles },
    { label: 'Success', value: 'success', icon: this.icons.check },
    { label: 'Warning', value: 'warning', icon: this.icons.warning },
    { label: 'Danger', value: 'danger', icon: this.icons.flame },
    { label: 'Information', value: 'info', icon: this.icons.cloud },
  ];

  protected readonly noteVariants: ReadonlyArray<VariantExample> = [
    { label: 'Yellow', value: 'noteYellow', icon: this.icons.stickyNote },
    { label: 'Orange', value: 'noteOrange', icon: this.icons.flame },
    { label: 'Pink', value: 'notePink', icon: this.icons.sparkles },
    { label: 'Red', value: 'noteRed', icon: this.icons.warning },
    { label: 'Green', value: 'noteGreen', icon: this.icons.leaf },
    { label: 'Blue', value: 'noteBlue', icon: this.icons.cloud },
    { label: 'Purple', value: 'notePurple', icon: this.icons.palette },
    { label: 'Brown', value: 'noteBrown', icon: this.icons.lock },
    { label: 'Black', value: 'noteBlack', icon: this.icons.moon },
  ];

  protected readonly sizes: ReadonlyArray<{
    readonly label: string;
    readonly value: SwitchSize;
  }> = [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ];

  protected readonly autoSaveControl = new FormControl(true, {
    nonNullable: true,
  });

  protected readonly disabledControl = new FormControl(
    { value: true, disabled: true },
    { nonNullable: true },
  );

  protected readonly cloudSync = signal(true);
  protected readonly syncing = signal(false);
  protected readonly notifications = signal(true);
  protected readonly darkMode = signal(false);
  protected readonly sharedEditing = signal(true);
  protected readonly sounds = signal(false);

  protected setCloudSync(enabled: boolean): void {
    this.cloudSync.set(enabled);
    this.syncing.set(true);

    window.setTimeout(() => {
      this.syncing.set(false);
    }, 1200);
  }
}
