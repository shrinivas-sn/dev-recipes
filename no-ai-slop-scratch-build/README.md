# No-AI-Slop: Scratch Build Workflow

For a brand-new app/website (empty repo or bare scaffold, no meaningful existing code).
Goal: ship something that doesn't read as generic AI output — visually or in the code.

Assumes: `frontend-design` plugin, `simplify`/`security-review`/`run` built-in skills,
`explorer` / `test-runner` / `code-reviewer` subagents in `~/.claude/agents/`.

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

## 3. Build

- UI work: prompt naturally ("build a landing page for X") — `frontend-design`
  auto-triggers, picks a deliberate aesthetic direction instead of templated defaults
- Backend/logic: rely on the CLAUDE.md rules from step 1 to keep it lean

## 4. Verify visually — the step most people skip

- Run the app with the `run` skill
- Open it in-browser via `claude-in-chrome`, screenshot it, actually look
- The design skill improves Claude's *choices*, it does not verify *rendered pixels*
- If it still looks generic: re-prompt with sharper direction (reference a specific
  site's vibe, name concrete mood words) rather than accepting the first pass
- Test golden path + edge cases live in the browser, not just via unit tests

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
- Vague prompts defeat `frontend-design` even though it's active — specificity is
  the actual lever, the skill just executes on it
- Don't run `simplify` before the build is functionally done — it optimizes what
  exists, running it mid-build just means redoing the pass later

See also: [`no-ai-slop-existing-app/`](../no-ai-slop-existing-app/) for retrofitting
an already-built app instead of starting fresh.
