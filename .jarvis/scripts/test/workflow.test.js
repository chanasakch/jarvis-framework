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
  assert.equal(n.agent, 'jarvis-analyst');
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
  assert.equal(n.agent, 'jarvis-ux');
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

// --- conditional_agents: flag-gated agents (devops) -------------------------

// `requirements`, `architecture` and `release` need human approval to unlock, so a test
// walking past them must approve, not just pass.
function advance(dir, id, phases) {
  const APPROVE = new Set(['requirements', 'ux', 'architecture', 'release']);
  for (const p of phases) {
    H.cli(dir, ['set', id, p, 'passed']);
    if (APPROVE.has(p)) H.cli(dir, ['approve', id, p]);
  }
}

test('conditional agents are absent when their flag is false', () => {
  const dir = H.makeRepo('cond-off');
  H.cliJson(dir, ['new', 'feature', 'Plain feature', '--flags', 'has_infra_change=false']);
  advance(dir, 'FEAT-001', ['intake', 'brief', 'requirements', 'business-flow', 'architecture', 'plan', 'implement', 'test']);
  const n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.phase, 'review');
  assert.ok(!n.agents_resolved.includes('jarvis-review-devops'), 'devops reviewer must not run');
  assert.equal(n.agents_resolved.length, 4);
  assert.ok(!n.outputs.some((o) => o.endsWith('review/devops.md')), 'no devops report is expected');
});

test('conditional agents and outputs appear when their flag is true', () => {
  const dir = H.makeRepo('cond-on');
  H.cliJson(dir, ['new', 'feature', 'Infra feature', '--flags', 'has_infra_change=true']);
  advance(dir, 'FEAT-001', ['intake', 'brief', 'requirements', 'business-flow']);

  let n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.phase, 'architecture');
  assert.ok(n.agents_resolved.includes('jarvis-devops'), 'devops designs alongside the architect');
  assert.ok(n.outputs.some((o) => o.endsWith('infra-plan.md')), 'infra-plan.md is a required output');
  assert.ok(n.standards.includes('.jarvis/standards/devops.md'));

  advance(dir, 'FEAT-001', ['architecture', 'plan', 'implement', 'test']);
  n = H.cliJson(dir, ['next', 'FEAT-001']).json;
  assert.equal(n.phase, 'review');
  assert.ok(n.agents_resolved.includes('jarvis-review-devops'), 'devops reviewer must run');
  assert.equal(n.agents_resolved.length, 5);
  assert.ok(n.outputs.some((o) => o.endsWith('review/devops.md')));
});

test('release requires a deploy plan only when has_infra_change is true', () => {
  const dir = H.makeRepo('cond-release');
  H.cliJson(dir, ['new', 'chore', 'Pin CI actions', '--flags', 'has_infra_change=true']);
  advance(dir, 'CHR-001', ['intake', 'plan', 'implement', 'test', 'review']);
  const n = H.cliJson(dir, ['next', 'CHR-001']).json;
  assert.equal(n.phase, 'release');
  assert.ok(n.agents_resolved.includes('jarvis-devops'));
  assert.ok(n.outputs.some((o) => o.endsWith('deploy-plan.md')));
});

test('every workflow with a review phase gates the devops reviewer on has_infra_change', () => {
  const fs = require('fs');
  const path = require('path');
  const YAML = require('yaml');
  const dir = path.resolve(__dirname, '..', '..', 'core', 'workflows');
  let checked = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.yaml'))) {
    const wf = YAML.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const review = wf.phases.find((p) => p.id === 'review');
    if (!review) continue;
    checked++;
    assert.deepEqual(review.conditional_agents, { has_infra_change: ['jarvis-review-devops'] }, f);
    assert.deepEqual(review.conditional_outputs, { has_infra_change: ['review/devops.md'] }, f);
    assert.ok(review.reviewer_standards.devops, `${f} has no devops reviewer_standards`);
  }
  assert.equal(checked, 9, 'every workflow but spike has a review phase');
});

// --- portfolio / link: the cross-work-item (PM) view ------------------------

test('link records a dependency and refuses a cycle', () => {
  const dir = H.makeRepo('link');
  H.cliJson(dir, ['new', 'feature', 'OTP login']);
  H.cliJson(dir, ['new', 'chore', 'Pin CI actions']);
  const ok = H.cliJson(dir, ['link', 'CHR-001', '--depends-on', 'FEAT-001']);
  assert.equal(ok.code, 0);
  assert.deepEqual(ok.json.depends_on, ['FEAT-001']);

  const cyc = H.cli(dir, ['link', 'FEAT-001', '--depends-on', 'CHR-001']);
  assert.equal(cyc.code, 2, 'a cycle must be refused');
  assert.match(cyc.stderr, /cycle/);

  const self = H.cli(dir, ['link', 'FEAT-001', '--depends-on', 'FEAT-001']);
  assert.equal(self.code, 2, 'self-dependency must be refused');

  const gone = H.cliJson(dir, ['link', 'CHR-001', '--depends-on', 'FEAT-001', '--remove']);
  assert.deepEqual(gone.json.depends_on, []);
});

test('portfolio reports dependencies, risks and plan file overlaps', () => {
  const fs = require('fs');
  const dir = H.makeRepo('portfolio');
  H.cliJson(dir, ['new', 'feature', 'OTP login']);
  H.cliJson(dir, ['new', 'bugfix', 'Avatar 500']);
  H.cli(dir, ['link', 'BUG-001', '--depends-on', 'FEAT-001']);

  // Two items whose plans touch the same file.
  fs.writeFileSync(`${dir}/docs/work/FEAT-001-otp-login/plan.md`,
    '| T-001 | backend | apps/api/internal/user/repo.go |\n');
  fs.writeFileSync(`${dir}/docs/work/FEAT-001-otp-login/brief.md`,
    '| Q-001 | which provider | brief |\n| R-001 | provider outage | high |\n');
  fs.writeFileSync(`${dir}/docs/work/BUG-001-avatar-500/plan.md`,
    '| T-001 | backend | apps/api/internal/user/repo.go |\n');

  const p = H.cliJson(dir, ['portfolio']).json;
  assert.equal(p.counts.active, 2);
  const feat = p.items.find((i) => i.id === 'FEAT-001');
  assert.deepEqual(feat.open_questions, ['Q-001']);
  assert.deepEqual(feat.risks, ['R-001']);

  const bug = p.items.find((i) => i.id === 'BUG-001');
  assert.deepEqual(bug.depends_on, ['FEAT-001']);
  assert.deepEqual(bug.blocked_by, ['FEAT-001'], 'FEAT-001 is not finished, so BUG-001 waits');

  assert.deepEqual(p.overlaps, [{ file: 'apps/api/internal/user/repo.go', items: ['BUG-001', 'FEAT-001'] }]);
  assert.ok(p.attention.some((a) => a.includes('waiting on FEAT-001')));
  assert.ok(p.attention.some((a) => a.includes('both plan to change')));
});

test('portfolio separates parked from active and is empty-safe', () => {
  const dir = H.makeRepo('portfolio-empty');
  const empty = H.cliJson(dir, ['portfolio']).json;
  assert.equal(empty.counts.total, 0);
  assert.deepEqual(empty.attention, []);

  H.cliJson(dir, ['new', 'feature', 'OTP login']);
  H.cli(dir, ['park', 'FEAT-001', '--reason', 'waiting on vendor']);
  const p = H.cliJson(dir, ['portfolio']).json;
  assert.equal(p.counts.active, 0);
  assert.equal(p.counts.parked, 1);
  assert.equal(p.items[0].parked, 'waiting on vendor');
});
