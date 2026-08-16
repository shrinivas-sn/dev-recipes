# Scan → Verify: Bug-Finding Methodology

Precision over recall. A tool that floods the user with maybe-bugs gets ignored, and the next
real finding gets ignored along with it. Every candidate goes through Pass 2 before it's ever
reported — nothing skips the verify step, no matter how obvious it looks in Pass 1.

## Pass 1 — Scan

Broadly search the scope for candidates in these categories only. Do not go looking for
anything outside this list — that's out of scope by design (see Hard Exclusion List below).

1. **Race conditions / shared mutable state** — concurrent access to shared state with no lock,
   atomic operation, or synchronization.
2. **Unhandled exceptions/rejections on hot paths** — a common-path error that isn't caught,
   handled, or deliberately propagated with context.
3. **Resource leaks** — file handles, connections, listeners, or timers opened but not
   reliably closed/cleared, including on error paths.
4. **Auth/authz gaps** — a sensitive action or route reachable without the check that should
   gate it.
5. **Injection vectors** — SQL, shell command, template, or path-traversal input that reaches a
   sink without sanitization/parameterization.
6. **Silently swallowed errors** — an empty `catch`, or an error that's logged-and-ignored where
   the situation actually requires handling or propagation.
7. **Boundary errors in critical code** — off-by-one, null/undefined reaching a critical path,
   unvalidated index/array access on user-influenced input.
8. **Hardcoded secrets/credentials** — API keys, passwords, tokens committed directly in source
   or config.

## Pass 2 — Verify

For every candidate from Pass 1, before it is ever reported, actively try to falsify it:

- **Reachability** — is this path actually reachable from real input or invocation? Or is it
  dead code, test-only, or behind a condition that never triggers in practice?
- **Existing guards** — is there an upstream or downstream check (validation, try/catch, type
  system, framework default) that already prevents this?
- **Test coverage** — does an existing test already exercise this exact case? If so, downgrade
  confidence — someone already thought about it.
- **Blast radius** — write out the concrete failure scenario: what input or sequence of events
  triggers it, and what actually goes wrong. If you cannot articulate one concretely, discard
  the candidate — a vague "this could theoretically be a problem" is not a finding.

**Verdict:**
- **CONFIRMED** — reachable, unguarded, concrete failure scenario articulated.
- **PLAUSIBLE** — strong signal, but reachability or the absence of a guard couldn't be fully
  verified statically (e.g. the guard might exist in a file outside the current scope).
- **Discard** — falsified by any of the checks above. Do not report it, even as a minor note.

## Hard Exclusion List

Never report these, regardless of how they're phrased or how confident the scan pass is:

- Style/formatting (indentation, line length, quote style)
- Naming conventions
- Unused imports/variables
- Missing comments/docstrings (unless the absence directly causes a Docs/Operability Fail in
  the rubric — e.g. an undocumented required env var)
- Subjective code-organization opinions
- Anything a linter or formatter would already catch

## Governing Rule

When uncertain, downgrade to PLAUSIBLE or discard entirely. A missed bug is cheaper than a
false positive — false positives are what make people stop reading the report.
