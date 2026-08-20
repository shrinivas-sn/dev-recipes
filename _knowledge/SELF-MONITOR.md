# SELF-MONITOR — gate failures waiting to become skill edits

The gap this file fixes is the **promotion path, not the logging.** Five pipeline
recommendations from a failed build already existed, already correct, sitting in a project
folder — and stayed unread until a human hand-carried them into a new context document.
Nothing routed a recorded lesson to a skill edit. This file is that route.

Distinct from `LESSONS.md`, which is for post-mortems a human reads on demand. This one is a
**work queue**: every entry under `## Unreviewed` is an edit that has not been made yet.

## What is entry-worthy

Narrow, deliberately: **a named gate was missing, or fired wrong.**

Not entry-worthy: general friction, a fetch that 404'd or got bot-blocked (that belongs in the
relevant registry's `dropped:` or `known_issues:` list, with the probe date), a preference, a
one-off mistake with no rule behind it.

Write an entry the moment you notice, in-session. There is no approval gate on writing —
appending to `## Unreviewed` is free and reversible.

## Entry format

```markdown
### <YYYY-MM-DD> · <skill> · gate-missing | gate-misfired
Project: <name>
What happened: <one line>
Gate that should have fired: <name, or "none exists">
Proposed rule change: <the specific edit, in the specific file>
Cost if unfixed: <how it was caught, or that it wasn't>
```

## The human gate

Moving an entry from `## Unreviewed` to `## Promoted` **is** the gate — there is no separate
approval step. Move it only after the skill is *actually edited*. Preserve the original text
verbatim and append a pointer to the shipped rule; a rewritten entry loses the evidence that
justified the edit.

A growing `## Unreviewed` section is itself the signal that this file is being written to and
not read. That is the intended failure indicator.

---

## Unreviewed

_(empty — both seed entries below were promoted by the change that created this file)_

## Promoted

### 2026-08-19 · design-pick · gate-missing
Project: wholesale-rice-mock
What happened: A palette and display face were picked from real fetched sources, recorded as
binding, and used to build — reproducing the exact "cream + serif + terracotta" combination the
project's own constraints document listed as an AI-slop default to avoid.
Gate that should have fired: none exists — the skill checks provenance (did this come from a
real fetch?) and has no concept of fit (does this match what the project said it must be?).
Proposed rule change: add a `Fit-check:` step and a `Binding: provisional | binding` field to
the `PICKS.md` contract in `design-pick/SKILL.md`; make the check a semantic read, not a string
match; make `design-source` refuse to build from a `provisional` pick.
Cost if unfixed: not caught by any automated step — a human noticed by reading the constraints
document and `PICKS.md` side by side, after the build had shipped.

**Promoted 2026-08-20.** Shipped as the `Fit-check:` / `Binding:` contract in
`design-pick/SKILL.md` and the three-row precedence table in `design-source/SKILL.md`. Full
post-mortem: `LESSONS.md`, "Provenance is not fit".

### 2026-08-20 · design-pick · gate-missing
Project: dev-recipes (this repo)
What happened: `design-pick` was hand-written into `~/.claude/skills/` and never added to
`_claude-config/sync.js`'s tracked list, so it had no backup at all. Seven skills were mirrored;
this was the eighth and was silently absent.
Gate that should have fired: `sync.js`'s refuse-on-missing guard — but that guard only fires for
names already *in* the tracked list. A skill never added is invisible to it.
Proposed rule change: add `design-pick` to the tracked list in `_claude-config/sync.js`. The
residual gap — nothing detects a hand-written skill that was never registered — is noted here
rather than fixed, because the fix (diffing the live directory against the tracked list) would
also flag every vendor-installed skill as missing.
Cost if unfixed: total loss of a hand-written skill on any disk failure or bad `npx skills` run.
Found by reading `sync.js` while designing an unrelated change, not by any check.

**Promoted 2026-08-20.** `design-pick` and `prd-intake` added to the tracked list in
`_claude-config/sync.js`.
