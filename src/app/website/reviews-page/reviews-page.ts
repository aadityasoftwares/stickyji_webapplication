import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideCheck,
  LucideSparkles,
  LucidePin,
  LucideStar,
  LucideHeart,
  LucideQuote,
  LucideFilter,
  LucideSend,
  LucideSmile,
  LucideThumbsUp,
  LucideClock3,
} from '@lucide/angular';
import { WebsiteHeader } from '../website-header/website-header';
import { WebsiteFooter } from '../website-footer/website-footer';
import { AppIcon } from '../../shared/components/icon/icon';
import { Avatar, AvatarTone } from '../../shared/components/avatar/avatar';

export type ReviewFilter = 'all' | 'students' | 'tech' | 'creators' | 'teams' | 'life';
export type NoteVariant = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';

export interface DetailedReview {
  id: string;
  name: string;
  role: string;
  location: string;
  category: ReviewFilter;
  rating: number;
  headline: string;
  content: string;
  breakthrough: string;
  timeUsing: string;
  noteColor: NoteVariant;
  angle: number;
  avatarTone: AvatarTone;
  avatarInitials: string;
}

export interface UserShoutout {
  id: string;
  name: string;
  role: string;
  message: string;
  color: NoteVariant;
  angle: number;
  emoji: string;
}

