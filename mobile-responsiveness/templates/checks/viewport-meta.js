// Family 2 — viewport-meta (blocker). Static, deterministic — no double-measure needed.
const inPage = () => {
  const content = document.querySelector('meta[name="viewport"]')?.content || null;
  return { content };
};

function parseViewportContent(content) {
  if (!content) return { valid: false, reasons: ['no <meta name="viewport"> found'], hasCover: false };
  const parts = Object.fromEntries(
    content.split(',').map((p) => p.trim()).filter(Boolean).map((p) => {
      const [k, v] = p.split('=').map((s) => s.trim());
      return [k, v];
    })
  );
  const reasons = [];
  if (parts['width'] !== 'device-width') reasons.push('missing width=device-width');
  if (parts['initial-scale'] !== '1' && parts['initial-scale'] !== '1.0') reasons.push('missing initial-scale=1');
  if (parts['user-scalable'] === 'no' || parts['user-scalable'] === '0') reasons.push('user-scalable=no disables pinch-zoom');
  if (parts['maximum-scale'] !== undefined && Number(parts['maximum-scale']) < 5) reasons.push(`maximum-scale=${parts['maximum-scale']} is below 5`);
  if (parts['minimum-scale'] !== undefined && Number(parts['minimum-scale']) > 1) reasons.push(`minimum-scale=${parts['minimum-scale']} is above 1`);
  return { valid: reasons.length === 0, reasons, hasCover: parts['viewport-fit'] === 'cover' };
}

module.exports = {
  id: 'viewport-meta',
  severity: 'blocker',
  appliesWhen: () => true,
  viewports: ['xs'],
  async run(page) {
    const { content } = await page.evaluate(inPage);
    const parsed = parseViewportContent(content);
    return {
      status: parsed.valid ? 'pass' : 'fail',
      measured: { content, hasViewportFitCover: parsed.hasCover },
      offenders: parsed.valid ? [] : parsed.reasons,
    };
  },
};
