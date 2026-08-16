---
name: design-source
description: Build or fix UI by retrieving real, working component source from code-bearing registries (shadcn, React Bits, Magic UI, Aceternity) and adapting it to the project's actual stack, instead of generating components from memory. Also scans for AI-slop signatures. Use when building any UI section, hero, card grid, or animation; when asked to make something look less generic / less AI-generated / more production-grade; when adding motion; or before hand-writing any component a registry already ships.
---

# design-source

The anti-slop loop. Companion to `/context-brief` (which handles library/API truth) —
this one handles **what the UI should actually be**.

**The rule:**

> Design slop comes from *generating* components. The fix is *retrieving* a real one and
> adapting it. Never hand-write a hero, card grid, marquee, reveal, ticker, or cursor
> effect from memory when a registry ships a working implementation.

Registry of code-bearing sources: `E:\dev-recipes\_knowledge\design-sources.yaml`
Detectable slop patterns: `E:\dev-recipes\_knowledge\slop-signatures.md`

## Why generation fails here

A model asked for "a hero section" samples the highest-probability tokens for that phrase —
which is the median landing page of its training data. The result isn't wrong, it's
**maximally average**, and averageness is what reads as AI-generated. "Make it more
distinctive" only moves to a different average. Retrieval breaks the loop; prompting does not.

Say this once if the user is frustrated about slop, then get on with fixing it. Don't
lecture.

## Step 1 — Read the project before touching it

Non-negotiable, and the same trap as `/context-brief`:

- **Language:** JSX or TSX? (Do not infer from `@types/*` being installed.)
- **Tailwind major:** from the **lockfile**, not the declared range.
- **Palette remaps:** does `tailwind.config.js` override built-in scales? If so, shade names
  do not mean what registry code assumes.
- **`cn()` + `@` alias:** does `@/lib/utils` exist and is the alias configured?
- **Dark mode:** count `dark:` usages. Zero means permanently-dark — `dark:` classes are inert.
- **Existing motion library:** already using GSAP or Motion? Match it. Do not add a second.

## Step 2 — Scan for slop (when fixing existing UI)

Run the scan from `slop-signatures.md`. Report counts with file:line for the real hits.

Separate the tiers honestly — this is where credibility is won or lost:

- **Tier B first.** These are defects: `transition-all`, missing `prefers-reduced-motion`,
  `hover:` with no `focus-visible:`, decorative `animate-pulse`. Fix regardless of taste.
- **Tier A** are near-certain generated tells worth replacing.
- **Tier C** are smells — check before changing; often deliberate.

If the code doesn't match many signatures, **say so**. Inventing slop to justify a rewrite
is worse than the slop. A scan that always finds a crisis is a scan nobody trusts.

## Step 3 — Retrieve, don't generate

Pick the registry by job (`design-sources.yaml` has the full table):

| Need | Registry |
|---|---|
| Structural primitives — button, dialog, tabs, form | shadcn |
| Animated text, cursor, background, scroll effects | **React Bits** |
| Marquee, ticker, beams, bento | Magic UI |
| One high-drama hero moment | Aceternity |

**Prefer React Bits for plain-JS projects** — it is the only one publishing a JSX variant
(`{Component}-JS-TW.json`), so there's no type-stripping step to get wrong.

```bash
curl -s "https://reactbits.dev/r/SplitText-JS-TW.json" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('DEPS:',JSON.stringify(j.dependencies));j.files.forEach(f=>console.log('\n=== '+(f.path||f.target)+' ===\n'+f.content));})"
```

The payload carries `dependencies` with pinned ranges and `files[].content` with complete
source. Read the source before pasting it — you are responsible for what it does.

**Check local recipes first for anything GSAP or Motion.**
`E:\dev-recipes\website-animation-patterns\libraries\` holds debugged `useGSAP`/`contextSafe`
gotchas that upstream docs don't contain. They were paid for in debugging time; use them.

If no registry has the pattern, fall to technique sources (Codrops via WebFetch), and only
then to Firecrawl for genuinely undocumented aesthetic references — it's rationed.

## Step 4 — Adapt (where guessing sneaks back in)

Work `adaptation_checklist` in `design-sources.yaml` line by line. The failure mode is code
that *looks* retrieved but behaves generated because a step was skipped.

Highest-frequency misses:

1. **Tailwind v4 syntax into a v3 project** — renders unstyled, throws no error.
2. **Custom keyframes never registered** — v3 needs `theme.extend.keyframes` +
   `theme.extend.animation`; v4 needs `@theme`. Registry code assumes its author's setup.
3. **Remapped palette** — pasted `text-slate-400` renders at the project's overridden value,
   not the stock one.
4. **`cn()` / `@` alias absent** — silent build break.
5. **No `prefers-reduced-motion`** — most registry components omit it. Add it. Accessibility
   requirement, not polish.

When converting TSX → JSX, strip types only. Do not "tidy" the logic in the same pass — a
conversion that also refactors is a rewrite wearing a conversion's clothes.

## Step 5 — Cite, and record

Every component added gets a source comment:

```jsx
// Source: React Bits — https://reactbits.dev/r/SplitText-JS-TW.json (MIT), retrieved 2026-08-16
// Adapted: prefers-reduced-motion branch added; slate-400 -> slate-600 (project remaps 400).
```

Then write a brief to `E:\dev-recipes\_knowledge\cache\` for anything non-obvious about the
adaptation, so the next project doesn't rediscover it.

If a registry returned 429/blocked, record it in `design-sources.yaml` with the date rather
than retrying in a loop.

## Step 6 — Verify it actually renders

Retrieved code is not automatically working code. Run the dev server and look:
`/e/dev-recipes/headless-screenshot-fallback/` covers verifying visually when
`claude-in-chrome` isn't connected.

Check specifically: does it render at all (v3/v4 mismatch fails silently), does reduced
motion work, does keyboard focus work.

## Honesty rules

- **Retrieval doesn't guarantee taste.** Four Aceternity effects on one page is its own slop.
  Restraint is a design decision the registry can't make.
- **Matching zero signatures is a floor, not a ceiling.** It means "not obviously generated",
  not "good".
- If something was written from memory because no source had it, **say so explicitly**.
  Unsourced work presented as sourced is the exact failure this system exists to prevent.
