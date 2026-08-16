# No-AI-Slop: Existing App Retrofit Workflow

For an already-built app/website — working code, real git history, existing components.
Goal: remove generic/bloated patterns without a risky full rewrite.

Assumes: `/design-source` + `/context-brief` skills (the retrieval layer — see
`../_knowledge/START-HERE.md`), `frontend-design` plugin, `simplify`/`security-review`/`run`
built-in skills, `explorer` / `test-runner` / `code-reviewer` subagents in `~/.claude/agents/`.

## 1. Audit first, don't rewrite blind

- Run the tiered scan in `../_knowledge/slop-signatures.md` (via `/design-source` step 2)
  for the UI half — it separates defects (Tier B: `transition-all`, missing
  `prefers-reduced-motion`, `hover:` without `focus-visible:`) from generated tells
  (Tier A) from mere smells (Tier C). Report counts with `file:line`, and say so plainly
  if the code is mostly clean — inventing slop to justify a rewrite is worse than the slop.
- Send the `explorer` subagent for the non-UI half: over-commented files, dead code,
  duplicate logic, one-use abstractions
- Classify each data entity type found in the code (user-owned/mutable,
  system-generated/immutable, or ambiguous) per
  `~/.claude/skills/no-ai-slop/references/checklist.md`'s "Entity mutability classification" —
  needed before Category 6 can be scored
- Score each component/page against the checklist's 8 categories (visual design, copy, code
  structure, UX/layout, information architecture & component system, entity actions &
  lifecycle, interaction completeness & feedback, accessibility) — one at a time — so the
  audit output is a categorized per-page scorecard, not free-form notes
- **Categories 1 (Visual Design) and 4 (UX/Layout) cannot be scored from source code alone.**
  Render the page and screenshot it via `claude-in-chrome` *before* scoring these two —
  Tailwind class names read as reasonable in isolation but hide templated patterns (eyebrow
  labels, badge rows, stagger-fade motion) that only show up once rendered. This applies at
  audit time, not just during the Step 2 reshape's before/after comparison. If no browser tool
  is available this session, score 1 and 4 as tentative from source and say so explicitly in
  the report — don't present them with the same confidence as a rendered check.
- Run `code-reviewer` subagent across the repo for a bloat + bug pass, not just bugs
- **Stop here and report.** Present the full scorecard — every component/page scored, every
  Fail/Warn with a one-line reason, plus any entity classified **ambiguous** listed as an
  explicit question rather than scored — as one consolidated message. Do not start step 2
  until the user has seen it, answered any open questions, and says go. This is mandatory
  even in auto-accept permission mode.

## 2. UI slop — reshape, don't regenerate from scratch

- **`/design-source` is the reshape tool.** "Make it distinctive" is a prompt, and a
  prompt cannot escape the average — retrieve a registry component and adapt it to the
  project's real stack (JSX/TSX, Tailwind major from the lockfile, palette remaps,
  `cn()`, reduced-motion). `frontend-design` still chooses the direction.
- Go component-by-component, not a full-app rewrite in one shot — smaller diffs,
  lower regression risk
- Screenshot before (via `claude-in-chrome`), redesign, screenshot after — compare
  directly instead of trusting it "should" look better

## 3. Code slop — `simplify` skill is built for exactly this

- Run it against already-written code to strip dead abstractions, redundant
  comments, unnecessary defensive code
- This is the intended use case — cleanup on existing code, not mid-build

## 4. Safety net since this is live/working code

- Work on a branch, not main
- Commit before each redesign pass so you can diff/revert per component
- Run `/myreview` + `security-review` after edits — existing-code changes carry
  real regression risk that greenfield doesn't

## 5. Order for an existing app

1. `slop-signatures.md` scan (UI) + `explorer` (non-UI) → inventory, score against the checklist
2. **Report the full scorecard, wait for go-ahead** — do not proceed until approved
3. `/design-source` → retrieve + adapt, one component at a time, screenshot-verify each
4. `simplify` → clean up code structure
5. `code-reviewer` + `security-review` → catch regressions
6. `/test` → confirm nothing broke
7. `/recap` → PR description for the cleanup

## Gotchas

- Full-app one-shot rewrites are the main way this goes wrong — always scope to
  one component/page/module at a time
- Skipping the branch + per-component commit discipline turns a cleanup into an
  unreviewable diff
- An audit pass (signature scan + `explorer`) before touching anything prevents
  redesigning parts of the app that were already fine

See also: [`no-ai-slop-scratch-build/`](../no-ai-slop-scratch-build/) for a
brand-new app instead of an existing one.
