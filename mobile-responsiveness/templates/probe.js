#!/usr/bin/env node
// probe.js <baseUrl> <outDir> [--routes a,b,c] [--viewports xs,sm,md,land] [--only family-id] [--project-root <path>]
//
// Launches puppeteer-core once, reuses the browser across viewports/routes.
// Per (viewport, route): newPage, emulate, goto, settle, run each check module
// in order (static families first, nav-drawer last because it's interactive).
// Writes results-<route>-<viewport>.json. Exit code is always 0 — the skill
// reads the JSON; the exit code carries no meaning.
//
// Requires: npm install --no-save puppeteer-core (run inside the target project).
// If this script lives outside the project, set NODE_PATH to the project's
// node_modules first — see E:\dev-recipes\headless-screenshot-fallback\README.md.

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CANONICAL_VIEWPORTS = {
  xs: { id: 'xs', w: 320, h: 568, dpr: 2 },
  sm: { id: 'sm', w: 390, h: 844, dpr: 3 },
  md: { id: 'md', w: 768, h: 1024, dpr: 2 },
  land: { id: 'land', w: 844, h: 390, dpr: 3 },
};

const CHECK_ORDER = [
  'overflow-x', 'viewport-meta', 'tap-targets', 'text-legibility', 'form-input-zoom',
  'layout-collision', 'fixed-bar-budget', 'dvh-safe-area', 'media-cls',
  'touch-affordance', 'reduced-motion', 'nav-drawer',
];

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function parseArgs(argv) {
  const [baseUrl, outDir, ...rest] = argv;
  const opts = { routes: ['/'], viewports: Object.keys(CANONICAL_VIEWPORTS), only: null, projectRoot: null };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--routes') opts.routes = rest[++i].split(',');
    else if (rest[i] === '--viewports') opts.viewports = rest[++i].split(',');
    else if (rest[i] === '--only') opts.only = rest[++i];
    else if (rest[i] === '--project-root') opts.projectRoot = rest[++i];
  }
  return { baseUrl, outDir, opts };
}

function loadChecks(only) {
  const dir = path.join(__dirname, 'checks');
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.js') && !f.startsWith('_'))
    .map((f) => require(path.join(dir, f)))
    .filter((m) => !only || m.id === only)
    .sort((a, b) => (a.interactive ? 1 : 0) - (b.interactive ? 1 : 0));
}

function grepAny(root, re, exts) {
  if (!root) return false;
  const stack = [root];
  let seen = 0;
  while (stack.length && seen < 500) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.') || e.name === 'dist') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { stack.push(full); continue; }
      if (!exts.has(path.extname(e.name))) continue;
      seen++;
      let content;
      try { content = fs.readFileSync(full, 'utf8'); } catch { continue; }
      if (re.test(content)) return true;
    }
  }
  return false;
}

