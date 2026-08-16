# _knowledge/cache

Distilled, **cited** briefs produced by `/context-brief`. This is the content layer —
the thing that was missing when recipes were "process, zero knowledge".

## What belongs here

- **Committed:** `*.md` briefs. Distilled, short, every claim carrying a source link.
  Reusable across projects.
- **Gitignored:** `raw/` — full Context7 dumps, whole `llms.txt` files, Firecrawl output.
  Regenerable, large, no review value.

Project-specific application ("how *this* stack should use it") does **not** live here.
That goes in the project's own docs, linking back to the brief.

## Brief format

Every brief opens with front-matter that makes staleness detectable:

```yaml
---
topic: express-5-error-handling
domain: express                 # must match a `domains[].id` in sources.yaml
tier: 1                          # which rung of the cost ladder answered it
pinned_version: express@5.2.1    # what the consuming project actually installs
verified: 2026-08-16
ttl_days: 30
sources:
  - https://...
---
```

Then: **Answer** (what to do), **Why** (mechanism), **Traps** (what memory gets wrong),
**Sources**. No preamble, no restating the question.

## Freshness

A brief past `verified + ttl_days` is **not** deleted — it is re-verified on next use and
the date bumped. `/context-brief` refuses to serve a stale brief silently; it either
re-verifies or says the brief is stale and why that matters.

A brief whose `pinned_version` no longer matches the consuming project's `package.json`
is stale **regardless of date**. Version drift beats calendar age.
