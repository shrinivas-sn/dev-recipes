# Skill-layer: pick fit-check, living PRD, self-monitor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap that lets a design pick become binding build input without anything checking it against the project's own stated constraints, and give recorded lessons a promotion path into skill edits.

**Architecture:** Three loosely-coupled mechanisms. (1) `design-pick` writes every pick as `provisional` and runs a *semantic* fit-check against a constraints source it resolves by precedence, degrading gracefully when none exists; `design-source` refuses to build from a `provisional` pick. (2) A new `prd-intake` skill fills the already-standardised-but-inert `DOCS/CONTEXT/PRD.md` slot, which is what the fit-check reads. (3) One central `_knowledge/SELF-MONITOR.md` with an Unreviewed → Promoted split routes recorded gate failures to skill edits. Nothing here is a new command or a new ritual — every trigger is a pre-existing event.

**Tech Stack:** Markdown skill files (`~/.claude/skills/`), YAML registries (`_knowledge/`), Node.js mirror script (`_claude-config/sync.js`, CommonJS, no deps), JSON eval scenarios run by `_knowledge/evals/runner.js`.

**Spec:** `E:\dev-recipes\docs\superpowers\specs\2026-08-20-skill-layer-design.md` — read it alongside this plan. It holds the problem statement, the six decisions with their rejected alternatives, and the risks. This plan implements it; where this plan deviates, it says so explicitly and gives the reason.

## Global Constraints