@Component({
  standalone: true,
  selector: 'app-reviews-page',
  imports: [
    RouterLink,
    WebsiteHeader,
    WebsiteFooter,
    AppIcon,
    Avatar,
  ],
  templateUrl: './reviews-page.html',
  styleUrl: './reviews-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsPage {
  private readonly router = inject(Router);

  // Lucide Icons
  readonly LucideArrowRight = LucideArrowRight;
  readonly LucideCheck = LucideCheck;
  readonly LucideSparkles = LucideSparkles;
  readonly LucidePin = LucidePin;
  readonly LucideStar = LucideStar;
  readonly LucideHeart = LucideHeart;
  readonly LucideQuote = LucideQuote;
  readonly LucideFilter = LucideFilter;
  readonly LucideSend = LucideSend;
  readonly LucideSmile = LucideSmile;
  readonly LucideThumbsUp = LucideThumbsUp;
  readonly LucideClock3 = LucideClock3;

  readonly activeFilter = signal<ReviewFilter>('all');

  // Shoutout simulator state
  readonly shoutoutName = signal<string>('Alex P.');
  readonly shoutoutRole = signal<string>('Designer & Visual Thinker');
  readonly shoutoutMessage = signal<string>('Sticky Ji gives my brain room to breathe. The Today view is pure gold!');
  readonly shoutoutColor = signal<NoteVariant>('yellow');
  readonly shoutoutEmoji = signal<string>('✨');

  readonly communityShoutouts = signal<UserShoutout[]>([
    {
      id: 's-1',
      name: 'Rohan Sharma',
      role: 'Fullstack Dev, Bengaluru',
      message: 'The cleanest software I have used this year. Zero cognitive drag.',
      color: 'yellow',
      angle: -1.8,
      emoji: '🚀',
    },
    {
      id: 's-2',
      name: 'Maya Lin',
      role: 'Creative Director, London',
      message: 'Paper feeling with digital speed. My team actually enjoys our morning board check-ins.',
      color: 'pink',
      angle: 2.1,
      emoji: '💛',
    },
  ]);

  readonly reviews: DetailedReview[] = [
    {
      id: 'rev-1',
      name: 'Nina Kapoor',
      role: 'Cognitive Science Student',
      location: 'Providence, RI',
      category: 'students',
      rating: 5,
      headline: 'I stopped rewriting the same list every single morning',
      content:
        'My lecture notes, thesis milestones, and normal life finally sit in one calm space. Being able to color-code each course and drag 3 tasks into the Today column gave me my peace of mind back.',
      breakthrough: 'Aced semester finals without cramming panic',
      timeUsing: 'Using for 8 months',
      noteColor: 'yellow',
      angle: -1.6,
      avatarTone: 'yellow',
      avatarInitials: 'NK',
    },
    {
      id: 'rev-2',
      name: 'Arjun Mehta',
      role: 'Head of Product at FinScale',
      location: 'Bengaluru, India',
      category: 'tech',
      rating: 5,
      headline: 'It shows me the actual work—not the ticket bureaucracy',
      content:
        'I needed a place for the 3 strategic decisions that matter today, not another Jira monster to administer. Sticky Ji gets out of my way and lets our squad focus on shipping high-impact features.',
      breakthrough: 'Standup meetings shortened from 45m to 15m',
      timeUsing: 'Using for 1 year',
      noteColor: 'blue',
      angle: 1.8,
      avatarTone: 'blue',
      avatarInitials: 'AM',
    },
    {
      id: 'rev-3',
      name: 'Sarah Linden',
      role: 'Author & Substack Creator',
      location: 'Edinburgh, UK',
      category: 'creators',
      rating: 5,
      headline: 'My fiction drafts finally feel alive and spatial',
      content:
        'Writing a novel in linear docs made me feel blind. Moving colored sticky notes across act columns helped me spot plot holes immediately. It feels like having an infinite corkboard in my pocket.',
      breakthrough: 'Finished 85,000-word book draft 2 months early',
      timeUsing: 'Using for 6 months',
      noteColor: 'pink',
      angle: -2.2,
      avatarTone: 'pink',
      avatarInitials: 'SL',
    },
    {
      id: 'rev-4',
      name: 'Marcus Vance',
      role: 'Founder at Studio Craft',
      location: 'Austin, TX',
      category: 'teams',
      rating: 5,
      headline: 'Our clients actually check our board without being reminded',
      content:
        'We ditched our confusing enterprise client portal for a shared Sticky Ji workspace. Clients love the visual clarity—they see deliverables, leave notes, and approvals happen within hours.',
      breakthrough: 'Saved 6 hours/week on client coordination emails',
      timeUsing: 'Using for 10 months',
      noteColor: 'purple',
      angle: 1.5,
      avatarTone: 'purple',
      avatarInitials: 'MV',
    },
    {
      id: 'rev-5',
      name: 'Elena Rostova',
      role: 'Biomedical Researcher',
      location: 'Toronto, Canada',
      category: 'students',
      rating: 5,
      headline: 'The only productivity system my ADHD brain has stuck with',
      content:
        'Traditional list apps create sensory overload. Sticky Ji’s pastel notes and "Today" sanctuary limit the noise so I don’t freeze. It feels friendly, forgiving, and delightfully tactile.',
      breakthrough: 'Zero forgotten lab deadlines for 6 straight months',
      timeUsing: 'Using for 9 months',
      noteColor: 'green',
      angle: -1.2,
      avatarTone: 'green',
      avatarInitials: 'ER',
    },
    {
      id: 'rev-6',
      name: 'David Reimann',
      role: 'Freelance Design Engineer',
      location: 'Berlin, Germany',
      category: 'tech',
      rating: 5,
      headline: 'The keyboard velocity and Cmd+K search are top tier',
      content:
        'I care deeply about software craft and micro-interactions. The physics when dragging notes, the instant search, and the clean typography make this my default tab every morning.',
      breakthrough: 'Replaced 4 different bloated productivity tools',
      timeUsing: 'Using for 7 months',
      noteColor: 'orange',
      angle: 2.3,
      avatarTone: 'orange',
      avatarInitials: 'DR',
    },
    {
      id: 'rev-7',
      name: 'Zoe Cooper',
      role: 'Community Lead & Parent',
      location: 'Melbourne, Australia',
      category: 'life',
      rating: 5,
      headline: 'Cleared the constant background buzz in my head',
      content:
        'Between parenting schedules, meal planning, and volunteer projects, my mental load was through the roof. Having dedicated color-coded boards for family routines brought genuine calm into our home.',
      breakthrough: 'Evenings feel peaceful instead of chaotic',
      timeUsing: 'Using for 1.2 years',
      noteColor: 'yellow',
      angle: -1.9,
      avatarTone: 'yellow',
      avatarInitials: 'ZC',
    },
    {
      id: 'rev-8',
      name: 'Kenji Takahashi',
      role: 'Hardware UX Specialist',
      location: 'Kyoto, Japan',
      category: 'creators',
      rating: 5,
      headline: 'Embraces the Japanese concept of ma (negative space)',
      content:
        'So many western tools suffer from feature bloat. Sticky Ji gives ideas room to breathe. The pastel palette is gentle on the eyes and the tactile paper notes honor the craft of physical stationery.',
      breakthrough: 'Redesigned our flagship hardware prototype board',
      timeUsing: 'Using for 5 months',
      noteColor: 'blue',
      angle: 1.1,
      avatarTone: 'blue',
      avatarInitials: 'KT',
    },
    {
      id: 'rev-9',
      name: 'Priya Deshmukh',
      role: 'Architecture Studio Lead',
      location: 'Mumbai, India',
      category: 'teams',
      rating: 5,
      headline: 'From site visits to client reviews in one visual flow',
      content:
        'Architects think in spatial cards and mood boards. We pin site photos, contractor milestones, and permit checklists on our shared workspace. It feels like our physical pinboard, but accessible from any site.',
      breakthrough: 'Shipped 3 commercial renovations on schedule',
      timeUsing: 'Using for 11 months',
      noteColor: 'pink',
      angle: -2.4,
      avatarTone: 'pink',
      avatarInitials: 'PD',
    },
    {
      id: 'rev-10',
      name: 'Liam O’Connor',
      role: 'Growth Marketing Lead',
      location: 'Dublin, Ireland',
      category: 'tech',
      rating: 5,
      headline: 'Finally killed our messy Google Sheets campaign trackers',
      content:
        'Managing content calendars in spreadsheets was torture. Sticky Ji’s Kanban flow gave our marketing team clarity on what is drafting, what is in review, and what is launching today.',
      breakthrough: 'Doubled weekly content publishing consistency',
      timeUsing: 'Using for 6 months',
      noteColor: 'green',
      angle: 1.6,
      avatarTone: 'green',
      avatarInitials: 'LO',
    },
    {
      id: 'rev-11',
      name: 'Ananya Banerjee',
      role: 'PhD Candidate in History',
      location: 'New Delhi, India',
      category: 'students',
      rating: 5,
      headline: 'Thesis outlines made painless with color coding',
      content:
        'I had 400 primary historical source citations. Organizing them on color-coded Sticky Ji boards allowed me to see patterns across centuries that I never noticed in linear documents.',
      breakthrough: 'Submitted doctoral dissertation defense draft',
      timeUsing: 'Using for 1.5 years',
      noteColor: 'purple',
      angle: -1.3,
      avatarTone: 'purple',
      avatarInitials: 'AB',
    },
    {
      id: 'rev-12',
      name: 'Clara Dupont',
      role: 'Independent Brand Consultant',
      location: 'Lyon, France',
      category: 'life',
      rating: 5,
      headline: 'The evening ritual note is my favorite feature',
      content:
        'Wrapping up the workday by peeling off finished sticky notes and seeing my clean canvas gives me a clear boundary between work and personal life. I sleep so much better.',
      breakthrough: 'Zero work email checks after 6:30 PM',
      timeUsing: 'Using for 8 months',
      noteColor: 'orange',
      angle: 2.0,
      avatarTone: 'orange',
      avatarInitials: 'CD',
    },
  ];

  setFilter(filter: ReviewFilter): void {
    this.activeFilter.set(filter);
  }

  get filteredReviews(): DetailedReview[] {
    const f = this.activeFilter();
    if (f === 'all') return this.reviews;
    return this.reviews.filter((r) => r.category === f);
  }

  setShoutoutColor(color: NoteVariant): void {
    this.shoutoutColor.set(color);
  }

  setShoutoutEmoji(emoji: string): void {
    this.shoutoutEmoji.set(emoji);
  }

  postShoutout(): void {
    const name = this.shoutoutName().trim() || 'Anonymous Thinker';
    const role = this.shoutoutRole().trim() || 'Sticky Ji User';
    const message = this.shoutoutMessage().trim() || 'Loving the calm workspace!';
    const angle = (Math.random() * 5 - 2.5);

    const newShoutout: UserShoutout = {
      id: 's-' + Date.now(),
      name,
      role,
      message,
      color: this.shoutoutColor(),
      angle,
      emoji: this.shoutoutEmoji(),
    };

    this.communityShoutouts.update((list) => [newShoutout, ...list.slice(0, 5)]);
    this.shoutoutMessage.set('');
  }

  navigateToAuth(page: 'login' | 'signup'): void {
    void this.router.navigate(['/auth', page]);
  }
}
