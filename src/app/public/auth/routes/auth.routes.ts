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
            import('../signin/signin').then(m => m.Signin),
        title: 'Sign in | Sticky Ji'
    },
    {
        path: 'signup',
        loadComponent: () =>
            import('../signup/signup').then(m => m.Signup),
        title: 'Sign up | Sticky Ji'
    },
    {
        path: 'forgot-password',
        loadComponent: () =>
            import('../forgot-password/forgot-password').then(m => m.ForgotPassword),
        title: 'Forgot password | Sticky Ji'
    },
    {
        path: 'reset-password',
        loadComponent: () =>
            import('../reset-password/reset-password').then(m => m.ResetPassword),
        title: 'Reset password | Sticky Ji'
    },

];