# No-AI-Slop Checklist — Changelog

Append-only log of real-world findings from using `references/checklist.md`: a slop pattern
seen in the wild that isn't on the list yet, or a tell that produced a false positive. Log an
entry right after it happens.

Not read at audit time — keeps every audit's token cost unchanged. Periodically re-read this
file and fold recurring patterns into `checklist.md` (new tell, new category, or a wording fix
to reduce false positives). Mark an entry with the date it was folded in.

See also: `E:\dev-recipes\no-ai-slop-scratch-build\README.md` and
`E:\dev-recipes\no-ai-slop-existing-app\README.md` for the recipes this belongs to.

## 2026-08-05 — Checklist created

Baseline: 4 categories (visual design, copy/content, code structure, UX/layout), each scored
Pass/Warn/Fail/Not-Applicable, sourced from external research. No field-tested gaps yet.

## 2026-08-05 — Added category 5 (folded in same day)

User flagged, via a Shopify admin-dashboard screenshot, that AI-built apps consistently stop
at landing-page depth and never reach real product/dashboard structure: flat nav instead of
nested, inconsistent buttons/badges/cards instead of a reused component system, decorative
stat cards instead of real data surface, no progressive disclosure (overflow menus,
expandable sections). Added as Category 5 "Information Architecture & Component System."
Also sharpened Category 4's hero-formula tell (eyebrow chrome + 2-line headline + subhead +
1-2 CTAs) per the same conversation.

## 2026-08-05 — Added categories 6-7: Functional Completeness

User pointed out a different family of slop from their own apps: features built as static
mockups rather than complete features — missing edit/delete on cards, no confirmation before
delete, no feedback after save, no empty states, lists with no search/filter, admin controls
shown to everyone. Explicitly rejected a blanket "always add edit+delete" rule — added an
"Entity mutability classification" mechanism instead (user-owned/mutable vs
system-generated/immutable vs ambiguous-ask) that Category 6 depends on. Ambiguous entities
are wired into the Step 4 "Report before fixing" gate in `SKILL.md` as explicit questions
rather than scored or guessed. Category 7 covers feedback/empty-states/scale/permission-
rendering; its permission-rendering tell is deliberately scoped to UI completeness, not
security — `production-readiness`'s Security dimension still owns backend authz.

## 2026-08-05 — Added category 8: Accessibility

User confirmed, unprompted, that this is a recurring real gap across almost every app they've
built. Research backed it as a documented, named phenomenon ("AI-Generated UI Is Inaccessible
by Default"), not a vague concern. Added as a code/screenshot-checkable category (clickable
divs instead of semantic buttons, icon-only controls with no accessible name, removed focus
outlines with no replacement, no keyboard handling on custom widgets, color-only signaling,
ignored prefers-reduced-motion) — explicitly scoped as not a full WCAG compliance audit, since
that needs real screen-reader/contrast tooling this checklist can't run.

## 2026-08-05 — Audit step let Category 1/4 be scored from source, no render

Real miss on `freelance-portfolio-website`: scored Hero's Visual Design/UX-Layout categories
by reading Tailwind classes only, never rendered it. Passed an eyebrow-label + badge-row +
stagger-fade hero that the user immediately spotted as templated on sight. Cause: the
existing-app recipe only wired `claude-in-chrome` screenshots into Step 2 (reshape
before/after), not Step 1 (audit/scoring) — so scoring straight from source was technically
recipe-compliant. `SKILL.md`'s general "never skip visual verification" rule existed but
wasn't load-bearing enough to override that at scoring time. Fixed by adding an explicit
render-before-scoring requirement to Step 1 of `no-ai-slop-existing-app/README.md` for
Categories 1 and 4 specifically, with a fallback (score tentatively, say so) for sessions with
no browser tool available.

## 2026-08-05 — Category 8 downgraded to informational-only

User clarified: don't want accessibility given default equal weight in the "kill AI slop"
process. Kept Category 8 scored (still reported for awareness) but it no longer blocks the
Step 4 go-ahead the way Categories 1-7 do — a Fail there doesn't require action or wait for
approval unless the user explicitly asks to prioritize accessibility on that project.

## 2026-08-18 — Added padding/whitespace tell to Category 1, plus a fast path

User (across several sessions, most recently `portfolio-site-new`) kept hitting bloated
vertical padding/margin on sections — values like `pt-16 md:pt-20 pb-24 md:pb-32` on a Hero,
`mt-12 pt-8` before a proof strip — with no content reason for the size. Considered a
standalone padding-only skill first, rejected it as too narrow (see conversation); folded into
this skill instead. Added the tell to Category 1 (compare against the same spacing token used
on sibling sections — consistent sitewide use is a system, not slop; an outlier is). Also added
a "Fast path" section to `SKILL.md` so a narrow "remove the padding on X" request doesn't
trigger the full Step 1-4 audit-and-report pipeline — it's disproportionate for a single
spacing tweak. Not yet field-tested against a real false-positive case.
