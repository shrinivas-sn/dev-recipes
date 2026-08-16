---
description: Write production-quality tests and safely fix failures one at a time
---
Write and run tests for: $ARGUMENTS

Understand first:
- What this code/feature is actually meant to solve in this project (its purpose, not just its syntax).
- How it connects to related/dependent code, so tests reflect real usage, not just isolated units.

Writing tests:
- Production-level quality: cover the real behavior, important edge cases, and failure modes — not just happy path.
- Keep each test short and focused — one behavior per test, no bloated setups.
- Only ADD test files/cases. Never delete, rewrite, or "clean up" existing application code while doing this — if something looks wrong, report it, don't remove it.

Running tests:
- Run the full relevant suite (new + existing).
- If failures/bugs are found: report ALL of them first as a list — file:line, what failed, and the likely reason, in short.
- Do NOT fix anything yet at this stage.

Fixing (only after I review the report):
- Go one failure at a time, in the order I approve.
- For each: propose the fix, wait for my explicit OK, apply it, then stop and wait before moving to the next.
- Never touch code beyond what's proven broken by that specific failing test.
