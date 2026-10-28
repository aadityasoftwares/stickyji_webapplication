import { DOCUMENT, ViewportScroller } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
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
  LucideSparkles,
  LucideUsers,
} from '@lucide/angular';
import { AppIcon } from '../../shared/components/icon/icon';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';

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
  type: 'linkedin' | 'x' | 'instagram' | 'youtube';
}

export const DEFAULT_FOOTER_GROUPS: readonly FooterLinkGroup[] = [
  {
    title: 'Product',
    icon: 'sparkles',
    badgeColor: 'yellow',
    links: [
      { label: 'Features', href: '/home#features' },
      { label: 'How it works', href: '/home#how-it-works' },
      { label: 'Use cases', href: '/home#use-cases' },
      { label: 'Pricing', href: '/home#pricing' },
      { label: "What's new", href: '/home#features', badge: 'New' },
      { label: 'Roadmap', href: '/home#features' },
    ],
  },
  {
    title: 'Solutions',
    icon: 'home',
    badgeColor: 'pink',
    links: [
      { label: 'For students', href: '/home#use-cases' },
      { label: 'For professionals', href: '/home#use-cases' },
      { label: 'For creators', href: '/home#use-cases' },
      { label: 'For everyday life', href: '/home#use-cases' },
      { label: 'Small teams', href: '/home#use-cases' },
    ],
  },
  {
    title: 'Resources',
    icon: 'book',
    badgeColor: 'blue',
    links: [
      { label: 'Blog', href: '/home#reviews' },
      { label: 'Help center', href: '/home#how-it-works' },
      { label: 'Guides', href: '/home#how-it-works' },
      { label: 'Templates', href: '/home#features' },
      { label: 'Product updates', href: '/home#features' },
      { label: 'Status', href: '/home' },
    ],
  },
  {
    title: 'Company',
    icon: 'users',
    badgeColor: 'green',
    links: [
      { label: 'About us', href: '/about-us' },
      { label: 'Careers', href: '/home' },
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
  readonly LucideSparkles = LucideSparkles;

  @Input() brandName = 'Sticky Ji';
  @Input() logoSrc = 'StickyJiHorizontalLogo.png';
  @Input() mascotSrc = 'StickyJiLogo.png';
  @Input() brandHref = '/home#top';
  @Input() description = 'A calmer home for ideas, everyday plans, and the work people share.';
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
  @Input() socialLinks?: readonly unknown[];

  @Output() primaryActionClick = new EventEmitter<void>();
  @Output() secondaryActionClick = new EventEmitter<void>();
  @Output() linkSelected = new EventEmitter<FooterLink>();
  @Output() newsletterSubscribe = new EventEmitter<string>();

  readonly currentYear = new Date().getFullYear();
  readonly newsletterEmail = signal('');
  readonly subscribeSuccess = signal(false);

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
