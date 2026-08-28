import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  LucideArrowRight,
  LucideCheck,
  LucideCreditCard,
  LucideMinus,
  LucideShieldCheck,
  LucideSparkles,
  LucideUsersRound,
  LucideZap,
} from '@lucide/angular';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Divider } from '../../shared/components/divider/divider';
import { AppIcon } from '../../shared/components/icon/icon';
import { Label } from '../../shared/components/label/label';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';

export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionNoteVariant = 'noteYellow' | 'noteBlue' | 'notePurple';

export interface SubscriptionFeature {
  label: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  priceSuffix?: string;
  yearlySavingLabel?: string;
  ctaLabel: string;
  footnote: string;
  noteVariant: SubscriptionNoteVariant;
  featured?: boolean;
  badge?: string;
  teamPreview?: boolean;
  features: readonly SubscriptionFeature[];
}

export interface SubscriptionSelection {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
}

export const DEMO_SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    eyebrow: 'A clear little corner',
    description: 'For capturing thoughts and building a simple personal rhythm.',
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    ctaLabel: 'Start free',
    footnote: 'Free forever. No card required.',
    noteVariant: 'noteYellow',
    features: [
      { label: 'Up to 100 active notes', included: true },
      { label: 'Personal boards and lists', included: true },
      { label: 'Colors, labels, and reminders', included: true },
      { label: 'Advanced history', included: false },
      { label: 'Team spaces', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    eyebrow: 'Room for your whole day',
    description: 'For people who want more space, deeper focus, and fewer open loops.',
    monthlyPrice: 8,
    yearlyMonthlyPrice: 6,
    yearlySavingLabel: 'Save 25%',
    ctaLabel: 'Choose Plus',
    footnote: 'Cancel whenever you want.',
    noteVariant: 'noteBlue',
    featured: true,
    badge: 'Most loved',
    features: [
      { label: 'Unlimited notes and boards', included: true },
      { label: 'Recurring reminders', included: true },
      { label: 'Full note history', included: true },
      { label: 'Priority and focus views', included: true },
      { label: 'Export whenever you need', included: true },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    eyebrow: 'A shared desk that stays calm',
    description: 'For small teams that need visible ownership without process overhead.',
    monthlyPrice: 15,
    yearlyMonthlyPrice: 12,
    priceSuffix: 'per person',
    yearlySavingLabel: 'Save 20%',
    ctaLabel: 'Start a team space',
    footnote: 'Invite teammates when you are ready.',
    noteVariant: 'notePurple',
    teamPreview: true,
    features: [
      { label: 'Everything in Plus', included: true },
      { label: 'Shared boards and spaces', included: true },
      { label: 'Owners, mentions, and handoffs', included: true },
      { label: 'Team activity history', included: true },
      { label: 'Simple workspace controls', included: true },
    ],
  },
];

@Component({
  standalone: true,
  imports: [
    AppIcon,
    Avatar,
    Badge,
    Button,
    Divider,
    Label,
    StickyCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-subscription',
  styleUrl: './subscription.scss',
  templateUrl: './subscription.html',
})
export class Subscription {

  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideCreditCard = LucideCreditCard;
  readonly LucideMinus = LucideMinus;
  readonly LucideShieldCheck = LucideShieldCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideUsersRound = LucideUsersRound;
  readonly LucideZap = LucideZap;

  @Input() plans: readonly SubscriptionPlan[] = DEMO_SUBSCRIPTION_PLANS;
  @Input() currencySymbol = '$';
  @Input() initialBillingCycle: BillingCycle = 'yearly';

  @Output() billingCycleChange = new EventEmitter<BillingCycle>();
  @Output() planSelected = new EventEmitter<SubscriptionSelection>();

  billingCycle: BillingCycle = 'yearly';

  ngOnInit(): void {
    this.billingCycle = this.initialBillingCycle;
  }

  setBillingCycle(cycle: BillingCycle): void {
    if (this.billingCycle === cycle) {
      return;
    }

    this.billingCycle = cycle;
    this.billingCycleChange.emit(cycle);
  }

  getPrice(plan: SubscriptionPlan): number {
    return this.billingCycle === 'yearly'
      ? plan.yearlyMonthlyPrice
      : plan.monthlyPrice;
  }

  getBillingNote(plan: SubscriptionPlan): string {
    if (this.getPrice(plan) === 0) {
      return 'Free forever';
    }

    if (this.billingCycle === 'yearly') {
      const yearlyTotal = plan.yearlyMonthlyPrice * 12;
      return `Billed ${this.currencySymbol}${yearlyTotal} once a year`;
    }

    return 'Billed monthly';
  }

  choosePlan(plan: SubscriptionPlan): void {
    this.planSelected.emit({
      plan,
      billingCycle: this.billingCycle,
    });
  }

  onBillingKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }

    event.preventDefault();
    this.setBillingCycle(this.billingCycle === 'monthly' ? 'yearly' : 'monthly');

    const selectedButton = (event.currentTarget as HTMLElement)
      .querySelector<HTMLButtonElement>(`[data-cycle="${this.billingCycle}"]`);

    selectedButton?.focus();
  }
}
