# _knowledge — the agent knowledge framework

> **New session? Read [`START-HERE.md`](./START-HERE.md) first — the whole system in one page.**


The recipes in this repo were **process with zero knowledge**: good scaffolding telling
Claude *how* to work, but shipping no authoritative content, so the actual design and API
decisions still came from model memory. Memory is stale by construction. This layer is the
substrate that fixes it.

```
_knowledge/
  sources.yaml            the registry — domain → where truth lives, at what cost
  cache/                  distilled, cited briefs (raw/ gitignored)
  scripts/
    verify-sources.js     re-probes every llms.txt so `verified` dates stay real
```

Driven by the **`/context-brief`** skill (`~/.claude/skills/context-brief/SKILL.md`).

## The rule

> Never design or code from memory when a registered source exists.

## The cost ladder

`/context-brief` is a **router**, not a scraper. It takes the cheapest tier that can
actually answer:

| Need | Tier | Tool | Cost |
|---|---|---|---|
| Library/API truth — signatures, config, version behaviour | 1 | Context7 MCP | free, ~9k libs, version-pinnable |
| Docs sites publishing `llms.txt` | 2 | WebFetch | free |
| Discovery — "what's current", find a source | 3 | WebSearch | free |
| Aesthetic/motion patterns, JS-heavy sites with no docs | 4 | Firecrawl | metered — ration it |

Firecrawl sits at the bottom on purpose. It has ~1400 credits/cycle and 2 concurrent jobs,
so it is reserved for the one thing nothing else does: pulling real aesthetic and motion
patterns off sites that publish no docs.

## Two things that keep this from rotting

**Version pinning beats calendar age.** A brief is stale the moment the consuming project's
`package.json` no longer matches its `pinned_version`, however recently it was written.
`/context-brief` reads `package.json` before every retrieval.

**Recorded absences are results.** When a docs site has no `llms.txt`, that gets committed
as `llms_txt: null` with the date it was checked — so the next run doesn't burn a fetch
rediscovering the same 404. (Tailwind and React Router are both in this state, despite
Tailwind being widely listed as an `llms.txt` publisher. Probed 2026-08-16.)

## Maintenance

```bash
node E:/dev-recipes/_knowledge/scripts/verify-sources.js          # report health
node E:/dev-recipes/_knowledge/scripts/verify-sources.js --write  # bump stamp if all pass
```

It refuses to stamp a partial pass — a bumped date next to a broken source would launder a
failure into apparent freshness.

## Status

Layer 1, proven on `E:\calendar-api` (2026-08-16). See `cache/` for the briefs that proof
produced, and `PROOF-calendar-api.md` for what the router actually caught.

Layers 2–4 (`_standard/`, refined `recipes/`, `evals/`) are not built yet — deliberately,
since Layer 1 had to be proven first.
