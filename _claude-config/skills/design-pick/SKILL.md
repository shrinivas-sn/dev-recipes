---
name: design-pick
description: Use before building or redesigning any site or section, before choosing a palette, hero pattern, nav copy, footer, typography, or motion treatment — when that choice would otherwise be invented from memory instead of picked from a real fetched reference. Use when no PICKS.md exists yet for the project, or one exists but has phases not yet marked decided.
---

# design-pick

Upstream of `design-source`. That skill retrieves real component *code* once a
choice is made — this skill makes sure the choice itself came from something
real, **and that it fits what the project said it had to be.**

**Two rules. Both apply to every pick, every time.**

> **Provenance.** Options shown to the user MUST trace to something real —
> never invented from memory. Default: hand over the registry's own
> pre-verified links (curl-probed and dated) for the user to browse
> themselves — that probe record *is* the provenance, no re-fetch needed to
> show the list. The "fetched this session" bar only applies when Claude
> itself must extract options on the user's behalf, because a source is
> broken or JS-gated (see Phase N fallback) — those substitute picks must
> come from a fetch performed in *this* session. Never fill a gap with
> "well-known" sites that were neither in the registry nor just fetched.

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

**Default path — hand over the sources, don't pre-pick from them:**

1. Look up the section in `design-picks.yaml`. Present its **full listed
   source set** as the option list — name, URL, the registry's own `why:`
   line, verbatim. **Render each entry as a clickable markdown link
   `[name](url)`** — not a bare/plain-text URL — so the user can click
   straight through. Don't open the links yourself first, don't narrow to a
   subset, don't rank. The user browses and looks, not you.
2. If the section is `moderate` or `thin` in `coverage_summary`, say so before
   presenting — don't let a short list read as if you filtered it down.
3. **STOP. Wait.** Do not proceed, do not suggest a default, do not fill
   silence with a recommendation. The user reports back a pick — a name/URL
   from the list, or a link they found themselves (always accepted).
4. **Once picked**, fetch that specific page yourself, this session, to
   capture `Values:` (hex/oklch/font names, copied verbatim) and `Structure:`
   (2-3 facts about layout/composition) for the record. This is the one fetch
   this skill does per phase in the default path, and it happens *after* the
   pick, not before — a URL alone can't be fit-checked.
5. Record the pick in `PICKS.md` with `Binding: provisional` — contract below.
6. **Fit-check it** (next section) and write the `Fit-check:` line.

**Fallback path — only when the default path actually breaks:**

- A registry source is down or bot-blocked (matches its `dropped:` list, or a
  probe this session confirms it's newly broken) — say so, then fetch **2-4**
  alternate sources yourself this session and present a **3-5 option**
  shortlist extracted from what you opened. Label it plainly as narrowed by
  Claude because the normal source was inaccessible — this is the exception,
  not the template for how Phase N usually runs.
- After a pick, your step-4 fetch of the picked page also fails — say so and
  ask the user to paste back the concrete values themselves rather than
  guessing at them.

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
Mobile: NOT RUN | <date> — pass | <date> — FAIL(<n> blockers, <n> majors) — see MOBILE.md
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

**User does, manually — don't automate:** opening the registry's links and
browsing the full source set, judging fit, pasting back a choice (name or URL
is enough), pasting a link they found themselves (always accepted, overrides
the list), confirming a promotion, stating an override reason.

**Claude does:** presenting the registry's source list as-is, the one
after-the-pick fetch to capture values/structure, recording picks, running
the fit-check, later retrieval of real component source via `design-source`.
Pre-fetching and narrowing the list is fallback-only work, done when a source
is actually broken — not the default.

**Claude must never:** render/screenshot/"evaluate" references, recommend a
favorite unprompted, proceed on silence, pre-filter or rank the registry list
when nothing is broken, treat a thin registry section as license to invent
the missing options, write `binding` or `Override:` without the user, or
report a fit-check clean on the strength of a string search.

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

Every design-heavy phase carries a `Mobile:` line in `PICKS.md`, written by
the `mobile-check` skill after the section is built:

```
Mobile: NOT RUN | <date> — pass | <date> — FAIL(<n> blockers, <n> majors) — see MOBILE.md
```

`NOT RUN` is the default and is never overwritten by anything except a real
probe run. A phase is not shippable while its `Mobile:` line reads `NOT RUN`
or `FAIL(...)` with any blocker.

## Rationalizations to reject

| Excuse | Reality |
|---|---|
| "I know a good palette site, I'll just list it" | Not in the registry and not fetched this session = not allowed in the list. |
| "I'll open a few of these first and only show the good ones" | That's pre-picking on the user's behalf. Default path hands over the full registry list untouched; narrowing is fallback-only, for a source that's actually broken. |
| "The user's waiting, I'll suggest the best one" | Proceeding on silence or nudging a favorite is the failure this skill exists to prevent. Stop and wait. |
| "This section only has 1 registry source, I'll add a couple I remember" | A thin section stays thin and gets said out loud. Padding with memory reproduces the original bug. |
| "Palette's basically the same as the last project, I'll reuse it" | Identity-defining picks are never defaulted from a shared library. Fetch fresh; repeating is only valid as an outcome of that fetch. |
| "Close enough, I'll paraphrase what the source said" | Values (hex/oklch/font names) get copied from the fetched source verbatim, not retyped from memory. |
| "I searched the constraints for the color name and found nothing — clean" | That's a grep, not a fit-check. `#DAD7CF` is a cream and the word "cream" is nowhere in it. Read what the value *is*. |
| "Fit-check passed, so I'll mark it binding and save a step" | No path writes `binding` in Phase N. Promotion needs the user, in-session, separately. Skipping it is the ten-second pick becoming authoritative all over again. |
| "There's no PRD here, so there's nothing to check against — moving on" | Record `NO CONSTRAINTS SOURCE` and say it. A missing check that looks like a passed check is how this failed the first time. |
| "The user clearly wants this, I'll write the override reason for them" | `Override:` is user input only. An inferred reason is fiction in a record other skills obey. |
| "It's just for testing, I'll tidy the record later" | "For testing" is not a state the file can represent — that's why everything is `provisional`. Record it properly now; it costs one line. |
| "The section looks fine in the browser at desktop width, mobile's probably fine" | `Mobile:` is written from a measured probe or it stays `NOT RUN`. An impression is not a measurement. |

## Red flags — stop and restart the phase

- About to write a URL into an option list that's neither in the registry nor opened this session.
- About to pre-filter or shortlist the registry's list when no source is actually broken.
- About to proceed to the next phase without an explicit `PICKED:` from the user.
- About to write "recommended" or similar next to one option.
- About to treat a `shared-picks.yaml` entry as satisfying a palette/hero/typography phase.
- **About to write `Binding: binding` during a phase.**
- **About to record a fit-check as clean when all you did was search for a word.**
- **About to move past a phase where no constraints source was found without saying so out loud.**
- **About to write `Structure:` from what you remember of the page rather than from the fetch.**
