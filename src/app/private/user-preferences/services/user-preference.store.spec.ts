import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthStore } from '../../../public/auth/state/auth.store';
import { AuthSession } from '../../../public/auth/models/auth.models';
import { UserDateTimeFormatterService } from '../../../shared/services/user-date-time-formatter.service';
import { UserPreferenceService } from './user-preference.service';
import { UserPreferenceStore } from './user-preference.store';

const records = [
  {
    userId: 'first',
    key: 'timezone',
    value: 'Asia/Kolkata',
    valueType: 'STRING',
    category: 'REGIONAL',
  },
  {
    userId: 'first',
    key: 'dateFormat',
    value: 'YYYY-MM-DD',
    valueType: 'STRING',
    category: 'REGIONAL',
  },
  { userId: 'first', key: 'timeFormat', value: '24h', valueType: 'STRING', category: 'REGIONAL' },
  { userId: 'first', key: 'locale', value: 'en-US', valueType: 'STRING', category: 'REGIONAL' },
  {
    userId: 'first',
    key: 'weekStartsOn',
    value: 'sunday',
    valueType: 'STRING',
    category: 'REGIONAL',
  },
];

function session(id: string): AuthSession {
  return {
    user: {
      id,
      email: `${id}@example.test`,
      globalRoleId: '',
      status: 'ACTIVE',
      isEmailVerified: true,
      isMfaEnabled: false,
    },
    sessionId: `${id}-session`,
    tokens: { accessToken: `${id}-token` },
  };
}

