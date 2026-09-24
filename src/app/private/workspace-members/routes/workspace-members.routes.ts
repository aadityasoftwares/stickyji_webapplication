import { Routes } from '@angular/router';

export const WORKSPACES_MEMBERS_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'members',
        pathMatch: 'full'
    },
    {
        path: 'members',
        loadComponent: () =>
            import('../workspace-members/workspace-members').then(
                component => component.WorkspaceMembers
            ),
        title: 'Profile & preferences | MyStickyNotes',
    },
];
