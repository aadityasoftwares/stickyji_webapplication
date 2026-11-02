# SEO audit — 2 November 2026

Audit performed before implementation. Installed Angular core: 22.1.3; build: 22.1.5.

- Rendering: browser-only application; all routes initially return an empty app-root. No SSR/prerender dependencies or hydration.
- Routing: root redirects to /home. Existing public pages cover features, how-it-works, use-cases, reviews, pricing, about-us, contact-us and draft policies. No new keyword landing pages are needed.
- Metadata: existing SEO service derives origin from the request; index.html, schema, sitemap and robots use the wrong stickyji.app domain. Keywords tags, stale JSON-LD and indexable auth pages need correction.
- Privacy: /app is auth-guarded; session restoration already checks the browser platform. Subscription catalogue may include user subscription data, so it must never execute or transfer HTTP data during prerendering.
- Content: homepage uses demo testimonials. Dedicated pricing page hardcodes unverified USD prices, discounts, encryption and SLA claims; use-cases includes demo testimonials and implied prebuilt templates. Replace unsupported public claims with verified capabilities and the existing live catalogue.
- Hosting: Nginx falls back to index.html for every URL (soft 404). Docker always builds staging. No production environment replacement; default API is localhost. Preserve staging and add explicit production configuration.
- Performance: route-level lazy loading and hashed asset caching already exist. Preloading currently loads all guest routes; many Google font families load globally. Logo PNGs are reused without consistent dimensions. Hero is HTML/CSS, not a photographic LCP asset.
- Trust: privacy and terms are explicitly unapproved drafts; preserve noindex. No verified social profiles, reviews, analytics IDs or verification tokens are available.

Implementation approach: Angular 22 static output with an explicit public route allowlist, hydration and CSR fallback for auth/private routes. No runtime Node server or backend changes. Server rendering rejects all HTTP calls; client catalogue loads after hydration. Nginx serves each prerendered page, permanent aliases, noindex CSR shells, and actual 404s.
