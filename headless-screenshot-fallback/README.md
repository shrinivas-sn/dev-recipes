# Headless Screenshot Fallback

For visually verifying a local dev server (before/after UI checks, no-ai-slop visual
verification, general "does this actually look right") when the `claude-in-chrome` browser
extension isn't connected this session.

## The problem

`chrome.exe --headless --screenshot=out.png --window-size=W,H url` looks like it should work,
but has two gotchas that waste a lot of time before you notice:

1. **It never scrolls.** It captures exactly the initial viewport at load, full stop. There's
   no CLI flag to scroll before capture.
2. **Increasing `--window-size` height doesn't reveal more content on a page with a
   `min-h-screen`/`100vh` hero.** That CSS is relative to the viewport you just told Chrome to
   use, so a taller window just makes the hero section taller — content further down the page
   never enters frame no matter how tall you go. (Cost about 4 wasted screenshot attempts to
   notice this the first time.)

`--virtual-time-budget=N` fixes a different, real problem (letting JS/animations/webfonts
finish before the single-shot capture) — keep using it — but it doesn't fix either issue above.

## The fix: puppeteer-core against the already-installed browser

Don't download a new Chromium. Point `puppeteer-core` at whatever Chrome/Edge is already on
the machine and drive it for real (navigate, scroll, click, wait, screenshot per state).

```js
// templates/shot.js
const puppeteer = require('puppeteer-core');

(async () => {
  const [,, outPrefix] = process.argv;
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // adjust per OS
    headless: 'new',
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800)); // let entrance animations settle

  const sections = ['hero', 'about', 'work', 'approach', 'contact']; // adjust per project
  for (const id of sections) {
    await page.evaluate((sectionId) => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, id);
    await new Promise(r => setTimeout(r, 900));
    await page.screenshot({ path: `${outPrefix}-${id}.png` });
  }

  await browser.close();
})();
```

Find the installed browser first if the path is unknown:

```bash
# Windows, via Bash tool
ls "/c/Program Files/Google/Chrome/Application/chrome.exe" 2>/dev/null
ls "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" 2>/dev/null
```

## Setup gotcha: NODE_PATH

If the script lives outside the project (e.g. a job/scratch tmp dir) but `puppeteer-core` is
installed in the *project's* `node_modules`, plain `node script.js` fails with
`Cannot find module 'puppeteer-core'` — Node resolves modules relative to the requiring file's
own directory tree, not your cwd. Fix by pointing `NODE_PATH` at the project's `node_modules`:

```bash
npm install --no-save puppeteer-core   # run inside the project dir; --no-save keeps package.json untouched
NODE_PATH="/path/to/project/node_modules" node /path/to/scratch/shot.js /path/to/out/prefix
```

`--no-save` matters: this is a throwaway verification dependency, not a real project
dependency — don't let it leak into `package.json`.

## Extra: testing `prefers-reduced-motion`

Puppeteer can emulate media features, which is otherwise hard to test headlessly:

```js
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
```

Useful for actually confirming a reduced-motion code path fires, instead of just trusting the
code looks right.

## When to reach for this vs. `claude-in-chrome`

- `claude-in-chrome` connected → use it, it's simpler and interactive.
- Not connected, and the project already has `node`/`npm` → this.
- No local browser installed at all → fall back to the plain `chrome --headless --screenshot`
  single-viewport capture (with `--virtual-time-budget`), accept the scroll limitation, and say
  so explicitly rather than presenting an unscrolled screenshot as a full verification.

See also: [`no-ai-slop-existing-app/`](../no-ai-slop-existing-app/), whose Step 3 visual
verification requirement is exactly the trigger this recipe was extracted from.
