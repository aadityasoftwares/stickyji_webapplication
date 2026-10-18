import { Routes } from '@angular/router';

export const SHOWCASE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../showcase/showcase').then((m) => m.Showcase),
    children: [
      {
        path: '',
        redirectTo: 'buttons',
        pathMatch: 'full',
      },
      {
        path: 'buttons',
        loadComponent: () =>
          import('../buttons-showcase/buttons-showcase').then((m) => m.ButtonsShowcase),
      },
      {
        path: 'avatar',
        loadComponent: () =>
          import('../avatar-showcase/avatar-showcase').then((m) => m.AvatarShowcase),
      },
      {
        path: 'badges',
        loadComponent: () =>
          import('../badge-showcase/badge-showcase').then((m) => m.BadgeShowcase),
      },
      {
        path: 'checkboxanddivider',
        loadComponent: () =>
          import('../checkboxdivider-showcase/checkboxdivider-showcase').then(
            (m) => m.CheckboxdividerShowcase,
          ),
      },
      {
        path: 'radio',
        loadComponent: () =>
          import('../radio-showcase/radio-showcase').then((m) => m.RadioShowcase),
      },
      {
        path: 'labels',
        loadComponent: () =>
          import('../label-showcase/label-showcase').then((m) => m.LabelShowcase),
      },
      {
        path: 'switches',
        loadComponent: () =>
          import('../switch-showcase/switch-showcase').then((m) => m.SwitchShowcase),
      },
      {
        path: 'tooltip',
        loadComponent: () =>
          import('../tooltip-showcase/tooltip-showcase').then((m) => m.TooltipShowcase),
      },
      {
        path: 'sticky-cards',
        loadComponent: () =>
          import('../sticky-card-showcase/sticky-card-showcase').then((m) => m.StickyCardShowcase),
      },
      {
        path: 'inputs',
        loadComponent: () =>
          import('../input-showcase/input-showcase').then((m) => m.InputShowcase),
      },
      {
        path: 'toasts',
        loadComponent: () =>
          import('../toast-showcase/toast-showcase').then((m) => m.ToastShowcase),
      },
    ],
  },
];
