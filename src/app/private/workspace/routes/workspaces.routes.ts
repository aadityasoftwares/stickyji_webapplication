import { Routes } from '@angular/router';

export const WORKSPACES_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'my',
        pathMatch: 'full'
    },
    {
        path: 'my',
        loadComponent: () =>
            import('../workspace').then(
                component => component.Workspace
            ),
        title: 'Profile & preferences | MyStickyNotes',
    },
    {
        path: 'trash',
        loadComponent: () =>
            import('../workspace-trash/workspace-trash').then(
                component => component.WorkspaceTrash
            ),
        title: 'Workspace Trash | MyStickyNotes',
    },
];
