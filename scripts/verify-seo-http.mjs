import assert from 'node:assert/strict';
import { request } from 'node:http';

const origin = process.argv[2] || 'http://127.0.0.1:4301';
function get(path, host = 'stickyji.com') {
  return new Promise((resolve, reject) => {
    request(new URL(path, origin), { headers: { Host: host } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    })
      .on('error', reject)
      .end();
  });
}
for (const path of [
  '/',
  '/features',
  '/how-it-works',
  '/use-cases',
  '/pricing',
  '/about-us',
  '/contact-us',
  '/features?utm_source=test',
]) {
  const res = await get(path);
  assert.equal(res.status, 200, path);
  assert(!res.headers['x-robots-tag'], `${path} must not send production noindex`);
  assert(res.body.includes('<h1'), path);
  assert(res.body.includes('rel="canonical"'), path);
  assert.equal(res.headers['cache-control'], 'no-cache');
  console.log(`PASS 200 prerendered ${path}`);
}
for (const [path, destination] of [
  ['/home', '/'],
  ['/about', '/about-us'],
  ['/contact', '/contact-us'],
  ['/features/', '/features'],
  ['/features/index.html', '/features'],
  ['/index.html', '/'],
  ['/stories', '/reviews'],
]) {
  const res = await get(path);
  assert.equal(res.status, 301, path);
  assert.equal(new URL(res.headers.location, origin).pathname, destination);
}
for (const path of [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password?token=test',
  '/app',
  '/app/today',
  '/app/stickynotes/my',
  '/app/workspaces/trash',
  '/app/workspace/members',
  '/app/account/preferences',
  '/workspace-invitations/accept?token=test',
]) {
  const res = await get(path);
  assert.equal(res.status, 200, path);
  assert(res.headers['x-robots-tag']?.includes('noindex'), path);
  assert(res.body.includes('<app-root></app-root>'), path);
  assert(!res.body.includes('<h1'), path);
}
for (const path of [
  '/missing-page',
  '/app/missing-page',
  '/auth/missing-page',
  '/missing.js',
  '/index.csr.html',
  '/404',
]) {
  const res = await get(path);
  assert.equal(res.status, 404, path);
  assert(res.headers['x-robots-tag']?.includes('noindex'), path);
}
for (const path of ['/', '/features', '/pricing']) {
  const res = await get(path, 'staging.stickyji.com');
  assert.equal(res.status, 200);
  assert(res.headers['x-robots-tag']?.includes('noindex'));
}
const home = await get('/');
const js = home.body.match(/src="(main-[^"]+\.js)"/)[1];
const asset = await get('/' + js);
assert.equal(asset.status, 200);
assert(asset.headers['cache-control'].includes('immutable'));
assert.equal((await get('/sitemap.xml')).status, 200);
assert.equal((await get('/robots.txt')).status, 200);
console.log(
  'PASS redirects, private CSR shells, real 404s, staging noindex, hashed asset caching and crawler files',
);