- **Repo / workspace:** `E:\dev-recipes` (has a remote). `E:\SKILL-BUILD-prd-and-designpick` is **not** a repo and is **not** the workspace — it only holds `CONTEXT.md`, the resume pointer.
- **Sync direction is one-way, live → repo** (`_claude-config/sync.js:9`). The three skill files are edited in `C:\Users\Dell\.claude\skills\`, then mirrored into the repo by running the script. **Never** edit `_claude-config/skills/**` by hand — the next sync overwrites it. The other targets live in the repo directly and are edited there.
- **No project names or absolute project paths in shipped skill logic** (spec D5). Origin stories stay — they make rules stick — but they point at `LESSONS.md` for the specifics. `E:\dev-recipes\...` paths pointing at this repo's own knowledge files are fine and expected; what is banned is naming a *client/build project* (e.g. `wholesale-rice-mock`) or its path.
- **The new PRD skill is named `prd-intake`.** Decided 2026-08-20. This name appears in three places: the live skill directory, `sync.js`'s tracked list, and `START-HERE.md`. Use it verbatim.
- **Dates in file content are written `YYYY-MM-DD`** (matching every existing `verified:` / `updated:` field in `_knowledge/`). Today is `2026-08-20`.
- **Prompt edits have no unit tests.** Do not claim "tests pass". Verification is the three tiers in spec §5, reproduced per-task here: mechanical grep assertions, one replay eval, and a backward-compatibility check.
- **Commit per task**, on the feature branch created in Task 1. Never commit to `main`.

---

## File Structure

| File | Task | Responsibility after this plan |
|---|---|---|
| `_knowledge/LESSONS.md` | 2 | Home for project-specific post-mortems, including project names and paths. Receives the fit-check failure account de-hardcoded out of the skills. |
| `_knowledge/SELF-MONITOR.md` | 2 | **New.** Central log of "a named gate was missing, or fired wrong", Unreviewed → Promoted. |
| `_knowledge/START-HERE.md` | 2 | Session-start index. Gains `SELF-MONITOR.md`; loses two stale status claims. |
| `~/.claude/skills/design-pick/SKILL.md` | 3 | **The core change.** Provenance + fit. Structure capture, constraints resolution, semantic fit-check, provisional-by-default, a separate promotion action. |
| `~/.claude/skills/design-source/SKILL.md` | 4 | Consumer of `PICKS.md`. Gains three-row precedence: `binding` builds, `provisional` stops, absent field builds with one warning. |
| `~/.claude/skills/prd-intake/SKILL.md` | 5 | **New.** Fills `DOCS/CONTEXT/PRD.md` without inventing requirements. |
| `docs-structure-standard/templates/CONTEXT/PRD.md` | 5 | The template `prd-intake` fills and the fit-check reads. Gains `Non-goals` + `Success criteria`. |
| `_knowledge/design-picks.yaml` | 6 | Source registry. Gains `known_issues:`, `fetch_order:`, `retrieval:` vocabularies; header de-hardcoded. |
| `_claude-config/sync.js` | 7 | Backup mirror. Tracked list gains `design-pick` (a live defect — it has no backup today) and `prd-intake`. |
| `_knowledge/evals/fixtures/pick-fit-check/**` | 8 | **New fixture.** A project whose constraints ban a combination its `PICKS.md` instantiates. |
| `_knowledge/evals/scenarios/design-pick/01-fit-check-catches-banned-combo.json` | 8 | **New scenario.** Replays the real miss. |

Ordering rationale: Task 2 first among the content tasks because it creates the pointer target (`LESSONS.md` post-mortem, `SELF-MONITOR.md`) that Tasks 3 and 6 reference. Task 7 (`sync.js`) must run after Tasks 3, 4 and 5 exist, or the script aborts on a tracked-but-missing skill.

---

## Task 1: Clear the workspace and branch

`E:\dev-recipes` `main` currently holds unrelated uncommitted work. If you branch without dealing with it, it bleeds into this branch's first `git add`. This task ends with a clean branch and nothing else changed.

**Files:**
- Modify: none (git state only)

**Interfaces:**
- Consumes: nothing.
- Produces: branch `skill-layer-fit-check` checked out in `E:\dev-recipes`, with a clean `git status` apart from this plan and spec. Every later task commits onto this branch.

- [ ] **Step 1: Look at exactly what is uncommitted**

```bash
cd /e/dev-recipes
git status --short
git diff --stat
```

Expected — three tracked modifications and four untracked paths:

```
 M docs-structure-standard/README.md
 M docs-structure-standard/templates/README.md
 M docs-structure-standard/templates/WORK/YYYY-MM-DD/WORK.md
?? _knowledge/evals/fixtures/existing-app-slop/
?? _knowledge/evals/fixtures/scratch-scaffold/
?? _knowledge/evals/scenarios/no-ai-slop/
?? docs/
```

The three modified files are a coherent DD/MM/YYYY display-date change. The two fixture dirs plus `scenarios/no-ai-slop/` are two complete `no-ai-slop` eval scenarios. `docs/` is untracked because this plan and its spec are the first things ever written there. All of it looks finished, none of it is this project's work.

- [ ] **Step 2: Commit the unrelated work on `main`, in two commits**

Two commits, not one — they are two unrelated changes and squashing them makes both harder to revert.

```bash
cd /e/dev-recipes
git add docs-structure-standard/README.md docs-structure-standard/templates/README.md docs-structure-standard/templates/WORK/YYYY-MM-DD/WORK.md
git commit -m "docs(structure): use DD/MM/YYYY for display dates

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"

git add _knowledge/evals/fixtures/existing-app-slop _knowledge/evals/fixtures/scratch-scaffold _knowledge/evals/scenarios/no-ai-slop
git commit -m "feat(evals): add two no-ai-slop scenarios with fixtures

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Verify `main` is clean apart from `docs/`**

```bash
cd /e/dev-recipes
git status --short
```

Expected: exactly one line, `?? docs/`. If anything else remains, stop and report it — do not proceed.

- [ ] **Step 4: Branch**

```bash
cd /e/dev-recipes
git checkout -b skill-layer-fit-check
git status --short
```

Expected: still `?? docs/`, now on branch `skill-layer-fit-check`.

- [ ] **Step 5: Commit the spec and plan onto the branch**

```bash
cd /e/dev-recipes
git add docs/
git commit -m "docs(superpowers): add skill-layer design spec and implementation plan

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git status --short
```

Expected: `git status --short` prints nothing at all. Clean tree, on the branch.

---

## Task 2: Post-mortem, self-monitor log, and START-HERE corrections

Three `_knowledge/` narrative files. They change together because Task 3 and Task 6 both drop project-specific detail and point *here* instead — so this content has to exist before those pointers are written.

**Files:**
- Modify: `E:\dev-recipes\_knowledge\LESSONS.md` (append one section at end of file, after line 78)
- Create: `E:\dev-recipes\_knowledge\SELF-MONITOR.md`
- Modify: `E:\dev-recipes\_knowledge\START-HERE.md` (three separate edits: line 33 area, line 60 area, line 67)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `_knowledge/LESSONS.md` contains a section titled exactly `## Provenance is not fit — a real source can still break the brief`. Tasks 3 and 6 point at `LESSONS.md` by path; they do not repeat its content.
  - `_knowledge/SELF-MONITOR.md` exists with exactly two H2 headings, `## Unreviewed` and `## Promoted`, and the entry format documented in its own header.

- [ ] **Step 1: Append the post-mortem to `LESSONS.md`**

Append this to the very end of `E:\dev-recipes\_knowledge\LESSONS.md`, after the existing final line (`...this system's whole value is that a human can trust and check it.`). Leave one blank line between the existing content and the new heading.

```markdown
## Provenance is not fit — a real source can still break the brief

A site build (`E:\CLAUDE-CODE-TERMINAL\wholesale-rice-mock`) used the anti-slop pipeline end to
end — `design-pick` for the choices, `design-source` for the code — and still shipped the exact
combination its own constraints document banned. The constraints doc named
"cream + serif + terracotta" as one of three AI-slop defaults to avoid. The recorded picks were a
cream/terracotta palette (`#DAD7CF`, `#BE8871`) plus Fraunces, a serif display face. They were
chosen in seconds, described by the builder at the time as "for testing", and never compared to
the constraints.

Nothing caught it, and nothing *could* have. `design-pick` verified **provenance** — that each
option came from a fetch performed that session — and every option had. It had no concept of
**fit**. Meanwhile `design-source`'s precedence rule made `PICKED:` entries binding, so a
ten-second exploratory pick automatically outranked the document that banned it. A human reading
the two files side by side was the only detector in the system.

Three separate lessons, none of which is "add more rules":

- **Provenance and fit are independent properties.** A real fetched source that violates the brief
  is still wrong, and no amount of provenance checking will surface it. Both need their own gate.
- **A fit-check that greps is worse than no fit-check.** No string search connects `#DAD7CF` to the
  word "cream". A check that only catches literal repeats reports clean on precisely the case it
  exists to catch, and manufactures confidence while doing it. The comparison has to happen at the
  level of what the values *are* — a cream, a terracotta, a serif.
- **"For testing" is not a state the file can represent.** The fix is not asking the person in a
  hurry to flag their hasty pick; that is the failure mode, not a remedy for it. Every pick is now
  written `provisional`, and promotion to `binding` is a separate deliberate action.

Fixed 2026-08-20 by the `provisional` / `Fit-check:` contract in `design-pick` and the three-row
precedence table in `design-source`. Earlier, related post-mortem from the same project: the
original build **invented** a gold/mustard palette and nav copy from training-data averages
because no source existed to retrieve from — which is why `design-pick` and
`design-picks.yaml` exist at all.
```

- [ ] **Step 2: Create `SELF-MONITOR.md`**

Write this file to `E:\dev-recipes\_knowledge\SELF-MONITOR.md` exactly as given.

````markdown
# SELF-MONITOR — gate failures waiting to become skill edits

The gap this file fixes is the **promotion path, not the logging.** Five pipeline
recommendations from a failed build already existed, already correct, sitting in a project
folder — and stayed unread until a human hand-carried them into a new context document.
Nothing routed a recorded lesson to a skill edit. This file is that route.

Distinct from `LESSONS.md`, which is for post-mortems a human reads on demand. This one is a
**work queue**: every entry under `## Unreviewed` is an edit that has not been made yet.

## What is entry-worthy

Narrow, deliberately: **a named gate was missing, or fired wrong.**

Not entry-worthy: general friction, a fetch that 404'd or got bot-blocked (that belongs in the
relevant registry's `dropped:` or `known_issues:` list, with the probe date), a preference, a
one-off mistake with no rule behind it.

Write an entry the moment you notice, in-session. There is no approval gate on writing —
appending to `## Unreviewed` is free and reversible.

## Entry format

```markdown
### <YYYY-MM-DD> · <skill> · gate-missing | gate-misfired
Project: <name>
What happened: <one line>
Gate that should have fired: <name, or "none exists">
Proposed rule change: <the specific edit, in the specific file>
Cost if unfixed: <how it was caught, or that it wasn't>
```

## The human gate

Moving an entry from `## Unreviewed` to `## Promoted` **is** the gate — there is no separate
approval step. Move it only after the skill is *actually edited*. Preserve the original text
verbatim and append a pointer to the shipped rule; a rewritten entry loses the evidence that
justified the edit.

A growing `## Unreviewed` section is itself the signal that this file is being written to and
not read. That is the intended failure indicator.

---

## Unreviewed

_(empty — both seed entries below were promoted by the change that created this file)_

## Promoted

### 2026-08-19 · design-pick · gate-missing
Project: wholesale-rice-mock
What happened: A palette and display face were picked from real fetched sources, recorded as
binding, and used to build — reproducing the exact "cream + serif + terracotta" combination the
project's own constraints document listed as an AI-slop default to avoid.
Gate that should have fired: none exists — the skill checks provenance (did this come from a
real fetch?) and has no concept of fit (does this match what the project said it must be?).
Proposed rule change: add a `Fit-check:` step and a `Binding: provisional | binding` field to
the `PICKS.md` contract in `design-pick/SKILL.md`; make the check a semantic read, not a string
match; make `design-source` refuse to build from a `provisional` pick.
Cost if unfixed: not caught by any automated step — a human noticed by reading the constraints
document and `PICKS.md` side by side, after the build had shipped.

**Promoted 2026-08-20.** Shipped as the `Fit-check:` / `Binding:` contract in
`design-pick/SKILL.md` and the three-row precedence table in `design-source/SKILL.md`. Full
post-mortem: `LESSONS.md`, "Provenance is not fit".

### 2026-08-20 · design-pick · gate-missing
Project: dev-recipes (this repo)
What happened: `design-pick` was hand-written into `~/.claude/skills/` and never added to
`_claude-config/sync.js`'s tracked list, so it had no backup at all. Seven skills were mirrored;
this was the eighth and was silently absent.
Gate that should have fired: `sync.js`'s refuse-on-missing guard — but that guard only fires for
names already *in* the tracked list. A skill never added is invisible to it.
Proposed rule change: add `design-pick` to the tracked list in `_claude-config/sync.js`. The
residual gap — nothing detects a hand-written skill that was never registered — is noted here
rather than fixed, because the fix (diffing the live directory against the tracked list) would
also flag every vendor-installed skill as missing.
Cost if unfixed: total loss of a hand-written skill on any disk failure or bad `npx skills` run.
Found by reading `sync.js` while designing an unrelated change, not by any check.

**Promoted 2026-08-20.** `design-pick` and `prd-intake` added to the tracked list in
`_claude-config/sync.js`.
````

- [ ] **Step 3: Add `SELF-MONITOR.md` to the START-HERE Files block**

In `E:\dev-recipes\_knowledge\START-HERE.md`, find this line inside the fenced Files block (currently line 27):

```
_knowledge/LESSONS.md            post-mortems and hard-won corrections, read on demand
```

Insert one line immediately after it:

```
_knowledge/SELF-MONITOR.md       gate failures queued for a skill edit — Unreviewed -> Promoted
```

- [ ] **Step 4: Add the honesty rule that says when an entry is written**

Spec §4.6: the rule lives here once, and skills reference it rather than each restating it.

In the `## Honesty rules` section, find the current last bullet (line 60):

```
- Never trust a status line — verify it. `LESSONS.md` records three times this file was wrong.
```

Append one bullet directly after it:

```
- When a gate was missing or fired wrong, write it to `SELF-MONITOR.md` **in the session you noticed** — under `## Unreviewed`, no approval needed. Not for 404s or friction; only for a gate. A lesson nobody routes to an edit is a lesson nobody learns.
```

- [ ] **Step 5: Correct the stale eval-coverage status line**

**Verify before writing — do not copy the spec's number here.** Spec §4.6 says `scenarios/` holds four skills' worth of scenarios. It holds four *directories*, but `scenarios/api-idea-scout/` is **empty**. This is the third instance of the exact failure `LESSONS.md` already records under "Never trust a status line". Confirm the real count yourself:

```bash
cd /e/dev-recipes/_knowledge/evals
for d in scenarios/*/; do echo "$d $(ls -1 "$d" | wc -l)"; done
```

Expected at time of writing: `api-idea-scout/ 0`, `context-brief/ 3`, `design-source/ 3`, `no-ai-slop/ 2` — **3 skills covered, 8 scenarios.** If your count differs, write your count, not this one.

In `START-HERE.md`, replace line 67:

```
- **Layer 4 (evals):** `evals/` — runner + 3 `context-brief` scenarios, all passing. Coverage is 1 of 7 skills. Design, traps, how to add a scenario: `evals/README.md`.
```

with:

```
- **Layer 4 (evals):** `evals/` — runner + 8 scenarios across 3 skills (`context-brief` 3, `design-source` 3, `no-ai-slop` 2). `scenarios/api-idea-scout/` exists but is empty. Design, traps, how to add a scenario: `evals/README.md`. Counted 2026-08-20 — recount before quoting this, it has been wrong before.
```

- [ ] **Step 6: Verify the three edits landed**

```bash
cd /e/dev-recipes/_knowledge
grep -c "SELF-MONITOR.md" START-HERE.md
grep -n "Provenance is not fit" LESSONS.md
grep -n "^## Unreviewed\|^## Promoted" SELF-MONITOR.md
grep -c "Coverage is 1 of 7" START-HERE.md
```

Expected: `2` (Files block + honesty rule); one hit for the LESSONS heading; two hits for the SELF-MONITOR headings; `0` for the removed stale claim.

- [ ] **Step 7: Commit**

```bash
cd /e/dev-recipes
git add _knowledge/LESSONS.md _knowledge/SELF-MONITOR.md _knowledge/START-HERE.md
git commit -m "feat(knowledge): add SELF-MONITOR log, post-mortem, fix stale eval status

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: `design-pick` — structure capture, fit-check, provisional by default

