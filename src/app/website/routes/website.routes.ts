import { Routes } from '@angular/router';
import { PUBLIC_PAGES } from '../../shared/seo/seo-config';

const marketingRoutes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('../home/home').then((m) => m.Home) },
  {
    path: 'features',
    loadComponent: () => import('../features/features').then((m) => m.FeaturesPage),
  },
  {
    path: 'how-it-works',
    loadComponent: () => import('../how-it-works/how-it-works').then((m) => m.HowItWorksPage),
  },
  {
    path: 'use-cases',
    loadComponent: () => import('../use-cases-page/use-cases-page').then((m) => m.UseCasesPage),
  },
  {
    path: 'pricing',
    loadComponent: () => import('../pricing-page/pricing-page').then((m) => m.PricingPage),
  },
  { path: 'about-us', loadComponent: () => import('../about-us/about-us').then((m) => m.AboutUs) },
  {
    path: 'contact-us',
    loadComponent: () => import('../contact-us/contact-us').then((m) => m.ContactUs),
  },
  {
    path: 'blog',
    loadComponent: () => import('../blog/blog-list/blog-list').then((m) => m.StickyJiBlogList),
  },
];

const notFound = {
  title: 'Page Not Found (404) | Sticky Ji',
  loadComponent: () => import('../not-found/not-found').then((m) => m.WebsiteNotFound),
  data: {
    description: 'This page could not be found. Return to Sticky Ji or sign in to your workspace.',
    robots: 'noindex, follow',
  },
};

export const WEBSITE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../website/website').then((m) => m.Website),
    children: [
      ...marketingRoutes.map((route) => ({
        ...route,
        title: PUBLIC_PAGES[route.path!].title,
        data: {
          description: PUBLIC_PAGES[route.path!].description,
          canonicalUrl: '/' + route.path,
        },
      })),
      { path: 'home', pathMatch: 'full', redirectTo: '/' },
      {
        path: 'reviews',
        title: 'Share Your Feedback | Sticky Ji',
        loadComponent: () => import('../reviews-page/reviews-page').then((m) => m.ReviewsPage),
        data: {
          description: 'Help improve Sticky Ji by sharing feedback with our team.',
          robots: 'noindex, follow',
        },
      },
      {
        path: 'blog/category/:slug',
        loadComponent: () => import('../blog/blog-list/blog-list').then((m) => m.StickyJiBlogList),
      },
      {
        path: 'blog/tag/:slug',
        loadComponent: () => import('../blog/blog-list/blog-list').then((m) => m.StickyJiBlogList),
      },
      {
        path: 'blog/author/:slug',
        loadComponent: () => import('../blog/blog-list/blog-list').then((m) => m.StickyJiBlogList),
      },
      {
        path: 'blog/:slug',
        loadComponent: () =>
          import('../blog/blog-detail/blog-detail').then((m) => m.StickyJiBlogDetail),
      },
      {
        path: 'privacy-policy',
        title: 'Privacy policy | Sticky Ji',
        loadComponent: () =>
          import('../privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
        data: {
          description: 'Sticky Ji information practices, privacy choices, and contact details.',
          robots: 'noindex, follow',
        },
      },
      {
        path: 'terms-and-conditions',
        title: 'Terms & conditions | Sticky Ji',
        loadComponent: () =>
          import('../terms-and-conditions/terms-and-conditions').then((m) => m.TermsAndConditions),
        data: {
          description:
            'Sticky Ji terms for accounts, content, billing, and service responsibilities.',
          robots: 'noindex, follow',
        },
      },
      { path: 'stories', pathMatch: 'full', redirectTo: 'reviews' },
      { path: 'about', pathMatch: 'full', redirectTo: 'about-us' },
      { path: 'contact', pathMatch: 'full', redirectTo: 'contact-us' },
      { path: 'privacy', pathMatch: 'full', redirectTo: 'privacy-policy' },
      { path: 'terms', pathMatch: 'full', redirectTo: 'terms-and-conditions' },
      { path: '404', ...notFound },
      { path: '**', ...notFound },
    ],
  },
];
