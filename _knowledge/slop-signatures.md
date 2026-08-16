# AI-slop signatures — detectable, not vibes

The existing `no-ai-slop` recipes say "look at it", "name concrete mood words", "re-prompt
with sharper direction". That hands the hard part back to the human, which is exactly the
loop worth escaping. This file is the opposite: **signatures you can grep for**, each with
why it reads as generated and what replaces it.

Run the scan first. Fix what the scan finds. Only then argue about taste.

## Why slop happens (the mechanism, so the fix makes sense)

A model asked to "make a hero section" samples the highest-probability tokens for that
phrase. High probability = what appeared most in training = the median landing page of
2021–2024. The output is not *wrong*, it is **maximally average** — and averageness is
precisely what reads as AI-generated.

This has one important consequence: **you cannot prompt your way out of it reliably.**
"Make it distinctive" just moves you to a slightly different average. The dependable fix is
to stop generating and start **retrieving** real code (see `design-sources.yaml`), then
adapting it.

## The scan

```bash
# from the project's src/
for p in "bg-gradient-to-r" "from-purple" "via-pink" "to-pink" "to-blue-600" \
         "rounded-2xl" "shadow-lg" "backdrop-blur" "hover:scale-105" \
         "transition-all" "animate-pulse" "grid-cols-3" "text-transparent bg-clip-text" \
         "min-h-screen flex items-center justify-center" "🚀" "✨" "⚡"; do
  printf "%4s  %s\n" "$(grep -ro "$p" . 2>/dev/null | wc -l)" "$p"
done
```

Counts are signals, not verdicts. Read the hits before changing anything.

---

## Tier A — near-certain slop

### `from-purple-500 to-pink-500` (and the violet/indigo/blue variants)
The default "AI product" palette. It carries no brand meaning; it is simply the most-seen
gradient. **Fix:** derive the accent from the product's actual subject, and use it as an
*accent*, not a surface. One saturated colour against a restrained neutral scale beats any
gradient.

### `text-transparent bg-clip-text bg-gradient-to-r`
Gradient headline text. Peak 2022 landing page. Also frequently fails contrast checks.
**Fix:** solid colour, and let weight/size/tracking carry the emphasis.

### Emoji as interface icons (🚀 ✨ ⚡ 🎯)
Renders differently per OS, unreadable to screen readers, and instantly dates the page.
**Fix:** a real icon set. `lucide-react` is already in most of these projects.

### `min-h-screen flex items-center justify-center` on the hero
Centred stack: eyebrow, big heading, muted paragraph, two buttons, gradient blob.
The single most recognisable generated layout. **Fix:** break symmetry — asymmetric grid,
content pinned to a baseline, or lead with the product's real artifact (a live response, a
chart, the actual thing) instead of a description of it.

### `grid-cols-3` of `rounded-2xl shadow-lg p-6` cards
Three benefits, icon-title-sentence, identical weight. Says nothing and ranks nothing.
**Fix:** vary size by importance, or replace with one worked example.

---

## Tier B — real defects, not just taste

### `transition-all`
The most common one, and it is a genuine performance bug rather than a style opinion.
`transition-all` animates *every* animatable property that changes, including `box-shadow`,
`border-color`, `width`, `height` and `top/left`. Those are painted and laid out on the main
thread, unlike `transform`/`opacity` which the compositor handles on the GPU.

Worst case is `transition-all` on an element whose hover state also changes shadow and
position — you pay layout + paint on every frame of the hover.

```diff
- className="transition-all duration-300 hover:shadow-2xl hover:-translate-y-[2px]"
+ className="transition-[transform,box-shadow] duration-300 hover:shadow-2xl hover:-translate-y-[2px]"
```

Best is to name only what actually changes, and prefer `transform`/`opacity` where possible.

### `animate-pulse` as a permanent decoration
`animate-pulse` means "loading". Used as ambient decoration it lies about state, and it
never stops — a permanent main-thread animation and a real problem for motion-sensitive
users. **Fix:** keep it for skeletons only.

### Missing `prefers-reduced-motion`
Every animation added by generation, and most registry components, omit this. It is an
accessibility requirement.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Prefer per-component branching where motion carries meaning; the global rule is the floor.

### `hover:` styling with no `focus-visible:` equivalent
Keyboard users get nothing. **Fix:** pair them, or use `hover:focus-visible:` groupings.

### `hover:scale-105` on large surfaces
Fine on a small button; on a card it blurs text mid-transition and can trigger reflow of
neighbours. **Fix:** `scale-[1.01]`, or move a shadow/border instead.

---

## Tier C — smells worth a look, often fine

| Signature | Why it shows up | When it's fine |
|---|---|---|
| `rounded-2xl` everywhere | one radius applied to everything | fine if it's a deliberate token; smell if radius never varies by element size |
| `backdrop-blur` on many layers | each blurred layer is a separate expensive composite | fine for one nav/overlay; smell at 4+ |
| `shadow-lg` on every card | default elevation, no hierarchy | fine if elevation actually encodes depth |
| Lorem-flavoured real copy ("Seamlessly integrate…", "Take your X to the next level") | filler that survived to production | never fine — it is the loudest tell in the whole list |

---

## Copy is part of the design

Generated interface copy has its own signature: "Seamlessly", "Effortlessly", "Unlock",
"Take your X to the next level", "Powerful yet simple", plus feature names that describe the
category rather than the product. Real copy names concrete things: what it does, what it
costs, what it returns.

For prose specifically, the `no-ai-slop-writing` skill is the sibling tool.

---

## What this file is NOT

It is not a style guide, and matching zero signatures does not make a design good — it makes
it not-obviously-generated, which is a floor, not a ceiling. Distinctiveness comes from the
retrieval-and-adaptation loop in `design-sources.yaml`, and from the project having an actual
point of view. This file just stops the same twelve tells shipping over and over.
