// Family 5 — form-input-zoom (major). Owns font-size of <input>/<select>/<textarea> only.
const { fmtOffenders } = require('./_shared');

const SEL = "input:not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea";

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
  function hasLabel(el) {
    if (el.getAttribute('aria-label')) return true;
    if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return true;
    return !!el.closest('label');
  }

  const fields = [...document.querySelectorAll(sel)];
  const results = fields.map((el) => {
    const cs = getComputedStyle(el);
    const fontSize = parseFloat(cs.fontSize);
    const type = el.getAttribute('type') || (el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : 'text');
    const inputmode = el.getAttribute('inputmode');
    const autocomplete = el.getAttribute('autocomplete');
    const reasons = [];
    if (fontSize < 16) reasons.push(`font-size ${fontSize}px < 16px (iOS auto-zoom)`);
    if (type === 'email' && el.getAttribute('type') !== 'email') reasons.push('email-looking field missing type=email');
    if (!autocomplete) reasons.push('missing autocomplete');
    if (!hasLabel(el)) reasons.push('no associated label or aria-label');
    return { sel: cssPath(el), type, fontSize, inputmode, autocomplete, reasons };
  });

  return results;
};

module.exports = {
  id: 'form-input-zoom',
  severity: 'major',
  appliesWhen: (profile) => profile.hasForm,
  viewports: ['xs', 'sm'],
  async run(page) {
    const results = await page.evaluate(inPage, SEL);
    const failing = results.filter((r) => r.reasons.length > 0);
    return {
      status: failing.length ? 'fail' : 'pass',
      measured: { totalFields: results.length, failing: failing.length },
      offenders: fmtOffenders(failing.map((r) => ({ sel: r.sel, fontSize: r.fontSize, issues: r.reasons }))),
    };
  },
};
