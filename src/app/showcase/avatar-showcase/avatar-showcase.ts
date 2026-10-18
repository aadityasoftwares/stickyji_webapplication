import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  LucideBot,
  LucideCamera,
  LucideShieldCheck,
  LucideUser,
  LucideUsers,
} from '@lucide/angular';

import {
  Avatar,
  type AvatarShape,
  type AvatarSize,
  type AvatarStatus,
  type AvatarTone,
} from '../../shared/components/avatar/avatar';

interface ToneExample {
  readonly label: string;
  readonly initials: string;
  readonly tone: AvatarTone;
}

interface StatusExample {
  readonly label: string;
  readonly status: Exclude<AvatarStatus, 'none'>;
  readonly tone: AvatarTone;
}

@Component({
  selector: 'app-avatar-showcase',
  standalone: true,
  imports: [Avatar],
  templateUrl: './avatar-showcase.html',
  styleUrl: './avatar-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarShowcase {
  protected readonly icons = {
    bot: LucideBot,
    camera: LucideCamera,
    shield: LucideShieldCheck,
    user: LucideUser,
    users: LucideUsers,
  } as const;

  protected readonly sizes: ReadonlyArray<{
    readonly label: string;
    readonly value: Exclude<AvatarSize, number>;
  }> = [
    { label: 'XS · 24px', value: 'xs' },
    { label: 'SM · 32px', value: 'sm' },
    { label: 'MD · 40px', value: 'md' },
    { label: 'LG · 48px', value: 'lg' },
    { label: 'XL · 64px', value: 'xl' },
    { label: '2XL · 80px', value: '2xl' },
  ];

  protected readonly tones: ReadonlyArray<ToneExample> = [
    { label: 'Neutral', initials: 'NP', tone: 'neutral' },
    { label: 'Primary', initials: 'AP', tone: 'primary' },
    { label: 'Yellow', initials: 'YN', tone: 'yellow' },
    { label: 'Orange', initials: 'ON', tone: 'orange' },
    { label: 'Pink', initials: 'PN', tone: 'pink' },
    { label: 'Red', initials: 'RN', tone: 'red' },
    { label: 'Green', initials: 'GN', tone: 'green' },
    { label: 'Blue', initials: 'BN', tone: 'blue' },
    { label: 'Purple', initials: 'PL', tone: 'purple' },
    { label: 'Brown', initials: 'BR', tone: 'brown' },
    { label: 'Black', initials: 'BK', tone: 'black' },
  ];

  protected readonly shapes: ReadonlyArray<{
    readonly label: string;
    readonly value: AvatarShape;
  }> = [
    { label: 'Circle', value: 'circle' },
    { label: 'Rounded', value: 'rounded' },
    { label: 'Square', value: 'square' },
  ];

  protected readonly statuses: ReadonlyArray<StatusExample> = [
    { label: 'Online', status: 'online', tone: 'green' },
    { label: 'Away', status: 'away', tone: 'yellow' },
    { label: 'Busy', status: 'busy', tone: 'red' },
    { label: 'Offline', status: 'offline', tone: 'neutral' },
  ];

  protected readonly profileImage = 'https://i.pravatar.cc/240?img=47';

  protected readonly secondProfileImage = 'https://i.pravatar.cc/240?img=12';

  protected readonly brokenImage = 'https://invalid.example/avatar-that-does-not-exist.jpg';

  protected readonly liveStatus = signal<AvatarStatus>('online');
  protected readonly lastImageEvent = signal('Waiting for image event');

  protected cycleStatus(): void {
    const order: AvatarStatus[] = ['online', 'away', 'busy', 'offline', 'none'];

    const currentIndex = order.indexOf(this.liveStatus());
    this.liveStatus.set(order[(currentIndex + 1) % order.length]);
  }

  protected handleImageLoad(): void {
    this.lastImageEvent.set('Profile image loaded successfully');
  }

  protected handleImageError(): void {
    this.lastImageEvent.set('Image failed; initials fallback displayed');
  }
}
