# GSAP + React Patterns

Production-grade animation patterns for GSAP inside React using `@gsap/react`'s `useGSAP` hook.

**When to use:** Building smooth, performant animations in React apps with scroll triggers, timelines, or complex sequences.

## Reference

- **Official:** [github.com/greensock/GSAP](https://github.com/greensock/GSAP)
- **AI Skills:** [github.com/greensock/gsap-skills](https://github.com/greensock/gsap-skills) — AI-specific patterns and best practices
- **React Hook:** [@gsap/react useGSAP](https://gsap.com/docs/React/)

## Core Patterns

### 1. The `useGSAP` Scope Problem

`useGSAP` auto-tracks animations created **synchronously** inside the callback. Anything created later (event handlers, `setTimeout`, `onComplete`) is invisible to tracking.

```js
useGSAP((context, contextSafe) => {
  // Tracked automatically
  gsap.to('.hero-name', { opacity: 1, duration: 0.6 });

  // NOT tracked — wrap with contextSafe
  const onEnter = contextSafe(() => {
    gsap.to('.card', { scale: 1.05, duration: 0.3 });
  });
  el.addEventListener('mouseenter', onEnter);

  return () => el.removeEventListener('mouseenter', onEnter);
}, { scope: root });
```

**Gotcha:** Missing `contextSafe` causes memory leaks on unmount/StrictMode.

### 2. Kill and Recreate, Never Pause/Resume

Relative-value tweens (`y: '+=8'`) cache their start/end once. `pause()`/`resume()` snaps to stale position if anything else moved the element.

```js
// Wrong — drifts after interruption
idle.pause();
// ... another tween moves element ...
idle.resume(); // snaps to stale cached position

// Right — re-anchor to current position
idle.kill();
onComplete: () => {
  idle = gsap.to(el, { y: '+=8', repeat: -1, yoyo: true });
}
```

### 3. Reduced Motion, GSAP-Side

Branch on `prefers-reduced-motion` at the top of every `useGSAP` callback and thread through all tweens:

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

### 4. Continuous/Idle Motion Needs Delay

Idle animation starting instantly after entrance reads as "still moving." Add ~0.4–0.5s delay:

```js
onComplete: () => {
  idle = gsap.to(el, { 
    y: '+=8', 
    repeat: -1, 
    yoyo: true, 
    duration: 2.4,
    delay: 0.45 // reads as "settled, then idling"
  });
}
```

## Gotchas

### GPU-Only Sliding Indicator

Animating `width`/`height` forces layout recalc every frame. Use `scaleX` with fixed `transform-origin` instead:

```js
// Wrong — layout thrashing
gsap.to(pill, { x, width, duration: 0.32, ease: 'power3.out' });

// Right — GPU-accelerated
gsap.set(pill, { width: currentWidth, scaleX: 1 });
gsap.to(pill, {
  x,
  scaleX: targetWidth / currentWidth,
  duration: 0.32,
  ease: 'power3.out',
  onComplete: () => gsap.set(pill, { width: targetWidth, scaleX: 1 })
});
```

**Watch:** Guard "first-ever placement" with an explicit flag, not a `width < 1` threshold — hairline borders can slip past numeric checks.

### Verifying on Backgrounded Tabs

Use `timeline.progress(1)` to jump to end state, bypassing rAF:

```js
tl.progress(1); // Verifies code is correct if final DOM state is right
```

## Templates

- [`useIdleBob.ts`](./templates/useIdleBob.ts) — Reusable idle bob animation
- [`slidingPillScaleX.ts`](./templates/slidingPillScaleX.ts) — Sliding indicator with scaleX

## See Also

- [Core Principles](_core/principles.md)
- [Diagnostics](_core/diagnostics.md)
