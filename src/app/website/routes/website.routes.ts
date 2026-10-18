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
        title: 'MyStickyNotes | A calmer workspace for your ideas',
        loadComponent: () => import('../home/home').then((m) => m.Home),
      },
      sectionRoute('features', 'features'),
      sectionRoute('how-it-works', 'how-it-works'),
      sectionRoute('use-cases', 'use-cases'),
      sectionRoute('pricing', 'pricing'),
      sectionRoute('stories', 'reviews'),
      sectionRoute('reviews', 'reviews'),
      {
        path: '**',
        title: 'Page not found | MyStickyNotes',
        loadComponent: () => import('../not-found/not-found').then((m) => m.WebsiteNotFound),
      },
    ],
  },
];
