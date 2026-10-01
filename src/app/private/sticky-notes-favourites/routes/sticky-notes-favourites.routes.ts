import { Routes } from '@angular/router';

export const STICKY_NOTES_FAVOURITES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('../sticky-notes-favourites.component').then(
                component => component.StickyNotesFavouritesComponent
            ),
        title: 'Favourites | MyStickyNotes'
    }
];
