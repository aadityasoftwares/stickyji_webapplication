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
  LucideChevronDown,
  LucideCompass,
  LucideFileText,
  LucideHeart,
  LucideHouse,
  LucideLayers,
  LucideLogIn,
  LucideMail,
  LucideMenu,
  LucideShieldCheck,
  LucideSparkles,
  LucideStar,
  LucideTag,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';
import { Label } from '../../shared/components/label/label';
import { AuthStore } from '../../public/auth/state/auth.store';
import { APP_ROUTES } from '../../shared/constants/route.constants';

export interface HeaderSubNavItem {
  label: string;
  href: string;
  icon?: any;
  description?: string;
  badge?: string;
}

export interface HeaderNavItem {
  label: string;
  href?: string;
  icon?: any;
  active?: boolean;
  external?: boolean;
  badge?: string;
  isHome?: boolean;
  children?: readonly HeaderSubNavItem[];
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon, Badge, Button, Label],
  host: {
    '[class.app-header-menu-open]': 'mobileMenuOpen',
    '[class.header-hidden]': 'headerHidden() && !mobileMenuOpen',
  },
  selector: 'app-website-header',
  styleUrl: './website-header.scss',
  templateUrl: './website-header.html',
})
export class WebsiteHeader {
  readonly isAuthenticated = inject(AuthStore).isAuthenticated;
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly scroller = inject(ViewportScroller);
  readonly activeSection = signal(this.router.parseUrl(this.router.url).fragment ?? 'top');
  readonly headerHidden = signal(false);
  private previousScrollY = 0;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.headerHidden.set(false);
        this.closeDropdown();
        this.previousScrollY = this.document.defaultView?.scrollY ?? 0;
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
    const currentPath = this.router.url.split(/[?#]/)[0];
    if (item.children?.length) {
      return item.children.some((child) => child.href.split(/[?#]/)[0] === currentPath);
    }
    if (!item.href) return false;
    const [path, fragment] = item.href.split('#');
    if (fragment) return (!path || path === currentPath) && fragment === this.activeSection();
    return path === currentPath;
  }

  isChildActive(child: HeaderSubNavItem): boolean {
    const currentPath = this.router.url.split(/[?#]/)[0];
    return child.href.split(/[?#]/)[0] === currentPath;
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
    const url = href.startsWith('#') ? '/' + href : href;
    const isAlreadyOnPage =
      this.router.url === url || (url === '/' && this.router.url.split(/[?#]/)[0] === '/');
    if (isAlreadyOnPage) {
      const anchor = url.split('#')[1];
      if (anchor) {
        this.scroller.scrollToAnchor(anchor);
      } else if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      void this.router.navigateByUrl(url).then(() => {
        if (!url.includes('#') && typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      });
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollY = Math.max(0, this.document.defaultView?.scrollY ?? 0);
    const delta = scrollY - this.previousScrollY;
    if (scrollY <= 120 || this.mobileMenuOpen) {
      this.headerHidden.set(false);
    } else if (Math.abs(delta) >= 6) {
      this.headerHidden.set(delta > 0);
    }
    if (Math.abs(delta) >= 6 || scrollY <= 120) this.previousScrollY = scrollY;
    this.updateActiveSection();
  }

  updateActiveSection(): void {
    if (this.router.url.split(/[?#]/)[0] !== '/') return;
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
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideCompass = LucideCompass;
  readonly LucideFileText = LucideFileText;
  readonly LucideHeart = LucideHeart;
  readonly LucideHouse = LucideHouse;
  readonly LucideLayers = LucideLayers;
  readonly LucideLogIn = LucideLogIn;
  readonly LucideMail = LucideMail;
  readonly LucideMenu = LucideMenu;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideStar = LucideStar;
  readonly LucideTag = LucideTag;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;

  @Input() brandName = 'Sticky Ji';
  @Input() logoSrc = 'StickyJiHorizontalLogo.png';
  @Input() brandHref = '/#top';
  @Input() productBadge = 'BETA';
  @Input() showProductBadge = false;

  @Input() signInLabel = 'Sign in';
  @Input() primaryActionLabel = 'Start for free';
  @Input() reassuranceText = 'Plan your day with online notes';

  @Input() navItems: readonly HeaderNavItem[] = [
    { label: 'Home', href: '/', icon: LucideHouse },
    { label: 'Features', href: '/features', icon: LucideSparkles },
    { label: 'How it works', href: '/how-it-works', icon: LucideCompass },
    { label: 'Use cases', href: '/use-cases', icon: LucideUsers },
    { label: 'Pricing', href: '/pricing', icon: LucideTag },
    {
      label: 'More',
      icon: LucideLayers,
      children: [
        {
          label: 'About us',
          href: '/about-us',
          icon: LucideHeart,
          description: 'Our story, mission & why Sticky Ji exists',
        },
        {
          label: 'Contact us',
          href: '/contact-us',
          icon: LucideMail,
          description: 'Say hello, ask questions, or share feedback',
        },
        {
          label: 'Privacy policy',
          href: '/privacy-policy',
          icon: LucideShieldCheck,
          description: 'How we protect & safeguard your notes',
        },
        {
          label: 'Terms & conditions',
          href: '/terms-and-conditions',
          icon: LucideFileText,
          description: 'Guidelines and legal service agreements',
        },
      ],
    },
  ];

  @Output() brandClick = new EventEmitter<void>();
  @Output() navSelected = new EventEmitter<HeaderNavItem>();
  @Output() signInClick = new EventEmitter<void>();
  @Output() primaryActionClick = new EventEmitter<void>();

  mobileMenuOpen = false;
  readonly openDropdown = signal<string | null>(null);
  readonly expandedMobileGroups = signal<Record<string, boolean>>({ More: true });

  toggleDropdown(label: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.openDropdown.update((current) => (current === label ? null : label));
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }

  isDropdownOpen(label: string): boolean {
    return this.openDropdown() === label;
  }

  toggleMobileGroup(label: string): void {
    this.expandedMobileGroups.update((groups) => ({
      ...groups,
      [label]: !groups[label],
    }));
  }

  isMobileGroupOpen(label: string): boolean {
    return !!this.expandedMobileGroups()[label];
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  onBrandClick(event?: MouseEvent): void {
    this.navigateLink(this.brandHref, event);
    this.closeMobileMenu();
    this.closeDropdown();
    this.brandClick.emit();
  }

  onNavSelected(item: HeaderNavItem | HeaderSubNavItem, event?: MouseEvent): void {
    if (item.href && !('external' in item && item.external)) {
      this.navigateLink(item.href, event);
    }
    this.closeDropdown();
    this.closeMobileMenu();
    if ('href' in item) {
      this.navSelected.emit(item as HeaderNavItem);
    }
  }

  onSignIn(): void {
    this.closeDropdown();
    this.closeMobileMenu();
    this.signInClick.emit();
  }

  onPrimaryAction(): void {
    this.closeDropdown();
    this.closeMobileMenu();
    if (this.isAuthenticated()) {
      void this.router.navigateByUrl(APP_ROUTES.APP);
      return;
    }
    this.primaryActionClick.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.nav-dropdown-wrapper')) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileMenu();
    this.closeDropdown();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void {
    const viewport = event.target as Window | null;

    if (viewport && viewport.innerWidth > 1020 && this.mobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
}
