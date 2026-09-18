'use strict';
// State model: .jarvis/state/<ID>.json + <ID>.audit.jsonl (spec §7).
// Everything that touches state or config goes through this module.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const YAML = require('yaml');

const UNLOCKING = new Set(['approved', 'forced', 'skipped']);
const SETTABLE = new Set(['in_progress', 'passed', 'gate_failed', 'blocked']);
const ALL_STATUSES = ['pending', 'in_progress', 'gate_failed', 'passed', 'approved', 'forced', 'skipped', 'blocked', 'parked'];
const FLAGS = ['has_ui', 'has_api_change', 'has_db_change', 'has_mysql', 'has_mongo', 'changes_flow', 'design_change', 'touches_auth', 'touches_pii'];

function repoRoot(from) {
  let dir = from || process.env.JARVIS_ROOT || process.cwd();
  dir = path.resolve(dir);
  while (true) {
    if (fs.existsSync(path.join(dir, 'jarvis.config.yaml'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  // fall back to two levels above this file (.jarvis/scripts/lib -> repo root)
  return path.resolve(__dirname, '..', '..', '..');
}

let _cfg = null;
function loadConfig(root) {
  const r = root || repoRoot();
  if (_cfg && _cfg.__root === r) return _cfg;
  const raw = fs.readFileSync(path.join(r, 'jarvis.config.yaml'), 'utf8');
  _cfg = YAML.parse(raw);
  Object.defineProperty(_cfg, '__root', { value: r, enumerable: false });
  return _cfg;
}

const P = {
  state: (root) => path.join(root, '.jarvis', 'state'),
  stateFile: (root, id) => path.join(root, '.jarvis', 'state', `${id}.json`),
  auditFile: (root, id) => path.join(root, '.jarvis', 'state', `${id}.audit.jsonl`),
  workflows: (root) => path.join(root, '.jarvis', 'core', 'workflows'),
  templates: (root) => path.join(root, '.jarvis', 'core', 'templates'),
  checklists: (root) => path.join(root, '.jarvis', 'core', 'checklists'),
  standards: (root) => path.join(root, '.jarvis', 'standards'),
};

function docsRoot(root) {
  return path.join(root, loadConfig(root).project.paths.docs);
}

function workFolder(root, state) {
  return path.join(docsRoot(root), `${state.id}-${state.slug}`);
}

function relWorkFolder(root, state) {
  return path.relative(root, workFolder(root, state)).split(path.sep).join('/');
}

function slugify(title) {
  return String(title).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-').slice(0, 6).join('-') || 'item';
}

function gitUser(root) {
  try {
    return execFileSync('git', ['config', 'user.name'], { cwd: root, encoding: 'utf8' }).trim() || fallbackUser();
  } catch {
    return fallbackUser();
  }
}
function fallbackUser() {
  return process.env.USER || process.env.USERNAME || 'unknown';
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function listIds(root) {
  const dir = P.state(root);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
}

function readState(root, id) {
  const f = P.stateFile(root, id);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function writeState(root, state) {
  ensureDir(P.state(root));
  fs.writeFileSync(P.stateFile(root, state.id), JSON.stringify(state, null, 2) + '\n');
  return state;
}

function audit(root, id, entry) {
  ensureDir(P.state(root));
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFileSync(P.auditFile(root, id), line);
}

function readAudit(root, id) {
  const f = P.auditFile(root, id);
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

// Team-safe ID allocation: take the max existing number for the prefix, not the count.
function allocateId(root, prefix) {
  let max = 0;
  for (const id of listIds(root)) {
    const m = id.match(/^([A-Z]+)-(\d+)$/);
    if (m && m[1] === prefix) max = Math.max(max, parseInt(m[2], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

function prefixForType(root, type) {
  const f = path.join(P.workflows(root), `${type}.yaml`);
  if (!fs.existsSync(f)) return null;
  return YAML.parse(fs.readFileSync(f, 'utf8')).id_prefix;
}

function parseFlags(str) {
  const out = {};
  if (!str) return out;
  for (const part of String(str).split(/[,\s]+/).filter(Boolean)) {
    const [k, v] = part.split('=');
    if (!k) continue;
    out[k] = v === undefined ? true : /^(true|1|yes|y)$/i.test(v);
  }
  return out;
}

function newItem(root, { type, title, flags, actor }) {
  const prefix = prefixForType(root, type);
  if (!prefix) throw new Error(`unknown work type: ${type}`);
  const id = allocateId(root, prefix);
  const slug = slugify(title);
  const state = {
    id,
    type,
    title,
    slug,
    branch: `${type}/${id}-${slug}`,
    created_at: new Date().toISOString(),
    created_by: actor,
    flags: { ...flags },
    current_phase: 'intake',
    phases: {},
    tasks: {},
    warnings: [],
  };
  writeState(root, state);
  ensureDir(workFolder(root, state));
  audit(root, id, { actor, action: 'new', phase: 'intake', from: null, to: 'pending', detail: { type, title, flags: state.flags } });
  return state;
}

function phaseStatus(state, phase) {
  return (state.phases[phase] && state.phases[phase].status) || 'pending';
}

function isUnlocked(status, approvalRequired) {
  if (UNLOCKING.has(status)) return true;
  return status === 'passed' && !approvalRequired;
}

function setPhase(root, state, phase, status, extra, actor) {
  const from = phaseStatus(state, phase);
  const p = state.phases[phase] || (state.phases[phase] = { status: 'pending', attempts: 0 });
  p.status = status;
  p.at = new Date().toISOString();
  if (status === 'gate_failed') p.attempts = (p.attempts || 0) + 1;
  if (status === 'in_progress' && from === 'pending') p.attempts = p.attempts || 0;
  Object.assign(p, extra || {});
  state.current_phase = phase;
  writeState(root, state);
  audit(root, state.id, { actor: actor || 'claude', action: 'set', phase, from, to: status, detail: extra || null });
  return p;
}

// Reset a phase and every phase after it in the workflow order.
function reopenFrom(root, state, phase, phaseOrder, actor, reason) {
  const i = phaseOrder.indexOf(phase);
  if (i < 0) throw new Error(`unknown phase: ${phase}`);
  const reset = [];
  for (const p of phaseOrder.slice(i)) {
    if (state.phases[p]) {
      const from = state.phases[p].status;
      delete state.phases[p];
      reset.push(p);
      audit(root, state.id, { actor, action: 'reopen', phase: p, from, to: 'pending', detail: { reason: reason || null } });
    }
  }
  state.current_phase = phase;
  writeState(root, state);
  return reset;
}

function addWarning(root, state, text) {
  if (!state.warnings.includes(text)) state.warnings.push(text);
  writeState(root, state);
}

function forcedGates(state) {
  return Object.entries(state.phases)
    .filter(([, p]) => p.status === 'forced')
    .map(([id, p]) => ({
      phase: id,
      forced_by: p.forced_by,
      forced_at: p.forced_at,
      reason: p.reason,
      unresolved: p.unresolved || [],
      follow_up: p.follow_up || null,
    }));
}

module.exports = {
  ALL_STATUSES, SETTABLE, UNLOCKING, FLAGS, P,
  repoRoot, loadConfig, docsRoot, workFolder, relWorkFolder, slugify, gitUser, ensureDir,
  listIds, readState, writeState, audit, readAudit, allocateId, prefixForType, parseFlags,
  newItem, phaseStatus, isUnlocked, setPhase, reopenFrom, addWarning, forcedGates,
};
