import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompanyShell } from '../company-pages/company-shell';
import { COMPANY, COMPANY_PAGES } from '../company-pages/company-pages.data';

@Component({
  standalone: true,
  selector: 'app-privacy-policy',
  imports: [RouterLink, CompanyShell],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicy {
  readonly company = COMPANY;
  readonly page = COMPANY_PAGES['privacy'];

}