The core change. Edited **live** at `C:\Users\Dell\.claude\skills\design-pick\SKILL.md`, mirrored to the repo in Task 7.

**Files:**
- Modify: `C:\Users\Dell\.claude\skills\design-pick\SKILL.md` — full-file replacement of everything below the frontmatter

**Interfaces:**
- Consumes: `_knowledge/LESSONS.md` (Task 2) as the pointer target for the de-hardcoded origin story.
- Produces: the `PICKS.md` contract that Task 4 (`design-source`) and Task 8 (the eval fixture) both depend on. Exact field names, spelled once here and reused verbatim by both: `Constraints source:`, `Fetched:`, `Options shown:`, `PICKED:`, `Values:`, `Structure:`, `Binding:` (values `provisional` | `binding`), `Fit-check:`, `Override:`.

- [ ] **Step 1: Confirm the file you are about to replace**

```bash
head -6 "/c/Users/Dell/.claude/skills/design-pick/SKILL.md"
wc -l "/c/Users/Dell/.claude/skills/design-pick/SKILL.md"
```

Expected: frontmatter with `name: design-pick`, 140 lines total. If it differs, stop — someone has edited it since this plan was written.

- [ ] **Step 2: Replace the file**

Write the following as the complete new contents of `C:\Users\Dell\.claude\skills\design-pick\SKILL.md`. The frontmatter is unchanged from the current file and is reproduced here so you can write the file in one operation.

````markdown
---
name: design-pick
description: Use before building or redesigning any site or section, before choosing a palette, hero pattern, nav copy, footer, typography, or motion treatment — when that choice would otherwise be invented from memory instead of picked from a real fetched reference. Use when no PICKS.md exists yet for the project, or one exists but has phases not yet marked decided.
---

# design-pick

Upstream of `design-source`. That skill retrieves real component *code* once a
choice is made — this skill makes sure the choice itself came from something
real, **and that it fits what the project said it had to be.**

**Two rules. Both apply to every pick, every time.**

> **Provenance.** Options shown to the user MUST come from a fetch performed in
> *this* session. Assembling an options list from memory is the exact failure
> this skill exists to prevent. If a fetch fails, say so and stop — never
> substitute recalled examples, never fill a gap with "well-known" sites you
> didn't just check.

> **Fit.** A pick that came from a real fetched source can still violate the
> project's own stated constraints, and provenance checking cannot see it.
> Every pick is written `provisional` and fit-checked. Promotion to `binding`
> is a separate, later, deliberate action.

Origin — two failures, one skill. The first build invented a palette and nav
copy from training-data averages because nothing existed to retrieve from; this
skill and its registry are the answer to that. A later build retrieved
everything properly, passed every provenance check, and still shipped the exact
combination its own constraints document banned — because nothing compared the
pick to the constraints. Both post-mortems, with the project names and the
actual values involved, are in `E:\dev-recipes\_knowledge\LESSONS.md`
("Provenance is not fit"). Read it once; the second failure is subtle and the
account is short.

The pattern behind both: the rules already existed and were inert. Invention
happens before any rule can fire, and a fit rule nobody runs is the same as no
rule. This skill removes opportunities, it doesn't add instructions.

Source registry: `E:\dev-recipes\_knowledge\design-picks.yaml` — 11 sections
(palette, hero, footer, typography, nav-copy, cards-products, process-steps,
stats, testimonial, contact, motion), every URL curl-probed and dated. Some
sections are thin (1 dedicated source) — the registry says so; don't treat
thinness as permission to pad the option list with a remembered site.

## Phase 0 — Scope (always runs once per project)

1. Ask client type (store / portfolio / service / coaching / other).
2. Enumerate the sections this specific site actually needs.
3. Classify each: `design-heavy` (needs a pick round) or `structural` (use a
   `design-source` primitive directly, no pick needed).
4. **Resolve the constraints source** (below) and say aloud which one you got.
5. Write the phase list and the resolved constraints source into `PICKS.md` at
   the project root.

The phase list is derived per project — a portfolio and a store produce
different phases. Don't hardcode a fixed 5-phase list.

### Resolving the constraints source

Resolve once, in this order, and **state aloud which source you used**:

1. `DOCS/CONTEXT/PRD.md` → its `Core constraints` and `Non-goals` sections.
2. A root-level constraints document the user names (e.g. `DESIGN-PLAN.md`,
   `BRAND.md`). Ask if you see a plausible candidate; don't adopt one silently.
3. None found → record `Constraints source: NONE FOUND`, say so plainly, and
   carry on. Every pick this session records `Fit-check: NO CONSTRAINTS SOURCE`
   and stays `provisional`.

If no PRD exists and the project is worth one, this is the moment to offer
`prd-intake` — but offer, don't insist, and never block the pick phases on it.

**Never silently proceed as though constraints were checked when no source was
found.** A missing check and a passed check must not look the same downstream.

## Phase N — one per design-heavy section

1. Look up the section in `design-picks.yaml`. Fetch **2-4** of its listed
   sources live (WebFetch/curl) — don't just paste the registry's `why:`
   text, actually open them this session. Present **3-5 concrete options**
   pulled from what you actually opened, not the full registry list.
2. If the section is `moderate` or `thin` in `coverage_summary`, say so before
   presenting options — don't silently present options as if 10 were found.
3. **Capture structure while the fetch is warm.** For each option you present,
   note 2-3 concrete facts about layout/composition/values from the page you
   just opened. Keep them for step 6 — you will write the picked one's facts
   into `PICKS.md`. Do this now, not later: a URL alone cannot be fit-checked,
   and re-deriving structure after the tab is closed means recalling it.
4. Present a compact list — name, URL, one line on how it differs. No
   screenshots, no scoring, no ranking.
5. **STOP. Wait.** Do not proceed, do not suggest a default, do not fill
   silence with a recommendation.
6. Record the pick in `PICKS.md` with `Binding: provisional` — contract below.
7. **Fit-check it** (next section) and write the `Fit-check:` line.

**One phase per stop-and-wait, by default.** Don't bundle two or three
phases' options into a single message just because it's faster — batching
raises the odds the user skims instead of actually browsing each one, which
defeats the point. Exception: batch only when the user explicitly asks for
everything at once, or a phase is trivially small (e.g. a `thin` section with
one source). Even when batched, the wait-for-reply rule still applies to all
of them together — don't record any pick until the user has replied.

## The fit-check — a semantic read, not a string match

Open the constraints source resolved in Phase 0. Read the pick's recorded
`Values:` and `Structure:`. Ask one question:

> Does this pick **instantiate** anything the constraints ban?

Compare at the level of **what the values are**, not what the strings say.
`#DAD7CF` is a cream. `#BE8871` is a terracotta. Fraunces is a serif. A
constraints line banning "cream + serif + terracotta" is violated by that pick
even though not one of those three words appears anywhere in it. No grep
connects them. Only reading does.

**A check that only catches literal repeats will report clean on exactly the
case this step exists to catch.** That is worse than having no check at all,
because it manufactures confidence in the failure. If you find yourself
searching for a word rather than asking what the value is, you are not doing
the fit-check.

Write the result verbatim into the `Fit-check:` line:

| Outcome | Line to write | Then |
|---|---|---|
| No conflict | `Fit-check: <date> vs <path> — clean` | Continue. Pick stays `provisional`. |
| Conflict | `Fit-check: <date> vs <path> — CONFLICT: <what matched what>` | **Say it out loud and stop.** Name both sides. Ask whether the pick is wrong or the constraint is out of date — one of them is. |
| No source found | `Fit-check: NO CONSTRAINTS SOURCE` | Say so plainly. Continue. Pick stays `provisional`. |

A conflict is not automatically the pick's fault. If the constraint is the
thing that's stale, that is a `prd-intake` update, not an override.

## Promotion — the only path from `provisional` to `binding`

**There is no code path that writes `Binding: binding` during Phase N.** Not
when the fit-check comes back clean, not when the user sounds certain, not
when it's the last remaining phase. Promotion is a separate action taken
later, and it needs all three of:

1. The fit-check ran — `Fit-check:` is not `NOT RUN`.
2. The result is `clean`, **or** an `Override:` line exists.
3. The user confirmed **in this session** that the pick is final.

An accepted conflict is recorded, never silent:

```markdown
Fit-check: 2026-08-20 vs DOCS/CONTEXT/PRD.md — CONFLICT: picked palette is a cream + terracotta pairing; Core constraints bans cream/serif/terracotta as an AI-slop default
Override: user wants the terracotta to match the existing packaging
```

