// Family 11 — nav-drawer (blocker: can't navigate / major: a11y details).
// The only interactive family — runs LAST within a viewport (probe.js enforces
// order). Mutates the page (opens the drawer), so it must not run before the
// static families have already measured.
const findToggle = () => {
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
  const candidates = [...document.querySelectorAll('header button, nav button')].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().width > 0;
  });
  const scored = candidates.sort((a, b) => {
    const score = (el) => (el.hasAttribute('aria-controls') ? 2 : 0) + (el.hasAttribute('aria-expanded') ? 1 : 0);
    return score(b) - score(a);
  });
  const toggle = scored[0];
  return toggle ? { sel: cssPath(toggle) } : null;
};

const navLinksReachable = () => {
  const links = [...document.querySelectorAll('nav a[href]')].filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  return links.length > 0;
};

module.exports = {
  id: 'nav-drawer',
  severity: 'blocker',
  appliesWhen: (profile) => profile.hasNavLandmark,
  viewports: ['xs', 'sm'],
  interactive: true,
  async run(page) {
    const toggleInfo = await page.evaluate(findToggle);
    if (!toggleInfo) {
      const linksOk = await page.evaluate(navLinksReachable);
      return linksOk
        ? { status: 'n/a', measured: { reason: 'no drawer pattern — nav links already visible' }, offenders: [] }
        : { status: 'fail', measured: { reason: 'no toggle found and nav links not reachable' }, offenders: [{ tier: 'blocker', issue: 'no way to reach nav links at this viewport' }] };
    }

    const steps = {};

    await page.evaluate((sel) => document.querySelector(sel)?.click(), toggleInfo.sel);
    await new Promise((r) => setTimeout(r, 400));

    steps.step1_opens = await page.evaluate((sel) => {
      const t = document.querySelector(sel);
      return t?.getAttribute('aria-expanded') === 'true';
    }, toggleInfo.sel);

    steps.step2_focusInPanel = await page.evaluate((sel) => {
      const t = document.querySelector(sel);
      const panelId = t?.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : t?.nextElementSibling;
      return !!panel && (panel.contains(document.activeElement) || document.activeElement === t);
    }, toggleInfo.sel);

    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollTo(0, window.scrollY + 50));
    const scrollAfter = await page.evaluate(() => window.scrollY);
    steps.step3_scrollLocked = await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden' || getComputedStyle(document.documentElement).overflow === 'hidden') || scrollBefore === scrollAfter;

    await page.keyboard.press('Tab');
    steps.step4_tabCycles = await page.evaluate((sel) => {
      const t = document.querySelector(sel);
      const panelId = t?.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : t?.parentElement;
      return !!panel && panel.contains(document.activeElement);
    }, toggleInfo.sel);

    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 300));
    steps.step5_escapeCloses = await page.evaluate((sel) => document.querySelector(sel)?.getAttribute('aria-expanded') === 'false', toggleInfo.sel);

    await page.evaluate((sel) => document.querySelector(sel)?.click(), toggleInfo.sel);
    await new Promise((r) => setTimeout(r, 400));
    const hadLinkBefore = await page.evaluate(() => !!document.querySelector('nav a[href]'));
    if (hadLinkBefore) {
      await page.evaluate(() => document.querySelector('nav a[href]')?.click());
      await new Promise((r) => setTimeout(r, 400));
      steps.step6_closesOnNav = await page.evaluate((sel) => document.querySelector(sel)?.getAttribute('aria-expanded') !== 'true', toggleInfo.sel);
    } else {
      steps.step6_closesOnNav = null;
    }

    const blockerFail = steps.step1_opens === false || steps.step6_closesOnNav === false;
    const majorFail = steps.step2_focusInPanel === false || steps.step3_scrollLocked === false || steps.step4_tabCycles === false || steps.step5_escapeCloses === false;

    let status = 'pass';
    if (blockerFail) status = 'fail';
    else if (majorFail) status = 'warn';

    return { status, measured: steps, offenders: blockerFail || majorFail ? [{ toggle: toggleInfo.sel, ...steps }] : [] };
  },
};
