import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  LucideArrowRight,
  LucideCheckCircle2,
  LucideChevronLeft,
  LucideChevronRight,
  LucideQuote,
  LucideSparkles,
  LucideStar,
} from '@lucide/angular';
import { AvatarTone, Avatar } from '../../shared/components/avatar/avatar';
import { Badge } from '../../shared/components/badge/badge';
import { Button } from '../../shared/components/button/button';
import { Divider } from '../../shared/components/divider/divider';
import { AppIcon } from '../../shared/components/icon/icon';
import { Label } from '../../shared/components/label/label';
import { StickyCard } from '../../shared/components/sticky-card/sticky-card';


export type ReviewNoteVariant =
  | 'noteYellow'
  | 'noteBlue'
  | 'notePink'
  | 'noteGreen'
  | 'notePurple'
  | 'noteOrange';

export interface UserReview {
  id: string;
  name: string;
  initials: string;
  role: string;
  audience: string;
  headline: string;
  quote: string;
  result: string;
  usedFor: string;
  rating: number;
  avatarTone: AvatarTone;
  noteVariant: ReviewNoteVariant;
}

export const DEMO_USER_REVIEWS: readonly UserReview[] = [
  {
    id: 'nina-student',
    name: 'Nina Kapoor',
    initials: 'NK',
    role: 'Design student',
    audience: 'Student note',
    headline: 'I stopped rewriting the same list every morning.',
    quote: 'My assignments, revision notes, and normal life finally sit in one place. It feels visual enough to understand in a glance and simple enough that I actually keep using it.',
    result: 'A calmer exam week with fewer forgotten deadlines.',
    usedFor: 'Study planning',
    rating: 5,
    avatarTone: 'yellow',
    noteVariant: 'noteYellow',
  },
  {
    id: 'arjun-professional',
    name: 'Arjun Mehta',
    initials: 'AM',
    role: 'Product manager',
    audience: 'Work note',
    headline: 'It shows me the work—not the machinery around it.',
    quote: 'I needed a place for the three decisions that matter today, not another system to administer. MyStickyNotes gives me exactly that and gets out of the way.',
    result: 'Priorities stay visible between meetings and messages.',
    usedFor: 'Daily priorities',
    rating: 5,
    avatarTone: 'blue',
    noteVariant: 'noteBlue',
  },
  {
    id: 'sara-creator',
    name: 'Sara Kim',
    initials: 'SK',
    role: 'Independent creator',
    audience: 'Creator note',
    headline: 'My rough ideas finally have somewhere safe to be rough.',
    quote: 'I can capture a half-formed idea without immediately turning it into a project. When I am ready, the next step is already waiting beside it.',
    result: 'More ideas survive long enough to become finished work.',
    usedFor: 'Content ideas',
    rating: 5,
    avatarTone: 'pink',
    noteVariant: 'notePink',
  },
  {
    id: 'jamie-life',
    name: 'Jamie Diaz',
    initials: 'JD',
    role: 'Everyday planner',
    audience: 'Life note',
    headline: 'It is like the note on my fridge, except it comes with me.',
    quote: 'Groceries, appointments, calls, and little promises used to disappear into different apps. Now I have one friendly place to look before leaving the house.',
    result: 'Less mental remembering and more room to be present.',
    usedFor: 'Life admin',
    rating: 5,
    avatarTone: 'green',
    noteVariant: 'noteGreen',
  },
  {
    id: 'maya-team',
    name: 'Maya Shah',
    initials: 'MS',
    role: 'Small-team lead',
    audience: 'Team note',
    headline: 'Enough structure to align us, never enough to slow us down.',
    quote: 'The team can see what moved, what is waiting, and where someone needs help. We spend less time reporting progress and more time making it.',
    result: 'Clearer handoffs without adding another status meeting.',
    usedFor: 'Team launches',
    rating: 5,
    avatarTone: 'purple',
    noteVariant: 'notePurple',
  },
  {
    id: 'dev-freelancer',
    name: 'Dev Patel',
    initials: 'DP',
    role: 'Freelance developer',
    audience: 'Freelance note',
    headline: 'Small client promises no longer live in my memory.',
    quote: 'I pin the follow-up while I am still on the call, give it one next step, and move on. That tiny habit has made my work feel much more dependable.',
    result: 'Fewer dropped follow-ups across multiple client projects.',
    usedFor: 'Client work',
    rating: 5,
    avatarTone: 'orange',
    noteVariant: 'noteOrange',
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

  selector: 'app-reviews',
  styleUrl: './reviews.scss',
  templateUrl: './reviews.html',
})
export class Reviews {
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheckCircle2 = LucideCheckCircle2;
  readonly LucideChevronLeft = LucideChevronLeft;
  readonly LucideChevronRight = LucideChevronRight;
  readonly LucideQuote = LucideQuote;
  readonly LucideSparkles = LucideSparkles;
  readonly LucideStar = LucideStar;
  readonly stars = [1, 2, 3, 4, 5] as const;

  private reviewItems: readonly UserReview[] = DEMO_USER_REVIEWS;

  @Input()
  set reviews(value: readonly UserReview[] | null | undefined) {
    this.reviewItems = value?.length ? value : DEMO_USER_REVIEWS;

    if (!this.reviewItems.some((review) => review.id === this.selectedReviewId)) {
      this.selectedReviewId = this.reviewItems[0].id;
    }
  }

  get reviews(): readonly UserReview[] {
    return this.reviewItems;
  }

  @Output() reviewChange = new EventEmitter<UserReview>();
  @Output() storiesClick = new EventEmitter<void>();

  selectedReviewId = this.reviewItems[0].id;

  get activeReview(): UserReview {
    return this.reviewItems.find((review) => review.id === this.selectedReviewId) ?? this.reviewItems[0];
  }

  get activeIndex(): number {
    return Math.max(0, this.reviewItems.findIndex((review) => review.id === this.selectedReviewId));
  }

  get sideReviews(): readonly UserReview[] {
    if (this.reviewItems.length <= 1) {
      return [];
    }

    return [1, 2]
      .map((offset) => this.reviewItems[(this.activeIndex + offset) % this.reviewItems.length])
      .filter((review) => review.id !== this.activeReview.id)
      .filter((review, index, reviews) => reviews.findIndex((item) => item.id === review.id) === index);
  }

  selectReview(review: UserReview): void {
    if (review.id === this.selectedReviewId) {
      return;
    }

    this.selectedReviewId = review.id;
    this.reviewChange.emit(review);
  }

  showPreviousReview(): void {
    const index = (this.activeIndex - 1 + this.reviewItems.length) % this.reviewItems.length;
    this.selectReview(this.reviewItems[index]);
  }

  showNextReview(): void {
    const index = (this.activeIndex + 1) % this.reviewItems.length;
    this.selectReview(this.reviewItems[index]);
  }

  onReviewKeydown(event: KeyboardEvent, currentIndex: number): void {
    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;

    if (!direction) {
      return;
    }

    event.preventDefault();

    const nextIndex = (currentIndex + direction + this.reviewItems.length) % this.reviewItems.length;
    const tabs = (event.currentTarget as HTMLElement)
      .parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    this.selectReview(this.reviewItems[nextIndex]);
    tabs?.[nextIndex]?.focus();
  }
}