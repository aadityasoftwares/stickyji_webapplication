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
        title: 'My Notes | Sticky Ji',
    },
    {
        path: 'trash',
        loadComponent: () =>
            import('../sticky-note-trash/sticky-note-trash').then(
                component => component.StickyNoteTrash,
            ),
        title: 'Sticky Note Trash | Sticky Ji',
    },
    {
        path: 'favorites',
        loadChildren: () =>
            import('../../sticky-notes-favourites/routes/sticky-notes-favourites.routes').then(
                m => m.STICKY_NOTES_FAVOURITES_ROUTES
            ),
        title: 'Sticky Note Favorites | Sticky Ji'
    },
];
