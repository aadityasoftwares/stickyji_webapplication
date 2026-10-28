import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompanyShell } from '../company-pages/company-shell';
import { COMPANY, COMPANY_PAGES } from '../company-pages/company-pages.data';

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
    { title: 'Product support', text: 'A little help getting back to your notes.', subject: 'Sticky Ji support', tone: 'yellow', number: '01' },
    { title: 'Billing & plans', text: 'Payments, cancellations, and refund enquiries.', subject: 'Sticky Ji billing enquiry', tone: 'pink', number: '02' },
    { title: 'Privacy & legal', text: 'Your information, your rights, and your questions.', subject: 'Sticky Ji privacy request', tone: 'blue', number: '03' },
    { title: 'Ideas & security', text: 'Share feedback or report a concern privately.', subject: 'Sticky Ji feedback or security report', tone: 'green', number: '04' },
  ];
  emailLink(subject: string): string {
    return 'mailto:' + this.company.email + '?subject=' + encodeURIComponent(subject);
  }
}
