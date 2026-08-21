// Family 8 — dvh-safe-area (major). Reuses family 2's viewport-fit=cover result
// from ctx.priorResults['viewport-meta'] — never re-parses the meta tag.
const fs = require('fs');
const path = require('path');
const { fmtOffenders } = require('./_shared');

const SRC_EXT = new Set(['.css', '.scss', '.jsx', '.tsx', '.js', '.ts', '.html', '.vue', '.svelte']);
const BAD_UNIT = /\b(100vh|h-screen|min-h-screen|max-h-screen)\b/g;

function walk(dir, out, depth = 0) {
  if (depth > 8) return out;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name === 'dist' || e.name === 'build') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out, depth + 1);
    else if (SRC_EXT.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

function staticScan(projectRoot) {
  const files = walk(projectRoot, []);
  const hits = [];
  for (const f of files) {
    let content;
    try { content = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const matches = content.match(BAD_UNIT);
    if (matches) hits.push({ file: path.relative(projectRoot, f), count: matches.length, tokens: [...new Set(matches)] });
  }
  return hits;
}

const inPage = () => {
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
  const innerHeight = window.innerHeight;
  const vvHeight = window.visualViewport ? window.visualViewport.height : innerHeight;

  const fixedBars = [...document.querySelectorAll('body *')].filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && (r.top <= 0 || r.bottom >= innerHeight);
  }).map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const edge = r.top <= 0 ? 'top' : 'bottom';
    const paddingProp = edge === 'top' ? cs.paddingTop : cs.paddingBottom;
    const hasSafeArea = paddingProp.includes('env(') || (el.getAttribute('style') || '').includes('safe-area-inset');
    return { sel: cssPath(el), edge, hasSafeArea };
  });

  return { innerHeight, vvHeight, fixedBars };
};

module.exports = {
  id: 'dvh-safe-area',
  severity: 'major',
  appliesWhen: (profile) => profile.usesFullHeightUnits || profile.hasFixedEdgeBar,
  viewports: ['xs', 'sm'],
  async run(page, ctx) {
    const staticHits = ctx.projectRoot ? staticScan(ctx.projectRoot) : [];
    const runtime = await page.evaluate(inPage);
    const hasCover = ctx.priorResults?.['viewport-meta']?.measured?.hasViewportFitCover === true;

    const barsMissingSafeArea = runtime.fixedBars.filter((b) => !b.hasSafeArea);
    const safeAreaNeededButMissing = barsMissingSafeArea.length > 0;
    const coverMissingButUsed = safeAreaNeededButMissing === false && runtime.fixedBars.some((b) => b.hasSafeArea) && !hasCover;

    const pass = staticHits.length === 0 && !safeAreaNeededButMissing && !coverMissingButUsed;

    return {
      status: pass ? 'pass' : 'fail',
      measured: { bareViewportUnitFiles: staticHits.length, innerHeight: runtime.innerHeight, visualViewportHeight: runtime.vvHeight, viewportFitCover: hasCover },
      offenders: [
        ...fmtOffenders(staticHits.map((h) => ({ tier: 'bare-vh-unit', file: h.file, tokens: h.tokens.join(',') }))),
        ...fmtOffenders(barsMissingSafeArea.map((b) => ({ tier: 'missing-safe-area-padding', sel: b.sel, edge: b.edge })), 5),
      ],
    };
  },
};
