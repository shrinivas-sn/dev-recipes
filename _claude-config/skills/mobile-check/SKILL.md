---
name: mobile-check
description: Drives any site — one being built here, or one that already exists — in a real headless browser at real phone viewports, measures numbers against a registry of 12 non-overlapping checks, writes a report, fixes what failed in severity order, and re-measures to prove each fix. Use as the ship gate after design-source builds a section, standalone on any existing site to audit mobile responsiveness, or whenever "is this mobile responsive?" would otherwise be answered by eyeballing a screenshot instead of measuring it.
---

# mobile-check

"Is it mobile responsive?" is currently answered from memory and eyeballing —
the same class of failure `design-pick` and `context-brief` were built to
remove. Same fix: **retrieve/measure, cite, never assert.**

Wired in as the gate after build: `design-pick` decides -> `design-source`
builds -> `mobile-check` gates. Also runnable standalone on any existing site.

**PASS means a measured DOM number inside the pass condition. Never a
screenshot impression.** Screenshots are attached only for families 6, 7, and
11 — the ones where a picture adds information a number doesn't — and are
never the pass signal for any family.

Checklist source: `E:\dev-recipes\_knowledge\mobile-checks.yaml` — the 12
check families, every one exactly once, no duplicate detection. This skill
derives the subset that applies to the project in front of it; it never
invents or re-generates the checklist per run.

## Phase 0 — Detect

Produce a **Run profile** and print it before doing anything else. Never
guess a value; if one can't be determined, ask.

1. **Stack.** Read `package.json`. Identify the framework (Vite / Next /
   Astro / CRA / SvelteKit / plain static) from deps + config files.
2. **Serve URL**, in order:
   a. A dev server is already listening -> use it (probe the port, don't
      assume — "the dev server is probably on 5173" produces a confident,
      wrong report about a different project entirely).
   b. Else read the `dev`/`start` script, run it **in the background**, wait
      for the port to accept a connection, and record that this skill
      started it so Phase 5 can shut it down.
   c. Else if there's a build output dir or a bare `index.html`, serve it
      statically.
   d. Else **ask the user for the URL.** Do not proceed on a guessed port.
3. **Breakpoints.** Read `tailwind.config.{js,ts,cjs,mjs}` ->
   `theme.screens`; or Tailwind v4 `@theme { --breakpoint-* }` in the CSS
   entry; or collect distinct `@media (min-width|max-width: …)` values from
   the project CSS. Record them.
4. **Routes / sections.** Enumerate routes from the router config, or — for
   a one-page site — the `<section id>`/landmark elements on the rendered
   page. Cap at 8 URLs per run; if there are more, ask which matter.
5. **Browser.** Prefer `puppeteer-core` against the installed Chrome/Edge
   (§ Probe implementation notes below). `claude-in-chrome` is acceptable
   when connected and the user prefers it, but the JSON result shape must be
   identical either way.
6. **Write** the run profile into `MOBILE.md` under `## Run profile`.

## Phase 1 — Derive

Filter `mobile-checks.yaml` down to the checks that actually apply, using
each entry's `applies_when`:

| Family | Runs only when |
|---|---|
| overflow-x, viewport-meta, text-legibility, layout-collision, fixed-bar-budget | always |
| tap-targets | page has any interactive element (effectively always) |
| form-input-zoom | project contains a `<form>` or any text input |
| dvh-safe-area | project uses `100vh`/`h-screen`, or has a fixed/sticky edge bar |
| media-cls | project renders `<img>` or `<video>` |
| touch-affordance | project has any `:hover`/`hover:` rule that changes visibility |
| nav-drawer | page has a nav landmark |
| reduced-motion | project has CSS animations/transitions or a motion library |

Print the derived list with a one-line reason per **excluded** family. An
excluded family is stated, never silently dropped — a missing check and a
passed check must not look the same. (Same rule as `design-pick`'s
`NO CONSTRAINTS SOURCE`.)

## Phase 2 — Probe

Run `E:\dev-recipes\mobile-responsiveness\templates\probe.js` once per
(viewport × route):

```
node probe.js <baseUrl> <outDir> [--routes a,b,c] [--viewports xs,sm,md,land] [--only family-id] [--project-root <path>]
```

Order within a viewport: static/read-only families first (1–10, 12),
interactive family 11 (`nav-drawer`) last — opening a drawer mutates the
page. `probe.js` already enforces this ordering.

Output per run: a JSON blob into `.mobile-check/results-<route>-<viewport>.json`
containing, per family, `{ status: pass|warn|fail|n/a|unstable, measured: {...}, offenders: [...] }`.
Screenshots land in `.mobile-check/<route>-<viewport>-<family>.png` for
families 6, 7, and 11 only.

Reliability requirements — these are not optional, and `probe.js` already
implements them, don't work around them:

- `waitUntil: 'networkidle0'` plus an ~800ms settle delay so entrance
  animations finish before measuring.
- `document.fonts.ready` awaited before family 4 measures anything — font
  swap changes computed sizes.
- Every quantitative measurement taken twice, 300ms apart; disagreement is
  reported as `unstable`, never resolved by picking one. A flaky number
  reported as fact is worse than no number.

## Phase 3 — Report

Write `MOBILE.md` from
`E:\dev-recipes\mobile-responsiveness\templates\report-template.md`, filling
in the Run profile, the Derived checks (included + excluded-with-reason), the
Score table, per-finding sections (each cites a measured number, ordered
blocker -> major -> minor, then by viewport count affected), and the Fix
ledger. If a family passed, say so in the score table — a report that only
ever finds problems is noise.

## Phase 4 — Fix

