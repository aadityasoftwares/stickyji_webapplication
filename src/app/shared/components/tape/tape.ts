import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { NgClass } from '@angular/common';

export type TapeSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';

export type TapeVariant =
  | 'yellow'
  | 'orange'
  | 'pink'
  | 'red'
  | 'green'
  | 'blue'
  | 'purple'
  | 'brown'
  | 'black'
  | 'paper'
  | 'neutral';

export type TapeShape =
  | 'straight'
  | 'torn'
  | 'rough';

export type TapePosition =
  | 'inline'
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'
  | 'leftCenter'
  | 'rightCenter';

export type TapePlacement =
  | 'inside'
  | 'overlap';

@Component({
  selector: 'app-tape',
  standalone: true,
  imports: [NgClass],
  templateUrl: './tape.html',
  styleUrl: './tape.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-tape-host-overlay]': 'position !== "inline"',
    '[class.app-tape-host-inline]': 'position === "inline"',

    '[class.app-tape-host-top-left]': 'position === "topLeft"',
    '[class.app-tape-host-top-center]': 'position === "topCenter"',
    '[class.app-tape-host-top-right]': 'position === "topRight"',

    '[class.app-tape-host-bottom-left]': 'position === "bottomLeft"',
    '[class.app-tape-host-bottom-center]': 'position === "bottomCenter"',
    '[class.app-tape-host-bottom-right]': 'position === "bottomRight"',

    '[class.app-tape-host-left-center]': 'position === "leftCenter"',
    '[class.app-tape-host-right-center]': 'position === "rightCenter"',

    '[class.app-tape-host-inside]': 'placement === "inside"',
    '[class.app-tape-host-overlap]': 'placement === "overlap"',

    '[style.--app-tape-edge-inset]': 'edgeInset + "px"',
    '[style.z-index]': 'zIndex',
    '[style.pointer-events]': '"none"',
  },
})
export class Tape {
  @Input() variant: TapeVariant = 'yellow';
  @Input() size: TapeSize = 'md';
  @Input() shape: TapeShape = 'torn';
  @Input() position: TapePosition = 'inline';

  /**
   * inside:
   * Keeps the complete tape inside the parent so it cannot be clipped.
   *
   * overlap:
   * Places half the tape across the parent's edge.
   * Use only when the parent allows overflow: visible.
   */
  @Input() placement: TapePlacement = 'inside';

  /**
   * Distance from the parent's edge when placement="inside".
   */
  @Input() edgeInset = 8;

  /**
   * Optional custom dimensions.
   * When omitted, the selected size controls width and height.
   */
  @Input() width?: number;
  @Input() height?: number;

  /**
   * Rotation in degrees.
   */
  @Input() rotation = -1.5;

  /**
   * Opacity from 0 to 1.
   */
  @Input() opacity = 0.82;

  @Input() shadow = true;
  @Input() grain = true;

  /**
   * Optional handwritten text displayed on the tape.
   */
  @Input() text = '';

  /**
   * Useful when decorative layers overlap.
   */
  @Input() zIndex = 6;

  get tapeClasses(): Record<string, boolean> {
    return {
      [`app-tape-${this.variant}`]: true,
      [`app-tape-${this.size}`]: true,
      [`app-tape-shape-${this.shape}`]: true,

      'app-tape-shadow': this.shadow,
      'app-tape-grain': this.grain,
      'app-tape-with-text': Boolean(this.text.trim()),
    };
  }

  get resolvedOpacity(): number {
    const value = Number(this.opacity);

    if (Number.isNaN(value)) {
      return 0.82;
    }

    return Math.min(
      1,
      Math.max(0, value),
    );
  }
}