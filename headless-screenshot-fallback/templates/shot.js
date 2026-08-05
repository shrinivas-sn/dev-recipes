const puppeteer = require('puppeteer-core');

// Usage: node shot.js <output-path-prefix>
// Requires: npm install --no-save puppeteer-core (run inside the target project)
// If run from outside the project, set NODE_PATH to the project's node_modules first.

(async () => {
  const [,, outPrefix] = process.argv;
  if (!outPrefix) {
    console.error('Usage: node shot.js <output-path-prefix>');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // <ADJUST_PER_OS>
    headless: 'new',
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' }); // <ADJUST_DEV_SERVER_URL>
  await new Promise(r => setTimeout(r, 800));

  const sections = ['hero', 'about', 'work', 'approach', 'contact']; // <ADJUST_SECTION_IDS>
  for (const id of sections) {
    await page.evaluate((sectionId) => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, id);
    await new Promise(r => setTimeout(r, 900));
    await page.screenshot({ path: `${outPrefix}-${id}.png` });
  }

  await browser.close();
  console.log(`Done -> ${outPrefix}-*.png`);
})();
