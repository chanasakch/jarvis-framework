'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const H = require('./helper');

function reviewerFile(reviewer, findings, verdict) {
  return `---\nid: FEAT-001\nartifact: ${reviewer}\nversion: 1\nstatus: final\nrefs: []\n---\n\n# Review — ${reviewer}\n\n## Findings\n| ID | severity | file:line | rule | issue |\n|---|---|---|---|---|\n${findings.map((f) => `| ${f.id} | ${f.severity} | ${f.file}:${f.line} | ${f.rule} | ${f.issue} |`).join('\n') || '| none | | | | |'}\n\n\`\`\`json\n${JSON.stringify({ reviewer, verdict, findings }, null, 2)}\n\`\`\`\n`;
}

function seedReview(name, perReviewer) {
  const dir = H.makeRepo(name);
  H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_ui=false']);
  const folder = 'docs/work/FEAT-001-otp-login';
  for (const [reviewer, spec] of Object.entries(perReviewer)) {
    if (spec === null) continue;
    H.write(dir, `${folder}/review/${reviewer}.md`, reviewerFile(reviewer, spec.findings, spec.verdict));
  }
  return { dir, folder };
}

const CLEAN = { findings: [], verdict: 'pass' };

test('merge-review passes when every reviewer is clean', () => {
  const { dir, folder } = seedReview('rev-pass', {
    standards: CLEAN, performance: CLEAN, security: CLEAN, database: CLEAN,
  });
  const r = H.cliJson(dir, ['merge-review', 'FEAT-001']);
  assert.equal(r.code, 0);
  assert.equal(r.json.verdict, 'pass');
  const report = fs.readFileSync(`${dir}/${folder}/review-report.md`, 'utf8');
  assert.match(report, /## Verdict\n\*\*pass\*\*/);
  assert.match(report, /artifact: review-report/);
});

test('merge-review fails on a blocking severity and creates FIX tasks', () => {
  const { dir, folder } = seedReview('rev-fail', {
    standards: CLEAN,
    performance: { verdict: 'fail', findings: [{ id: 'F-PERF-002', severity: 'major', file: 'apps/api/internal/otp/service.go', line: 88, rule: 'PERF-04', issue: 'Query inside loop', fix: 'Batch with IN' }] },
    security: CLEAN, database: CLEAN,
  });
  const r = H.cliJson(dir, ['merge-review', 'FEAT-001']);
  assert.equal(r.code, 1);
  assert.equal(r.json.verdict, 'fail');
  assert.deepEqual(r.json.fix_tasks.map((t) => t.task), ['FIX-F-PERF-002']);

  const st = H.cliJson(dir, ['status', 'FEAT-001']).json;
  assert.equal(st.phases.review.status, 'gate_failed');
  assert.equal(st.tasks['FIX-F-PERF-002'], 'pending');

  const report = fs.readFileSync(`${dir}/${folder}/review-report.md`, 'utf8');
  assert.match(report, /F-PERF-002/);
  assert.match(report, /apps\/api\/internal\/otp\/service\.go:88/);
});

test('a minor finding alone does not block', () => {
  const { dir } = seedReview('rev-minor', {
    standards: { verdict: 'pass', findings: [{ id: 'F-STD-007', severity: 'minor', file: 'apps/api/internal/otp/dto.go', line: 12, rule: 'GO-14', issue: 'Exported type has no doc comment', fix: 'Add a comment' }] },
    performance: CLEAN, security: CLEAN, database: CLEAN,
  });
  const r = H.cliJson(dir, ['merge-review', 'FEAT-001']);
  assert.equal(r.json.verdict, 'pass');
  assert.equal(r.json.findings.length, 1);
  assert.equal(r.json.blocking.length, 0);
});

test('a missing reviewer report fails the merge', () => {
  const { dir } = seedReview('rev-missing', {
    standards: CLEAN, performance: CLEAN, security: CLEAN, database: null,
  });
  const r = H.cliJson(dir, ['merge-review', 'FEAT-001']);
  assert.equal(r.json.verdict, 'fail');
  assert.equal(r.json.reviewers.find((x) => x.name === 'database').present, false);
});

test('an unparseable JSON block fails the merge', () => {
  const { dir, folder } = seedReview('rev-badjson', {
    standards: CLEAN, performance: CLEAN, security: CLEAN, database: CLEAN,
  });
  H.write(dir, `${folder}/review/database.md`, '# Review — database\n\n```json\n{ not json }\n```\n');
  const r = H.cliJson(dir, ['merge-review', 'FEAT-001']);
  assert.equal(r.json.verdict, 'fail');
  assert.match(r.json.reviewers.find((x) => x.name === 'database').error, /does not parse/);
});

test('hotfix treats only security and standards as blocking', () => {
  const dir = H.makeRepo('rev-hotfix');
  H.cliJson(dir, ['new', 'hotfix', 'Avatar 500']);
  const folder = 'docs/work/HOT-001-avatar-500';
  H.write(dir, `${folder}/review/standards.md`, reviewerFile('standards', [], 'pass'));
  H.write(dir, `${folder}/review/security.md`, reviewerFile('security', [], 'pass'));
  H.write(dir, `${folder}/review/database.md`, reviewerFile('database', [], 'pass'));
  H.write(dir, `${folder}/review/performance.md`, reviewerFile('performance', [
    { id: 'F-PERF-001', severity: 'major', file: 'apps/api/internal/profile/service.go', line: 40, rule: 'PERF-04', issue: 'Cache call in a loop', fix: 'Use MGET' },
  ], 'fail'));
  const r = H.cliJson(dir, ['merge-review', 'HOT-001']);
  assert.equal(r.json.verdict, 'pass', 'performance is advisory for hotfix');
  assert.equal(r.json.findings.length, 1);
  assert.equal(r.json.blocking.length, 0);
});

test('review validation reports findings that cite no rule or file:line', () => {
  const { dir, folder } = seedReview('rev-validate', {
    standards: CLEAN, performance: CLEAN, security: CLEAN, database: CLEAN,
  });
  H.write(dir, `${folder}/review/security.md`, reviewerFile('security', [
    { id: 'F-SEC-003', severity: 'blocker', file: '', line: undefined, rule: '', issue: 'Something smells' },
  ], 'fail'));
  H.cli(dir, ['merge-review', 'FEAT-001']);
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'review']);
  const rules = r.json.issues.map((i) => i.rule);
  assert.ok(rules.includes('REV-04'), JSON.stringify(r.json.issues));
  assert.ok(rules.includes('REV-05'), 'severity outside conventions.md §4');
  assert.ok(rules.includes('REV-03'), 'merged verdict is fail');
});
