import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

import {
  NgClass,
} from '@angular/common';

import {
  LucideMapPin,
  LucidePaperclip,
} from '@lucide/angular';

import {
  AppIcon,
  type AppIconDefinition,
} from '../icon/icon';

export type StickyNotePinSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';

export type StickyNotePinVariant =
  | 'pushPin'
  | 'thumbTack'
  | 'roundPin'
  | 'pearlPin'
  | 'metalPin'
  | 'needle'
  | 'mapPin'
  | 'paperclip';

export type StickyNotePinTone =
  | 'red'
  | 'yellow'
  | 'orange'
  | 'pink'
  | 'green'
  | 'blue'
  | 'purple'
  | 'brown'
  | 'black'
  | 'neutral'
  | 'paper';

export type StickyNotePinPosition =
  | 'inline'
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'
  | 'leftCenter'
  | 'rightCenter';

export type StickyNotePinPlacement =
  | 'inside'
  | 'overlap';

@Component({
  selector: 'app-sticky-note-pin',
  standalone: true,

  imports: [
    NgClass,
    AppIcon,
  ],

  templateUrl: './sticky-note-pin.html',
  styleUrl: './sticky-note-pin.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  host: {
    '[class.app-sticky-note-pin-host-overlay]':
      'position !== "inline"',

    '[class.app-sticky-note-pin-host-inline]':
      'position === "inline"',

    '[class.app-sticky-note-pin-host-top-left]':
      'position === "topLeft"',

    '[class.app-sticky-note-pin-host-top-center]':
      'position === "topCenter"',

    '[class.app-sticky-note-pin-host-top-right]':
      'position === "topRight"',

    '[class.app-sticky-note-pin-host-bottom-left]':
      'position === "bottomLeft"',

    '[class.app-sticky-note-pin-host-bottom-center]':
      'position === "bottomCenter"',

    '[class.app-sticky-note-pin-host-bottom-right]':
      'position === "bottomRight"',

    '[class.app-sticky-note-pin-host-left-center]':
      'position === "leftCenter"',

    '[class.app-sticky-note-pin-host-right-center]':
      'position === "rightCenter"',

    '[class.app-sticky-note-pin-host-inside]':
      'placement === "inside"',

    '[class.app-sticky-note-pin-host-overlap]':
      'placement === "overlap"',

    '[style.--sticky-pin-edge-inset]':
      'edgeInset + "px"',

    '[style.--sticky-pin-offset-x]':
      'offsetX + "px"',

    '[style.--sticky-pin-offset-y]':
      'offsetY + "px"',

    '[style.z-index]':
      'zIndex',

    '[style.pointer-events]':
      'interactive ? "auto" : "none"',
  },
})
export class StickyNotePin {

  @Input()
  variant:
    StickyNotePinVariant =
    'pushPin';

  @Input()
  tone:
    StickyNotePinTone =
    'red';

  @Input()
  size:
    StickyNotePinSize =
    'md';

  @Input()
  position:
    StickyNotePinPosition =
    'topCenter';

  @Input()
  placement:
    StickyNotePinPlacement =
    'overlap';

  @Input()
  edgeInset = 8;

  @Input()
  offsetX = 0;

  @Input()
  offsetY = 0;

  @Input()
  rotation = -6;

  @Input()
  width?: number;

  @Input()
  height?: number;

  @Input()
  shadow = true;

  @Input()
  shine = true;

  @Input()
  showNeedle = true;

  /**
   * Optional AppIcon override.
   * Physical SVG variants ignore this unless you use an icon variant.
   */
  @Input()
  icon?: AppIconDefinition;

  @Input()
  decorative = true;

  @Input()
  ariaLabel = 'Pinned note';

  @Input()
  interactive = false;

  @Input()
  zIndex = 12;

  readonly LucideMapPin =
    LucideMapPin;

  readonly LucidePaperclip =
    LucidePaperclip;

  get pinClasses():
    Record<string, boolean> {

    return {
      [`sticky-note-pin-${this.variant}`]:
        true,

      [`sticky-note-pin-${this.tone}`]:
        true,

      [`sticky-note-pin-${this.size}`]:
        true,

      'sticky-note-pin-shadow':
        this.shadow,

      'sticky-note-pin-shine':
        this.shine,

      'sticky-note-pin-interactive':
        this.interactive,
    };
  }

  get isIconVariant():
    boolean {

    return (
      this.variant ===
      'mapPin' ||
      this.variant ===
      'paperclip'
    );
  }

  get resolvedIcon():
    AppIconDefinition {

    if (
      this.icon
    ) {
      return this.icon;
    }

    return (
      this.variant ===
        'paperclip'
        ? this.LucidePaperclip
        : this.LucideMapPin
    );
  }

  get resolvedIconSize():
    'xs' | 'sm' | 'md' {

    switch (
    this.size
    ) {
      case 'xs':
      case 'sm':
        return 'xs';

      case 'lg':
      case 'xl':
        return 'md';

      case 'md':
      default:
        return 'sm';
    }
  }

  get resolvedAriaHidden():
    'true' | null {

    return this.decorative
      ? 'true'
      : null;
  }

  get resolvedRole():
    'img' | null {

    return this.decorative
      ? null
      : 'img';
  }

  get resolvedAriaLabel():
    string | null {

    return this.decorative
      ? null
      : this.ariaLabel;
  }
}