`Override:` is written **only from user input, never inferred** — deliberately
the same rule as `PICKED:`, so the contract has one shape, not two. If you are
composing the override reason yourself, you are writing fiction into a record
that other skills treat as authority.

## `PICKS.md` — per-project, resets every build

Lives in the target project root. Read first on any new session; resume at
the first phase not marked `decided`.

```markdown
# PICKS.md
Client type: <type>
Constraints source: <path> | NONE FOUND
Phases: [list, generated in Phase 0]

## Phase 1 — Palette   [status: decided | awaiting-pick | not-started]
Fetched: <date> from <source>
Options shown: <n>
PICKED: <name> — <url>
Values: <hex/oklch etc., copied from the fetched source, never retyped from memory>
Structure: <2-3 facts about layout/composition, captured from the same fetch>
Binding: provisional | binding
Fit-check: NOT RUN | NO CONSTRAINTS SOURCE | <date> vs <path> — clean | <date> vs <path> — CONFLICT: <detail>
```

Rules:

- `PICKED:` and `Override:` are only ever written from user input, never inferred.
- `Values:` are copied from the fetched source, never retyped from memory.
- `Structure:` is captured during the phase's own fetch, while it's warm. It
  exists so the fit-check has something to compare against; a URL alone is not
  checkable.
- `Binding:` is written `provisional` at pick time, always. See Promotion.
- `PICKS.md` resets every new project — exploration is never skipped because a
  past project solved something similar. A repeat is fine as the *outcome* of
  fresh exploration; it is never a shortcut that replaces exploring.

## Shared library — `E:\dev-recipes\_knowledge\shared-picks.yaml`

Separate from `PICKS.md` and never a substitute for Phase N's fresh fetch.

| | `PICKS.md` | `shared-picks.yaml` |
|---|---|---|
| Resets | every project | never — accumulates |
| Covers | every phase | utility-level picks only |
| Eligible | everything | text-reveal animations, hover treatments, easing curves, nav interactions — small, reusable, not identity-defining |
| Never eligible | — | palette, typography system, hero pattern — always explored fresh |

Promotion is manual: propose adding a pick only after it's been independently
chosen (from a fresh fetch) in 2+ projects, or the user says "save this for
reuse." Never auto-add on first use. When Phase N covers a utility-level
section, the option list MAY include shared-library entries alongside the
fresh fetch — labeled as such, never pre-selected, never the default.

## Division of labour

**User does, manually — don't automate:** opening links and looking, judging
fit, pasting back a choice (name or URL is enough), pasting a link they found
themselves (always accepted, overrides the list), confirming a promotion,
stating an override reason.

**Claude does:** the fetches, the compact option list, capturing structure,
recording picks, running the fit-check, later retrieval of real component
source via `design-source`.

**Claude must never:** render/screenshot/"evaluate" references, recommend a
favorite unprompted, proceed on silence, treat a thin registry section as
license to invent the missing options, write `binding` or `Override:` without
the user, or report a fit-check clean on the strength of a string search.

## Handoff

`PICKS.md` complete → build happens in a separate session using
`design-source` against the recorded picks. `design-source` reads `Binding:`:
`binding` entries are authoritative for their section, `provisional` entries
**stop the build** for that section until they're confirmed. Its
`adaptation_checklist` runs unchanged.

If a fit-check turned up a conflict that the user resolved by changing the
constraints rather than the pick, update the constraints document too — a
`PRD.md` that lost an argument and wasn't edited is a `PRD.md` that will lose
the same argument again.

## Rationalizations to reject

| Excuse | Reality |
|---|---|
| "I know a good palette site, I'll just list it" | Not fetched this session = not allowed in the list. Fetch it or drop it. |
| "The user's waiting, I'll suggest the best one" | Proceeding on silence or nudging a favorite is the failure this skill exists to prevent. Stop and wait. |
| "This section only has 1 registry source, I'll add a couple I remember" | A thin section stays thin and gets said out loud. Padding with memory reproduces the original bug. |
| "Palette's basically the same as the last project, I'll reuse it" | Identity-defining picks are never defaulted from a shared library. Fetch fresh; repeating is only valid as an outcome of that fetch. |
| "Close enough, I'll paraphrase what the source said" | Values (hex/oklch/font names) get copied from the fetched source verbatim, not retyped from memory. |
| "I searched the constraints for the color name and found nothing — clean" | That's a grep, not a fit-check. `#DAD7CF` is a cream and the word "cream" is nowhere in it. Read what the value *is*. |
| "Fit-check passed, so I'll mark it binding and save a step" | No path writes `binding` in Phase N. Promotion needs the user, in-session, separately. Skipping it is the ten-second pick becoming authoritative all over again. |
| "There's no PRD here, so there's nothing to check against — moving on" | Record `NO CONSTRAINTS SOURCE` and say it. A missing check that looks like a passed check is how this failed the first time. |
| "The user clearly wants this, I'll write the override reason for them" | `Override:` is user input only. An inferred reason is fiction in a record other skills obey. |
| "It's just for testing, I'll tidy the record later" | "For testing" is not a state the file can represent — that's why everything is `provisional`. Record it properly now; it costs one line. |

## Red flags — stop and restart the phase

- About to write a URL into an option list that wasn't opened this session.
- About to proceed to the next phase without an explicit `PICKED:` from the user.
- About to write "recommended" or similar next to one option.
- About to treat a `shared-picks.yaml` entry as satisfying a palette/hero/typography phase.
- **About to write `Binding: binding` during a phase.**
- **About to record a fit-check as clean when all you did was search for a word.**
- **About to move past a phase where no constraints source was found without saying so out loud.**
- **About to write `Structure:` from what you remember of the page rather than from the fetch.**
````

- [ ] **Step 3: Tier-1 contract assertions (spec §5)**

Mechanical, free, unambiguous pass/fail.

```bash
cd "/c/Users/Dell/.claude/skills/design-pick"
grep -c "^Structure: \|^Binding: \|^Fit-check: " SKILL.md
grep -c "Override:" SKILL.md
grep -c "wholesale-rice-mock\|CLAUDE-CODE-TERMINAL" SKILL.md
grep -n "semantic read, not a string match" SKILL.md
```

Expected: first `grep -c` returns `3` (the three new contract fields, each once in the `PICKS.md` block); `Override:` returns `4` or more; the de-hardcoding check returns **`0`** — no project name, no absolute project path survives; the last grep returns one hit.

If the de-hardcoding check returns anything other than `0`, the D5 constraint is violated — fix it before committing.

- [ ] **Step 4: Commit**

The live skill directory is not in the repo, so there is nothing to `git add` yet — Task 7 mirrors it. Record the checkpoint instead:

```bash
cd /e/dev-recipes
git status --short
```

Expected: nothing. The live edit is real but unmirrored until Task 7; that is the documented one-way sync direction, not a mistake.

---

## Task 4: `design-source` — three-row precedence

Small and independently rejectable: it is the consumer side of Task 3's contract, and the backward-compatibility row is the part that keeps every existing project building.

**Files:**
- Modify: `C:\Users\Dell\.claude\skills\design-source\SKILL.md:20-23`

**Interfaces:**
- Consumes: the `Binding:` field from Task 3's `PICKS.md` contract — values `provisional` and `binding`, exactly those spellings, lowercase.
- Produces: nothing downstream depends on.

- [ ] **Step 1: Confirm the block you are replacing**

```bash
sed -n '18,25p' "/c/Users/Dell/.claude/skills/design-source/SKILL.md"
```

Expected — lines 20-23 are:

```
**If `PICKS.md` exists in the project root** (written by the `design-pick`
skill), its `PICKED:` entries are binding for palette/hero/footer/etc. — use
those values, don't re-decide them here. Only fall back to this skill's own
judgment for sections `PICKS.md` doesn't cover.
```

- [ ] **Step 2: Replace those four lines**

Replace exactly that block with:

```markdown
**If `PICKS.md` exists in the project root** (written by the `design-pick`
skill), read each phase's `Binding:` field before using its `PICKED:` values:

| `Binding:` value | Behavior |
|---|---|
| `binding` | Authoritative for that section. Use those values, don't re-decide them here. |
| `provisional` | **Stop. Do not build that section.** The pick hasn't been confirmed and may not have been fit-checked. Name every phase still awaiting confirmation, in one message, and wait. |
| field absent | Treat as `binding`, and warn **once** that this `PICKS.md` predates the provisional contract. Backward compatibility — do not repeat the warning per section. |

Only fall back to this skill's own judgment for sections `PICKS.md` doesn't
cover at all. A `provisional` entry is not an uncovered section — it is a
covered section that isn't ready, and building it anyway is the failure the
field exists to prevent.
```

- [ ] **Step 3: Tier-1 contract assertion**

```bash
cd "/c/Users/Dell/.claude/skills/design-source"
grep -c "\`binding\`\|\`provisional\`\|field absent" SKILL.md
```

