# Sticky Ji SEO implementation

See [the initial audit](seo-audit.md) for findings recorded before implementation. This change stays in the Angular frontend and the existing Docker/Nginx architecture. It does not deploy, publish, change backend contracts, or claim Google indexing.

## Rendering and privacy

Installed framework version remains Angular **22.1.3**. Official `@angular/platform-server` 22.1.3 and `@angular/ssr` 22.1.5 were added; the framework dependencies were pinned to the existing version to prevent peer dependency drift. No major upgrade.

`app.routes.server.ts` explicitly prerenders seven marketing pages, two draft policy pages, the feedback page and `/404`. Every other route is `RenderMode.Client`. The output is static and still ships from `dist/mystickynotes_webapp/browser` in Nginx; there is no Node server in production.

Hydration and event replay preserve interactions. Session restoration starts after browser rendering; protected routes still await the existing authentication guard. The plan catalogue starts after rendering in the browser and is not fetched at build time. HTTP transfer caching is disabled. A server-only `HttpBackend` throws if any component attempts a network request during prerendering. Builds therefore cannot embed API responses, session tokens, personal notes or current subscription data.

The source `index.html` is a noindex empty shell. Angular retains it as `index.csr.html` while writing real page content to the marketing paths. Nginx serves only the CSR shell for recognized application/auth URLs. The browser auth guard is not an API authorization boundary: the backend must continue enforcing sessions, permissions and HTTP 401/403 responses.

## Indexable pages and search intent

All canonical URLs use `https://stickyji.com`. The exact title/description mapping lives in `src/app/shared/seo/public-pages.json`, shared by client metadata, prerendering and sitemap generation.

| Path | Title | Keyword / intent |
| --- | --- | --- |
| `/` | Online Sticky Notes App \| Sticky Ji | online sticky notes, sticky notes app, web sticky notes |
| `/features` | Digital Sticky Notes, Checklists & Workspaces \| Sticky Ji | digital sticky notes, notes with checklists, organize notes online |
| `/how-it-works` | How to Organize Your Tasks with Sticky Ji | organize daily tasks online, task management with sticky notes |
| `/use-cases` | Sticky Notes for Study, Development & Work \| Sticky Ji | digital notes for students, notes for developers, sticky notes for work |
| `/pricing` | Plans & Pricing for Online Notes \| Sticky Ji | plan comparison and conversion |
| `/about-us` | About Sticky Ji \| Aaditya Softwares | brand and publisher trust |
| `/contact-us` | Contact Sticky Ji Support \| Aaditya Softwares | support and contact |

The root is the canonical homepage. `/home` permanently redirects at Nginx and redirects in Angular. Existing `/about`, `/contact`, `/privacy`, `/terms` and `/stories` aliases remain supported. Trailing slashes and public `/index.html` variants redirect. `www.stickyji.com` redirects to the HTTPS apex domain.

Authentication (`/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`), invitations, `/app/**`, showcase, reviews/feedback, draft policies, and unknown routes are noindex and excluded from the sitemap. Private route inventory includes Today, workspaces/trash, workspace folders/trash, notes/trash/favourites, members, roles/permissions, profile and preferences. Existing auth and permission implementations are retained.

No thin audience pages or duplicate `/online-sticky-notes` page were added. Free-plan pricing has not been independently verified against the production catalogue; metadata/schema deliberately avoid “free forever,” invented quotas and unverified offers. Desktop search intent is addressed as browser use, without implying a native application.

## Metadata, content and structured data

