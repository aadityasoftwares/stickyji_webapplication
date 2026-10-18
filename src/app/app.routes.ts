import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'showcase',
    loadChildren: () => import('./showcase/routes/showcase.routes').then((m) => m.SHOWCASE_ROUTES),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () => import('./private/routes/private.routes').then((m) => m.PRIVATE_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./public/auth/routes/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'workspace-invitations/accept',
    loadComponent: () =>
      import('./public/auth/accept-workspace-invitation/accept-workspace-invitation').then(
        (m) => m.AcceptWorkspaceInvitation,
      ),
    title: 'Accept workspace invitation | MyStickyNotes',
  },
  {
    path: '',
    loadChildren: () => import('./website/routes/website.routes').then((m) => m.WEBSITE_ROUTES),
  },
];
