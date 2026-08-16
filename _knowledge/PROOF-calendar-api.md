# Layer 1 proof run — `E:\calendar-api`, 2026-08-16

The question Layer 1 has to answer: **does routing through registered sources change the
output versus answering from memory?** If it produces the same answers more slowly, it is
overhead. Run on `calendar-api` because it has a `backend/` and a `frontend/`, exercising
both the API-truth side and the design side.

## What the router did

| Step | Result |
|---|---|
| Pin versions | `express@5.2.1`, `tailwindcss@3.4.19`, `react@19.2.6`, `react-router-dom@7.16.0`, `vite@8.0.14` — read from **lockfiles**, since `node_modules/` was absent in both halves |
| Cache check | Miss on both topics (cold registry) |
| Tier 1 — Context7 | `/expressjs/express/v5.2.0` (version-pinned) and `/websites/v3_tailwindcss` (v3-specific id) |
| Tier 2 — llms.txt | Not needed for either topic; 9/9 registered endpoints probed healthy |
| Tier 3 — WebSearch | Not needed |
| Tier 4 — Firecrawl | **Not spent.** 0 credits. Neither topic was an aesthetic-reference question |

Retrieval was then verified against shipping artifacts rather than trusted on its own:
a real `express@5.2.1` install, and `tailwindcss@3.4.19/src/public/colors.js`.

## Finding 1 — backend: no terminal error handler

`backend/src/index.js:438` ends with a 2-argument wildcard `app.use`. Express distinguishes
error handlers from request handlers **only** by arity (`fn.length !== 4` → skipped), so
that handler catches unmatched routes and never sees an error. No 4-arg handler exists in
the file.

Every `/v1` route has a local `try/catch`, which is why this never surfaced. Middleware is
not covered: `express.json()` throws on a malformed body and bypasses all of them.

Reproduced on a matching stack:

| Request | `NODE_ENV` unset | `NODE_ENV=production` |
|---|---|---|
| async `throw` | **500 `text/html` + full stack trace, absolute server paths** | 500 `text/html`, `Internal Server Error` |
| malformed JSON body | **400 `text/html` + `SyntaxError` stack** | 400 `text/html`, `Bad Request` |

Production env removes the stack trace but not the HTML. A JSON API answering 400/500 in
`text/html` breaks its own documented envelope either way.

**Memory would have gotten this wrong**, and in a specific, checkable direction: the
Express **4** answer is "wrap async handlers in try/catch or use `express-async-handler`,
or an unhandled rejection crashes the process." On 5.2.1 that is obsolete — rejected
promises are auto-forwarded by `Layer.handleRequest`. Memory would have prescribed dead
dependencies while missing the actual defect, which is the *absence of the 4-arg sink*.

## Finding 2 — frontend: the slate scale is remapped

`tailwind.config.js` restates all 11 `slate` shades under `theme.extend.colors`. Diffed
against the shipping default palette, exactly **two** differ:

| Class | Stock 3.4.19 | Here | Renders as |
|---|---|---|---|
| `slate-400` | `#94a3b8` | `#e2e8f0` | stock slate-200 |
| `slate-500` | `#64748b` | `#cbd5e1` | stock slate-300 |

The other nine are identical to stock. 121 usages across `src/` depend on the remap.

This is the content gap in miniature. The conventional move — "muted secondary text →
`text-slate-400`" — is right against stock Tailwind and produces *near-white* text here.
No amount of general design skill catches it; only reading the config does. A rule-based
skill cannot encode it either, because it is true of this project and false of the next one.

Also caught: the project is Tailwind **v3** (`@tailwind` directives, JS config, `theme()`
in CSS), while current model memory defaults to v4's CSS-first syntax. v4 syntax in a v3
project emits **no utilities and no error** — it renders unstyled rather than failing loudly.

## Registry corrections earned by the run

- **Tailwind publishes no `llms.txt`.** `RESEARCH.md` listed it among the publishers.
  Probed 404 on `/llms.txt`, `/llms-full.txt`, `/docs/llms.txt`, and `v3.tailwindcss.com`.
  Recorded as `llms_txt: null` + checked date so no future run re-discovers it.
- **React Router publishes no `llms.txt`** either (404 on all three paths). Tier 1 only.
- **`expressjs.com/llms.txt` is a 1.5 KB stub** — a 200 is not evidence a tier can answer.
  Marked so the router goes straight to Context7.
- **Tailwind needs two Context7 ids**, not one: `/websites/tailwindcss` serves v4,
  `/websites/v3_tailwindcss` serves v3. Using the unversioned id here would have produced
  a fluent, wrong, v4 answer.
- **`vercel.com/llms.txt` is 206 KB** — flagged size-sensitive, fetch with a narrow prompt.

## Incidental

The live backend is down: `calendar-api-production-a697.up.railway.app` returns Railway's
edge 404 (`Application not found`, `x-railway-fallback: true`). The API-status badge in
`README.md` is therefore misleading. This also blocked confirming which `NODE_ENV`
production runs under — hence both env cases documented above rather than one.

## Verdict

Two defects found, neither reachable from memory, both citable to shipping source. Five
registry corrections banked so the next run is cheaper. Firecrawl budget untouched.

Cost: Context7 free tier, ~12 HTTP probes, one throwaway npm install. Layer 1 holds.

## Not proven yet

- **Cache-hit path.** Both lookups were cold misses. TTL expiry and the
  version-drift-beats-date rule are implemented but unexercised — the honest next test is
  re-running after bumping a dependency.
- **Tier 4.** No Firecrawl call was made, so the design-reference route is untested in
  practice. Correct for these two topics; still a gap in coverage.
- **Fixes not applied.** Both findings are documented, not patched. `calendar-api` is
  unchanged apart from the new `DOCS/APP-CONTEXT/STACK-CONTEXT.md`.
