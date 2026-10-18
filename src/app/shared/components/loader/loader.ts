import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { Label, type LabelAppearance, type LabelSize, type LabelVariant } from '../label/label';

export type LoaderMode = 'inline' | 'section' | 'card' | 'overlay' | 'fullscreen';

export type LoaderSize = 'sm' | 'md' | 'lg';

export type LoaderTone =
  | 'colorful'
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'noteYellow'
  | 'noteOrange'
  | 'notePink'
  | 'noteRed'
  | 'noteGreen'
  | 'noteBlue'
  | 'notePurple'
  | 'noteBrown'
  | 'noteBlack';

export type LoaderAriaLive = 'off' | 'polite' | 'assertive';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [NgClass, Label],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-loader-host-active]': 'active',
    '[class.app-loader-host-inline]': "mode === 'inline'",
    '[class.app-loader-host-overlay]': "mode === 'overlay'",
    '[class.app-loader-host-fullscreen]': "mode === 'fullscreen'",
  },
})
export class Loader {
  /** Allows the component to stay mounted while hiding its content. */
  @Input() active = true;

  /**
   * inline: small loader beside text or a control.
   * section: loader occupying a normal page section.
   * card: paper surface with border and shadow.
   * overlay: absolute overlay inside the nearest positioned parent.
   * fullscreen: fixed application-level overlay.
   */
  @Input() mode: LoaderMode = 'section';
  @Input() size: LoaderSize = 'md';
  @Input() tone: LoaderTone = 'colorful';

  @Input() label = 'Loading…';
  @Input() description = '';
  @Input() showLabel = true;
  @Input() showVisual = true;

  @Input() labelVariant: LabelVariant = 'neutral';
  @Input() labelAppearance: LabelAppearance = 'plain';

  /** A number is treated as pixels. Any valid CSS length can also be supplied. */
  @Input() minHeight: number | string = 220;
  @Input() zIndex = 40;

  /** Used by overlay and fullscreen modes. */
  @Input() backdrop = true;
  @Input() blurBackdrop = true;

  /** Optional determinate progress from 0 to 100. */
  @Input() progress: number | null = null;
  @Input() showProgressValue = true;

  @Input() ariaLabel = 'Content is loading';
  @Input() ariaLive: LoaderAriaLive = 'polite';

  get loaderClasses(): Record<string, boolean> {
    return {
      [`app-loader-${this.mode}`]: true,
      [`app-loader-${this.size}`]: true,
      [`app-loader-tone-${this.tone}`]: true,
      'app-loader-with-backdrop': this.backdrop,
      'app-loader-with-blur': this.backdrop && this.blurBackdrop,
      'app-loader-visual-hidden': !this.showVisual,
      'app-loader-label-hidden': !this.showLabel,
      'app-loader-with-progress': this.hasProgress,
    };
  }

  get resolvedLabelSize(): LabelSize {
    if (this.size === 'sm') {
      return 'xs';
    }

    if (this.size === 'lg') {
      return 'md';
    }

    return 'sm';
  }

  get resolvedMinHeight(): string {
    return typeof this.minHeight === 'number' ? `${Math.max(0, this.minHeight)}px` : this.minHeight;
  }

  get hasProgress(): boolean {
    return this.progress !== null && Number.isFinite(Number(this.progress));
  }

  get normalizedProgress(): number {
    if (!this.hasProgress) {
      return 0;
    }

    return Math.min(100, Math.max(0, Number(this.progress)));
  }

  get progressText(): string {
    return `${Math.round(this.normalizedProgress)}%`;
  }

  get accessibleLabel(): string {
    const message = [this.label.trim(), this.description.trim()].filter(Boolean).join('. ');

    return message || this.ariaLabel;
  }
}
