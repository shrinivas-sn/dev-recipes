// Family 7 — fixed-bar-budget (major). Must also run at landscape (viewports list below).
const { measureTwice, fmtOffenders } = require('./_shared');

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

  const vh = document.documentElement.clientHeight;
  const bars = [...document.querySelectorAll('body *')].filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    return r.top <= 0 || r.bottom >= vh;
  }).map((el) => {
    const r = el.getBoundingClientRect();
    const isOverlay = el.getAttribute('aria-modal') === 'true' || el.getAttribute('role') === 'dialog';
    return { sel: cssPath(el), height: Math.round(r.height), pct: Math.round((r.height / vh) * 1000) / 10, isOverlay };
  });

  const sum = bars.filter((b) => !b.isOverlay).reduce((acc, b) => acc + b.height, 0);
  return { vh, sum, bars };
};

module.exports = {
  id: 'fixed-bar-budget',
  severity: 'major',
  appliesWhen: () => true,
  viewports: ['xs', 'sm', 'md', 'land'],
  async run(page) {
    const { value, unstable } = await measureTwice(page, inPage, [], (a, b) => a.sum === b.sum && a.bars.length === b.bars.length);
    if (unstable) return { status: 'unstable', measured: { note: 'fixed-bar set changed between measurements' }, offenders: [] };

    const budgetPct = value.sum / value.vh;
    const oversizedSingle = value.bars.filter((b) => !b.isOverlay && b.pct > 60);
    const pass = budgetPct <= 0.25 && oversizedSingle.length === 0;

    return {
      status: pass ? 'pass' : 'fail',
      measured: { fixedHeightSumPx: value.sum, viewportHeightPx: value.vh, budgetPct: Math.round(budgetPct * 1000) / 10 },
      offenders: fmtOffenders(value.bars.filter((b) => !b.isOverlay).map((b) => ({ sel: b.sel, heightPx: b.height, pctOfViewport: b.pct }))),
    };
  },
};