- Work **one family at a time**, strictly blocker -> major -> minor.
- Only edit the offenders the probe named. Do not opportunistically refactor.
- **Re-probe that family after fixing it, before moving to the next**
  (`--only <family-id>`). Write the before/after numbers into the fix
  ledger. A fix without a re-probe delta is a claim, not a fix.
- Re-run the **full** probe once at the end — fixes interact, and a
  family-1 fix routinely breaks family 6.
- **Stop and ask** when the fix requires a design decision rather than a
  responsive one: changing the nav pattern, dropping a section on mobile,
  re-cropping a hero, choosing a different image. Those are `design-pick`
  territory, not this skill's.
- **Never** fix by suppressing the measurement: no `overflow-x: hidden` on
  body, no `maximum-scale=1`, no removing the element the check flagged, no
  `!important` to win a specificity fight you didn't diagnose.

## Phase 5 — Gate

1. If `PICKS.md` exists, append a `Mobile:` line to each phase whose section
   was covered by this run:
   `Mobile: <date> — pass | FAIL(<n> blockers, <n> majors) — see MOBILE.md`
2. If the project has `DOCS/README.md` starting with
   `<!-- docs-structure: v1 -->`, update `DOCS/STATUS.md` current-state +
   pending accordingly.
3. Shut down the dev server if Phase 0 started it.
4. State the outcome plainly, including what could not be checked and why.

## Probe implementation notes

Reuse `E:\dev-recipes\headless-screenshot-fallback\` — it already documents
the traps. Do not re-derive them:

- `puppeteer-core` against the **already-installed** Chrome/Edge. Do not
  download Chromium.
- `npm install --no-save puppeteer-core` inside the project — `--no-save` so
  a throwaway verification dep doesn't leak into `package.json`.
- If the script lives outside the project, set
  `NODE_PATH="<project>/node_modules"` or Node won't resolve
  `puppeteer-core`.
- Plain `chrome --headless --screenshot` **cannot scroll** and a taller
  `--window-size` does not reveal more of a `min-h-screen` page. Last resort
  only; if used, the report must say the run was single-viewport and
  unscrolled rather than presenting it as a full verification.

## The 12 check families

One failure mode, one owner — full detection contract, pass conditions, and
fix menus live in `mobile-checks.yaml`. Boundary rulings worth memorizing
(where overlap creeps in):

- Font size of an `<input>` is family 5 (`form-input-zoom`) only, never 4.
- Font size of a paragraph is family 4 (`text-legibility`) only, never 5.
- An image wider than the screen is family 1 (`overflow-x`), not 9.
- An image with the wrong aspect ratio is family 6 (`layout-collision`), not 9.
- An image that shifts the page on load is family 9 (`media-cls`), not 6.
- A menu button too small to tap is family 3 (`tap-targets`), not 11.
- A menu that opens but doesn't lock body scroll is family 11
  (`nav-drawer`), not 1 — even though the symptom looks like scrolling.
- A sticky header covering the first heading is family 7
  (`fixed-bar-budget`) if shrinking the bar fixes it, family 6
  (`layout-collision`) if only re-ordering/padding fixes it.
- Animation quality/taste is out of scope entirely — that's
  `review-animations`/`improve-animations`. Family 12 only asks whether the
  reduced-motion code path fires.

## Rationalizations to reject

| Excuse | Reality |
|---|---|
| "The screenshot looks fine, mark it pass" | Screenshots are attachments, never the pass signal. Measured numbers only. |
| "I'll add `overflow-x: hidden` to body and move on" | That deletes the evidence and disables the check forever. Report it unfixed instead. |
| "Both these checks would catch it, I'll detect it in both" | Duplicate detection is the exact thing `not_owns` exists to prevent. One owner. |
| "This project has no forms so I'll just skip family 5" | Skip it, but *print* that you skipped it and why. A silent skip looks like a pass. |
| "I fixed it, it obviously works now" | Re-probe. A fix without a before/after delta is a claim, not a fix. |
| "The dev server is probably on 5173" | Probe the port. A guessed port that happens to be another project's server produces a confident, wrong report. |
| "I'll bundle all 12 fixes then re-probe once" | Fixes interact. One family at a time, re-probe each, then a full run at the end. |
| "The nav needs a different pattern on mobile — I'll redesign it" | That's a `design-pick` decision. Stop and ask. |
| "44px targets are the standard, anything smaller fails" | 24px (WCAG 2.2 AA) is the failing floor; 44px (HIG) is the warn target. Reporting a warn as a failure trains the user to ignore the report. |
| "Line length is 110ch, that's a fail" | Line length is reported, never failed. It's taste, and this skill doesn't do taste. |
| "Two measurements disagreed, I'll take the better one" | That's `unstable`. Report the disagreement. |
| "I'll write the check list fresh, it's faster than the YAML" | Generating the checklist per-run is exactly the failure `design-pick` exists to prevent. Registry, then derive. |

## Red flags — stop

- About to write `pass` for a family with no number next to it.
- About to write a `Mobile:` line in `PICKS.md` without a probe behind it.
- About to add a check to `mobile-checks.yaml` whose pass condition is a
  judgement call.
- About to detect one symptom in two families.
- About to edit a file the probe did not name as an offender.
- About to claim a fix without a re-probe delta in the ledger.
- About to present a `chrome --headless` single-shot as a full verification.
- About to skip registration chores because "the skill works" — an
  unregistered skill is one the next session won't find.

## Handoff — wiring into `design-pick`

Every design-heavy phase in `design-pick`'s `PICKS.md` carries a `Mobile:`
line, written by this skill after the section is built:

```
Mobile: NOT RUN | <date> — pass | <date> — FAIL(<n> blockers, <n> majors) — see MOBILE.md
```

`NOT RUN` is the default and is never overwritten by anything except a real
probe run. A phase is not shippable while its `Mobile:` line reads `NOT RUN`
or `FAIL(...)` with any blocker.