Expected: `3` or more — all three precedence rows present. Then confirm the old absolute claim is gone:

```bash
grep -c "entries are binding for palette/hero/footer" SKILL.md
```

Expected: `0`.

- [ ] **Step 4: Tier-3 backward-compatibility check (spec §5)**

Read the new table back and answer, in one sentence in your report: *a `PICKS.md` with a `PICKED:` line and no `Binding:` line — does the text tell you to build, and to warn exactly once?* If the answer is anything but yes, the third row is wrong. No file is written for this check; it is a read-back, and it is the whole of Tier 3.

- [ ] **Step 5: Checkpoint**

No commit — mirrored in Task 7 with the other skill edits.

---

## Task 5: `prd-intake` skill and the PRD template it fills

Skill and template change together: they define the same document, and a section in one with no counterpart in the other is a bug.

**Files:**
- Create: `C:\Users\Dell\.claude\skills\prd-intake\SKILL.md`
- Modify: `E:\dev-recipes\docs-structure-standard\templates\CONTEXT\PRD.md`

**Interfaces:**
- Consumes: `Fit-check:` and `Override:` from Task 3 — a conflict is one of this skill's update triggers.
- Produces: `DOCS/CONTEXT/PRD.md` with section headings spelled exactly `## What it is`, `## Who it's for`, `## Core constraints`, `## Non-goals`, `## Success criteria`. Task 3's constraints resolver reads `Core constraints` and `Non-goals` by those exact names.

- [ ] **Step 1: Create the skill directory and file**

Write to `C:\Users\Dell\.claude\skills\prd-intake\SKILL.md`:

````markdown
---
name: prd-intake
description: Use at project start, or when a project has decisions but no written statement of what it is and what it must not be — to fill DOCS/CONTEXT/PRD.md by asking, one question at a time, and recording answers verbatim. Also use when a design fit-check conflicts with a stated constraint, when a DECISIONS.md entry contradicts one, or when a consumer hits a `<not stated>` section it needed.
---

# prd-intake

Fills `DOCS/CONTEXT/PRD.md` — the slow-changing truth about what a project is,
who it's for, and what it must not become.

**The one rule:**

> **Never invent a requirement.** If the user didn't say it, it isn't in the
> PRD. Not as a sensible default, not as an obvious implication, not as a
> placeholder that sounds better than a gap.

This is the same disease as an invented palette, one layer up — and it does
more damage, because everything downstream treats the PRD as authority. A
confidently-written PRD nobody actually said is worse than a thin one. A thin
PRD makes its gaps visible; an invented one hides them behind fluent prose.
`design-pick`'s fit-check reads `Core constraints` and `Non-goals` and will
happily block a good pick on a constraint you made up.

## What goes in, and what doesn't

**In — slow-changing truth:** what it is, who it's for, hard constraints,
things it deliberately won't do, what "done well" would mean.

**Not in — anything that moves:** progress, task lists, current blockers,
architecture decisions with reasons. Those already have homes:

| Question | File |
|---|---|
| What is this and what must it not be? | `DOCS/CONTEXT/PRD.md` — this skill |
| Where are we right now? | `DOCS/STATUS.md` |
| Why did we choose X over Y? | `DOCS/DECISIONS.md` |

A PRD that tracks progress duplicates `STATUS.md` and goes stale within a week.
Keep it lean and it stays true for months.

## The intake

**One question at a time.** Not a five-question block — a block gets one
combined answer that covers two fields and silently drops three.

For each section in order:

1. Ask the question.
2. **Wait.** Don't offer a draft answer to react to; a draft you wrote becomes
   the answer, and then it's your requirement, not theirs.
3. Record what they said, in their words. Compress, don't rewrite. If they
   said "cheap as possible, ideally free", that is what goes in — not
   "cost-optimised infrastructure".
4. If they say "I don't know" or skip it, write the literal string
   `<not stated>` and move on. Come back to it later or never.

| Section | Ask |
|---|---|
| What it is | "In a sentence or two — what is this project?" |
| Who it's for | "Who actually uses this? One group, or several?" |
| Core constraints | "What's fixed and non-negotiable? Budget, platform, stack, deadline, anything that's already decided for you." |
| Non-goals | "What should this deliberately *not* do or be? Including any look or approach you want to avoid." |
| Success criteria | "How would you know this worked? What would be true?" |

The `Non-goals` question is the one that pays for this skill. It is where "not
another generic AI-looking landing page" gets written down as something a later
fit-check can actually catch.

## Marking what you inferred

Sometimes you'll know something from the codebase the user never stated — the
stack, the hosting, an existing constraint. That can go in, but it must be
labelled:

```markdown
## Core constraints
- Static-only hosting, no server runtime — *(inferred from the existing Netlify config, not stated)*
- <not stated: budget>
```

Two failure modes, both fatal to the file's usefulness:

- **A plausible fill.** Writing "must be mobile-responsive" because everything
  is. Nobody said it, and now `design-pick` can block a pick on it.
- **A silent inference.** Writing the inferred constraint *without* the label,
  so a later reader can't tell which lines are load-bearing and which are your
  guess.

`<not stated>` is a feature. It's the signal that makes a consumer come back
and ask instead of assuming.

## Keeping it current — no new ritual

There is no "update the PRD" command and no review cadence. Four pre-existing
events trigger an update, and nothing else does:

| Trigger | What to do |
|---|---|
| `design-pick` fit-check reports a `CONFLICT:` | Either the PRD is wrong or the pick is. **Ask which — don't assume the pick loses.** If the constraint is stale, edit it here and note what changed. |
| A `DECISIONS.md` entry contradicts a stated constraint | Same question. A decision that knowingly breaks a constraint means the constraint moved. |
| `/save-check` notices either of the above | Same. |
| A consumer hits a `<not stated>` section it needed | Ask that one question now, fill that one section. Don't reopen the whole intake. |

Each is a real event that already happens. A trigger that needs someone to
*remember* to fire it is not a trigger.

## Rationalizations to reject

| Excuse | Reality |
|---|---|
| "They didn't say it, but it's obviously true" | Then it costs one question. Ask it. Obvious-to-you is where invented requirements come from. |
| "I'll draft it and they can correct it" | They'll accept it. A draft is an answer wearing a question's clothes. |
| "`<not stated>` looks unfinished" | It *is* unfinished, and saying so is the point. A fluent invented paragraph looks finished and is wrong. |
| "I'll ask all five at once, it's faster" | One combined reply covers two sections and drops three, and you won't notice which. |
| "The stack is right there in package.json, I'll just write it" | Write it *labelled inferred*. Unlabelled, a later reader can't tell your guess from their requirement. |
| "The fit-check flagged a conflict, so I'll relax the constraint" | Ask. The pick is wrong at least as often as the constraint is, and silently relaxing constraints turns the PRD into a rubber stamp. |
````

- [ ] **Step 2: Update the PRD template**

Replace the entire contents of
`E:\dev-recipes\docs-structure-standard\templates\CONTEXT\PRD.md` with:

```markdown
# <Project name> — PRD / context

Slow-changing truth about what this project is and why. `/recap` does not re-read
this every session — it's for onboarding and for when the "why" behind something
needs to be looked up.

Filled by the `prd-intake` skill, which asks one question at a time and records
answers verbatim. Anything nobody stated is written as the literal string
`<not stated>` rather than plausibly filled in.

**`Core constraints` and `Non-goals` are load-bearing, not descriptive.**
`design-pick`'s fit-check reads both sections and will block a design pick that
instantiates something they rule out. Edit them knowing something acts on them.

## What it is
<one paragraph>

## Who it's for
<one paragraph or bullets>

## Core constraints
<tech/budget/platform constraints that shape decisions — e.g. "$0 hosting stack",
"must work offline", etc. Mark anything inferred rather than stated: *(inferred)*>

## Non-goals
<what this deliberately will not do or be — including looks and approaches to
avoid. This is the section a design fit-check is most likely to catch something
on, so name aesthetics you want ruled out, not just features.>

## Success criteria
<how you'd know it worked — what would be true. Not a task list; STATUS.md does that.>
```

- [ ] **Step 3: Verify the section headings match on both sides**

The skill and the template must agree exactly, or the fit-check reads a heading that isn't there.

```bash
grep -n "^## " "/e/dev-recipes/docs-structure-standard/templates/CONTEXT/PRD.md"
```

Expected exactly, in order: `## What it is`, `## Who it's for`, `## Core constraints`, `## Non-goals`, `## Success criteria`.

```bash
grep -c "not stated" "/c/Users/Dell/.claude/skills/prd-intake/SKILL.md"
grep -c "Non-goals" "/c/Users/Dell/.claude/skills/prd-intake/SKILL.md"
```

Expected: both non-zero.

- [ ] **Step 4: Commit the template (repo file only)**

