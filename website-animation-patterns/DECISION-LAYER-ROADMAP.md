# Decision Layer Roadmap

**Status:** Planned for future implementation

**Purpose:** Add decision framework to recipe — help choose WHICH animation to implement, not just HOW.

---

## What We're Building

Currently: "Here's a GSAP pattern" (reference library)  
Future: "You have problem X → try animation Y from library Z" (decision layer)

---

## Structure (To Implement)

```
decision-layer/
├── PATTERNS-INDEX.md          # Problem → Solution mapping
├── when-to-animate.md         # Decision criteria + red flags
├── library-selector.md        # GSAP vs Motion vs CSS decision tree
├── common-problems/
│   ├── form-submission.md     # "Form sent" animation strategy
│   ├── item-deletion.md       # "Item removed" animation strategy
│   ├── page-transition.md     # Navigation animation strategy
│   ├── scroll-progress.md     # Scroll-based animation strategy
│   └── micro-interactions.md  # Button hover, state changes
└── before-after/
    ├── form-submission/
    │   ├── before.gif         # Without animation (feels broken)
    │   ├── after.gif          # With animation (feels polished)
    │   └── code.md            # Implementation
    └── ...
```

---

## Implementation Steps

### Phase 1: Problem Catalog (HIGH PRIORITY)

Document 5-10 common scenarios:

1. **Form Submission Feedback**
   - Problem: User submits form, doesn't know if it worked
   - Solution: Loading spinner + success checkmark animation
   - Library: GSAP (timeline) or Motion (simple)
   - Gotcha: Disable button during submission

2. **Item Deletion**
   - Problem: Item vanishes instantly, confusing
   - Solution: Fade out + slide left before removal
   - Library: Motion (AnimatePresence) or GSAP (kill on complete)
   - Gotcha: Must respect prefers-reduced-motion

3. **Page Transition**
   - Problem: Page swap feels jarring
   - Solution: Fade/slide between pages
   - Library: Motion (layout animations) or GSAP (timeline)
   - Gotcha: Don't block interactivity during transition

4. **Scroll Progress Indicator**
   - Problem: User doesn't know how far down page
   - Solution: Scroll-triggered bar or segment reveal
   - Library: GSAP ScrollTrigger (best)
   - Gotcha: Tab-hidden sites won't animate in preview

5. **Micro-Interactions (Hover/Focus)**
   - Problem: Buttons feel dead without feedback
   - Solution: Scale, glow, or ripple on hover
   - Library: CSS transitions (simple) or Motion (complex)
   - Gotcha: Mobile has no hover, use active state

6. **Loading States**
   - Problem: Skeleton screens or spinners feel slow
   - Solution: Staggered reveal or pulse animation
   - Library: Motion (stagger) or GSAP (timeline)
   - Gotcha: Don't spin indefinitely (feels broken)

7. **Entrance Animation**
   - Problem: List of items all appear at once
   - Solution: Staggered fade-in from top
   - Library: Motion (initial/animate) or GSAP (stagger)
   - Gotcha: First-time load only, not on every render

8. **Modal/Drawer Open**
   - Problem: Dialog pops in, startling
   - Solution: Fade backdrop, slide or scale modal
   - Library: Motion (AnimatePresence) or GSAP
   - Gotcha: Handle escape key + backdrop click

9. **Notification/Toast**
   - Problem: Alert slides in unnoticed
   - Solution: Entrance + auto-exit animation
   - Library: Motion (simple) or CSS (simplest)
   - Gotcha: Accessible? Voice announcements needed too

10. **Parallax/Depth**
    - Problem: Flat page feels boring
    - Solution: Elements move at different scroll speeds
    - Library: GSAP ScrollTrigger (best)
    - Gotcha: Perf cost, test on mobile

### Phase 2: Decision Tree (MEDIUM PRIORITY)

Flowchart: "Which library should I pick?"

```
┌─ Is it a simple CSS property change?
│  ├─ YES → CSS transition (simplest)
│  └─ NO → next
│
├─ Is it React?
│  ├─ YES → next
│  └─ NO → GSAP (universal)
│
├─ Is it enter/exit or layout-based?
│  ├─ YES → Motion (declarative, cleaner)
│  └─ NO → next
│
├─ Is it scroll-based or complex timeline?
│  ├─ YES → GSAP (ScrollTrigger, timeline)
│  └─ NO → Motion (simpler)
│
└─ GSAP or Motion (both work, pick one)
```

### Phase 3: Before/After Examples (NICE-TO-HAVE)

For each problem, capture:
- Screenshot/GIF without animation
- Screenshot/GIF with animation
- Code snippet + explanation
- Performance metrics

### Phase 4: Integration (FUTURE)

Link from each problem → actual code in libraries/:
- `form-submission.md` → links to `libraries/gsap/patterns.md#loading-timeline`
- `item-deletion.md` → links to `libraries/framer-motion/README.md#exit-animations`

---

## Who Implements This

**Option 1:** Manual (you catalog problems, I help implement)  
**Option 2:** Automation + extraction (analyze reference sites for common patterns)  
**Option 3:** Skill-based (create `/animation-decision` skill that guides AI)

---

## Success Criteria

✓ User can answer: "I want to animate a form submission" and find the right pattern  
✓ Each problem maps to 2-3 real code examples  
✓ Library recommendations are clear (GSAP vs Motion vs CSS)  
✓ Links point to working code, not just theory  
✓ Gotchas are highlighted to prevent bugs  

---

## When to Start

- After current pattern library is in use (this recipe)
- Once you've extracted 5+ reference sites
- When you hit the same "which animation?" question twice
- Or: When ready to build the `/animation-decision` skill

---

**Notes for next session:**
- Reference this file to resume implementation
- Current recipe is solid foundation
- Decision layer is the natural next step
- Don't force it — wait until you see the pattern in real usage
