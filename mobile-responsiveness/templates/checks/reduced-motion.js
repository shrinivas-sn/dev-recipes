// Family 12 — reduced-motion (major). Judges whether the reduce-motion code
// path fires, never animation taste (that's review-animations/improve-animations).
const fs = require('fs');
const path = require('path');
const { fmtOffenders } = require('./_shared');

const MOTION_LIB_RE = /(gsap|framer-motion|motion(?!\.)|@lenis|lenis)/i;

function grepMotionGuard(projectRoot) {
  if (!projectRoot) return { hasLib: false, hasGuard: false };
  let pkg;
  try { pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')); } catch { return { hasLib: false, hasGuard: false }; }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const hasLib = Object.keys(deps || {}).some((d) => MOTION_LIB_RE.test(d));
  if (!hasLib) return { hasLib: false, hasGuard: false };

  let hasGuard = false;
  const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
  const stack = [path.join(projectRoot, 'src')];
  let seen = 0;
  while (stack.length && seen < 400) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.name === 'node_modules') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { stack.push(full); continue; }
      if (!exts.has(path.extname(e.name))) continue;
      seen++;
      let content;
      try { content = fs.readFileSync(full, 'utf8'); } catch { continue; }
      if (/prefers-reduced-motion/.test(content)) { hasGuard = true; }
    }
  }
  return { hasLib, hasGuard };
}

const captureAnimated = () => {
  function cssPath(el) {
    const parts = [];
    while (el && el.nodeType === 1 && parts.length < 6) {
      let s = el.nodeName.toLowerCase();
      if (el.id) { parts.unshift(`${s}#${el.id}`); break; }
      parts.unshift(s);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }
  return [...document.querySelectorAll('*')].filter((el) => {
    const cs = getComputedStyle(el);
    return (cs.animationName && cs.animationName !== 'none') || parseFloat(cs.transitionDuration) > 0.1;
  }).map((el) => cssPath(el));
};

const checkInert = (sels) => {
  return sels.map((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, found: false, inert: true };
    const cs = getComputedStyle(el);
    const inert = (cs.animationName === 'none' || cs.animationPlayState === 'paused') && parseFloat(cs.transitionDuration) <= 0.01;
    return { sel, found: true, inert };
  });
};

module.exports = {
  id: 'reduced-motion',
  severity: 'major',
  appliesWhen: (profile) => profile.hasMotion,
  viewports: ['sm'],
  async run(page, ctx) {
    const url = ctx.url;
    const normalSels = await page.evaluate(captureAnimated);

    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));

    const results = await page.evaluate(checkInert, normalSels.slice(0, 50));
    const stillAnimating = results.filter((r) => r.found && !r.inert);

    const { hasLib, hasGuard } = grepMotionGuard(ctx.projectRoot);
    const guardMissing = hasLib && !hasGuard;

    // restore normal media features for subsequent checks at this viewport
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));

    const pass = stillAnimating.length === 0 && !guardMissing;
    return {
      status: pass ? 'pass' : 'fail',
      measured: { animatedElementsSampled: normalSels.length, stillAnimatingUnderReduce: stillAnimating.length, motionLibraryDetected: hasLib, matchMediaGuardFound: hasGuard },
      offenders: fmtOffenders(stillAnimating.map((r) => ({ sel: r.sel, issue: 'still animating under prefers-reduced-motion: reduce' }))),
    };
  },
};