```bash
cd /e/dev-recipes
git add docs-structure-standard/templates/CONTEXT/PRD.md
git commit -m "feat(docs-structure): add Non-goals and Success criteria to PRD template

Core constraints and Non-goals are now read by design-pick's fit-check, so the
template says they are load-bearing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

The `prd-intake` skill itself is live-only until Task 7.

---

## Task 6: `design-picks.yaml` — registry vocabularies and de-hardcoded header

**Files:**
- Modify: `E:\dev-recipes\_knowledge\design-picks.yaml` — header block (lines 1-26), a new `conventions:` block, `fetch_order:` on gallery sources, one real `known_issues:` entry

**Interfaces:**
- Consumes: `_knowledge/LESSONS.md` (Task 2) as the pointer target for the de-hardcoded origin.
- Produces: three vocabularies that future registry edits use — `known_issues:` (with `mode`, `date`, `workaround`), `fetch_order:`, `retrieval:` (`fetchable` | `inspiration-only`).

- [ ] **Step 1: Replace the header comment block**

Replace lines 1-26 of `E:\dev-recipes\_knowledge\design-picks.yaml` — everything from `# _knowledge/design-picks.yaml` down to and including `updated: 2026-08-19` — with:

```yaml
# _knowledge/design-picks.yaml — browsable reference registry (Layer 1c)
#
# sources.yaml answers "what is this library's API?"
# design-sources.yaml answers "what does real component CODE look like?"
# This file answers "where does the USER go to pick a real design, so nothing
# gets generated from model memory?"
#
# Origin: a build invented a palette, nav copy, and footer links from
# training-data averages because no source existed to retrieve from. This
# registry is that source. Full post-mortem, with the project and the actual
# values involved, is in LESSONS.md — this file stays GENERIC, scoped to no
# project or client type. The design-pick skill reads it to build a Phase N
# option list; the user browses the links and picks; Claude never renders,
# screenshots, scores, or recommends.
#
# Hard rule this file exists to enforce:
#   Never write a URL into this file from memory without probing it first.
#   A dead or bot-blocked source gets recorded under that section's dropped:
#   list so the next run does not rediscover the same dead end.
#
# Probe convention (same as sources.yaml / design-sources.yaml):
#   curl -s -o /dev/null -w "%{http_code} %{size_download}" -L <url>

version: 1
updated: 2026-08-20
```

- [ ] **Step 2: Insert the `conventions:` block**

Insert this immediately after the `updated: 2026-08-20` line and before the `# ----` comment that introduces `meta_sources:`. Leave a blank line on each side.

```yaml
# ---------------------------------------------------------------------------
# Vocabularies. Defined once here so a later edit cannot invent a fourth way
# of saying "this source is awkward".
# ---------------------------------------------------------------------------
conventions:
  # dropped vs known_issues — the distinction this registry lacked. A source
  # is one or the other, never both.
  dropped: "Never use. Dead, blocked, or wrong. Carries url + reason + probe date."
  known_issues: "Usable, with a documented failure mode. Carries mode + date + workaround."

  # How to open a gallery-type source. Established the hard way: browsing the
  # live site first produced impressions; opening the gallery's own detail page
  # first produced structural facts that a fit-check can actually compare.
  # This was the single change that made the nav phase yield usable data.
  fetch_order:
    detail-page-first: "Open the gallery's own detail/case page first — it carries the structured description. Visit the live site second, as supplement."
    live-site-only: "No detail page exists; the live site is the only artifact."

  # Whether a source can be read by a tool at all, or only by a human eye.
  # No source is tagged inspiration-only yet. The vocabulary exists so a
  # blocked-but-useful source cannot be added later without declaring which
  # kind it is.
  retrieval:
    fetchable: "WebFetch/curl returns usable content."
    inspiration-only: "Human-browsable only — bot-blocked or JS-gated. Never present as fetched."
```

- [ ] **Step 3: Add `fetch_order:` to the two meta-sources**

In the `meta_sources:` list, add one line to each entry, directly above its `verified:` line.

For `unsection` — after the `category_url_pattern:` line, add:

```yaml
    fetch_order: detail-page-first
```

For `onepagelove` — after the `section_url_pattern:` line, add:

```yaml
    fetch_order: detail-page-first
```

- [ ] **Step 4: Add `fetch_order:` to the gallery-browse sections**

Add a `fetch_order: detail-page-first` line at section level — same indentation as that section's `priority:` line, placed directly after it — to exactly these four sections: `hero`, `footer`, `nav-copy`, `testimonial`.

Example, for `hero`:

```yaml
  - id: hero
    priority: 2
    fetch_order: detail-page-first
    targets:
```

Do **not** add it to `palette`, `typography`, `motion`, `cards-products`, `process-steps`, `stats`, or `contact`. Those are generators, tools, and single-source fallbacks — there is no detail page to open first, and tagging them would make the field meaningless.

- [ ] **Step 5: Add the one real `known_issues:` entry**

The `hero` section's `awwwards` target already carries a documented failure mode in its `why:` text — "JS-heavy — Firecrawl may be needed for deep browse". That is precisely `known_issues`: usable, with a failure mode and a workaround. Promote it from prose to structure.

In the `hero` section, after its `dropped:` list and before its closing, add:

```yaml
    known_issues:
      - { id: awwwards, mode: "JS-heavy; deep browse past the first page returns little via WebFetch/curl.", date: 2026-08-19, workaround: "Fetch the site's own detail page for a specific entry rather than paginating the index. Firecrawl (sources.yaml tier 4) only if that fails — it is rationed." }
```

Do not invent `known_issues` entries for any other source. An entry with no probe behind it is exactly the memory-written URL this file's hard rule bans.

- [ ] **Step 6: Verify the YAML still parses and the edits landed**

```bash
cd /e/dev-recipes/_knowledge
node -e "const fs=require('fs');const t=fs.readFileSync('design-picks.yaml','utf8');console.log('lines',t.split('\n').length);console.log('fetch_order',(t.match(/fetch_order:/g)||[]).length);console.log('known_issues',(t.match(/known_issues:/g)||[]).length);console.log('retrieval',(t.match(/retrieval:/g)||[]).length);"
grep -c "wholesale-rice-mock\|PLAN.md (wholesale" design-picks.yaml
```

Expected: `fetch_order` 8 (1 in conventions + 2 meta-sources + 4 sections + the `detail-page-first` key itself is inside conventions so counted there — accept 7 or 8, and confirm by eye that both meta-sources and all four sections carry it); `known_issues` 2; `retrieval` 2; and the de-hardcoding grep returns **`0`**.

There is no YAML parser installed in this repo, so `node -e` above only counts strings. Also eyeball the indentation of every inserted line — a mis-indented YAML key is silent until something reads it.

- [ ] **Step 7: Commit**

```bash
cd /e/dev-recipes
git add _knowledge/design-picks.yaml
git commit -m "feat(design-picks): add known_issues, fetch_order, retrieval vocabularies

De-hardcodes the header origin story to point at LESSONS.md.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: `sync.js` — track the two unmirrored skills, then mirror

`design-pick` has no backup today. That is a live defect, not a nicety: it is hand-written, exists only in `~/.claude/skills/`, and `sync.js`'s refuse-on-missing guard cannot see it because the guard only checks names already in the list.

**This task contains a stop-and-ask gate. Read Step 3 before running anything.**

**Files:**
- Modify: `E:\dev-recipes\_claude-config\sync.js:29-46` (the doc comment and the tracked list)
- Modify (by running the script): `E:\dev-recipes\_claude-config\skills\**`, `commands\**`

**Interfaces:**
- Consumes: `~/.claude/skills/design-pick/` (Task 3) and `~/.claude/skills/prd-intake/` (Task 5) must both exist on disk, or the script aborts with exit 2. That abort is correct behaviour — it means a task was skipped.
- Produces: repo mirror matching live.

- [ ] **Step 1: Update the doc comment and tracked list**

In `E:\dev-recipes\_claude-config\sync.js`, replace lines 25-50 (the block comment starting `/**` through the closing `];` of `GROUPS`) with:

```js
/**
 * `tracked: '*'` mirrors everything in the directory. An explicit list mirrors only those
 * entries, and is used where the live directory also holds things we deliberately skip.
 *
 * ~/.claude/skills holds both hand-written skills and installed ones. Only the 9 below are
 * hand-written. The rest are symlinks to ~/.agents/skills (the `npx skills@latest` pack) and
 * `impeccable`, a vendor install with its own installer — all reinstallable, so mirroring them
 * would duplicate recoverable content and bury the ones that actually matter.
 *
 * `design-pick` was absent from this list until 2026-08-20 and had no backup at all. The
 * refuse-on-missing guard below could not catch that: it only checks names already in the
 * list, so a skill never registered is invisible to it. When you hand-write a new skill, add
 * it here in the same session — see _knowledge/SELF-MONITOR.md for the full entry.
 *
 * commands/ and agents/ hold no symlinks and nothing vendor-installed, so they mirror
 * wholesale. That has a sharp edge: with no name list there is nothing to refuse on, so a
 * deletion in the live directory propagates to the backup on the next sync. Read the --check
 * output before running a real sync.
 */
