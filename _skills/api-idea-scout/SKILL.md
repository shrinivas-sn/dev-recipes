---
name: api-idea-scout
description: Discovers or validates ideas for new free, keyless, developer-facing REST APIs built on Indian data. No argument runs fresh discovery (ranked shortlist of 3-5 candidates); an idea description as argument runs deep validation against that one idea. Scores every candidate against a 5-point scorecard (license, duplication, update cadence, buildable scope, awesome-list submission fit), tracks results in E:\API-PROJECTS\IDEA-LOG.md, and on a "go" verdict scaffolds a new standalone project folder and (unattended) carries it through design, planning, build, and quality gates. Use when the user wants to find their next public-API project idea, or wants an idea they already have researched and validated before committing to build it.
---

# api-idea-scout

Finds and validates ideas for new free, open, developer-facing REST APIs — the same lane as
`calendar-api` (Indian holidays) and `mandi-api` (Indian mandi prices), both shipped, one
merged into the `public-apis` GitHub list. Shared conventions across every project this skill
produces live in `E:\API-PROJECTS\CONVENTIONS.md` — read it once per session; it's the concrete
answer to "what does 'established conventions' mean," not calendar-api/mandi-api's source
directly.

## Before anything: read the log

Read `E:\API-PROJECTS\IDEA-LOG.md`. If `E:\API-PROJECTS\` or the log doesn't exist yet, create
it first using "Hub bootstrap" below (this includes `CONVENTIONS.md` — a one-time thing to
write, not to re-derive every run).

Match the current request (a fresh discovery candidate, or a validation-mode argument) against
**every** existing row, at any status — identity is the underlying problem plus its primary
data source, not exact title wording. "Indian PIN code API" and "Postal code lookup for India"
sourced from the same data are the same idea; "AISHE College Directory" and "Indian Higher-Ed
Institutions API" sourced from the same AISHE dataset are the same idea even with unrelated
titles.

- **Fully terminal** (`rejected`, `live`) → never re-research. Say so immediately with the
  prior verdict.
- **Any other existing status** (`candidate`, `shortlisted`, `validated`, `project-created`,
  `design-approved`, `in-development`, `prod-audit-passed`, `deployed`, `submitted`, `blocked`)
  → never add a second row for the same idea. Update the existing row in place (refreshed
  research/date) and continue from its current status rather than restarting at `candidate`.
- In **discovery mode**, this also constrains candidate generation — don't surface an idea
  already tracked at any status as if it were new.

## Mode selection

- **No argument (`$ARGUMENTS` empty):** Discovery mode.
- **Argument present:** Validation mode, researching exactly the idea described in `$ARGUMENTS`.

If the validation-mode argument is too vague to research (e.g. "something about weather"), ask
one clarifying question before starting research — don't guess scope.

## Research process (both modes)

Use `WebSearch` and the firecrawl skills (`firecrawl:firecrawl-search`,
`firecrawl:firecrawl-scrape`) to research each candidate:

1. **Find the data source.** Look for Indian data — government portals (data.gov.in and
   similar), public institutions, permissively-licensed datasets/sites. Not limited to
   government sources.
2. **Read the license — on the exact source the build will actually ingest.** Find the real
   license or terms-of-use page and quote or link the specific clause that permits (or blocks)
   redistribution. A third-party mirror or CSV dump having a permissive license is not
   sufficient by itself if the build will ingest from the *original* government/institutional
   endpoint — verify the license on that specific ingestion path, not just on whichever mirror
   was easiest to find. If the primary source's own policy page is unreachable, say so
   explicitly and treat the criterion as resting on secondary confirmation (caveat it), rather
   than presenting it as independently confirmed.
3. **Check for duplication — thoroughly, not just the awesome-lists.** A miss here invalidates
   the whole scorecard, so do all of these, not just one:
   - Search public-apis.io and fetch the live `public-apis` GitHub README directly (raw
     content, not a cached summary) for the domain/keyword.
   - Run a plain web search for `"<the exact thing this API would do>" API India free` and
     read the actual top results, not just their titles — long-running community APIs (e.g.
     official-adjacent lookup services that predate awesome-lists) routinely don't appear in
     any curated list but are still the dominant free option developers already use.
   - Check GitHub search/topics for the domain (e.g. `github.com/topics/<keyword>`) for
     existing open-source projects solving the same problem, even unlisted ones.
   - If the candidate bundles multiple sub-capabilities (e.g. "lookup X" + "hierarchy of Y"),
     check each sub-capability for existing coverage separately — a candidate can be
     partially covered (drop/narrow the covered part) rather than wholly blocked.
4. **Assess update cadence — with a real basis, not an assumption.** How often does the source
   actually change, per a published schedule or observable pattern? Daily/weekly is cron-able
   (matches the GitHub Actions ingestion pattern from mandi-api); anything needing real-time
   streaming is a mismatch for this playbook. If no cadence evidence exists, say so explicitly
   rather than inferring one from "this type of data is usually infrequent."
5. **Scope a v1.** Sketch the endpoints a v1 would need. Compare the size to calendar-api (5
   endpoints, flat JSON) or mandi-api (5 endpoints, Supabase + daily ingestion) — flag if it
   looks bigger than that.

### Discovery mode specifics

Cast a wide net across Indian data broadly — not restricted to government sources. Generate
and research 3–5 candidates not already in the log (per the dedup rule above). Rank them.

### Validation mode specifics

Research exactly one idea — the one in `$ARGUMENTS` — at the same depth as a discovery
candidate.

## Scorecard

Score every researched candidate against these five criteria. Each is `pass`, `fail`, or
`unconfirmed`:

1. **Data source exists & is legally redistributable** — real source found, license read on
   the exact ingestion path, permits redistribution. Mark `unconfirmed` (never auto-`pass`) if
   the license can't be confirmed on that specific source.
2. **Not already well-served** — no existing free, well-maintained API/service already does
   this well, checked per the multi-source duplication process above.
3. **Sane update cadence** — ingestible via daily/weekly cron, not real-time, **with an actual
   basis for the cadence claim** (published schedule or observed pattern). Mark `unconfirmed`
   if the cadence is assumed rather than evidenced — don't pass this on "this kind of data is
   usually infrequent."
4. **Buildable v1 scope** — comparable in size to calendar-api/mandi-api, based on the concrete
   endpoint sketch, not a rough guess.
5. **Awesome-list submission fit** — can plausibly be keyless, CORS-enabled, HTTPS, working
   root route, no auth, *given the data source's actual access requirements* (e.g. if the only
   ingestion path requires a registered API key server-side, that's fine — mandi-api does this
   — but confirm nothing forces auth on the *public-facing* API itself). This is the exact bar
   that got mandi-api merged into `public-apis`, and it's re-verified on the built artifact in
   the hand-off (§4e) — this is the pre-build hypothesis, not the final check.

**Verdict:**
- `go` — criteria 1, 2, and 5 are all clear `pass`.
- `caution` — 1, 2, or 5 is `unconfirmed`, or 3/4 fail (scope/cadence concern) but 1/2/5 pass.
- `no-go` — 1, 2, or 5 is a clear `fail`.

Never round `unconfirmed` up to `pass` on any criterion to force a better verdict.

## Output

### Discovery mode

Present a ranked shortlist in chat: for each candidate, a one-line summary, the five-criterion
scorecard, and its verdict. End with a clear top recommendation (or say plainly if nothing
cleared the bar).

### Validation mode

Present the single scorecard and verdict, with reasoning tied to what was actually found
(specific sources, specific license clauses, specific competing services) — not generic
hedging.

Write prose in both modes per `no-ai-slop-writing` conventions: no filler, no generic AI
phrasing, state findings directly.

### Every researched candidate (win or not)

Write `E:\API-PROJECTS\research\<slug>.md` (slug = kebab-case of the idea name, minus a
redundant "api" suffix — e.g. "Pincode Lookup API" → `pincode-lookup`) with the full research:
sources found, license findings (quoted), duplication check results, cadence assessment, scope
sketch, scorecard, and verdict.

Add or update its row in `IDEA-LOG.md` (columns: `Idea | Status | Score | Date | Research |
Project`) — **commit the change immediately** (`git add IDEA-LOG.md research/ && git commit`
in `E:\API-PROJECTS\`) so the log never sits stale/uncommitted between runs:

- New candidates from discovery mode → `candidate` if not chosen, `shortlisted` if presented as
  the top pick.
- Validated idea with a `go` verdict → `validated`.
- Any `no-go` verdict, in either mode → `rejected` (terminal — never re-research it again). Do
  not leave a `no-go` sitting at `candidate`; that's the one status that must always reflect a
  real terminal verdict.
- `caution` verdicts stay `candidate` (or `shortlisted` if it's still the best of a weak batch)
  — genuinely undecided, worth another look once the `unconfirmed` criterion resolves.
- Score column: verdict plus a short parenthetical, e.g. `go (1:pass 2:pass 3:pass 4:pass
  5:pass)` or `no-go (2:fail — existing API covers this)`.
- Date column: today's date, `YYYY-MM-DD`.
- Research column: relative link, e.g. `research/pincode-lookup.md`.
- Project column: blank until a project is scaffolded (see hand-off below).

## Hand-off on a "go" verdict

After presenting results, if the user confirms they want to proceed with a specific `go` idea:

No worktree isolation for `E:\<slug>-api\` — `superpowers:using-git-worktrees` protects
existing work on a shared branch from interference, but each of these is a brand-new repo with
no prior history to protect; commit straight to `main`, same as building calendar-api/mandi-api
was.

1. Derive the slug (see above). **Check for collision first:** if `E:\<slug>-api\` already
   exists, confirm it actually belongs to this pipeline (it has `DOCS\RESEARCH.md` matching
   `research/<slug>.md`, or `IDEA-LOG.md` already links this idea to that path) before treating
   it as resumable. If the folder exists but is unrelated (a different, older project of the
   user's using the same name), pick a disambiguated slug instead (e.g. append the data-source
   name) rather than writing into someone else's folder.
2. **Scaffold, or resume — check before acting:**
   - If `E:\<slug>-api\` doesn't exist: create it. `git init`, minimal `README.md` stub (idea
     name + one-line description + "Status: pre-design"), `DOCS\RESEARCH.md` (copy of
     `research/<slug>.md`), `DOCS\DECISIONS.md` (empty log with its header — see §4's decision
     rule below), a `.gitignore` (`.env`, `.env.local`, `node_modules/`, `dist/`, `build/`,
     `.superpowers/`, standard framework ignores), and `.env.example` with placeholder keys
     only (real values never committed, ever, at any later stage). Commit this initial
     scaffold.
   - If it already exists (whether it belongs to this pipeline per step 1's ownership check, or
     it's being resumed after an interruption): **git log is ground truth, the log's Status is
     a hint to be reconciled to it, not trusted blindly.** Run `git -C E:\<slug>-api log
     --oneline` and inspect the actual filesystem state (does `DOCS/superpowers/specs/*.md`
     exist → design was at least started; does `DOCS/superpowers/plans/*.md` exist → planning
     happened; does application code exist and is it committed → build progressed). If this
     disagrees with `IDEA-LOG.md`'s Status for this row (e.g. status still says
     `project-created` but a plan doc and partial code already exist — the interruption landed
     before the hub's own status commit), correct the row to match what git log actually shows
     before continuing, then resume from the corrected status. Also verify the scaffold itself
     is complete, checking content not just presence — `README.md` and `DOCS\RESEARCH.md`
     exist; `.env.example` exists with placeholders only; `.gitignore` exists **and actually
     contains `.superpowers/`** (an older scaffold from before that entry was required would
     otherwise silently lose the git-clean protection); `DOCS\DECISIONS.md` exists. Create or
     patch whatever's missing or incomplete, commit that fix immediately, and never assume an
     existing folder is fully scaffolded just because the folder itself exists. Never
     re-`git init` or overwrite `README.md`/`DOCS\RESEARCH.md`/`DOCS\DECISIONS.md`'s existing
     entries — only fill genuine gaps.
3. Update the idea's `IDEA-LOG.md` row: Status → `project-created` (only move forward, never
   backward), Project column → link to `E:\<slug>-api\`. Commit.
4. Continue immediately in the same session, chained through every stage below with no
   stopping to ask permission between them. The user already validated the problem statement
   (their "go") — from here they are the observer/validator of the *result*, not an approver of
   each intermediate step. **Decide, don't stall:** every question that arises — design
   choices, plan tradeoffs, ambiguous requirements — gets decided using the research, this
   idea's own competitor findings, and `CONVENTIONS.md`. Never block the chain waiting on the
   user to answer a design or planning question. The only thing that stops the chain is the
   fatal-blocker path at the end of this section — not "I'm not sure," but "this cannot proceed
   at all" (see below).

   **Decision logging — write before you act, not after.** The moment a decision is made,
   append and commit it to `E:\<slug>-api\DOCS\DECISIONS.md` *before* implementing it, not
   after. "Logged but not yet acted on" is a safe state to resume into; "implemented but not
   yet logged" is not — an interruption in that gap loses the record of why the code looks the
   way it does. This is also what the user actually reviews afterward as observer/validator of
   the result, so it needs to be complete, not reconstructed from memory later.

   **Continuity across interruptions (dropped connection, session/usage limits, a crash — not
   a design decision, an external stop):** nothing about this chain assumes it runs in one
   unbroken session.
   - **`git log` in `E:\<slug>-api\` is ground truth for what physically exists.**
     `IDEA-LOG.md` Status is a hint reconciled *to* git log, never trusted over it — see step
     2's resume branch above for the reconciliation rule. Commit frequently within every stage,
     not just once at the end.
   - **Status is written before each stage starts, for every stage, not just c/d/e:** before
     4a, status is already `project-created` (no change needed, but note git log is what
     actually distinguishes "design not started" from "design in progress" — see step 2).
     Before 4b starts (design approved, moving to planning), write Status → `design-approved`,
     commit. Before 4c starts, write Status → `in-development`, commit. This closes the gap
     where `project-created` could mean either "nothing done" or "design half-finished."
   - **`DECISIONS.md`** is the record of what's already decided — a resumed session reads it
     first and honors every entry, never re-deciding or contradicting one.
   - **Which build skill was chosen (`subagent-driven-development` or `executing-plans`)** gets
     its own `DECISIONS.md` entry the moment it's chosen, before build starts — a resumed
     session at `in-development` needs to know which one to resume, not guess.
   - **Build-stage task progress** is inherited from `subagent-driven-development`'s own ledger
     (`.superpowers/sdd/<plan>/progress.md`) when that's the chosen build skill — check it as
     part of resuming stage c specifically. It's listed in `.gitignore` (added at scaffold
     time) so ordinary `git clean -fd` won't touch it — only `-fdx` would, which is why that
     flag specifically is never run inside `E:\<slug>-api\` during this chain (if it happens
     anyway, `git log` is the fallback record for code state, though the task-level ledger
     itself would be gone).
   - **Quality-gate attempt tracking (§4d):** before starting a fix attempt, write
     `no-ai-slop attempt 1: STARTED` to `DECISIONS.md` and commit — *then* do the fix work,
     then amend with the result (`attempt 1: FAIL — <reason>` or `PASS`). On resume, a
     `STARTED` entry with no result means that attempt was interrupted mid-way — resume *that
     same* attempt number, don't start counting from a fresh attempt 1, and don't silently grant
     an extra attempt either.
   - **On any resume** — new session, after a network failure, after a usage-limit reset — read
     `git log` (ground truth), `IDEA-LOG.md` Status, and `DECISIONS.md`, in that order, before
     doing anything else. Reconstruct where the chain left off from those three; never restart
     a stage from zero when resumable state already exists for it.
   - **Resume-loop guard:** log a `resume N for stage X` line in `DECISIONS.md` each time a
     stage is picked back up after an interruption. This log line itself is bookkeeping, not
     progress — it doesn't count. If a stage is resumed more than 3 times with no *other*
     commit (design/plan/code/research changes, not just another resume-log or attempt-STARTED
     entry) between consecutive resumes, that's a fatal blocker — stop and report rather than
     silently consuming quota indefinitely across sessions.
   - A transient tool failure (a single failed `WebSearch`/`WebFetch`, a network blip) during
     research or a quality gate is not a fatal blocker — retry it (2–3 attempts) before
     treating the underlying question as `unconfirmed` or a gate as failed. Only a
     *reproducible* failure counts toward the fatal-blocker path.

   a. **Design** — invoke `superpowers:brainstorming`, working inside `E:\<slug>-api\`, using
      the research write-up as the starting idea context.
      - **Visual identity must be derived from *this API's specific problem domain*, not
        reused or picked in the abstract.** `frontend-design` and `no-ai-slop` (scratch-build
        workflow) drive the decision. Pull the list of competing/similar services found during
        this idea's duplication-check research (criterion 2) and look at how they actually
        present themselves — the identity must read as distinct from *those specific
        competitors*, not merely "not generic SaaS" in general. Mandi-api's earthy/harvest
        rate-board look came from its domain (agricultural trading floors) — the reasoning to
        copy is "derive from the domain," not the specific palette.
      - **Architecture must be justified by *this API's actual data shape*** — change
        frequency, volume, relational structure, all documented in the research's update-
        cadence and scope-sketch sections — not copied wholesale from calendar-api or
        mandi-api by default. State explicitly why the chosen DB/ingestion pattern fits, the
        same way mandi-api's spec justified Supabase over flat files: daily-changing
        time-series data needs indexed range queries; calendar-api's yearly data doesn't.
      - **Shared invariants come from `CONVENTIONS.md`, not improvisation** — API prefix,
        response envelope shape, error format, health/root-route behavior, rate-limit default,
        and backend/frontend framework. These stay consistent across every project this
        pipeline produces; only identity, storage choice, and domain-specific structure are
        free to vary per §4a's rules above.
      - **`no-ai-slop`'s auto-detect may misread this as an existing app** — the folder already
        has `README.md`/`DOCS\*` from scaffolding, but zero application code exists yet. If its
        auto-detection routes to the existing-app workflow, explicitly select scratch-build
        instead.
      Produce the design spec doc exactly as brainstorming normally would; every question
      brainstorming would normally ask the user gets decided per the decision-logging rule
      above instead. Once the design is complete, write `IDEA-LOG.md` Status → `design-approved`
      and commit (this is the status-before-next-stage write called out in the continuity
      section above).
   b. **Plan** — invoke `superpowers:writing-plans`. Same rule: decide and log, never block.
   c. **Build** — write `IDEA-LOG.md` Status → `in-development` and commit before starting, and
      log which build skill was chosen (`subagent-driven-development` or `executing-plans`) to
      `DECISIONS.md` before starting, per the continuity section above. Execute the plan, with
      `superpowers:test-driven-development` governing the build loop and `pick-ui-library`
      governing frontend dependency choices. Real secrets never enter a commit at any point —
      `.gitignore`/`.env.example` already exist from scaffolding; check every diff before
      committing.

      **Re-verify criterion 1 once the ingestion path is pinned.** The pre-build research
      verified the license on a *hypothesized* source; if the plan/build pins a different
      actual ingestion path (a different mirror, a direct government endpoint instead of the
      aggregator originally checked, or vice versa), re-confirm the license on *that specific*
      path before ingesting anything through it. A mismatch here — the pinned path isn't
      actually covered by the license that was checked — is fatal-blocker-worthy, not a note to
      fix later.
   d. **Quality gates — all four must pass clean before moving on, none skipped:**
      - `no-ai-slop` (existing-app workflow — the build now has real code, unlike §4a) against
        the finished build
      - `no-ai-slop-writing` against all README/docs/copy produced
      - `security-review`
      - `prod-bug-auditor` (production-readiness audit)
      Each is a real pass/fail check. A finding means fix it and re-run that specific gate —
      up to 2 fix-and-re-run attempts per gate, logged per the attempt-tracking rule above. If
      a gate still doesn't pass clean after 2 attempts, that's a fatal blocker (see below) — do
      not attempt a third round, and do not note the finding and continue anyway.
   e. **Verify it actually runs — both in a browser and at the protocol level.** Same 2-attempt
      cap and logging as §4d. Use the `run` skill (and `claude-in-chrome` if a frontend portal
      exists) to launch the app and click through the golden path in a real browser.
      Separately, verify criterion 5's hypothesis against the *built* artifact, concretely:
      `curl` the root route for a 200, check `Access-Control-Allow-Origin` is present on an
      actual API response, confirm no auth/API-key is required for a real request. This is the
      one thing the pre-build scorecard only guessed at — it must be checked for real before
      `prod-audit-passed`. Per `superpowers:verification-before-completion`: never claim "tests
      pass" or "it works" without pasting the actual command output proving it.

   **Fatal blocker path (any of a–e):** the build can't converge after the underlying skill's
   own retry caps are exhausted (`subagent-driven-development`'s 5-round cap) or a quality
   gate's 2-attempt cap above, a quality gate finds something that can't be fixed without
   invalidating the research (e.g. the license turns out more restrictive than the write-up
   found, or the awesome-list-fit check in §4e fails and can't be fixed), or the idea turns out
   unbuildable as scoped — do not mark it done and do not silently leave it in a misleading
   status. Set `IDEA-LOG.md` Status to `blocked` (commit), append what happened and why to
   `research/<slug>.md` (never overwrite the original findings), and report clearly: what
   stage, what broke, what was tried, referencing `DECISIONS.md` for the reasoning trail up to
   that point. This is the one case where stopping mid-chain is correct, not a failure to be
   autonomous — a false "done" is worse than an honest stop.

   **Unblocking:** a `blocked` idea isn't necessarily dead — it means the chain hit something
   it couldn't resolve on its own. To resume it, whoever addresses the root cause (the user
   manually, or a later invocation of this skill with new information) re-invokes the hand-off
   on that idea; the dedup/resume logic above picks it up from `blocked`, reads the appended
   findings in `research/<slug>.md` to see what broke, and either retries the specific stage
   that failed (if the blocker's cause is now resolved) or reports that it's still genuinely
   blocked. It never silently retries the same failed approach.
5. **Stop here on success.** Do not deploy (Railway/Render/Vercel/GitHub Actions secrets) and
   do not submit anything to public-apis or any other external repo — both require the user's
   own accounts/credentials and their explicit final go-ahead, and a bad submission is visible
   under their name. Update the idea's `IDEA-LOG.md` Status to `prod-audit-passed` (commit) and
   report back: what was built, every decision in `DECISIONS.md` (so the user can actually
   review them, matching their validator role), what each quality gate found and how it was
   fixed, the §4e verification output, and that two things remain pending for the user —
   deploy, then submission — plus a third pending item recorded in the report: once deployed,
   `prod-site-auditor` (live-URL check) and `firecrawl-monitor` (ongoing data-source watch)
   still need to run; note this explicitly so a future session picks them up rather than
   assuming they already happened.
6. **After the user deploys:** run `prod-site-auditor` against the live URL to verify
   externally-observable production behavior (headers, error-page leakage, auth gating) — this
   doesn't require deploy itself to be automated, it just runs once a URL exists. Report
   findings; fixing and redeploying is the user's call since it touches live infrastructure.
   Update `IDEA-LOG.md` Status → `deployed`.
7. **Ongoing:** set up `firecrawl-monitor` on the data source's terms/availability page so
   breakage or a license change surfaces as an alert instead of a silent ingestion failure.

`submitted` and `live` (the last two lifecycle statuses) are intentionally never written by
this skill — they're the user's own record of "I opened the PR" and "it got merged," set by
hand whenever that happens, same as `deployed` is the last status this chain sets itself.

### Keeping `DOCS\RESEARCH.md` in sync

If `research/<slug>.md` is corrected after a project was already scaffolded (as happened once
already — see `E:\API-PROJECTS\docs\superpowers\specs\2026-08-09-api-idea-scout-design.md`
§8.1, the postalpincode.in correction), re-copy the corrected file into
`E:\<slug>-api\DOCS\RESEARCH.md` immediately — the two must never silently diverge.

## Hub bootstrap (only if `E:\API-PROJECTS\` doesn't exist yet)

Create:
- `E:\API-PROJECTS\IDEA-LOG.md` — the header (including the status lifecycle line) plus the
  table header row above, empty body.
- `E:\API-PROJECTS\research\` — empty directory.
- `E:\API-PROJECTS\README.md` — one paragraph explaining this is the tracking hub, pointing to
  `IDEA-LOG.md` and `research/`, noting actual project code lives in sibling `E:\<slug>-api\`
  folders, not here.
- `E:\API-PROJECTS\CONVENTIONS.md` — the shared invariants every scaffolded project must follow
  (API prefix, response/error envelope shape, rate-limit default, root-route/health behavior,
  portal page set, standard component names) versus what's free to vary per project (visual
  identity, DB/storage choice, domain-specific endpoints). Written once; referenced, not
  re-derived, by every later hand-off.
- `git init` this whole hub if it isn't already a repo — `IDEA-LOG.md` and `research/` are
  meant to be committed after every update, not left as uncommitted working state between runs.
