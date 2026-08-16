# Production Readiness Methodology — Changelog

Append-only log of real-world gaps in this methodology: misses (a real bug the audit didn't
catch) or false positives (a CONFIRMED/PLAUSIBLE finding that turned out wrong). Log an entry
right after it happens — cheap, low friction.

Not read by `prod-bug-auditor`/`prod-site-auditor` at runtime — keeps every audit run's token
cost unchanged. This file is for periodic human-driven review: re-read it, look for recurring
patterns, and fold them into `rubric.md` (new dimension or sharpened anchor) or `scan-verify.md`
(new scan category or tightened verify check). Same bar the methodology already sets for itself:
precision over recall — fold in on real recurring evidence, not speculation. Mark an entry with
the date it was folded in so this stays a true history, not a duplicate of the rubric.

See also: `E:\dev-recipes\production-grade-bug-review\README.md` for the full recipe this
belongs to.

## 2026-08-05 — System created

Baseline: 8 rubric dimensions, 8 scan categories, scan → verify → score → report flow. No
field-tested gaps yet.
