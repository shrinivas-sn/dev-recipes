# <Project name> — PRD / context

Slow-changing truth about what this project is and why. `/recap` does not re-read
this every session — it's for onboarding and for when the "why" behind something
needs to be looked up.

Filled by the `prd-intake` skill, which asks one question at a time and records
answers verbatim. Anything nobody stated is written as the literal string
`<not stated>` rather than plausibly filled in.

**`Core constraints` and `Non-goals` are load-bearing, not descriptive.**
`design-pick`'s fit-check reads both sections and will block a design pick that
instantiates something they rule out. Edit them knowing something acts on them.

## What it is
<one paragraph>

## Who it's for
<one paragraph or bullets>

## Core constraints
<tech/budget/platform constraints that shape decisions — e.g. "$0 hosting stack",
"must work offline", etc. Mark anything inferred rather than stated: *(inferred)*>

## Non-goals
<what this deliberately will not do or be — including looks and approaches to
avoid. This is the section a design fit-check is most likely to catch something
on, so name aesthetics you want ruled out, not just features.>

## Success criteria
<how you'd know it worked — what would be true. Not a task list; STATUS.md does that.>