const GROUPS = [
  {
    dir: 'skills',
    tracked: [
      'animation-ref',
      'api-idea-scout',
      'context-brief',
      'design-pick',
      'design-source',
      'no-ai-slop',
      'no-ai-slop-writing',
      'prd-intake',
      'production-readiness',
    ],
  },
  { dir: 'commands', tracked: '*' },
  { dir: 'agents', tracked: '*' },
];
```

- [ ] **Step 2: Dry-run the sync — write nothing**

```bash
cd /e/dev-recipes/_claude-config
node sync.js --check
```

Exit code 1 with a drift list is the expected result here (exit 0 would mean nothing changed, which would be wrong). Exit **2** means a tracked skill is missing from the live directory — go back and finish Task 3 or Task 5.

- [ ] **Step 3: Four command deletions — RESOLVED, proceed**

`--check` will list, among the adds and updates, these four deletions:

```
  delete commands/bug.md
  delete commands/guide.md
  delete commands/plan.md
  delete commands/test.md
```

These are **not** part of this project. They are four commands that exist in the repo backup and no longer exist in `~/.claude/commands/`. Because `commands/` is mirrored wholesale with no name list, `node sync.js` deletes the backups without refusing — the exact asymmetry `LESSONS.md` records under "A mirror's real failure mode is silent staleness, not loss". That is why this step exists: the script cannot distinguish a deliberate removal from an accidental one.

**Answered 2026-08-20 by the user: all four were deliberately removed** — they were not production-grade and were dropped on purpose. The deletions are correct. Let them propagate; do not restore them, and do not stop here.

Confirm the plan contains *only* those four deletions before running the real sync:

```bash
cd /e/dev-recipes/_claude-config
node sync.js --check | grep "^  delete"
```

Expected: exactly the four lines above, nothing else. **If any other deletion appears, stop and ask** — that one has not been cleared, and a wholesale mirror gives you no second chance at it.

- [ ] **Step 4: Run the real sync**

```bash
cd /e/dev-recipes/_claude-config
node sync.js
node sync.js --check
```

Expected: the first prints `Synced N file(s)`; the second prints `In sync — 3 groups, N files, no drift.` and exits 0. If the second still reports drift, the sync did not do what it claimed — stop and report.

- [ ] **Step 5: Confirm both new skills are actually mirrored**

```bash
ls /e/dev-recipes/_claude-config/skills/
test -f /e/dev-recipes/_claude-config/skills/design-pick/SKILL.md && echo "design-pick OK"
test -f /e/dev-recipes/_claude-config/skills/prd-intake/SKILL.md && echo "prd-intake OK"
```

Expected: nine directories listed, and both `OK` lines print.

- [ ] **Step 6: Update the backup count in START-HERE**

The hand-written skill count changes from 7 to 9. In `E:\dev-recipes\_knowledge\START-HERE.md`, find the line (currently 69) beginning `- **Backed up:**` and replace its final sentence:

```
Hand-written config (7 skills, 10 commands, 5 subagents) mirrors separately via `sync.js`.
```

with:

```
Hand-written config mirrors separately via `sync.js` — run `node sync.js --check` after editing any skill. Counts drift; read the script's tracked list rather than trusting a number here.
```

The old line named "10 commands" while six exist live — the same stale-status failure fixed in Task 2. Removing the numbers is the fix; a number in a status line is a number that will be wrong.

- [ ] **Step 7: Commit**

```bash
cd /e/dev-recipes
git add _claude-config/ _knowledge/START-HERE.md
git commit -m "fix(sync): track design-pick and prd-intake, mirror skill edits

design-pick was hand-written and never registered, so it had no backup at all.
The refuse-on-missing guard cannot catch that — it only checks names already
in the list.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Replay eval — the fit-check catches the banned combination

Tier 2 of spec §5. Replays a failure that actually happened, not a synthetic one.

**Files:**
- Create: `E:\dev-recipes\_knowledge\evals\fixtures\pick-fit-check\DOCS\CONTEXT\PRD.md`
- Create: `E:\dev-recipes\_knowledge\evals\fixtures\pick-fit-check\PICKS.md`
- Create: `E:\dev-recipes\_knowledge\evals\scenarios\design-pick\01-fit-check-catches-banned-combo.json`

**Interfaces:**
- Consumes: the field names from Task 3's contract and the heading names from Task 5's template. The fixture must use them verbatim or the scenario tests nothing.
- Produces: nothing downstream.

**Read `_knowledge/evals/README.md` before starting.** Two of its four recorded lessons apply directly to this scenario and change the assertions from what the spec sketched — see Step 3.

- [ ] **Step 1: Write the fixture's constraints document**

Create `E:\dev-recipes\_knowledge\evals\fixtures\pick-fit-check\DOCS\CONTEXT\PRD.md`. Fixtures are synthetic — this is a plausible small-business site, not a copy of any real project.

```markdown
# Fernhill Pottery — PRD / context

Slow-changing truth about what this project is and why.

## What it is
A one-page site for a small studio pottery, showing the current collection and
how to commission a piece. No cart, no accounts.

## Who it's for
Buyers who already follow the studio on Instagram and want to see the full
range and prices in one place, plus a smaller number of first-time visitors
arriving from search.

## Core constraints
- Static hosting, no server runtime, no build step more complex than Vite
- Must load usably on a 3G connection — the studio's own customers are rural
- One typeface family only; a second web font is out of budget for load time

## Non-goals
- Not an e-commerce store. No cart, no checkout, no accounts.
- Not another site that looks AI-generated. Three combinations in particular
  read as machine defaults right now and are ruled out: cream backgrounds with
  a serif display face and terracotta accents; deep navy with electric-violet
  gradients; pure greyscale with one saturated accent colour.
- No hero video, no parallax, no scroll-jacking.

## Success criteria
- A returning follower can find a piece's price in under ten seconds
- The commission enquiry form is submitted at least twice a week
- Nobody describes it as looking like a template
```

- [ ] **Step 2: Write the fixture's `PICKS.md`**

Create `E:\dev-recipes\_knowledge\evals\fixtures\pick-fit-check\PICKS.md`. Phase 1 is recorded but **not yet fit-checked** — that is the state the scenario asks the skill to act on. The values instantiate the banned combination without naming it.

```markdown
# PICKS.md
Client type: store
Constraints source: DOCS/CONTEXT/PRD.md
Phases: [palette, typography, hero, footer]

## Phase 1 — Palette   [status: decided]
Fetched: 2026-08-20 from colorhunt
Options shown: 4
PICKED: Warm Clay — https://colorhunt.co/palette/dad7cfbe8871a1866f4a3f35
Values: #DAD7CF background, #BE8871 accent, #A1866F secondary, #4A3F35 text
Structure: four-swatch palette shown as equal horizontal bands; the lightest tone
carries the page background and the second is used for buttons and links in the
preview; no dark-mode variant offered
Binding: provisional
Fit-check: NOT RUN

## Phase 2 — Typography   [status: decided]
Fetched: 2026-08-20 from fontpair
Options shown: 3
PICKED: Fraunces + Inter — https://fontpair.co/
Values: Fraunces for display (variable, optical sizing 9-144), Inter for body
Structure: display face set at 3.5rem with tight tracking on the sample hero;
body at 1.0625rem/1.6; pairing shown on a light warm background
Binding: provisional
Fit-check: NOT RUN

## Phase 3 — Hero   [status: not-started]

## Phase 4 — Footer   [status: not-started]
```

- [ ] **Step 3: Write the scenario**

Create `E:\dev-recipes\_knowledge\evals\scenarios\design-pick\01-fit-check-catches-banned-combo.json`.

**Deviation from spec §5, stated for the record.** The spec proposed
`transcript_not_matches` on `Binding: binding`. Do not use that. `evals/README.md` lesson 2 —
"transcript checks can't tell you what the agent chose" — applies exactly: the skill's own
`SKILL.md` is loaded into the transcript and contains the string `Binding: binding` in its
Promotion section, so the assertion would fail no matter what the agent does. Lesson 1 —
"must not mention X is almost always the wrong test" — applies too: a correct answer *will*
say "cream" and "terracotta" while explaining the conflict. The prescription lives in the code
block, which is what `answer_code_not_matches` grades. Assertions below are positive except
that one.

