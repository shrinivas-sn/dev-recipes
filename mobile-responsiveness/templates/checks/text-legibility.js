// Family 4 — text-legibility (major). Excludes form fields (family 5) and
// explicit small/footnote text under 40 chars.
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

  const leaves = [...document.querySelectorAll('body *')].filter((el) => {
    if (['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return false;
    const text = (el.textContent || '').trim();
    if (text.length < 40) return false;
    // leaf-ish: no child element itself has >=40 chars of its own text (avoid double counting containers)
    const childHasEnough = [...el.children].some((c) => (c.textContent || '').trim().length >= 40);
    if (childHasEnough) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (el.closest('small')) return false;
    if (/\btext-xs\b/.test(el.className || '') && text.length < 40) return false;
    return true;
  });

  const results = leaves.map((el) => {
    const cs = getComputedStyle(el);
    const fontSize = parseFloat(cs.fontSize);
    const lineHeight = cs.lineHeight === 'normal' ? fontSize * 1.2 : parseFloat(cs.lineHeight);
    const ratio = lineHeight / fontSize;
    const r = el.getBoundingClientRect();
    const chWidth = fontSize * 0.5;
    const lineLenCh = chWidth > 0 ? Math.round(r.width / chWidth) : null;
    return { sel: cssPath(el), fontSize: Math.round(fontSize * 10) / 10, lineHeightRatio: Math.round(ratio * 100) / 100, lineLenCh };
  });

  return { total: results.length, results };
};

module.exports = {
  id: 'text-legibility',
  severity: 'major',
  appliesWhen: () => true,
  viewports: ['xs', 'sm'],
  async run(page) {
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const { value, unstable } = await measureTwice(page, inPage, [], (a, b) => a.total === b.total);
    if (unstable) return { status: 'unstable', measured: { note: 'text node count changed between measurements (font swap?)' }, offenders: [] };

    const failing = value.results.filter((r) => r.fontSize < 14 || r.lineHeightRatio < 1.4);
    const warning = value.results.filter((r) => r.fontSize >= 14 && r.fontSize < 16 && r.lineHeightRatio >= 1.4);

    let status = 'pass';
    if (failing.length) status = 'fail';
    else if (warning.length) status = 'warn';

    return {
      status,
      measured: { totalNodes: value.total, failing: failing.length, warn: warning.length },
      offenders: fmtOffenders(failing.map((r) => ({ sel: r.sel, fontSize: r.fontSize, lineHeightRatio: r.lineHeightRatio, lineLenCh: r.lineLenCh }))),
    };
  },
};
