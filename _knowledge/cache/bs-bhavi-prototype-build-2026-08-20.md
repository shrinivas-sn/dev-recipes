---
project: bs-bhavi-site/prototype/site
date: 2026-08-20
---

# Adaptation notes — bs-bhavi prototype build (all 11 PICKS.md phases)

- **shadcn carousel.json ships a broken import**: `@/registry/new-york/ui/button`
  instead of the consuming project's own `@/components/ui/button` alias. Every
  future shadcn `carousel` pull needs this path fixed by hand — it's not a
  one-off, it's baked into that payload.
- **Magic UI `marquee.json`** needs `--animate-marquee`/`--animate-marquee-vertical`
  registered in Tailwind v4's `@theme inline`, PLUS the matching `@keyframes marquee`
  / `@keyframes marquee-vertical` blocks at the top level of the CSS file (not nested
  inside `@theme`). Skipping either half renders the marquee static with no error.
- **Fontshare (api.fontshare.com) CSS `@import` works fine for Boska/Switzer** —
  both returned 200, no self-hosting needed. Cheaper than downloading woff2 by hand.
- **shadcn new-york style needs a bigger token set than the starter scaffold ships.**
  Grepping all fetched `ui/*.tsx` for `bg-/text-/border-/ring-` tokens surfaced
  `muted`, `muted-foreground`, `destructive`, `destructive-foreground`, `input`,
  `ring` — none were in this project's placeholder `index.css`. Grep the fetched
  components for tokens before wiring `@theme`, don't just carry over the
  placeholder set.
- Picked palette's navy (#3368a0) fails AA body-text contrast on the cream
  background (#f2efe7) — used a darkened derivative (#14213a) for `--foreground`
  instead, kept navy itself for `--primary` (buttons/accents only, not body text).
