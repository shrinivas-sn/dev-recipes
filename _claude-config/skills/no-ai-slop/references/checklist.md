# AI-Slop Checklist — 8 Categories, Scorable Per Page/Component

Run this against one page or component at a time — never the whole app in one sweep. Score
each category **Pass / Warn / Fail / Not-Applicable** with a one-line justification, the same
style as the `production-readiness` rubric.

**Governing rule: the brief's own explicit choices always win.** If the brief asked for
indigo, or a numbered 01/02/03 sequence, or a specific phrase, that's not a Fail — this
checklist catches *unexamined defaults*, not deliberate choices. When in doubt, ask "was this
chosen for this subject, or would it show up in any similar project regardless of subject?"

**Scope note:** this checklist scores *genericness* — does it read as templated AI output.
It is not a production-safety check. An empty catch block shows up here (generic error
handling reads as a slop tell) and separately in `production-readiness`'s Error Handling
dimension (unhandled failure is a resilience risk) — those are two different reasons to fix
the same thing, not a duplicate check.

**Two families of category:** 1-5 check how a page *looks, reads, and is structured*.
6-7 check whether a built feature actually *behaves like a complete, working feature*
rather than a static mockup of one — missing edit/delete, no confirmation before deleting
something, no feedback after saving, and so on.

## Entity mutability classification (required before scoring Category 6)

For every distinct entity type with a UI representation in scope, classify it first:

- **User-owned/mutable** — a note, a cart item, a saved profile field, anything the user
  created or owns. CRUD actions (at minimum edit + delete) are expected by default; missing
  them is a real gap.
- **System-generated/immutable record** — an audit log line, a sent invoice, a completed
  transaction, anything that represents a historical fact. CRUD actions should **not** be
  added here — offering edit/delete on these is a correctness bug, not a missing feature.
- **Ambiguous** — a "draft" that might lock after submission, a "submitted application," or
  anything where mutability isn't obvious from the brief or the code. **Do not guess either
  way.** Surface it as an explicit question in the Step 4 report (see `SKILL.md`) instead of
  scoring it — e.g. "This card represents X — should it have edit/delete? Unclear from the
  brief."

