---
name: prd-intake
description: Use at project start, or when a project has decisions but no written statement of what it is and what it must not be — to fill DOCS/CONTEXT/PRD.md by asking, one question at a time, and recording answers verbatim. Also use when a design fit-check conflicts with a stated constraint, when a DECISIONS.md entry contradicts one, or when a consumer hits a `<not stated>` section it needed.
---

# prd-intake

Fills `DOCS/CONTEXT/PRD.md` — the slow-changing truth about what a project is,
who it's for, and what it must not become.

**The one rule:**

> **Never invent a requirement.** If the user didn't say it, it isn't in the
> PRD. Not as a sensible default, not as an obvious implication, not as a
> placeholder that sounds better than a gap.

This is the same disease as an invented palette, one layer up — and it does
more damage, because everything downstream treats the PRD as authority. A
confidently-written PRD nobody actually said is worse than a thin one. A thin
PRD makes its gaps visible; an invented one hides them behind fluent prose.
`design-pick`'s fit-check reads `Core constraints` and `Non-goals` and will
happily block a good pick on a constraint you made up.

## What goes in, and what doesn't

**In — slow-changing truth:** what it is, who it's for, hard constraints,
things it deliberately won't do, what "done well" would mean.

**Not in — anything that moves:** progress, task lists, current blockers,
architecture decisions with reasons. Those already have homes:

| Question | File |
|---|---|
| What is this and what must it not be? | `DOCS/CONTEXT/PRD.md` — this skill |
| Where are we right now? | `DOCS/STATUS.md` |
| Why did we choose X over Y? | `DOCS/DECISIONS.md` |

A PRD that tracks progress duplicates `STATUS.md` and goes stale within a week.
Keep it lean and it stays true for months.

## The intake

**One question at a time.** Not a five-question block — a block gets one
combined answer that covers two fields and silently drops three.

For each section in order:

1. Ask the question.
2. **Wait.** Don't offer a draft answer to react to; a draft you wrote becomes
   the answer, and then it's your requirement, not theirs.
3. Record what they said, in their words. Compress, don't rewrite. If they
   said "cheap as possible, ideally free", that is what goes in — not
   "cost-optimised infrastructure".
4. If they say "I don't know" or skip it, write the literal string
   `<not stated>` and move on. Come back to it later or never.

| Section | Ask |
|---|---|
| What it is | "In a sentence or two — what is this project?" |
| Who it's for | "Who actually uses this? One group, or several?" |
| Core constraints | "What's fixed and non-negotiable? Budget, platform, stack, deadline, anything that's already decided for you." |
| Non-goals | "What should this deliberately *not* do or be? Including any look or approach you want to avoid." |
| Success criteria | "How would you know this worked? What would be true?" |

The `Non-goals` question is the one that pays for this skill. It is where "not
another generic AI-looking landing page" gets written down as something a later
fit-check can actually catch.

## Marking what you inferred

Sometimes you'll know something from the codebase the user never stated — the
stack, the hosting, an existing constraint. That can go in, but it must be
labelled:

```markdown
## Core constraints
- Static-only hosting, no server runtime — *(inferred from the existing Netlify config, not stated)*
- <not stated: budget>
```

Two failure modes, both fatal to the file's usefulness:

- **A plausible fill.** Writing "must be mobile-responsive" because everything
  is. Nobody said it, and now `design-pick` can block a pick on it.
- **A silent inference.** Writing the inferred constraint *without* the label,
  so a later reader can't tell which lines are load-bearing and which are your
  guess.

`<not stated>` is a feature. It's the signal that makes a consumer come back
and ask instead of assuming.

## Keeping it current — no new ritual

There is no "update the PRD" command and no review cadence. Four pre-existing
events trigger an update, and nothing else does:

| Trigger | What to do |
|---|---|
| `design-pick` fit-check reports a `CONFLICT:` | Either the PRD is wrong or the pick is. **Ask which — don't assume the pick loses.** If the constraint is stale, edit it here and note what changed. |
| A `DECISIONS.md` entry contradicts a stated constraint | Same question. A decision that knowingly breaks a constraint means the constraint moved. |
| `/save-check` notices either of the above | Same. |
| A consumer hits a `<not stated>` section it needed | Ask that one question now, fill that one section. Don't reopen the whole intake. |

Each is a real event that already happens. A trigger that needs someone to
*remember* to fire it is not a trigger.

## Rationalizations to reject

| Excuse | Reality |
|---|---|
| "They didn't say it, but it's obviously true" | Then it costs one question. Ask it. Obvious-to-you is where invented requirements come from. |
| "I'll draft it and they can correct it" | They'll accept it. A draft is an answer wearing a question's clothes. |
| "`<not stated>` looks unfinished" | It *is* unfinished, and saying so is the point. A fluent invented paragraph looks finished and is wrong. |
| "I'll ask all five at once, it's faster" | One combined reply covers two sections and drops three, and you won't notice which. |
| "The stack is right there in package.json, I'll just write it" | Write it *labelled inferred*. Unlabelled, a later reader can't tell your guess from their requirement. |
| "The fit-check flagged a conflict, so I'll relax the constraint" | Ask. The pick is wrong at least as often as the constraint is, and silently relaxing constraints turns the PRD into a rubber stamp. |
