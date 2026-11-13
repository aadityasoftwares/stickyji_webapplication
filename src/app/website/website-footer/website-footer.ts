import { DOCUMENT, ViewportScroller } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import {
  LucideArrowRight,
  LucideArrowUp,
  LucideBookOpen,
  LucideCheck,
  LucideHeart,
  LucideHouse,
  LucideMail,
  LucideMapPin,
  LucideMessageSquare,
  LucidePhone,
  LucideSparkles,
  LucideUsers,
} from '@lucide/angular';
import { gsap } from 'gsap';
import { AppIcon } from '../../shared/components/icon/icon';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';
import { prefersReducedMotion, runInGsapContext } from '../gsap-utils';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  badge?: string;
}

export interface FooterLinkGroup {
  title: string;
  icon: 'sparkles' | 'home' | 'book' | 'users';
  badgeColor: 'yellow' | 'pink' | 'blue' | 'green';
  links: readonly FooterLink[];
}

export interface FooterSocialLink {
  label: string;
  href: string;
  type: 'linkedin' | 'facebook' | 'x' | 'instagram' | 'youtube' | 'discord';
}

export const DEFAULT_FOOTER_SOCIAL_LINKS: readonly FooterSocialLink[] = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/stickyji/',
    type: 'linkedin',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/stickyji',
    type: 'facebook',
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/stickyji',
    type: 'x',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/stickyjiapp/',
    type: 'instagram',
  },
];

export const DEFAULT_FOOTER_GROUPS: readonly FooterLinkGroup[] = [
  {
    title: 'Product',
    icon: 'sparkles',
    badgeColor: 'yellow',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Use cases', href: '/use-cases' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Solutions',
    icon: 'home',
    badgeColor: 'pink',
    links: [
      { label: 'For students', href: '/use-cases' },
      { label: 'For professionals', href: '/use-cases' },
      { label: 'For creators', href: '/use-cases' },
      { label: 'For everyday life', href: '/use-cases' },
      { label: 'Small teams', href: '/use-cases' },
    ],
  },
  {
    title: 'Resources',
    icon: 'book',
    badgeColor: 'blue',
    links: [
      { label: 'Blog & Productivity Tips', href: '/blog' },
      { label: 'Help center', href: '/how-it-works' },
      { label: 'Guides', href: '/how-it-works' },
    ],
  },
  {
    title: 'Company',
    icon: 'users',
    badgeColor: 'green',
    links: [
      { label: 'About us', href: '/about-us' },
      { label: 'Contact us', href: '/contact-us' },
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Terms & conditions', href: '/terms-and-conditions' },
    ],
  },
];

@Component({
  standalone: true,
  imports: [AppIcon, StickyCard, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-website-footer',
  styleUrl: './website-footer.scss',
  templateUrl: './website-footer.html',
})
export class WebsiteFooter {
  private readonly document = inject(DOCUMENT);
  private readonly scroller = inject(ViewportScroller);

  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideArrowUp = LucideArrowUp;
  readonly LucideCheck = LucideCheck;
  readonly LucideHeart = LucideHeart;
  readonly LucideHouse = LucideHouse;
  readonly LucideBookOpen = LucideBookOpen;
  readonly LucideUsers = LucideUsers;
  readonly LucideMail = LucideMail;
  readonly LucidePhone = LucidePhone;
  readonly LucideMapPin = LucideMapPin;
  readonly LucideMessageSquare = LucideMessageSquare;
  readonly LucideSparkles = LucideSparkles;

  @Input() brandName = 'Sticky Ji';
  @Input() logoSrc = 'StickyJiHorizontalLogo.png';
  @Input() mascotSrc = 'StickyJiLogo.png';
  @Input() brandHref = '/#top';
  @Input() description = 'A calmer home for ideas, everyday plans, and the work people share.';
  @Input() locationText = 'Vadodara, Gujarat, India';
  @Input() emailAddress = 'contact@stickyji.com';
  @Input() phoneNumber = '+91 88498 63872';
  @Input() socialLinks: readonly FooterSocialLink[] = DEFAULT_FOOTER_SOCIAL_LINKS;
  @Input() ctaBadgeText = 'Ready to get organized?';
  @Input() ctaHeadingLine1 = 'Your next big idea needs';
  @Input() ctaHeadingHighlight = 'a home.';
  @Input() ctaDescription = 'Start with one note. Invite your people when the ideas grow.';
  @Input() primaryActionLabel = 'Start for free';
  @Input() secondaryActionLabel = 'Sign in';
  @Input() linkGroups: readonly FooterLinkGroup[] = DEFAULT_FOOTER_GROUPS;

  // Backward compatibility inputs
  @Input() ctaTitle?: string;
  @Input() statusLabel?: string;

  @Output() primaryActionClick = new EventEmitter<void>();
  @Output() secondaryActionClick = new EventEmitter<void>();
  @Output() linkSelected = new EventEmitter<FooterLink>();
  @Output() newsletterSubscribe = new EventEmitter<string>();

  readonly currentYear = new Date().getFullYear();
  readonly newsletterEmail = signal('');
  readonly subscribeSuccess = signal(false);

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') return;
      if (prefersReducedMotion()) return;

      runInGsapContext(
        this.element,
        () => {
          // Footer CTA note card entrance
          gsap.from('.footer-cta-container', {
            opacity: 0,
            y: 35,
            scale: 0.95,
            duration: 0.75,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: '.footer-cta-container',
              start: 'top 85%',
              once: true,
            },
          });

          // Nav links and brand columns
          gsap.from(['.footer-brand-side', '.footer-nav-col', '.footer-newsletter-card'], {
            opacity: 0,
            y: 20,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.footer-main-grid',
              start: 'top 88%',
              once: true,
            },
          });
        },
        this.destroyRef,
      );
    });
  }

  onLinkSelected(link: FooterLink): void {
    this.linkSelected.emit(link);
  }

  onSubscribe(event: Event): void {
    event.preventDefault();
    const email = this.newsletterEmail().trim();
    if (email) {
      this.newsletterSubscribe.emit(email);
      this.subscribeSuccess.set(true);
      this.newsletterEmail.set('');
      setTimeout(() => this.subscribeSuccess.set(false), 4000);
    }
  }

  scrollToTop(event: Event): void {
    event.preventDefault();
    if (typeof window !== 'undefined') {
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    }
  }
}
