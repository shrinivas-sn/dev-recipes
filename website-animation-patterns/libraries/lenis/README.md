# Lenis + GSAP + ScrollTrigger Patterns

Production-grade smooth-scroll integration patterns for Lenis with GSAP's ScrollTrigger inside React.

**When to use:** Building smooth-scroll experiences where ScrollTrigger scroll-reveal animations coexist with in-page navigation, hash-based routing, and scrollspy state.

## Reference

- **Official:** [lenis npm](https://www.npmjs.com/package/lenis) — Smooth scroll library
- **GSAP Integration:** [GSAP + Lenis docs](https://gsap.com/docs/Plugins/ScrollTrigger/) (see "Smooth Scroll" section)
- **Source Project:** [freelance-portfolio-website](https://github.com/shrinivas-sn/freelance-portfolio-website) — `src/hooks/useLenis.ts`

## The Problem: ScrollTrigger Breaks Native Fragment Navigation

Once ScrollTrigger is registered, GSAP forces `scroll-behavior: auto` on `<html>` and periodically does a "jump to 0, measure, restore" dance while refreshing trigger positions. A native `<a href="#id">` fragment jump landing mid-refresh gets silently reverted or drops to 0.

**Result:** Nav clicks sometimes do nothing, sometimes stop partway through the intended scroll.

## Core Patterns

### 1. The Shared `scrollToSection()` Helper

Replace native `<a href="#id">` navigation entirely. Route *all* in-page navigation (Nav links, logo, CTAs, hash restoration) through a single Lenis-driven entry point:

```ts
export function scrollToSection(
  target: number | string | HTMLElement,
  { immediate = false }: ScrollToSectionOptions = {}
): void {
  const lenis = getLenis();

  if (lenis) {
    if (immediate) {
      lenis.scrollTo(target, { immediate: true });
      return;
    }
    beginProgrammaticScroll();
    lenis.scrollTo(target, { onComplete: endProgrammaticScroll });
    return;
  }

  // Fallback if Lenis not mounted yet (rare, but instant scroll if it happens)
  const el = typeof target === 'string'
    ? document.getElementById(target.replace(/^#/, ''))
    : typeof target === 'number' ? null : target;

  const top = typeof target === 'number' 
    ? target 
    : el ? el.getBoundingClientRect().top + window.scrollY : null;

  if (top !== null) {
    window.scrollTo({ top, behavior: 'auto' });
  }
}
```

**Why:** This keeps scroll driven by the GSAP ticker pipeline, not racing browser-internal fragment navigation against ScrollTrigger's refresh cycle.

### 2. The Programmatic-Scroll Guard

Lenis drives *native* window scroll, so a ~1.2s eased navigation fires the window `scroll` event the whole way and passes through every intermediate section. Scrollspy listening to that event would update state once per section, making the nav pill "chase" the scroll instead of sliding once to the clicked link.

**Solution:** Suspend scrollspy during the programmatic scroll with a guard that:
- Lifts on `onComplete` (normal end)
- Lifts on the first wheel/touch input (visitor took over)
- Lifts on a timeout backstop (fallback if Lenis's `onComplete` gets dropped)

```ts
let programmaticScroll = false;
let programmaticTimer: number | null = null;

export function isProgrammaticScroll(): boolean {
  return programmaticScroll;
}

function beginProgrammaticScroll() {
  endProgrammaticScroll(); // Clear any prior state
  programmaticScroll = true;
  programmaticTimer = window.setTimeout(endProgrammaticScroll, 2000);

  const onUserInput = () => endProgrammaticScroll();
  window.addEventListener('wheel', onUserInput, { passive: true });
  window.addEventListener('touchstart', onUserInput, { passive: true });
  releaseUserInterrupt = () => {
    window.removeEventListener('wheel', onUserInput);
    window.removeEventListener('touchstart', onUserInput);
  };
}

function endProgrammaticScroll() {
  const wasActive = programmaticScroll;
  programmaticScroll = false;
  if (programmaticTimer !== null) {
    window.clearTimeout(programmaticTimer);
    programmaticTimer = null;
  }
  releaseUserInterrupt?.();
  releaseUserInterrupt = null;

  // Dispatch a scroll event so scrollspy re-syncs now that it's listening again
  if (wasActive) window.dispatchEvent(new Event('scroll'));
}
```

**In the scrollspy handler:**

```ts
const handleScroll = () => {
  if (isProgrammaticScroll()) return; // Suspend during nav scroll
  
  // Update activeSection based on scroll position
  const scrollPosition = window.scrollY + 200;
  for (const section of sectionOffsets.current) {
    if (scrollPosition >= section.top && scrollPosition < section.top + section.height) {
      setActiveSection(section.id);
      break;
    }
  }
};
```

### 3. GSAP Ticker Sync (The Integration Pattern)

Lenis and ScrollTrigger must share a single time source to avoid jitter and lagging reveals:

```ts
export function useLenis() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: reduceMotion ? 0.05 : 1.2,
      easing: reduceMotion ? (t: number) => t : (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      autoRaf: false, // Critical: don't run Lenis's own rAF loop
    });

    lenisInstance = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    const onTick = (time: number) => {
      lenis.raf(time * 1000); // GSAP ticker reports seconds; Lenis wants ms
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0); // Disable GSAP's lag-smoothing so it doesn't fight Lenis

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      if (lenisInstance === lenis) lenisInstance = null;
    };
  }, []);
}
```

**Critical settings:**
- `autoRaf: false` — Lenis stops running its own loop; GSAP's ticker takes over
- `lenis.on('scroll', ScrollTrigger.update)` — ScrollTrigger recomputes on every Lenis tick
- `gsap.ticker.lagSmoothing(0)` — Disables GSAP's lag-compression so it doesn't skip Lenis ticks

### 4. Hash-Based Routing on Mount

Loading or sharing `…/#contact` can't depend on browser native fragment restoration — it fires during initial layout (fonts swapping, ScrollTrigger first-refresh) and loses the race against ScrollTrigger's "jump to 0, measure, restore" dance.

**Solution:** After the initial ScrollTrigger refresh, route hash navigation through Lenis with `immediate: true` (instant, no animation on page load):

```ts
const hashId = window.location.hash.slice(1);
let hashRaf = 0;
if (hashId) {
  hashRaf = requestAnimationFrame(() => {
    const target = document.getElementById(hashId);
    if (!target) return;
    ScrollTrigger.refresh(); // Measure all sections with current layout
    lenis.scrollTo(target, { immediate: true }); // Then jump through Lenis pipeline
  });
}

return () => {
  if (hashRaf) cancelAnimationFrame(hashRaf);
  // ... cleanup
};
```

### 5. Reduced Motion Handling

```ts
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const lenis = new Lenis({
  duration: reduceMotion ? 0.05 : 1.2, // ~instant vs normal easing
  easing: reduceMotion ? (t: number) => t : expoOut, // linear vs ease-out
  autoRaf: false,
});
```

**Why duration 0.05?** Instant `0` can race ScrollTrigger's refresh. 50ms leaves a tiny buffer while feeling instantaneous to users.

## Gotchas

### The Lenis Instance Must Be Singleton

Multiple `useLenis()` calls = multiple instances = scroll fights. Use module-level `let lenisInstance`, expose via `getLenis()`, and guard:

```ts
let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}
```

### `onComplete` Can Drop If User Interrupts

If the visitor grabs the wheel mid-scroll, Lenis stops its animation and abandons the original `onComplete` callback. The guard's wheel/touch listeners and timeout backstop catch this.

### ScrollTrigger's Refresh Blocks Lenis

`ScrollTrigger.refresh()` is synchronous and can cause jank if called mid-scroll. Call it *before* starting a Lenis animation, or defer the animation with `requestAnimationFrame`.

### Browser's Native Fragment Navigation Must Be Prevented

Every link that should scroll through Lenis needs `event.preventDefault()`:

```ts
const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  event.preventDefault();
  scrollToSection(id);
  window.history.pushState(null, '', `#${id}`);
};
```

## Common Patterns by Use Case

| Use Case | Pattern | Notes |
|----------|---------|-------|
| Nav link click | `scrollToSection(id)` + prevent default | Suspend scrollspy during travel |
| Logo scroll-to-top | `scrollToSection(0)` | Works same as nav |
| Hero CTA | `scrollToSection(target)` | Centralizes logic, avoids duplication |
| Page load with hash | `lenis.scrollTo(target, { immediate: true })` | After `ScrollTrigger.refresh()` |
| Manual scroll (wheel/touch) | No guarding needed | Scrollspy listens normally |

## Testing Notes

- **Verify navigation:** Click nav link → pill slides once to destination (doesn't chase through sections)
- **Verify hash restoration:** Load `site.com/#section` → lands directly on that section
- **Verify user interrupt:** Click nav, immediately scroll wheel → scrollspy re-engages mid-scroll, no stuck state
- **Verify reduced motion:** Emulate in DevTools → scroll jumps are instant, no easing animation

## Templates

- Coming: `useLenis.ts` hook template (extract from source project)
- Coming: `scrollToSection()` helper standalone template

## See Also

- [GSAP + React Patterns](../gsap/README.md) — ScrollTrigger, useGSAP, tween interruption
- [Core Principles](_core/principles.md) — Reduced motion, GPU properties
- [Diagnostics](_core/diagnostics.md) — Tab visibility, rAF throttling

---

**Last Updated:** 2026-08-08  
**Source:** [freelance-portfolio-website (work.shrinivasn.com)](https://github.com/shrinivas-sn/freelance-portfolio-website)  
**Live Reference:** [work.shrinivasn.com](https://work.shrinivasn.com) — All patterns in production
