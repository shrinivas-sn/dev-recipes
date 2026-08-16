#!/usr/bin/env node
/**
 * verify-sources.js — re-probe every llms.txt URL in sources.yaml.
 *
 *   node E:/dev-recipes/_knowledge/scripts/verify-sources.js          # report only
 *   node E:/dev-recipes/_knowledge/scripts/verify-sources.js --write  # bump verified dates
 *
 * Deliberately dependency-free: no yaml parser, no fetch wrapper. It scans for
 * `llms_txt:` lines and HEAD/GETs them. The registry's whole value is that its
 * `verified` dates are real, and a script nobody can run because of a missing
 * npm install is a registry that rots.
 *
 * Context7 ids are NOT probed here — they need the MCP tool, which only Claude has.
 * `/context-brief` re-resolves an id the moment a query against it fails.
 */

const fs = require('fs');
const path = require('path');

const REGISTRY = path.join(__dirname, '..', 'sources.yaml');
const WRITE = process.argv.includes('--write');
const TIMEOUT_MS = 20000;

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Pull `id:` / `llms_txt:` pairs without a YAML dependency. */
function parseTargets(text) {
  const lines = text.split(/\r?\n/);
  const targets = [];
  let currentId = null;

  for (const line of lines) {
    const idMatch = line.match(/^\s*-\s+id:\s*(\S+)/);
    if (idMatch) {
      currentId = idMatch[1];
      continue;
    }
    const urlMatch = line.match(/^\s*llms_txt:\s*(https?:\/\/\S+)/);
    if (urlMatch && currentId) {
      targets.push({ id: currentId, url: urlMatch[1] });
      continue;
    }
    const nullMatch = line.match(/^\s*llms_txt:\s*null\b/);
    if (nullMatch && currentId) {
      targets.push({ id: currentId, url: null });
    }
  }
  return targets;
}

async function probe(url) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ac.signal });
    const body = await res.arrayBuffer();
    return { status: res.status, bytes: body.byteLength };
  } catch (err) {
    return { status: 0, bytes: 0, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

(async () => {
  if (!fs.existsSync(REGISTRY)) {
    console.error(`Registry not found: ${REGISTRY}`);
    process.exit(1);
  }

  const text = fs.readFileSync(REGISTRY, 'utf8');
  const targets = parseTargets(text);
  const live = targets.filter((t) => t.url);
  const declaredMissing = targets.filter((t) => !t.url);

  console.log(`Probing ${live.length} llms.txt sources (${declaredMissing.length} recorded as absent)\n`);

  const results = [];
  for (const t of live) {
    const r = await probe(t.url);
    results.push({ ...t, ...r });
    const kb = (r.bytes / 1024).toFixed(1);
    const mark = r.status === 200 ? 'ok  ' : 'FAIL';
    console.log(`  ${mark} ${String(r.status).padEnd(3)} ${kb.padStart(7)} KB  ${t.id.padEnd(14)} ${t.url}`);
  }

  const broken = results.filter((r) => r.status !== 200);
  console.log(`\n${results.length - broken.length}/${results.length} healthy.`);

  if (broken.length) {
    console.log('\nBroken — fix sources.yaml before trusting these tiers:');
    for (const b of broken) {
      console.log(`  ${b.id}: ${b.status || b.error} — ${b.url}`);
    }
  }

  if (WRITE && !broken.length) {
    // Only bump dates when everything passed; a partial bump would launder a failure.
    const stamped = text.replace(/^updated:\s*\d{4}-\d{2}-\d{2}/m, `updated: ${today()}`);
    fs.writeFileSync(REGISTRY, stamped);
    console.log(`\nStamped registry updated: ${today()}`);
  } else if (WRITE) {
    console.log('\nNot stamping — some probes failed. Fix them, then re-run with --write.');
  }

  process.exit(broken.length ? 1 : 0);
})();
