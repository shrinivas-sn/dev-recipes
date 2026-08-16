# No-AI-Slop: Scratch Build Workflow

For a brand-new app/website (empty repo or bare scaffold, no meaningful existing code).
Goal: ship something that doesn't read as generic AI output — visually or in the code.

Assumes: `/design-source` + `/context-brief` skills (the retrieval layer — see
`../_knowledge/START-HERE.md`), `frontend-design` plugin, `simplify`/`security-review`/`run`
built-in skills, `explorer` / `test-runner` / `code-reviewer` subagents in `~/.claude/agents/`.

## 1. Setup (once per project)

- Write a tight project `CLAUDE.md` (not global) with explicit anti-slop rules:
  - No comments/docstrings unless asked
  - No defensive code (try/catch, validation) for cases that can't happen
  - No premature abstraction — 3 similar lines beats a one-use helper
  - Delete dead code fully, no `// removed` markers or commented-out blocks
- Add `.claudeignore` (`node_modules/, dist/, build/, *.lock`)

## 2. Plan before building

- Use Plan Mode (`/plan`) for anything multi-file — research first, approve the plan, then code
- In the prompt, give **specific creative context**, not a vague ask: purpose of the
  app, target audience, mood/vibe, dark or light mode, any existing brand colors/fonts.
  Vague prompts → generic Tailwind-gray output even with the design skill active.
- Classify each planned data entity (user-owned/mutable, system-generated/immutable, or
  ambiguous) per `~/.claude/skills/no-ai-slop/references/checklist.md`'s "Entity mutability
  classification" — decide which entities get edit/delete before building them, and ask
  about ambiguous ones now rather than discovering the gap at verification

## 3. Build

- UI work: **`/design-source` first** — retrieve real component source from a registry
  (shadcn / React Bits / Magic UI / Aceternity) and adapt it. Generating a hero or card
  grid from the prompt samples the median landing page of the training data; that is what
  reads as AI-made. `frontend-design` still sets aesthetic direction — it decides *how it
  should look*, `/design-source` supplies *working code that isn't average*.
- Backend/logic: rely on the CLAUDE.md rules from step 1 to keep it lean

## 4. Verify visually — the step most people skip

- Run the app with the `run` skill
- Open it in-browser via `claude-in-chrome`, screenshot it, actually look
- The design skill improves Claude's *choices*, it does not verify *rendered pixels*
- Score each page against `~/.claude/skills/no-ai-slop/references/checklist.md`'s 8
  categories (visual design, copy, code structure, UX/layout, information architecture &
  component system, entity actions & lifecycle, interaction completeness & feedback,
  accessibility) before calling it done — one page at a time, not the whole app in one pass
- If it still looks generic: **retrieve, don't re-prompt.** Run `/design-source` and
  replace the offending section with adapted registry source. Sharper prompting only
  selects a different average — it cannot get you off the average.
- Test golden path + edge cases live in the browser, not just via unit tests
- **Stop here and report.** Present the full scorecard — every page scored, every Fail/Warn
  with a one-line reason, plus any entity classified **ambiguous** in step 2 that's still
  unresolved, listed as an explicit question — as one consolidated message. Do not start
  step 5 until the user has seen it and says go. This is mandatory even in auto-accept
  permission mode.

## 5. Quality pass (in this order)

1. `simplify` skill — strips dead code, redundant abstractions, over-engineering
2. `code-reviewer` subagent — independent bug/security/readability pass
3. `security-review` skill — OWASP-level check
4. `/myreview` — final human-style review pass

## 6. Tests + ship

- `/test` — write/run tests, fix failures one at a time with approval
- `/recap` — turn the diff into a PR description

## 7. Close the loop

- `/save-check` — decide if anything learned this build belongs back in dev-recipes
  or in Claude memory

## Gotchas

- Skipping step 4 (visual verification) is the #1 reason code passes review but
  still "feels AI-made" — slop is often visual, not just structural
- Specificity helps `frontend-design` pick a direction, but it is not the lever for
  slop — retrieval is. A perfectly specific prompt still generates. Reach for
  `/design-source` before reaching for better adjectives.
- Don't run `simplify` before the build is functionally done — it optimizes what
  exists, running it mid-build just means redoing the pass later

See also: [`no-ai-slop-existing-app/`](../no-ai-slop-existing-app/) for retrofitting
an already-built app instead of starting fresh.
