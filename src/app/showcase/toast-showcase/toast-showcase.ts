import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  LucideBellRing,
  LucideCheck,
  LucideCircleAlert,
  LucideEraser,
  LucideInfo,
  LucideMapPin,
  LucidePalette,
  LucidePin,
  LucideRefreshCw,
  LucideSparkles,
  LucideStickyNote,
  LucideTriangleAlert,
  LucideUndo2,
} from '@lucide/angular';

import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';
import { Toast } from '../../shared/components/toast/toast';
import { ToastPosition, ToastVariant } from '../../shared/components/toast/models/toast.model';
import { ToastService } from '../../shared/components/toast/services/toast.service';

@Component({
  standalone: true,
  imports: [
    Button,
    AppIcon,
    Toast,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast-showcase',
  styleUrl: './toast-showcase.scss',
  templateUrl: './toast-showcase.html',
})
export class ToastShowcase {
  private readonly toast = inject(ToastService);

  protected readonly icons = {
    bell: LucideBellRing,
    check: LucideCheck,
    danger: LucideCircleAlert,
    eraser: LucideEraser,
    info: LucideInfo,
    mapPin: LucideMapPin,
    palette: LucidePalette,
    pin: LucidePin,
    refresh: LucideRefreshCw,
    sparkles: LucideSparkles,
    stickyNote: LucideStickyNote,
    warning: LucideTriangleAlert,
    undo: LucideUndo2,
  } as const;

  protected position: ToastPosition = 'top-right';
  protected syncUpdateCount = 0;

  protected showSuccess(): void {
    this.toast.success('Your latest changes are safely pinned.', {
      title: 'Note saved',
    });
  }

  protected showWarning(): void {
    this.toast.warning('This shared note still has two unresolved comments.', {
      title: 'A quick heads-up',
    });
  }

  protected showError(): void {
    this.toast.error('Check your connection, then try saving once more.', {
      title: 'Could not sync',
    });
  }

  protected showInfo(): void {
    this.toast.info('Maya added a new thought to the launch board.', {
      title: 'Workspace updated',
    });
  }

  protected showNeutral(): void {
    this.toast.show('Keyboard shortcuts are available from the help menu.', {
      title: 'Small reminder',
      variant: 'neutral',
    });
  }

  protected showNote(variant: ToastVariant): void {
    const messages: Partial<Record<ToastVariant, { title: string; message: string }>> = {
      noteYellow: {
        title: 'Idea captured',
        message: 'Your thought is waiting in the Inbox.',
      },
      notePink: {
        title: 'A thoughtful nudge',
        message: 'Your weekly reflection is ready when you are.',
      },
      noteBlue: {
        title: 'Shared with the team',
        message: 'Everyone in Product can now open this note.',
      },
      noteGreen: {
        title: 'Nicely done',
        message: 'The task moved into the Done column.',
      },
      notePurple: {
        title: 'Workspace customized',
        message: 'Your new board color has been applied.',
      },
    };

    const content = messages[variant];

    if (!content) {
      return;
    }

    this.toast.show(content.message, {
      title: content.title,
      variant,
    });
  }

  protected showUndoAction(): void {
    this.toast.info('“Launch checklist” moved to Done.', {
      title: 'Task completed',
      duration: 7_000,
      action: {
        label: 'Undo move',
        handler: () => {
          this.toast.note('The task is back in In progress.', {
            title: 'Move undone',
          });
        },
      },
    });
  }

  protected showPersistent(): void {
    this.toast.error('Reconnect to keep your latest edits safe.', {
      title: 'You are offline',
      duration: 0,
    });
  }

  protected showCustomIcon(): void {
    this.toast.note('This thought will stay at the top of your board.', {
      title: 'Note pinned',
      icon: this.icons.pin,
    });
  }

  protected showWithoutIcon(): void {
    this.toast.show('A clean notification for quieter moments.', {
      title: 'No icon needed',
      icon: null,
      variant: 'neutral',
    });
  }

  protected showDedupeUpdate(): void {
    this.syncUpdateCount += 1;

    this.toast.info(`${this.syncUpdateCount} workspace update${this.syncUpdateCount === 1 ? '' : 's'} received.`, {
      title: 'Sync activity',
      dedupeKey: 'showcase-sync-activity',
    });
  }

  protected showAt(position: ToastPosition): void {
    this.position = position;

    setTimeout(() => {
      this.toast.note(`Notifications will now appear at the ${this.positionLabel(position)}.`, {
        title: 'Position changed',
        dedupeKey: 'showcase-position',
      });
    });
  }

  protected clearAll(): void {
    this.toast.clear();
    this.syncUpdateCount = 0;
  }

  protected positionLabel(position: ToastPosition): string {
    return position.replace('-', ' ');
  }
}

