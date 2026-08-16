# docs-structure-standard

A canonical `DOCS/` folder layout used across all projects, designed so `/recap` can
reorient at the start of any session cheaply (a handful of small reads, not a folder
crawl) without ever silently dropping historical context that still matters.

Paired commands: `~/.claude/commands/recap.md` (reads this structure, falls back
gracefully when a project doesn't have it yet) and `~/.claude/commands/docs-restructure.md`
(one-time, non-destructive migration of an existing DOCS folder into this shape).

## Structure

```
DOCS/
  README.md              # the index — recap's primary read. One row per WORK day-folder.
  STATUS.md               # evergreen "where things stand", updated in place each session
  CONTEXT/
    PRD.md                 # what the product is, for humans/onboarding (not re-read every recap)
    DECISIONS.md            # append-only one-liner architecture/product decisions log
  WORK/
    2026-06-12/
      WORK.md               # that day's plan + what actually happened, merged
      (any other artifacts from that session)
  RESEARCH/                # external references, vendor docs, spike notes
  EXTRA/                   # catch-all for anything that doesn't fit elsewhere — never delete into the void, put it here
```

A folder is only created when a session produces real, work-worth-logging output —
no empty placeholder folders per day.

## Why one file per day instead of PLANS/ + EXECUTIONS/

The most useful thing in a day's log is usually the *delta* between what was planned
and what actually happened. Splitting that across two folders means recap (or you)
has to open two files and mentally diff them. One `WORK.md` per day with `## Plan`
and `## Execution` sections keeps that delta in one place.

## The continuity problem, and how this solves it

Reading only "the latest" dated file is lossy — an older day's work can still
constrain or explain what you're doing now. The fix is not "read everything," it's
"know what's relevant without opening it."

`DOCS/README.md` is a table, one row per WORK day-folder:

| Date | Summary | Status | Load-bearing | Touches | Continues |
|---|---|---|---|---|---|
| 2026-06-12 | Reworked reminder cron reliability | done | yes | `src/routes/api/cron`, `.github/workflows` | — |
| 2026-06-14 | Added daily digest push | done | yes | `src/routes/api/cron` | 2026-06-12 |

- **Status**: `active` \| `done` \| `superseded` \| `abandoned`
- **Load-bearing**: still constrains current architecture/behavior — worth opening
  when touching related code, even if old
- **Touches**: rough paths/areas the session changed
- **Continues**: points at an earlier date when a work item spans multiple sessions,
  so recap follows the thread instead of treating them as unrelated

Recap's baseline read is `STATUS.md` + `README.md` (the table, not the day files) +
`git status --short` + `git log -8 --oneline`. It only opens a specific day's
`WORK.md` when that row is `load_bearing: yes` **and** its `Touches` overlaps paths
in the current git status or recent commits. Relevance is computed from the index
row, never from reading file bodies — so cost stays flat no matter how many days
accumulate.

Because `README.md` is just a table, it's cheap to keep it hand-updated in place
(same pattern as `STATUS.md`) — no generator step required, though one could
regenerate it from per-file frontmatter later if it drifts.

## Conformance marker

`DOCS/README.md` starts with `<!-- docs-structure: v1 -->`. `/recap` checks for this
one line to know whether a project follows this standard. If it's missing, recap
still recaps (best-effort from whatever exists), then appends one line suggesting
`/docs-restructure`. It never blocks on non-conformance.

## Restructuring an existing project

Never destroys data. `/docs-restructure` proposes an old-path → new-path mapping
(merging same-date PLAN+EXECUTION pairs, moving loose files into the closest
matching category or `EXTRA/` if nothing fits), shows it to you, and only moves
files (via `git mv` where tracked) after you confirm. Content is preserved verbatim
inside merged files. It will only ever *propose* removing something (e.g. an empty
template stub, an exact duplicate) — always calls it out explicitly and defaults to
keeping it if there's any doubt.

## Rollout

New projects start with this structure from day one. Existing projects are left
alone until you're actually working in them again — `/recap` flags non-conformance
at that point rather than something retrofitting every project up front.
