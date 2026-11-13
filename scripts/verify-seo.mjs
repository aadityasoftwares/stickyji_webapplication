import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const output = resolve(process.argv[2] || 'dist/mystickynotes_webapp/browser');
const staging = process.argv.includes('--staging');
const pages = JSON.parse(await readFile('src/app/shared/seo/public-pages.json', 'utf8'));
const titles = new Set();
const descriptions = new Set();
for (const [path, page] of Object.entries(pages)) {
  const html = await readFile(resolve(output, path, 'index.html'), 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  assert.equal(doc.title, page.title, `Title: /${path}`);
  assert(!titles.has(doc.title), `Duplicate title: /${path}`);
  titles.add(doc.title);
  const description = doc.querySelector('meta[name="description"]')?.content;
  assert.equal(description, page.description, `Description: /${path}`);
  assert(!descriptions.has(description));
  descriptions.add(description);
  assert.equal(doc.documentElement.lang, 'en');
  assert.equal(doc.querySelectorAll('h1').length, 1, `One H1: /${path}`);
  assert(doc.querySelector('main')?.textContent.trim().length > 180, `Meaningful HTML: /${path}`);
  assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1);
  const canonical = `https://stickyji.com/${path}`;
  assert.equal(doc.querySelector('link[rel="canonical"]').href, canonical);
  assert.equal(doc.querySelector('meta[property="og:url"]')?.content, canonical);
  for (const name of ['og:title', 'og:description', 'og:image', 'og:type', 'og:site_name']) {
    assert(doc.querySelector(`meta[property="${name}"]`)?.content, `${name}: /${path}`);
  }
  for (const name of ['twitter:title', 'twitter:description', 'twitter:image', 'twitter:card']) {
    assert(doc.querySelector(`meta[name="${name}"]`)?.content, `${name}: /${path}`);
  }
  const robots = doc.querySelector('meta[name="robots"]')?.content;
  assert(staging ? robots.includes('noindex') : !robots.includes('noindex'), `Robots: /${path}`);
  assert(!doc.querySelector('meta[name="keywords"]'));
  assert(doc.querySelector('a[href="/auth/signup"]'), `Crawlable signup: /${path}`);
  assert(html.includes('ngh='), `Hydration annotations: /${path}`);
  assert(!html.includes('stickyji.app'));
  assert(!html.includes('__nghData__') || !html.includes('accessToken'));
  const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  assert.equal(schemas.length, path === '' ? 1 : 0);
  for (const script of schemas) {
    const schema = JSON.parse(script.textContent);
    assert.equal(schema['@context'], 'https://schema.org');
    assert.deepEqual(
      schema['@graph'].map((item) => item['@type']),
      ['Organization', 'WebSite', 'WebApplication'],
    );
    assert.equal(schema['@graph'][0].name, 'Aaditya Softwares');
    assert(!script.textContent.includes('aggregateRating'));
    assert(!script.textContent.includes('offers'));
  }
  console.log(`PASS /${path}: title, canonical, social tags, content, hydration, schema`);
  dom.window.close();
}
for (const path of ['privacy-policy', 'terms-and-conditions', 'reviews', '404']) {
  const dom = new JSDOM(await readFile(resolve(output, path, 'index.html'), 'utf8'));
  assert(
    dom.window.document.querySelector('meta[name="robots"]')?.content.includes('noindex'),
    path,
  );
  dom.window.close();
}
const csr = new JSDOM(await readFile(resolve(output, 'index.csr.html'), 'utf8'));
assert(csr.window.document.querySelector('meta[name="robots"]')?.content.includes('noindex'));
assert.equal(csr.window.document.querySelector('app-root').textContent.trim(), '');
assert.equal(csr.window.document.querySelectorAll('script[type="application/ld+json"]').length, 0);
csr.window.close();
const xml = new JSDOM(await readFile(resolve(output, 'sitemap.xml'), 'utf8'), {
  contentType: 'text/xml',
});
assert.equal(
  xml.window.document.documentElement.namespaceURI,
  'http://www.sitemaps.org/schemas/sitemap/0.9',
);
assert.deepEqual(
  [...xml.window.document.querySelectorAll('loc')].map((el) => el.textContent),
  staging ? [] : Object.keys(pages).map((p) => `https://stickyji.com/${p}`),
);
assert.equal(xml.window.document.querySelectorAll('lastmod').length, 0);
xml.window.close();
const robots = await readFile(resolve(output, 'robots.txt'), 'utf8');
assert(robots.includes('Allow: /'));
assert(!robots.includes('Disallow: /auth'));
assert.equal(robots.includes('Sitemap: https://stickyji.com/sitemap.xml'), !staging);
const directories = (await readdir(output, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
for (const name of ['app', 'auth', 'workspace-invitations'])
  assert(!directories.includes(name), `Private prerender directory: ${name}`);
console.log(
  `PASS ${staging ? 'staging' : 'production'} crawler files, noindex pages and empty private CSR shell`,
);
