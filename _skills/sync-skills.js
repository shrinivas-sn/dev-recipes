#!/usr/bin/env node
/**
 * sync-skills.js — mirror the hand-written Claude Code skills into this repo.
 *
 * The live skills are the ones Claude Code loads, at LIVE (below). This repo holds a
 * copy so a disk failure or a bad `npx skills` run cannot lose them. A copy that goes
 * quietly stale is worse than no copy, so this script has two modes:
 *
 *   node sync-skills.js            copy live -> repo, print what changed
 *   node sync-skills.js --check    report drift only, write nothing; exit 1 if drifted
 *
 * Safety rule, borrowed from _knowledge/scripts/verify-sources.js: it refuses to run on
 * a partial picture. If a TRACKED skill is missing from the live directory, the script
 * aborts instead of mirroring the absence — otherwise deleting a skill by accident would
 * also delete its backup, which is precisely what the backup exists to prevent.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const LIVE = path.join(os.homedir(), '.claude', 'skills');
const REPO = __dirname;

// Hand-written skills only. The other entries in LIVE are symlinks to ~/.agents/skills
// (installed via `npx skills@latest`) and `impeccable`, which ships its own installer —
// all of those are recoverable by reinstalling, so they are deliberately not mirrored.
const TRACKED = [
  'animation-ref',
  'api-idea-scout',
  'context-brief',
  'design-source',
  'no-ai-slop',
  'no-ai-slop-writing',
  'production-readiness',
];

const check = process.argv.includes('--check');

/** Relative paths of every file under dir, sorted. Returns null if dir is absent. */
function listFiles(dir) {
  if (!fs.existsSync(dir)) return null;
  const out = [];
  (function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(path.relative(dir, full).split(path.sep).join('/'));
    }
  })(dir);
  return out.sort();
}

function sameContent(a, b) {
  return fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b));
}

// --- refuse to run on a partial picture -------------------------------------------

if (!fs.existsSync(LIVE)) {
  console.error(`FATAL: live skills directory not found: ${LIVE}`);
  process.exit(2);
}

const missing = TRACKED.filter((name) => !listFiles(path.join(LIVE, name)));
if (missing.length) {
  console.error(`FATAL: tracked skill(s) missing from ${LIVE}:`);
  for (const name of missing) console.error(`  - ${name}`);
  console.error('\nRefusing to mirror an absence. Either restore the skill from this repo');
  console.error('(copy _skills/<name> back into the live directory), or if the removal was');
  console.error('deliberate, drop it from TRACKED in this script first.');
  process.exit(2);
}

// --- compare -----------------------------------------------------------------------

const plan = [];

for (const name of TRACKED) {
  const liveDir = path.join(LIVE, name);
  const repoDir = path.join(REPO, name);
  const liveFiles = listFiles(liveDir);
  const repoFiles = listFiles(repoDir) || [];

  for (const rel of liveFiles) {
    const src = path.join(liveDir, ...rel.split('/'));
    const dst = path.join(repoDir, ...rel.split('/'));
    if (!repoFiles.includes(rel)) plan.push({ action: 'add', name, rel, src, dst });
    else if (!sameContent(src, dst)) plan.push({ action: 'update', name, rel, src, dst });
  }
  for (const rel of repoFiles) {
    if (!liveFiles.includes(rel)) {
      plan.push({ action: 'delete', name, rel, dst: path.join(repoDir, ...rel.split('/')) });
    }
  }
}

// --- report / apply ----------------------------------------------------------------

const trackedFileCount = TRACKED.reduce((n, name) => n + listFiles(path.join(LIVE, name)).length, 0);

if (!plan.length) {
  console.log(`In sync — ${TRACKED.length} skills, ${trackedFileCount} files, no drift.`);
  process.exit(0);
}

for (const item of plan) console.log(`  ${item.action.padEnd(6)} ${item.name}/${item.rel}`);

if (check) {
  console.log(`\nDRIFT: ${plan.length} file(s) differ. Run \`node sync-skills.js\` to refresh the backup.`);
  process.exit(1);
}

for (const item of plan) {
  if (item.action === 'delete') {
    fs.rmSync(item.dst);
    continue;
  }
  fs.mkdirSync(path.dirname(item.dst), { recursive: true });
  fs.copyFileSync(item.src, item.dst);
}

console.log(`\nSynced ${plan.length} file(s). Backup now matches ${LIVE}.`);
