# No-AI-Slop: Existing App Retrofit Workflow

For an already-built app/website — working code, real git history, existing components.
Goal: remove generic/bloated patterns without a risky full rewrite.

Assumes: `frontend-design` plugin, `simplify`/`security-review`/`run` built-in skills,
`explorer` / `test-runner` / `code-reviewer` subagents in `~/.claude/agents/`.

## 1. Audit first, don't rewrite blind

- Send the `explorer` subagent to inventory slop hotspots: generic default classes
  (`bg-gray-100`, `text-blue-500`), unstyled `container`/`wrapper` divs, over-commented
  files, dead code, duplicate logic
- Run `code-reviewer` subagent across the repo for a bloat + bug pass, not just bugs

## 2. UI slop — reshape, don't regenerate from scratch

- `frontend-design` explicitly supports this: point at a specific component/page and
  say what's wrong — "this dashboard looks generic, make it distinctive" — triggers a
  redesign pass on existing code, not just new builds
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

1. `explorer` → audit/inventory slop
2. `frontend-design` → reshape UI, one component at a time, screenshot-verify each
3. `simplify` → clean up code structure
4. `code-reviewer` + `security-review` → catch regressions
5. `/test` → confirm nothing broke
6. `/recap` → PR description for the cleanup

## Gotchas

- Full-app one-shot rewrites are the main way this goes wrong — always scope to
  one component/page/module at a time
- Skipping the branch + per-component commit discipline turns a cleanup into an
  unreviewable diff
- An audit pass (`explorer`) before touching anything prevents redesigning parts
  of the app that were already fine

See also: [`no-ai-slop-scratch-build/`](../no-ai-slop-scratch-build/) for a
brand-new app instead of an existing one.
