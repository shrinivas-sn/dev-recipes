# MOBILE.md — fixture-project

Run: 2026-08-21 · profile: static, 1 route, 3 viewports
Browser: puppeteer-core 24 against Chrome

## Run profile
Stack: plain static HTML/CSS. Routes: `/`. Viewports: xs (320), sm (390), land (844x390).

## Derived checks
Included: overflow-x, viewport-meta, layout-collision
Excluded: form-input-zoom — no `<form>` or text input on the page
Excluded: nav-drawer — no nav landmark

## Score
Blockers: 1   Majors: 0   Minors: 0   Warnings: 0   Unstable: 0

| Family | xs 320 | sm 390 | md 768 | land | Worst measured value |
|---|---|---|---|---|---|
| overflow-x | FAIL | FAIL | n/a | FAIL | +180px at `.hero__banner` (320) |
| viewport-meta | pass | pass | n/a | pass | — |
| layout-collision | pass | pass | n/a | pass | — |

## Findings

### [BLOCKER] overflow-x @ xs, sm, land
Measured: documentElement.scrollWidth 500 vs clientWidth 320 (+180px)
Offenders: `.hero__banner` right=500, vw=320
Cause: not yet diagnosed
Fix: not yet applied
Status: not-fixed

## Fix ledger

| # | Family | File:line | Before | After | Re-probed |
|---|---|---|---|---|---|
