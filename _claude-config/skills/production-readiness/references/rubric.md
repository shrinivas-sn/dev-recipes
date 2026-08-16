# Production Readiness Rubric — 8 Dimensions

Score each dimension **Pass / Warn / Fail / Not-Observable**, with one line of justification.
Never guess to fill a dimension the current scope can't actually speak to — mark it
Not-Observable instead. A missing Pass is honest; a fabricated Pass is a lie the user will
discover later, at a worse time.

## 1. Security

Authn/authz enforced on sensitive endpoints and actions. Secrets come from env/secret-manager,
never hardcoded. Input validated at trust boundaries (user input, external API responses).

- **Pass**: sensitive routes check auth before acting; secrets read from env; inputs validated
  before reaching a query/shell/template sink.
- **Warn**: authz present but inconsistent across handlers; validation exists but is
  incomplete (e.g. client-side only).
- **Fail**: hardcoded credentials/API keys; a state-changing endpoint with no authz check;
  unsanitized input reaching a SQL/shell/template sink.
- **Not-Observable**: scope has no networked or privileged surface (e.g. a pure utility
  function).

## 2. Error Handling & Resilience

Exceptions/rejections on hot paths are handled or deliberately propagated, not silently lost.
External calls have retry/backoff or explicit timeout handling.

- **Pass**: errors on common paths are caught and handled or intentionally bubbled with
  context; external calls have timeout/retry logic.
- **Warn**: a generic catch-all exists but discards error context/type.
- **Fail**: an unhandled exception/rejection can crash the process on a common path; an empty
  `catch` block swallows an error with no logging or handling.
- **Not-Observable**: scope is pure computation with no I/O or external calls.

## 3. Observability

Logs/metrics/traces exist at state transitions and failure points, structured enough to be
useful in an incident, not just noise.

- **Pass**: state transitions and errors are logged with structured context (IDs, not just a
  message string); critical paths have metrics or tracing.
- **Warn**: logging exists but is unstructured or inconsistent across modules.
- **Fail**: a failure path produces zero log/metric/trace signal — it would be invisible during
  an incident.
- **Not-Observable**: no operational surface in scope (e.g. a static config file).

## 4. Test Coverage & CI

Changed or critical logic has both happy-path and edge/error-case tests, and CI actually runs
them (not disabled, not a no-op).

- **Pass**: critical logic has happy-path plus at least one edge/error-case test; CI runs the
  suite on relevant changes.
- **Warn**: only happy-path tests exist; error/edge cases are untested.
- **Fail**: new auth, money-handling, or data-mutation logic has no tests; a CI test step is
  disabled or configured to always pass.
- **Not-Observable**: scope is docs/config only, nothing testable.

## 5. Scalability / Performance

No unbounded loops or queries over growing collections on hot paths; large data is paginated or
streamed rather than loaded wholesale.

- **Pass**: hot-path queries/loops are bounded or paginated; large payloads are streamed.
- **Warn**: works at current scale but has a known ceiling (e.g. an in-memory cache with no
  eviction).
- **Fail**: a query scales with user-controlled input on a hot path with no bound; a blocking
  synchronous call sits in a request handler with no timeout.
- **Not-Observable**: scope isn't on a hot path or scaling-sensitive surface.

## 6. Deployment Hygiene

Config and secrets are externalized (env vars, config service), not hardcoded per-environment.
A rollback or feature-flag path exists for risky changes.

- **Pass**: environment-specific values come from config, not code branches; a risky change has
  a flag or rollback path.
- **Warn**: config is partially externalized — some values still hardcoded.
- **Fail**: hardcoded production URLs, keys, or environment-specific branches in code; a risky
  change ships with no way to roll it back independently of a full redeploy.
- **Not-Observable**: scope has no deployment surface (e.g. an internal-only library with no
  environment variance).

## 7. Data Integrity

Multi-step writes are transactional where correctness requires it. Retryable operations are
idempotent. Data is schema-validated before persistence.

- **Pass**: multi-step writes are wrapped in a transaction where partial completion would
  corrupt state; retried operations are idempotent (e.g. keyed by an idempotency token).
- **Warn**: validation exists but is incomplete or only enforced client-side.
- **Fail**: a multi-step write with no transaction can leave the system in a partially-applied
  state; a retryable operation can double-apply (e.g. double-charging a payment).
- **Not-Observable**: scope has no persistence layer.

## 8. Docs / Operability

Setup/runbook docs match current behavior. Breaking changes and new required config are
documented. Error messages are actionable, not just "something went wrong."

- **Pass**: docs reflect current setup/config; a breaking change is called out; error messages
  point at the actual cause.
- **Warn**: docs are stale or incomplete relative to the change in scope.
- **Fail**: a new required env var or config value is undocumented, which would cause a silent
  deploy failure for the next person who doesn't know to set it.
- **Not-Observable**: scope has no operator-facing surface (e.g. a pure internal refactor with
  no config/behavior change).
