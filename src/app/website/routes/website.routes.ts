import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { COMPANY } from '../company-pages/company-pages.data';

const sectionRoute = (path: string, fragment: string) => ({
  path,
  pathMatch: 'full' as const,
  redirectTo: () => inject(Router).createUrlTree(['/home'], { fragment }),
});

export const WEBSITE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../website/website').then((m) => m.Website),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        title: 'Sticky Ji — Visual Sticky Notes, Mindful Task Planner & Calmer Workspace',
        loadComponent: () => import('../home/home').then((m) => m.Home),
        data: {
          description:
            'Sticky Ji brings your notes, tasks, and everyday plans together on a calm, visual canvas with colorful sticky notes, smart folders, and a focused daily workflow.',
          keywords:
            'sticky notes, visual notes, digital sticky notes, task planner, kanban board, personal productivity, thought organizer, workspace planner',
          canonicalUrl: '/home',
        },
      },
      sectionRoute('features', 'features'),
      sectionRoute('how-it-works', 'how-it-works'),
      sectionRoute('use-cases', 'use-cases'),
      sectionRoute('pricing', 'pricing'),
      sectionRoute('stories', 'reviews'),
      sectionRoute('reviews', 'reviews'),
      {
        path: 'about-us',
        title: 'About us | Sticky Ji',
        loadComponent: () => import('../about-us/about-us').then((m) => m.AboutUs),
        data: { description: 'Meet stickyji, a calmer home for ideas, daily plans, and shared work.', canonicalUrl: '/about-us' },
      },
      {
        path: 'contact-us',
        title: 'Contact us | Sticky Ji',
        loadComponent: () => import('../contact-us/contact-us').then((m) => m.ContactUs),
        data: { description: 'Contact stickyji for support, billing, privacy, and feedback.', canonicalUrl: '/contact-us' },
      },
      {
        path: 'privacy-policy',
        title: 'Privacy policy | Sticky Ji',
        loadComponent: () => import('../privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
        data: {
          description: 'Sticky Ji information practices, privacy choices, and contact details.',
          canonicalUrl: '/privacy-policy',
          robots: COMPANY.policiesApproved ? 'index, follow' : 'noindex, follow',
        },
      },
      {
        path: 'terms-and-conditions',
        title: 'Terms & conditions | Sticky Ji',
        loadComponent: () => import('../terms-and-conditions/terms-and-conditions').then((m) => m.TermsAndConditions),
        data: {
          description: 'Sticky Ji terms for accounts, content, billing, and service responsibilities.',
          canonicalUrl: '/terms-and-conditions',
          robots: COMPANY.policiesApproved ? 'index, follow' : 'noindex, follow',
        },
      },
      { path: 'about', pathMatch: 'full', redirectTo: 'about-us' },
      { path: 'contact', pathMatch: 'full', redirectTo: 'contact-us' },
      { path: 'privacy', pathMatch: 'full', redirectTo: 'privacy-policy' },
      { path: 'terms', pathMatch: 'full', redirectTo: 'terms-and-conditions' },
      {
        path: '**',
        title: 'Page Not Found (404) | Sticky Ji',
        loadComponent: () => import('../not-found/not-found').then((m) => m.WebsiteNotFound),
        data: {
          description:
            'The page you requested could not be found. Return to Sticky Ji home or sign in to your workspace.',
          robots: 'noindex, follow',
        },
      },
    ],
  },
];
