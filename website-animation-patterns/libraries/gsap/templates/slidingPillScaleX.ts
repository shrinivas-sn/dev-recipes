// Copy-in template: a sliding, resizing indicator (nav active-link pill, tab underline,
// segmented control) animated GPU-only via x + scaleX instead of x + width.
// Implements the "GPU-only in practice" gotcha from the recipe README.
//
// Requires the pill element to have `transform-origin: left` in its CSS/className.

import { gsap } from 'gsap';

let hasBaseWidth = false; // explicit flag — do NOT infer "not yet placed" from width < N

export function movePill(
  pill: HTMLElement,
  targetRect: { left: number; width: number },
  containerLeft: number,
  animate: boolean,
  reduceMotion: boolean
) {
  const x = targetRect.left - containerLeft;
  const targetWidth = targetRect.width;

  if (!hasBaseWidth) {
    // First-ever placement: snap instantly, no ratio to compute yet.
    gsap.set(pill, { x, width: targetWidth, scaleX: 1, opacity: 1 });
    hasBaseWidth = true;
    return;
  }

  if (!animate || reduceMotion) {
    gsap.set(pill, { x, width: targetWidth, scaleX: 1, opacity: 1 });
    return;
  }

  const currentVisualWidth = pill.getBoundingClientRect().width;
  gsap.set(pill, { width: currentVisualWidth, scaleX: 1 }); // rebase (instant, not animated)
  gsap.to(pill, {
    x,
    scaleX: targetWidth / currentVisualWidth,
    duration: 0.32,
    ease: 'power3.out',
    onComplete: () => gsap.set(pill, { width: targetWidth, scaleX: 1 }), // collapse scale, lock real width
  });
}
