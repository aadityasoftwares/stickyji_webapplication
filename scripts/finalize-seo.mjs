import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(process.argv[2] || 'dist/mystickynotes_webapp/browser');
const pages = JSON.parse(await readFile('src/app/shared/seo/public-pages.json', 'utf8'));
const html = await readFile(resolve(output, 'index.html'), 'utf8');
const noindex = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(html);
// The original CSR shell must never become the prerendered home page.
await access(resolve(output, 'index.csr.html'));
await access(resolve(output, '404/index.html'));
const paths = noindex ? [] : Object.keys(pages);
await writeFile(
  resolve(output, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((path) => `  <url><loc>https://stickyji.com/${path}</loc></url>`).join('\n') +
    '\n</urlset>\n',
);
await writeFile(
  resolve(output, 'robots.txt'),
  'User-agent: *\nAllow: /\n' +
    (noindex
      ? '# Non-production: HTML and Nginx X-Robots-Tag enforce noindex.\n'
      : 'Sitemap: https://stickyji.com/sitemap.xml\n'),
);
console.log(
  `SEO crawler files: ${noindex ? 'non-production, empty sitemap' : `${paths.length} canonical URLs`}`,
);
