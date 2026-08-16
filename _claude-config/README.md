# `_claude-config/` — backup of the hand-written Claude Code config

**These are copies. The live config Claude Code actually loads is under `~/.claude`
(`C:\Users\Dell\.claude`). Edit it there, then run the sync.**

```
_claude-config/
  skills/      7 hand-written skills   <- ~/.claude/skills
  commands/    10 slash commands       <- ~/.claude/commands
  agents/      5 subagent definitions  <- ~/.claude/agents
  sync.js
```

## Why this exists

Layers 1, 1b and 2 of the knowledge framework were backed up to GitHub on 2026-08-16. The
skills that *read* that framework were not, and neither were the commands and subagents.
They existed in exactly one place — a directory that is not a git repo — so a disk failure
or a bad `npx skills` run would have lost them outright. Same risk class as the framework
itself was in, closed the same way: put it in the repo and push it.

## What is here, and what deliberately is not

| | Mirrored | Why |
|---|---|---|
| 7 hand-written skills | **yes** | Written by hand. Nothing can regenerate them. |
| 10 slash commands, 5 subagents | **yes** | Same — all hand-written, no symlinks among them. |
| The 9 `emilkowalski/skills` entries | no | Symlinks to `~/.agents/skills`. Recoverable with `npx skills@latest`. |
| `impeccable` | no | Ships its own installer that writes both harness roots. Reinstallable; see `../_standard/README.md`. |

`~/.claude/skills/` therefore holds 17 entries but only 7 worth mirroring — the rest are
symlinks or vendor installs. `sync.js` tracks those 7 by name, and mirrors `commands/` and
`agents/` wholesale since everything in them is hand-written.

## Using it

```
node sync.js            # refresh the backup from the live config
node sync.js --check    # report drift only, write nothing; exit 1 if drifted
```

`--check` compares byte-for-byte, so "in sync" means identical, not merely present.
Run it after editing any skill, command or agent, and commit the result.

**To restore:** copy the file or directory back into the matching place under `~/.claude`.
There is no install step — each of these is just markdown that Claude Code reads on start.

## The one thing to know about it

This is a **mirror, not the source of truth.** Edit a skill and the backup is stale until
someone runs the sync. That is the honest weakness of the approach, and it is why `--check`
exists as a separate write-nothing mode: a backup you cannot cheaply confirm is current is a
backup you cannot trust.

`sync.js` **refuses to run when a tracked skill is missing from the live directory**, exiting
2 instead of mirroring the absence. Without that rule, deleting a skill by accident and then
syncing would delete its backup too — turning the one tool meant to protect against loss into
the thing that completes it. Same principle as `_knowledge/scripts/verify-sources.js`
refusing to stamp a partial pass.

That guard covers the named-list group only. `commands/` and `agents/` are mirrored as whole
directories, so there is no name list whose absence could be detected — a deletion there
propagates on the next sync. It is still *visible* (every removal prints as a `delete` line,
and `--check` shows it before anything is written), but read the output rather than trusting
it blindly.

## Line endings

`.gitattributes` pins `_claude-config/**` to LF. Without it, git's autocrlf rewrites these
files on checkout and `--check` reports drift on all 28 after a fresh clone — false alarms in
exactly the restore scenario the backup exists for.
