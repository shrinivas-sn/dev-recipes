# Layer 4 — Evals

## What this is, in plain language

A skill is a set of instructions. Instructions rot: you edit one line, and something that used
to work quietly stops working. You don't notice, because the answer still *sounds* right.

An eval is a rigged test. You hand the agent a small fake project built so that answering from
memory gives a confident, wrong answer — and only doing what the skill says gives the right one.
Then you check the answer against a written checklist. If a skill edit breaks the behaviour, the
checklist fails and you find out immediately instead of six projects later.

So: **a task the skill should be able to handle, plus a list of things a good answer must do.**

## Running it

```bash
node runner.js --dry-run                          # validate scenarios, spend nothing
node runner.js                                    # run everything, judge on
node runner.js --skill context-brief              # one skill's scenarios
node runner.js --scenario 01-cache-version-drift  # one scenario
node runner.js --no-judge                         # mechanical checks only, no judge cost
node runner.js --regrade <results-dir-name>       # re-apply the checklist to a saved run
```

Exit code `0` = every scenario passed, `1` = something failed, `2` = a scenario is malformed or
the harness could not start. Reports land in `results/<timestamp>/<scenario>.json` (gitignored)
and hold the full transcript, the final answer, every tool call, and the per-item verdicts.

Other flags: `--keep` (leave the temp workspace on disk), `--model <name>`, `--timeout <seconds>`,
`--auto-trigger` (see below).

**Each scenario costs roughly $0.70–$0.90.** That is why `--regrade` exists — see below.

## How a scenario is built

One JSON file per scenario in `scenarios/<skill-name>/`:

| Key | What it does |
|---|---|
| `name` | Must match the filename. |
| `skills` | The skill under test. `skills[0]` is what gets invoked. |
| `guards` | Prose: **which specific failure this scenario catches.** Write this first — if you can't name the failure, the scenario isn't testing anything. |
| `query` | What the user asks. |
| `files` | Fixture files copied into a throwaway workspace. Paths start with `fixtures/`. |
| `expected_behavior` | The checklist. Each entry is one thing a good answer must do. |
| `assertions` | Mechanical checks, each with `covers`: the index of the checklist item it grades. |

Every checklist item is graded **exactly once** — by an assertion if one covers it, otherwise by
an LLM judge. Never both. Mechanical where the answer is a fact (a version string, which id was
queried); judge where it's a matter of substance.

### Assertion types

| Type | Scope |
|---|---|
| `skill_fired` | A `Skill` tool call naming the skill. Only graded under `--auto-trigger`. |
| `transcript_matches` / `_not_matches` | Everything the agent said, read, or received. |
| `answer_matches` / `_not_matches` | The final answer only. |
| `answer_code_matches` / `_not_matches` | Only the fenced code blocks in the answer. |
| `tool_used` / `tool_not_used` | Tool names. |
| `tool_arg_matches` / `_not_matches` | The arguments sent to a tool. Needs a `tool` pattern. |

## Four things that cost me a run each, so you don't repeat them

**1. "Must not mention X" is almost always the wrong test.** A good answer often names the wrong
approach *in order to warn against it*. Scenario 02 failed on `answer_not_matches "@theme"` while
saying "…not in a CSS `@theme` block, which would silently generate nothing here" — the correct
answer, marked wrong. What matters is what the answer **prescribes**, and prescription lives in
the code block. That's what `answer_code_*` is for. Same with scenario 01 and `cache hit`: the
right answer explains why range-matching would produce a *false cache hit*. Prefer a positive
test (`cache miss`) to a negative one.

**2. Transcript checks can't tell you what the agent chose.** Scenario 02 checked the transcript
did not contain `/websites/tailwindcss` (the v4 Context7 id). But the skill *reads the registry*,
and the registry lists both ids on adjacent lines — so the string is in the transcript no matter
what the agent does. `tool_arg_*` grades what was actually sent to the tool. Read-scope and
choice-scope are different questions.

**3. A blocked tool call is the deny list working, not failing.** Eval runs deny `Write`, `Edit`,
`MultiEdit`, `NotebookEdit` and `Bash`, so a run cannot mutate the repo it grades against. A denied
attempt still appears in the stream as a `tool_use`; only a call that returns *without* an error
is a real violation. Counting attempts made the harness cry wolf on its first run.

**4. Skills do not reliably auto-trigger under `claude -p`.** The first live run used Glob, Read
and Write and never invoked the skill — so every checklist item failed for the same uninformative
reason. The runner therefore invokes explicitly (`/context-brief <query>`) by default, which tests
*the skill's content*. Triggering is a separate question: `--auto-trigger` sends the bare query and
grades whether the skill fires on its own. Under the default, `skill_fired` abstains rather than
failing — an item whose every check abstains is reported `not-applicable`, not wrong.

## Iterate with `--regrade`, not with your wallet

Rubrics get revised far more often than model behaviour changes, and each real run costs about a
dollar. Reports save the answer, the transcript and every tool call, so:

```bash
node runner.js --scenario 01-cache-version-drift --regrade 2026-08-17T02-43-09-338Z --no-judge
```

replays that saved run through the current checklist for free. Re-run for real only when you've
changed the skill, the fixture, or the query.

## Known gap: no baseline

Every scenario runs the skill. None runs the same query *without* it. So a pass proves the skill
didn't break — it does not prove the skill helped. Scenario 02 is the live example: the model got
Tailwind v3 right partly by reading the fixture's own `package.json`, which it would have done
anyway. Until a baseline arm exists, read a pass as *no regression*, not as *proof of value*.

## Adding a scenario

1. Name the specific failure you want to catch. Put it in `guards`.
2. Build a fixture that makes the wrong answer attractive — a version drift, a name collision, a
   package that doesn't exist. Fixtures are synthetic; never copy a real project in.
3. Write the checklist as behaviours, not as strings to match.
4. Add assertions only where a fact is mechanically checkable. Leave substance to the judge.
5. `node runner.js --dry-run` to validate, then run it once for real.
