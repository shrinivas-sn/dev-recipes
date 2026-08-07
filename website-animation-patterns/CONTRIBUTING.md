# Contributing to Animation Patterns Recipe

## Adding a New Animation Reference

### Quick Start

```bash
cd E:\dev-recipes\website-animation-patterns
node scripts/add-animation-ref.js "https://your-reference-url.com"
```

The automation will:
1. Detect what type of reference it is
2. Create a markdown file in the right folder
3. Generate an extraction checklist
4. Auto-commit the draft

### Manual Steps After Automation

1. **Open the generated file** (path printed in console)
2. **Document what you observe:**
   - Animation types (entrance, scroll, hover, layout, parallax)
   - Library used (GSAP, Framer Motion, vanilla CSS, etc)
   - Performance (GPU-accelerated or layout thrashing?)
   - Reduced-motion support?
   - Duration and easing

3. **Extract code patterns:**
   ```markdown
   ## Pattern: [Animation Name]

   **Trigger:** [When it happens]
   **Elements:** [What animates]
   **Properties:** opacity, transform, scale, etc
   **Duration:** [time]
   **Easing:** [curve]

   ### Code Reference
   [Link to original source or code snippet]
   ```

4. **Note any gotchas:**
   - Edge cases discovered
   - Performance considerations
   - Mobile/accessibility concerns
   - Browser compatibility

5. **Categorize:**
   - If GSAP → add to `libraries/gsap/patterns.md`
   - If Framer Motion → add to `libraries/framer-motion/patterns.md`
   - If mixed/site reference → keep in `awwwards-refs/[site].md`

6. **Commit your work:**
   ```bash
   git add .
   git commit -m "docs(animation): analyze [site/library] animation patterns"
   ```

---

## Adding a New Library

When you encounter a library not yet documented:

1. **Create directory:**
   ```bash
   mkdir -p E:\dev-recipes\website-animation-patterns\libraries\[library-name]
   mkdir -p E:\dev-recipes\website-animation-patterns\libraries\[library-name]\templates
   ```

2. **Create README.md using this template:**
   ```markdown
   # [Library Name] Patterns

   Production patterns for [Library Name].

   **When to use:** [Situation]

   ## Reference

   - **Official:** [URL]
   - **GitHub:** [URL]

   ## Core Patterns

   ### 1. [Pattern Name]
   [Explanation + code example]

   ### 2. [Pattern Name]
   [Explanation + code example]

   ## Gotchas

   ### [Issue]
   [Description + solution]

   ## Templates

   - [`template1.js`](./templates/template1.js)
   - [`template2.js`](./templates/template2.js)

   ## See Also

   - [Core Principles](../../_core/principles.md)
   - [Diagnostics](../../_core/diagnostics.md)
   ```

3. **Add reusable templates** to `templates/` subfolder

4. **Update main README.md:**
   - Add library to directory structure
   - Add to Library-Specific Patterns section
   - Update Content Status table

5. **Commit:**
   ```bash
   git add libraries/[library-name]
   git commit -m "docs(recipe): add [library-name] pattern library"
   ```

---

## Fixing Mistakes or Updating Patterns

### Only update if:

- ✓ Pattern is factually wrong
- ✓ New gotcha discovered in production
- ✓ Library released breaking change
- ✓ Better code snippet found

### Don't update for:

- ✗ Stylistic changes
- ✗ Adding more details (create new pattern instead)
- ✗ Opinions (discussions belong in issues, not edits)

### How to update:

1. Edit the file
2. Commit with clear message:
   ```bash
   git commit -m "fix(gsap): correct useGSAP scope explanation"
   ```

---

## Quality Checklist

Before committing any pattern:

- [ ] Pattern has clear title and purpose
- [ ] "When to use" is explicit
- [ ] Code example is complete and runnable
- [ ] Includes at least one gotcha or edge case
- [ ] Links to official documentation
- [ ] Verified the pattern works (not theoretical)
- [ ] Checked accessibility implications
- [ ] Confirmed reduced-motion support
- [ ] GPU-safe properties only (no layout thrashing)
- [ ] Mobile-tested (not just desktop)

---

## File Naming Conventions

- Folder names: `kebab-case` (`framer-motion`, `three-js`)
- File names: `kebab-case.md` (or `.ts`/`.js` for code)
- Library names in filenames: Match GitHub convention

---

## Git Workflow

```bash
# 1. Create/analyze reference
node scripts/add-animation-ref.js "<url>"

# 2. Fill in the template
# (edit generated file)

# 3. Stage and commit
git add .
git commit -m "docs(animation): add [reference] patterns"

# 4. Push when ready
git push origin main
```

---

## Common Commit Message Patterns

```
docs(animation): add [site] animation reference
docs(gsap): add pattern for [pattern-name]
docs(recipe): reorganize library structure
fix(diagnostics): clarify reduced-motion testing
feat(automation): improve library detection
refactor(patterns): consolidate duplicate patterns
```

---

## Questions?

Refer to:
- [how-to-extract.md](awwwards-refs/how-to-extract.md) — Methodology for analyzing sites
- [_core/diagnostics.md](_core/diagnostics.md) — Debugging common issues
- Individual library READMEs for library-specific guidance
