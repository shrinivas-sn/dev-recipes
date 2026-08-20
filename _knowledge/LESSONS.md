# LESSONS — things this repo already learned the hard way

Not a reference to read at session start. Read a specific entry when you're about to repeat
the mistake it records, or when `START-HERE.md` points here. Moved out of `START-HERE.md`
2026-08-17 to keep that file short; nothing here is deleted, only relocated.

## Never trust a status line — verify it

Three status notes in this repo's history were flat wrong, each written from one stale
observation instead of a check:

- **"Nothing is committed to git yet."** Wrong — it was always a repo with a remote
  (`github.com/shrinivas-sn/dev-recipes`). What was actually untracked was the new knowledge
  framework, not the repo itself. Lesson: "no git at all" and "new work is untracked in an
  existing repo" are different problems — check the repo, don't trust the note.
- **"The backend is not deployed — Railway returns `Application not found`."** Wrong — it had
  moved from Railway to Render (platform restrictions), and was live at
  `https://calendar-api-d7a8.onrender.com`. Probing the old Railway URL "confirmed" a dead
  deployment that had simply been replaced. Lesson: a 404 proves *that URL* is dead, not that
  the app is undeployed — find the current host before concluding anything.
- **"3 commits on `develop`."** Wrong — there were 4 (`a8036c3` was missing from the count).
  Lesson: a commit count written from memory drifts — run `git log main..develop` instead.

## A rejected push means fetch and look, not force

`main` had diverged: five README-only commits (badges repointed Railway → Render) had been
pushed straight to `main` while fixes sat on `develop`, so the push was rejected. Resolved by
fetch + **merge** (`4b269ff`) — not force push, not rebase — because both sides held real work
with zero file overlap.

## A defect logged from one grep hit understates its own scope

A defect was logged as one `transition-all` at `index.css:58`. The full `slop-signatures.md`
scan found **20** across 8 files, plus **0 `focus-visible`** on all 14 buttons and
**0 `prefers-reduced-motion`** anywhere. Lesson: rerun the whole scan before trusting a logged
count — a single grep hit is a sample, not a census.

## "The same file exists twice and differs" is not automatically a conflict

`impeccable` appeared installed twice (`~/.claude/skills` and `~/.agents/skills`) at the same
version (4.0.4), with 14 differing lines. Every difference was harness plumbing (Claude Code
frontmatter + `.claude/` paths vs `.agents/` paths), not behavioural. What settled it:
`~/.agents/.skill-lock.json` tracks 9 skills and `impeccable` isn't among them — it has its own
installer that writes to both harness roots by design. Lesson: check what installed a duplicate
before assuming it needs resolving — the installer's lockfile answered in one read what a
`SKILL.md` diff alone could not.

## A mirror's real failure mode is silent staleness, not loss

`_claude-config/sync.js --check` exists as a separate write-nothing mode because a backup you
cannot cheaply confirm is current is a backup you cannot trust. Run it after editing any skill.
Related: the script refuses to sync when a tracked skill is missing from the live directory
(exit 2) — without that guard, deleting a skill by accident and then syncing would delete its
backup too, the backup tool completing the loss it exists to prevent. Same principle as
`verify-sources.js` refusing to stamp a partial pass.

One asymmetry worth knowing: `skills/` is tracked by an explicit name list, so the refuse-on-
missing guard applies to it. `commands/` and `agents/` mirror as whole directories with no name
list to check against, so a deletion there would propagate on the next sync — guarded by
reading the `--check` output, not by an abort.

## Folding a retrieval procedure into a pipeline would have deleted the gates

The old `no-ai-slop-*` recipes said "look at it" / "name mood words" — generate-then-re-prompt
instructions that needed replacing. The instinct was to fold them into `/design-source`.
Wrong move: `no-ai-slop` is a *pipeline* (detect → audit → build → visual-verify → simplify →
review → test → ship, with report gates and an 8-category scorecard); `/design-source` is a
*retrieval procedure* for one step inside it. Folding would have deleted the gates. Instead the
generate-then-re-prompt bullets now route to `/design-source`; the pipeline itself is unchanged.

## Explain evals in plain language, not jargon, or it doesn't land

The eval design was first presented to the user in heavy jargon (rubric / deterministic
assertions / LLM judge / transcript) and did not land — they said plainly they understood none
of it. The plain-language version (in `_knowledge/evals/README.md`, "What this is, in plain
language") is the one that worked. Lead with that whenever explaining this system to a human
who isn't already fluent in eval terminology. An explanation the user cannot act on is not an
explanation — this system's whole value is that a human can trust and check it.

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
