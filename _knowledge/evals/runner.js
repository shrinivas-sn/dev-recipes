#!/usr/bin/env node
/**
 * runner.js — execute and grade skill evals.
 *
 *   node runner.js --dry-run                    validate every scenario, spend nothing
 *   node runner.js                              run all scenarios
 *   node runner.js --scenario 02-tailwind-v3-id-trap
 *   node runner.js --skill context-brief
 *   node runner.js --no-judge                   mechanical assertions only
 *
 * An eval is a task plus a checklist. Each scenario's `expected_behavior` is the checklist;
 * each item is graded by EXACTLY ONE of:
 *
 *   - an assertion  — mechanical, a regex over the transcript / answer / tool names
 *   - the judge     — a second `claude -p` call, for items no regex can honestly settle
 *
 * The report always states which graded what. A judge can pass a run that mechanically
 * failed, and that is the failure mode a gate can least afford, so reliance on the judge is
 * made visible rather than left silent.
 *
 * Runs cost real tokens: each scenario is a live `claude -p` making real Context7/web calls.
 * This is a gate to run when a skill is edited, not continuously. `--dry-run` validates the
 * scenario files and fixtures without spawning anything.
 *
 * Dependency-free on purpose, following _knowledge/scripts/verify-sources.js: a script
 * nobody can run because of a missing npm install is a gate that rots.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const EVALS = __dirname;
const REPO = path.resolve(EVALS, '..', '..');
const SCENARIOS = path.join(EVALS, 'scenarios');
const RESULTS = path.join(EVALS, 'results');

const ASSERTION_TYPES = new Set([
  'skill_fired',
  'transcript_matches',
  'transcript_not_matches',
  'answer_matches',
  'answer_not_matches',
  // Scoped to fenced code blocks in the answer. Needed because "must not mention X" is the
  // wrong test: an answer that names v4 syntax in order to warn against it is correct, and a
  // bare answer_not_matches marks it wrong. What matters is what the answer PRESCRIBES, and
  // the code block is where prescription actually lives.
  'answer_code_matches',
  'answer_code_not_matches',
  'tool_used',
  'tool_not_used',
  // Scoped to the arguments the agent SENT to a tool. Reading a registry file puts every id it
  // lists into the transcript, so transcript-scoped checks cannot tell which one was queried.
  'tool_arg_matches',
  'tool_arg_not_matches',
]);

/**
 * Tools denied to the skill under test. Write/Edit matter most: step 5 of context-brief
 * writes a cache brief, and an eval run must not mutate the repo it is grading against.
 * Bash is denied for the same reason (step 7 shells curl) — neither is needed by any
 * behaviour these scenarios grade, so denying them costs nothing and keeps runs inert.
 *
 * Verified working 2026-08-16: a denied Write comes back as
 * `<tool_use_error>Error: No such tool available: Write.` The agent still ATTEMPTS the call,
 * so a blocked attempt appears in the transcript as a tool_use — see deniedSucceeded below
 * for why attempts must not be counted as violations.
 */
const DENIED_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash'];

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    dryRun: false, judge: true, keep: false, autoTrigger: false,
    scenario: null, skill: null, model: null, timeoutMs: 300000, regrade: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--no-judge') opts.judge = false;
    else if (arg === '--keep') opts.keep = true;
    else if (arg === '--auto-trigger') opts.autoTrigger = true;
    else if (arg === '--scenario') opts.scenario = argv[++i];
    else if (arg === '--skill') opts.skill = argv[++i];
    else if (arg === '--model') opts.model = argv[++i];
    else if (arg === '--timeout') opts.timeoutMs = Number(argv[++i]) * 1000;
    else if (arg === '--regrade') opts.regrade = argv[++i];
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));

// ---------------------------------------------------------------------------
// load + validate
// ---------------------------------------------------------------------------

