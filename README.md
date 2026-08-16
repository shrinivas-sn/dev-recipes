# dev-recipes

Reusable, battle-tested feature patterns — extracted from real projects after actually
debugging them once, so the next project doesn't repeat the same mistakes.

Each folder is self-contained: a `README.md` (architecture + setup checklist + gotchas)
and a `templates/` directory with copy-in-ready files (secrets stripped, placeholders
marked with `<ANGLE_BRACKETS>`).

## Knowledge layer

- [`_knowledge/`](./_knowledge/) — **Layer 1** of the agent knowledge framework: a registry
  (`sources.yaml`) of where authoritative truth lives per domain, a cost ladder that routes
  to the cheapest tier able to answer (Context7 → `llms.txt` → WebSearch → Firecrawl), and
  `cache/` of distilled, cited, version-pinned briefs. Driven by the `/context-brief` skill
  (`~/.claude/skills/context-brief/SKILL.md`). It exists because the recipes below are
  *process* — they tell Claude how to work but ship no content, so the actual API and design
  decisions still came from model memory. Proven on `E:\calendar-api`
  (`_knowledge/PROOF-calendar-api.md`). Start at
  [`_knowledge/START-HERE.md`](./_knowledge/START-HERE.md) — the whole system on one page.
  **Layer 1b** (design) lives here too: `design-sources.yaml` + `slop-signatures.md`, driven
  by `/design-source`.
- [`_standard/`](./_standard/) — **Layer 2**, the ruler: how to tell whether a skill is any
  good. Deliberately does *not* restate a spec — the checklist is Anthropic's
  `anthropic-best-practices.md`, shipped with the `superpowers` plugin. This folder holds
  only the local deltas (where this setup knowingly departs) and the audit scorecard.
- [`_skills/`](./_skills/) — backup mirror of the 7 hand-written Claude Code skills that
  drive the layers above (`context-brief`, `design-source`, `no-ai-slop`,
  `no-ai-slop-writing`, `api-idea-scout`, `production-readiness`, `animation-ref`). The live
  copies stay in `~/.claude/skills`; `sync-skills.js` refreshes this mirror and
  `--check` reports drift byte-for-byte without writing. Vendor-installed skills are
  deliberately not mirrored — they're reinstallable.

## Recipes

- [`free-push-notifications-pwa-fcm/`](./free-push-notifications-pwa-fcm/) — closed-browser
  push notifications on a $0 stack: PWA + Firebase Cloud Messaging + a Vercel serverless
  function + a GitHub Actions cron job. No paid plan required.
- [`no-ai-slop-scratch-build/`](./no-ai-slop-scratch-build/) — end-to-end workflow for
  building a new app/website that doesn't read as generic AI output.
- [`no-ai-slop-existing-app/`](./no-ai-slop-existing-app/) — retrofit workflow for
  de-genericizing an already-built app without a risky full rewrite.
  Auto-triggered together by the global `no-ai-slop` skill
  (`~/.claude/skills/no-ai-slop/SKILL.md`), which detects scratch vs existing and
  picks the right one automatically.
- [`production-grade-bug-review/`](./production-grade-bug-review/) — the
  `prod-bug-auditor`/`prod-site-auditor` subagents plus the shared `production-readiness`
  skill: an 8-dimension readiness scorecard and precision-focused bug audit, with a
  changelog-driven mechanism for the methodology itself to improve over time.
- [`headless-screenshot-fallback/`](./headless-screenshot-fallback/) — verify a local dev
  server visually when `claude-in-chrome` isn't connected: `puppeteer-core` driving the
  already-installed system Chrome (no download), with the two gotchas that waste time first
  (headless `--screenshot` never scrolls; `min-h-screen` content just grows with
  `--window-size` instead of revealing more of the page).
- [`shopify-online-store-buildout/`](./shopify-online-store-buildout/) — audit → plan →
  build → verify workflow for taking a Shopify store from default-theme/placeholder-copy
  to production-ready, via the CLI + Admin GraphQL API + `claude-in-chrome`. Core process
  is niche/country-agnostic; payments/shipping/legal are a swappable regional module
  (India worked example included). Heavy gotchas appendix (`productSet` option values,
  Privacy Policy auto-management toggle, live-theme push flags, and more).
- [`docs-structure-standard/`](./docs-structure-standard/) — canonical `DOCS/` folder
  layout (`README.md` index, `STATUS.md`, dated `WORK/` folders merging plan+execution,
  `CONTEXT/`, `RESEARCH/`, `EXTRA/`) so `/recap` can reorient in any project with a
  handful of cheap reads instead of a folder crawl, while still surfacing old
  load-bearing work via the index's `Touches`/`Continues` columns instead of reading
  every file. Paired with the `/recap` and `/docs-restructure` commands.
- [`website-animation-patterns/`](./website-animation-patterns/) — growing collection of
  website animation implementation patterns and gotchas, organized by library/technique as
  entries accumulate (currently: general library-agnostic principles, plus a full GSAP+React
  section — `useGSAP`/`contextSafe`, kill-vs-pause/resume on relative tweens, reduced-motion
  branching, a GPU-only sliding-indicator template). Includes a caution on
  `naughtyduk/liquid-gl`'s confirmed content-hiding bug under fractional `devicePixelRatio`,
  and how to tell a real animation bug apart from a backgrounded-tab `requestAnimationFrame`
  testing artifact. Add the next library's lessons here rather than starting a new recipe.


## 📊 Automation Status

| Type | Count | Last Updated |
|------|-------|---------------|
| GitHub Repos | 0 | - |
| Awwwards Sites | 0 | - |
| Official Docs | 0 | - |

## 📚 Recently Added
- [paulkalkbrenner](awwwards-refs\paulkalkbrenner.md) - 2026-08-07
- [GSAP](libraries\gsap\greensock-GSAP.md) - 2026-08-07
- [undefined](_core\unknown-reference.md) - 2026-08-07

