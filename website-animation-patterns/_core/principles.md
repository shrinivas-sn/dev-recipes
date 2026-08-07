# Universal Animation Principles

These principles apply regardless of library or framework.

## Reduced Motion is "Gentler," Not "Skip the Entrance"

Under `prefers-reduced-motion: reduce`, the state change should still be legible — something visible still appears — but positional travel, scale, and rotation are dropped.

### CSS Level

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

## GPU-Only Properties: Scale vs Width/Height

Sliding/resizing pills (nav indicators, tabs, segmented controls) are tempting to animate via `width`/`height` — but those are layout properties forcing synchronous recalc every frame.

**Use:** `transform: scale()` and `transform: translate()` instead

**Key:** Animate transform, only *set* (never animate) the real `width`/`height` once motion settles.

## Diagnosing Tab-Hidden vs Real Animation Bugs

`requestAnimationFrame` is **fully suspended** (not throttled) when `document.hidden === true`. Automated browser tools (Claude-in-Chrome, Puppeteer, CI) often don't have real OS-level focus.

### Diagnose Before Debugging

```js
document.hidden          // true → rAF is suspended
document.visibilityState // 'hidden'
```

If your library can jump to end state bypassing rAF (e.g., GSAP's `timeline.progress(1)`) and that produces correct DOM, the code is right — don't "fix" a screenshot artifact.

## Motion Should Solve a Problem, Not Just Look Good

Every animation should answer: "What problem does this solve?"

- **Entrance motion:** Guides attention, clarifies what's new
- **Scroll animations:** Provides context about position/progress
- **Hover feedback:** Confirms interactivity without full page transition
- **Transition motion:** Connects state changes visually

If the animation is purely decorative, it's AI slop — consider removing it.
