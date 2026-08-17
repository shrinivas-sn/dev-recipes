# START HERE — the anti-guessing system

Read this file at the start of any build/design session. It is the whole system in one page.
Lessons and post-mortems live in `LESSONS.md` — read an entry there only when relevant, not as part of session start.

## The problem this solves

Claude answers about libraries and design from **memory**, which is stale by construction and biased toward the statistical average: **wrong code** (v4 syntax in a v3 project) and **generic design** ("AI slop" — the most probable hero is the most machine-looking one). You cannot prompt your way out of either; a different instruction just selects a different average. **The fix is retrieval: look it up, cite it, adapt it.**

## The one rule

> Never design or code from memory when a registered source exists.

## Two skills

| Skill | Answers | Sources |
|---|---|---|
| **`/context-brief`** | "How does this library actually work, at *my* version?" | Context7 → `llms.txt` → WebSearch → Firecrawl |
| **`/design-source`** | "What should this UI actually be?" | shadcn · React Bits · Magic UI · Aceternity |

Both auto-trigger on matching work. Invoke by name to force them.

## Files

```
_knowledge/START-HERE.md         this file
_knowledge/LESSONS.md            post-mortems and hard-won corrections, read on demand
_knowledge/sources.yaml          library/API sources + cost ladder     -> /context-brief
_knowledge/design-sources.yaml   UI registries + adaptation contract   -> /design-source
_knowledge/slop-signatures.md    greppable AI-slop patterns, with fixes
_knowledge/cache/                distilled, cited, version-pinned briefs
_knowledge/scripts/verify-sources.js   re-probes every llms.txt, refuses a partial pass
_knowledge/evals/                Layer 4 skill tests — read evals/README.md before touching it
_standard/README.md              Layer 2, the ruler — Anthropic's checklist + audit scorecard
_claude-config/                  backup mirror of hand-written skills/commands/agents + sync.js
```

## The loop, in practice

**Writing code against a library** → `/context-brief`: pin from the **lockfile** (not the declared range, not memory) → check `cache/` for a hit (date *and* version must both match) → route to the cheapest tier that can answer, stop when answered → write Answer / Why / **Traps** / Sources — an uncited claim is memory in disguise.

**Building or fixing UI** → `/design-source`: read the project first (JSX/TSX, Tailwind major, palette remaps, `cn()`, `dark:`) → scan for slop signatures, report honestly including "mostly clean" → **retrieve** the component, don't generate it (React Bits for JSX projects) → run the 7-point adaptation checklist (reduced-motion is the most-missed item) → cite the source, verify it renders.

## Hard-won facts (don't re-derive these)

- Tailwind and React Router publish no `llms.txt`; `expressjs.com/llms.txt` is a 1.5 KB stub — a 200 does not mean a tier can answer.
- Tailwind needs two Context7 ids: `/websites/tailwindcss` = v4, `/websites/v3_tailwindcss` = v3. The wrong one gives fluent, wrong answers.
- React Bits is the only registry publishing JSX — everything else is TSX-only.
- Motion Primitives and Cult UI return 429 (bot-check). Don't retry in a loop.
- Firecrawl is rationed (~1400 credits/cycle) — only for aesthetic references with no docs.
- Local recipes outrank upstream docs for gotchas — `website-animation-patterns\libraries\` has debugged GSAP `useGSAP`/`contextSafe` specifics that exist nowhere upstream.
- The skill is `/context-brief`, not `/context` — Claude Code ships a built-in `/context`.

## Honesty rules (what makes this trustworthy)

- If no source had it and it came from memory, **say so explicitly**.
- If a scan comes back clean, **say that** — a detector that always finds a crisis is noise.
- Retrieval ≠ taste. Zero slop signatures is a floor, not a ceiling.
- Record failures (404s, 429s) with dates, so the next run doesn't re-discover them.
- Never trust a status line — verify it. `LESSONS.md` records three times this file was wrong.

## Status

- **Layer 1 (library truth):** built, proven on `E:\calendar-api`.
- **Layer 1b (design):** built, proven — 4 live registries; adaptation contract caught a real accessibility gap first run.
- **Layer 2 (the ruler):** `_standard/README.md`. 7 custom skills audited, 2 gaps, both deliberately deferred (Windows-style paths; 0 evals = Layer 4 work).
- **Layer 4 (evals):** `evals/` — runner + 3 `context-brief` scenarios, all passing. Coverage is 1 of 7 skills. Design, traps, how to add a scenario: `evals/README.md`.
- **Layer 3:** `_core/` is an empty dir; `recipes/` beyond the no-ai-slop pair doesn't exist. Not started, needs scoping before any work.
- **Backed up:** all of the above is committed and pushed to `github.com/shrinivas-sn/dev-recipes`. Hand-written config (7 skills, 10 commands, 5 subagents) mirrors separately via `sync.js`.
- **Unproven:** Firecrawl tier 4 (never warranted yet).

## Resume here

Widen Layer 4 coverage: `context-brief` has 3 scenarios, the other 6 skills have none. Two open design gaps, named in `evals/README.md`: no baseline arm (a pass proves no regression, not that the skill helped), and `skill_fired` is only gradable under `--auto-trigger`. Read that README before adding scenarios.