function loadScenarios() {
  if (!fs.existsSync(SCENARIOS)) fail(`No scenarios directory at ${SCENARIOS}`);
  const found = [];
  for (const skillDir of fs.readdirSync(SCENARIOS)) {
    if (opts.skill && skillDir !== opts.skill) continue;
    const dir = path.join(SCENARIOS, skillDir);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
      const full = path.join(dir, file);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(full, 'utf8'));
      } catch (err) {
        fail(`${path.relative(EVALS, full)}: invalid JSON — ${err.message}`);
      }
      data.name = data.name || path.basename(file, '.json');
      if (opts.scenario && data.name !== opts.scenario) continue;
      found.push({ ...data, _file: full, _skillDir: skillDir });
    }
  }
  return found;
}

/** Returns a list of problems. Empty means the scenario is runnable. */
function validate(scenario) {
  const problems = [];
  const where = path.relative(EVALS, scenario._file).replace(/\\/g, '/');
  const say = (msg) => problems.push(`${where}: ${msg}`);

  for (const key of ['skills', 'query', 'expected_behavior']) {
    if (!scenario[key]) say(`missing required key \`${key}\``);
  }
  if (!Array.isArray(scenario.expected_behavior) || !scenario.expected_behavior.length) {
    say('`expected_behavior` must be a non-empty array — it is the checklist');
  }
  if (!Array.isArray(scenario.skills) || !scenario.skills.length) {
    say('`skills` must name at least one skill');
  }

  for (const rel of scenario.files || []) {
    const abs = path.join(EVALS, rel);
    if (!fs.existsSync(abs)) say(`fixture not found: ${rel}`);
    if (!rel.startsWith('fixtures/')) {
      say(`fixture path must start with \`fixtures/\`: ${rel}`);
    }
  }

  const rubricCount = (scenario.expected_behavior || []).length;
  for (const [i, assertion] of (scenario.assertions || []).entries()) {
    const at = `assertions[${i}]`;
    if (!ASSERTION_TYPES.has(assertion.type)) {
      say(`${at}: unknown type \`${assertion.type}\` (known: ${[...ASSERTION_TYPES].join(', ')})`);
      continue;
    }
    if (!Number.isInteger(assertion.covers) || assertion.covers < 0 || assertion.covers >= rubricCount) {
      say(`${at}: \`covers\` must be an index into expected_behavior (0..${rubricCount - 1}), got ${assertion.covers}`);
    }
    if (assertion.type === 'skill_fired') {
      if (!assertion.skill) say(`${at}: skill_fired needs a \`skill\``);
    } else {
      if (!assertion.pattern) say(`${at}: ${assertion.type} needs a \`pattern\``);
      else {
        try {
          new RegExp(assertion.pattern, 'i');
        } catch (err) {
          say(`${at}: invalid regex — ${err.message}`);
        }
      }
      if (assertion.type.startsWith('tool_arg_')) {
        if (!assertion.tool) say(`${at}: ${assertion.type} needs a \`tool\` pattern naming which tool's args to inspect`);
        else {
          try {
            new RegExp(assertion.tool, 'i');
          } catch (err) {
            say(`${at}: invalid \`tool\` regex — ${err.message}`);
          }
        }
      }
    }
  }
  return problems;
}

