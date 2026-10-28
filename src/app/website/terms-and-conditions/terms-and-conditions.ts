import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompanyShell } from '../company-pages/company-shell';
import { COMPANY, COMPANY_PAGES } from '../company-pages/company-pages.data';

@Component({
  standalone: true,
  selector: 'app-terms-and-conditions',
  imports: [RouterLink, CompanyShell],
  templateUrl: './terms-and-conditions.html',
  styleUrl: './terms-and-conditions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndConditions {
  readonly company = COMPANY;
  readonly page = COMPANY_PAGES['terms'];

}
