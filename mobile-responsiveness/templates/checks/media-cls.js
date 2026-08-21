// Family 9 — media-cls (major: shift, minor: weight). Owns image intrinsic
// sizing, layout shift, lazy-loading, and byte weight — never aspect-ratio
// rendering (that's layout-collision, family 6).
const { fmtOffenders } = require('./_shared');

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
  const media = [...document.querySelectorAll('img, video')].map((el) => {
    const hasWH = el.hasAttribute('width') && el.hasAttribute('height');
    const cs = getComputedStyle(el);
    const hasAspect = cs.aspectRatio && cs.aspectRatio !== 'auto';
    const r = el.getBoundingClientRect();
    const belowFold = r.top > vh;
    const isLazy = el.getAttribute('loading') === 'lazy';
    const hasSrcset = el.tagName === 'IMG' ? el.hasAttribute('srcset') : false;
    return { sel: cssPath(el), tag: el.tagName, hasIntrinsic: hasWH || hasAspect, belowFold, isLazy, hasSrcset, src: el.currentSrc || el.src || '' };
  });
  return media;
};

module.exports = {
  id: 'media-cls',
  severity: 'major',
  appliesWhen: (profile) => profile.hasMedia,
  viewports: ['xs', 'sm'],
  async run(page) {
    let cls = 0;
    const client = await page.target().createCDPSession().catch(() => null);
    await page.evaluate(() => {
      window.__cls = 0;
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
    });
    await new Promise((r) => setTimeout(r, 2000));
    cls = await page.evaluate(() => window.__cls || 0);
    if (client) await client.detach().catch(() => {});

    const media = await page.evaluate(inPage);
    const resources = await page.evaluate(() =>
      performance.getEntriesByType('resource').filter((r) => r.initiatorType === 'img').map((r) => ({ name: r.name, size: r.encodedBodySize || r.transferSize || 0 }))
    );

    const missingIntrinsic = media.filter((m) => !m.hasIntrinsic);
    const missingLazy = media.filter((m) => m.belowFold && !m.isLazy);
    const totalBytes = resources.reduce((a, r) => a + r.size, 0);
    const heavy = resources.filter((r) => r.size > 300 * 1024);

    const shiftPass = cls < 0.1;
    const weightPass = heavy.length === 0 && totalBytes < 1.5 * 1024 * 1024;
    const intrinsicPass = missingIntrinsic.length === 0;

    let status = 'pass';
    if (!shiftPass || !intrinsicPass) status = 'fail';
    else if (!weightPass) status = 'warn';

    return {
      status,
      measured: { cls: Math.round(cls * 1000) / 1000, missingIntrinsic: missingIntrinsic.length, missingLazyBelowFold: missingLazy.length, totalImageBytes: totalBytes, heavyImageCount: heavy.length },
      offenders: [
        ...fmtOffenders(missingIntrinsic.map((m) => ({ tier: 'no-intrinsic-size', sel: m.sel })), 5),
        ...fmtOffenders(heavy.map((r) => ({ tier: 'heavy-image', src: r.name.split('/').pop(), kb: Math.round(r.size / 1024) })), 5),
      ],
    };
  },
};
