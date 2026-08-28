import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import {
  LucideArrowRight,
  LucideCheck,
  LucideMenu,
  LucideSparkles,
  LucideX,
} from '@lucide/angular';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';
import { Label } from '../../shared/components/label/label';


export interface HeaderNavItem {
  label: string;
  href: string;
  active?: boolean;
  external?: boolean;
  badge?: string;
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon, Badge, Button, Label],
  host: {
    '[class.app-header-menu-open]': 'mobileMenuOpen',
  },
  selector: 'app-website-header',
  styleUrl: './website-header.scss',
  templateUrl: './website-header.html',
})
export class WebsiteHeader {

  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideMenu = LucideMenu;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideX = LucideX;

  @Input() brandName = 'MyStickyNotes';
  @Input() brandHref = '#top';
  @Input() productBadge = 'BETA';
  @Input() showProductBadge = true;

  @Input() signInLabel = 'Sign in';
  @Input() primaryActionLabel = 'Start for free';
  @Input() reassuranceText = 'Free forever · No credit card required';

  @Input() navItems: readonly HeaderNavItem[] = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Use cases', href: '#use-cases' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  @Output() brandClick = new EventEmitter<void>();
  @Output() navSelected = new EventEmitter<HeaderNavItem>();
  @Output() signInClick = new EventEmitter<void>();
  @Output() primaryActionClick = new EventEmitter<void>();

  mobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  onBrandClick(): void {
    this.closeMobileMenu();
    this.brandClick.emit();
  }

  onNavSelected(item: HeaderNavItem): void {
    this.closeMobileMenu();
    this.navSelected.emit(item);
  }

  onSignIn(): void {
    this.closeMobileMenu();
    this.signInClick.emit();
  }

  onPrimaryAction(): void {
    this.closeMobileMenu();
    this.primaryActionClick.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileMenu();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void {
    const viewport = event.target as Window | null;

    if (viewport && viewport.innerWidth > 860 && this.mobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}