import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  LucideArrowRight,
  LucideArrowUp,
  LucideCheck,
  LucideExternalLink,
  LucideHeart,
  LucideStar,
  LucideLink,
  LucideMail,
  LucideSparkles,
} from '@lucide/angular';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Divider } from '../../shared/components/divider/divider';
import { AppIconDefinition, AppIcon } from '../../shared/components/icon/icon';
import { Label } from '../../shared/components/label/label';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  badge?: string;
}

export interface FooterLinkGroup {
  title: string;
  links: readonly FooterLink[];
}

export interface FooterSocialLink {
  label: string;
  href: string;
  icon: AppIconDefinition;
}

export const DEFAULT_FOOTER_GROUPS: readonly FooterLinkGroup[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/home#features' },
      { label: 'How it works', href: '/home#how-it-works' },
      { label: 'Use cases', href: '/home#use-cases' },
      { label: 'Pricing', href: '/home#pricing' },
    ],
  },
  {
    title: 'Good to know',
    links: [
      { label: 'Home', href: '/home' },
      { label: 'Stories', href: '/home#reviews' },
      { label: 'Use cases', href: '/home#use-cases' },
      { label: 'Plans', href: '/home#pricing' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Create an account', href: '/auth/signup' },
      { label: 'Sign in', href: '/auth/login' },
      { label: 'How it works', href: '/home#how-it-works' },
      { label: 'Forgot password', href: '/auth/forgot-password' },
    ],
  },
];

@Component({
  standalone: true,
  imports: [AppIcon, Badge, Button, Divider, Label],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-website-footer',
  styleUrl: './website-footer.scss',
  templateUrl: './website-footer.html',
})
export class WebsiteFooter {
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideArrowUp = LucideArrowUp;
  readonly LucideCheck = LucideCheck;
  readonly LucideExternalLink = LucideExternalLink;
  readonly LucideHeart = LucideHeart;
  readonly LucideInstagram = LucideHeart;
  readonly LucideLinkedin = LucideHeart;
  readonly LucideMail = LucideMail;
  readonly LucideSparkles = LucideSparkles;

  @Input() brandName = 'Sticky Ji';
  @Input() logoSrc = 'StickyJiVerticalLogo.png';
  @Input() mascotSrc = 'StickyJiLogo.png';
  @Input() brandHref = '/home#top';
  @Input() description = 'A calmer home for ideas, everyday plans, and the work people share.';
  @Input() ctaTitle = 'Your next good idea needs somewhere to land.';
  @Input() ctaDescription = 'Start with one note. Invite your people when the idea gets bigger.';
  @Input() primaryActionLabel = 'Start for free';
  @Input() secondaryActionLabel = 'Sign in';
  @Input() statusLabel = 'All notes are syncing';
  @Input() linkGroups: readonly FooterLinkGroup[] = DEFAULT_FOOTER_GROUPS;
  @Input() socialLinks: readonly FooterSocialLink[] = [
    { label: 'Instagram', href: 'https://instagram.com', icon: LucideHeart },
    { label: 'LinkedIn', href: 'https://linkedin.com', icon: LucideHeart },
    { label: 'Email us', href: 'mailto:hello@stickyji.app', icon: LucideMail },
  ];

  @Output() primaryActionClick = new EventEmitter<void>();
  @Output() secondaryActionClick = new EventEmitter<void>();
  @Output() linkSelected = new EventEmitter<FooterLink>();
  @Output() socialSelected = new EventEmitter<FooterSocialLink>();

  readonly currentYear = new Date().getFullYear();

  onLinkSelected(link: FooterLink): void {
    this.linkSelected.emit(link);
  }

  onSocialSelected(link: FooterSocialLink): void {
    this.socialSelected.emit(link);
  }
}
