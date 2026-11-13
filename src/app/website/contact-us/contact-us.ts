import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { CompanyShell } from '../company-pages/company-shell';
import { COMPANY, COMPANY_PAGES } from '../company-pages/company-pages.data';
import { prefersReducedMotion, runInGsapContext } from '../gsap-utils';

@Component({
  standalone: true,
  selector: 'app-contact-us',
  imports: [RouterLink, CompanyShell],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactUs {
  readonly company = COMPANY;
  readonly page = COMPANY_PAGES['contact'];

  readonly topics = [
    {
      title: 'Product support',
      text: 'A little help getting back to your notes.',
      subject: 'Sticky Ji support',
      tone: 'yellow',
      number: '01',
    },
    {
      title: 'Billing & plans',
      text: 'Payments, cancellations, and refund enquiries.',
      subject: 'Sticky Ji billing enquiry',
      tone: 'pink',
      number: '02',
    },
    {
      title: 'Privacy & legal',
      text: 'Your information, your rights, and your questions.',
      subject: 'Sticky Ji privacy request',
      tone: 'blue',
      number: '03',
    },
    {
      title: 'Ideas & security',
      text: 'Share feedback or report a concern privately.',
      subject: 'Sticky Ji feedback or security report',
      tone: 'green',
      number: '04',
    },
  ];

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') return;
      if (prefersReducedMotion()) return;

      runInGsapContext(
        this.element,
        () => {
          // 1. Hero
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

          tl.from('.contact-hero .eyebrow', {
            opacity: 0,
            y: 12,
            duration: 0.5,
            ease: 'back.out(1.7)',
          })
            .from('.contact-hero h1', { opacity: 0, y: 32, duration: 0.75 }, '-=0.3')
            .from(
              '.contact-hero .intro',
              { opacity: 0, y: 18, duration: 0.6, ease: 'power2.out' },
              '-=0.4',
            );

          // 2. Email panel
          gsap.from('.email-panel', {
            opacity: 0,
            x: -28,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.contact-layout',
              start: 'top 85%',
              once: true,
            },
          });

          // 3. Topic cards with tactile rotation & stagger
          gsap.from('.topic-card', {
            opacity: 0,
            y: 35,
            scale: 0.94,
            rotation: (i: number) => (i % 2 === 0 ? -1.5 : 1.5),
            duration: 0.65,
            stagger: 0.1,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: '.topic-grid',
              start: 'top 85%',
              once: true,
            },
          });

          // 4. Contact details & questions
          gsap.from('.contact-details details', {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.contact-details',
              start: 'top 85%',
              once: true,
            },
          });
        },
        this.destroyRef,
      );
    });
  }

  emailLink(subject: string): string {
    return 'mailto:' + this.company.email + '?subject=' + encodeURIComponent(subject);
  }
}
