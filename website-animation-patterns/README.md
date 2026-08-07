# Website Animation Patterns

A growing collection of implementation patterns, gotchas, and library notes for building website
animations that hold up under real conditions — not just in a quick demo. Organized by
library/technique as entries accumulate; each one below was extracted from a real bug that cost
a full debugging pass to root-cause the first time, so the next project (any stack, any library)
doesn't repeat it.

Add to this recipe rather than starting a new one when the next animation lesson shows up,
whatever library it's in — CSS-only, Framer Motion, anime.js, motion.dev, native View
Transitions, etc. Give each library/technique its own `##` section below, matching the shape of
the GSAP section.

## General principles (library-agnostic)

These hold regardless of what's driving the animation.

### Reduced motion is "gentler," not "skip the entrance"

The bar (from Emil Kowalski's animation philosophy): under `prefers-reduced-motion: reduce`, the
*state change* should still be legible — something still visibly appears — but positional
travel, scale, and rotation are dropped. Don't special-case this per component; branch on it
once and thread it through every animated property.

Plain CSS `transition`s (a hover color swap, a chevron rotate) aren't covered by a JS-level
reduced-motion check — cover them once, globally, regardless of what animates the rest of the
page:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

(See the GSAP section below for the JS-side branching pattern this pairs with.)

### GPU-only properties in practice: a "grow/slide" indicator needs `scale`, not `width`/`height`

A sliding/resizing pill (nav active-link indicator, tab underline, segmented control) is
tempting to animate via `width`/`height` directly — but those are layout properties; animating
them forces a synchronous layout recalc every frame, the same class of problem as CSS
`transition: all`. Animate `transform` (`scale`, `translate`) instead, from a fixed
`transform-origin`, and only ever *set* (never animate) the real `width`/`height` once the
transform-based motion settles. See the GSAP section for a worked example and its first-run edge
case.

### Diagnosing a backgrounded/automated browser tab vs. a real animation bug

`requestAnimationFrame` — what most JS animation libraries tick on — is **fully suspended** by
Chrome when `document.hidden === true`, not just throttled. An automated browser tool
(Claude-in-Chrome, Puppeteer, CI) frequently doesn't hold real OS-level tab focus, so animations
you're trying to screenshot-verify can appear frozen mid-entrance, or a `setTimeout` recursion
can crawl at a tiny fraction of its real speed — and it looks exactly like a bug.

**Diagnose before you debug the animation code:**

```js
document.hidden          // true → rAF is fully suspended, not just slow
document.visibilityState // 'hidden'
```

If your library can jump a running animation straight to its end state (bypassing rAF
entirely — GSAP's `timeline.progress(1)` is one example, see below), and that produces the
correct final DOM state, the code is right and what you saw was the tab-visibility artifact —
not a real bug. Don't "fix" working code chasing a screenshot glitch that only exists because the
verifying tab wasn't focused.

## GSAP + React

Correctness patterns for GSAP inside React (via `@gsap/react`'s `useGSAP`), extracted from
migrating a live site off Framer Motion. None of these show up in a quick demo — they surface
under specific, easy-to-miss conditions (StrictMode's double-effect, a hover interrupting an
idle animation, a non-integer `devicePixelRatio`).

### The `useGSAP` scope problem

`useGSAP(() => { ... }, { scope })` auto-tracks every GSAP animation created **synchronously
inside that callback** and reverts them on unmount/StrictMode-remount. Anything created
**later** — inside an event handler, a `ScrollTrigger` callback, a `setTimeout`, an `onComplete`
— is invisible to that tracking. This one fact is the root cause of most of the patterns below.

### Pattern — `contextSafe` for anything created outside the synchronous callback

```js
useGSAP((context, contextSafe) => {
  // Tracked automatically — created synchronously, right here.
  gsap.to('.hero-name', { opacity: 1, duration: 0.6 });

  // NOT tracked — created later, inside a handler. Wrap it.
  const onEnter = contextSafe(() => {
    gsap.to('.card', { scale: 1.05, duration: 0.3 });
  });
  el.addEventListener('mouseenter', onEnter);

  return () => el.removeEventListener('mouseenter', onEnter);
}, { scope: root });
```

Miss this and the tween still *works* — until StrictMode's mount→cleanup→mount cycle (dev) or
a real unmount leaves an untracked, still-running tween pointed at a detached node. Not visibly
broken in a quick check; reproducible once you know to look for duplicate listeners after an
HMR reload or a StrictMode double-invoke.

**Also remember**: raw `addEventListener` calls on refs need their own manual cleanup —
`contextSafe` only tracks GSAP animations, not DOM listeners. Both leaks look identical
(nothing visibly wrong until StrictMode/unmount) and both need fixing together.

### Pattern — kill and recreate, never `pause()`/`resume()`, a relative-value tween

```js
// A continuous idle animation using a relative value:
const idle = gsap.to(el, { y: '+=8', duration: 2.4, repeat: -1, yoyo: true });
```

`y: '+=8'` computes its start/end **once, at creation** (whatever `el`'s `y` is right then), and
interpolates between those two fixed numbers forever — regardless of what any *other* tween
later does to that element.

If something else moves the element while this one is merely `.pause()`d, then `.resume()`
snaps back to the paused tween's own stale cached value, not the element's real current
position — a visible few-pixel jump. Symptom: "it recovers correctly, then jumps/drifts a
little" right after a hover-out or any other interruption.

```js
// Wrong: pause/resume drifts after anything else touches the element's position
idle.pause();
// ...another tween moves `el` to a specific spot...
idle.resume(); // snaps toward the paused tween's stale start/end, not the new position

// Right: kill it, and recreate fresh once the interruption settles
idle.kill();
// ...another tween moves `el`, with its own onComplete...
onComplete: () => {
  idle = gsap.to(el, { y: '+=8', duration: 2.4, repeat: -1, yoyo: true }); // re-anchored to *now*
}
```

### Pattern — reduced motion, GSAP-side

The general principle is above; here's the GSAP shape of it:

```js
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.fromTo(
  el,
  reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.95 },
  reduceMotion
    ? { opacity: 1, duration: 0.4 }
    : { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
);
```

The element still lands at its correct final transform under reduced motion (via the "to"
object, applied instantly) — it just never *travels* there. Branch on `reduceMotion` at the top
of every `useGSAP` callback and thread it through every `fromTo`/`to` call in that scope, rather
than special-casing per component.

### Pattern — continuous/idle motion needs a delay after any settle animation

If an idle animation (the kill/recreate pattern above) starts the *instant* an entrance or
interruption-recovery tween completes, it reads as "it moved right after it landed" rather than
"it's idling" — because from the user's perspective, that's exactly what happened.

```js
onComplete: () => {
  // Not this — starts drifting the moment it settles:
  // idle = gsap.to(el, { y: '+=8', repeat: -1, yoyo: true, duration: 2.4 });

  // This — a beat of stillness first:
  idle = gsap.to(el, { y: '+=8', repeat: -1, yoyo: true, duration: 2.4, delay: 0.45 });
}
```

~0.4–0.5s is enough to read as "settled, then idling" instead of "still moving." Apply this
delay both on initial mount *and* on every re-settle after an interruption (hover-out, etc.) —
it's the same perceptual problem both times.

### Gotcha — the GPU-only sliding indicator, worked example

The general principle is above (`scale`, not `width`/`height`); the GSAP shape, plus its edge
case:

```js
// Wrong — width is layout, not transform
gsap.to(pill, { x, width, duration: 0.32, ease: 'power3.out' });

// Right — scaleX from a left-anchored origin achieves the identical visual result
// pill needs `transform-origin: left` in its CSS/className
gsap.set(pill, { width: currentWidth, scaleX: 1 }); // instant rebase, not animated
gsap.to(pill, {
  x,
  scaleX: targetWidth / currentWidth,
  duration: 0.32,
  ease: 'power3.out',
  onComplete: () => gsap.set(pill, { width: targetWidth, scaleX: 1 }), // collapse scale, lock in real width
});
```

Watch the edge case: guard "first-ever placement" (no prior width to compute a ratio from) with
an explicit boolean flag, not a `width < 1` threshold — a hairline border can make an
effectively-empty box report a small nonzero `getBoundingClientRect().width`, slipping past a
numeric threshold and producing a wildly wrong (and visibly distorted) scale ratio on first run.

Copy-in templates: [`templates/useIdleBob.ts`](./templates/useIdleBob.ts),
[`templates/slidingPillScaleX.ts`](./templates/slidingPillScaleX.ts).

### Gotcha — verifying GSAP specifically on a backgrounded tab

The general diagnosis is above; GSAP's specific escape hatch is forcing a timeline straight to
its end state, bypassing rAF entirely:

```js
tl.progress(1); // jumps to the end; onComplete callbacks still fire correctly
```

## Third-party library notes

### naughtyduk/`liquid-gl` (WebGL "liquid glass" refraction)

Real, and genuinely higher-fidelity than a CSS `backdrop-filter` + SVG `feDisplacementMap`
approximation — it actually rasterizes and refracts live DOM content through a WebGL shader.
But as of v2.0.1 (checked 2026-08, days-old release, single maintainer) it has a confirmed,
reproducible bug: it sets the target element's `opacity: 0` to hide the original content, then
renders a canvas replacement — and under a **fractional `devicePixelRatio`** (e.g. `1.4875`,
which is what you get from a non-100% Windows display-scaling setting — a common condition, not
an edge case), that replacement draw is unreliable and sometimes silently renders nothing.
Hidden original + failed replacement = content that vanishes with no error, no console warning,
nothing to catch it in review.

Confirmed via direct WebGL canvas pixel readback (`ctx.readPixels(...)`), not just "it looked
broken in a screenshot" — ruled out tab-backgrounding, multiple-instance conflicts, and stale
render timing as the cause before concluding it's the library.

If you need real WebGL glass refraction: budget time to either (a) pin a specific tested
version and verify on real fractional-DPR hardware before shipping, or (b) wait for the library
to mature. The CSS `backdrop-filter: blur() url(#feDisplacementMap-filter)` approximation is
lower-fidelity but never silently drops content — safer default for anything content-critical.

## See also

- [`no-ai-slop-existing-app/`](../no-ai-slop-existing-app/) — the retrofit workflow the GSAP
  migration above ran inside.
- `~/.claude/skills/animate/`, `~/.claude/skills/review-animations/` (Emil Kowalski's motion
  philosophy) — the quality bar every pattern in this recipe is implementing, regardless of
  library.
