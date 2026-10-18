import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

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
