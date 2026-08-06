# Shopify Online Store Buildout

End-to-end workflow for taking a Shopify store from "just installed the CLI" or
"default theme with one product" to a coherent, trustworthy, region-ready storefront —
using Claude Code's `shopify-plugin` skills, the Shopify CLI, and the Admin GraphQL API.

Works the same for a brand-new store or an existing one that needs a real audit. The
**core process is identical regardless of niche or country** — only one module (payments/
shipping/legal) changes per region. Treat that module as a plug-in, not a rewrite.

## When to use this

- User says "help me build/fix my Shopify store" and has CLI access (or needs it installed)
- An existing store looks unfinished/generic (unedited theme, placeholder copy, no real
  catalog structure) and needs a real audit before touching anything
- You need the general shape of "what does a production-ready Shopify store actually need"
  regardless of what's being sold

## Prerequisites

- Node.js + `npm install -g @shopify/cli@latest` (verify with `shopify version`)
- The store's `.myshopify.com` domain — if the user only has an `admin.shopify.com/store/<handle>`
  URL, the domain is `<handle>.myshopify.com`
- Relevant `shopify-plugin` skills are auto-loaded by Claude Code when applicable:
  `shopify-onboarding-merchant` (brand-new store), `shopify-use-shopify-cli` (auth/execute/
  theme commands), `shopify-admin` (GraphQL authoring), `shopify-liquid` (theme code)

## Auth: request scopes incrementally, per mutation you actually need

`shopify store auth --store <domain> --scopes <comma-list>` opens a browser OAuth prompt —
re-running it with a broader scope list just adds scopes, it doesn't restart from scratch.
Don't front-load every possible scope; add as you hit `ACCESS_DENIED` errors naming the
required scope. Scopes that came up repeatedly in a full buildout:

```
read_products, write_products, read_content, write_content, read_online_store_pages,
read_online_store_navigation, write_online_store_navigation, read_themes, write_themes,
write_legal_policies
```

Running any `shopify store execute`/`theme` command yourself? Prefix with attribution env
vars (see `shopify-use-shopify-cli` skill for the exact format) — this is required by
Shopify's own CLI analytics contract, not optional flavor.

## The core process (any store, any niche)

### 1. Audit first — never rewrite blind
- `shopify theme pull --theme <live-theme-id> --path <local-dir>` to get real Liquid/JSON,
  not guesses
- Query the store's actual data: `shop`, `themes`, `products`, `collections`, `pages`,
  `blogs`, `menus` via `shopify store execute` — read-only queries need no `--allow-mutations`
- **Render the live site and screenshot it** via `claude-in-chrome` before judging anything
  visual — theme JSON reads fine in isolation but hides real mismatches (e.g. a hero image
  that doesn't match what's actually sold only shows up rendered, not in source)
- Score what you find against the `no-ai-slop` skill's checklist (categories 1-8) — this
  catches unedited template defaults, placeholder copy never replaced, and structural gaps
- Read actual page *bodies*, not just titles — a page can exist and still contain scraped/
  leftover content from an unrelated source (tutorial HTML, a different theme's snippet,
  AI placeholder text) that only shows up once you read the full body
- **Report the full audit before changing anything.** This is a live storefront — real or
  potential visitors are a reason to get sign-off before reshaping it

### 2. Plan — research the region/niche before writing copy
- If the store targets a specific country, that market's payment/shipping/legal norms
  materially change the plan (see "Regional module" below) — don't assume US/EU defaults
- If there's an existing product, prefer building out around it over pivoting niches from
  scratch — sunk cost is usually near-zero (one product), but a full pivot costs real
  re-sourcing time
- Use `EnterPlanMode`/`ExitPlanMode` for approval before executing a multi-step build —
  the storefront is live, so treat this like any other real-system change

### 3. Build — staging theme discipline, never edit MAIN blind
- Duplicate the live theme (or reuse an existing unpublished duplicate) as a staging copy.
  Do all reshaping there first: `shopify theme pull --theme <staging-id>`, edit locally,
  `shopify theme push --theme <staging-id>`
- Screenshot the staging preview (`<domain>?preview_theme_id=<id>`) via `claude-in-chrome`
  before asking for publish approval — don't trust the diff, look at the render
- Small, unambiguous trust fixes (a broken/embarrassing banner, an obviously wrong claim)
  can go straight to the live theme with `--allow-live` — but confirm with the user first;
  `shopify theme push` to a live theme prompts for confirmation non-interactively for a
  reason
- Only `shopify theme publish -t <staging-id> -f` after the user has seen the preview and
  said yes
- Content (pages, policies, blog posts, nav, products, collections) goes through the Admin
  GraphQL API (`shopify store execute --query-file ... --allow-mutations`), not theme files

### 4. Content & catalog, in this order
1. Legal/trust foundation: remove any "testing"/placeholder banner, add an About page,
   set the 4 core legal policies (`shopPolicyUpdate` — see gotchas), real footer info
