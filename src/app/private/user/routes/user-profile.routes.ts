import { Routes } from '@angular/router';

export const USER_PROFILE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('../user-profile/user-profile').then((component) => component.UserProfileComponent),
    title: 'Profile | Sticky Ji',
  },
];
