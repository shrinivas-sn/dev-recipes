// Copy-in template: a phase-staggered continuous idle motion that's safe to interrupt.
// Implements Patterns 2 + 4 from the recipe README — kill-and-recreate (never pause/resume)
// for the relative-value tween, plus a post-settle delay so it never reads as "it moved right
// after landing."
//
// Usage inside a useGSAP callback:
//   const startIdleBob = makeIdleBobStarter(idleTweensRef, reduceMotion);
//   tl.add(() => elementRefs.current.forEach((_, i) => startIdleBob(elementRefs, i)));
//   // ...later, after any interruption's settle tween completes:
//   onComplete: () => startIdleBob(elementRefs, i)

import { gsap } from 'gsap';
import type { RefObject } from 'react';

const POST_SETTLE_DELAY = 0.45; // seconds — tune per project, but keep it >= ~0.4

export function makeIdleBobStarter(
  idleTweens: RefObject<(gsap.core.Tween | undefined)[]>,
  reduceMotion: boolean,
  amplitudePx = 7,
  baseDuration = 2.6,
  durationStepPerIndex = 0.3,
  phaseStepSeconds = 0.6
) {
  return function startIdleBob(elementRefs: RefObject<(HTMLElement | null)[]>, i: number) {
    if (reduceMotion) return;
    const el = elementRefs.current?.[i];
    if (!el) return;

    idleTweens.current![i] = gsap.to(el, {
      y: `+=${amplitudePx}`,
      duration: baseDuration + i * durationStepPerIndex,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: POST_SETTLE_DELAY + i * phaseStepSeconds,
    });
  };
}

// To interrupt safely (e.g. on hover-enter of a group), kill — never pause:
//   idleTweens.current.forEach((t) => t?.kill());
// Then, once the interruption's own settle tween completes, call startIdleBob again —
// it re-anchors to the element's real current position instead of a stale cached one.
