# Production-Grade Bug Review System

Two subagents (`prod-bug-auditor`, `prod-site-auditor`) plus a shared skill
(`production-readiness`) that run a one-shot, precision-focused production-readiness audit —
either against files/a diff, or against a live URL. Produces an 8-dimension readiness scorecard
and a small number of high-confidence bug findings, never a flood of maybes.

This is a workflow recipe, not copy-in app code — there's no `templates/` here. What you're
porting is global Claude Code config (`~/.claude/agents/`, `~/.claude/skills/`).

## What it is

```
prod-bug-auditor (files/diff)   prod-site-auditor (live URL)
            \                          /
             Step 0: both read production-readiness/SKILL.md
                      + references/rubric.md + references/scan-verify.md
                            |
                  scan (8 bug categories) -> verify (falsify each candidate)
                            |
                  score (8 rubric dimensions, Pass/Warn/Fail/Not-Observable)
                            |
                  ONE combined report: scorecard prose + ReportFindings
```

Both agents self-load the shared methodology via absolute-path `Read` at Step 0 — the rubric
and bug taxonomy live in exactly one place, not forked per agent.

## When to use vs. what

| Ask | Use |
|---|---|
| "production readiness audit", "ship readiness check", "prod readiness" | `prod-bug-auditor` (static) or `prod-site-auditor` (live URL) |
| Routine review of a diff/PR | `code-reviewer` subagent or `/myreview` |
| Security-specific pass | `security-review` skill |

Don't reach for the audit agents on everyday review — they're deliberately heavier and slower,
and scoped to production-readiness signal only (no style/lint findings by design).

## Setup checklist (porting to a new machine/profile)

1. Copy `~/.claude/agents/prod-bug-auditor.md` and `~/.claude/agents/prod-site-auditor.md`
   verbatim.
2. Copy `~/.claude/skills/production-readiness/` (SKILL.md + `references/rubric.md` +
   `references/scan-verify.md` + `references/changelog.md`) verbatim.
3. No other wiring needed — both agents load the skill by absolute path, not through the Skill
   tool's auto-discovery.

## The 8 rubric dimensions

Security, Error Handling & Resilience, Observability, Test Coverage & CI, Scalability /
Performance, Deployment Hygiene, Data Integrity, Docs / Operability. Each scored Pass / Warn /
Fail / Not-Observable with a one-line justification. Full Pass/Warn/Fail anchors:
`~/.claude/skills/production-readiness/references/rubric.md`.

## The 8 scan categories

Race conditions / shared mutable state, unhandled exceptions on hot paths, resource leaks,
auth/authz gaps, injection vectors, silently swallowed errors, boundary errors in critical code,
hardcoded secrets. Every candidate is adversarially verified (reachability, existing guards,
test coverage, concrete blast radius) before it's ever reported — CONFIRMED, PLAUSIBLE, or
discarded. Full detail and the hard exclusion list (style/naming/lint — never reported):
`~/.claude/skills/production-readiness/references/scan-verify.md`.

## Gotchas

1. **Not-Observable discipline** — a fabricated Pass is worse than an honest gap. Neither agent
   should ever invent a rating for a dimension the current scope can't actually speak to.
2. **`prod-site-auditor` v1 is curl/WebFetch only** — no login flows, no JS-rendered SPA
   content, no interactive browser automation. Those surfaces show as Not-Observable, never a
   silent pass.
3. **`ReportFindings` may not be available in every environment** — both agents fall back to a
   plain findings list in the final message. Don't assume the tool exists.
4. **This is deliberately precision-over-recall** — expect fewer, higher-confidence findings
   than a routine `/myreview` pass, not more. That's by design (see scan-verify.md's governing
   rule), not a coverage gap.

## How this recipe improves over time

The methodology isn't frozen at day one. Loop (manual, doc-driven — no hooks/automation):

1. **Log immediately.** After a real audit run surfaces a miss (a real bug the audit didn't
   catch) or a false positive (a CONFIRMED/PLAUSIBLE finding that turned out wrong), append one
   dated line to `~/.claude/skills/production-readiness/references/changelog.md` right then —
   cheap, low friction, do it in the moment rather than trying to remember later.
2. **Fold in periodically.** Whenever revisiting this recipe, or after a handful of changelog
   entries accumulate, re-read `changelog.md` and fold recurring patterns into `rubric.md` (a
   new dimension, or a sharpened Pass/Warn/Fail anchor) or `scan-verify.md` (a new scan
   category, or a tightened verify check). Same bar the methodology already sets for itself:
   precision over recall — fold in on real recurring evidence, not speculation.
3. **Mark what's folded in.** Note the date a changelog entry got incorporated so the log stays
   a true history, not a duplicate of the rubric.

This mirrors exactly how `production-seo-for-react-spa`'s Gotchas section accumulated real
hard-won lessons over time — no new tooling, just a durable place to write down what real usage
teaches you.

## Files in this recipe

- `~/.claude/agents/prod-bug-auditor.md` — static audit subagent (files/diff)
- `~/.claude/agents/prod-site-auditor.md` — live audit subagent (URL, curl/WebFetch only)
- `~/.claude/skills/production-readiness/SKILL.md` — shared methodology entry point
- `~/.claude/skills/production-readiness/references/rubric.md` — 8-dimension scorecard rubric
- `~/.claude/skills/production-readiness/references/scan-verify.md` — bug-finding taxonomy + verify checklist
- `~/.claude/skills/production-readiness/references/changelog.md` — living log of field-tested gaps, periodically folded into the two files above
