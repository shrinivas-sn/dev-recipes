# Layer 1b proof — the design side, 2026-08-16

Layer 1 proved library truth (Context7 stops hallucinated APIs). It left the design half
open, which is the half that actually causes the "why does Claude keep making generic
slop, and why do I have to keep pointing it out" loop.

The claim under test: **slop is a generation problem, so retrieval fixes it.**

## Registries probed

Bar for inclusion: returns real source code over plain HTTP, no key, no browser.

| Registry | Result | Ships |
|---|---|---|
| shadcn/ui | **200**, 2.3 KB | TSX, structural primitives |
| React Bits | **200**, 5.0 KB | **JSX *and* TSX, Tailwind *and* CSS variants**, pinned deps |
| Magic UI | **200**, 2.6 KB | TSX, marquee/ticker/bento |
| Aceternity | **200**, 1.9 KB | TSX, hero-scale effects |
| Motion Primitives | 429 | edge bot-check, not JSON — re-probe later |
| Cult UI | 429 | same |
| Tremor | 000 | connection failed; path wrong or moved |

4 of 7 usable. All four return the shadcn registry shape — `{ dependencies, files[].content }` —
so a single fetch yields pinned deps *and* complete source.

Verified the payload is genuinely full source, not metadata: Aceternity's `spotlight.json`
`files[0].content` begins `import React from "react"; import { cn } from "@/lib/utils"; …`
and contains the whole component including its SVG filter definitions.

## The find that matters for this stack

**React Bits publishes a JSX variant** — `{Component}-{JS|TS}-{TW|CSS}.json`. Every other
registry is TSX-only, which for a plain-JS project means a type-stripping conversion step,
which is exactly where hand-editing reintroduces guesswork.

`calendar-api/frontend` is JSX. So this registry is a drop-in and the others are not.

## End-to-end retrieval, against the real stack

Pulled `https://reactbits.dev/r/ClickSpark-JS-TW.json` and audited it against the
adaptation checklist rather than assuming it would fit:

| Check | Result |
|---|---|
| Language | `.jsx`, 143 lines — **matches, no conversion** |
| Dependencies | `[]` — nothing to install |
| Tailwind classes used | `relative w-full h-full`, `absolute top-0 left-0 select-none pointer-events-none` — layout only, **v3/v4-safe** |
| Palette remap collision | Uses **no colour utilities** — immune to the project's `slate-400`/`500` remap |
| `cn()` / `@` alias | Not used — nothing to wire |
| `prefers-reduced-motion` | **ABSENT** — runs a permanent `requestAnimationFrame` loop |

Six checks, five clean, one real defect. That last row is the point of the whole exercise:
the component is good code that would still have shipped an accessibility bug if pasted on
trust. The checklist is not ceremony.

Also worth noting for honesty: this one adapted cleanly *because* it is unusually
self-contained. A Magic UI marquee or an Aceternity spotlight would need keyframe
registration in `tailwind.config.js` (v3) and a `cn()` helper that this project does not
have. The checklist has to be run per component, not once.

## Slop scan — calendar-api/frontend

Real counts across `src/` (2,008 lines):

| Signature | Count | Verdict |
|---|---|---|
| `transition-all` | **20** | **Tier B defect** — see below |
| `rounded-2xl` | 7 | Tier C, consistent token, leave |
| `shadow-lg` | 6 | Tier C, leave |
| `animate-pulse` | 5 | check each — decorative use is a lie about state |
| `backdrop-blur` | 4 | Tier C, borderline |
| `bg-gradient-to-r` | 3 | small surfaces, not headline text — acceptable |
| `hover:scale-105` | 1 | fine at that count |
| `grid-cols-3` | 2 | fine |
| `from-purple` / `to-pink` | **0** | — |
| gradient headline text | **0** | — |
| emoji-as-icon | **0** | — |

**This frontend is not egregious slop, and saying otherwise would be inventing a crisis to
justify a rewrite.** Zero purple-pink gradients, no gradient headlines, no emoji icons, real
`lucide-react` icons, deliberate palette work. Tier A is essentially clean.

The one real defect is Tier B. `src/index.css:58`:

```css
@apply … rounded-2xl shadow-lg hover:border-slate-700/80 hover:shadow-2xl
       hover:shadow-black/20 hover:-translate-y-[2px] transition-all duration-300 ease-out;
```

`transition-all` here animates `box-shadow`, `border-color` **and** `transform` together.
Shadow and border are paint operations on the main thread; only `transform` is GPU-composited.
Every hover on every card pays paint cost for 300 ms.

```diff
- transition-all duration-300 ease-out
+ transition-[transform,box-shadow,border-color] duration-300 ease-out
```

Same visual result, named properties, no accidental animation of anything else that changes.

## Verdict

Retrieval works and is now wired: 4 live registries, a JSX-native source matching this
stack, a 7-point adaptation contract that caught a real accessibility gap on its first run,
and a slop scan grounded in actual counts — including the discipline to report that most
tiers came back clean.

What this does **not** do: guarantee taste. Four retrieved hero effects on one page is its
own kind of slop, and no registry prevents that. Restraint stays a human call.

## Not done

- **Nothing applied to calendar-api.** The `transition-all` fix and the ClickSpark
  integration are both documented, not shipped.
- **429 registries unresolved** — Motion Primitives and Cult UI need a re-probe.
- **Tier 4 (Firecrawl) still unexercised** — no topic yet has warranted it.
