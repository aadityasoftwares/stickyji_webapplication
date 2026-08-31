import { Routes } from '@angular/router';

export const PRIVATE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('../private/private').then(m => m.Private),
        children: [
            {
                path: '',
                redirectTo: 'my-notes',
                pathMatch: 'full'
            },
            {
                path: 'my-notes',
                loadComponent: () => import('../mynotes/mynotes').then(m => m.MyNotes)
            }
        ]
    },
    {
        path: 'account',
        loadChildren: () =>
            import('../user/routes/user-profile.routes').then(m => m.USER_PROFILE_ROUTES),
    }
];