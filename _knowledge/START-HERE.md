# START HERE — the anti-guessing system

Read this file at the start of any build/design session. It is the whole system in one page.

## The problem this solves

Claude answers about libraries and design from **memory**. Memory is stale by construction
and biased toward the statistical average, which produces two failure modes:

1. **Wrong code** — APIs that changed, v4 syntax in a v3 project, v4-era advice for v5.
2. **Generic design** — "AI slop", because a model asked for "a hero" samples the most
   probable hero, and maximally-average is exactly what reads as machine-made.

You cannot prompt your way out of either. "Be more careful" and "make it distinctive" just
select a different average. **The fix is retrieval: look it up, cite it, adapt it.**

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
_knowledge/
  START-HERE.md            this file
  sources.yaml             library/API sources + the cost ladder    -> /context-brief
  design-sources.yaml      code-bearing UI registries + adaptation contract -> /design-source
  slop-signatures.md       greppable AI-slop patterns, with fixes
  cache/                   distilled, cited, version-pinned briefs
  scripts/verify-sources.js  re-probes every llms.txt; refuses to stamp a partial pass
  PROOF-calendar-api.md    Layer 1 proof (library truth)
  PROOF-design-layer.md    Layer 1b proof (design)

../_standard/README.md     Layer 2 — the ruler (points at Anthropic's checklist) + audit scorecard
```

## The loop, in practice

**Writing code against a library** → `/context-brief`
1. Pin versions from the **lockfile**, not the declared range, not memory.
2. Check `cache/` — a brief is stale if the date expired *or* the version drifted.
3. Route to the cheapest tier that can answer. Stop when answered.
4. Write a brief: Answer / Why / **Traps** / Sources. Uncited claim = memory in disguise.

**Building or fixing UI** → `/design-source`
1. Read the project first: JSX or TSX, Tailwind major, palette remaps, `cn()`, `dark:` usage.
2. Scan for slop signatures. Report honestly — including "mostly clean".
3. **Retrieve** the component; don't generate it. React Bits for JSX projects.
4. Run the 7-point adaptation checklist. Reduced-motion is the most-missed item.
5. Cite the source in a comment. Verify it renders.

## Hard-won facts (don't re-derive these)

- **Tailwind publishes no `llms.txt`.** Nor does React Router. `expressjs.com/llms.txt` is a
  1.5 KB stub — a 200 does not mean a tier can answer.
- **Tailwind needs two Context7 ids:** `/websites/tailwindcss` = v4,
  `/websites/v3_tailwindcss` = v3. The wrong one gives fluent, wrong answers.
- **React Bits is the only registry publishing JSX.** Everything else is TSX-only.
- **Motion Primitives and Cult UI return 429** (bot-check). Don't retry in a loop.
- **Firecrawl is rationed** — ~1400 credits/cycle. Only for aesthetic references with no docs.
- **Local recipes outrank upstream docs for gotchas.**
  `E:\dev-recipes\website-animation-patterns\libraries\` has debugged GSAP `useGSAP`/
  `contextSafe` specifics that exist nowhere upstream.
- **The skill is `/context-brief`, not `/context`** — Claude Code ships a built-in `/context`.

## Honesty rules (what makes this trustworthy)

- If no source had it and it came from memory, **say so explicitly**.
- If a scan comes back clean, **say that** — a detector that always finds a crisis is noise.
- Retrieval ≠ taste. Zero slop signatures is a floor, not a ceiling.
- Record failures (404s, 429s) with dates, so the next run doesn't re-discover them.

## Status

- **Layer 1 (library truth):** built, proven on `E:\calendar-api`.
- **Layer 1b (design):** built, proven — 4 live registries, adaptation contract caught a
  real accessibility gap first run.
- **Layer 2 (the ruler):** `_standard/README.md` written 2026-08-16. It does **not** restate a
  spec — the ruler is `anthropic-best-practices.md` (ships with `superpowers`), already owned
  and previously unapplied. `_standard/` holds the deltas and the audit scorecard.
  Seven custom skills audited: 2 real gaps, both deliberately deferred (27 Windows-style paths
  = accepted on a single-machine setup; 0 evals = Layer 4 work).
- **Cache-hit path: PROVEN 2026-08-16** on `E:\calendar-api`. `express-5-error-handling.md`
  hit on both conditions — 0 days of a 30-day TTL, and pin `express@5.2.1` matched the
  **lockfile** (declared range was `^5.2.1`, which would have permitted 5.9.x; matching the
  range instead of the lockfile would have produced a false hit). Zero network calls, zero
  Context7 tokens. The brief's fix applied and verified by reproducing the failure.
- **Unproven:** Firecrawl tier 4 (never warranted yet).
- **Not started:** refined `recipes/` beyond the no-ai-slop pair, `evals/`, `_core/` (empty dir).

## Known open items

- ~~`calendar-api` has two documented, unfixed defects.~~ **Both fixed 2026-08-16**, verified
  by reproducing each failure. Changes are **uncommitted on branch `develop`, not pushed**
  (8 files, +52/−23). `DOCS\APP-CONTEXT\STACK-CONTEXT.md` still describes them as open —
  that file is now stale.
  The second defect's record was wrong by ~10×: logged as one `transition-all` at
  `index.css:58`, the full scan found **20** across 8 files, plus **0 `focus-visible` on all
  14 buttons** and **0 `prefers-reduced-motion`**. Lesson: a defect logged from a single grep
  hit understates its own scope — rerun the whole `slop-signatures.md` scan before trusting
  a logged count.
- `calendar-api` backend is **not deployed** — Railway returns `Application not found`;
  the README status badge is misleading.
- ~~Nothing in `E:\dev-recipes` is committed to git yet.~~ **Wrong — corrected 2026-08-16.**
  It is a git repo with a remote (`github.com/shrinivas-sn/dev-recipes`) and history back to
  at least 2026-08-13. What is actually untracked is **the whole knowledge framework**:
  `_knowledge/`, `_standard/`, `docs-structure-standard/`,
  `website-animation-patterns/libraries/lenis/`, plus 3 modified `README.md` files.
  `main` is also **4 commits ahead of `origin/main`** (unpushed). So Layers 1, 1b and 2 exist
  only on this disk.
- `impeccable` is installed **twice** — real 3.3 MB dirs in both `~/.agents/skills` and
  `~/.claude/skills`, with differing `SKILL.md`. Needs a user decision; see `_standard/README.md`.
- ~~The old `no-ai-slop-*` recipes still say "look at it" / "name mood words".~~ Done
  2026-08-16 — but **not by folding them in**. That earlier instruction was wrong: `no-ai-slop`
  is a *pipeline* (detect → audit → build → visual-verify → simplify → review → test → ship,
  with report gates and an 8-category scorecard); `/design-source` is a *retrieval procedure*
  for one step inside it. Folding would have deleted the gates. Instead the five
  generate-then-re-prompt bullets now route to `/design-source`; the pipeline is unchanged.
