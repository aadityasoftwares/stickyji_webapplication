import { Routes } from '@angular/router';

export const MYNOTES_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'my',
        pathMatch: 'full'
    },
    {
        path: 'my',
        loadComponent: () =>
            import('../mynotes').then(
                component => component.MyNotes,
            ),
        title: 'MyNotes | MyStickyNotes',
    },
];