Never apply a blanket "always add edit and delete" rule — that itself becomes a slop pattern
(adding controls to immutable records that shouldn't have them).

## 1. Visual Design

The dominant AI-slop fingerprint exists because these are the statistically most common
choices in training data, not because they were chosen for a specific subject.

Named tells to check for:
- Inter or Roboto as the display typeface, used exactly as the framework default
- An indigo-to-purple gradient hero, or unmodified Tailwind defaults (`indigo-600`,
  `slate-900`) with no palette decision behind them
- A row of 3 identical rounded cards (icon + title + subtitle) as the features section
- One of the three recognized AI-default looks named in `frontend-design`'s own SKILL.md
  (cream+serif+terracotta / near-black+neon accent / newspaper hairline-rules), used without
  the brief calling for it
- Numbered 01/02/03 markers used decoratively where the content isn't actually a sequence

- **Pass**: palette/type/layout are traceable to a specific decision about this subject; if a
  default look is used, the brief asked for it.
- **Warn**: mostly deliberate, but one element (usually the font or a card-grid section) is an
  unexamined default.
- **Fail**: 2+ tells present with no brief justification — this page would look the same
  regardless of what it's actually for.
- **Not-Applicable**: no meaningful visual surface (e.g. a headless API route).

## 2. Copy / Content

A curated "dead giveaway" tier only — deliberately narrower than the full research list, which
includes ordinary technical words ("framework," "dynamic," "robust") too common in real writing
to flag without drowning in false positives.

Named tells to check for:
- Words: *delve, tapestry, boundless, treasure trove, embark(ing) on a journey, unlock the
  power of, game changer, testament to*
- Opening-paragraph filler: "In today's digital age...", "In the fast-paced world of...",
  "Navigate the landscape of..."
- Hedge-filler transitions: "It's worth noting that...", "It's important to note that..."
- Generic CTAs with no product-specific verb: "Get Started" / "Learn More" used as the only
  call-to-action with nothing said about what actually happens next

- **Pass**: copy uses the product's own vocabulary throughout; CTAs name the actual action.
- **Warn**: one or two isolated instances, otherwise specific copy.
- **Fail**: 3+ tells present, or the CTA vocabulary never changes across the page/flow.
- **Not-Applicable**: no user-facing copy in scope (e.g. a pure config file).

For long-form prose in scope (a blog/marketing page's body copy, an About page, docs) — as
opposed to UI microcopy — run the sibling `no-ai-slop-writing` skill instead of extending this
category. It carries a much deeper, prose-specific pattern list that would be noisy applied to
button labels and nav items.

## 3. Code Structure

Distinct from `production-readiness`'s Error Handling/Resilience dimension — this checks
whether the code *reads as generic*, not whether it's *safe*.

Named tells to check for:
- Generic names (`data`, `temp`, `result`, `item`) on variables that hold actual domain
  concepts with a real name available
- An abstraction (factory, strategy pattern, DI container) introduced for a single call site
  or a trivial script, with no second use case in sight
- Loss of domain language — a function that should be named for what it does in the product
  domain is instead named for its generic mechanism (`processData` instead of
  `settleInvoice`)
- An empty `catch` block, or a bare `except:`/generic `Exception` catch with no handling —
  reads as templated defensive boilerplate rather than a considered decision

- **Pass**: naming and structure consistently reflect the actual domain; abstractions exist
  because there's a real second use case.
- **Warn**: isolated generic naming in non-critical code, otherwise domain-specific.
- **Fail**: 3+ tells present, or a one-use abstraction wrapping the entire module.
- **Not-Applicable**: scope is pure config/data with no logic to name.

## 4. UX / Layout Patterns

Named tells to check for:
- The templated page skeleton — Hero → 3-feature-grid → social proof → pricing → FAQ →
  footer — applied because it's the default, not because it fits this product's actual user
  job
- The templated hero formula specifically: centered content, an "eyebrow" chrome (small
  uppercase label with a dot/line decoration), a 2-line headline, a short 2-3 word-feeling
  subhead, and exactly one or two CTA buttons — used because it's the statistical center of
  training data, not because this product's hero needs to say that
- Generic empty states ("No data") or generic error toasts ("Something went wrong") that
  don't say what happened or what to do next
- A flow that could belong to any SaaS product, with no step that reflects what this specific
  product actually does

- **Pass**: page structure and flow are driven by what this product's user is actually trying
  to do; empty/error states are specific and actionable.
- **Warn**: structure is templated but content within it is specific; empty/error states are
  generic but not wrong.
- **Fail**: the templated skeleton is used wholesale with no adaptation to the actual product.
- **Not-Applicable**: no user flow in scope (e.g. a single static content page).

## 5. Information Architecture & Component System

The gap between a marketing landing page and a real product/dashboard interface. AI-built
apps typically nail single-page layout but stop short of the structural depth a real product
needs — this category exists to catch that specifically, since it's a different discipline
than visual polish (category 1) or layout skeleton (category 4).

Named tells to check for:
- **Flat navigation only** — every nav item sits at the same single level, with no item
  expanding into sub-pages/sub-features, when the product actually has enough surface area
  to need that (e.g. a settings area with 6+ unrelated sub-sections crammed into one flat
  list instead of grouped/nested)
- **No component system discipline** — buttons, badges, dropdowns, and cards don't repeat
  identically across the app; every screen invents its own button style/spacing instead of
  reusing one small set of components with clear hierarchy (primary/secondary/tertiary
  actions look visually distinct and stay consistent everywhere)
- **Decorative stats instead of real data surface** — metric tiles/cards show placeholder or
  static numbers with no real state behind them, where a real product would show live,
  meaningful values (even a mocked "live" value is more honest than an obviously fake stat)
- **No progressive disclosure** — everything is shown at once with no collapsing sections,
  overflow ("...") menus, or expandable groups, so the interface can't scale past a handful
  of features without becoming a wall of UI

- **Pass**: nav depth and component reuse match the product's actual feature count; secondary
  actions are tucked behind overflow/expansion rather than all competing for attention.
- **Warn**: component reuse is inconsistent across 1-2 screens, otherwise structured.
- **Fail**: every screen reinvents its own nav/button/card patterns, or a feature-rich product
  is forced into a single flat list with no grouping at all.
- **Not-Applicable**: scope is a single-page site with genuinely too little surface area to
  need nested structure (e.g. a one-page portfolio).

## 6. Entity Actions & Lifecycle

Uses the entity mutability classification above — score this only for entities already
classified as user-owned/mutable or system-generated/immutable. Ambiguous entities are
questions in the Step 4 report, not a score here.

Named tells to check for:
- A user-owned/mutable entity rendered with no way to edit or remove it
- A destructive action (delete, remove, revoke) on something genuinely irreversible, with no
  confirmation step and no undo path
- A *reversible* action gated behind a heavyweight confirmation dialog instead of a lighter
  undo-toast — over-friction on a low-risk action is also a craft/completeness issue, not
  just missing friction on a risky one
- A system-generated/immutable entity that *was* given edit/delete controls — this is a
  correctness bug, not a feature to praise

- **Pass**: mutable entities have working CRUD actions; immutable entities correctly have
  none; destructive-vs-reversible actions are given proportionate confirmation.
- **Warn**: one entity type has a gap, otherwise correctly handled.
- **Fail**: 2+ mutable entities missing expected actions, or any immutable entity incorrectly
  made editable/deletable, or a genuinely irreversible action with no confirmation at all.
- **Not-Applicable**: no persistent entities with a UI representation in scope.

## 7. Interaction Completeness & Feedback

Named tells to check for:
- An action (save/delete/submit) that resolves with no visible state change — no toast, no
  spinner, no success/error signal; the user can't tell whether it worked
- A list/view that can reach zero items (first use, after a delete, after a filter) with no
  empty state — a blank container with no explanation or next action
- A list realistically likely to exceed roughly 10-15 items with no search/filter/sort — below
  that range adding one is over-engineering, above it the absence is a real gap (brief/context
  still wins: a 5-item list known to grow to hundreds deserves it early)
- A control rendered for a user who cannot actually use it — an admin-only action shown
  regardless of role. **Scope note:** this checks UI completeness/honesty (does the interface
  show the user things they can't do), not security — hiding a button is never a substitute
  for backend authorization, which is `production-readiness`'s Security dimension, not this
  one's. A control correctly hidden here can still need a backend check there.

- **Pass**: actions always resolve to a visible state; empty states exist and are actionable;
  lists past ~10-15 items have search/filter/sort; visible controls match what the user can
  actually do.
- **Warn**: one interaction type (usually feedback or empty states) is inconsistent, otherwise
  complete.
- **Fail**: 2+ tells present, or any action that silently succeeds/fails with zero signal.
- **Not-Applicable**: scope has no user-triggered actions or lists (e.g. a static content
  page).

## 8. Accessibility

This checks the same way the rest of the checklist works — read code, look at a screenshot,
spot the obvious tells. **Scope note:** it is not a full WCAG AA/AAA compliance audit (that
needs real screen-reader testing and automated contrast tooling) — it catches common,
code-visible accessibility failures, and doesn't claim compliance.

**Priority note: informational only, never blocking by default.** Unlike Categories 1-7, a
Fail here is reported for awareness but is never treated as something that must be fixed
before proceeding — it doesn't require go-ahead in the Step 4 report the way the other
categories do (see `SKILL.md`). Raise its priority for a given project only if explicitly
asked to.

Named tells to check for:
- A clickable `<div>`/`<span>` (`onClick` with no semantic element) standing in for a button
  or link — not reachable or activatable by keyboard
- An icon-only control (button, nav item) with no accessible name — no `aria-label`, no
  visually-hidden text, nothing a screen reader can announce
- `outline: none`/`outline: 0` (or equivalent) on a focusable element with no visible
  replacement focus style
- A custom interactive widget (dropdown, tab set, modal) with no keyboard handling — can't be
  operated with Tab/Enter/Space/Escape, only mouse
- Text or a status signal that relies on color alone (e.g. red text with no icon/label for an
  error), or that reads as low-contrast against its background
- Motion/animation with no `prefers-reduced-motion` handling on a page that leans heavily on it

- **Pass**: interactive elements are semantic or properly keyboard-operable; icon-only
  controls have accessible names; focus is visible; color isn't the sole signal; heavy motion
  respects reduced-motion.
- **Warn**: one isolated instance (e.g. one icon button missing a label), otherwise clean.
- **Fail**: 2+ tells present, or any keyboard trap (a control that can't be tabbed away from).
- **Not-Applicable**: scope has no interactive/visual surface (e.g. a backend-only module).

## Sources

Research pulled 2026-08-05:
- [Why AI Design Looks Generic](https://superdesign.dev/blog/why-ai-design-looks-generic)
- [AI Slop Fonts and Gradients: The Tells That Give Away AI Design](https://www.925studios.co/blog/ai-slop-design-tells)
- [Why Every AI-Built Website Looks the Same](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p)
- [How to fix the 'AI-generated' look in your frontend](https://dev.to/alanwest/how-to-fix-the-ai-generated-look-in-your-frontend-1ahh)
- [AI-Specific Code Smells: From Specification to Detection](https://arxiv.org/pdf/2509.20491)
- [How to Tell if Code is AI Generated](https://diatomenterprises.com/blog/how-to-tell-if-code-is-ai-generated/)
- [Most Common ChatGPT Phrases That Sound Too AI](https://undetectable.ai/blog/gpt-phrases/)
- [How to write with ChatGPT without it sounding like ChatGPT](https://www.jodiecook.com/ban-list/)

Added 2026-08-05 (category 5 + hero formula, from a Shopify admin-dashboard screenshot the
user pointed at as the target level of structural depth):
- [Six key principles of dashboard information architecture](https://www.gooddata.ai/blog/six-principles-of-dashboard-information-architecture/)
- [AI/BI Dashboard Navigation: Nested Tabs, Page Structure, and Reusable Visuals](https://community.databricks.com/t5/warehousing-analytics/ai-bi-dashboard-navigation-nested-tabs-page-structure-and/td-p/159118)
- [AI design slop: the tells, and how I built a tool to catch them](https://solodesign.cc/blog/ai-design-slop-the-tells/)

Added 2026-08-05 (categories 6-7, functional completeness — from the user's own experience
having to explicitly ask for edit/delete on cards, plus discussion of related gaps):
- [Confirmation Dialogs Can Prevent User Errors (If Not Overused)](https://www.nngroup.com/articles/confirmation-dialog/)
- [Dangerous UX: Consequential Options Close to Benign Options](https://www.nngroup.com/articles/proximity-consequential-options/)
- [Empty state UI design: turn blank screens into next steps](https://www.setproduct.com/blog/empty-state-ui-design)
- [Getting filters right: UX/UI design patterns and best practices](https://blog.logrocket.com/ux-design/filtering-ux-ui-design-patterns-best-practices/)
- [Defining Helpful Filter Categories and Values for Better UX](https://www.nngroup.com/articles/filter-categories-values/)
- [Optimistic UI Patterns for Improved Perceived Performance](https://simonhearne.com/2021/optimistic-ui-patterns/)
- [Saving and feedback — Pajamas Design System (GitLab)](https://design.gitlab.com/patterns/saving-and-feedback/)
- [The Browser Is Not a Security Boundary](https://dev.to/trustboundarylab/the-browser-is-not-a-security-boundary-1flj)

Added 2026-08-05 (category 8, accessibility — user confirmed this as a recurring gap across
almost every app they've built):
- [AI-Generated UI Is Inaccessible by Default](https://frontendmasters.com/blog/ai-generated-ui-is-inaccessible-by-default/)
- [WebAIM's WCAG 2 Checklist](https://webaim.org/standards/wcag/checklist)
- [WCAG 2.1.1 Keyboard Accessibility Explained](https://www.uxpin.com/studio/blog/wcag-211-keyboard-accessibility-explained/)
