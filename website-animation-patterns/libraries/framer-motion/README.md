# Framer Motion / Motion.dev Patterns

Production patterns for Framer Motion (now Motion.dev) — declarative animations in React.

**When to use:** Building UI enter/exit animations, layout transitions, and drag interactions.

## Reference

- **Official:** [motion.dev](https://motion.dev/)
- **GitHub:** [github.com/framer/motion](https://github.com/framer/motion)

## Core Patterns

### Layout Animations

Animate when layout changes (element moves, resizes):

```jsx
import { motion } from 'framer-motion';

<motion.div layout>
  {/* Changes here trigger smooth layout transition */}
</motion.div>
```

### Exit Animations

Unmounting elements can still animate out:

```jsx
<AnimatePresence>
  {visible && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    />
  )}
</AnimatePresence>
```

### Drag Interactions

Built-in momentum, constraints, and snapping:

```jsx
<motion.div
  drag
  dragConstraints={{ left: -100, right: 100 }}
  dragElastic={0.2}
  onDragEnd={(event, info) => {
    // info.velocity, info.point, etc
  }}
/>
```

## Gotchas

### Reduced Motion

```jsx
const prefersReducedMotion = useMotionTemplate();

const variants = {
  visible: prefersReducedMotion ? {} : { opacity: 1, y: 0 }
};
```

### Performance: Avoid Animating Layout Properties

Like GSAP, only animate GPU-safe properties (`transform`, `opacity`).

## See Also

- [Core Principles](../../_core/principles.md)
- [Diagnostics](../../_core/diagnostics.md)