2. Rewrite existing content pages (Contact/FAQ/Shipping) — **read them first**, don't
   assume they're fine because they exist
3. Fix/organize the catalog: real collections instead of a single catch-all, correct
   product type/title/description on what already exists
4. New draft products (if scaffolding a catalog ahead of real sourcing): create as
   `status: DRAFT`, not `ACTIVE` — don't imply real stock/sourcing that doesn't exist yet
5. Trust & social proof: a reviews app on its free tier, a native (no-app) trust-badge
   line in the footer, a real working newsletter signup if the theme already has one
   (check for a disabled block before building new)
6. SEO: `seo { title description }` on the main product + all collections
7. Cleanup: delete genuinely unused duplicate/unpublished themes (`shopify theme delete`)

### 5. Verify before calling it done
- Full click-through on the **live** site, not just staging preview — a preview-theme
  cookie can linger in your browser session and silently show you staging when you think
  you're checking live; explicitly exit preview mode to confirm
- Check installed-apps status by asking the user for a screenshot or checking storefront-
  rendered evidence (e.g. a review-app's widget markup actually present in the DOM) —
  don't rely solely on Admin API fields that don't cover every app's connection model
  (see gotchas)

## Regional module — swap this per market, core stays the same

This is the part that changes by country. Treat it as a plug-in to the process above, not
a different process.

**Worked example: India**
- Payments: Razorpay's current app (search "Razorpay Secure" — the classic/legacy Razorpay
  Shopify integration was deprecated years ago, don't recommend it) bundles Cards/UPI/NB/
  Wallets under one gateway. UPI needs no separate toggle once that provider is added.
- COD (Cash on Delivery) is a major share of India ecommerce — enable Shopify's native
  manual COD payment method (admin-only, no API). RTO (return-to-origin) risk is the
  tradeoff; a paid OTP-verification app helps but isn't required for a free prototype —
  manual order-confirmation habits are an acceptable stopgap
- Shipping: Shiprocket (or a direct courier app) for domestic fulfillment — free to
  connect, pay-per-shipment
- Legal: GST applies above a turnover threshold — don't assume it's required, ask
- KYC (PAN/GSTIN/bank details) for the payment gateway is 100% the merchant's own step —
  never something an agent should submit on their behalf

For a different market, replace this section's specifics (which gateway, which shipping
norm, which legal threshold) — the rest of this recipe doesn't change.

## Gotchas (all hit in a real buildout — save yourself the debugging loop)

- **`productSet` requires `optionValues` on every variant**, even a single default-variant
  product with no real options. Add a `productOptions: [{ name: "Title", values: [{ name:
  "Default Title" }] }]` and matching `optionValues` on the variant, or it errors.
- **Privacy Policy blocks edits until "automatic management" is turned off** in
  Settings → Policies (admin-UI-only toggle) — `shopPolicyUpdate` on `PRIVACY_POLICY`
  fails with a clear error until that's done. The other 3 policies (Refund/Shipping/TOS)
  don't have this restriction.
- **`shopPolicyUpdate` needs the `write_legal_policies` scope** specifically — it's easy to
  miss since it's not bundled with `write_content`.
- **`fileCreate`'s `filename` extension must match the source URL's actual extension**
  (e.g. `.jpeg` vs `.jpg` on a Pexels/Unsplash URL with query params) or it's rejected
  before even attempting the fetch.
- **`shopify theme push` to a live/MAIN theme needs `--allow-live`** to run non-
  interactively — without it, the CLI blocks waiting for a confirmation prompt it can't
  get in a non-interactive session.
- **`shop.fulfillmentServices` is a false negative for many shipping apps** — apps like
  Shiprocket sync orders via their own API polling, not Shopify's legacy fulfillment-
  service registration, so this field can show only "Manual" even when a shipping app is
  correctly installed and connected. Don't use it as the sole signal that a shipping app
  isn't working — check the Apps list or ask for a screenshot instead.
- **A theme's section `.liquid` file can be silently incompatible with its own JSON
  template** if someone previously pasted a snippet from a different theme (e.g. a
  Dawn-theme hero section pasted into a Horizon-based theme). Symptom: "Invalid value for
  type in block '...'. Type must be defined in schema" on push, and a broken-image
  placeholder pattern where the section should render. Fix: diff the suspect file against
  a known-good copy of the same theme (or re-pull the file from an unmodified duplicate)
  rather than trying to patch the JSON around it.
- **Reusing an existing but half-broken "Copy of X" duplicate theme as your staging base
  can carry forward old broken experiments** — diff the whole staging theme folder against
  a fresh pull of the live/original theme before building on it, not just the files you
  intend to touch.
- **A disabled block in a section's JSON (`"disabled": true`) is often a half-built
  feature**, not dead weight — e.g. a newsletter signup heading/paragraph with no actual
  input block behind it. Check whether the theme has a real block type for it (e.g. an
  `email-signup` block file) before assuming you need to build one from scratch.
