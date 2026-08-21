# Mobile Responsiveness — check registry + probe recipe

Backs the `mobile-check` skill (`~/.claude/skills/mobile-check/SKILL.md`).
This file is the recipe: how to run the probe by hand, the puppeteer
gotchas, and what to reach for when something in a run looks wrong. The
skill is the decision procedure; this is the reference.

See also: `E:\dev-recipes\headless-screenshot-fallback\` — the puppeteer-core
setup this recipe builds on. Read it first if you haven't used
`puppeteer-core` in this environment before; the gotchas below assume it.

## Running `probe.js` by hand

```bash
cd <project>
npm install --no-save puppeteer-core   # throwaway dep, --no-save keeps package.json clean

# if the dev server isn't already running:
npm run dev &   # or however the project starts it; wait for the port

NODE_PATH="$(pwd)/node_modules" node \
  E:\dev-recipes\mobile-responsiveness\templates\probe.js \
  http://localhost:5173/ ./.mobile-check \
  --viewports xs,sm,md,land \
  --project-root "$(pwd)"
```

Flags:

- `--routes a,b,c` — route paths to probe (default `/`). Cap at 8; a
  one-page site with `<section id>` landmarks doesn't need this.
- `--viewports xs,sm,md,land` — the canonical 4 (see `mobile-checks.yaml`).
  Dynamic per-project breakpoints (a custom `xs: 480` etc.) get added by the
  skill's Phase 0/1 as extra `WxH` viewports, e.g. `--viewports xs,sm,479x800`.
- `--only <family-id>` — run a single check family. This is what makes
  Phase 4's per-family re-probe cheap — you don't have to re-run all 12
  every time you fix one.
- `--project-root <path>` — required for the checks that need filesystem
  access (`dvh-safe-area`'s static grep for bare `100vh`/`h-screen`,
  `reduced-motion`'s motion-library + `matchMedia` guard grep). Omit it and
  those two checks degrade to runtime-only signal.

Output: `results-<route>-<viewport>.json` per run, plus screenshots for
families 6 (`layout-collision`), 7 (`fixed-bar-budget`), and 11
(`nav-drawer`) — the only families where a picture adds information a
number doesn't. Exit code is always 0; read the JSON, not the exit code.

## Puppeteer gotchas (inherited from `headless-screenshot-fallback`)

- `chrome --headless --screenshot` never scrolls and doesn't reveal more of
  a `min-h-screen` page by increasing `--window-size` — that CSS is
  relative to the viewport you told Chrome to use. `probe.js` avoids this
  entirely by driving a real page with `puppeteer-core`.
- `NODE_PATH` must point at the *project's* `node_modules` when the script
  lives outside the project (which it does here — it's in `dev-recipes`).
  Otherwise Node can't resolve `puppeteer-core`.
- `isMobile: true` on the viewport emulation matters beyond the pixel size —
  without it, `@media (hover: hover)` resolves the desktop way and family
  10 (`touch-affordance`) silently passes. `probe.js` always sets it.
- Take every quantitative measurement twice, 300ms apart. A measurement
  taken mid-animation, or during a font swap, is noise reported as fact.
  Every check module does this (`measureTwice` in `checks/_shared.js`) and
  reports `unstable` on disagreement rather than picking a number.

## Check family gotchas worth knowing before reading a report

- **`overflow-x`**: never fix with `overflow-x: hidden` on `body` — it
  masks the symptom and permanently disables the check. If the offender
  can't be found, report it unfixed.
- **`form-input-zoom`**: don't fix iOS auto-zoom with `maximum-scale=1` —
  that's a `viewport-meta` (family 2) violation, a different failure mode.
  Fix the field's `font-size` instead.
- **`tap-targets`**: two-tier — 24px (WCAG 2.2 SC 2.5.8, AA) is the failing
  floor, 44px (Apple HIG) is the warn target. Reporting a 30px target as a
  hard failure is wrong and trains distrust of the report.
- **`nav-drawer`**: the only interactive family. It clicks the toggle,
  tabs, and presses Escape on the live page — run it last, after every
  static family has already measured, or its side effects contaminate
  earlier readings.
- **`reduced-motion`**: reloads the page under
  `prefers-reduced-motion: reduce`, then reloads again to restore normal
  media features before returning. If a run is interrupted mid-check, the
  page may be left in the reduced-motion emulation state — reload manually.

## When a check needs `--project-root` and doesn't get one

`dvh-safe-area` and `reduced-motion` both fall back to runtime-only
detection (DOM/CSSOM, no filesystem grep) if `--project-root` is omitted.
This is a legitimate mode for probing a URL you don't have local source
for, but the report should say so — a runtime-only pass on these two
families is weaker evidence than one backed by the source grep.

## Registry format

`E:\dev-recipes\_knowledge\mobile-checks.yaml` documents the 12 families in
the house style shared with `design-picks.yaml`/`design-sources.yaml`: a
header stating what question the file answers, a `conventions:` block, then
one entry per family with `owns`/`not_owns`/`severity`/`applies_when`/
`measure`/`pass`/`fixes`/`forbidden_fixes`. `not_owns` is what mechanically
enforces the no-overlap rule — if two checks claim the same symptom, one of
them has a wrong `owns` line. Never fork this file per project; projects
narrow the derived list via `applies_when`, they don't edit the registry.
