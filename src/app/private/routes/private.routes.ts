import { Routes } from '@angular/router';

export const PRIVATE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('../private/private').then(m => m.Private),
        children: [
            {
                path: '',
                redirectTo: 'today',
                pathMatch: 'full'
            },
            {
                path: 'today',
                loadComponent: () => import('../today/today').then(m => m.Today)
            },
            {
                path: 'workspaces',
                loadChildren: () =>
                    import('../workspace/routes/workspaces.routes').then(m => m.WORKSPACES_ROUTES),
            },
            {
                path: 'workspacefolders',
                loadChildren: () =>
                    import('../workspacefolders/routes/workspacesfolder.routes').then(m => m.WORKSPACESFOLDER_ROUTES),
            },
            {
                path: 'account',
                loadChildren: () =>
                    import('../user/routes/user-profile.routes').then(m => m.USER_PROFILE_ROUTES),
            },
            {
                path: 'account',
                loadChildren: () =>
                    import('../user-preferences/routes/user-preference.routes').then(m => m.USER_PREFERENCE_ROUTES),
            },
            {
                path: 'sticky-notes',
                loadChildren: () =>
                    import('../mynotes/routes/mynotes.routes').then(m => m.MYNOTES_ROUTES),
            }
        ]
    },
];