- The SEO service uses Angular `Title`, `Meta` and injected `DOCUMENT`; it pins canonicals to production, strips queries/fragments/matrix parameters, deduplicates canonical links, clears old JSON-LD and resets social metadata on navigation.
- Indexing is an allowlist. Staging/development override indexing requests with `noindex, nofollow`. Auth components no longer inject their own product schema or keyword metadata.
- Homepage H1, description, visible FAQs, semantic `main`, signup link and internal links explain the real product. The interactive preview and established brand styling remain.
- The existing live subscription component replaces the dedicated page’s hardcoded prices, quotas, trial claims, discounts, encryption claims and SLA promises. Pricing remains useful before JavaScript with plan-selection guidance; current offers require the live catalogue.
- Demo testimonials were removed from public homepage/use-case output. `/reviews` now links to a real feedback contact instead of presenting invented reviews. Placeholder social links and the unconnected newsletter success form were removed.
- Feature/how-to copy was corrected where it asserted unsupported live sync, export, keyboard shortcuts, retention periods, automated prompts or scientific statistics. Use-case boards are described as examples to recreate, not one-click templates.
- Homepage JSON-LD includes Aaditya Softwares `Organization`, Sticky Ji `WebSite`, and `WebApplication` with browser requirements and verified feature categories. No ratings, reviews, guessed profiles, downloads or unverified prices are included. This is not a claim of eligibility for software rich results.
- Existing Sticky Ji logo artwork supplies real, absolute social image URLs with alt metadata and a `summary` card. A dedicated approved 1200×630 sharing image remains an opportunity; no fake image URL was introduced.
- No FAQ rich-result promise, invented breadcrumbs, hreflang or analytics/verification tokens were added.

## Crawlers and hosting

`npm run build` runs a postbuild step that generates sitemap/robots from the route catalogue and emitted indexing metadata. There are no artificial modification dates. The production sitemap has seven URLs; staging has an empty sitemap and no sitemap advertisement. Angular staging asset replacement also protects raw `ng build --configuration=staging` output.

`robots.txt` permits crawling so bots can read noindex directives; it does not block CSS/JS or masquerade as access control. Nginx additionally sends `X-Robots-Tag: noindex, follow` outside the canonical production marketing allowlist, including all staging hosts. Noindex headers are retained in asset locations that set their own cache headers.

Nginx serves the actual prerendered file for each public page, true 404s for unknown routes and missing assets, and noindex CSR shells for recognized private/auth routes. Hashed JS/CSS remain immutable for one year; HTML is revalidated. Compression is retained. The outer HTTPS proxy/CDN must preserve the original Host and enforce HTTP→HTTPS redirects; otherwise the host allowlist will deliberately keep pages noindex.

Docker still defaults to staging for the existing develop workflow. Production is selected with `--build-arg BUILD_CONFIGURATION=production`. Localhost and staging API URLs were preserved. The new production environment uses the user-confirmed host with the existing API prefix: `https://api.stickyji.com/api/v1`.

## Commands

Run from the repository root with Node compatible with Angular 22 (Docker uses Node 24). Prefix commands with `rtk proxy` if required by your local agent configuration.

```powershell
# Install exactly the committed dependency versions, including the new SSR packages.
npm ci

# Production build includes prerendering and crawler generation.
npm run build:production
# Equivalent dedicated prerender command:
npm run prerender
npm run verify:seo
npm run test:seo

# Staging build and verification (overwrites the default output directory).
npm run build:staging
npm run verify:seo -- dist/mystickynotes_webapp/browser --staging

# For an isolated output directory, invoke Angular and finalize that directory explicitly.
npm exec -- ng build --configuration=staging --output-path=dist/seo-staging
node scripts/finalize-seo.mjs dist/seo-staging/browser
npm run verify:seo -- dist/seo-staging/browser --staging

# Build a production image using the existing Dockerfile.
docker build --build-arg BUILD_CONFIGURATION=production -t stickyji-frontend:production .
docker run --rm --name stickyji-seo-check -p 127.0.0.1:4301:80 stickyji-frontend:production
# In another terminal:
npm run verify:seo:http -- http://127.0.0.1:4301
docker stop stickyji-seo-check

# Optional Lighthouse audit; localhost is intentionally noindex at Nginx.
npm exec --yes --package=lighthouse -- lighthouse http://127.0.0.1:4301 --chrome-flags=--headless --output=json --output-path=dist/lighthouse-mobile.json
```

