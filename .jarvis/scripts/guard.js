#!/usr/bin/env node
'use strict';
// PreToolUse / PostToolUse hook (spec §16.3, §17).
//
// Contract (verified against the current Claude Code hooks reference):
//   stdin  : JSON with tool_name, tool_input.file_path, tool_input.command, cwd, hook_event_name
//   exit 0 : allow
//   exit 2 : PreToolUse -> blocks the call; stderr is shown to Claude so it can correct itself.
//            PostToolUse -> the tool already ran; stderr is shown to Claude as a warning.
// Every message must tell Claude what to do INSTEAD, not only what is forbidden.
//
// Guard failures fail open (exit 0): a bug here must never brick a session.

const fs = require('fs');
const path = require('path');

const HUMAN_ONLY = ['approve', 'force', 'skip', 'reopen', 'park', 'unpark'];
const FRAMEWORK_WRITE = ['.jarvis/state/', '.jarvis/core/', '.jarvis/scripts/', '.claude/'];
const SECRET_FILES = [
  /(^|\/)\.env(\.|$)/, /(^|\/)\.env$/, /\.pem$/, /\.key$/, /(^|\/)id_rsa/, /(^|\/)id_ed25519/,
  /(^|\/)credentials(\.json|\.yaml|\.yml)?$/, /(^|\/)secrets?\.(json|ya?ml|env)$/, /\.p12$/, /\.pfx$/,
];
const TEST_FILE = [/_test\.go$/, /\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /(^|\/)__tests__\//, /(^|\/)e2e\//, /(^|\/)tests?\//];
const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function block(msg) {
  process.stderr.write(msg.trim() + '\n');
  process.exit(2);
}

function allow() {
  process.exit(0);
}

function repoRoot(cwd) {
  let dir = path.resolve(cwd || process.cwd());
  while (true) {
    if (fs.existsSync(path.join(dir, 'jarvis.config.yaml'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

function rel(root, file) {
  if (!file) return null;
  const abs = path.isAbsolute(file) ? file : path.resolve(root, file);
  const r = path.relative(root, abs);
  return r.startsWith('..') ? null : r.split(path.sep).join('/');
}

function loadConfig(root) {
  try {
    const YAML = require('yaml');
    return YAML.parse(fs.readFileSync(path.join(root, 'jarvis.config.yaml'), 'utf8'));
  } catch {
    return null;
  }
}

function activeItems(root) {
  const dir = path.join(root, '.jarvis', 'state');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; } })
    .filter((s) => s && !s.parked);
}

function itemsInPhase(items, phase) {
  return items.filter((s) => s.phases && s.phases[phase] && s.phases[phase].status === 'in_progress');
}

function isTestFile(f) {
  return TEST_FILE.some((re) => re.test(f));
}

function isSecret(f) {
  return SECRET_FILES.some((re) => re.test(f)) && !/\.env\.(example|sample|template)$/.test(f);
}

// ---------------------------------------------------------------- rules

function pre(input) {
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  const root = repoRoot(input.cwd);
  if (!root) allow();
  const file = rel(root, ti.file_path || ti.notebook_path);
  const cmd = String(ti.command || '');

  // G5 — secrets are never read or written, by any tool.
  if (file && isSecret(file)) {
    block(`G5 BLOCKED: ${file} is a secret file. Jarvis never reads or writes secrets.
Instead: read the variable NAMES from .env.example or the config schema, and describe the value the user must set.`);
  }
  if (cmd && /(^|[\s;|&(])(cat|less|more|head|tail|bat|strings|xxd|od|grep|rg|awk|sed|cp|mv|source|\.)\s+[^;|&]*(\.env\b|\.pem\b|id_rsa|credentials\.json)/.test(cmd)
      && !/\.env\.(example|sample|template)/.test(cmd)) {
    block(`G5 BLOCKED: this command reads or copies a secret file.
Instead: use .env.example, or ask the user to confirm the value without printing it.`);
  }

  // G2 — human-only CLI commands.
  if (tool === 'Bash' && cmd) {
    const m = cmd.match(new RegExp(`jarvis(?:\\.js)?(?:\\s+--\\S+)*\\s+--\\s+(${HUMAN_ONLY.join('|')})\\b|jarvis\\.js\\s+(${HUMAN_ONLY.join('|')})\\b|jarvis\\s+--\\s+(${HUMAN_ONLY.join('|')})\\b`));
    if (m) {
      const sub = m[1] || m[2] || m[3];
      block(`G2 BLOCKED: "${sub}" is a human-only command (spec §8.2).
Instead: print the command and ask the user to run it, for example:
  ! npm run -s jarvis -- ${sub} <ID> <phase>${sub === 'force' || sub === 'skip' || sub === 'park' ? ' --reason "<why>"' : ''}`);
    }
  }

  if (!WRITE_TOOLS.has(tool)) allow();
  if (!file) allow();

  // G1 — framework-owned files.
  if (FRAMEWORK_WRITE.some((p) => file.startsWith(p))) {
    if (process.env.JARVIS_DEV === '1') allow();
    const how = file.startsWith('.jarvis/state/')
      ? 'State is owned by the CLI. Use: node .jarvis/scripts/jarvis.js set|task|flags ...'
      : 'These are framework-owned files. To change the framework, start Claude Code with JARVIS_DEV=1, or open a PR against the jarvis-framework repo.';
    block(`G1 BLOCKED: ${file} is framework-owned and must not be edited during normal work.
Instead: ${how}`);
  }

  const cfg = loadConfig(root);
  const items = activeItems(root);

  // G4 — migrations need a declared DB change.
  const paths = (cfg && cfg.project && cfg.project.paths) || {};
  const migDirs = [paths.migrations_mysql, paths.migrations_mongo].filter(Boolean);
  if (migDirs.some((d) => file.startsWith(d.replace(/\/$/, '') + '/'))) {
    const ok = items.some((s) => s.flags && s.flags.has_db_change === true);
    if (!ok) {
      block(`G4 BLOCKED: ${file} is a migration, but no active work item has has_db_change=true.
Instead: set the flag on the item that owns this change:
  node .jarvis/scripts/jarvis.js flags <ID> has_db_change=true
If this is not a DB change, the file does not belong in a migration folder.`);
    }
  }

  // G3 — source guard.
  if (cfg && cfg.gates && cfg.gates.source_guard) {
    const src = ['apps/', 'packages/'];
    if (src.some((p) => file.startsWith(p))) {
      const implementing = itemsInPhase(items, 'implement');
      if (implementing.length) allow();
      const testing = itemsInPhase(items, 'test');
      if (testing.length && isTestFile(file)) allow();
      const active = items.map((s) => `${s.id}:${s.current_phase}`).join(', ') || 'none';
      block(`G3 BLOCKED: ${file} is source code, and no work item is in the implement phase${testing.length ? ' (a test-phase item may only touch test files)' : ''}.
Active items: ${active}
Instead: run the phase that owns this change:
  node .jarvis/scripts/jarvis.js next <ID>
  node .jarvis/scripts/jarvis.js set <ID> implement in_progress
Source edits happen inside implement (any file) or test (test files only).`);
    }
  }

  allow();
}

// ---------------------------------------------------------------- post

function post(input) {
  const ti = input.tool_input || {};
  const root = repoRoot(input.cwd);
  if (!root) allow();
  const file = rel(root, ti.file_path);
  if (!file || !fs.existsSync(path.join(root, file))) allow();

  const notes = [];
  format(root, file, notes);

  let findings = [];
  try {
    const lint = require('./lib/lint');
    findings = lint.run(root, { pathGlob: file }).findings;
  } catch {
    findings = [];
  }
  const blocking = findings.filter((f) => ['critical', 'major'].includes(f.severity));
  if (!blocking.length) {
    if (notes.length) process.stderr.write(notes.join('\n') + '\n');
    allow();
  }

  block([
    `POST: ${file} violates ${blocking.length} standards rule(s). Fix them now, before moving on.`,
    ...blocking.map((f) => `  [${f.rule}][${f.severity}] line ${f.line}: ${f.desc}\n    ${f.text}`),
    '',
    'Each rule is defined in .jarvis/standards/ — read the rule, then fix the code.',
    'If the violation is genuinely necessary, it needs an accepted ADR and an inline',
    '`jarvis-ignore <RULE-ID> <ADR-ID>` comment; ADRs are written in the architecture phase.',
    ...notes,
  ].join('\n'));
}

function format(root, file, notes) {
  const { execFileSync } = require('child_process');
  const abs = path.join(root, file);
  const tryRun = (bin, args) => {
    try { execFileSync(bin, args, { cwd: root, stdio: 'ignore', timeout: 20000 }); return true; }
    catch { return false; }
  };
  if (file.endsWith('.go')) {
    if (tryRun('gofmt', ['-w', abs])) notes.push(`formatted with gofmt: ${file}`);
  } else if (/\.(ts|tsx|js|jsx|json|css|md|ya?ml)$/.test(file)) {
    if (tryRun('npx', ['--no-install', 'prettier', '--write', abs])) notes.push(`formatted with prettier: ${file}`);
  }
}

// ---------------------------------------------------------------- entry

function main() {
  const mode = process.argv[2] || 'pre';
  let input;
  try {
    input = readStdin();
    if (mode === 'post') post(input);
    else pre(input);
  } catch (e) {
    // Fail open: a guard bug must not block the session.
    process.stderr.write(`jarvis guard: internal error, allowing (${e.message})\n`);
    process.exit(0);
  }
}

if (require.main === module) main();
module.exports = { isSecret, isTestFile, rel, repoRoot };
