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
      {
        path: 'features',
        title: 'Features | Sticky Ji — Visual Sticky Notes, Smart Folders & Today Planner',
        loadComponent: () => import('../features/features').then((m) => m.FeaturesPage),
        data: {
          description:
            'Explore Sticky Ji visual workspace features: colorful digital sticky notes, smart folders, kanban columns, daily planner, and real-time team collaboration.',
          canonicalUrl: '/features',
        },
      },
      {
        path: 'how-it-works',
        title: 'How It Works | Sticky Ji — 5 Simple Steps From Thought to Done',
        loadComponent: () => import('../how-it-works/how-it-works').then((m) => m.HowItWorksPage),
        data: {
          description:
            'Discover the mindful 5-step workflow of Sticky Ji. Capture without friction, organize visually, structure into columns, focus on today, and archive small wins.',
          canonicalUrl: '/how-it-works',
        },
      },
      {
        path: 'use-cases',
        title: 'Use Cases & Workflows | Sticky Ji — For Students, PMs, Creators & Teams',
        loadComponent: () => import('../use-cases-page/use-cases-page').then((m) => m.UseCasesPage),
        data: {
          description:
            'See how students, product managers, solo creators, and remote teams design their workspaces with Sticky Ji. Explore sample boards, templates, and everyday routines.',
          canonicalUrl: '/use-cases',
        },
      },
      {
        path: 'reviews',
        title: 'Reviews & Stories | Sticky Ji — A Wall of Small Wins',
        loadComponent: () => import('../reviews-page/reviews-page').then((m) => m.ReviewsPage),
        data: {
          description:
            'Read real stories and reviews from thinkers, students, creators, and teams who found daily clarity with Sticky Ji.',
          canonicalUrl: '/reviews',
        },
      },
      {
        path: 'stories',
        pathMatch: 'full',
        redirectTo: 'reviews',
      },
      {
        path: 'pricing',
        title: 'Pricing & Plans | Sticky Ji — Free Forever & Flexible Upgrades',
        loadComponent: () => import('../pricing-page/pricing-page').then((m) => m.PricingPage),
        data: {
          description:
            'Simple and honest pricing for Sticky Ji. Use Sticky Ji free forever or upgrade to Pro and Team for unlimited boards, power features, and live collaboration.',
          canonicalUrl: '/pricing',
        },
      },
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
