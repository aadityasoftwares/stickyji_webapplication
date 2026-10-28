import { DOCUMENT, ViewportScroller } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  afterNextRender,
  inject,
  signal,
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
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly scroller = inject(ViewportScroller);
  readonly activeSection = signal(this.router.parseUrl(this.router.url).fragment ?? 'top');

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.activeSection.set(this.router.parseUrl(event.urlAfterRedirects).fragment ?? 'top');
      }
    });
    afterNextRender(() => {
      this.scroller.setOffset([0, 88]);
      if (!this.router.parseUrl(this.router.url).fragment) this.updateActiveSection();
    });
  }

  isNavActive(item: HeaderNavItem): boolean {
    if (item.external) return false;
    const [path, fragment] = item.href.split('#');
    const currentPath = this.router.url.split(/[?#]/)[0];
    if (fragment) return (!path || path === currentPath) && fragment === this.activeSection();
    return path === currentPath;
  }

  private navigateLink(href: string, event?: MouseEvent): void {
    if (
      !event ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (!href.startsWith('/') && !href.startsWith('#')) return;
    event.preventDefault();
    const url = href.startsWith('#') ? '/home' + href : href;
    if (this.router.url === url) {
      this.scroller.scrollToAnchor(url.split('#')[1] ?? 'top');
    } else {
      void this.router.navigateByUrl(url);
    }
  }

  @HostListener('window:scroll')
  updateActiveSection(): void {
    if (this.router.url.split(/[?#]/)[0] !== '/home') return;
    let active = 'top';
    const ids = ['features', 'how-it-works', 'use-cases', 'reviews', 'pricing'];
    for (const id of ids) {
      const section = this.document.getElementById(id);
      if (section && section.getBoundingClientRect().top <= 120) active = id;
    }
    this.activeSection.set(active);
  }

  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideMenu = LucideMenu;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideX = LucideX;

  @Input() brandName = 'Sticky Ji';
  @Input() logoSrc = 'StickyJiHorizontalLogo.png';
  @Input() brandHref = '/home#top';
  @Input() productBadge = 'BETA';
  @Input() showProductBadge = false;

  @Input() signInLabel = 'Sign in';
  @Input() primaryActionLabel = 'Start for free';
  @Input() reassuranceText = 'Free forever · No credit card required';

  @Input() navItems: readonly HeaderNavItem[] = [
    { label: 'Features', href: '/home#features' },
    { label: 'How it works', href: '/home#how-it-works' },
    { label: 'Use cases', href: '/home#use-cases' },
    { label: 'Stories', href: '/home#reviews' },
    { label: 'Pricing', href: '/home#pricing' },
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

  onBrandClick(event?: MouseEvent): void {
    this.navigateLink(this.brandHref, event);
    this.closeMobileMenu();
    this.brandClick.emit();
  }

  onNavSelected(item: HeaderNavItem, event?: MouseEvent): void {
    if (!item.external) this.navigateLink(item.href, event);
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

    if (viewport && viewport.innerWidth > 1020 && this.mobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}
