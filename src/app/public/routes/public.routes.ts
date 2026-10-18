import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../public/public').then((m) => m.Public),
    children: [
      {
        path: '',
        loadChildren: () => import('../auth/routes/auth.routes').then((m) => m.AUTH_ROUTES),
      },
    ],
  },
];
