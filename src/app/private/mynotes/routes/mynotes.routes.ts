import { Routes } from '@angular/router';

export const MYNOTES_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'my',
        pathMatch: 'full'
    },
    {
        path: 'my',
        loadComponent: () =>
            import('../mynotes').then(
                component => component.MyNotes,
            ),
        title: 'MyNotes | MyStickyNotes',
    },
    {
        path: 'trash',
        loadComponent: () =>
            import('../sticky-note-trash/sticky-note-trash').then(
                component => component.StickyNoteTrash,
            ),
        title: 'Sticky Note Trash | MyStickyNotes',
    },
];
