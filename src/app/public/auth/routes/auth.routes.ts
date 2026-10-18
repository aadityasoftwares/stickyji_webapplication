import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('../signin/signin').then((m) => m.Signin),
    title: 'Sign In to Sticky Ji | Digital Sticky Notes & Visual Workspace',
    data: {
      description:
        'Sign in to your Sticky Ji workspace. Access your digital sticky notes, visual boards, daily focus tasks, and collaborative workspaces.',
      keywords:
        'sticky ji login, sign in sticky ji, digital sticky notes, visual workspace, online sticky notes login, kanban board login, task planner',
      canonicalUrl: '/auth/login',
      ogTitle: 'Sign In to Sticky Ji | Digital Sticky Notes & Visual Workspace',
      ogDescription:
        'Access your digital sticky notes, visual boards, daily focus tasks, and collaborative workspaces on Sticky Ji.',
    },
  },
  {
    path: 'signup',
    loadComponent: () => import('../signup/signup').then((m) => m.Signup),
    title: 'Sign Up Free | Sticky Ji — Digital Sticky Notes & Visual Productivity Workspace',
    data: {
      description:
        'Create your free Sticky Ji account today. Organize ideas with colorful digital sticky notes, smart folders, visual kanban boards, and team collaboration.',
      keywords:
        'sticky ji sign up, create sticky ji account, free digital sticky notes, visual productivity board, online note taking register',
      canonicalUrl: '/auth/signup',
      ogTitle: 'Sign Up Free | Sticky Ji — Digital Sticky Notes & Visual Productivity Workspace',
      ogDescription:
        'Start for free on Sticky Ji. Capture raw thoughts, plan daily goals, and organize your ideas visually.',
    },
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('../forgot-password/forgot-password').then((m) => m.ForgotPassword),
    title: 'Reset Your Password | Sticky Ji Workspace',
    data: {
      description:
        'Forgot your Sticky Ji password? Enter your email to receive secure password recovery instructions.',
      keywords: 'sticky ji forgot password, recover sticky ji account, reset workspace password',
      canonicalUrl: '/auth/forgot-password',
    },
  },
  {
    path: 'reset-password',
    loadComponent: () => import('../reset-password/reset-password').then((m) => m.ResetPassword),
    title: 'Choose New Password | Sticky Ji Workspace',
    data: {
      description:
        'Set a new secure password for your Sticky Ji account and return to your calm visual note workspace.',
      keywords: 'sticky ji reset password, update password sticky ji',
      canonicalUrl: '/auth/reset-password',
    },
  },
];
