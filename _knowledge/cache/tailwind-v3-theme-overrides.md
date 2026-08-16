---
topic: tailwind-v3-theme-overrides
domain: tailwind
tier: 1
pinned_version: tailwindcss@3.4.19
verified: 2026-08-16
ttl_days: 30
sources:
  - https://v3.tailwindcss.com/docs/customizing-colors
  - https://v3.tailwindcss.com/docs/configuration
  - https://unpkg.com/tailwindcss@3.4.19/src/public/colors.js
---

# Tailwind v3: theme overrides, and why v4 answers break v3 projects

## Answer

Two things must be established **before** writing a single Tailwind class into an existing
project:

1. **Which major is installed.** v3 and v4 do not share a configuration model.
2. **Whether the default palette has been remapped.** Read `tailwind.config.js`. If a
   built-in scale (`slate`, `gray`, …) appears under `theme.extend.colors`, the shade
   names in that project no longer mean what the docs say they mean.

`theme.extend.colors.<builtin>` performs a **shallow merge per shade**: listed keys replace
the default, unlisted keys survive. So a config can silently redefine `slate-400` while
leaving `slate-300` and `slate-600` at stock values, and nothing warns you.

## Why

`extend` merges into the default theme rather than replacing it — that is its entire
purpose versus setting `theme.colors` directly, which *does* wipe the palette:

```js
// extend -> adds to defaults, per key
module.exports = {
  theme: {
    extend: {
      colors: { 'regal-blue': '#243c5a' },
    }
  }
}
```

Applied to a built-in scale, that same per-key merge is what makes a partial override
invisible: the scale keeps its name and its unlisted shades, so the config looks like an
addition when it is a redefinition.

### v3 vs v4 — the surface that changes

| | v3.4 (JS-config) | v4 (CSS-first) |
|---|---|---|
| Entry | `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` |
| Config | `tailwind.config.js`, `content: [...]` globs | `@theme { --color-*: … }` in CSS |
| Token access in CSS | `theme(colors.slate.800)` | `var(--color-slate-800)` |
| Build | `postcss.config.js` + `autoprefixer` | `@tailwindcss/vite` plugin |

These fail *quietly*. `@import "tailwindcss"` in a v3 project emits no utilities rather than
erroring, so the page renders unstyled instead of red.

## Traps

1. **Model memory defaults to v4.** v4 is the current major, so unprompted answers use
   CSS-first syntax. Dropped into a v3 project, the styles silently stop being generated.
   Reading the installed major from `package.json`/lockfile is the guard — a declared range
   like `^3.4.19` is not the same as the locked version.

2. **A remapped built-in shade poisons every future class choice.** The conventional
   reasoning "muted secondary text → `text-slate-400`" is correct against stock Tailwind and
   wrong against a config that has redefined `slate-400`. Nothing in the class name reveals
   this; only the config does.

3. **`darkMode` absent ≠ no dark design.** A project can be permanently dark — dark values
   baked into base styles with zero `dark:` variants — in which case adding `dark:` classes
   does nothing at all, because the variant is never activated.

4. **Redundant re-declarations hide the real diff.** Configs often restate a whole scale
   when only one or two shades actually changed. Diff the config against
   `tailwindcss@<version>/src/public/colors.js` rather than eyeballing it.

## Verified

Default `slate` in the shipping `tailwindcss@3.4.19` source, compared with a real project
config that restates all 11 shades:

| Shade | Stock 3.4.19 | Project config | |
|---|---|---|---|
| 50–300 | … | identical | matches |
| **400** | `#94a3b8` | `#e2e8f0` | **= stock slate-200** |
| **500** | `#64748b` | `#cbd5e1` | **= stock slate-300** |
| 600–950 | … | identical | matches |

2 of 11 shades differ; the other 9 are noise. Both remapped shades are far lighter than
stock, so `text-slate-400` renders near-white instead of muted grey.

## Sources

- Extending vs replacing the palette (`theme.extend.colors` semantics) — https://v3.tailwindcss.com/docs/customizing-colors
- `theme` vs `theme.extend` — https://v3.tailwindcss.com/docs/configuration
- Authoritative default palette hexes — `tailwindcss@3.4.19/src/public/colors.js` via unpkg
- Retrieved through Context7 `/websites/v3_tailwindcss` (v3-specific id; the unversioned
  `/websites/tailwindcss` id serves v4 and would have produced the wrong answer)
