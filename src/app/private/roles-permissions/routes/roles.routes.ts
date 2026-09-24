import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: 'roles-permissions',
    loadComponent: () =>
      import('../roles-permissions/roles-permissions').then(component => component.RolesPermissions),
    title: 'Roles & permissions | MyStickyNotes'
  }
];

export default ROLES_ROUTES;
