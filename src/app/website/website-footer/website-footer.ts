import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
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
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Collaboration', href: '#collaboration', badge: 'New' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Good to know',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'Stories', href: '#reviews' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Help desk',
    links: [
      { label: 'Help center', href: '/help' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'System status', href: '/status', external: true },
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

  @Input() brandName = 'MyStickyNotes';
  @Input() brandHref = '#top';
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
    { label: 'Email us', href: 'mailto:hello@mystickynotes.app', icon: LucideMail },
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