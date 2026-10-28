import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompanyShell } from '../company-pages/company-shell';
import { COMPANY, COMPANY_PAGES } from '../company-pages/company-pages.data';

@Component({
  standalone: true,
  selector: 'app-about-us',
  imports: [RouterLink, CompanyShell],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutUs {
  readonly company = COMPANY;
  readonly page = COMPANY_PAGES['about'];

}
