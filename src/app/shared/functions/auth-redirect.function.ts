/** Keep post-authentication navigation within the app and avoid authentication loops. */
export function safeAuthRedirect(value: string): string {
  const url = value.trim();
  if (!url.startsWith('/') || url.startsWith('//') || /[\\\r\n]/.test(url)) return '/app';
  const path = url.split(/[?#]/)[0];
  if (['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password'].some(
    (authPath) => path === authPath || path.startsWith(authPath + '/'),
  )) return '/app';
  return url;
}