describe('UserPreferenceStore session lifecycle', () => {
  let store: UserPreferenceStore;
  let auth: AuthStore;
  let formatter: UserDateTimeFormatterService;
  let api: {
    getMyPreferences: ReturnType<typeof vi.fn>;
    createPreference: ReturnType<typeof vi.fn>;
    updatePreference: ReturnType<typeof vi.fn>;
    resetPreference: ReturnType<typeof vi.fn>;
    resetAllPreferences: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      getMyPreferences: vi.fn(() => of({ data: records })),
      createPreference: vi.fn((key, value) => of({ data: { key, value } })),
      updatePreference: vi.fn((key, value) => of({ data: { key, value } })),
      resetPreference: vi.fn(() => of({ data: { key: 'timezone', value: 'UTC' } })),
      resetAllPreferences: vi.fn(() => of({ data: [] })),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: UserPreferenceService, useValue: api }],
    });
    store = TestBed.inject(UserPreferenceStore);
    auth = TestBed.inject(AuthStore);
    formatter = TestBed.inject(UserDateTimeFormatterService);
  });

  it.each([
    records,
    { data: records },
    { data: { preferences: records } },
    { data: { items: records } },
    { data: { rows: records } },
    { data: { records } },
    { data: Object.fromEntries(records.map((record) => [record.key, record.value])) },
  ])('reads existing preference response shapes', (response) => {
    api.getMyPreferences.mockReturnValue(of(response));
    store.load();
    expect(formatter.formatDateTime('2026-10-09T03:32:55.742Z')).toBe('2026-10-09 09:02');
    expect(store.weekStartsOn()).toBe('sunday');
    expect(store.ready()).toBe(true);
    store.setAndSave('timezone', 'Europe/London');
    expect(api.updatePreference).toHaveBeenCalledExactlyOnceWith('timezone', 'Europe/London');
    expect(api.createPreference).not.toHaveBeenCalled();
  });

  it('deduplicates loading and uses UTC defaults after a failed initial request', () => {
    const response = new Subject();
    api.getMyPreferences.mockReturnValue(response);
    store.load();
    store.load();
    expect(api.getMyPreferences).toHaveBeenCalledOnce();
    expect(store.ready()).toBe(false);
    response.error(new Error('Offline'));
    expect(store.ready()).toBe(true);
    expect(store.loaded()).toBe(false);
    expect(store.loading()).toBe(false);
    expect(formatter.formatDateTime('2026-10-09T03:32:55.742Z')).toBe('09/10/2026 03:32 AM');
    store.load();
    expect(api.getMyPreferences).toHaveBeenCalledOnce();
    api.getMyPreferences.mockReturnValue(of({ data: records }));
    store.refresh();
    expect(store.timezone()).toBe('Asia/Kolkata');
    expect(store.error()).toBeNull();
  });

  it('updates immediately and rolls back failed preference saves', () => {
    store.load();
    const response = new Subject();
    api.updatePreference.mockReturnValue(response);
    store.setAndSave('timezone', 'UTC');
    expect(formatter.formatTime('2026-10-09T03:32:55.742Z')).toBe('03:32');
    response.error(new Error('Save failed'));
    expect(formatter.formatTime('2026-10-09T03:32:55.742Z')).toBe('09:02');
    expect(store.saving()).toBe(false);
  });

  it('serializes rapid updates per key and keeps the latest preference value', () => {
    store.load();
    const first = new Subject<any>();
    api.createPreference.mockReturnValueOnce(first);

    store.setAndSave('workspaceAccessFilter', 'OWNED');
    store.setAndSave('workspaceAccessFilter', 'SHARED');

    expect(store.workspaceAccessFilter()).toBe('SHARED');
    expect(api.createPreference).toHaveBeenCalledOnce();

    first.next({ data: { key: 'workspaceAccessFilter', value: 'OWNED' } });
    first.complete();

    expect(api.updatePreference).toHaveBeenCalledExactlyOnceWith('workspaceAccessFilter', 'SHARED');
    expect(store.workspaceAccessFilter()).toBe('SHARED');
    expect(store.saving()).toBe(false);
  });

  it('cancels the first user’s pending load when logging out and logging in as another user', () => {
    auth.setSession(session('first'));
    const first = new Subject();
    api.getMyPreferences.mockReturnValue(first);
    store.load();
    auth.clearSession();
    expect(first.observed).toBe(false);
    expect(store.timezone()).toBe('UTC');
    expect(store.ready()).toBe(false);
    auth.setSession(session('second'));
    api.getMyPreferences.mockReturnValue(
      of({ data: [{ key: 'timezone', value: 'America/New_York' }] }),
    );
    store.load();
    first.next({ data: records });
    expect(store.timezone()).toBe('America/New_York');
    expect(formatter.formatDateTime('2026-10-09T03:32:55.742Z')).toBe('08/10/2026 11:32 PM');
    expect(api.getMyPreferences).toHaveBeenCalledTimes(2);
  });

  it('preserves preferences for token refresh but clears them when accounts change', () => {
    auth.setSession(session('first'));
    store.load();
    auth.setSession(session('first'));
    expect(store.timezone()).toBe('Asia/Kolkata');
    expect(store.ready()).toBe(true);
    auth.setSession(session('second'));
    expect(store.timezone()).toBe('UTC');
    expect(store.ready()).toBe(false);
  });

  it.each(['save', 'reset', 'resetAll'])('cancels pending %s operations on logout', (action) => {
    auth.setSession(session('first'));
    store.load();
    const pending = new Subject();
    api.updatePreference.mockReturnValue(pending);
    api.resetPreference.mockReturnValue(pending);
    api.resetAllPreferences.mockReturnValue(pending);
    if (action === 'save') store.setAndSave('timezone', 'UTC');
    if (action === 'reset') store.resetPreference('timezone');
    if (action === 'resetAll') store.resetAllPreferences();
    auth.clearSession();
    expect(pending.observed).toBe(false);
    pending.next({ data: records });
    expect(store.timezone()).toBe('UTC');
    expect(store.saving()).toBe(false);
    expect(store.ready()).toBe(false);
  });

  it('resets saved preferences through the existing API', () => {
    store.load();
    store.resetPreference('timezone');
    expect(store.timezone()).toBe('UTC');
    store.resetAllPreferences();
    expect(store.dateFormat()).toBe('DD/MM/YYYY');
    expect(store.timeFormat()).toBe('12h');
    expect(store.ready()).toBe(true);
    expect(api.resetAllPreferences).toHaveBeenCalledOnce();
  });
});
