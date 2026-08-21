# MOBILE.md — <project name>

Run: <date> · profile: <framework>, <n> routes, <n> viewports
Browser: puppeteer-core <version> against <chrome path>

## Run profile
<paste Phase 0's detected stack, serve URL, breakpoints, routes, browser>

## Derived checks
Included: <comma-separated check ids>
Excluded: <id> — <one-line reason>
<repeat one line per excluded family — a missing check and a passed check must never look the same>

## Score
Blockers: <n>   Majors: <n>   Minors: <n>   Warnings: <n>   Unstable: <n>

| Family | xs 320 | sm 390 | md 768 | land | Worst measured value |
|---|---|---|---|---|---|
| overflow-x | | | | | |
| viewport-meta | | | | | |
| tap-targets | | | | | |
| text-legibility | | | | | |
| form-input-zoom | | | | | |
| layout-collision | | | | | |
| fixed-bar-budget | | | | | |
| dvh-safe-area | | | | | |
| media-cls | | | | | |
| touch-affordance | | | | | |
| nav-drawer | | | | | |
| reduced-motion | | | | | |

Cell values: `pass` · `FAIL` · `warn` · `n/a` · `unstable` — never blank for an included family.
If a family passed everywhere, say so plainly in this table. A report that only ever
finds problems is noise, and the honesty rules in `START-HERE.md` apply here.

## Findings

Ordered blocker -> major -> minor, then by how many viewports they affect.
Every finding cites a measured number — a finding with no number is not a
finding, delete it or go measure it.

### [BLOCKER] <family> @ <viewports>
Measured: <the actual number(s) from the JSON>
Offenders: `<selector>` · `<selector>` (up to 10, from the offenders array)
Cause: <one line, from reading the actual source — not a guess>
Fix: <the specific edit, with file:line>
Status: not-fixed | fixed (re-probed <date>: <before> -> <after>, delta <n>)

<repeat per finding>

## Fix ledger

| # | Family | File:line | Before | After | Re-probed |
|---|---|---|---|---|---|
