# `_skills/` — backup of the hand-written Claude Code skills

**These are copies. The live skills Claude Code actually loads live in
`~/.claude/skills/` (`C:\Users\Dell\.claude\skills`). Edit them there, then run the sync.**

## Why this exists

Layers 1, 1b and 2 of the knowledge framework were backed up to GitHub on 2026-08-16. The
skills that *read* that framework were not. They existed in exactly one place — a directory
that is not a git repo — so a disk failure or a bad `npx skills` run would have lost
`context-brief`, `design-source`, `no-ai-slop`, `no-ai-slop-writing`, `api-idea-scout`,
`production-readiness` and `animation-ref` outright. Same risk class as the framework itself
was in, closed the same way: put it in the repo and push it.

## What is here, and what deliberately is not

| | Mirrored here | Why |
|---|---|---|
| The 7 hand-written skills | **yes** | Written by hand. Nothing can regenerate them. |
| The 9 `emilkowalski/skills` entries | no | Symlinks to `~/.agents/skills`. Recoverable with `npx skills@latest`. |
| `impeccable` | no | Ships its own installer that writes both harness roots. Reinstallable; see `../_standard/README.md`. |

`~/.claude/skills/` therefore contains 17 entries but only 7 real hand-written directories —
the rest are symlinks or vendor installs. `sync-skills.js` tracks the 7 by name.

## Using it

```
node sync-skills.js            # refresh the backup from the live directory
node sync-skills.js --check    # report drift only, write nothing; exit 1 if drifted
```

`--check` compares byte-for-byte, so "in sync" means identical, not merely present.
Run it after editing any skill, and commit the result.

**To restore a lost skill:** copy `_skills/<name>/` back into `~/.claude/skills/<name>/`.
There is no install step — a skill is just its `SKILL.md` plus any `references/`.

## The one thing to know about it

This is a **mirror, not the source of truth.** Edit a skill and the backup is stale until
someone runs the sync. That is the honest weakness of the approach, and it is why `--check`
exists as a separate mode — a backup you cannot cheaply confirm is current is a backup you
cannot trust.

`sync-skills.js` **refuses to run when a tracked skill is missing from the live directory**,
exiting 2 instead of mirroring the absence. Without that rule, deleting a skill by accident
and then syncing would delete its backup too — turning the one tool meant to protect against
loss into the thing that completes it. Same principle as
`_knowledge/scripts/verify-sources.js` refusing to stamp a partial pass.

## Known gap

`~/.claude/commands/` (10 custom slash commands, ~13 KB) and `~/.claude/agents/`
(5 subagent definitions, ~7 KB) are **also hand-written and also unbacked**, for exactly the
same reason and with exactly the same consequence. They are out of scope here only because
the backup task was scoped to skills. Extending `TRACKED` to cover them is a small change and
worth doing.
