# Animation Diagnostics

Debugging techniques for animation issues.

## Tab Visibility Issues

When animations appear frozen or slow in automated browsers:

```js
// Check visibility state
if (document.hidden) {
  console.log('Tab is backgrounded — rAF is suspended');
}

// For GSAP: jump to end to verify code correctness
timeline.progress(1);
```

## Common Issues

### Animation Jumps/Drifts

**Cause:** Using `pause()`/`resume()` on relative-value tweens

**Symptom:** "It recovers correctly, then jumps/drifts a little" after interruption

**Fix:** Kill and recreate the animation instead

```js
// Wrong
idle.pause();
// ... another tween moves element ...
idle.resume(); // snaps to stale cached position

// Right
idle.kill();
// ... another tween moves element ...
onComplete: () => {
  idle = gsap.to(el, { y: '+=8', repeat: -1, yoyo: true });
}
```

### Layout Thrashing

**Cause:** Animating `width`/`height` instead of `transform`

**Symptom:** Janky animation, browser gets hot, frame rate drops

**Fix:** Use `transform: scaleX()` with `transform-origin`

```js
// Wrong — forces layout recalc every frame
gsap.to(pill, { width, duration: 0.32 });

// Right — GPU-accelerated
gsap.to(pill, { scaleX: targetWidth / currentWidth, duration: 0.32 });
```

### Idle Animation Feels Continuous

**Cause:** Idle animation starts instantly after entrance

**Symptom:** "It moved right after it landed"

**Fix:** Add delay to settle before resuming idle motion

```js
onComplete: () => {
  idle = gsap.to(el, { 
    y: '+=8', 
    repeat: -1, 
    yoyo: true, 
    duration: 2.4,
    delay: 0.45 // ~0.4–0.5s reads as "settled, then idling"
  });
}
```

## Testing Animations

### Verify Animation Code Works

1. Open browser devtools
2. Record performance while animation plays
3. Check for layout shifts (yellow/red bars in perf)
4. Inspect computed styles — verify only transform/opacity change

### Test Reduced Motion

```js
// Manually check
window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Or set in devtools:
// Settings > Rendering > Emulate CSS media feature prefers-reduced-motion
```

### Check GPU Usage

- Chrome DevTools → Performance → toggle "Rendering" layer
- Green = GPU-accelerated (good)
- Red = main thread/layout (bad)
