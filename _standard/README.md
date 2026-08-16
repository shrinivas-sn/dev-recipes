# `_standard/` — the ruler

Layer 2 of the agent knowledge framework. It answers one question: **is this skill any good?**

## The ruler is not written here

`RESEARCH.md:67` recorded the finding that matters: the standard was **already owned and
simply not applied**. It ships with the `superpowers` plugin:

```
skills/writing-skills/anthropic-best-practices.md
```

The path carries a plugin version that changes on update, so locate it rather than pinning it:

```bash
find ~/.claude/plugins/cache -name anthropic-best-practices.md | sort | tail -1
```

It ends in a 22-item **Checklist for effective Skills** (core quality / code and scripts /
testing). That checklist is the ruler. Re-deriving a local copy would be exactly the
memory-over-retrieval failure `_knowledge/` exists to prevent — so this file holds only the
**deltas** and the **scorecard**.

## Local deltas — decisions this setup makes deliberately

### Windows-style paths: accepted, not fixed

The checklist says *"No Windows-style paths (all forward slashes)"*; the doc's stated reason
is that backslash paths *"cause errors on Unix systems"*.

Audited 2026-08-16: **27 backslash paths across 6 of 7 custom skills.** Accepted as-is. This
is a single-machine Windows setup, the paths are absolute (`E:\dev-recipes\...`) and therefore
non-portable regardless of slash direction, and rewriting 27 references buys nothing today.

**Revisit if** any skill is shared, published, or run on a non-Windows machine — at that point
the absolute paths are the blocker, not the slashes.

### Evals: gap acknowledged, deferred to Layer 4

The checklist requires *"At least three evaluations created"* per skill. Current state: **0 of
7**. `no-ai-slop-writing/references/eval.md` is a post-run self-check rubric, which is useful
but is not an evaluation — it does not let you answer *"did this change make the skill
better?"*

This is `RESEARCH.md:56` problem #6, unchanged. Building evals for 7 skills is Layer 4 work,
not Layer 2. Recorded here so it stays measured instead of forgotten.

## Scorecard — custom skills, audited 2026-08-16

`~/.claude/skills/` holds **17** skills: 7 custom-authored (scored below) plus 10 from the
emilkowalski pack, upstream's to maintain — 9 of those are symlinks into `~/.agents/skills/`;
`impeccable` is not (see below).

Scored: the 7 custom-authored, against the mechanically checkable checklist items.

| Check | Result |
|---|---|
| SKILL.md under 500 lines | **7/7** — range 8 (`animation-ref`) to 401 (`api-idea-scout`) |
| Description states what *and* when | **7/7** — every one carries a "Use when…" clause |
| File references one level deep | **7/7** — all are `references/*.md` |
| Required tooling verified available | **1/1** — `animation-ref` is the only skill invoking a script; `add-animation-ref.js` exists |
| Progressive disclosure where needed | **3/7** have a `references/` dir; `api-idea-scout` carries 401 lines with none |
| No Windows-style paths | **1/7** — see delta above |
| At least three evaluations | **0/7** — see delta above |
| Under version control | **7/7** as of 2026-08-16 — mirrored into [`../_claude-config/`](../_claude-config/) and pushed; was **0/7** at audit time |

Two real gaps in the custom 7, both recorded as deltas above. Nothing there is a defect
requiring a fix today.

The version-control row is not on Anthropic's checklist — it was added after the audit,
when scoping evals surfaced that all 7 existed only in `~/.claude/skills` with no copy
anywhere. Backup is a precondition for the other rows: there is no point grading a skill
that one bad `npx skills` run can erase. Closed by `../_claude-config/sync.js`; run
`node sync.js --check` to confirm the mirror is still current before trusting this row.

### Found while auditing, outside the custom 7

- ~~**`impeccable` is installed twice**~~ — **investigated and closed 2026-08-16. Not a
  defect; no action needed.** It is one skill at one version (**4.0.4** in both copies)
  shipped as **two harness-specific builds**, not two competing versions.

  The decisive evidence is `~/.agents/.skill-lock.json`: it tracks **9** skills, and
  `impeccable` **is not one of them**. Those 9 are exactly the 9 symlinks in
  `~/.claude/skills/`. So `impeccable` never came from `npx skills@latest` — it has its own
  installer (note `allowed-tools: Bash(npx impeccable *)` in its frontmatter), which writes a
  real directory to each harness location by design.

  The 14 differing `SKILL.md` lines are all plumbing, no behavioural content:

  | | `~/.claude` copy | `~/.agents` copy |
  |---|---|---|
  | Frontmatter | adds `user-invocable`, `argument-hint`, `license`, `allowed-tools` | none of these |
  | Invocation | `/impeccable …` | `$impeccable …` |
  | Script paths | `.claude/skills/impeccable/scripts/…` | `.agents/skills/impeccable/scripts/…` |

  **Which copy loads: the `~/.claude` one** — it is the copy carrying Claude Code frontmatter
  and `.claude/` script paths. Keep both. `npx skills@latest update -g` will not touch either
  (untracked), so the `.agents` copy is only removable disk (~3.0 MB) and only if no other
  harness is ever used here. Deleting it is optional cleanup, not a fix.
- ~~Related symptom: `pick-ui-library`, `prototype`, `review-animations` missing from the
  session skill listing.~~ **Also gone** — all three appear in the session listing as of
  2026-08-16. The earlier observation was of a single session's listing, not a durable state.
  Lesson: a skill absent from one session's listing is not evidence of a broken install.
- **`emil-design-eng` is 674 lines**, over the checklist's 500-line SKILL.md limit. Upstream's
  file, upstream's call. Noted so the number isn't rediscovered.

### Caveat on the scan

The `win-paths` grep above matches regex fragments in JavaScript (`w:\s`, `E:\n`) as well as
real paths. It is reliable on markdown-only skills and noisy on any skill shipping `scripts/`.
The 27 hits in the custom 7 were confirmed by eye as 16 unique genuine `E:\...` paths.

## Re-running this audit

```bash
cd ~/.claude/skills
for s in */; do echo "$s $(wc -l < "$s/SKILL.md") lines"; done
for s in */; do echo "$s $(grep -roE '[A-Za-z]:\\\\[A-Za-z0-9_.-]+' "$s" | wc -l) win-paths"; done
```

Re-score when a skill is added or substantially rewritten. Update the date above.

## What `_standard/` is not

Not a spec to write skills *from* — that is the Anthropic doc. This file is the record of
where this setup knowingly departs from it, and what the last audit found.
