import { safeAuthRedirect } from './auth-redirect.function';

describe('safeAuthRedirect', () => {
  it('preserves internal destinations, queries, and fragments', () => {
    expect(safeAuthRedirect('/app/today?workspaceId=one#notes')).toBe('/app/today?workspaceId=one#notes');
  });
  it('rejects external URLs and authentication loops', () => {
    for (const url of ['https://example.com', '//example.com', '/\\example.com', '/auth/signup?redirectUrl=/app', '/auth/login', '']) {
      expect(safeAuthRedirect(url)).toBe('/app');
    }
  });
});