```json
{
  "name": "01-fit-check-catches-banned-combo",
  "skills": ["design-pick"],
  "guards": "The fit-check reported as a string search instead of a semantic read — the exact miss that shipped a real build. The fixture's PRD bans 'cream backgrounds with a serif display face and terracotta accents' in prose; the recorded picks are #DAD7CF, #BE8871 and Fraunces. Not one of the three banned words appears in the PICKS.md entries, so any check implemented as a grep reports clean and promotes the pick. A correct run recognises #DAD7CF as a cream, #BE8871 as a terracotta and Fraunces as a serif, reports the conflict, and leaves both phases provisional. The second failure this guards is promotion-on-clean: nothing in Phase N may write Binding: binding, and a run that resolves the conflict by promoting anyway has reproduced the original bug from the other direction.",
  "query": "Both picks in PICKS.md are recorded but their Fit-check lines still say NOT RUN. Run the fit-check on Phase 1 and Phase 2 and update PICKS.md with the results.",
  "files": [
    "fixtures/pick-fit-check/PICKS.md",
    "fixtures/pick-fit-check/DOCS/CONTEXT/PRD.md"
  ],
  "expected_behavior": [
    "The design-pick skill loads and runs (the runner invokes it explicitly by default, so this checks that it loads — not that it auto-triggers; use --auto-trigger to test triggering)",
    "Reads the constraints from DOCS/CONTEXT/PRD.md — the first entry in the resolution order — rather than asking where constraints live or reporting that none were found",
    "Recognises the recorded hex values and typeface as instances of the banned combination: #DAD7CF is a cream, #BE8871 is a terracotta, Fraunces is a serif display face. The reasoning must connect values to categories, not search for the banned words — none of them appear in PICKS.md",
    "Reports a CONFLICT, naming both sides: which picked values, and which Non-goals line they instantiate",
    "Writes the conflict into the Fit-check: line in the contract's format — a date, the constraints path, and CONFLICT: followed by what matched what",
    "Leaves both phases Binding: provisional. A clean fit-check would not license promotion either, and a conflicting one certainly does not — promotion needs the user, separately, in-session",
    "Does not write an Override: line. No override reason was given, and Override: is user input only — an inferred reason here would be the skill fabricating consent"
  ],
  "assertions": [
    { "covers": 0, "type": "skill_fired", "skill": "design-pick" },
    { "covers": 1, "type": "tool_arg_matches", "tool": "Read", "pattern": "PRD\\.md" },
    { "covers": 3, "type": "answer_matches", "pattern": "CONFLICT" },
    { "covers": 3, "type": "answer_matches", "pattern": "(?i)terracotta" },
    { "covers": 3, "type": "answer_matches", "pattern": "(?i)serif" },
    { "covers": 4, "type": "answer_matches", "pattern": "Fit-check:.*CONFLICT" },
    { "covers": 5, "type": "answer_code_not_matches", "pattern": "Binding:\\s*binding" },
    { "covers": 6, "type": "answer_code_not_matches", "pattern": "Override:" }
  ]
}
```

Checklist items 2 is deliberately left to the judge — whether the reasoning connected values to categories is a matter of substance, and no regex can grade it. Per `evals/README.md`, every item is graded exactly once: by an assertion where one covers it, by the judge otherwise.

- [ ] **Step 4: Validate for free**

```bash
cd /e/dev-recipes/_knowledge/evals
node runner.js --dry-run --skill design-pick
```

Expected: validates the JSON, confirms every `covers` index points at a real `expected_behavior` entry, confirms every assertion `type` is known, and confirms both fixture paths exist. Exit 0. Exit 2 means the scenario is malformed — fix it here; a malformed scenario costs nothing to fix and about a dollar to discover later.

- [ ] **Step 5: Run it once, for real**

```bash
cd /e/dev-recipes/_knowledge/evals
node runner.js --skill design-pick
```

Roughly $0.70–0.90. Exit 0 = pass, 1 = fail, 2 = malformed.

**If it fails, do not immediately edit the scenario to make it pass.** Read the saved report first and decide which of the two it is:

- **The skill genuinely missed the conflict** → that is the eval doing its job. Report it; the fix belongs in `design-pick/SKILL.md` (Task 3), not here.
- **The rubric or a regex is wrong** → fix it, then replay free rather than paying again:
  `node runner.js --scenario 01-fit-check-catches-banned-combo --regrade <timestamp> --no-judge`

Report the actual exit code and the actual per-item results. Do not report "eval passes" without having run it.

- [ ] **Step 6: Commit**

```bash
cd /e/dev-recipes
git add _knowledge/evals/fixtures/pick-fit-check _knowledge/evals/scenarios/design-pick
git commit -m "test(evals): add design-pick fit-check replay scenario

Replays the real miss: a cream/terracotta/serif combination the fixture's own
Non-goals ban, recorded as hex values and a font name that share no substring
with the banned words.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Update the eval coverage line one last time**

Task 2 Step 5 wrote a count. It is now out of date by one skill. In `START-HERE.md`, update that Layer 4 line to reflect `design-pick` 1 — 9 scenarios across 4 skills — and re-run the count command from Task 2 Step 5 to confirm before writing the number.

```bash
cd /e/dev-recipes
git add _knowledge/START-HERE.md
git commit -m "docs(knowledge): recount eval coverage after adding design-pick scenario

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Final verification (run after Task 8, before merging)

- [ ] **All Tier-1 contract assertions, in one pass**

```bash
cd /e/dev-recipes
echo "-- design-pick contract fields (expect 3):"
grep -c "^Structure: \|^Binding: \|^Fit-check: " /c/Users/Dell/.claude/skills/design-pick/SKILL.md
echo "-- design-source precedence rows (expect >=3):"
grep -c "\`binding\`\|\`provisional\`\|field absent" /c/Users/Dell/.claude/skills/design-source/SKILL.md
echo "-- de-hardcoding, both files (expect 0):"
grep -c "wholesale-rice-mock\|CLAUDE-CODE-TERMINAL" /c/Users/Dell/.claude/skills/design-pick/SKILL.md _knowledge/design-picks.yaml
echo "-- mirror in sync (expect exit 0):"
node _claude-config/sync.js --check; echo "exit=$?"
echo "-- PRD template headings (expect 5):"
grep -c "^## " docs-structure-standard/templates/CONTEXT/PRD.md
```

- [ ] **Tier 3, backward compatibility** — confirm by reading `design-source/SKILL.md`'s third precedence row that a `PICKS.md` with no `Binding:` field still builds, with exactly one warning. State the answer in your report.

- [ ] **Report honestly.** Prompt edits have no unit tests. What was actually verified is: the grep assertions above, one eval run with its real exit code, and one read-back. Say that, not "all tests pass".

---

## Self-review

**Spec coverage.** Every numbered section of the spec maps to a task: §3.1 → Task 3; §3.2 → Task 3 (Phase 0 resolver); §3.3 → Task 3 (fit-check section); §3.4 → Task 4; §3.5 → Task 2; §4.1 → Task 3; §4.2 → Task 4; §4.3 → Task 5; §4.4 → Task 6; §4.5 → Task 2; §4.6 → Task 2 + Task 7 Step 6; §4.7 → Task 2 (LESSONS content) + Tasks 3 and 6 (de-hardcoding); §4.8 → Task 7; §4.9 → Task 5; §5 Tier 1 → per-task grep steps + final verification; Tier 2 → Task 8; Tier 3 → Task 4 Step 4 + final verification; §8 workspace notes → Task 1.

**Three deliberate deviations from the spec, each with its reason:**

1. **Constraints source resolved in Phase 0, not per-phase** (Task 3). Spec §3.2 puts resolution inside the fit-check. Resolving once and recording `Constraints source:` in the `PICKS.md` header gives every later phase a stable path and one place to state it aloud, instead of re-deriving per phase. The precedence order is unchanged.
2. **Eval assertions are positive, using `answer_code_not_matches` rather than `transcript_not_matches`** (Task 8 Step 3). Spec §5 sketched `transcript_not_matches` on `Binding: binding`; that string is in the skill's own file and lands in the transcript regardless of behaviour. Reason given inline, citing `evals/README.md` lessons 1 and 2.
3. **`START-HERE.md`'s backup counts are removed rather than corrected** (Task 7 Step 6). The line claimed "10 commands" while six exist live. Correcting a number that has now been wrong twice reproduces the failure; pointing at the tracked list instead does not.

**One finding not in the spec, now resolved:** `node sync.js` will delete four command backups (`bug`, `guide`, `plan`, `test`) that no longer exist live — the wholesale-mirror asymmetry `LESSONS.md` already documents. The user confirmed on 2026-08-20 that all four were deliberately removed, so the deletions are correct and Task 7 Step 3 no longer blocks. The check that survives is narrower and still worth running: **only those four** may appear in the delete plan.

**One correction to the spec, made in-place:** §4.6 states `scenarios/` covers four skills. `scenarios/api-idea-scout/` is empty, so it covers three. Task 2 Step 5 instructs a recount rather than copying either number.

---

## Execution handoff

Two options:

**1. Subagent-Driven (recommended)** — a fresh subagent per task, with review between tasks. Suits this plan: Tasks 2, 6 and 8 are content-heavy and independent, and the two gates (Task 1 Step 3, Task 7 Step 3) are natural review points.

**2. Inline Execution** — `superpowers:executing-plans`, batched with checkpoints.

Tasks must run in order. Task 7 aborts with exit 2 unless Tasks 3 and 5 are done; Tasks 3 and 6 reference content Task 2 creates.
