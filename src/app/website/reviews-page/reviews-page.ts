import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompanyShell } from '../company-pages/company-shell';

@Component({
  selector: 'app-reviews-page',
  imports: [CompanyShell, RouterLink],
  template: `<app-company-shell
    ><h1>Share your Sticky Ji feedback</h1>
    <p>Tell us what helps you organize your day and what could work better.</p>
    <p>
      <a routerLink="/contact-us">Contact the Sticky Ji team</a> with feedback. Please leave out
      private notes and account credentials.
    </p>
    <p>
      Explore <a routerLink="/use-cases">workflow examples</a> or
      <a routerLink="/features">product features</a>.
    </p>
  </app-company-shell>`,
})
export class ReviewsPage {}
