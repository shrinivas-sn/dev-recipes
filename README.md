# dev-recipes

Reusable, battle-tested feature patterns — extracted from real projects after actually
debugging them once, so the next project doesn't repeat the same mistakes.

Each folder is self-contained: a `README.md` (architecture + setup checklist + gotchas)
and a `templates/` directory with copy-in-ready files (secrets stripped, placeholders
marked with `<ANGLE_BRACKETS>`).

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
