# CSS 3D Patterns (no JS animation library)

Pure CSS `transform`/`perspective`/`backface-visibility` techniques — no GSAP/Motion
needed, just React for the markup. Extracted from `portfolio-site-new` (2026-08-13).

## Hover-Reveal Flap (fold-open cover)

Hides content (links, extra detail) behind an opaque "flap" that folds open on hover —
like a hatch/trapdoor, hinged at one edge via `transform-origin`.

```tsx
// Wrapper needs its own `perspective` — scope it to just this strip, not the
// whole card, so the fold's foreshortening doesn't distort unrelated content.
<div className="relative h-6 [perspective:600px]">
  <div className="absolute inset-0 flex items-center gap-x-4 text-xs">
    {/* real content, hidden until the flap opens */}
  </div>
  <div
    aria-hidden="true"
    className="absolute inset-0 rounded-md bg-[--surface] origin-top
      transition-transform duration-500 ease-in-out [backface-visibility:hidden]
      group-hover:[transform:rotateX(180deg)]"
  />
</div>
```

Parent needs `className="group"` for `group-hover:` to fire.

### Gotchas

**Backface-visibility handles both the visual hide AND the click-blocking.** Once
rotated to show its back face, an element with `backface-visibility: hidden` is neither
painted nor hit-tested in Chromium/WebKit — clicks pass through to whatever's under it.
No extra `pointer-events: none` juggling needed, but don't skip
`[backface-visibility:hidden]` or the flap will visually vanish while still eating clicks.

**Hinge direction:** `transform-origin: top` + `rotateX(180deg)` on hover folds the flap
*up and away* (hatch-opening feel). Same setup with the states inverted (open at rest,
`rotateX(180deg)` on hover to close) reads as a cover *dropping down* — useful for the
opposite effect (hide something on hover instead of reveal).

## Static 3D Depth (no interaction)

**A card facing the camera dead-on always reads as flat, no matter how real its 3D
transform is** — this is correct rendering, not a bug, but it means a *hover-only* tilt/
depth effect looks like nothing until the cursor moves. If the user's ask is "make it
look 3D" (not "make it feel 3D on hover"), the effect needs to be baked into the
resting/default state:

```tsx
// Simplest version that still reads as dimensional: one static translateZ,
// no rotation, no JS. Needs an ancestor with `perspective` already set (a
// scroll carousel, a card grid wrapper, etc.) to have any visible effect —
// translateZ alone does nothing without a perspective context above it.
<article className="[transform:translateZ(24px)]">
```

Reach for rotateX/rotateY tilt (baseline + hover delta, not hover-only) only if a flat
Z-pop isn't enough — it's more moving parts (own `perspective` wrapper, JS pointer
tracking or a fixed resting angle, a visible "edge" pseudo-element for the thickness
cue to read as solid rather than just skewed) for a marginal gain. Start with the one
`translateZ`, ship it, only escalate if asked.

### Critical gotcha: Tailwind JIT can't see interpolated values

```tsx
// BROKEN — Tailwind's JIT scanner does a static text scan of source files at
// build time. It never sees the *resolved* string, only the literal
// "${REST_RX}" placeholder in the source — so this arbitrary-value class is
// silently never generated. No error, no warning, the effect just doesn't
// exist in the shipped CSS.
className={`[transform:rotateX(${REST_RX}deg)]`}

// WORKS — same value, but via inline style, which has nothing to do with
// Tailwind's build-time scan.
style={{ transform: `rotateX(${REST_RX}deg)` }}
```

Static/hardcoded arbitrary values (`[transform:translateZ(24px)]`, no `${}`) are fine —
Tailwind sees the literal text. Only *dynamic* (JS-computed) values need `style=`.

## See Also

- [GSAP sliding pill](../gsap/README.md) — same `group-hover`/measured-transform family
  of technique, GSAP version for indicators that need to animate between two arbitrary
  measured positions rather than two fixed CSS states.
- [Core Principles](../../_core/principles.md)