function fail(msg) {
  console.error(`FATAL: ${msg}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// run one scenario
// ---------------------------------------------------------------------------

function makeWorkspace(scenario) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `eval-${scenario.name}-`));
  for (const rel of scenario.files || []) {
    // `fixtures/<fixture-name>/<rest>` lands at `<workspace>/<rest>`, so the agent sees a
    // project rooted at the workspace rather than a nested fixtures/ path that would leak
    // the fact that it is being tested.
    const rest = rel.split('/').slice(2).join('/');
    const dst = path.join(dir, ...rest.split('/'));
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(EVALS, rel), dst);
  }
  return dir;
}

/** Fold the stream-json event log into the shapes the assertions grade against. */
function parseStream(stdout) {
  const parts = [];
  const toolCalls = [];
  const byId = new Map();
  let answer = '';
  let meta = {};

  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue; // non-JSON noise on stdout is not fatal; the result event is what matters
    }

    if (event.type === 'assistant' && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === 'text') parts.push(block.text);
        if (block.type === 'tool_use') {
          const call = { name: block.name, input: block.input, id: block.id, errored: null };
          toolCalls.push(call);
          if (block.id) byId.set(block.id, call);
          parts.push(`[tool_use ${block.name}] ${safeStringify(block.input)}`);
        }
      }
    } else if (event.type === 'user' && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type !== 'tool_result') continue;
        const body = safeStringify(block.content);
        const call = byId.get(block.tool_use_id);
        if (call) call.errored = Boolean(block.is_error) || /<tool_use_error>/.test(body);
        parts.push(`[tool_result] ${body}`);
      }
    } else if (event.type === 'result') {
      answer = typeof event.result === 'string' ? event.result : '';
      meta = {
        is_error: event.is_error,
        num_turns: event.num_turns,
        duration_ms: event.duration_ms,
        total_cost_usd: event.total_cost_usd,
        subtype: event.subtype,
      };
    }
  }

  // A denied tool still shows up as a tool_use — the agent tries, the harness refuses. Only
  // a call that came back WITHOUT an error means the deny list failed to hold.
  const deniedSucceeded = toolCalls
    .filter((c) => DENIED_TOOLS.includes(c.name) && c.errored === false)
    .map((c) => c.name);

  return { transcript: parts.join('\n'), answer, toolCalls, meta, deniedSucceeded };
}

/** Serialized inputs of every tool call whose name matches `toolPattern`. */
function toolArgs(run, toolPattern) {
  const rx = new RegExp(toolPattern, 'i');
  return run.toolCalls.filter((c) => rx.test(c.name)).map((c) => safeStringify(c.input));
}

/** Fenced code blocks in the answer, concatenated. Prescription lives here, prose doesn't. */
function codeBlocks(answer) {
  const blocks = [];
  const rx = /```[^\n]*\n([\s\S]*?)```/g;
  let match;
  while ((match = rx.exec(answer)) !== null) blocks.push(match[1]);
  return blocks.join('\n');
}

function safeStringify(value) {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * By default the skill is invoked explicitly (`/context-brief <query>`), because the job of
 * these evals is "did editing this skill break its behaviour?" — which requires the skill to
 * actually load. Relying on auto-trigger makes every rubric item fail for one reason when it
 * doesn't fire, telling you nothing about the content.
 *
 * Auto-triggering is a real and separate concern, so `--auto-trigger` sends the bare query
 * instead and lets the skill_fired item grade whether the description pulled it in. Measured
 * 2026-08-16: scenario 02's bare query did NOT auto-trigger context-brief.
 */
function buildPrompt(scenario) {
  return opts.autoTrigger ? scenario.query : `/${scenario.skills[0]} ${scenario.query}`;
}

/**
 * Rehydrates a previous run from its saved report so the current rubric can be applied to it.
 * Reports written before toolCalls were persisted only carry tool names, so tool_arg_*
 * assertions would silently see no args — refuse rather than grade against a blank.
 */
function loadSavedRun(scenario) {
  const file = path.join(path.isAbsolute(opts.regrade) ? opts.regrade : path.join(RESULTS, opts.regrade), `${scenario.name}.json`);
  if (!fs.existsSync(file)) fail(`--regrade: no saved report for ${scenario.name} at ${file}`);
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(saved.toolCalls)) {
    fail(`--regrade: ${file} predates toolCalls being saved; re-run this scenario instead of regrading it`);
  }
  return {
    transcript: saved.transcript || '', answer: saved.answer || '', toolCalls: saved.toolCalls,
    meta: saved.meta, deniedSucceeded: saved.violations || [], wallMs: saved.wallMs,
    timedOut: saved.timedOut, stderr: saved.stderr, workspace: null,
  };
}

function runClaude(scenario, workspace) {
  const args = [
    '-p',
    '--output-format', 'stream-json',
    '--verbose',
    '--permission-mode', 'bypassPermissions',
    // The skill reads sources.yaml and cache/ from the repo, which is outside the workspace.
    '--add-dir', REPO,
  ];
  if (opts.model) args.push('--model', opts.model);
  // Variadic — must stay last, or it swallows every flag that follows it.
  args.push('--disallowedTools', ...DENIED_TOOLS);

  const started = Date.now();
  const proc = spawnSync('claude', args, {
    cwd: workspace,
    input: buildPrompt(scenario),
    encoding: 'utf8',
    shell: true,
    timeout: opts.timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
  });

  return {
    ...parseStream(proc.stdout || ''),
    wallMs: Date.now() - started,
    timedOut: proc.error?.code === 'ETIMEDOUT' || proc.signal === 'SIGTERM',
    stderr: (proc.stderr || '').slice(-4000),
    status: proc.status,
    workspace,
  };
}

// ---------------------------------------------------------------------------
// grade
// ---------------------------------------------------------------------------

function checkAssertion(assertion, run) {
  const rx = assertion.pattern ? new RegExp(assertion.pattern, 'i') : null;
  switch (assertion.type) {
    case 'skill_fired': {
      // Only meaningful under --auto-trigger. The default forced invocation passes
      // `/<skill> <query>` as the prompt, which the CLI expands inline — the skill runs, but no
      // Skill tool_use ever appears in the stream. Grading it there would fail every run for a
      // reason that says nothing about the skill's content.
      if (!opts.autoTrigger) {
        return { pass: null, detail: `not graded: runner forced invocation via /${assertion.skill}; re-run with --auto-trigger to grade triggering` };
      }
      const hit = run.toolCalls.some(
        (call) => call.name === 'Skill' && safeStringify(call.input).includes(assertion.skill)
      );
      return { pass: hit, detail: hit ? `Skill tool invoked with ${assertion.skill}` : `no Skill tool call naming ${assertion.skill}` };
    }
    // Scoped to what the agent SENT to a tool, not to everything it read. A registry file that
    // lists both the right and wrong Context7 id lands in the transcript the moment the agent
    // reads it, so transcript_not_matches cannot test which id was actually queried.
    case 'tool_arg_matches':
      return { pass: toolArgs(run, assertion.tool).some((a) => rx.test(a)), detail: `/${assertion.pattern}/ in args sent to /${assertion.tool}/` };
    case 'tool_arg_not_matches':
      return { pass: !toolArgs(run, assertion.tool).some((a) => rx.test(a)), detail: `/${assertion.pattern}/ absent from args sent to /${assertion.tool}/` };
    case 'transcript_matches':
      return { pass: rx.test(run.transcript), detail: `/${assertion.pattern}/ in transcript` };
    case 'transcript_not_matches':
      return { pass: !rx.test(run.transcript), detail: `/${assertion.pattern}/ absent from transcript` };
    case 'answer_matches':
      return { pass: rx.test(run.answer), detail: `/${assertion.pattern}/ in final answer` };
    case 'answer_not_matches':
      return { pass: !rx.test(run.answer), detail: `/${assertion.pattern}/ absent from final answer` };
    case 'answer_code_matches':
      return { pass: rx.test(codeBlocks(run.answer)), detail: `/${assertion.pattern}/ in the answer's code blocks` };
    case 'answer_code_not_matches':
      return { pass: !rx.test(codeBlocks(run.answer)), detail: `/${assertion.pattern}/ absent from the answer's code blocks` };
    case 'tool_used':
      return { pass: run.toolCalls.some((c) => rx.test(c.name)), detail: `a tool matching /${assertion.pattern}/ was used` };
    case 'tool_not_used':
      return { pass: !run.toolCalls.some((c) => rx.test(c.name)), detail: `no tool matching /${assertion.pattern}/ was used` };
    default:
      return { pass: false, detail: `unknown assertion type ${assertion.type}` };
  }
}

