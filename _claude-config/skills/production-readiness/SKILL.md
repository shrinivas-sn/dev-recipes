---
name: production-readiness
description: Shared reference for production-readiness audits — the 8-dimension readiness scorecard rubric and the two-pass scan/verify bug-finding methodology used by the prod-bug-auditor and prod-site-auditor subagents. Those subagents load this via Read at an absolute path, not the Skill tool. Not for routine code review — use code-reviewer or /myreview for that; use this only for an explicit production-readiness / ship-readiness audit.
---

# Production Readiness Audit — Shared Methodology

This skill is reference material consumed by the `prod-bug-auditor` and `prod-site-auditor`
subagents at the start of every run. It can also be read directly if a production-readiness
audit is explicitly requested in the main conversation.

## What a production-readiness audit produces

Exactly ONE combined output per run:
1. A **scorecard** — Pass / Warn / Fail / Not-Observable for each of the 8 dimensions below,
   each with a one-line justification, written as prose in the final message.
2. **Bug findings** via `ReportFindings` (or a plain findings list if that tool isn't
   available), each tagged CONFIRMED or PLAUSIBLE, produced by the two-pass scan→verify
   process.

## The 8 rubric dimensions

Full detail, Pass/Warn/Fail anchors and examples: `references/rubric.md`

1. Security
2. Error Handling & Resilience
3. Observability
4. Test Coverage & CI
5. Scalability / Performance
6. Deployment Hygiene
7. Data Integrity
8. Docs / Operability

## Bug-finding methodology

Full detail, category taxonomy, verify checklist, exclusion list: `references/scan-verify.md`

Two passes: broadly scan for candidate issues in named categories, then adversarially try to
falsify each candidate before it's ever reported. Precision over recall — a missed bug is
cheaper than a false positive that erodes trust in the tool.

## Required reading order

1. This file
2. `references/rubric.md`
3. `references/scan-verify.md`

Read both reference files in full before scoring or scanning anything — do not rely on
summarized recall of them.

## Maintaining this methodology

This isn't part of the Step-0 reading list above (kept out on purpose, so it adds no token cost
to a normal audit run). When a real audit run surfaces a miss or a false positive, log it in
`references/changelog.md`. Periodically fold recurring patterns from that log into the rubric or
scan taxonomy above. Full process: `E:\dev-recipes\production-grade-bug-review\README.md`.
