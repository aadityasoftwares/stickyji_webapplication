import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () =>
            import('../signin/signin').then(m => m.Signin)
    },
    {
        path: 'signup',
        loadComponent: () =>
            import('../signup/signup').then(m => m.Signup)
    },
    {
        path: 'forgot-password',
        loadComponent: () =>
            import('../forgot-password/forgot-password').then(m => m.ForgotPassword)
    },
    {
        path: 'reset-password',
        loadComponent: () =>
            import('../reset-password/reset-password').then(m => m.ResetPassword)
    },

];