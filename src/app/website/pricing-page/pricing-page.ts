import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCheck,
  LucideMinus,
  LucideSparkles,
  LucidePin,
  LucideShield,
  LucideShieldCheck,
  LucideZap,
  LucideHelpCircle,
  LucideChevronDown,
  LucideChevronUp,
  LucideHeart,
  LucideCreditCard,
  LucideRefreshCw,
  LucideUsers,
} from '@lucide/angular';
import { WebsiteHeader } from '../website-header/website-header';
import { WebsiteFooter } from '../website-footer/website-footer';
import { AppIcon } from '../../shared/components/icon/icon';

export type BillingCycle = 'monthly' | 'yearly';

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  isPopular?: boolean;
  color: 'yellow' | 'pink' | 'blue' | 'white';
  monthlyPrice: string;
  yearlyPrice: string;
  period: string;
  billedNote: string;
  highlights: string[];
  ctaLabel: string;
  planCode: string;
}

export interface ComparisonRow {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
}

export interface ComparisonCategory {
  title: string;
  rows: ComparisonRow[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  standalone: true,
  selector: 'app-pricing-page',
  imports: [
    RouterLink,
    WebsiteHeader,
    WebsiteFooter,
    AppIcon,
  ],
  templateUrl: './pricing-page.html',
  styleUrl: './pricing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingPage {
  private readonly router = inject(Router);

  // Lucide Icons
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideMinus = LucideMinus;
  readonly LucideSparkles = LucideSparkles;
  readonly LucidePin = LucidePin;
  readonly LucideShield = LucideShield;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideZap = LucideZap;
  readonly LucideHelpCircle = LucideHelpCircle;
  readonly LucideChevronDown = LucideChevronDown;
  readonly LucideChevronUp = LucideChevronUp;
  readonly LucideHeart = LucideHeart;
  readonly LucideCreditCard = LucideCreditCard;
  readonly LucideRefreshCw = LucideRefreshCw;
  readonly LucideUsers = LucideUsers;

  readonly billingCycle = signal<BillingCycle>('yearly');

  readonly plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free Forever',
      tagline: 'All the essential sticky note tools to bring calm to everyday thoughts.',
      color: 'white',
      monthlyPrice: '$0',
      yearlyPrice: '$0',
      period: 'forever',
      billedNote: 'No credit card needed · Start right away',
      highlights: [
        'Up to 3 active sticky boards',
        '100 active digital sticky notes',
        'Standard 6-color pastel palette',
        'The dedicated "Today" focus view',
        'Interactive checklists inside notes',
        'Mobile web access on phone & tablet',
      ],
      ctaLabel: 'Start free forever',
      planCode: 'FREE',
    },
    {
      id: 'pro',
      name: 'Pro Thinker',
      tagline: 'For students, creators, and professionals who need unlimited space to think.',
      badge: 'MOST POPULAR',
      isPopular: true,
      color: 'yellow',
      monthlyPrice: '$6',
      yearlyPrice: '$4.80',
      period: 'per month',
      billedNote: 'Billed annually ($58/yr) · Save 20%',
      highlights: [
        'Unlimited boards & workspaces',
        'Unlimited digital sticky notes',
        'Full 10 custom pastel paper palettes',
        'Smart folders & nested tag hierarchy',
        'File & photo attachments on notes',
        'Gentle overdue reminders & triage',
        '1-click export to PDF and JSON',
        'Priority email & chat support',
      ],
      ctaLabel: 'Get Pro access',
      planCode: 'PRO',
    },
    {
      id: 'team',
      name: 'Team Studio',
      tagline: 'For studios, squads, and agencies who collaborate on visual deliverables.',
      badge: 'MULTIPLAYER',
      color: 'blue',
      monthlyPrice: '$12',
      yearlyPrice: '$9.60',
      period: 'per user / mo',
      billedNote: 'Billed annually · Flexible seat management',
      highlights: [
        'Everything included in Pro',
        'Unlimited shared team workspaces',
        'Real-time live multi-user sync',
        'Role permissions: Owner, Editor, Viewer',
        'Teammate presence & author avatars',
        '1-click magic workspace invite links',
        'Team workspace activity audit history',
        'Centralized team billing & invoices',
      ],
      ctaLabel: 'Start 14-day team trial',
      planCode: 'TEAM',
    },
  ];

  readonly comparisonCategories: ComparisonCategory[] = [
    {
      title: 'Canvas & Notes Craft',
      rows: [
        { name: 'Active sticky notes', free: '100 notes', pro: 'Unlimited', team: 'Unlimited' },
        { name: 'Active boards', free: '3 boards', pro: 'Unlimited', team: 'Unlimited' },
        { name: 'Pastel paper color palettes', free: '6 basic hues', pro: 'All 10 pastel palettes', team: 'All 10 pastel palettes' },
        { name: 'Rich markdown & bold lists', free: true, pro: true, team: true },
        { name: 'Interactive note checklists', free: true, pro: true, team: true },
        { name: 'Pinned notes to board top', free: true, pro: true, team: true },
        { name: 'File & image attachments', free: false, pro: 'Up to 25MB / note', team: 'Up to 100MB / note' },
      ],
    },
    {
      title: 'Organization & Focus',
      rows: [
        { name: 'The "Today" sanctuary view', free: true, pro: true, team: true },
        { name: 'Kanban columns & custom status', free: 'Standard columns', pro: 'Unlimited custom', team: 'Unlimited custom' },
        { name: 'Smart folders & nested spaces', free: 'Basic folders', pro: 'Unlimited nested', team: 'Unlimited nested' },
        { name: 'Fuzzy search across all boards (Cmd+K)', free: true, pro: true, team: true },
        { name: 'Gentle overdue reminders', free: false, pro: true, team: true },
        { name: 'Board export (PDF / JSON)', free: false, pro: true, team: true },
        { name: 'Safe trash recovery (30 days)', free: true, pro: true, team: true },
      ],
    },
    {
      title: 'Multidisciplinary Collaboration',
      rows: [
        { name: 'Shared team workspaces', free: false, pro: false, team: 'Unlimited' },
        { name: 'Real-time multi-user live sync', free: false, pro: false, team: true },
        { name: 'Granular member roles (Owner, Editor, Viewer)', free: false, pro: false, team: true },
        { name: 'Magic invite links', free: false, pro: false, team: true },
        { name: 'Teammate presence & author avatars', free: false, pro: false, team: true },
      ],
    },
    {
      title: 'Support & Security',
      rows: [
        { name: 'End-to-end data encryption', free: true, pro: true, team: true },
        { name: 'Automated daily cloud backups', free: true, pro: true, team: true },
        { name: 'Zero tracking / privacy first', free: true, pro: true, team: true },
        { name: 'Customer support', free: 'Community', pro: 'Priority Email', team: 'Dedicated 24/7 Priority' },
        { name: 'Uptime SLA', free: '99.5%', pro: '99.9%', team: '99.99%' },
      ],
    },
  ];

  readonly faqs = signal<FAQItem[]>([
    {
      id: 'faq-1',
      question: 'Can I really use Sticky Ji completely free forever?',
      answer:
        'Yes! The Free plan gives you everything you need to organize everyday thoughts: 3 active boards, 100 notes, our signature 6-color pastel palette, and the full "Today" daily focus view. There is no trial expiration and no credit card required.',
      isOpen: true,
    },
    {
      id: 'faq-2',
      question: 'How does the annual billing discount work?',
      answer:
        'When you select Yearly billing, you receive an immediate 20% discount on both Pro and Team plans. You are billed once per year, locking in your lower monthly equivalent rate.',
      isOpen: false,
    },
    {
      id: 'faq-3',
      question: 'Can I switch plans or cancel at any time?',
      answer:
        'Absolutely. You can upgrade, downgrade, or cancel your subscription at any time with a single click from your workspace settings. If you cancel, your paid features will remain active until the end of your billing cycle, and your data is never deleted.',
      isOpen: false,
    },
    {
      id: 'faq-4',
      question: 'Do you offer student or academic discounts?',
      answer:
        'Yes! We believe students deserve calm study spaces. We offer an extra 40% discount for verified students and academic educators. Just contact our support team with your university email address.',
      isOpen: false,
    },
    {
      id: 'faq-5',
      question: 'How does Team seat licensing work?',
      answer:
        'On the Team plan, you only pay for the team members who actively edit or create notes. Guests who only need view access can be invited as Viewers for free without consuming a paid seat.',
      isOpen: false,
    },
    {
      id: 'faq-6',
      question: 'Is my data private, secure, and exportable?',
      answer:
        'Yes. All data in Sticky Ji is encrypted both in transit (TLS 1.3) and at rest (AES-256). We never sell your data or serve ads. Furthermore, you can export your boards and notes at any time to clean PDF and standard JSON formats.',
      isOpen: false,
    },
  ]);

  setBillingCycle(cycle: BillingCycle): void {
    this.billingCycle.set(cycle);
  }

  toggleFaq(id: string): void {
    this.faqs.update((items) =>
      items.map((item) => (item.id === id ? { ...item, isOpen: !item.isOpen } : item)),
    );
  }

  choosePlan(planCode: string): void {
    void this.router.navigate(['/auth/signup'], {
      queryParams: { plan: planCode, cycle: this.billingCycle() },
    });
  }

  navigateToAuth(page: 'login' | 'signup'): void {
    void this.router.navigate(['/auth', page]);
  }
}
