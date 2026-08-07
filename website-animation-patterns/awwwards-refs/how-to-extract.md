# How to Extract Animation Patterns from Reference Sites

Systematic methodology for analyzing and extracting animations from award-winning sites.

## Step 1: Identify Animation Types

Open the site and note what animates:

- **Entrance/Load:** Elements appearing on initial page load
- **Scroll-Triggered:** Animations that fire when element enters viewport
- **Hover/Interaction:** Button hover, card hover, click feedback
- **Layout Changes:** Collapsing/expanding sections, menu toggles
- **Parallax/Depth:** Elements at different scroll speeds
- **Text Animations:** Word reveal, character by character, fade

## Step 2: Inspect with Browser DevTools

### Performance Panel

1. Open DevTools → Performance tab
2. Start recording
3. Trigger animation (scroll, hover, etc)
4. Stop recording
5. Look for:
   - Long tasks (red bars) = potential layout thrashing
   - Paints (green) = repaints
   - Composites (purple) = smooth GPU animations

**Good sign:** Mostly purple, small paints

### Elements/Inspector

1. Right-click animated element → Inspect
2. In DevTools Styles tab, trigger animation (hover, etc)
3. Watch which CSS properties change:
   - `opacity`, `transform` = GPU-safe ✓
   - `width`, `height`, `left`, `top` = layout thrashing ✗

### Console - Detect Library

```js
// Check what's loaded
window.gsap          // GSAP?
window.Framer        // Framer Motion?
window.anime         // anime.js?
```

Or check Network tab for loaded scripts.

## Step 3: Extract Code

### CSS Animations

```css
/* DevTools → Styles → Copy rules */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.element {
  animation: slideIn 0.6s ease-out forwards;
}
```

### JavaScript Animations

#### GSAP

Check Network tab for `gsap.js` or similar. Look for:
- `gsap.to()`, `gsap.from()`, `gsap.fromTo()`
- `ScrollTrigger` plugin
- Timeline usage: `gsap.timeline()`

#### Framer Motion

Look in React component code (DevTools → Sources → search component names)

#### anime.js

Check for `anime()` function calls

## Step 4: Document the Pattern

Create a `.md` file with:

```markdown
# [Site Name]

**Source:** [URL]

## Animations Observed

### 1. Entrance Animation
- **Trigger:** Page load
- **Elements:** Hero text, images
- **Properties:** opacity, transform: translateY
- **Duration:** 0.6s
- **Easing:** ease-out

### 2. Scroll Animation
- **Trigger:** Element in viewport
- **Elements:** Card components
- **Properties:** opacity, scale
- **Duration:** 0.8s
- **Easing:** cubic-bezier(0.25, 0.46, 0.45, 0.94)

## Code Extracted

\`\`\`js
// GSAP example
gsap.to('.hero-text', {
  opacity: 1,
  y: 0,
  duration: 0.6,
  ease: 'power3.out'
});
\`\`\`

## Gotchas & Notes

- Uses GSAP with ScrollTrigger
- Respects prefers-reduced-motion
- GPU-safe properties only
- No layout thrashing observed

## Related Patterns

- [GSAP Patterns](../libraries/gsap/README.md)
- [Core Principles](../_core/principles.md)
```

## Step 5: Categorize by Library

Once you know which library is used, move the reference to:

- `libraries/gsap/` for GSAP sites
- `libraries/framer-motion/` for React/Framer Motion
- `awwwards-refs/` for award-winning sites (mixed libraries)

## Red Flags - Skip These

- **Decorative-only animations** with no functional purpose
- **Animations that violate reduced-motion** (no fallback)
- **Layout thrashing** (animating width/height)
- **No library detected** (scroll listeners + manual requestAnimationFrame)
- **Heavy WebGL** without clear performance consideration

## Quick Checklist

- [ ] Identified all animation types
- [ ] Inspected performance (GPU vs main thread)
- [ ] Detected library used
- [ ] Extracted code snippets
- [ ] Documented pattern
- [ ] Checked for gotchas
- [ ] Verified reduced-motion support
- [ ] Confirmed GPU-safe properties only
