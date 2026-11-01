import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { WebsiteHeader } from '../website-header/website-header';
import { WebsiteFooter } from '../website-footer/website-footer';

@Component({
  standalone: true,
  selector: 'app-company-shell',
  imports: [WebsiteHeader, WebsiteFooter],
  template: `
    <app-website-header (signInClick)="navigate('login')" (primaryActionClick)="navigate('signup')" />
    <main id="top">
      <ng-content />
    </main>
    <app-website-footer (primaryActionClick)="navigate('signup')" (secondaryActionClick)="navigate('login')" />
  `,
  styles: `
    :host { display: block; background: radial-gradient(ellipse at 50% 280px, #fff6bd99, transparent 64%), #fffdf9; color: #292720; }
    main { max-width: 1200px; margin: auto; padding: 32px 32px 88px; }
    @media(max-width: 600px) { main { padding: 20px 20px 48px; } }
    @media print { app-website-header, app-website-footer { display: none; } main { padding: 0; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyShell {
  @Input() active = '';
  private readonly router = inject(Router);

  navigate(page: 'login' | 'signup'): void {
    void this.router.navigate(['/auth', page]);
  }
}
