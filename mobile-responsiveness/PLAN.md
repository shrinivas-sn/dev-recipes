# PLAN — `mobile-check` skill + `mobile-checks.yaml` registry + probe recipe

**Status:** approved design, not started.
**Written:** 2026-08-21 by Opus 5 (brainstorming, architectural path).
**Executor:** Sonnet 5. Read this file end to end before touching anything.
**Approved by user:** 4 decisions, recorded in "Decisions already made" below. Do not re-open them.

---

## 0. What this is, in one paragraph

A cross-project skill that takes any site — one being built here, or one that
already exists — drives it in a real headless browser at real phone viewports,
**measures numbers** (not impressions), scores those numbers against a registry
of non-overlapping checks, writes a report, fixes what failed in severity order,
and **re-measures to prove each fix**. It plugs into the existing
`design-pick` → `design-source` chain as the ship gate at the end.

It exists because "is it mobile responsive?" is currently answered from memory
and eyeballing, which is the same class of failure that `design-pick` and
`context-brief` were built to remove. Same fix: retrieve/measure, cite, never
assert.

---

## 1. Decisions already made (do not re-litigate)

| # | Question | Decision |
|---|---|---|
| 1 | What does the skill do? | **Audit + fix.** Reads real code, measures at real viewports, scores a checklist, then applies fixes. |
| 2 | Where does it wire in? | **Gate after build.** `design-pick` decides → `design-source` builds → `mobile-check` gates. Also runnable standalone on any existing site. `PICKS.md` gets a per-phase `Mobile:` line. |
| 3 | Where does the checklist live? | **YAML registry + derived list.** `_knowledge/mobile-checks.yaml` holds every check exactly once; the skill derives only the checks that apply to the sections this project actually has. |
| 4 | What counts as PASS evidence? | **Measured DOM numbers.** puppeteer evaluates real values per viewport. Screenshots are attached only for the few checks that need eyes, never as the pass signal. |

**One deviation from the chat sketch, deliberate:** the chat listed `orientation`
as a 12th check family. It is not a family — it is a *viewport*. Landscape does
not introduce a new failure mode; it re-triggers overflow, collision, and
fixed-bar budget. So `orientation` becomes an extra viewport that re-runs
families 1 / 6 / 7, and the freed 12th slot goes to `touch-affordance`
(hover-gated content, which is a genuinely distinct failure mode and was
otherwise unowned). Count is still 12. If the user objects, move it back — but
say why first.

---

## 2. Deliverables — exact file tree

```
E:\dev-recipes\_knowledge\mobile-checks.yaml          NEW  — the check registry (Layer 1d)
E:\dev-recipes\mobile-responsiveness\
    PLAN.md                                           this file (delete nothing; mark done at the end)
    README.md                                         NEW  — the recipe: gotchas, how to run probes by hand
    templates\probe.js                                NEW  — puppeteer driver, orchestrates all families
    templates\checks\*.js                             NEW  — one module per check family (12 files)
    templates\report-template.md                      NEW  — MOBILE.md skeleton
C:\Users\Dell\.claude\skills\mobile-check\SKILL.md     NEW  — the skill
E:\dev-recipes\_knowledge\START-HERE.md               EDIT — register file + status line
E:\dev-recipes\_claude-config\                        EDIT — mirror the new skill, then `node sync.js --check`
C:\Users\Dell\.claude\skills\design-pick\SKILL.md      EDIT — handoff section gains the Mobile gate
E:\dev-recipes\_knowledge\evals\scenarios\mobile-check\ NEW  — at least 1 scenario (see §11)
```

Per-project output (written into the target project, not into dev-recipes):

```
<project-root>\MOBILE.md                              the report + fix ledger
<project-root>\.mobile-check\                          probe output: JSON results + screenshots (gitignore it)
```

`MOBILE.md` sits at the project root next to `PICKS.md`, deliberately — same
altitude, same lifecycle, same "read this first on a new session" role.

---

## 3. The 12 check families — one failure mode, one owner

**The no-overlap rule is the whole point of this table.** Every symptom below
belongs to exactly one family. If you are about to detect the same thing in two
families, you have a bug — pick one owner and have the other reference it by id.

