---
topic: express-5-error-handling
domain: express
tier: 1
pinned_version: express@5.2.1
verified: 2026-08-16
ttl_days: 30
sources:
  - https://context7.com/expressjs/express/llms.txt
  - https://github.com/expressjs/express/blob/v5.2.0/Readme.md
  - https://expressjs.com/en/guide/error-handling.html
---

# Express 5 error handling

## Answer

A JSON API on Express 5 needs a **4-argument** terminal error handler, registered last —
after the routes *and* after the 404 handler:

```js
// 404 handler: 2 args -> a normal request handler, NOT an error handler.
app.use((req, res) => sendError(res, 'Endpoint not found', 404));

// Error handler: MUST be exactly 4 args, MUST be registered last.
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  sendError(res, status >= 500 ? 'Internal Server Error' : err.message, status);
});
```

In Express 5 you no longer need `try/catch` in async handlers — a rejected promise is
routed to this handler automatically. You *do* still need `next(err)` in callback-style
(non-promise) async code.

## Why

`Layer.prototype.handleRequest` skips any handler with `fn.length > 3`, and
`Layer.prototype.handleError` skips any handler with `fn.length !== 4`. Arity is the *only*
signal Express uses to tell the two apart — there is no flag, no registration call:

```js
Layer.prototype.handleError = function handleError (error, req, res, next) {
  const fn = this.handle
  if (fn.length !== 4) {
    return next(error)          // not a standard error handler -> skipped
  }
  ...
}

Layer.prototype.handleRequest = function handleRequest (req, res, next) {
  const fn = this.handle
  if (fn.length > 3) {
    return next()               // error middleware is never run as a request handler
  }
  try {
    const ret = fn(req, res, next)
    if (isPromise(ret)) {
      ret.then(null, function (error) { next(error || new Error('Rejected promise')) })
    }
  } catch (err) { next(err) }
}
```

That `isPromise(ret)` wrapper is the whole of Express 5's "automatic async error handling".
It is also why a 2-arg 404 handler cannot double as a safety net: once an error is in
flight, Express only considers 4-arg layers, so the 404 handler is stepped over entirely
and the request falls through to Express's built-in `finalhandler`.

`finalhandler` responds in **HTML**, and includes the full stack trace whenever
`NODE_ENV !== 'production'`.

## Traps

1. **"My try/catch blocks cover it."** They cover the route bodies only. Errors thrown in
   *middleware* never touch them. `express.json()` on a malformed body is the common case
   and needs no unusual client to trigger — just a bad POST.

2. **A 2-arg wildcard `app.use` looks like a catch-all but is not.** It catches unmatched
   *routes*, not errors. This reads as complete coverage and isn't; verified below.

3. **`NODE_ENV=production` is a partial mitigation, not a fix.** It suppresses the stack
   trace but `finalhandler` still replies `Content-Type: text/html`. A JSON API that
   answers 400/500 in HTML breaks its own contract — clients doing `res.json()` get a
   parse error instead of the documented `{error, message, status}` envelope.

4. **Express 4 habits invert here.** In v4, an un-caught async rejection crashed the
   process; the advice was "always try/catch or use express-async-handler". In v5 that
   advice is obsolete for promises and `express-async-handler` is dead weight. Answering
   this from memory gives the v4 answer.

## Verified

Reproduced against a real `express@5.2.1` install, mirroring a
`cors → rateLimit → express.json() → routes → 2-arg 404 → listen` stack with no 4-arg
handler:

| Request | NODE_ENV unset | NODE_ENV=production |
|---|---|---|
| unknown route | 404 JSON (correct) | 404 JSON (correct) |
| async `throw` in route | **500 `text/html`, full stack trace + absolute server paths** | 500 `text/html`, `Internal Server Error` |
| POST malformed JSON body | **400 `text/html`, `SyntaxError` + stack** | 400 `text/html`, `Bad Request` |

The healthy path returns correct JSON in all cases — which is exactly why this survives
manual testing.

## Sources

- Express 5 error-handling guidance and 4-arg requirement — https://context7.com/expressjs/express/llms.txt
- `Layer.handleRequest` / `Layer.handleError` arity checks and promise-rejection wrapper — `router/lib/layer.js`, via Context7 `/expressjs/express/v5.2.0`
- https://expressjs.com/en/guide/error-handling.html
