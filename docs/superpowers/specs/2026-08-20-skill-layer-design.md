# Skill-layer: pick fit-check, living PRD, self-monitor — design

**Date:** 2026-08-20
**Status:** approved in brainstorm, pending user review of this document
**Implements:** the two items in `E:\SKILL-BUILD-prd-and-designpick\CONTEXT.md`, plus a
third mechanism (self-monitor) proposed during brainstorming.

---

## 1. The problem

Three defects, one root cause: **a choice can become binding build input without anything
checking it against the project's own rules.**

### 1.1 Observed failure (the case this design argues from)

A site build used the anti-slop pipeline end to end and still shipped the exact combination
the project's own constraints document banned. The constraints doc named
"cream + serif + terracotta" as one of three AI-slop defaults to avoid. The recorded picks
were a cream/terracotta palette plus a serif display face — chosen quickly, described by the
builder as "for testing," never evaluated against the constraints.

Nothing caught it. `design-source`'s precedence rule
(`~/.claude/skills/design-source/SKILL.md:20-23`) makes `PICKS.md` entries **binding**, so a
ten-second exploratory pick automatically outranked the document that banned it. A human
reading both files side by side was the only detector.

### 1.2 Why the existing rules could not fire

`design-pick` verifies **provenance** — that an option came from a fetch performed this
session. It has no concept of **fit**. Both properties are necessary: a real fetched source
that violates the brief is still wrong, and provenance checking cannot detect it.

### 1.3 The second-order problem

The natural place to record "what this project must not be" is a constraints document. The
`docs-structure-standard` already defines one — `DOCS/CONTEXT/PRD.md`, with a
**Core constraints** section. But that standard also states `/recap` does not re-read it. A
document nothing reads is a document that goes stale. The PRD slot exists and is inert.

### 1.4 The third-order problem

The five pipeline recommendations produced by the failed build sat unread in a project folder
until a human hand-carried them into a new context document. Nothing routed a recorded lesson
to a skill edit. **The gap is the promotion path, not the logging** — the log already existed
and already worked.

---

## 2. Decisions

| # | Decision | Rejected alternative and why |
|---|---|---|
| D1 | **Loose interlock.** `design-pick` resolves constraints by precedence, degrading gracefully when none exist. | Hard-coupling to `PRD.md` would break `design-pick` on every project that has no PRD, including existing ones. |
| D2 | **Provisional by default.** Every pick is written non-binding; promotion requires a clean fit-check plus explicit user confirmation. | Opt-in `test-pick` flagging asks the person in a hurry to flag exactly the hasty pick they did not stop to think about. That is the failure mode, not a fix for it. |
| D3 | **Lean PRD, contradiction-triggered.** PRD holds slow-changing truth only. `STATUS.md` and `DECISIONS.md` keep their current jobs. | A PRD that tracks progress duplicates `STATUS.md`, forcing changes to `/recap`, `/save-check`, and the docs standard for no gain. |
| D4 | **One central `SELF-MONITOR.md`**, two sections, Unreviewed → Promoted. | Per-session staging reintroduces the promotion step that already failed once. Per-skill files churn the `sync.js` mirror and have no home for cross-skill lessons. |
| D5 | **No project names in shipped skill logic** — only as log data. | Two files currently violate this (§4.7). |
| D6 | **Build-log rec #1 folded into core scope.** | A pick recorded as only a URL cannot be fit-checked; structural capture is load-bearing for D2, not an optional extra. |

---

## 3. Contracts

### 3.1 `PICKS.md` phase entry — two new fields

```markdown
## Phase 1 — Palette   [status: decided | awaiting-pick | not-started]
Fetched: <date> from <source>
Options shown: <n>
PICKED: <name> — <url>
Values: <hex/oklch etc., copied from the fetched source, never retyped from memory>
Structure: <2-3 facts about layout/composition, captured from the same fetch>
Binding: provisional | binding
Fit-check: NOT RUN | NO CONSTRAINTS SOURCE | <date> vs <path> — clean | <date> vs <path> — CONFLICT: <detail>
```

**Invariants:**

