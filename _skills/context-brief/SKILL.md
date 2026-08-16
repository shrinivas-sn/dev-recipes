---
name: context-brief
description: Fetches authoritative, version-pinned, cited knowledge before designing or coding — routing through a cost ladder (Context7 → llms.txt → WebSearch → Firecrawl) against the registry at E:\dev-recipes\_knowledge\sources.yaml, then writing a distilled brief. Use before writing code against any library/framework/platform API, before making design or animation decisions, when a stack's version behaviour matters, or whenever about to answer from model memory about a library that could have changed.
---

# context-brief

The fix for the content gap: Claude having no authoritative, current source for library,
design, and frontend knowledge, and therefore answering from memory — which is stale by
construction and produces confidently wrong output.

**The one rule this skill exists to enforce:**

> Never design or code from memory when a registered source exists.

Layer 1 of the `E:\dev-recipes` knowledge framework. Registry: `_knowledge/sources.yaml`.
Briefs: `_knowledge/cache/`.

## When this fires

Before writing code against a library API, before design/motion decisions, and before
answering "how do I do X in <library>". If you catch yourself about to state a library's
API, config format, or default behaviour without having looked, that is the trigger.

Skip it for: pure business logic, the project's own code, shell/git, and anything with no
external dependency.

## Step 1 — Scope the request

Split `$ARGUMENTS` into **domains** (which registered source answers this) and the
**question** (what specifically is being asked). Vague topics produce useless briefs — if
the ask is "help with the frontend", ask one clarifying question before spending retrieval.

## Step 2 — Pin versions from the project, not from memory

Read the consuming project's `package.json` (every one — a repo can have `frontend/` and
`backend/` on different stacks). Record the **installed major** for each domain in play.

This step is not optional and not a formality. It is where most wrong answers get caught:
the model's default for a library is whatever was current at training time, which routinely
mismatches what the project installs. A v4 answer in a v3 project compiles and silently
does nothing.

## Step 3 — Check the cache before spending anything

Look for `E:\dev-recipes\_knowledge\cache\<topic-slug>.md`.

Serve it only if **both** hold:
- `verified + ttl_days` is still in the future, and
- `pinned_version` matches what step 2 found.

Version drift beats calendar age — a two-day-old brief pinned to the wrong major is stale.
On a hit, say so explicitly ("cache hit, verified <date>") so a reused brief is never
mistaken for fresh retrieval. On a miss, continue and refresh the brief at the end.

## Step 4 — Route down the cost ladder

Read `tiers:` in `sources.yaml`. Take the **cheapest tier that can actually answer**, and
stop as soon as the question is answered — do not collect all four.

| Need | Tier | Tool |
|---|---|---|
| Library/API truth — signatures, config, version behaviour | 1 | `mcp__context7__query-docs` |
| Narrative guidance from a docs site publishing `llms.txt` | 2 | `WebFetch` |
| Discovery — "what's current", "did X change", find a source | 3 | `WebSearch` |
| Aesthetic/motion patterns from sites with no docs | 4 | Firecrawl skills |

Routing rules that matter:

- **Version-pin the Context7 id.** Use `/org/project/version` when the registry lists a
  version matching step 2 (e.g. `/expressjs/express/v5.2.0`). An unpinned query returns
  whatever is current, which is exactly the failure mode being fixed.
- **Honour recorded absences.** `llms_txt: null` with an `llms_txt_checked` date means
  someone already probed and it 404s. Do not re-fetch to rediscover the same absence.
- **Watch the size notes.** Some `llms.txt` files are large (Vercel ≈ 206 KB). WebFetch
  them with a narrow prompt; never pull one in to browse.
- **Local recipes outrank the internet for gotchas.** Where a domain has a `local:` path
  (GSAP, Motion, design refs), read it first — it holds debugged, hard-won specifics no
  upstream doc contains.
- **Firecrawl is rationed.** ~1400 credits/cycle, 2 concurrent jobs, budget 20 credits/run.
  It gets used only for its unique job: extracting real aesthetic/motion patterns from
  JS-heavy sites with no docs. Never for something with an `llms.txt`.

If a Context7 id fails to resolve, re-run `resolve-library-id` and **update the registry**
with the working id — the registry is meant to improve every time it is used.

## Step 5 — Distil, don't dump

Write `E:\dev-recipes\_knowledge\cache\<topic-slug>.md`:

```yaml
---
topic: <slug>
domain: <matching domains[].id in sources.yaml>
tier: <rung that answered>
pinned_version: <pkg@version from step 2>
verified: <YYYY-MM-DD>
ttl_days: 30
sources:
  - <url>
---
```

Then four sections, nothing else:

- **Answer** — what to do, concretely. Code only where code is the answer.
- **Why** — the mechanism. A reader must be able to reason about the next case, not just
  copy this one.
- **Traps** — what model memory gets wrong here. This section is the point of the brief;
  a brief with an empty Traps section usually means the retrieval was too shallow.
- **Sources** — every URL actually used.

Every non-obvious claim carries a citation. **An uncited claim in a brief is a memory
answer wearing a costume** — either cite it or cut it.

Raw dumps, if kept at all, go in `cache/raw/` (gitignored). Never commit a dump as a brief.

## Step 6 — Apply it to the project

The cache brief is stack-general and reusable. The project-specific part — what *this*
codebase should do about it — goes in the project's own docs, linking back to the brief.
Match the project's existing docs layout; do not restructure it as a side effect.

Then say plainly whether the retrieved truth **changed** the answer versus what would have
been said from memory. If it changed nothing, say that too — a router that never reports a
correction is a router nobody can trust.

## Step 7 — Feed the registry back

If a domain was used that isn't in `sources.yaml`, add it — but **probe before committing**:

```bash
curl -s -o /dev/null -w "%{http_code} %{size_download}" -L <url>/llms.txt
```

Record real results, including 404s (as `llms_txt: null` + `llms_txt_checked`). Never write
a `verified` date for a probe that wasn't run.

Re-probe everything periodically:

```bash
node E:/dev-recipes/_knowledge/scripts/verify-sources.js          # report
node E:/dev-recipes/_knowledge/scripts/verify-sources.js --write  # bump stamp if all pass
```

## Failure handling

- **Every tier fails** → say so, name what was tried, and answer from memory *explicitly
  labelled as unverified memory*. Never present an unsourced answer as sourced.
- **Sources disagree** → surface the disagreement and prefer the version-pinned official
  one. Do not silently pick.
- **Registry missing/unreadable** → still route down the ladder manually, and report that
  the registry needs repair.
