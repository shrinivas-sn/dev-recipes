# Production SEO for a React SPA (Vite + Vercel, $0 stack)

Make a client-rendered React SPA actually indexable and rankable by Google —
correct per-page metadata, real crawlable HTML (not an empty `<div id="root">`),
a sitemap, and Search Console verification. Built for Vite + React Router +
Vercel; adapt the platform-specific bits (prerender's Chrome launch, the
rewrite config) for other hosts.

## Why an SPA needs this at all

A plain `vite build` output is one `index.html` with an empty root div — all
content renders client-side via JS. Googlebot *can* execute JS, but:
- it still sees a blank page for the first paint, so title/description in
  the raw HTML are wrong or missing (bad search snippets, bad social previews)
- every route (`/`, `/docs`, `/status`, ...) resolves to the *same*
  `index.html` with the *same* `<title>` unless you fix it — Google can't
  tell your pages apart
- link-preview bots (Slack, WhatsApp, Twitter) generally do **not** execute
  JS at all, so they get nothing without server-rendered meta tags

This recipe fixes both: **runtime metadata** (correct tags while the app is
running for real users) and a **build-time static snapshot** (correct HTML
Googlebot/crawlers receive without executing anything).

## Stack (all free tier)

| Piece | Role | Cost |
|---|---|---|
| `react-helmet-async` | Injects per-page `<title>`/meta/OG/Twitter/JSON-LD at runtime | Free |
| Puppeteer + `@sparticuz/chromium` | Build-time headless-Chrome snapshot of each route → real static HTML | Free |
| Route manifest (`routes.js`) | Single source of truth: path, title, description, sitemap priority | — |
| Google Search Console | Ownership verification, sitemap submission, indexing requests | Free |

## Architecture

```
vite build                    (plain SPA — dist/index.html, empty root div)
      |
postbuild: scripts/prerender.js
      |
      +--> launches headless Chrome, visits each ROUTES entry against
      |    the built app, waits for data+spinner to settle, saves
      |    page.content() to dist/<route>/index.html
      |
      +--> writes dist/sitemap.xml + dist/robots.txt from routes.js
      |
      v
Vercel serves the STATIC prerendered file for a route if one exists,
falling back to the SPA shell + client rewrite for anything else
(vercel.json rewrites — static files are matched before rewrites apply).
```

Runtime (`Seo.jsx` + `<Helmet>`) and build-time (`prerender.js`) both read
title/description from the *same* `routes.js` entry — edit one file, both
stay in sync.

## Setup checklist

1. **Route manifest** — copy `templates/src-config/routes.js`. One entry per
   real route: `path`, `title` (≈50-60 chars), `description` (≈150-160
   chars, unique per page — duplicate descriptions across pages hurt
   ranking), `changefreq`, sitemap `priority` (`1.0` for home, lower for
   secondary pages).
2. **Config resolution** — copy `templates/src-config/config.js`. Exposes
   `SITE_URL` so it works both under Vite (`import.meta.env`) **and** plain
   Node (`process.env`), because `prerender.js` imports it outside the Vite
   pipeline. Set `VITE_SITE_URL` as an env var on your deploy platform to
   your real production domain — get this right *before* your first
   prerender/sitemap build, wrong values bake into every canonical tag.
3. **Seo component** — copy `templates/src-components/Seo.jsx`. Each page
   calls it once:
   ```jsx
   const { title, description } = ROUTES.find((r) => r.path === '/docs');
   <Seo title={title} description={description} path="/docs" />
   ```
   Pass `structuredData` (JSON-LD, schema.org) on your most important page
   (usually home) for rich-result eligibility — see step 6.
4. **Install prerender deps**: `npm i -D puppeteer @sparticuz/chromium`.
   Copy `templates/scripts/prerender.js`, wire it as `postbuild` in
   `package.json`:
   ```json
   "scripts": { "build": "vite build", "postbuild": "node scripts/prerender.js" }
   ```
5. **`vercel.json`** (or equivalent SPA fallback config) must rewrite
   *everything* to `index.html` for client-side routing to still work on a
   hard refresh of an unprerendered path:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
   Confirm your host serves static files (the prerendered
   `dist/<route>/index.html`) *before* applying this rewrite — Vercel does
   this by default; verify equivalent precedence if using another host.
6. **JSON-LD structured data** (optional but recommended for the home page):
   ```js
   const STRUCTURED_DATA = {
     '@context': 'https://schema.org',
     '@graph': [
       { '@type': 'WebSite', name: 'Your Product', url: SITE_URL, description },
       { '@type': 'SoftwareApplication', name: 'Your Product', applicationCategory: 'DeveloperApplication', ... }
     ]
   };
   <Seo ... structuredData={STRUCTURED_DATA} />
   ```
   Pick the schema.org `@type` that matches what you're building (`WebSite`,
   `SoftwareApplication`, `Product`, `Organization`, `Article`, ...).
7. **Google Search Console verification** — see next section.

## Google Search Console: verify, submit, get indexed

1. https://search.google.com/search-console → **Add Property** → URL prefix
   → your production URL.
