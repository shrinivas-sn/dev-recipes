# Free push notifications for a PWA (closed-browser, $0 stack)

Send real push notifications — delivered even when the browser/app is fully closed —
without a paid plan. Built for a Vite + React + Firestore app deployed on Vercel;
adapt the app-specific bits for other stacks.

## Stack (all free tier)

| Piece | Role | Cost |
|---|---|---|
| PWA (`vite-plugin-pwa` or equivalent) | Makes the app installable, provides the service-worker foundation | Free |
| Firebase Cloud Messaging (FCM) | Actually delivers the push to the device | Free |
| Vercel serverless function | Server-side check ("is anything due?") + sends the push via Firebase Admin SDK | Free (Hobby tier) |
| GitHub Actions (scheduled workflow) | The clock — triggers the serverless function on a cron schedule | Free |
| Firestore | Stores device tokens + a dedupe log | Free tier |

Nothing here needs Firebase Blaze or Vercel Pro.

## Architecture

```
GitHub Actions (cron) --HTTPS+secret--> Vercel /api/check-X (Admin SDK)
                                              |
                                    reads Firestore for "due" items
                                              |
                                        sends via FCM
                                              |
                                   Service worker (any state) --> OS notification
```

## Setup checklist

1. **Firebase Console → Project Settings → Cloud Messaging → Web Push certificates**
   → generate a VAPID key → `VITE_FIREBASE_VAPID_KEY` (client env var, safe to expose).
2. **Firebase Console → Project Settings → Service Accounts** → generate a new private
   key (JSON) → paste the **entire file contents** as one Vercel env var:
   `FIREBASE_SERVICE_ACCOUNT_KEY`. Never commit this file — see `.gitignore` note below.
3. Pick a random secret string → `CRON_SECRET`. Add it as a Vercel env var **and** a
   GitHub Actions repo secret (must match).
4. Add a GitHub Actions secret `VERCEL_APP_DOMAIN` = your bare production domain
   (e.g. `myapp.vercel.app` — no `https://`, no trailing slash).
5. **If Vercel Deployment Protection ("Vercel Authentication") is on** for the
   production domain, cron requests get redirected to a login page instead of hitting
   your function. Fix (free, no Pro plan needed): Vercel → Project → Settings →
   Deployment Protection → **Protection Bypass for Automation** → generate secret →
   add as GitHub secret `VERCEL_BYPASS_SECRET` → pass as the
   `x-vercel-protection-bypass` header (see `templates/github-workflows/`).
6. Add to `.gitignore`: `*firebase-adminsdk*.json` (or wherever you drop the service
   account key locally before pasting into Vercel — delete the local file after).
7. Copy `templates/` files in, fill in the placeholders, wire the opt-in button into
   your UI (see `templates/src-utils/notifications.ts`).
8. Customize the "what counts as due" query in `templates/api/check-deadlines.ts` —
   that part is inherently app-specific (whatever dates/fields your app tracks).

## Gotchas (the actual hard-won part)

1. **Two service workers can't safely share scope `/`.** If your PWA already
   auto-registers a worker at root scope (e.g. via `vite-plugin-pwa`), and you register
   the FCM messaging worker at the default scope too, they collide — push events can
   silently land on whichever worker currently controls that scope, and if it has no
   push handler, **FCM reports success but nothing displays.** Fix: register the
   messaging worker on its own dedicated scope:
   ```js
   navigator.serviceWorker.register('/firebase-messaging-sw.js', {
     scope: '/firebase-cloud-messaging-push-scope',
   });
   ```
2. **`register()` resolves before the worker is active.** Calling `getToken()`
   (which internally calls `PushManager.subscribe`) immediately after `register()` can
   throw `"Failed to execute 'subscribe' on 'PushManager': Subscription failed - no
   active Service Worker"`. Wait for the worker to reach `state === 'activated'` first
   (see `waitForActive()` in the template).
3. **Don't disable your "enable notifications" button once `Notification.permission`
   is `'granted'`.** If you ever change the service worker (e.g. fixing gotcha #1), you
   need users to be able to re-trigger registration to pick up a fresh token — a
   permanently-disabled button makes that impossible without the user manually
   clearing site data. Let it always be clickable; relabel it "re-sync" instead.
4. **Vercel Deployment Protection silently breaks cron calls** — the response looks
   like a 200 with an HTML body ("Redirecting...") instead of an error, which is
   confusing to debug from a GitHub Actions log. See setup step 5.
5. **Dedupe sends.** A daily cron will re-fire the same "3 days before" alert every day
   between day 3 and day 0 unless you log what's already been sent (keyed by
   `docId + field + dateValue + bucket`) and skip if already logged.
6. **Timezone:** compare calendar days, not raw timestamps (a `type="date"` value like
   `"2026-08-01"` parses as UTC midnight). If your cron runs at a time where the UTC
   calendar day still matches your target timezone's calendar day, plain UTC day-diff
   math is fine — just don't schedule the cron near your timezone's midnight boundary.

## Files in this recipe

- `templates/public/firebase-messaging-sw.js` — background push handler (service worker)
- `templates/src-utils/notifications.ts` — client-side opt-in flow (permission → register → token → save)
- `templates/api/check-deadlines.ts` — Vercel serverless function (Admin SDK, dedupe, send)
- `templates/github-workflows/notify-cron.yml` — the scheduled trigger
- `templates/vite-pwa-config-snippet.md` — the `vite-plugin-pwa` config block used alongside this