const JUDGE_PROMPT = `You are grading one checklist item from a skill evaluation.

Answer ONLY with a JSON object on a single line:
{"verdict":"PASS"|"FAIL","reason":"<one sentence>"}

Grade strictly against the checklist item as written. Do not reward an answer for being
generally good, and do not penalise it for style. If the transcript does not contain enough
evidence that the item was satisfied, the verdict is FAIL.`;

function runJudge(item, run) {
  const excerpt = run.transcript.length > 24000
    ? `${run.transcript.slice(0, 8000)}\n\n[... transcript truncated ...]\n\n${run.transcript.slice(-16000)}`
    : run.transcript;

  const prompt = [
    JUDGE_PROMPT,
    '',
    `CHECKLIST ITEM: ${item}`,
    '',
    '--- FINAL ANSWER ---',
    run.answer || '(empty)',
    '',
    '--- TRANSCRIPT ---',
    excerpt,
  ].join('\n');

  const proc = spawnSync('claude', [
    '-p', '--output-format', 'json',
    '--disallowedTools', ...DENIED_TOOLS, 'Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'Task',
  ], { input: prompt, encoding: 'utf8', shell: true, timeout: 180000, maxBuffer: 32 * 1024 * 1024 });

  let text = '';
  try {
    text = JSON.parse(proc.stdout || '{}').result || '';
  } catch {
    text = proc.stdout || '';
  }
  const match = text.match(/\{[\s\S]*?"verdict"[\s\S]*?\}/);
  if (!match) {
    return { pass: false, detail: 'judge returned no parsable verdict', unresolved: true };
  }
  try {
    const parsed = JSON.parse(match[0]);
    return { pass: parsed.verdict === 'PASS', detail: parsed.reason || '(no reason given)' };
  } catch {
    return { pass: false, detail: 'judge verdict was not valid JSON', unresolved: true };
  }
}

