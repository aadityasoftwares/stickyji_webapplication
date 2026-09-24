import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideCalendarDays, LucideFolder, LucideGlobe, LucideLock, LucideShield, LucideUsers } from '@lucide/angular';
import { AppIcon } from '../../../shared/components/icon/icon';

@Component({
  standalone: true,
  imports: [AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-workspace-folder-wrapper',
  styleUrl: './workspace-folder-wrapper.scss',
  templateUrl: './workspace-folder-wrapper.html',
})
export class WorkspaceFolderWrapper {
  @Input() name = '';
  @Input() description = '';
  @Input() personal = false;
  @Input() visibility = 'PRIVATE';
  @Input() roleLabel = 'Owner';
  @Input() status = 'ACTIVE';
  @Input() updatedAt: string | Date | null | undefined = null;
  @Input() interactive = false;
  @Input() busy = false;
  @Output() readonly opened = new EventEmitter<MouseEvent>();
  @Output() readonly edited = new EventEmitter<MouseEvent>();
  @Output() readonly keyboardOpened = new EventEmitter<void>();

  readonly Folder = LucideFolder;
  readonly Calendar = LucideCalendarDays;
  readonly Shield = LucideShield;
  readonly Users = LucideUsers;

  get visibilityLabel(): string {
    const value = this.personal ? 'private' : this.visibility.toLowerCase().replaceAll('_', ' ');
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  get visibilityIcon() {
    return this.visibilityLabel === 'Public' ? LucideGlobe : LucideLock;
  }

  get dateLabel(): string {
    if (!this.updatedAt) return 'Not saved yet';
    const date = this.updatedAt instanceof Date ? this.updatedAt : new Date(this.updatedAt);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
  }

  get statusLabel(): string {
    return this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget || !this.interactive || this.busy) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.keyboardOpened.emit();
    }
  }
}
