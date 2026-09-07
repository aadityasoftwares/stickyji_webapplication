import { Routes } from '@angular/router';

export const WORKSPACESFOLDER_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'my',
        pathMatch: 'full'
    },
    {
        path: 'my',
        loadComponent: () =>
            import('../workspacefolders').then(
                component => component.Workspacefolders
            ),
        title: 'Profile & preferences | MyStickyNotes',
    },
];