function grade(scenario, run) {
  const items = scenario.expected_behavior.map((text, index) => ({
    index, text, gradedBy: null, pass: null, checks: [],
  }));

  for (const assertion of scenario.assertions || []) {
    const item = items[assertion.covers];
    const result = checkAssertion(assertion, run);
    item.gradedBy = 'assertion';
    item.checks.push({ type: assertion.type, ...result });
  }

  for (const item of items) {
    if (item.gradedBy === 'assertion') {
      // A check may return pass:null to mean "this cannot be decided in this run mode"
      // (skill_fired under forced invocation). Those abstain rather than fail; an item whose
      // every check abstains is ungraded, not wrong.
      const decided = item.checks.filter((c) => c.pass !== null);
      item.gradedBy = decided.length ? 'assertion' : 'not-applicable';
      item.pass = decided.length ? decided.every((c) => c.pass) : null;
      continue;
    }
    if (!opts.judge) {
      item.gradedBy = 'ungraded';
      item.pass = null;
      continue;
    }
    const verdict = runJudge(item.text, run);
    item.gradedBy = 'judge';
    item.pass = verdict.pass;
    item.checks.push({ type: 'judge', ...verdict });
  }
  return items;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const scenarios = loadScenarios();
if (!scenarios.length) {
  fail(opts.scenario ? `No scenario named "${opts.scenario}"` : 'No scenarios found');
}

let invalid = 0;
for (const scenario of scenarios) {
  const problems = validate(scenario);
  if (problems.length) {
    invalid++;
    for (const problem of problems) console.error(`  INVALID  ${problem}`);
  }
}
if (invalid) {
  console.error(`\n${invalid} of ${scenarios.length} scenario(s) invalid.`);
  process.exit(2);
}

console.log(`${scenarios.length} scenario(s) valid.`);

if (opts.dryRun) {
  for (const scenario of scenarios) {
    const auto = (scenario.assertions || []).length;
    const covered = new Set((scenario.assertions || []).map((a) => a.covers)).size;
    const total = scenario.expected_behavior.length;
    console.log(
      `  ${scenario.name}\n` +
      `    ${total} checklist item(s): ${covered} by assertion (${auto} check(s)), ${total - covered} by judge\n` +
      `    ${(scenario.files || []).length} fixture file(s)`
    );
  }
  console.log('\nDry run — nothing was executed and nothing was spent.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(RESULTS, stamp);
fs.mkdirSync(outDir, { recursive: true });

const summary = [];

for (const scenario of scenarios) {
  process.stdout.write(`\n▶ ${scenario.name} … `);
  // --regrade replays a saved report through the current rubric. Rubrics get revised far more
  // often than model behaviour changes, and a re-run costs real money, so iterate offline.
  const run = opts.regrade ? loadSavedRun(scenario) : runClaude(scenario, makeWorkspace(scenario));

  // Safety net: DENIED_TOOLS should make this impossible. Counts only calls that actually
  // succeeded — a blocked attempt is the deny list working, not failing. If this ever fires,
  // the deny list is not being honoured and every result in this run is suspect.
  const violations = run.deniedSucceeded;

  const items = run.timedOut || !run.answer
    ? scenario.expected_behavior.map((text, index) => ({
        index, text, gradedBy: 'not-run', pass: false,
        checks: [{ type: 'harness', pass: false, detail: run.timedOut ? 'run timed out' : 'no final answer produced' }],
      }))
    : grade(scenario, run);

  const passed = items.filter((i) => i.pass === true).length;
  const graded = items.filter((i) => i.pass !== null).length;
  const ok = graded > 0 && passed === graded && !violations.length;
  console.log(ok ? `PASS (${passed}/${graded})` : `FAIL (${passed}/${graded})`);

  for (const item of items) {
    const mark = item.pass === true ? '✓' : item.pass === false ? '✗' : '−';
    console.log(`    ${mark} [${item.gradedBy}] ${item.text}`);
    for (const check of item.checks.filter((c) => c.pass !== true)) {
      console.log(`        ↳ ${check.type}: ${check.detail}`);
    }
  }
  if (violations.length) {
    console.log(`    !! HARNESS VIOLATION: denied tool(s) were used: ${[...new Set(violations)].join(', ')}`);
  }

  const record = {
    scenario: scenario.name, skill: scenario._skillDir, ok, passed, graded,
    violations, meta: run.meta, wallMs: run.wallMs, timedOut: run.timedOut,
    toolsUsed: [...new Set(run.toolCalls.map((c) => c.name))],
    // Full calls, not just names: tool_arg_* assertions grade what was SENT to a tool, and
    // keeping them here means a rubric can be revised and re-graded without paying for a re-run.
    toolCalls: run.toolCalls,
    items, query: scenario.query, answer: run.answer, transcript: run.transcript,
    stderr: run.stderr,
  };
  fs.writeFileSync(path.join(outDir, `${scenario.name}.json`), JSON.stringify(record, null, 2));
  summary.push(record);

  if (run.workspace) {
    if (opts.keep) console.log(`    workspace kept: ${run.workspace}`);
    else fs.rmSync(run.workspace, { recursive: true, force: true });
  }
}

const cost = summary.reduce((sum, r) => sum + (r.meta?.total_cost_usd || 0), 0);
const failures = summary.filter((r) => !r.ok);
const judged = summary.reduce((n, r) => n + r.items.filter((i) => i.gradedBy === 'judge').length, 0);
const asserted = summary.reduce((n, r) => n + r.items.filter((i) => i.gradedBy === 'assertion').length, 0);

console.log(`\n${'─'.repeat(60)}`);
console.log(`${summary.length - failures.length}/${summary.length} scenario(s) passed`);
console.log(`checklist items graded: ${asserted} by assertion, ${judged} by judge`);
if (cost) {
  // In regrade mode this is the original run's cost, carried through the saved report — not
  // money spent now. Say so, or the number reads as a charge for a free replay.
  console.log(opts.regrade ? `cost: $${cost.toFixed(4)} (from the original run — regrading spent nothing beyond the judge)` : `cost: $${cost.toFixed(4)}`);
}
console.log(`report: ${path.relative(REPO, outDir).replace(/\\/g, '/')}`);

process.exit(failures.length ? 1 : 0);
