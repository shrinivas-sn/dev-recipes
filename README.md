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
