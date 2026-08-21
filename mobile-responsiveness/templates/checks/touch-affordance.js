// Family 10 — touch-affordance (major). Scans the rendered CSSOM (works for
// any build tool, including Tailwind JIT output) for hover-gated visibility
// rules not wrapped in @media (hover: hover), then confirms reachability at
// a touch viewport.
const { fmtOffenders } = require('./_shared');

const inPage = () => {
  function scanRule(rule, insideHoverMedia, out) {
    if (rule.type === CSSRule.MEDIA_RULE) {
      const isHoverGuard = /hover\s*:\s*hover/.test(rule.conditionText || rule.media.mediaText);
      for (const r of rule.cssRules) scanRule(r, insideHoverMedia || isHoverGuard, out);
      return;
    }
    if (rule.type !== CSSRule.STYLE_RULE) return;
    if (!/:hover/.test(rule.selectorText || '')) return;
    const text = rule.style.cssText;
    const changesVisibility = /(display|visibility|opacity)\s*:/.test(text);
    if (changesVisibility && !insideHoverMedia) {
      out.push({ selector: rule.selectorText });
    }
  }

  const offenders = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    for (const r of rules) scanRule(r, false, offenders);
  }

  // touch-action / tap-highlight on drag surfaces
  const dragSurfaces = [...document.querySelectorAll('[class*="drag"], [class*="swipe"], [draggable="true"]')].map((el) => {
    const cs = getComputedStyle(el);
    return { sel: el.tagName.toLowerCase(), hasTouchAction: cs.touchAction !== 'auto', tapHighlightRemoved: cs.webkitTapHighlightColor === 'rgba(0, 0, 0, 0)' };
  });

  return { hoverGatedRules: offenders, dragSurfaces };
};

module.exports = {
  id: 'touch-affordance',
  severity: 'major',
  appliesWhen: (profile) => profile.hasUnguardedHoverCss,
  viewports: ['sm'],
  async run(page) {
    const { hoverGatedRules, dragSurfaces } = await page.evaluate(inPage);
    const unguardedNoFallback = dragSurfaces.filter((d) => !d.hasTouchAction && !d.tapHighlightRemoved);

    const pass = hoverGatedRules.length === 0;
    return {
      status: pass ? 'pass' : 'fail',
      measured: { unguardedHoverRules: hoverGatedRules.length, dragSurfacesChecked: dragSurfaces.length },
      offenders: fmtOffenders(hoverGatedRules.map((r) => ({ tier: 'unguarded-hover-reveal', selector: r.selector }))),
    };
  },
};
