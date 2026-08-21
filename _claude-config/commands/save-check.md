---
description: Quickly draft the docs/status update for this session's work, keeping STATUS.md capped
---
Quick pass. No full transcript re-scan — work from what's already in context.

1. Locate the status file.
   - `DOCS/README.md` starts with `<!-- docs-structure: v1 -->` → target is `DOCS/STATUS.md`.
     Never read `DOCS/CONTEXT/`, `DOCS/RESEARCH/`, `DOCS/EXTRA/`, or old `DOCS/WORK/<date>/`
     files — historical record, not re-scanned each session.
   - Otherwise, use whatever status file already exists (STATUS.md, PROJECT-STATUS.md).
   - No status file + nothing worth capturing → say so, skip.

2. Cap it at 40 lines, current + next only.
   - STATUS.md holds only: what's current, what's next. Not a running log.
   - Before adding this session's update, check line count.
   - If it's already over 40 lines, or has entries that are done/resolved/superseded:
     move those lines out verbatim, append to `DOCS/WORK/archive.md` under a
     `## <today's date>` heading, then delete them from STATUS.md.
   - Write the new current/next update into STATUS.md after trimming.

3. End with "Next up (start here)" — numbered, specific.

Write both edits (STATUS.md + archive.md, if trimming) directly — no go-ahead
needed. Then report: what changed, and that the session is safe to clear now
(next session picks up from STATUS.md with no lost context).