async function detectProfile(page, projectRoot) {
  const runtime = await page.evaluate(() => {
    const hasForm = !!document.querySelector('form, input, textarea, select');
    const hasMedia = !!document.querySelector('img, video');
    const hasNavLandmark = !!document.querySelector('nav');
    const vh = document.documentElement.clientHeight;
    const hasFixedEdgeBar = [...document.querySelectorAll('body *')].some((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.top <= 0 || r.bottom >= vh);
    });
    const hasMotionCss = [...document.querySelectorAll('*')].some((el) => {
      const cs = getComputedStyle(el);
      return (cs.animationName && cs.animationName !== 'none') || parseFloat(cs.transitionDuration) > 0.1;
    });
    let hasHoverCss = false;
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      if (!rules) continue;
      for (const r of rules) {
        if (r.selectorText && /:hover/.test(r.selectorText) && /(display|visibility|opacity)\s*:/.test(r.style?.cssText || '')) {
          hasHoverCss = true;
          break;
        }
      }
      if (hasHoverCss) break;
    }
    return { hasForm, hasMedia, hasNavLandmark, hasFixedEdgeBar, hasMotionCss, hasHoverCss };
  });

  const usesFullHeightUnits = grepAny(projectRoot, /\b(100vh|h-screen|min-h-screen|max-h-screen)\b/, new Set(['.css', '.scss', '.jsx', '.tsx', '.js', '.ts', '.html']));
  const hasMotionLib = grepAny(projectRoot ? path.join(projectRoot, 'package.json') : null, /gsap|framer-motion|lenis/, new Set(['.json']))
    || (() => { try { const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')); const deps = { ...pkg.dependencies, ...pkg.devDependencies }; return Object.keys(deps || {}).some((d) => /gsap|framer-motion|motion|lenis/i.test(d)); } catch { return false; } })();

  return {
    hasForm: runtime.hasForm,
    hasMedia: runtime.hasMedia,
    hasNavLandmark: runtime.hasNavLandmark,
    hasFixedEdgeBar: runtime.hasFixedEdgeBar,
    usesFullHeightUnits,
    hasMotion: runtime.hasMotionCss || hasMotionLib,
    hasUnguardedHoverCss: runtime.hasHoverCss,
  };
}

async function run() {
  const { baseUrl, outDir, opts } = parseArgs(process.argv.slice(2));
  if (!baseUrl || !outDir) {
    console.error('Usage: node probe.js <baseUrl> <outDir> [--routes a,b,c] [--viewports xs,sm,md,land] [--only family-id] [--project-root <path>]');
    process.exit(0);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const executablePath = findChrome();
  if (!executablePath) {
    console.error('No Chrome/Edge found at the usual install paths. Install one, or pass a custom executablePath.');
    process.exit(0);
  }

  const browser = await puppeteer.launch({ executablePath, headless: 'new' });
  const checks = loadChecks(opts.only);
  const summary = [];

  for (const routePath of opts.routes) {
    const url = new URL(routePath, baseUrl).toString();
    for (const vpId of opts.viewports) {
      const vp = CANONICAL_VIEWPORTS[vpId] || parseCustomViewport(vpId);
      if (!vp) { console.error(`Unknown viewport: ${vpId}`); continue; }

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36');
      await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, isMobile: true, hasTouch: true });
      await page.goto(url, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 800));
      await page.evaluate(() => document.fonts && document.fonts.ready);

      const profile = await detectProfile(page, opts.projectRoot);
      const ctx = { viewport: vp, route: routePath, url, projectRoot: opts.projectRoot, priorResults: {} };

      const results = {};
      for (const check of checks) {
        const familyList = check.viewports || Object.keys(CANONICAL_VIEWPORTS);
        if (!familyList.includes(vp.id) && CANONICAL_VIEWPORTS[vp.id]) {
          results[check.id] = { status: 'n/a', measured: { reason: `family not run at ${vp.id}` }, offenders: [] };
          continue;
        }
        if (!check.appliesWhen(profile)) {
          results[check.id] = { status: 'n/a', measured: { reason: 'applies_when false for this project' }, offenders: [] };
          continue;
        }
        try {
          const res = await check.run(page, ctx);
          results[check.id] = res;
          ctx.priorResults[check.id] = res;
        } catch (err) {
          results[check.id] = { status: 'unstable', measured: { error: String(err && err.message || err) }, offenders: [] };
        }

        if (['layout-collision', 'fixed-bar-budget', 'nav-drawer'].includes(check.id)) {
          const shotPath = path.join(outDir, `${sanitize(routePath)}-${vp.id}-${check.id}.png`);
          try { await page.screenshot({ path: shotPath }); } catch {}
        }
      }

      const outFile = path.join(outDir, `results-${sanitize(routePath)}-${vp.id}.json`);
      fs.writeFileSync(outFile, JSON.stringify({ route: routePath, viewport: vp, profile, results }, null, 2));
      summary.push(outFile);
      await page.close();
    }
  }

  await browser.close();
  console.log(`Wrote ${summary.length} result file(s) to ${outDir}`);
  process.exit(0);
}

function parseCustomViewport(spec) {
  const m = /^(\d+)x(\d+)$/.exec(spec);
  if (!m) return null;
  return { id: spec, w: Number(m[1]), h: Number(m[2]), dpr: 2 };
}

function sanitize(routePath) {
  if (routePath === '/' || routePath === '') return 'root';
  return routePath.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]/gi, '_') || 'root';
}

run().catch((err) => {
  console.error(err);
  process.exit(0);
});
