---
description: Quick project recap — status, pending, next steps
---
Reconstruct where this project currently stands so we can continue quickly. Don't write a PR description.

Structure spec this checks against: E:\dev-recipes\docs-structure-standard\README.md

1. Check for `DOCS/README.md` starting with `<!-- docs-structure: v1 -->`.
   - **Conforming**: read `DOCS/README.md` (the index table) and `DOCS/STATUS.md`. For any row marked `load_bearing: yes` whose `Touches` overlaps paths from step 2, open that specific `WORK/<date>/WORK.md` — otherwise don't open day files at all. Follow `Continues` links to treat multi-day work as one thread.
   - **DOCS exists but not conforming**: best-effort recap from whatever's there (e.g. legacy `PROJECT-STATUS.md`, newest files in `PLANS/`/`EXECUTIONS/`) — then note at the end that DOCS isn't in the standard structure and suggest running `/docs-restructure`.
   - **No DOCS folder**: check other project files that could hold status/context — README, TODO files, memory files, recent commit messages. If nothing useful is found anywhere, say so plainly, then give your best understanding of the project from reading the code itself.
2. Always run `git status --short` and `git log -8 --oneline` — the clearest signal of exactly where things were left, uncommitted work especially.
3. Treat Claude's own cross-session memory (`project_status.md`) as secondary — only pull from it if it surfaces pending info the repo files don't already have. The repo files are authoritative.

Output only:
- **Status** — where things currently stand, 1-2 lines, always render even if brief
- **Pending** — unfinished or blocked items, especially anything stuck on errors or external issues
- **Next steps** — what to pick up next, only if something concrete is actually logged as planned

Max ~8 bullets total. No preamble, no restating what the app is or does, no filler, no closing offer to help. Only include something if it's actually useful for resuming work right now. If DOCS is non-conforming, the suggestion to run `/docs-restructure` is the one exception to "no filler" — always include it.
