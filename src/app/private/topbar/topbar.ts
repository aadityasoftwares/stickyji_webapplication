import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  LucideBell,
  LucideCheck,
  LucideChevronDown,
  LucideMenu,
  LucidePlus,
  LucideSearch,
  LucideX,
} from '@lucide/angular';

import { AppIcon } from '../../shared/components/icon/icon';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [AppIcon, Badge, Button],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  @Input() pageTitle = 'Today';
  @Input() workspaceLabel = 'My workspace';
  @Input() userName = 'Aaditya';
  @Input() notificationCount = 0;
  @Input() syncMessage = 'All changes saved';

  @Output() menuClick = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() createNote = new EventEmitter<void>();
  @Output() notificationsClick = new EventEmitter<void>();
  @Output() profileClick = new EventEmitter<void>();

  mobileSearchOpen = false;
  searchQuery = '';

  readonly LucideBell = LucideBell;
  readonly LucideCheck = LucideCheck;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideMenu = LucideMenu;
  readonly LucidePlus = LucidePlus;
  readonly LucideSearch = LucideSearch;
  readonly LucideX = LucideX;

  @HostListener('document:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }

    if (event.key === 'Escape' && this.mobileSearchOpen) {
      this.closeSearch();
    }
  }

  openSearch(): void {
    this.mobileSearchOpen = true;
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  closeSearch(): void {
    this.mobileSearchOpen = false;
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.searchChange.emit(this.searchQuery.trim());
  }

  clearSearch(): void {
    this.searchQuery = '';

    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
      this.searchInput.nativeElement.focus();
    }

    this.searchChange.emit('');
  }
}
