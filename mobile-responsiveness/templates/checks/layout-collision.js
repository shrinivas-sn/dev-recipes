// Family 6 — layout-collision: A occlusion (blocker), B clipping (blocker), C image distortion (major).
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

  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  // A. Occlusion
  const textEls = [...document.querySelectorAll('body *')].filter((el) => {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (!own) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < vh && r.bottom > 0 && r.left < vw && r.right > 0;
  });
  const occluded = [];
  textEls.forEach((el) => {
    const r = el.getBoundingClientRect();
    const cx = Math.min(Math.max(r.left + r.width / 2, 0), vw - 1);
    const cy = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1);
    const hit = document.elementFromPoint(cx, cy);
    if (!hit) return;
    if (hit === el || el.contains(hit) || hit.contains(el)) return;
    const overlay = hit.closest('[role="dialog"], [aria-modal="true"]') || (getComputedStyle(hit).position === 'fixed' && hit.getAttribute('aria-expanded') !== null);
    if (overlay) return;
    occluded.push({ sel: cssPath(el), coveredBy: cssPath(hit) });
  });

  // B. Clipping
  const clipped = [...document.querySelectorAll('body *')].filter((el) => {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (!own) return false;
    const cs = getComputedStyle(el);
    return cs.overflowY === 'hidden' && el.scrollHeight > el.clientHeight + 1;
  }).map((el) => ({ sel: cssPath(el), scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));

  // C. Image distortion
  const distorted = [...document.querySelectorAll('img')].filter((img) => img.naturalWidth > 0).filter((img) => {
    const natRatio = img.naturalWidth / img.naturalHeight;
    const r = img.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const rendRatio = r.width / r.height;
    const dev = Math.abs(rendRatio - natRatio) / natRatio;
    const cs = getComputedStyle(img);
    return dev > 0.05 && (cs.objectFit === 'fill' || cs.objectFit === '');
  }).map((img) => ({ sel: cssPath(img), naturalRatio: Math.round((img.naturalWidth / img.naturalHeight) * 100) / 100, renderedRatio: Math.round((img.getBoundingClientRect().width / img.getBoundingClientRect().height) * 100) / 100 }));

  return { occludedCount: occluded.length, clippedCount: clipped.length, distortedCount: distorted.length, occluded, clipped, distorted };
};

module.exports = {
  id: 'layout-collision',
  severity: 'blocker',
  appliesWhen: () => true,
  viewports: ['xs', 'sm', 'md', 'land'],
  async run(page) {
    const { value, unstable } = await measureTwice(page, inPage, [], (a, b) =>
      a.occludedCount === b.occludedCount && a.clippedCount === b.clippedCount && a.distortedCount === b.distortedCount
    );
    if (unstable) return { status: 'unstable', measured: { note: 'occlusion/clip/distortion counts changed between measurements' }, offenders: [] };

    const pass = value.occludedCount === 0 && value.clippedCount === 0 && value.distortedCount === 0;
    return {
      status: pass ? 'pass' : 'fail',
      measured: { occluded: value.occludedCount, clipped: value.clippedCount, distorted: value.distortedCount },
      offenders: [
        ...fmtOffenders(value.occluded.map((o) => ({ tier: 'occlusion', ...o })), 5),
        ...fmtOffenders(value.clipped.map((o) => ({ tier: 'clipping', ...o })), 5),
        ...fmtOffenders(value.distorted.map((o) => ({ tier: 'distortion', ...o })), 5),
      ],
    };
  },
};
