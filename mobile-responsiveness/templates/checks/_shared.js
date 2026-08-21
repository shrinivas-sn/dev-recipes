// Node-side helpers shared by check modules. Never runs in page context —
// anything that must run in the browser is defined inline inside each
// module's page.evaluate() call (Puppeteer serializes function source only,
// so in-page helpers can't be imported — see cssPath duplication below).

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Runs `evalFn` in the page twice, 300ms apart, and flags disagreement.
// `evalFn` and `args` must be structured-clone-safe (Puppeteer serializes
// the call). `compare` defaults to strict JSON equality.
async function measureTwice(page, evalFn, args = [], compare) {
  const a = await page.evaluate(evalFn, ...args);
  await sleep(300);
  const b = await page.evaluate(evalFn, ...args);
  const eq = compare ? compare(a, b) : JSON.stringify(a) === JSON.stringify(b);
  return { value: b, unstable: !eq, first: a, second: b };
}

function fmtOffenders(list, limit = 10) {
  return list.slice(0, limit);
}

module.exports = { sleep, measureTwice, fmtOffenders };
