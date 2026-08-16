# START HERE — the anti-guessing system

Read this file at the start of any build/design session. It is the whole system in one page.

## Resume here — last session 2026-08-16

Layers 1, 1b and 2 are **built, proven, committed and pushed**. Nothing in this repo is
uncommitted. Two of last session's four items are now closed. Pick up from:

1. **Layer 4 — evals.** 0 of 7 custom skills have any. No pattern exists to copy, so write
   3 evals for **one** skill first as the template, then scale. **Biggest remaining gap and
   the top priority.**
2. **Layer 3** — refined `recipes/` beyond the no-ai-slop pair, and `_core/` (empty dir).
   Least defined; needs scoping before work starts.

~~3. Deploy `calendar-api`.~~ **DONE 2026-08-16** — deployed and verified in production.
~~4. Resolve the `impeccable` duplicate.~~ **DONE 2026-08-16** — investigated, not a defect.

Both closures are detailed under *Known open items*.

Before trusting any status line below, **verify it**. Three entries in this file have now
been flat wrong: "nothing is committed to git" (it was always a repo), "the backend is not
deployed" (it had moved from Railway to Render), and "3 commits on `develop`" (there were
**4**). Every one was written from a single stale observation. Check the repo, check the
live host, count the commits.

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
- **Backed up 2026-08-16:** Layers 1, 1b and 2 are committed and pushed to
  `github.com/shrinivas-sn/dev-recipes`. Before that they existed only on this disk.
- **Unproven:** Firecrawl tier 4 (never warranted yet).
- **Not started:** refined `recipes/` beyond the no-ai-slop pair, `evals/`, `_core/` (empty dir).

## Known open items

- ~~`calendar-api` has two documented, unfixed defects.~~ **Both fixed 2026-08-16**, verified
  by reproducing each failure. ~~Changes are uncommitted on branch `develop`.~~
  **Committed 2026-08-16** as 3 commits on `develop` (`c96f8a2` backend handler,
  `0e81047` frontend motion/focus, `2cc4694` the context doc) — **still not pushed**.
  Re-verified before committing: `transition-all` count is 0, the reduced-motion block and
  the `focus-visible` ring both appear in the emitted CSS after `npm run build`.
  ~~`DOCS\APP-CONTEXT\STACK-CONTEXT.md` is stale.~~ Rewritten — both defects now recorded as
  closed *with the reasoning kept*, so the conventions (4-arg arity, base `button` focus rule,
  global reduced-motion floor) survive someone who does not know why they exist.
  The second defect's record was wrong by ~10×: logged as one `transition-all` at
  `index.css:58`, the full scan found **20** across 8 files, plus **0 `focus-visible` on all
  14 buttons** and **0 `prefers-reduced-motion`**. Lesson: a defect logged from a single grep
  hit understates its own scope — rerun the whole `slop-signatures.md` scan before trusting
  a logged count.
- ~~`calendar-api` backend is not deployed — Railway returns `Application not found`.~~
  **Wrong. Moved to Render** (platform restrictions on Railway) — live at
  `https://calendar-api-d7a8.onrender.com`, verified 2026-08-16 returning real data.
  Probing the Railway URL found in the docs "confirmed" a dead deployment that had simply
  been replaced. **Lesson: a 404 proves that URL is dead, not that the app is undeployed —
  find the current host before concluding anything.**
  ~~Still open: the **deployed build predates the error-handler fix**.~~ **CLOSED 2026-08-16 —
  deployed and verified.** Production now answers a malformed JSON body with
  `400 application/json` carrying the `{error, message, status}` envelope; the three other
  routes (`/`, `/v1/holidays`, unknown-route 404) were re-probed and are unchanged.
  Verified locally first on a matching `express@5.2.1` stack, then live after Render rebuilt.

  **Three facts from the deploy, worth not re-deriving:**
  - **Render deploys from `main`, not `develop`.** Pushing `develop` backs work up but
    deploys nothing. This is why the fix sat undeployed for a whole session.
  - **The note said "3 commits"; there were 4** (`a8036c3` was missing from the count).
    A commit count written from memory drifts — run `git log main..develop` instead.
  - **`main` had diverged.** Five README-only commits (badges repointed Railway → Render)
    had been pushed straight to `main` while the fixes sat on `develop`, so the first push
    was rejected. Resolved by fetch + **merge** (`4b269ff`) — not force push, not rebase —
    because both sides held real work with zero file overlap. A rejected push means fetch
    and look; it does not mean force.
- ~~Nothing in `E:\dev-recipes` is committed to git yet.~~ **Wrong, and now resolved
  2026-08-16.** It was always a git repo with a remote
  (`github.com/shrinivas-sn/dev-recipes`); what was untracked was the whole knowledge
  framework. Committed as 4 commits (`0bf4a67` Layers 1/1b/2, `70e169f` docs-structure +
  root README index, `893576b` no-ai-slop routing, `29e61d0` Lenis patterns) and **pushed —
  `main` is now in sync with `origin/main`.** Layers 1, 1b and 2 are backed up.
  Lesson worth keeping: this item was recorded as "no git at all" when the real problem was
  "the new work is untracked in an existing repo". Check the repo, don't trust the note.
- ~~`impeccable` is installed **twice** — needs a user decision.~~ **CLOSED 2026-08-16 — not a
  defect, and no decision was needed.** It is one skill at one version (**4.0.4** in both)
  shipped as two **harness-specific builds**: the `~/.claude` copy carries Claude Code
  frontmatter (`user-invocable`, `allowed-tools`) and `/impeccable` + `.claude/` paths, the
  `~/.agents` copy uses `$impeccable` + `.agents/` paths. All 14 differing lines are plumbing;
  no behavioural difference. **The `~/.claude` copy is the one Claude Code loads. Keep both.**

  What settled it: `~/.agents/.skill-lock.json` tracks **9** skills and `impeccable` is not
  among them — those 9 are exactly the 9 symlinks in `~/.claude/skills`. So it never came from
  `npx skills@latest`; it has its own installer that writes to both harness roots by design,
  and `npx skills@latest update -g` will not touch it. Full table in `_standard/README.md`.

  **Lesson: "the same file exists twice and differs" is not automatically a conflict.** Check
  what installed it before assuming a duplicate needs resolving — the installer's lockfile
  answered in one read what a `SKILL.md` diff alone could not.
- ~~The old `no-ai-slop-*` recipes still say "look at it" / "name mood words".~~ Done
  2026-08-16 — but **not by folding them in**. That earlier instruction was wrong: `no-ai-slop`
  is a *pipeline* (detect → audit → build → visual-verify → simplify → review → test → ship,
  with report gates and an 8-category scorecard); `/design-source` is a *retrieval procedure*
  for one step inside it. Folding would have deleted the gates. Instead the five
  generate-then-re-prompt bullets now route to `/design-source`; the pipeline is unchanged.
