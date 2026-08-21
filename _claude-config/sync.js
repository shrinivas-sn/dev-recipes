#!/usr/bin/env node
/**
 * sync.js — mirror the hand-written Claude Code config into this repo.
 *
 * The live config is what Claude Code loads, under ~/.claude. This repo holds a copy so a
 * disk failure or a bad `npx skills` run cannot lose it. A copy that goes quietly stale is
 * worse than no copy, so there are two modes:
 *
 *   node sync.js            copy live -> repo, print what changed
 *   node sync.js --check    report drift only, write nothing; exit 1 if drifted
 *
 * Safety rule, borrowed from _knowledge/scripts/verify-sources.js: it refuses to run on a
 * partial picture. If a tracked item is missing from the live directory, the script aborts
 * instead of mirroring the absence — otherwise deleting something by accident would also
 * delete its backup, which is precisely what the backup exists to prevent.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE = path.join(os.homedir(), '.claude');
const REPO = __dirname;

/**
 * `tracked: '*'` mirrors everything in the directory. An explicit list mirrors only those
 * entries, and is used where the live directory also holds things we deliberately skip.
 *
 * ~/.claude/skills holds both hand-written skills and installed ones. Only the 10 below are
 * hand-written. The rest are symlinks to ~/.agents/skills (the `npx skills@latest` pack) and
 * `impeccable`, a vendor install with its own installer — all reinstallable, so mirroring them
 * would duplicate recoverable content and bury the ones that actually matter.
 *
 * `design-pick` was absent from this list until 2026-08-20 and had no backup at all. The
 * refuse-on-missing guard below could not catch that: it only checks names already in the
 * list, so a skill never registered is invisible to it. When you hand-write a new skill, add
 * it here in the same session — see _knowledge/SELF-MONITOR.md for the full entry.
 *
 * `mobile-check` added 2026-08-21, same session it was written.
 *
 * commands/ and agents/ hold no symlinks and nothing vendor-installed, so they mirror
 * wholesale. That has a sharp edge: with no name list there is nothing to refuse on, so a
 * deletion in the live directory propagates to the backup on the next sync. Read the --check
 * output before running a real sync.
 */
const GROUPS = [
  {
    dir: 'skills',
    tracked: [
      'animation-ref',
      'api-idea-scout',
      'context-brief',
      'design-pick',
      'design-source',
      'mobile-check',
      'no-ai-slop',
      'no-ai-slop-writing',
      'prd-intake',
      'production-readiness',
    ],
  },
  { dir: 'commands', tracked: '*' },
  { dir: 'agents', tracked: '*' },
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

function abort(lines) {
  for (const line of lines) console.error(line);
  process.exit(2);
}

// --- resolve what each group covers, refusing on a partial picture -------------------

const resolved = [];

for (const group of GROUPS) {
  const liveRoot = path.join(CLAUDE, group.dir);
  if (!fs.existsSync(liveRoot)) {
    abort([`FATAL: live directory not found: ${liveRoot}`]);
  }

  if (group.tracked === '*') {
    // Mirrored as a whole, so there is no name list whose absence could be checked. The
    // delete pass below still prints every removal, so a wipe is loud rather than silent.
    resolved.push({ ...group, liveRoot, repoRoot: path.join(REPO, group.dir), names: null });
    continue;
  }

  const missing = group.tracked.filter((name) => !listFiles(path.join(liveRoot, name)));
  if (missing.length) {
    abort([
      `FATAL: tracked ${group.dir} missing from ${liveRoot}:`,
      ...missing.map((name) => `  - ${name}`),
      '',
      'Refusing to mirror an absence. Either restore it from this repo',
      `(copy _claude-config/${group.dir}/<name> back into the live directory), or if the`,
      'removal was deliberate, drop it from GROUPS in this script first.',
    ]);
  }
  resolved.push({ ...group, liveRoot, repoRoot: path.join(REPO, group.dir), names: group.tracked });
}

// --- compare -------------------------------------------------------------------------

const plan = [];
let trackedFileCount = 0;

for (const group of resolved) {
  // A group is either a set of named subdirectories, or the whole directory at once.
  const units = group.names
    ? group.names.map((name) => ({
        label: `${group.dir}/${name}`,
        live: path.join(group.liveRoot, name),
        repo: path.join(group.repoRoot, name),
      }))
    : [{ label: group.dir, live: group.liveRoot, repo: group.repoRoot }];

  for (const unit of units) {
    const liveFiles = listFiles(unit.live) || [];
    const repoFiles = listFiles(unit.repo) || [];
    trackedFileCount += liveFiles.length;

    for (const rel of liveFiles) {
      const src = path.join(unit.live, ...rel.split('/'));
      const dst = path.join(unit.repo, ...rel.split('/'));
      if (!repoFiles.includes(rel)) plan.push({ action: 'add', label: unit.label, rel, src, dst });
      else if (!sameContent(src, dst)) plan.push({ action: 'update', label: unit.label, rel, src, dst });
    }
    for (const rel of repoFiles) {
      if (!liveFiles.includes(rel)) {
        plan.push({ action: 'delete', label: unit.label, rel, dst: path.join(unit.repo, ...rel.split('/')) });
      }
    }
  }
}

// --- report / apply ------------------------------------------------------------------

if (!plan.length) {
  console.log(`In sync — ${resolved.length} groups, ${trackedFileCount} files, no drift.`);
  process.exit(0);
}

for (const item of plan) console.log(`  ${item.action.padEnd(6)} ${item.label}/${item.rel}`);

if (check) {
  console.log(`\nDRIFT: ${plan.length} file(s) differ. Run \`node sync.js\` to refresh the backup.`);
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

console.log(`\nSynced ${plan.length} file(s). Backup now matches ${CLAUDE}.`);
