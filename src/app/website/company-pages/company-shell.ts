import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WebsiteHeader } from '../website-header/website-header';
import { WebsiteFooter } from '../website-footer/website-footer';

@Component({
  standalone: true,
  selector: 'app-company-shell',
  imports: [RouterLink, WebsiteHeader, WebsiteFooter],
  template: `
    <app-website-header (signInClick)="navigate('login')" (primaryActionClick)="navigate('signup')" />
    <main id="top">
      <nav aria-label="Company pages">
        <a routerLink="/home" class="home-link">← Home</a>
        @for (link of links; track link.path) {
          <a [routerLink]="link.path" [attr.aria-current]="active === link.key ? 'page' : null">{{ link.label }}</a>
        }
      </nav>
      <ng-content />
    </main>
    <app-website-footer (primaryActionClick)="navigate('signup')" (secondaryActionClick)="navigate('login')" />
  `,
  styles: `
    :host { display: block; background: #fffdf9; color: #292720; }
    main { max-width: 1200px; margin: auto; padding: 24px 32px 88px; }
    nav { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 4px 0 28px; border-bottom: 1px solid #ebe5d9; }
    nav a { color: #615d54; padding: 10px 15px; border-radius: 24px; font-size: 13px; text-decoration: none; }
    nav .home-link { margin-right: auto; }
    nav a:hover { background: #f3efe6; }
    nav a[aria-current] { background: #ffedbf; color: #322817; font-weight: 700; }
    a:focus-visible { outline: 2px solid #956000; outline-offset: 3px; }
    @media(max-width: 600px) { main { padding: 16px 20px 48px; } nav { gap: 4px; } nav a { padding: 8px; font-size: 12px; } nav .home-link { width: 100%; } }
    @media print { app-website-header, app-website-footer, nav { display: none; } main { padding: 0; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyShell {
  @Input({ required: true }) active = '';
  private readonly router = inject(Router);
  readonly links = [
    { key: 'about', label: 'About us', path: '/about-us' },
    { key: 'contact', label: 'Contact us', path: '/contact-us' },
    { key: 'privacy', label: 'Privacy policy', path: '/privacy-policy' },
    { key: 'terms', label: 'Terms & conditions', path: '/terms-and-conditions' },
  ];
  navigate(page: 'login' | 'signup'): void {
    void this.router.navigate(['/auth', page]);
  }
}