- `Binding:` is written as `provisional` at pick time. **There is no code path that writes
  `binding` during Phase N.** Promotion is a separate, later action.
- Promotion to `binding` requires all three: fit-check ran, result is `clean` or an
  `Override:` line exists, and the user confirmed in this session.
- An accepted conflict is recorded, never silent:

```markdown
Fit-check: <date> vs <path> — CONFLICT: <what matched what>
Override: <user's stated reason>
```

- `Override:` is written **only from user input, never inferred** — deliberately the same
  rule shape as the existing `PICKED:` rule, so the contract has one form, not two.
- `Structure:` is captured during the Phase N fetch, while it is warm. It exists so the
  fit-check has something to compare; a URL alone is not checkable.

### 3.2 Constraints-source resolution order

`design-pick` resolves in this order and **states aloud which source it used**:

1. `DOCS/CONTEXT/PRD.md` → the `Core constraints` and `Non-goals` sections
2. A root-level constraints document the user names (e.g. `DESIGN-PLAN.md`)
3. None found → record `Fit-check: NO CONSTRAINTS SOURCE`, say so plainly, pick stays
   `provisional`

Never silently proceed as though constraints were checked when no source was found.

### 3.3 What the fit-check actually is

**It is a semantic read, not a string match, and the skill must say so.**

The banned pattern was "cream+serif+terracotta". The pick was `#DAD7CF` + `#BE8871` +
Fraunces. No grep connects those. The check reads the constraints, reads the recorded
`Values:` and `Structure:`, and states whether the pick **instantiates** anything the
constraints ban.

Failure mode to guard against: a check that only catches literal repeats will report clean on
the exact case this design exists to catch, which is worse than no check because it
manufactures false confidence. The skill text must instruct comparison at the level of what
the values *are* (a cream, a terracotta, a serif), not the level of the strings.

### 3.4 `design-source` precedence — replaces `SKILL.md:20-23`

| `Binding:` value | Behavior |
|---|---|
| `binding` | Binding for that section — current behavior, unchanged |
| `provisional` | **Stop.** Do not build that section. Name the phases needing confirmation. |
| Field absent | Treat as binding, warn once — backward compatibility for `PICKS.md` files predating this contract |

The third row is required. Existing projects must not break on a contract they predate.

### 3.5 `SELF-MONITOR.md` entry contract

Entry-worthy is narrow: **a named gate was missing, or fired wrong.** Not general friction,
not fetch failures (those belong in the registry, §4.4), not preferences.

```markdown
### <date> · <skill> · gate-missing | gate-misfired
Project: <name>
What happened: <one line>
Gate that should have fired: <name, or "none exists">
Proposed rule change: <the specific edit, in the specific file>
Cost if unfixed: <how it was caught, or that it wasn't>
```

Two sections: `## Unreviewed` (appended in-session, no gate) and `## Promoted` (moved by a
human after the skill is actually edited, original text preserved verbatim, with a pointer to
the shipped rule). The Unreviewed → Promoted move **is** the human gate; there is no separate
approval step.

---

## 4. Per-file changes

Eight files, plus one eval scenario and one new fixture.

### 4.1 `~/.claude/skills/design-pick/SKILL.md` — modify

- Phase N gains a fetch-time `Structure:` capture step (D6).
- Phase N gains the fit-check step: resolve constraints (§3.2), compare semantically (§3.3),
  write the `Fit-check:` line, leave `Binding: provisional`.
- New section documenting the promotion action (what confirms a pick to `binding`).
- `PICKS.md` contract block updated to §3.1.
- Rationalizations table gains rows for the new failure modes: treating a fit-check as a grep;
  writing `binding` at pick time; proceeding when no constraints source was found.
- Red-flags list gains: about to write `Binding: binding` in Phase N.
- Origin paragraph de-hardcoded (§4.7).

### 4.2 `~/.claude/skills/design-source/SKILL.md` — modify

Replace the precedence rule at `:20-23` with §3.4's three-row behavior, including the
backward-compatibility row.

### 4.3 `~/.claude/skills/<prd-skill>/SKILL.md` — create

**Name:** open, pending user choice. Working name `prd-intake`.

