# Website Animation Patterns Recipe

A production-grade reference library for building animations that hold up under real conditions — not just quick demos.

Each pattern extracted from real bugs that cost a full debugging pass the first time. Organized by library/technique so the next project (any stack, any library) doesn't repeat them.

## 🎯 Use This Recipe When

- Building website/app animations and want to avoid common pitfalls
- Analyzing award-winning sites to extract animation techniques
- Deciding between GSAP, Framer Motion, or vanilla CSS
- Debugging animations that work in dev but fail in production
- Retrofitting animations into existing apps without breaking them

## 📚 Quick Navigation

### Core Knowledge (Read These First)

- **[Universal Principles](_core/principles.md)** — Library-agnostic rules (reduced-motion, GPU properties, motion justification)
- **[Diagnostics](_core/diagnostics.md)** — Debugging techniques and common issues

### Library-Specific Patterns

- **[GSAP + React](libraries/gsap/README.md)** — `useGSAP` scope, kill/recreate pattern, reduced-motion, sliding indicators
- **[Framer Motion](libraries/framer-motion/README.md)** — Layout animations, exit animations, drag interactions

### Reference Sites & Extraction

- **[Awwwards References](awwwards-refs/)** — Award-winning animations organized by site
- **[How to Extract](awwwards-refs/how-to-extract.md)** — Step-by-step methodology for analyzing reference sites

---

## 🚀 Automation & Workflow

### Adding New Animation References

When you find a good animation reference (site, GitHub repo, documentation), the automation handles the rest:

```bash
cd E:\dev-recipes\website-animation-patterns\scripts
node add-animation-ref.js "https://paulkalkbrenner.net"
```

**What happens automatically:**
1. ✓ Detects reference type (GitHub, Awwwards site, official docs)
2. ✓ Auto-detects library (GSAP, Framer Motion, etc)
3. ✓ Generates markdown template with extraction checklist
4. ✓ Saves to correct folder structure
5. ✓ Links to external resources (doesn't copy code)
6. ✓ Auto-commits to git for traceability
7. ✓ Updates global README with status

**What you do:**
1. Review generated file
2. Fill in animation patterns and extracted code snippets
3. Note gotchas and library-specific tips
4. Commit your review

### Supported Reference Types

| Type | Example | Stored In |
|------|---------|-----------|
| GitHub Repo | `github.com/greensock/GSAP` | `libraries/[library-name]/` |
| Awwwards Site | `paulkalkbrenner.net` | `awwwards-refs/` |
| Official Docs | `motion.dev`, `gsap.com` | `_core/references/` |
| NPM Package | `npmjs.com/package/framer-motion` | `libraries/[package]/` |

---

## 📊 Recipe Status

### Directory Structure

```
website-animation-patterns/
├── README.md (you are here)
├── _core/
│   ├── principles.md       → Universal rules
│   ├── diagnostics.md      → Debugging techniques
│   └── references/         → Official docs links
├── libraries/
│   ├── gsap/
│   │   ├── README.md       → GSAP patterns & gotchas
│   │   ├── patterns.md     → Detailed patterns
│   │   └── templates/      → Reusable code snippets
│   ├── framer-motion/
│   │   ├── README.md       → Motion patterns
│   │   └── patterns.md     → Detailed patterns
│   └── [new-library]/      → Add new libraries as needed
├── awwwards-refs/
│   ├── how-to-extract.md   → Extraction methodology
│   └── [site-name].md      → Individual site references
└── scripts/
    └── add-animation-ref.js → CLI automation tool
```

### Content Status

| Category | Status | Count |
|----------|--------|-------|
| **Core Principles** | ✓ Complete | 4 articles |
| **GSAP Patterns** | ✓ Complete | 4 patterns + 2 templates |
| **Framer Motion Patterns** | ✓ In Progress | 3 patterns |
| **Awwwards References** | ⏳ Pending Review | 0 sites |
| **GitHub Library References** | ⏳ Pending Review | 0 repos |

---

## 🔧 How to Contribute

### Adding a New Animation Pattern

1. Find a reference (site or repo)
2. Run automation:
   ```bash
   node scripts/add-animation-ref.js "<url>"
   ```
3. Review generated file
4. Document observations:
   - Animation type (entrance, scroll, hover, etc)
   - Library used
   - Performance characteristics
   - Gotchas discovered
5. Extract code snippets (with links to original source)
6. Commit and wait for review

### Adding a New Library Section

1. Create `libraries/[library-name]/` directory
2. Copy `README.md` template structure from existing library
3. Document core patterns
4. Add templates in `templates/` subfolder
5. Update this README with new library link

### Updating Existing Patterns

Only update if:
- Pattern is wrong or incomplete
- New gotcha discovered in production
- Library released breaking change

Always create a new commit with clear message explaining why.

---

## 🎓 Learning Path

**New to animation in React?**
1. Read [Core Principles](_core/principles.md) first
2. Choose your library:
   - GSAP for complex sequences → [GSAP Patterns](libraries/gsap/README.md)
   - React animations → [Framer Motion Patterns](libraries/framer-motion/README.md)
3. Study the templates in `libraries/[your-library]/templates/`
4. Apply to your project

**Debugging an animation issue?**
1. Check [Diagnostics](_core/diagnostics.md)
2. Search for your library in [libraries/](libraries/)
3. Match your issue to the gotchas section

**Extracting from reference sites?**
1. Read [How to Extract](awwwards-refs/how-to-extract.md)
2. Analyze reference site with browser devtools
3. Run `node scripts/add-animation-ref.js "<url>"`
4. Fill in the generated template

---

## 🚨 Important Notes

### Don't Add

- Purely decorative animations (no functional purpose)
- Animations that don't respect reduced-motion
- Layout-thrashing patterns (width/height animations)
- Code copies — link to original source instead
- Untested patterns (always verify in production-like conditions)

### Always Check

- Does animation solve a problem or just look pretty?
- Does it respect `prefers-reduced-motion`?
- Are only GPU-safe properties animated (`transform`, `opacity`)?
- Performance impact (Performance tab green/purple, no red)?
- Works on mobile + low-end devices?
- Accessibility: Does it confuse screen readers or keyboard nav?

---

## 📖 See Also

- [no-ai-slop-existing-app](../no-ai-slop-existing-app/) — The retrofit workflow these patterns are used in
- Emil Kowalski's animation philosophy (`~/.claude/skills/animate/`, `~/.claude/skills/review-animations/`)
- Official references:
  - [GSAP Skills](https://github.com/greensock/gsap-skills)
  - [motion.dev](https://motion.dev/)

---

## 🔄 Automation Commit History

*Auto-tracked by add-animation-ref.js*

```
(auto-commits appear here as references are added)
```

---

**Last Updated:** 2026-08-07
**Maintained by:** Animation Recipe Automation
**Questions?** Check the Diagnostics guide or reference documentation.
