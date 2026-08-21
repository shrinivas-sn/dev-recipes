// Family 1 — overflow-x (blocker). See mobile-checks.yaml for the owned/not_owns contract.
const { measureTwice, fmtOffenders } = require('./_shared');

const inPage = () => {
  function cssPath(el) {
    if (!(el instanceof Element)) return '';
    const parts = [];
    while (el && el.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
      let sel = el.nodeName.toLowerCase();
      if (el.id) { sel += `#${el.id}`; parts.unshift(sel); break; }
      let sib = el, nth = 1;
      while ((sib = sib.previousElementSibling)) if (sib.nodeName === el.nodeName) nth++;
      sel += `:nth-of-type(${nth})`;
      parts.unshift(sel);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }

  const de = document.documentElement;
  const vw = de.clientWidth;
  const delta = de.scrollWidth - vw;

  const offenders = [...document.querySelectorAll('*')].filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    if (r.right <= vw + 1 && r.left >= -1) return false;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      if (/(auto|scroll|hidden)/.test(pcs.overflowX)) return false;
    }
    return true;
  }).map((el) => ({ sel: cssPath(el), right: Math.round(el.getBoundingClientRect().right), vw }));

  return { delta, vw, offenders };
};

module.exports = {
  id: 'overflow-x',
  severity: 'blocker',
  appliesWhen: () => true,
  viewports: ['xs', 'sm', 'md', 'land'],
  async run(page) {
    const { value, unstable, first } = await measureTwice(page, inPage, [], (a, b) => a.delta === b.delta && a.offenders.length === b.offenders.length);
    if (unstable) {
      return { status: 'unstable', measured: { first, second: value }, offenders: [] };
    }
    const offenders = fmtOffenders(value.offenders);
    const pass = value.delta <= 0 && value.offenders.length === 0;
    return {
      status: pass ? 'pass' : 'fail',
      measured: { deltaPx: value.delta, viewportWidth: value.vw, offenderCount: value.offenders.length },
      offenders,
    };
  },
};
