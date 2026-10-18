import { Routes } from '@angular/router';

export const USER_PREFERENCE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'preferences',
    pathMatch: 'full',
  },
  {
    path: 'preferences',
    loadComponent: () =>
      import('../user-preferences/user-preferences').then((component) => component.UserPreferences),
    title: 'Preferences | Sticky Ji',
  },
];