| # | id | Owns this failure mode, and nothing else | Severity |
|---|---|---|---|
| 1 | `overflow-x` | Page or any element extends past the viewport's right edge; horizontal scrollbar appears | blocker |
| 2 | `viewport-meta` | Pinch-zoom disabled, or layout not scaled to device width | blocker |
| 3 | `tap-targets` | Interactive element too small, or too close to its neighbour, to hit with a thumb | major |
| 4 | `text-legibility` | Body copy rendered below the readable floor, or crushed line-height | major |
| 5 | `form-input-zoom` | Focusing a field triggers iOS auto-zoom; wrong keyboard; missing autocomplete | major |
| 6 | `layout-collision` | Elements overlap, text is clipped by a fixed-height box, images distorted | blocker |
| 7 | `fixed-bar-budget` | Pinned chrome (header/footer/CTA bar) consumes too much of the screen | major |
| 8 | `dvh-safe-area` | `100vh` fights mobile browser UI; content hides under a notch or home indicator | major |
| 9 | `media-cls` | Images shift the layout on load, lack intrinsic size, or are absurdly heavy for a phone | major / minor |
| 10 | `touch-affordance` | Content reachable only on `:hover`; touch gestures broken or hijacked | major |
| 11 | `nav-drawer` | Mobile menu can't open, can't close, doesn't trap focus, or lets the page scroll behind it | blocker / major |
| 12 | `reduced-motion` | Motion keeps running when the OS asked for it to stop | major |

**Boundary rulings — memorize these, they are where overlap creeps in:**

- Font size of an `<input>` is family **5** only, never family 4.
- Font size of a paragraph is family **4** only, never family 5.
- An image wider than the screen is family **1** (overflow), not family 9.
- An image with the wrong aspect ratio is family **6**, not family 9.
- An image that shifts the page on load is family **9**, not family 6.
- A menu button too small to tap is family **3**, not family 11.
- A menu that opens but doesn't lock body scroll is family **11**, not family 1
  — even though the symptom looks like scrolling.
- A sticky header that covers the first heading is family **7** (budget) if it's
  a sizing problem, family **6** (collision) if it's a stacking problem. Rule:
  if shrinking the bar fixes it, it's 7; if only re-ordering/padding fixes it,
  it's 6.
- Animation quality/taste is **out of scope entirely** — that belongs to
  `review-animations` / `improve-animations`. Family 12 only asks whether the
  reduced-motion code path actually fires.

---

## 4. Check specs — detection, pass condition, fix

Each of these becomes one entry in `mobile-checks.yaml` and one module in
`templates/checks/`. The measurement code below is the contract; write it
literally, don't paraphrase it into something looser.

### 4.1 `overflow-x` — blocker

```js
// runs in page context
const de = document.documentElement;
const vw = de.clientWidth;
const delta = de.scrollWidth - vw;

const offenders = [...document.querySelectorAll('*')].filter(el => {
  const cs = getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  if (r.right <= vw + 1 && r.left >= -1) return false;
  // ignore elements inside a deliberate horizontal scroller
  for (let p = el.parentElement; p; p = p.parentElement) {
    const pcs = getComputedStyle(p);
    if (/(auto|scroll|hidden)/.test(pcs.overflowX)) return false;
  }
  return true;
}).map(el => ({ sel: cssPath(el), right: el.getBoundingClientRect().right, vw }));
```

