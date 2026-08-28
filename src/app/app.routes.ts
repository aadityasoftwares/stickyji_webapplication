import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () =>
            import('./website/routes/website.routes').then(m => m.WEBSITE_ROUTES)
    },
    {
        path: 'showcase',
        loadChildren: () =>
            import('./showcase/routes/showcase.routes').then(m => m.SHOWCASE_ROUTES)
    },
    {
        path: 'auth',
        loadChildren: () =>
            import('./public/auth/routes/auth.routes').then(
                m => m.AUTH_ROUTES
            )
    }
];
