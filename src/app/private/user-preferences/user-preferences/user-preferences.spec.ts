import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserPreferences } from './user-preferences';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { UserPreferenceService } from '../services/user-preference.service';
import { UserPreferenceStore } from '../services/user-preference.store';

describe('UserPreferences', () => {
  let component: UserPreferences;
  let fixture: ComponentFixture<UserPreferences>;
  let store: UserPreferenceStore;
  let api: {
    getMyPreferences: ReturnType<typeof vi.fn>;
    createPreference: ReturnType<typeof vi.fn>;
    updatePreference: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      getMyPreferences: vi.fn(() => of({ data: [
        { key: 'theme', value: 'LIGHT' },
        { key: 'timezone', value: 'Asia/Kolkata' },
      ] })),
      createPreference: vi.fn((key, value) => of({ data: { key, value } })),
      updatePreference: vi.fn((key, value) => of({ data: { key, value } })),
    };
    await TestBed.configureTestingModule({
      imports: [UserPreferences],
      providers: [{ provide: UserPreferenceService, useValue: api }],
    }).compileComponents();

    store = TestBed.inject(UserPreferenceStore);
    store.load(); // The authenticated route has already loaded preferences.
    fixture = TestBed.createComponent(UserPreferences);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(api.getMyPreferences).toHaveBeenCalledOnce();
    expect(component.preferenceForm.controls.theme.value).toBe('LIGHT');
    expect(component.loading()).toBe(false);
  });

  it('saves only changed form fields through the existing store', async () => {
    component.preferenceForm.controls.theme.setValue('DARK');
    component.savePreferences();
    await fixture.whenStable();
    expect(api.updatePreference).toHaveBeenCalledExactlyOnceWith('theme', 'DARK');
    expect(api.createPreference).not.toHaveBeenCalled();
    expect(store.timezone()).toBe('Asia/Kolkata');
    expect(component.saved()).toBe(true);
    expect(component.saving()).toBe(false);
    expect(component.changedCount()).toBe(0);
  });

  it('preserves in-progress form edits when a date preference changes', async () => {
    component.preferenceForm.controls.theme.setValue('DARK');
    store.setAndSave('timezone', 'Europe/London');
    await fixture.whenStable();
    expect(component.preferenceForm.controls.theme.value).toBe('DARK');
    component.savePreferences();
    await fixture.whenStable();
    expect(store.timezone()).toBe('Europe/London');
    expect(store.theme()).toBe('DARK');
  });

  it('reports failed saves and keeps the unsaved form change available for retry', async () => {
    api.updatePreference.mockReturnValue(throwError(() => new Error('Save failed')));
    component.preferenceForm.controls.theme.setValue('DARK');
    component.savePreferences();
    await fixture.whenStable();
    expect(component.saveError()).toBeTruthy();
    expect(component.saved()).toBe(false);
    expect(component.saving()).toBe(false);
    expect(component.preferenceForm.controls.theme.value).toBe('DARK');
    expect(component.changedCount()).toBe(1);
    expect(store.theme()).toBe('LIGHT');
  });

  it('waits for pending saves and supports an explicit reload', async () => {
    const pending = new Subject();
    api.updatePreference.mockReturnValue(pending);
    component.preferenceForm.controls.theme.setValue('DARK');
    component.savePreferences();
    await fixture.whenStable();
    expect(component.saving()).toBe(true);
    pending.next({ data: { key: 'theme', value: 'DARK' } });
    pending.complete();
    await fixture.whenStable();
    expect(component.saving()).toBe(false);
    expect(component.saved()).toBe(true);
    component.reload();
    await fixture.whenStable();
    expect(api.getMyPreferences).toHaveBeenCalledTimes(2);
    expect(component.preferenceForm.controls.theme.value).toBe('LIGHT');
  });
});
