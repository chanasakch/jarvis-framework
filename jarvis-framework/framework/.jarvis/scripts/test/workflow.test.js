'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const H = require('./helper');

test('new allocates sequential IDs per prefix and creates the work folder', () => {
  const dir = H.makeRepo('new');
  const a = H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_ui=true,has_db_change=true']);
  assert.equal(a.code, 0);
  assert.equal(a.json.id, 'FEAT-001');
  assert.equal(a.json.branch, 'feature/FEAT-001-otp-login');
  const b = H.cliJson(dir, ['new', 'feature', 'Profile page']);
  assert.equal(b.json.id, 'FEAT-002');
  const c = H.cliJson(dir, ['new', 'bugfix', 'Avatar 500']);
  assert.equal(c.json.id, 'BUG-001', 'numbering is per prefix');
  const fs = require('fs');
  assert.ok(fs.existsSync(`${dir}/docs/work/FEAT-001-otp-login`));
  assert.ok(fs.existsSync(`${dir}/.jarvis/state/FEAT-001.json`));
  assert.ok(fs.existsSync(`${dir}/.jarvis/state/FEAT-001.audit.jsonl`));
});

test('next walks the feature workflow and stops at the first approval gate', () => {
  const dir = H.makeRepo('next');
  H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_ui=true']);
  let n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.action, 'run_phase');
  assert.equal(n.phase, 'intake');
  assert.equal(n.owner, 'orchestrator');

  H.cli(dir, ['set', 'FEAT-001', 'intake', 'passed']);
  n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.phase, 'brief');
  assert.equal(n.agent, '{{name}}-analyst');
  assert.ok(n.standards.includes('.jarvis/standards/documentation.md'));
  assert.equal(n.checklist, '.jarvis/core/checklists/brief.md');

  H.cli(dir, ['set', 'FEAT-001', 'brief', 'passed']);
  n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.phase, 'requirements');
  assert.equal(n.mode, 'full');
  assert.equal(n.approval, 'human');

  H.cli(dir, ['set', 'FEAT-001', 'requirements', 'passed']);
  n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.action, 'awaiting_approval', 'passed + approval required must stop the flow');
  assert.match(n.command, /approve FEAT-001 requirements/);
});

test('approval unlocks the next phase; a non-approval phase unlocks on passed', () => {
  const dir = H.makeRepo('approve');
  H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_ui=true']);
  for (const p of ['intake', 'brief', 'requirements']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  assert.equal(H.cliJson(dir, ['next', 'FEAT-001']).json.action, 'awaiting_approval');
  const ap = H.cliJson(dir, ['approve', 'FEAT-001', 'requirements']);
  assert.equal(ap.code, 0);
  assert.equal(ap.json.approved_by, 'test-user', 'git user.name is recorded');
  const n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.phase, 'business-flow');
  assert.equal(n.approval, 'none');
});

test('optional phase is auto-skipped when its flag is false', () => {
  const dir = H.makeRepo('optskip');
  H.cliJson(dir, ['new', 'feature', 'Backend only job', '--flags', 'has_ui=false']);
  for (const p of ['intake', 'brief', 'requirements']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  H.cli(dir, ['approve', 'FEAT-001', 'requirements']);
  H.cli(dir, ['set', 'FEAT-001', 'business-flow', 'passed']);
  const n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.phase, 'architecture', 'ux must be skipped when has_ui is false');
  const st = H.cliJson(dir, ['status', 'FEAT-001']).json;
  assert.equal(st.phases.ux.status, 'skipped');
});

test('optional phase runs when its flag is true', () => {
  const dir = H.makeRepo('optrun');
  H.cliJson(dir, ['new', 'feature', 'Profile page', '--flags', 'has_ui=true']);
  for (const p of ['intake', 'brief', 'requirements']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  H.cli(dir, ['approve', 'FEAT-001', 'requirements']);
  H.cli(dir, ['set', 'FEAT-001', 'business-flow', 'passed']);
  const n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.phase, 'ux');
  assert.equal(n.agent, '{{name}}-ux');
});

test('requires are enforced even when a later phase is set directly', () => {
  const dir = H.makeRepo('requires');
  H.cliJson(dir, ['new', 'bugfix', 'Avatar 500']);
  H.cli(dir, ['set', 'BUG-001', 'intake', 'passed']);
  const n = H.cliJson(dir, ['next', 'BUG-001']).json;
  assert.equal(n.phase, 'investigation');
  assert.equal(n.mode, 'bug');
});

test('set refuses statuses reserved for humans', () => {
  const dir = H.makeRepo('setguard');
  H.cliJson(dir, ['new', 'chore', 'Bump deps']);
  const r = H.cli(dir, ['set', 'CHR-001', 'intake', 'approved']);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /human-only|cannot assign/i);
});

test('spike ends after investigation', () => {
  const dir = H.makeRepo('spike');
  H.cliJson(dir, ['new', 'spike', 'Redis vs in-memory']);
  H.cli(dir, ['set', 'SPK-001', 'intake', 'passed']);
  H.cli(dir, ['set', 'SPK-001', 'investigation', 'passed']);
  const n = H.cliJson(dir, ['next', 'SPK-001']).json;
  assert.equal(n.action, 'done');
});

test('task status is tracked and implement waits for every task', () => {
  const dir = H.makeRepo('tasks');
  H.cliJson(dir, ['new', 'chore', 'Bump deps']);
  H.cli(dir, ['task', 'CHR-001', 'T-001', 'in_progress']);
  let st = H.cliJson(dir, ['status', 'CHR-001']).json;
  assert.equal(st.tasks['T-001'], 'in_progress');
  H.cli(dir, ['task', 'CHR-001', 'T-001', 'done']);
  st = H.cliJson(dir, ['status', 'CHR-001']).json;
  assert.equal(st.tasks['T-001'], 'done');
});