- **Pass:** `delta <= 0` AND `offenders.length === 0`.
- **Report:** the delta in px, plus up to 10 offender selectors with their `right` value.
- **Fix menu (apply the one that matches, don't shotgun):**
  `max-width:100%` on media · `min-width:0` on a flex/grid child that won't shrink ·
  `overflow-wrap:anywhere` on an unbreakable token/URL · replace a fixed `px` width
  with a fluid one · `w-screen`/`100vw` → `w-full`/`100%` (100vw includes the
  scrollbar) · remove or clamp a negative margin · `position:absolute` decoration
  that should be clipped by an `overflow-hidden` parent.
- **Never fix by putting `overflow-x:hidden` on `body`.** That hides the symptom
  and permanently masks the check. If you cannot find the offender, report it
  unfixed and say so.

### 4.2 `viewport-meta` — blocker

- **Measure:** read `document.querySelector('meta[name="viewport"]')?.content`.
- **Pass:** contains `width=device-width` and `initial-scale=1`; does NOT contain
  `user-scalable=no`; `maximum-scale` absent or `>= 5`; `minimum-scale` absent or `<= 1`.
- **Also record:** whether `viewport-fit=cover` is present (family 8 consumes this).
- **Severity:** blocker — it is an accessibility violation, not a preference.
- **Fix:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

### 4.3 `tap-targets` — major

- **Selector:** `a[href], button, input:not([type=hidden]), select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [tabindex]:not([tabindex="-1"])`, visible, in-viewport.
- **Measure:** each target's `getBoundingClientRect()`, plus the centre-to-edge
  distance to its nearest other target.
- **Pass (two-tier, report both):**
  - **Floor (fail):** `min(w, h) >= 24` **or** the nearest-neighbour gap `>= 24`
    — WCAG 2.2 SC 2.5.8, AA. Below this is a real failure.
  - **Target (warn):** `w >= 44 && h >= 44` — Apple HIG. Between 24 and 44 is a
    warning, not a failure.
- **Exclusion, per SC 2.5.8:** an inline link inside a sentence of body text
  (`getComputedStyle(el).display === 'inline'` and its parent is a text block).
  Excluded targets are listed in the report as excluded, never silently dropped.
- **Fix:** padding to reach the box · `min-h-11 min-w-11` (Tailwind) ·
  increase the gap between adjacent targets · enlarge the hit area with an
  `::after` overlay when the visual must stay small.

### 4.4 `text-legibility` — major

- **Measure:** for every text-bearing leaf node with `>= 40` characters, read
  computed `font-size`, `line-height`, and the rendered line length in `ch`.
- **Pass:** `font-size >= 14px` (fail below), `>= 16px` preferred (warn at 14–15.99);
  `line-height / font-size >= 1.4` for body copy; line length reported (45–75ch
  ideal) but **reported only, never failed** — it's a taste call.
- **Explicitly excluded:** form fields (family 5), legal/footnote text with an
  explicit `<small>` or a `text-xs` class on a node under 40 chars.
- **Fix:** raise the base size at the mobile breakpoint; stop using the
  `text-xs`/`text-sm` scale for paragraphs; set `line-height` on the container.

### 4.5 `form-input-zoom` — major

- **Selector:** `input:not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea`.
- **Measure:** computed `font-size`; presence of `type`, `inputmode`, `autocomplete`;
  `<label>` association.
- **Pass:** `font-size >= 16px` at every mobile viewport (iOS zooms the page in
  on focus below this — this is the single most common mobile form bug);
  email field has `type="email"`, phone has `type="tel"`, numeric has
  `inputmode="numeric"`; every field has a non-empty `autocomplete`;
  every field has an associated label or `aria-label`.
- **Fix:** `font-size: 16px` on fields at mobile widths (do **not** fix by adding
  `maximum-scale=1` — that fails family 2).

### 4.6 `layout-collision` — blocker (A, B) / major (C)

Three measurements, one family, because they share a root cause (a box that
didn't reflow):

- **A. Occlusion.** For every text-bearing element in viewport, call
  `document.elementFromPoint(cx, cy)` at its centre. If the returned node is
  neither the element nor a descendant of it, the element is covered. Ignore
  when the covering node is a deliberate overlay (`role="dialog"`,
  `[aria-modal="true"]`, or an ancestor with `position:fixed` that is the open
  nav panel — coordinate with family 11 so an open drawer doesn't false-positive).
- **B. Clipping.** `el.scrollHeight > el.clientHeight + 1` while computed
  `overflow-y` is `hidden`, and the element contains text. That is text cut off
  by a fixed height.
- **C. Image distortion.** For each `<img>` with `naturalWidth > 0`: compare
  `naturalWidth/naturalHeight` to `clientWidth/clientHeight`. Deviation `> 5%`
  with computed `object-fit: fill` (or unset) is a fail.
- **Pass:** zero offenders in A and B; zero in C.
- **Fix:** A — fix stacking/order or add padding; B — replace fixed height with
  `min-height` or let it flow; C — `object-fit: cover` + explicit aspect ratio.

### 4.7 `fixed-bar-budget` — major

- **Measure:** every element with computed `position: fixed` or `sticky` that is
  visible at load and pinned to the top or bottom edge (`rect.top <= 0` or
  `rect.bottom >= vh`). Sum their heights.
- **Pass:** `sum <= 0.25 * vh`. Additionally: no single fixed element covers
  `> 60%` of the viewport unless it is an open overlay (`aria-modal`, `role=dialog`).
- **Note:** must also run at the landscape viewport (§5) — this check fails in
  landscape far more often than portrait, which is why landscape exists.
- **Fix:** shrink padding at mobile widths · collapse-on-scroll header ·
  make the footer bar non-fixed below a breakpoint · merge two bars into one.

### 4.8 `dvh-safe-area` — major

- **Measure (static):** grep the project's CSS/JSX for `100vh`, `h-screen`,
  `min-h-screen`, `max-h-screen`.
- **Measure (runtime):** `window.innerHeight` vs `window.visualViewport.height`;
  and whether any fixed top/bottom bar's padding includes `env(safe-area-inset-*)`.
- **Pass:** full-height sections use `dvh`/`svh`/`lvh` (or a JS `--vh` fallback),
  not bare `vh`; any fixed top bar has `padding-top: env(safe-area-inset-top)`
  and any fixed bottom bar has `padding-bottom: env(safe-area-inset-bottom)`;
  if `env(safe-area-inset-*)` is used anywhere, `viewport-fit=cover` is present
  (read from family 2's result — do not re-parse the meta tag).
- **Fix:** `min-h-[100svh]` · `height: 100dvh` · add the safe-area padding ·
  add `viewport-fit=cover`.

### 4.9 `media-cls` — major (shift) / minor (weight)

- **Measure:** a `PerformanceObserver` on `layout-shift`, summed over load + 2s
  idle (exclude `hadRecentInput`). Per `<img>`/`<video>`: presence of `width`+`height`
  attributes or a CSS `aspect-ratio`; presence of `loading="lazy"` when below the
  fold; presence of `srcset`+`sizes`; `encodedBodySize` from
  `performance.getEntriesByType('resource')`.
- **Pass:** CLS `< 0.1`; every image has intrinsic dimensions; no single image
  transfers `> 300 KB` at the 390px viewport; total image bytes `< 1.5 MB`.
- **Fix:** add `width`/`height` or `aspect-ratio` · add `srcset`/`sizes` so the
  phone doesn't download the desktop asset · lazy-load below the fold ·
  re-encode to WebP/AVIF.

### 4.10 `touch-affordance` — major

- **Measure (static):** scan for hover-gated content — `opacity-0` paired with
  `hover:opacity-100`, `hidden` paired with `group-hover:block`, `:hover` rules
  that change `display`/`visibility`/`opacity` from hidden to visible — that are
  **not** wrapped in `@media (hover: hover)`.
- **Measure (runtime):** with `hasTouch: true`, check that such content is
  reachable: if the element is still `opacity: 0` / `display: none` at a touch
  viewport, it is unreachable.
- **Also:** `touch-action` declared on any custom drag/swipe surface; tap
  highlight not removed (`-webkit-tap-highlight-color: transparent`) without a
  replacement `:active` state.
- **Pass:** no unreachable hover-gated content; no unguarded hover reveal.
- **Fix:** wrap hover reveals in `@media (hover: hover) and (pointer: fine)` and
  show the content unconditionally otherwise.

### 4.11 `nav-drawer` — blocker (can't navigate) / major (a11y details)

This is the only family that **interacts**, so it runs last in the probe order.

- **Find the toggle:** a `<button>` inside `header`/`nav` that is visible at the
  mobile viewport and hidden at `>= 1024`, preferring one with `aria-controls`
  or `aria-expanded`. If none is found **and** the full nav links are already
  visible and pass families 1/3, mark the family `n/a — no drawer pattern` (not
  a failure). If none is found and the nav links are *not* reachable, that is a
  blocker.
- **Sequence, asserting after each step:**
  1. Click toggle → panel becomes visible, `aria-expanded="true"`.
  2. `document.activeElement` is inside the panel (or moves there on Tab).
  3. `body`/`html` scroll is locked — either computed `overflow: hidden`, or
     `window.scrollY` unchanged after a programmatic scroll attempt.
  4. `Tab` cycles within the panel and does not escape to the page behind.
  5. `Escape` closes the panel; `aria-expanded="false"`; focus returns to the toggle.
  6. Re-open, click a nav link → panel closes (or navigation occurs).
- **Pass:** steps 1 and 6 are blockers; 2–5 are majors.
- **Fix:** standard disclosure pattern; body scroll lock on open; focus trap;
  Escape handler; close-on-navigate.

### 4.12 `reduced-motion` — major

- **Measure:** `page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])`,
  then reload and settle. Sample every element that had a non-`none`
  `animation-name` or a `transition-duration > 0.1s` in the *normal* pass, and
  assert it is now inert (`animation-name: none` or `animation-play-state: paused`,
  `transition-duration <= 0.01s`). Additionally, grep for a motion library
  (GSAP / Framer Motion / Motion One / Lenis) and confirm a
  `matchMedia('(prefers-reduced-motion: reduce)')` guard exists in the codebase.
- **Pass:** no infinite animation still running under `reduce`; no scroll-jacking
  / smooth-scroll hijack active under `reduce`.
- **Scope guard:** this family judges *whether the code path fires*, never
  whether the animation is good. Taste belongs to `review-animations`.
- **Fix:** `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }`
  plus a JS guard for library-driven motion. Cross-reference the existing rules
  in `E:\dev-recipes\website-animation-patterns\` — **reference them, do not
  copy them into `mobile-checks.yaml`.**

---

## 5. Viewports

Canonical set, always run:

| id | size | emulation | why |
|---|---|---|---|
| `xs` | 320 × 568 | dpr 2, touch, mobile | Smallest width still in the wild. Almost every overflow bug shows here first. |
| `sm` | 390 × 844 | dpr 3, touch, mobile | The modern phone. The one that actually matters. |
| `md` | 768 × 1024 | dpr 2, touch, mobile | Tablet portrait — the breakpoint most sites forget. |
| `land` | 844 × 390 | dpr 3, touch, mobile | Phone landscape. Runs **only** families 1, 6, 7. |

**Dynamic addition (this is the "adapts per project" part):** after detecting the
project's own breakpoints (§6.3), add one extra viewport at `breakpoint - 1px`
for every declared breakpoint below 1024 that isn't already covered by the set
above. A project with a custom `xs: 480` breakpoint gets a `479 × 800` run.
Cap the total at 6 viewports; if there are more, keep the canonical 4 plus the
two lowest custom ones and say in the report which were dropped.

Emulation settings for every viewport:
`{ isMobile: true, hasTouch: true, deviceScaleFactor: <per table> }` and a
mobile UA string. `isMobile: true` matters — without it, `@media (hover: hover)`
resolves the desktop way and family 10 silently passes.

---

## 6. Skill phases

The skill is `~/.claude/skills/mobile-check/SKILL.md`. Six phases, in order.
Phase boundaries are stop points: never merge two phases into one action.

### Phase 0 — Detect

Produce a **Run profile** and print it before doing anything else. Never guess
a value; if one can't be determined, ask.

1. **Stack.** Read `package.json`. Identify framework (Vite / Next / Astro / CRA /
   SvelteKit / plain static) from deps + config files.
2. **Serve URL.** In order:
   a. If a dev server is already listening, use it (probe the port, don't assume).
   b. Else read the `dev`/`start` script, run it **in the background**, wait for
      the port to accept a connection, and record that you started it so Phase 5
      can shut it down.
   c. Else if there's a build output dir or a bare `index.html`, serve it statically.
   d. Else **ask the user for the URL.** Do not proceed on a guessed port.
3. **Breakpoints.** Read `tailwind.config.{js,ts,cjs,mjs}` → `theme.screens`; or
   Tailwind v4 `@theme { --breakpoint-* }` in the CSS entry; or collect distinct
   `@media (min-width|max-width: …)` values from the project CSS. Record them.
4. **Routes / sections.** Enumerate routes from the router config, or — for a
   one-page site — the `<section id>` / landmark elements on the rendered page.
   Cap at 8 URLs per run; if there are more, ask which matter.
5. **Browser.** Prefer `puppeteer-core` against the installed Chrome/Edge (see
   §7). `claude-in-chrome` is acceptable when connected and the user prefers it,
   but the JSON result shape must be identical either way.
6. **Write** the run profile into `MOBILE.md` under `## Run profile`.

### Phase 1 — Derive

Filter `mobile-checks.yaml` down to the checks that actually apply. Each entry
carries an `applies_when` predicate; evaluate it against the detected project.

| Family | Runs only when |
|---|---|
| 1, 2, 4, 6, 7 | always |
| 3 | page has any interactive element (effectively always) |
| 5 | project contains a `<form>` or any text input |
| 8 | project uses `100vh`/`h-screen`, or has a fixed/sticky edge bar |
| 9 | project renders `<img>` or `<video>` |
| 10 | project has any `:hover`/`hover:` rule that changes visibility |
| 11 | page has a nav landmark |
| 12 | project has CSS animations/transitions or a motion library |

Print the derived list with a one-line reason per **excluded** family. An
excluded family is stated, never silently dropped — a missing check and a
passed check must not look the same. (Same rule as `design-pick`'s
`NO CONSTRAINTS SOURCE`.)

### Phase 2 — Probe

Run `templates/probe.js` once per (viewport × route). Order within a viewport:
static/read-only families first (1–10, 12), interactive family 11 last, because
opening a drawer mutates the page.

Output per run: a JSON blob into `.mobile-check/results-<route>-<viewport>.json`
containing, per family, `{ status: pass|warn|fail|n/a, measured: {...}, offenders: [...] }`.
Screenshots go to `.mobile-check/<route>-<viewport>.png` and are attached to the
report **only** for families 6, 7, and 11 — the ones where a picture adds
information a number doesn't.

Reliability requirements — these are not optional:

- `waitUntil: 'networkidle0'` **plus** an explicit settle delay (`~800ms`) so
  entrance animations finish. A measurement taken mid-animation is noise.
- Wait for `document.fonts.ready` before measuring anything in family 4 —
  font swap changes computed sizes.
- Take every measurement twice with a 300ms gap; if the two disagree, mark the
  family `unstable` and report it rather than picking one. A flaky number
  reported as fact is worse than no number.

### Phase 3 — Report

Write `MOBILE.md` from `templates/report-template.md`.

```markdown
# MOBILE.md — <project name>
Run: <date> · profile: <framework>, <n> routes, <n> viewports
Browser: puppeteer-core <version> against <chrome path>

## Run profile
<from Phase 0>

## Derived checks
Included: <ids>
Excluded: <id> — <reason>   (one line each)

## Score
Blockers: <n>   Majors: <n>   Minors: <n>   Warnings: <n>   Unstable: <n>

| Family | xs 320 | sm 390 | md 768 | land | Worst measured value |
|---|---|---|---|---|---|
| overflow-x | FAIL | FAIL | pass | FAIL | +47px at `.hero__img` (390) |
...

## Findings
### [BLOCKER] overflow-x @ xs, sm, land
Measured: documentElement.scrollWidth 437 vs clientWidth 390 (+47px)
Offenders: `.hero__img` right=437 · `.stats > div:nth-child(3)` right=402
Cause: <one line, from reading the actual source>
Fix: <the specific edit, with file:line>
Status: not-fixed | fixed (re-probed <date>: 390 vs 390, delta 0)
...

## Fix ledger
| # | Family | File:line | Before | After | Re-probed |
|---|---|---|---|---|---|
```

Rules for the report:
- **Every row cites a measured number.** A finding with no number is not a
  finding — delete it or go measure it.
- Findings are ordered blocker → major → minor, then by how many viewports
  they affect.
- If a family passed, say so in the score table. A report that only ever finds
  problems is noise, and the honesty rules in `START-HERE.md` apply here.

### Phase 4 — Fix

- Work **one family at a time**, strictly blocker → major → minor.
- Only edit the offenders the probe named. Do not opportunistically refactor.
- **Re-probe that family after fixing it, before moving to the next.** Write the
  before/after numbers into the fix ledger. A fix without a re-probe delta is
  not a fix; it is a claim.
- Re-run the **full** probe once at the end — fixes interact, and a family-1 fix
  routinely breaks family 6.
- **Stop and ask** when the fix requires a design decision rather than a
  responsive one: changing the nav pattern, dropping a section on mobile,
  re-cropping a hero, choosing a different image. Those are `design-pick`
  territory, not this skill's.
- **Never** fix by suppressing the measurement: no `overflow-x: hidden` on body,
  no `maximum-scale=1`, no removing the element the check flagged, no
  `!important` to win a specificity fight you didn't diagnose.

### Phase 5 — Gate

1. If `PICKS.md` exists, append a `Mobile:` line to each phase whose section was
   covered by this run:
   `Mobile: <date> — pass | FAIL(<n> blockers, <n> majors) — see MOBILE.md`
2. If the project has `DOCS/README.md` starting with `<!-- docs-structure: v1 -->`,
   update `DOCS/STATUS.md` current-state + pending accordingly.
3. Shut down the dev server if Phase 0 started it.
4. State the outcome plainly, including what could not be checked and why.

---

## 7. Probe implementation notes

Reuse `E:\dev-recipes\headless-screenshot-fallback\` — it already documents the
traps. Do not re-derive them:

- Use `puppeteer-core` against the **already-installed** Chrome/Edge. Do not
  download Chromium. Find it with
  `ls "/c/Program Files/Google/Chrome/Application/chrome.exe"` /
  `ls "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"`.
- `npm install --no-save puppeteer-core` inside the project — `--no-save` so a
  throwaway verification dep doesn't leak into `package.json`.
- If the script lives outside the project, set
  `NODE_PATH="<project>/node_modules"` or Node won't resolve `puppeteer-core`.
- Plain `chrome --headless --screenshot` **cannot scroll** and a taller
  `--window-size` does not reveal more of a `min-h-screen` page. It is the last
  resort only, and if used, the report must say the run was single-viewport and
  unscrolled rather than presenting it as a full verification.
- `page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])`
  is how family 12 is tested — this is already documented in that recipe.

`probe.js` structure:

```
probe.js <baseUrl> <outDir> [--routes a,b,c] [--viewports xs,sm,md,land] [--only family-id]
  → launches once, reuses the browser across viewports
  → per viewport: newPage, emulate, goto, settle, run each check module
  → each check module exports { id, appliesWhen(profile), async run(page, ctx) }
  → writes results-<route>-<viewport>.json
  → exit code 0 always; the skill reads the JSON, the exit code means nothing
```

Keep every check module under ~120 lines and independently runnable via
`--only <id>` — that's what makes Phase 4's per-family re-probe cheap.

---

## 8. `mobile-checks.yaml` schema

Match the house style of `design-picks.yaml` / `design-sources.yaml`: a header
comment stating what question this file answers and what it must never do, a
`conventions:` block defining every vocabulary exactly once, then the entries.

```yaml
# _knowledge/mobile-checks.yaml — mobile responsiveness check registry (Layer 1d)
#
# sources.yaml        → "what is this library's API?"
# design-sources.yaml → "what does real component CODE look like?"
# design-picks.yaml   → "where does the USER go to pick a real design?"
# THIS FILE           → "what does 'mobile responsive' concretely mean, and how
#                        is each part of it measured rather than eyeballed?"
#
# Hard rules this file exists to enforce:
#   1. One failure mode has exactly one owning check. No duplicate detection.
#   2. Every check carries a machine-evaluable pass condition. A check whose
#      pass condition is a judgement call does not belong here.
#   3. This file is GENERIC — no project, no client, no framework assumptions
#      beyond what `applies_when` can test.

version: 1
updated: <date>

conventions:
  severity:
    blocker: "Site is unusable or inaccessible on a phone. Fix before anything else."
    major:   "Real degradation a user will hit. Fix before ship."
    minor:   "Worth fixing, does not block ship."
    warn:    "Below the preferred bar but above the failing floor. Reported, never failed."
  status:
    pass: "Measured, within the pass condition."
    fail: "Measured, outside the pass condition."
    warn: "Measured, between the floor and the target."
    n/a:  "Check did not apply to this project. Reason is always stated."
    unstable: "Two measurements disagreed. Reported as unknown, never as pass."

viewports:
  - { id: xs,   w: 320, h: 568, dpr: 2, touch: true }
  - { id: sm,   w: 390, h: 844, dpr: 3, touch: true }
  - { id: md,   w: 768, h: 1024, dpr: 2, touch: true }
  - { id: land, w: 844, h: 390, dpr: 3, touch: true, families: [overflow-x, layout-collision, fixed-bar-budget] }

checks:
  - id: overflow-x
    name: Horizontal overflow
    owns: "Page or element extends past the viewport's right edge."
    not_owns: ["oversized image aspect ratio (layout-collision)", "body scroll behind an open drawer (nav-drawer)"]
    severity: blocker
    applies_when: always
    viewports: [xs, sm, md, land]
    measure: "documentElement.scrollWidth - clientWidth; plus per-element getBoundingClientRect().right > vw+1, excluding descendants of an overflow-x scroller"
    pass: "delta <= 0 and offenders empty"
    report: "delta in px, up to 10 offender selectors with their right value"
    fixes:
      - "max-width:100% on media"
      - "min-width:0 on a non-shrinking flex/grid child"
      - "overflow-wrap:anywhere on an unbreakable token"
      - "replace fixed px width with fluid"
      - "100vw -> 100% (100vw includes the scrollbar)"
      - "clamp or remove a negative margin"
    forbidden_fixes:
      - "overflow-x:hidden on body or html — masks the symptom and permanently disables this check"
  # ... 11 more, same shape
```

Every one of the 12 families from §4 gets an entry in exactly this shape.
`not_owns` is mandatory and is what mechanically enforces the no-overlap rule —
if two checks claim the same symptom, one of them has a wrong `owns` line.

---

## 9. Wiring into `design-pick`

Edit `~/.claude/skills/design-pick/SKILL.md`, **Handoff** section only. Minimal
edit — do not restructure that skill.

Add:

> Every design-heavy phase carries a `Mobile:` line in `PICKS.md`, written by the
> `mobile-check` skill after the section is built:
>
> ```
> Mobile: NOT RUN | <date> — pass | <date> — FAIL(<n> blockers, <n> majors) — see MOBILE.md
> ```
>
> `NOT RUN` is the default and is never overwritten by anything except a real
> probe run. A phase is not shippable while its `Mobile:` line reads `NOT RUN`
> or `FAIL(...)` with any blocker.

And add to that skill's `PICKS.md` template block a `Mobile: NOT RUN` line
directly under `Fit-check:`.

Rationale to preserve in the edit: this mirrors `Fit-check:` exactly — a check
that was never run must not be indistinguishable from one that passed. Do not
invent a second shape for it.

Also add one row to `design-pick`'s "Rationalizations to reject" table:

| "The section looks fine in the browser at desktop width, mobile's probably fine" | `Mobile:` is written from a measured probe or it stays `NOT RUN`. An impression is not a measurement. |

---

## 10. Registration chores (easy to forget — none are optional)

1. **`_knowledge/START-HERE.md`**
   - Add to the `## Files` tree: `_knowledge/mobile-checks.yaml   mobile responsiveness checks -> /mobile-check`
   - Add to `## The loop, in practice`: one line — *Shipping a built section → `/mobile-check`: detect → derive → probe at real viewports → report measured numbers → fix in severity order → re-probe → gate `PICKS.md`.*
   - Update `## Status`, Layer 1b or a new Layer 1d line. **Recount before quoting any number** — that file records having been wrong about counts before.
2. **`_claude-config/`** — mirror the new `mobile-check/SKILL.md`, add it to
   `sync.js`'s tracked list, then run `node sync.js --check` and paste the output.
3. **`_standard/README.md`** — audit the new skill against the Layer 2 checklist
   and record the result, same as the other 7 skills.
4. **`C:\Users\Dell\.claude\CLAUDE.md`** — add `mobile-check` to the custom
   skills list, and add a row to the job table:
   `| Mobile responsiveness | /mobile-check | — |`
5. **`E:\dev-recipes\mobile-responsiveness\README.md`** — the recipe itself:
   how to run `probe.js` by hand, the puppeteer gotchas, and a link back to
   `headless-screenshot-fallback`.
6. Add `.mobile-check/` to the target project's `.gitignore` on first run.

---

## 11. Acceptance criteria

The work is done when all of these are true and **demonstrated**, not asserted:

1. `node templates/probe.js <url> <out>` runs clean against a real local site and
   emits one JSON per viewport with all 12 families represented.
2. Running the skill on `E:\bs-bhavi-site\prototype` produces a `MOBILE.md` where
   **every** finding cites a measured number and every excluded family states
   its reason.
3. At least one real blocker is found, fixed, and the fix ledger shows a
   before/after re-probe delta proving it.
4. `PICKS.md` gains `Mobile:` lines; no line reads `pass` without a probe run
   behind it.
5. `node _claude-config/sync.js --check` passes.
6. At least one eval scenario exists under
   `_knowledge/evals/scenarios/mobile-check/` — read `evals/README.md` first;
   it documents two known design gaps (no baseline arm; `skill_fired` only
   gradable under `--auto-trigger`). The first scenario should be the
   **suppression trap**: a fixture whose overflow can be "fixed" with
   `overflow-x: hidden` on body. A run that takes that shortcut fails the
   scenario.
7. The skill has been run once on a *second*, unrelated project to prove it
   isn't secretly bs-bhavi-shaped.

---

## 12. Rationalizations to reject

| Excuse | Reality |
|---|---|
| "The screenshot looks fine, mark it pass" | Screenshots are attachments, never the pass signal. Decision 4 was explicit: measured numbers. |
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

---

## 13. Red flags — stop

- About to write `pass` for a family with no number next to it.
- About to write a `Mobile:` line in `PICKS.md` without a probe behind it.
- About to add a check to `mobile-checks.yaml` whose pass condition is a
  judgement call.
- About to detect one symptom in two families.
- About to edit a file the probe did not name as an offender.
- About to claim a fix without a re-probe delta in the ledger.
- About to present a `chrome --headless` single-shot as a full verification.
- About to skip §10 because "the skill works" — an unregistered skill is one
  that the next session won't find.

---

## 14. Order of work for the executor

1. `mobile-checks.yaml` — all 12 entries, full schema. Nothing else until this
   is complete; everything downstream reads it.
2. `templates/checks/*.js` — 12 modules, each independently runnable.
3. `templates/probe.js` — the driver.
4. Prove steps 2–3 against `E:\bs-bhavi-site\prototype` before writing the skill.
5. `templates/report-template.md`.
6. `~/.claude/skills/mobile-check/SKILL.md` — the 6 phases, the honesty rules,
   the rationalization table (§12) and red flags (§13) carried in verbatim.
7. `README.md` for the recipe.
8. The `design-pick` edit (§9).
9. Registration chores (§10).
10. Eval scenario (§11.6).
11. Full run on bs-bhavi + one unrelated project; report the acceptance
    criteria results honestly, including anything that failed.
