import { Injectable, effect, inject, signal } from '@angular/core';
import { UserPreferenceStore } from '../../private/user-preferences/services/user-preference.store';
import { WorkspaceStore } from '../../private/workspace/services/workspace.store';
import { WorkspaceFolderStore } from '../../private/workspacefolders/services/workspace-folder.store';

@Injectable({
  providedIn: 'root',
})
export class AppSessionStore {
  private readonly userPreferenceStore = inject(UserPreferenceStore);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly workspaceFolderStore = inject(WorkspaceFolderStore);

  private readonly _initializing = signal(false);
  private readonly _initialized = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly initializing = this._initializing.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    effect(() => {
      if (!this._initializing()) {
        return;
      }

      const preferencesLoaded = this.userPreferenceStore.loaded();
      const workspacesLoaded = this.workspaceStore.loaded();

      const preferencesError = this.userPreferenceStore.error();
      const workspaceError = this.workspaceStore.error();

      if (preferencesError || workspaceError) {
        this._error.set(preferencesError || workspaceError || 'Failed to initialize application');

        this._initializing.set(false);
        return;
      }

      if (preferencesLoaded && workspacesLoaded) {
        this._initialized.set(true);
        this._initializing.set(false);
        this._error.set(null);
      }
    });
  }

  initialize(force = false): void {
    if (this._initialized() && !force) {
      return;
    }

    if (this._initializing()) {
      return;
    }

    this._initializing.set(true);
    this._initialized.set(false);
    this._error.set(null);

    this.userPreferenceStore.load(force);
    this.workspaceStore.load(force);
  }

  refresh(): void {
    this.initialize(true);
  }

  reset(): void {
    this._initialized.set(false);
    this._initializing.set(false);
    this._error.set(null);

    this.userPreferenceStore.reset();
    this.workspaceStore.reset();
    this.workspaceFolderStore.clear();
  }
}
