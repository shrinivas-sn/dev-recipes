---
name: no-ai-slop
description: Use when the user asks to build a new app/website, to clean up, redesign, "kill the AI slop" from, or de-genericize an already-built app/website, or specifically to remove/reduce/trim excessive or bloated padding, margin, gap, or whitespace on a page or section. Detects whether the current project is a fresh scratch build or an existing app and follows the matching workflow.
---

## Fast path — padding/spacing-only requests

If the ask is narrowly about padding/margin/gap/whitespace on a specific section (e.g. "remove
the padding," "this gap feels bloated") rather than a general cleanup/redesign, skip Steps 1-4
below — the full audit-then-report pipeline is overkill for a single spacing tweak. Instead:

1. **Ask which section/page** if not already named — never guess the target.
2. **Read the actual current values** for that section (the real Tailwind classes/computed
   px, not a remembered or guessed number).
3. **Compare against the same spacing token used elsewhere in the codebase** (grep for the
   same utility, e.g. `px-6`, across other sections/components) — spacing that matches an
   established sitewide pattern is a deliberate system, not slop; only flag it if it's
   genuinely inconsistent or unusually large next to its own siblings.
4. **State the actual numbers and a one-line verdict** (bloated vs. consistent-with-sitewide)
   before touching anything — this is the Category 1 tell below, applied to one section instead
   of a full-page audit.
5. Apply the trim only once the user confirms or has already told you to proceed.

## Step 1 — Detect scratch vs existing

Check the current project before doing anything:
- Empty directory, bare scaffold only, no meaningful `git log`, no real components/pages yet → **scratch build**
- Existing `src`/components, substantial `git log`, a working app → **existing app**

If ambiguous, state which one you detected and why in one line before proceeding — don't ask the user to specify unless truly unclear.

## Step 2 — Follow the matching recipe

- Scratch build: read and follow `E:\dev-recipes\no-ai-slop-scratch-build\README.md`
- Existing app: read and follow `E:\dev-recipes\no-ai-slop-existing-app\README.md`

Read the file in full before acting — it has the exact step order (plan/audit → build/reshape → verify visually via `claude-in-chrome` → `simplify` → `code-reviewer`/`security-review` → test → ship).

Also read `references/checklist.md` in this skill folder — a researched, categorized (visual
design / copy / code structure / UX-layout / information architecture & component system /
entity actions & lifecycle / interaction completeness & feedback / accessibility), scorable
checklist. Use it at the audit and visual-verification steps to score one page/component at a
time, instead of an unstructured "look at it." Category 6 requires classifying each entity
type (mutable/immutable/ambiguous) first — see the checklist's "Entity mutability
classification" section.

Category 2 (Copy) here stays deliberately narrow — UI microcopy tells only. For deep prose
editing (blog posts, marketing copy, docs, long-form content) beyond that narrow list, use the
sibling `no-ai-slop-writing` skill instead — it's a different skill for a different scope, not
a replacement for this one.

## Step 3 — Never skip visual verification

Regardless of path, the single most common failure is skipping the in-browser visual check after UI changes. Code review passing is not the same as the app not looking AI-generated. Always render and look before calling it done.

## Step 4 — Report before fixing

Once the audit (existing app) or the visual-verification pass (scratch build) has scored
everything in scope against `references/checklist.md`, stop and present ONE consolidated
report: every page/component, its score per category (Pass/Warn/Fail/Not-Applicable), and a
one-line reason for each Fail/Warn. This report is mandatory and independent of permission
mode — even in auto-accept mode, do not move from audit/verification into reshaping, cleanup,
or rebuilding until the user has seen the full scorecard and given explicit go-ahead. Never
walk straight from "I found slop" into fixing it unannounced.

Category 8 (Accessibility) is the one exception: report its score for awareness, but it never
gates the go-ahead the way Categories 1-7 do — don't wait on it or treat a Category 8 Fail as
a blocker unless the user has explicitly asked for accessibility to be prioritized on this
project.

Any entity classified **ambiguous** under Category 6 is not scored — list it separately in
the same report as an explicit question (e.g. "This card represents X — should it have
edit/delete? Unclear from the brief"). The user answers those alongside giving go-ahead on
the rest of the scorecard, in one round-trip, not a separate interruption per entity.

## Runtime behavior (permission-dependent)

- Default permission mode: audit (explorer/code-reviewer) runs straight
  through since it's read-only. Any real edit (frontend-design reshaping a
  component, simplify cleaning code) pauses for approval before writing.
- Auto-accept mode: edits run without per-step prompts, but the workflow
  still checkpoints itself — one component/file at a time, committed
  separately — so a reviewable diff exists either way.
- Never a single uninterrupted sweep across the whole app regardless of
  mode — audit first, then incremental, one piece at a time.

## Maintaining the checklist

`references/checklist.md` isn't static. When a real audit surfaces a slop pattern not on the
list, or a false positive, log it in `references/changelog.md`. Periodically fold recurring
patterns back into the checklist.
