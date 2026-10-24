import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AppIcon } from '../../icon/icon';
import {
  LucideBold,
  LucideItalic,
  LucideUnderline,
  LucideStrikethrough,
  LucideHighlighter,
  LucideLink,
  LucideList,
  LucideListOrdered,
  LucideUndo2,
  LucideRedo2,
  LucideRemoveFormatting,
} from '@lucide/angular';
import { StickyMarks } from '../../../utils/sticky-markdown/markdown.types';
export type StickyCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'highlight'
  | 'link'
  | 'bullet'
  | 'number'
  | 'undo'
  | 'redo'
  | 'clear';
@Component({
  selector: 'app-sticky-markdown-toolbar',
  standalone: true,
  imports: [AppIcon],
  template: `<div
    class="markdown-toolbar"
    role="toolbar"
    aria-label="Text formatting"
    (pointerdown)="preserve($event)"
    (keydown)="navigate($event)"
  >
    @for (control of controls; track control.command) {
      @if (multiline || (control.command !== 'bullet' && control.command !== 'number')) {
        <button
          type="button"
          [title]="control.label"
          [attr.aria-label]="control.label"
          [attr.aria-pressed]="isActive(control.command)"
          [disabled]="
            disabled ||
            (control.command === 'undo' && !canUndo) ||
            (control.command === 'redo' && !canRedo)
          "
          (click)="command.emit(control.command)"
        >
          <app-icon [icon]="control.icon" [size]="14" />
        </button>
      }
    }
  </div>`,
  styles: [
    `
      :host {
        display: block;
        max-width: 100%;
      }
      .markdown-toolbar {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 2px;
        padding: 4px;
        background: var(--markdown-toolbar-bg, var(--app-paper, #fffdf7));
        color: #333;
        border: 1px solid #d9d4c8;
        border-radius: 8px;
        box-shadow: 0 3px 12px #302b1812;
      }
      button {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        flex: 0 0 28px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: inherit;
      }
      button:hover:not(:disabled) {
        background: #f5e8b5;
      }
      button[aria-pressed='true'] {
        background: #f5e8b5;
        color: #604900;
        box-shadow: inset 0 0 0 2px #8b6900;
      }
      button:focus-visible {
        outline: 2px solid #8b6900;
        outline-offset: 1px;
      }
      button:disabled {
        opacity: 0.35;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyMarkdownToolbarComponent {
  @Input() marks: StickyMarks = {};
  @Input() list = '';
  @Input() multiline = false;
  @Input() disabled = false;
  @Input() canUndo = false;
  @Input() canRedo = false;
  @Output() command = new EventEmitter<StickyCommand>();
  readonly controls = [
    { command: 'bold', label: 'Bold (Ctrl/Cmd+B)', icon: LucideBold },
    { command: 'italic', label: 'Italic (Ctrl/Cmd+I)', icon: LucideItalic },
    { command: 'underline', label: 'Underline (Ctrl/Cmd+U)', icon: LucideUnderline },
    { command: 'strike', label: 'Strikethrough', icon: LucideStrikethrough },
    { command: 'highlight', label: 'Highlight', icon: LucideHighlighter },
    { command: 'link', label: 'Link (Ctrl/Cmd+K)', icon: LucideLink },
    { command: 'bullet', label: 'Bullet list', icon: LucideList },
    { command: 'number', label: 'Numbered list', icon: LucideListOrdered },
    { command: 'undo', label: 'Undo (Ctrl/Cmd+Z)', icon: LucideUndo2 },
    { command: 'redo', label: 'Redo (Ctrl/Cmd+Shift+Z)', icon: LucideRedo2 },
    { command: 'clear', label: 'Clear inline formatting', icon: LucideRemoveFormatting },
  ] as const;
  isActive(command: StickyCommand): boolean | null {
    if (command === 'bullet' || command === 'number') return this.list === command;
    if (command === 'undo' || command === 'redo' || command === 'clear') return null;
    return !!this.marks[command];
  }
  preserve(event: PointerEvent): void {
    if ((event.target as HTMLElement).closest('button')) event.preventDefault();
  }
  navigate(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      ),
    );
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next]?.focus();
    event.preventDefault();
    event.stopPropagation();
  }
}