Fills `DOCS/CONTEXT/PRD.md`. Sections: `What it is` / `Who it's for` / `Core constraints` /
`Non-goals` (new) / `Success criteria` (new).

**The central rule — it must not invent requirements.** This is the same disease as the
invented palette, one layer up: a confidently-written PRD nobody actually said is worse than a
thin one, because everything downstream then treats it as authority. Therefore:

- Asks one question at a time; records answers verbatim.
- Anything Claude inferred is explicitly marked as inferred.
- Unanswered sections are written as literal `<not stated>`, never plausibly filled.

**Update triggers — all pre-existing events, no new command, no new ritual:**

- A fit-check conflict — either the PRD is wrong or the pick is wrong; ask which.
- A `DECISIONS.md` entry that contradicts a stated constraint.
- `/save-check` noticing either of the above.
- A consumer reading the PRD and hitting a `<not stated>` section it needed.

### 4.4 `_knowledge/design-picks.yaml` — modify

- **`known_issues:` per target** (build-log rec #5). Extends the existing `dropped:` pattern
  with a distinction it currently lacks: `dropped` = never use; `known_issues` = usable, with
  a documented failure mode and workaround. Fields: `mode`, `date`, `workaround`.
- **`fetch_order:` on gallery-type sources** (rec #2): detail page first, live site as
  supplement. This is the recommendation with the strongest evidence — it was the only thing
  that made the nav phase produce usable structural data.
- **`retrieval:` vocabulary** (rec #3): `fetchable` | `inspiration-only`. No source is tagged
  `inspiration-only` yet; the vocabulary exists so a blocked source cannot be added untagged
  later.
- Header de-hardcoded (§4.7).

### 4.5 `_knowledge/SELF-MONITOR.md` — create

Per §3.5. Seeded with the entries this design already earned, written in the entry format:
the fit-check gap, and `design-pick` being absent from the `sync.js` tracked list (§4.8).

### 4.6 `_knowledge/START-HERE.md` — modify

- Add `SELF-MONITOR.md` to the Files block.
- Add one line to the honesty rules stating when an entry is written. The rule lives here
  once; skills reference it rather than each restating it.
- **Correct a stale status line.** `Status` claims eval "coverage is 1 of 7 skills." The
  `scenarios/` directory currently holds `api-idea-scout`, `context-brief`, `design-source`,
  and `no-ai-slop`. This is exactly the "never trust a status line — verify it" failure that
  `LESSONS.md` already records three instances of.

### 4.7 `_knowledge/LESSONS.md` — modify

Receives the de-hardcoded post-mortem: the full account of the observed failure (§1.1),
including project name and paths, which is appropriate here because this file is explicitly
the home for project-specific post-mortems.

**De-hardcoding targets (D5):**

- `design-pick/SKILL.md:21-22` — hardcodes an absolute project path in its Origin section.
- `design-picks.yaml:8-14` — header describes its own origin in terms of one project.

Both keep the *reason* the rule exists (origin stories make rules stick) but drop project
names and absolute paths, pointing to `LESSONS.md` for the full account.

### 4.8 `_claude-config/sync.js` — modify

**Live defect, discovered during this design.** The tracked skills list contains
`animation-ref`, `api-idea-scout`, `context-brief`, `design-source`, `no-ai-slop`,
`no-ai-slop-writing`, `production-readiness`. **`design-pick` is absent** — it is
hand-written, lives only in `~/.claude/skills/`, and has no mirror. `LESSONS.md` warns that a
mirror's real failure mode is silent staleness; this is worse, it is silent absence.

Add `design-pick` and the new PRD skill to the tracked list.

### 4.9 `docs-structure-standard/templates/CONTEXT/PRD.md` — modify

Add `Non-goals` and `Success criteria` sections. Add one line noting that `Core constraints`
and `Non-goals` are read by `design-pick`'s fit-check — so a future editor knows the section
is load-bearing and not merely descriptive.

---

## 5. Verification

Prompt edits have no unit tests. Claiming "tests pass" would be a lie. Two real tiers:

### Tier 1 — contract assertions (mechanical, free, deterministic)

Grep the edited files for the strings the contract requires. Runnable by any executor,
including a cheap model, with an unambiguous pass/fail. Covers: `PICKS.md` block contains all
of `Structure:` / `Binding:` / `Fit-check:`; `design-source` contains all three precedence
rows; no absolute project path remains in either de-hardcoded file.

### Tier 2 — replay eval (behavioral)

One new scenario at `_knowledge/evals/scenarios/design-pick/01-fit-check-catches-banned-combo.json`,
with a fixture project whose constraints document bans a named combination and whose
`PICKS.md` records values instantiating it. This replays a failure that actually happened
rather than a synthetic one.

**Design constraint carried from `evals/README.md`'s lesson #1:** *"Must not mention X is
almost always the wrong test"* — a correct answer names the wrong approach in order to warn
against it. The correct fit-check output **will** contain "cream" and "terracotta" while
explaining the conflict. Therefore the assertions must be **positive**:

- `answer_matches` on the conflict being reported
- `transcript_not_matches` on `Binding: binding` — the pick must not be promoted

Run: `node runner.js --skill design-pick`. Validate free first with `--dry-run`; `--no-judge`
gives mechanical checks at no judge cost. Exit `0` = pass, `1` = fail, `2` = malformed.
Budget roughly $0.70–0.90 per graded run.

### Tier 3 — backward compatibility

A `PICKS.md` with no `Binding:` field still builds, with exactly one warning (§3.4 row 3).

---

## 6. Out of scope

Deliberately deferred, with reasons:

- **`/recap` reading `PRD.md`** — a different blast radius (`docs-structure-standard` plus
  two commands), and D3's lean-PRD choice does not require it.
- **Eval coverage beyond the one replay scenario** — `evals/README.md` names two unresolved
  design gaps (no baseline arm; `skill_fired` only gradable under `--auto-trigger`). Widening
  coverage should follow resolving those, not precede it.
- **CodePen retrieval** beyond the `retrieval:` vocabulary — no CodePen entries exist in the
  registry to tag.
- **The `PLAN.md` phased-resume idea** raised during brainstorming — investigated and found
  already provided by `writing-plans` (no-placeholder standard, Interfaces block),
  `subagent-driven-development` (Model Selection §, per-task briefs), and the SDD ledger
  (`Task <N>: complete` lines, resume at first task without one). No new artifact needed.

---

## 7. Risks and known limitations

| Risk | Mitigation |
|---|---|
| The fit-check is a judgment call and can miss a conflict, or invent one. | §3.3 makes the semantic requirement explicit in skill text; the Tier 2 eval replays the known miss. It reduces the failure rate; it does not eliminate it. |
| `provisional` adds a confirmation step per phase — friction on the happy path. | Accepted deliberately. The friction lands on promotion, which is where the cost of being wrong is highest. |
| `SELF-MONITOR.md` could become another write-only file. | The Unreviewed/Promoted split makes staleness visible: a growing Unreviewed section is itself the signal. This is a mitigation, not a guarantee — it depends on a human reading it. |
| Skill edits are live-first, mirrored second, so a crash between edit and `sync.js` leaves the mirror stale. | Run `sync.js --check` after skill edits, per `LESSONS.md`. |

---

## 8. Execution notes

- **Repo:** `E:\dev-recipes` (has a remote). `E:\SKILL-BUILD-prd-and-designpick` is not a
  repo and is not the workspace.
- **Pre-existing uncommitted work** exists on `main`: a coherent DD/MM/YYYY display-date
  change across three `docs-structure-standard` files, and two untracked `no-ai-slop` eval
  scenarios with fixtures. Both look complete and are unrelated to this work. Commit or stash
  them on `main` **before** branching, or they will bleed into this branch's first `git add`.
- **Sync direction is one-way, live → repo** (`sync.js:9`). The three skill files are edited
  in `~/.claude/skills/`, then mirrored. The other five targets live in the repo directly.
- **Model split:** per `subagent-driven-development:210-214`, cheap-tier implementers are
  correct **only** where the plan text carries the complete content to write. The plan must
  therefore contain final text for every skill edit, not descriptions of edits.