2. Pick **HTML file** verification (not the meta-tag option, which needs an
   extra deploy step to edit `Seo.jsx`/`index.html` — the file method is one
   drop-in). Download the file GSC gives you (e.g.
   `googleXXXXXXXXXXXXXXXX.html`) — see
   `templates/public/google-site-verification.html.template` for exactly
   what it needs to contain.
3. Put that file in your Vite `public/` folder (static files there are
   copied verbatim to the deploy root — no build step touches them).
   Commit, push, let it deploy.
4. Confirm it's actually live — open
   `https://your-domain.com/googleXXXXXXXXXXXXXXXX.html` directly, it should
   show just that one line of text. Only then click **Verify** in GSC.
5. Once verified: **Sitemaps** (left sidebar) → submit `sitemap.xml`.
6. **URL Inspection** (top bar) → paste your homepage URL → if "URL is not
   on Google", click **Request Indexing**. This has a **daily quota**
   (roughly ~10-12/property/day) — if you hit it, indexing still happens on
   its own on Google's normal crawl schedule, the button just nudges it
   faster. Don't retry-spam it.
7. Check progress with `site:your-domain.com` in a normal Google search —
   empty results means not indexed *yet*, not broken. New sites typically
   take days to ~2 weeks for first indexing.

## Gotchas (the actual hard-won part)

1. **Vercel's build container can't launch Puppeteer's bundled Chrome** — it's
   missing shared libs (`libnspr4.so` etc.) that Chrome needs. Detect
   `process.env.VERCEL` and swap in `@sparticuz/chromium` (a Chrome build
   made for serverless/build containers) only in that case; local dev keeps
   using Puppeteer's own Chrome unchanged. This is the #1 way this setup
   silently fails ("works on my machine, breaks on deploy").
2. **Prerendering must never be allowed to fail the whole build.** It's an
   SEO enhancement, not a requirement — the plain `vite build` SPA output
   already works and serves correctly on its own. Wrap the whole prerender
   step (and each route within it) in try/catch that logs and continues;
   worst case you ship the SPA shell for a route instead of blocking the
   deploy.
3. **One route failing (e.g. backend cold-start timeout) shouldn't take the
   rest down.** Prerender routes sequentially in a loop with a per-route
   try/catch, not `Promise.all`.
4. **Prerendering routes concurrently in *one* Chromium instance can race
   `react-helmet-async`'s title/meta commit** under CPU contention — one tab
   can capture another route's stale `<title>`. Prerender sequentially, not
   in parallel, even though it's slower at build time.
5. **`networkidle0` isn't enough if your app shows a loading spinner after
   data fetches settle** (e.g. animating out). Add a
   `page.waitForFunction(() => !document.querySelector('<your-spinner-selector>'))`
   with its own short timeout (and `.catch(() => {})` so a stuck spinner
   doesn't fail the whole route).
6. **If your backend has any cold-start delay** (free-tier serverless DB,
   etc.), Puppeteer's default 30s navigation timeout isn't enough — bump it
   (60s is a safe floor) or the prerendered snapshot captures an error/empty
   state instead of real content.
7. **`SITE_URL` must resolve correctly under plain Node, not just Vite** —
   `prerender.js` runs as a postbuild script outside the Vite pipeline, so
   `import.meta.env` is undefined there. Check `process.env` too (see
   `config.js` template) or every canonical/OG/sitemap URL silently falls
   back to a wrong default.
8. **Set `VITE_SITE_URL` to the real domain before the first prerender
   build.** It bakes into `sitemap.xml`, `robots.txt`, and every canonical
   tag in the static HTML — a placeholder value ships wrong URLs to Google
   until the next deploy regenerates them.
9. **GSC's HTML-file verification needs the file *actually deployed and
   live*, not just committed.** "Verification failed, wrong content" almost
   always means the deploy hasn't finished yet or the file didn't land in
   `public/` (wrong path, so it wasn't copied to the build root). Always
   curl/open the URL yourself before clicking Verify.
10. **Manual "Request Indexing" has a small daily quota.** Hitting it is not
    an error state — indexing still proceeds automatically on Google's own
    schedule; the button is a speed-up, not a requirement.
11. **SEO code changes ≠ ranking #1.** This recipe covers *technical* SEO
    (crawlability, correct metadata, indexability) — it makes you eligible
    to rank. Actual position for competitive keywords is driven mostly by
    backlinks, domain age, and content relevance, none of which live in
    code. Don't expect top-of-results from this alone; do expect to go from
    "invisible to Google" to "correctly indexed and snippet-accurate."

## Files in this recipe

- `templates/src-components/Seo.jsx` — shared `<Helmet>` wrapper: title, description, canonical, OG, Twitter, JSON-LD
- `templates/src-config/routes.js` — route manifest: single source of truth for nav, SEO copy, sitemap
- `templates/src-config/config.js` — `SITE_URL`/`API_BASE_URL` resolution that works under both Vite and plain Node
- `templates/scripts/prerender.js` — postbuild: headless-Chrome snapshot per route + sitemap.xml/robots.txt generation
- `templates/public/google-site-verification.html.template` — what the GSC verification file needs to contain
