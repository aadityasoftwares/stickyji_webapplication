import { DOCUMENT, ViewportScroller } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { gsap } from 'gsap';
import { prefersReducedMotion, runInGsapContext } from '../gsap-utils';
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
  LucideMapPin,
  LucideMenu,
  LucidePhone,
  LucideShieldCheck,
  LucideSparkles,
  LucideStar,
  LucideTag,
  LucideUser,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { AuthStore } from '../../public/auth/state/auth.store';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { AppIcon } from '../../shared/components/icon/icon';
import { Label } from '../../shared/components/label/label';
import { APP_ROUTES } from '../../shared/constants/route.constants';

export interface HeaderAnnouncement {
  text: string;
  icon?: any;
  iconColor?: string;
}

export interface HeaderSocialLink {
  label: string;
  href: string;
  type: 'linkedin' | 'facebook' | 'x' | 'instagram' | 'youtube' | 'discord';
}

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

/** Scroll distance (px) before the header is allowed to hide. */
const HIDE_AFTER_SCROLL_Y = 120;
/** Minimum scroll movement (px) to count as a direction change. */
const SCROLL_DELTA_THRESHOLD = 6;
/** Scroll position (px) at which the "scrolled" shadow state turns on. */
const SCROLLED_ON_Y = 28;
/** Scroll position (px) at which it turns off again (hysteresis avoids flicker). */
const SCROLLED_OFF_Y = 8;

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon, Badge, Button, Label],
  host: {
    '[class.app-header-menu-open]': 'mobileMenuOpen',
    '[class.header-hidden]': 'headerHidden() && !mobileMenuOpen',
    '[class.header-scrolled]': 'isScrolled()',
    '[class.has-top-bar]': 'showTopBar',
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  readonly activeSection = signal(this.router.parseUrl(this.router.url).fragment ?? 'top');
  readonly headerHidden = signal(false);
  readonly isScrolled = signal(false);
  private previousScrollY = 0;
  private scrollFrame: number | null = null;

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
      this.previousScrollY = Math.max(0, this.document.defaultView?.scrollY ?? 0);
      this.isScrolled.set(this.previousScrollY > SCROLLED_ON_Y);
      if (!this.router.parseUrl(this.router.url).fragment) this.updateActiveSection();

      if (!prefersReducedMotion()) {
        runInGsapContext(
          this.element,
          () => {
            gsap.from('.header-nav-bar', {
              y: -18,
              opacity: 0,
              duration: 0.6,
              ease: 'power2.out',
            });
          },
          this.destroyRef,
        );
      }
    });
    this.destroyRef.onDestroy(() => {
      this.setBodyScrollLocked(false);
      if (this.scrollFrame !== null) {
        this.document.defaultView?.cancelAnimationFrame(this.scrollFrame);
      }
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

    // Nested sub-path match (e.g. /blog/post-slug keeps Blog active)
    if (path !== '/' && (currentPath === path || currentPath.startsWith(path + '/'))) {
      return true;
    }

    // Home page section scroll synchronization
    if (currentPath === '/') {
      const section = this.activeSection();
      if (item.isHome || item.href === '/') {
        return section === 'top' || !section;
      }
      const itemSlug = path.replace(/^\//, '');
      if (itemSlug && itemSlug === section) {
        return true;
      }
    }

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

  /**
   * Scroll events can fire many times per frame. We only record that one happened
   * and do the real work (layout reads + signal writes) once per animation frame.
   */
  @HostListener('window:scroll')
  onScroll(): void {
    this.handleScroll();
  }

  private handleScroll(): void {
    const scrollY = Math.max(0, this.document.defaultView?.scrollY ?? 0);
    const delta = scrollY - this.previousScrollY;

    // Hysteresis: separate on/off thresholds so the state can't flicker at the boundary.
    if (scrollY > SCROLLED_ON_Y) {
      this.isScrolled.set(true);
    } else if (scrollY < SCROLLED_OFF_Y) {
      this.isScrolled.set(false);
    }

    if (scrollY <= HIDE_AFTER_SCROLL_Y || this.mobileMenuOpen) {
      this.headerHidden.set(false);
    } else if (Math.abs(delta) >= SCROLL_DELTA_THRESHOLD) {
      this.headerHidden.set(delta > 0);
    }

    if (Math.abs(delta) >= SCROLL_DELTA_THRESHOLD || scrollY <= HIDE_AFTER_SCROLL_Y) {
      this.previousScrollY = scrollY;
    }
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
    if (active !== this.activeSection()) this.activeSection.set(active);
  }

  /** Stops the page behind the mobile drawer from scrolling. */
  private setBodyScrollLocked(locked: boolean): void {
    const body = this.document.body;
    if (!body) return;
    body.style.overflow = locked ? 'hidden' : '';
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
  readonly LucideMapPin = LucideMapPin;
  readonly LucideMenu = LucideMenu;
  readonly LucidePhone = LucidePhone;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideStar = LucideStar;
  readonly LucideTag = LucideTag;
  readonly LucideUser = LucideUser;
  readonly LucideUsers = LucideUsers;
  readonly LucideX = LucideX;

  @Input() brandName = 'Sticky Ji';
  @Input() logoSrc = 'StickyJiHorizontalLogo.png';
  @Input() brandHref = '/#top';
  @Input() productBadge = 'BETA';
  @Input() showProductBadge = false;

  @Input() signInLabel = 'Login';
  @Input() primaryActionLabel = 'Start for free';
  @Input() reassuranceText = 'Plan your day with online notes';

  @Input() showTopBar = true;
  @Input() locationText = 'Vadodara, Gujarat, India';
  @Input() emailAddress = 'contact@aadityasoftwares.in';
  @Input() phoneNumber = '+91 88498 63872';

  @Input() socialLinks: readonly HeaderSocialLink[] = [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/aaditya-softwares',
      type: 'linkedin',
    },
    { label: 'Facebook', href: 'https://www.facebook.com', type: 'facebook' },
    { label: 'X', href: 'https://x.com', type: 'x' },
    { label: 'Instagram', href: 'https://www.instagram.com', type: 'instagram' },
    { label: 'YouTube', href: 'https://www.youtube.com', type: 'youtube' },
    { label: 'Discord', href: 'https://discord.gg', type: 'discord' },
  ];

  @Input() showAnnouncementBar = true;
  @Input() announcements: readonly HeaderAnnouncement[] = [
    {
      text: 'Back To Planning Season! Avail Free Lifetime Access for Individuals',
      iconColor: '#fbbf24',
    },
    {
      text: 'Special Workspace Offer! Collaborate with Team Members in Real-Time',
      iconColor: '#f43f5e',
    },
    { text: '+ Cloud Sync + Offline Support — Limited Period Only!', iconColor: '#38bdf8' },
    {
      text: 'Organize at Your Own Pace, Color Code Notes, and Build a Brighter Future!',
      iconColor: '#4ade80',
    },
    { text: 'Get Started Free Today — No Credit Card Required!', iconColor: '#c084fc' },
  ];

  @Input() navItems: readonly HeaderNavItem[] = [
    { label: 'Home', href: '/', icon: LucideHouse },
    { label: 'Features', href: '/features', icon: LucideSparkles },
    { label: 'How it works', href: '/how-it-works', icon: LucideCompass },
    { label: 'Use cases', href: '/use-cases', icon: LucideUsers },
    { label: 'Pricing', href: '/pricing', icon: LucideTag },
    { label: 'Blog', href: '/blog', icon: LucideFileText },
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
    this.setBodyScrollLocked(this.mobileMenuOpen);
    if (this.mobileMenuOpen) this.headerHidden.set(false);
  }

  closeMobileMenu(): void {
    if (!this.mobileMenuOpen) return;
    this.mobileMenuOpen = false;
    this.setBodyScrollLocked(false);
  }

  onBrandClick(event?: MouseEvent): void {
    this.navigateLink(this.brandHref, event);
    this.closeMobileMenu();
    this.closeDropdown();
    this.brandClick.emit();
  }

  onNavSelected(item: HeaderNavItem | HeaderSubNavItem, event?: MouseEvent): void {
    // Unlock scrolling first so in-page anchor scrolling works after the drawer closes.
    this.closeMobileMenu();
    if (item.href && !('external' in item && item.external)) {
      this.navigateLink(item.href, event);
    }
    this.closeDropdown();
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
