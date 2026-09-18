'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const H = require('./helper');

function seedFailedReview(dir, issues) {
  H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_ui=false']);
  for (const p of ['intake', 'brief', 'requirements']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  H.cli(dir, ['approve', 'FEAT-001', 'requirements']);
  for (const p of ['business-flow', 'architecture']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  H.cli(dir, ['approve', 'FEAT-001', 'architecture']);
  for (const p of ['plan', 'implement', 'test']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  H.cli(dir, ['set', 'FEAT-001', 'review', 'gate_failed']);
  const f = `${dir}/.jarvis/state/FEAT-001.json`;
  const st = JSON.parse(fs.readFileSync(f, 'utf8'));
  st.phases.review.issues = issues || ['[F-PERF-002][major] Query inside loop in otp/service.go:88',
                                      '[F-STD-004][major] Handler contains business logic'];
  fs.writeFileSync(f, JSON.stringify(st, null, 2));
  return dir;
}

test('force without --reason is rejected', () => {
  const dir = seedFailedReview(H.makeRepo('force-noreason'));
  const r = H.cli(dir, ['force', 'FEAT-001', 'review']);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /--reason/);
  const st = H.cliJson(dir, ['status', 'FEAT-001']).json;
  assert.equal(st.phases.review.status, 'gate_failed', 'state must not change on a rejected force');
});

test('force with --reason records actor, unresolved issues and a CHR follow-up', () => {
  const dir = seedFailedReview(H.makeRepo('force-ok'));
  const r = H.cliJson(dir, ['force', 'FEAT-001', 'review', '--reason', 'demo deadline, risk accepted by CTO']);
  assert.equal(r.code, 0);
  assert.equal(r.json.forced_by, 'test-user');
  assert.deepEqual(r.json.unresolved, ['F-PERF-002', 'F-STD-004']);
  assert.match(r.json.follow_up, /^CHR-\d{3}$/);
  const st = H.cliJson(dir, ['status', 'FEAT-001']).json;
  assert.equal(st.phases.review.status, 'forced');
  assert.equal(st.forced_gates.length, 1);
  assert.match(st.warnings[0], /has 1 forced gate\(s\): review/);
  const follow = H.cliJson(dir, ['status', r.json.follow_up]).json;
  assert.equal(follow.type, 'chore');
  const intake = fs.readFileSync(`${dir}/${follow.folder}/intake.md`, 'utf8');
  assert.match(intake, /F-PERF-002/);
  const audit = fs.readFileSync(`${dir}/.jarvis/state/FEAT-001.audit.jsonl`, 'utf8');
  assert.match(audit, /"action":"force"/);
});

test('a critical security finding makes review non-forceable without --accept-risk', () => {
  const dir = seedFailedReview(H.makeRepo('force-sec'), ['[F-SEC-001][critical] Raw DB error returned in the response']);
  const denied = H.cli(dir, ['force', 'FEAT-001', 'review', '--reason', 'demo deadline']);
  assert.equal(denied.code, 1);
  assert.match(denied.stderr, /review\.security\.critical/);
  assert.equal(H.cliJson(dir, ['status', 'FEAT-001']).json.phases.review.status, 'gate_failed');
  const ok = H.cliJson(dir, ['force', 'FEAT-001', 'review', '--reason', 'demo deadline', '--accept-risk']);
  assert.equal(ok.code, 0);
  assert.equal(ok.json.hits_non_forceable[0], 'review.security.critical');
});

test('a phase listed in gates.non_forceable needs --accept-risk as well', () => {
  const dir = H.makeRepo('nonforceable');
  H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_ui=false']);
  for (const p of ['intake', 'brief', 'requirements']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  H.cli(dir, ['approve', 'FEAT-001', 'requirements']);
  for (const p of ['business-flow', 'architecture']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  H.cli(dir, ['approve', 'FEAT-001', 'architecture']);
  for (const p of ['plan', 'implement', 'test', 'review']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  H.cli(dir, ['set', 'FEAT-001', 'qa', 'gate_failed']);

  const denied = H.cli(dir, ['force', 'FEAT-001', 'qa', '--reason', 'ship it']);
  assert.equal(denied.code, 1);
  assert.match(denied.stderr, /non_forceable/);
  assert.equal(H.cliJson(dir, ['status', 'FEAT-001']).json.phases.qa.status, 'gate_failed');

  const ok = H.cliJson(dir, ['force', 'FEAT-001', 'qa', '--reason', 'ship it', '--accept-risk']);
  assert.equal(ok.code, 0);
  assert.equal(ok.json.ok, true);
  const st = H.cliJson(dir, ['status', 'FEAT-001']).json;
  assert.equal(st.phases.qa.status, 'forced');
  assert.equal(st.phases.qa.accepted_risk, true);
});

test('approve is refused unless the phase is passed', () => {
  const dir = H.makeRepo('approve-guard');
  H.cliJson(dir, ['new', 'feature', 'OTP login']);
  const r = H.cli(dir, ['approve', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /expected "passed"/);
});

test('skip only works on optional phases and needs a reason', () => {
  const dir = H.makeRepo('skip');
  H.cliJson(dir, ['new', 'feature', 'Profile page', '--flags', 'has_ui=true']);
  assert.equal(H.cli(dir, ['skip', 'FEAT-001', 'ux']).code, 2, 'missing --reason');
  assert.equal(H.cli(dir, ['skip', 'FEAT-001', 'architecture', '--reason', 'no']).code, 1, 'architecture is not optional');
  const ok = H.cliJson(dir, ['skip', 'FEAT-001', 'ux', '--reason', 'design already signed off']);
  assert.equal(ok.code, 0);
  assert.equal(H.cliJson(dir, ['status', 'FEAT-001']).json.phases.ux.status, 'skipped');
});

test('reopen resets the phase and everything downstream', () => {
  const dir = H.makeRepo('reopen');
  H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_ui=false']);
  for (const p of ['intake', 'brief', 'requirements']) H.cli(dir, ['set', 'FEAT-001', p, 'passed']);
  H.cli(dir, ['approve', 'FEAT-001', 'requirements']);
  H.cli(dir, ['set', 'FEAT-001', 'business-flow', 'passed']);
  const r = H.cliJson(dir, ['reopen', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 0);
  const st = H.cliJson(dir, ['status', 'FEAT-001']).json;
  assert.equal(st.phases.requirements, undefined);
  assert.equal(st.phases['business-flow'], undefined);
  assert.equal(st.phases.brief.status, 'passed', 'upstream phases are untouched');
});

test('park blocks next until unpark', () => {
  const dir = H.makeRepo('park');
  H.cliJson(dir, ['new', 'feature', 'OTP login']);
  H.cli(dir, ['park', 'FEAT-001', '--reason', 'waiting on legal']);
  assert.equal(H.cliJson(dir, ['next', 'FEAT-001']).json.action, 'blocked');
  H.cli(dir, ['unpark', 'FEAT-001']);
  assert.equal(H.cliJson(dir, ['next', 'FEAT-001']).json.action, 'run_phase');
});

test('gate failure menu is returned after max_retries', () => {
  const dir = H.makeRepo('menu');
  H.cliJson(dir, ['new', 'feature', 'OTP login']);
  for (let i = 0; i < 3; i++) H.cli(dir, ['set', 'FEAT-001', 'intake', 'gate_failed']);
  const n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.action, 'gate_failure_menu');
  assert.equal(n.attempts, 3);
  assert.equal(n.max_retries, 3);
  assert.ok(n.non_forceable.includes('review.security.critical'));
});