Do not copy only the root index.html. Deploy the entire browser directory, including index.csr.html, each public subdirectory, 404/index.html and hashed assets, along with the new Nginx configuration. Keep the default staging image out of production. The existing GitHub workflow publishes develop images; no production registry credentials or deployment command are present in this repository. Build/tag the production image, publish it through your existing approved registry workflow, then update the VPS/container configuration to that exact tag. No live container was replaced by this change.

## External setup checklist

1. Configure production API DNS/TLS for `api.stickyji.com`, confirm `/api/v1`, CORS for `https://stickyji.com`, session-cookie domain/security settings, and backend authorization. This host failed DNS resolution during local Lighthouse checks, so live end-to-end account/checkout tests remain pending.
2. Deploy the production build behind HTTPS. Preserve Host at the outer proxy. Redirect HTTP and www to `https://stickyji.com`; keep staging protected by noindex headers and preferably authentication at the edge.
3. Check returned HTML with JavaScript disabled or `curl.exe -s https://stickyji.com/features`; inspect canonical and robots tags, status codes, redirects and the live logo URL. Confirm the homepage is not sending X-Robots-Tag:noindex and staging is.
4. In Google Search Console, create a Domain property for `stickyji.com`. Copy the actual supplied DNS TXT verification record to your DNS provider and verify it. DNS verification avoids guessed tokens or deploying a verification file. Bing Webmaster Tools can use its own DNS verification or approved Search Console import.
5. Submit `https://stickyji.com/sitemap.xml` in both tools. Use Search Console URL Inspection on `/`, `/features` and `/pricing`, run the live test and request indexing where appropriate. Monitor indexing/canonical reports after Google crawls; a local build is not evidence of indexing.
6. Paste the generated homepage markup into [Google Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org/), then repeat using the live URL after deployment. Local checks validate JSON, types and content; external validator execution was unavailable after browser automation stopped. Do not add fake offers/reviews to satisfy rich-result requirements.
7. Test real login, signup, password recovery, invitation acceptance, note editing, member permissions, plan selection and billing in the deployed environment with authorized test accounts. Local regression tests use mocked HTTP and do not create accounts or purchase plans.
8. Re-run mobile/desktop Lighthouse and PageSpeed Insights after deployment. Field INP and Search Console Core Web Vitals require real traffic; local TBT is only a lab diagnostic.

## Future content and measurement

Keep guides in a small typed content catalogue under the existing website directory. Publish only useful, reviewed articles. Each should have a unique slug, title, description, canonical, visible author/byline and genuine published/modified dates; add Article schema only for the actual visible content. Register each route in the public catalogue and server allowlist, link it from relevant feature/use-case pages, and regenerate the sitemap. No CMS dependency is necessary yet.

Analytics was not approved, so no GA script, cookie, event emitter or ID was introduced. If approved later, add environment-based measurement configuration and a consent-aware analytics service. Limit conversion events to enumerated marketing CTA identifiers and a successful signup boolean. Exclude note text, workspace IDs/names, email, account identifiers, URLs with tokens, invitation/reset query strings and auth headers. Review automatic page-location collection before enabling GA4 on auth or private routes.

Remaining work includes approved/legal-final policies, verified social profiles and real customer stories, a proper brand sharing image, smaller optimized logo derivatives, measuring live API interactions, and further reduction of global Bootstrap/Material overhead. Extra note font families now load with the authenticated shell. Build-time font inlining is disabled so Google Fonts DNS outages cannot break builds; browser font loading still depends on that CDN and uses existing fallback fonts.

## References

- [Angular hybrid rendering](https://angular.dev/guide/ssr) — supported static output and per-route rendering modes.
- [Google software application structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app) — accurate supported properties and rich-result requirements.
- [Google organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization) — publisher identity.
- [Chrome Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) — local audit interpretation and tooling.
