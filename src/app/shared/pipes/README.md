# User date formatting

Import the standalone `UserDatePipe` in a component's `imports` array:

```ts
import { UserDatePipe } from './path/to/shared/pipes/user-date.pipe';
```

```html
{{ workspace.updatedAt | userDate }}
{{ workspace.updatedAt | userDate:'date' }}
{{ workspace.updatedAt | userDate:'datetime' }}
{{ workspace.updatedAt | userDate:'time' }}
{{ workspace.updatedAt | userDate:'date':'Unavailable' }}
```

The pipe uses the existing `UserPreferenceStore` and `UserDateTimeFormatterService`.
Date format, timezone, locale, and 12/24-hour time preferences update the display
automatically, including in OnPush components. App/session initialization owns
preference loading; the authenticated route waits for the initial request to settle.
The pipe makes no requests and creates no subscriptions.
Unchanged values and preferences reuse a cached result.

- ISO timestamps with `Z` or an offset, JavaScript `Date` objects, and numeric
  timestamps in **milliseconds** represent instants and use the saved timezone.
- `YYYY-MM-DD` calendar dates retain their day in every timezone. Date-time mode
  displays only their date; time mode returns the fallback because no time exists.
  Existing `dd-MM-yyyy`, `dd/MM/yyyy`, and `dd.MM.yyyy` inputs remain supported.
- Empty or invalid values return an empty string, or the supplied fallback.
- Missing/invalid preferences use `DEFAULT_USER_PREFERENCES` (currently
  `DD/MM/YYYY`, UTC, `en-US`, 12-hour time, and a Monday week start).
  A saved IANA timezone takes priority. Browser timezone and locale are never used
  to replace the user's preferences.
  The Updated column shows the record's last update time, not the current clock.
- The legacy `userDate:'Unavailable'` fallback and the `userTime`/`userDateTime`
  pipes remain supported. New callers can use the modes above.

Run the focused date and workspace regression tests with `npm run test:dates`.

Persist a change with the existing store, for example
`preferenceStore.setAndSave('timezone', 'Asia/Kolkata')`. The optimistic update
refreshes displayed dates immediately; a failed save rolls it back. Authentication
clears preferences and cancels pending requests on logout or account changes.
Use `preferenceStore.refresh()` to retry a failed load explicitly.

`2026-10-09T03:32:55.742Z` displays as `09/10/2026 09:02 AM` in
`Asia/Kolkata`, or `09/10/2026 03:32 AM` in UTC. The API value is unchanged.
