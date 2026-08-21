// Family 3 — tap-targets (major, two-tier: 24px floor fails, 44px is warn target).
const { measureTwice, fmtOffenders } = require('./_shared');

const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [tabindex]:not([tabindex="-1"])';

const inPage = (sel) => {
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

  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const els = [...document.querySelectorAll(sel)].filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  });

  const rects = els.map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const inlineInText = cs.display === 'inline' && el.parentElement && /^(p|span|li|td)$/i.test(el.parentElement.nodeName) && el.tagName === 'A';
    return { el, sel: cssPath(el), r, inlineInText };
  });

  const results = rects.map((item, i) => {
    if (item.inlineInText) return { sel: item.sel, excluded: true, reason: 'inline link in body text (SC 2.5.8 exclusion)' };
    const { width: w, height: h, left, top } = item.r;
    const cx = left + w / 2, cy = top + h / 2;
    let minGap = Infinity;
    rects.forEach((other, j) => {
      if (i === j) return;
      const ocx = other.r.left + other.r.width / 2, ocy = other.r.top + other.r.height / 2;
      const gap = Math.hypot(cx - ocx, cy - ocy) - (Math.min(w, h) / 2) - (Math.min(other.r.width, other.r.height) / 2);
      if (gap < minGap) minGap = gap;
    });
    const minDim = Math.min(w, h);
    const floorPass = minDim >= 24 || minGap >= 24;
    const targetPass = w >= 44 && h >= 44;
    return { sel: item.sel, w: Math.round(w), h: Math.round(h), minGap: Math.round(minGap), floorPass, targetPass };
  });

  return { total: results.length, results };
};

module.exports = {
  id: 'tap-targets',
  severity: 'major',
  appliesWhen: () => true,
  viewports: ['xs', 'sm', 'md'],
  async run(page) {
    const { value, unstable } = await measureTwice(page, inPage, [SEL], (a, b) => a.total === b.total);
    if (unstable) return { status: 'unstable', measured: { note: 'target count changed between measurements' }, offenders: [] };

    const excluded = value.results.filter((r) => r.excluded);
    const scored = value.results.filter((r) => !r.excluded);
    const failing = scored.filter((r) => !r.floorPass);
    const warning = scored.filter((r) => r.floorPass && !r.targetPass);

    let status = 'pass';
    if (failing.length) status = 'fail';
    else if (warning.length) status = 'warn';

    return {
      status,
      measured: { totalTargets: scored.length, failingFloor: failing.length, warnBelowTarget: warning.length, excludedCount: excluded.length },
      offenders: [
        ...fmtOffenders(failing.map((r) => ({ sel: r.sel, w: r.w, h: r.h, gap: r.minGap, tier: 'floor-fail' }))),
        ...fmtOffenders(excluded.map((r) => ({ sel: r.sel, tier: 'excluded', reason: r.reason })), 5),
      ],
    };
  },
};
