---
description: One-time, non-destructive migration of DOCS/ into the standard structure
---
Migrate this project's `DOCS/` (or equivalent scattered status/context files) into the
canonical structure defined at `E:\dev-recipes\docs-structure-standard\README.md`,
using the templates in `E:\dev-recipes\docs-structure-standard\templates\`.

This is a one-time reorganization. Never delete data by default.

1. **Survey** — find everything that could hold project status/context/history:
   `DOCS/` in any current shape, loose `PROJECT-STATUS.md`/`TODO.md`/`README.md`
   at the repo root, etc.
2. **Propose a mapping** — old path(s) → new path, before touching anything:
   - Same-date `PLANS/<date>-PLAN.md` + `EXECUTIONS/<date>-EXECUTION.md` pairs merge
     into `WORK/<date>/WORK.md` (`## Plan` section = old plan content verbatim,
     `## Execution` section = old execution content verbatim — never drop either side).
   - Context/PRD-ish docs → `CONTEXT/`.
   - External references/vendor docs/spike notes → `RESEARCH/`.
   - A running status file → `STATUS.md`.
   - Anything that doesn't clearly fit → `EXTRA/` (this is the zero-loss catch-all,
     not a place things go to be forgotten — mention what landed there and why).
   - Generate `DOCS/README.md` (the index) from the merged `WORK/` files: one row per
     day, inferring `Summary` from the file, defaulting `Status` to `done` and
     `Load-bearing` to `yes` unless the content clearly says otherwise — flag these as
     defaults you're not fully sure of so the user can correct them.
   - **Date format:** all human-facing dates you write (README.md table rows, WORK.md
     title lines) are **DD/MM/YYYY** — the user is India-based. `WORK/<date>/` folder
     names stay YYYY-MM-DD regardless (needed for correct sort order on disk and in
     `git log`) — never rename the folder to match the display format. Never rewrite
     dates inside verbatim-preserved historical content (old plan/execution bodies) —
     this rule only applies to new material you're generating.
3. **Flag anything you think is safe to remove** (exact duplicate content, empty
   template stubs, dead placeholder text) as a separate list — proposed, not done.
   Default to keeping everything; only list something for removal if you're
   confident it carries zero information, and explain why in one line each.
4. **Show the full proposed mapping (and any removal candidates) and stop.** Wait for
   confirmation before moving or deleting a single file.
5. **On confirmation**, execute: `git mv` for tracked files where possible (keeps
   history, reversible), write the merged `WORK.md` files and `DOCS/README.md`,
   only delete what the user explicitly approved from the removal list.
6. Add `<!-- docs-structure: v1 -->` as the first line of the new `DOCS/README.md` so
   `/recap` recognizes this project as conforming going forward.

Report what moved, what merged, and what (if anything) was removed, in a short list.
