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
        title: 'Workspace Folders | MyStickyNotes',
    },
    {
        path: 'trash',
        loadComponent: () => import('../workspace-folder-trash/workspace-folder-trash').then(component => component.WorkspaceFolderTrash),
        title: 'Folder Trash | MyStickyNotes',
    },
];
