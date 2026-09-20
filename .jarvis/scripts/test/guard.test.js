'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const H = require('./helper');

const GUARD = path.join(H.REAL, '.jarvis', 'scripts', 'guard.js');

function hook(dir, mode, input, env = {}) {
  try {
    const stdout = execFileSync('node', [GUARD, mode], {
      cwd: dir, input: JSON.stringify({ cwd: dir, ...input }), encoding: 'utf8',
      env: { ...process.env, JARVIS_DEV: '', ...env }, stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status ?? 1, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
}

const write = (file) => ({ tool_name: 'Write', tool_input: { file_path: file } });
const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });
const read = (file) => ({ tool_name: 'Read', tool_input: { file_path: file } });

function setPhase(dir, id, phase, status) {
  const f = `${dir}/.jarvis/state/${id}.json`;
  const st = JSON.parse(fs.readFileSync(f, 'utf8'));
  st.phases[phase] = { status, attempts: 0 };
  st.current_phase = phase;
  fs.writeFileSync(f, JSON.stringify(st, null, 2));
}

// ---------------- G1 ----------------

test('G1 blocks writes to framework-owned paths', () => {
  const dir = H.makeRepo('g1');
  for (const f of ['.jarvis/state/FEAT-001.json', '.jarvis/core/workflows/feature.yaml',
                   '.jarvis/scripts/jarvis.js', '.claude/settings.json', '.claude/agents/jarvis-po.md']) {
    const r = hook(dir, 'pre', write(f));
    assert.equal(r.code, 2, `${f} should be blocked`);
    assert.match(r.stderr, /^G1 BLOCKED/);
    assert.match(r.stderr, /Instead:/, 'the message must tell Claude what to do instead');
  }
});

test('G1 allows framework edits when JARVIS_DEV=1', () => {
  const dir = H.makeRepo('g1-dev');
  const r = hook(dir, 'pre', write('.jarvis/core/workflows/feature.yaml'), { JARVIS_DEV: '1' });
  assert.equal(r.code, 0);
});

test('G1 allows project-owned files', () => {
  const dir = H.makeRepo('g1-project');
  for (const f of ['.jarvis/standards/coding-go.md', 'jarvis.config.yaml', 'docs/work/FEAT-001-x/prd.md', 'CLAUDE.md']) {
    assert.equal(hook(dir, 'pre', write(f)).code, 0, f);
  }
});

// ---------------- G2 ----------------

test('G2 blocks every human-only CLI command', () => {
  const dir = H.makeRepo('g2');
  const cmds = [
    'npm run -s jarvis -- approve FEAT-001 requirements',
    'npm run jarvis -- force FEAT-001 review --reason "x"',
    'node .jarvis/scripts/jarvis.js skip FEAT-001 ux --reason "x"',
    'node .jarvis/scripts/jarvis.js reopen FEAT-001 plan',
    'node .jarvis/scripts/jarvis.js park FEAT-001 --reason "x"',
    'node .jarvis/scripts/jarvis.js unpark FEAT-001',
  ];
  for (const c of cmds) {
    const r = hook(dir, 'pre', bash(c));
    assert.equal(r.code, 2, c);
    assert.match(r.stderr, /^G2 BLOCKED/);
    assert.match(r.stderr, /! npm run -s jarvis --/, 'must show the user-facing command');
  }
});

test('G2 still blocks human-only commands when the install is renamed', () => {
  const dir = H.makeRepo('g2-renamed');
  const cfg = `${dir}/jarvis.config.yaml`;
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^(\s{2}name:\s*)jarvis\b/m, '$1ops'));
  const r = hook(dir, 'pre', bash('npm run -s ops -- approve FEAT-001 requirements'));
  assert.equal(r.code, 2, 'a renamed npm script must still be guarded');
  assert.match(r.stderr, /! npm run -s ops --/, 'the suggested command uses the configured prefix');
  assert.equal(hook(dir, 'pre', bash('node .jarvis/scripts/jarvis.js force FEAT-001 review --reason x')).code, 2);
});

test('G2 allows the commands Claude is meant to run', () => {
  const dir = H.makeRepo('g2-ok');
  for (const c of [
    'node .jarvis/scripts/jarvis.js next FEAT-001 --json',
    'node .jarvis/scripts/jarvis.js set FEAT-001 plan in_progress',
    'node .jarvis/scripts/jarvis.js validate FEAT-001 plan',
    'node .jarvis/scripts/jarvis.js merge-review FEAT-001',
    'git diff --stat',
  ]) {
    assert.equal(hook(dir, 'pre', bash(c)).code, 0, c);
  }
});

// ---------------- G3 ----------------

test('G3 blocks source edits when no item is implementing', () => {
  const dir = H.makeRepo('g3');
  H.cliJson(dir, ['new', 'feature', 'OTP login']);
  setPhase(dir, 'FEAT-001', 'requirements', 'in_progress');
  const r = hook(dir, 'pre', write('apps/api/internal/otp/service.go'));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^G3 BLOCKED/);
  assert.match(r.stderr, /implement/);
});

test('G3 allows source edits while an item is in implement', () => {
  const dir = H.makeRepo('g3-impl');
  H.cliJson(dir, ['new', 'feature', 'OTP login']);
  setPhase(dir, 'FEAT-001', 'implement', 'in_progress');
  assert.equal(hook(dir, 'pre', write('apps/api/internal/otp/service.go')).code, 0);
  assert.equal(hook(dir, 'pre', write('apps/web/src/features/otp/Form.tsx')).code, 0);
});

test('G3 in the test phase allows test files only', () => {
  const dir = H.makeRepo('g3-test');
  H.cliJson(dir, ['new', 'feature', 'OTP login']);
  setPhase(dir, 'FEAT-001', 'test', 'in_progress');
  assert.equal(hook(dir, 'pre', write('apps/api/internal/otp/service_test.go')).code, 0);
  assert.equal(hook(dir, 'pre', write('apps/web/src/features/otp/__tests__/Form.test.tsx')).code, 0);
  const r = hook(dir, 'pre', write('apps/api/internal/otp/service.go'));
  assert.equal(r.code, 2, 'production code is not editable in the test phase');
  assert.match(r.stderr, /test files only/);
});

test('G3 does not touch docs or state-free repos', () => {
  const dir = H.makeRepo('g3-docs');
  assert.equal(hook(dir, 'pre', write('docs/work/FEAT-001-x/tech-spec.md')).code, 0);
  assert.equal(hook(dir, 'pre', write('README.md')).code, 0);
});

// ---------------- G4 ----------------

test('G4 blocks migrations unless an active item declares has_db_change', () => {
  const dir = H.makeRepo('g4');
  H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_db_change=false']);
  setPhase(dir, 'FEAT-001', 'implement', 'in_progress');
  const r = hook(dir, 'pre', write('apps/api/migrations/mysql/000001_add_otp.up.sql'));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /^G4 BLOCKED/);
  assert.match(r.stderr, /has_db_change=true/);
});

test('G4 allows migrations when the flag is set', () => {
  const dir = H.makeRepo('g4-ok');
  H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_db_change=true']);
  setPhase(dir, 'FEAT-001', 'implement', 'in_progress');
  assert.equal(hook(dir, 'pre', write('apps/api/migrations/mysql/000001_add_otp.up.sql')).code, 0);
  assert.equal(hook(dir, 'pre', write('apps/api/migrations/mongo/000001_otp_indexes.js')).code, 0);
});

// ---------------- G5 ----------------

test('G5 blocks reading and writing secret files', () => {
  const dir = H.makeRepo('g5');
  for (const f of ['.env', '.env.local', 'apps/api/.env.production', 'certs/server.pem', 'deploy/id_rsa', 'credentials.json']) {
    const r = hook(dir, 'pre', read(f));
    assert.equal(r.code, 2, `read ${f}`);
    assert.match(r.stderr, /^G5 BLOCKED/);
    assert.equal(hook(dir, 'pre', write(f)).code, 2, `write ${f}`);
  }
});

test('G5 allows .env.example and blocks shell reads of secrets', () => {
  const dir = H.makeRepo('g5-example');
  assert.equal(hook(dir, 'pre', read('.env.example')).code, 0);
  assert.equal(hook(dir, 'pre', bash('cat .env.example')).code, 0);
  assert.equal(hook(dir, 'pre', bash('cat .env')).code, 2);
  assert.equal(hook(dir, 'pre', bash('grep SECRET apps/api/.env')).code, 2);
});

test('G5 blocks a secret read however the path is written', () => {
  const dir = H.makeRepo('g5-paths');
  for (const c of [
    'cat .env', "cat '.env'", 'cat ".env"', 'cat .env.local', 'cat ./.env',
    'source .env', 'cp .env /tmp/x', 'head -5 deploy/id_rsa',
    'cat certs/server.pem', 'cat credentials.json', 'grep -i token apps/api/.env',
  ]) {
    const r = hook(dir, 'pre', bash(c));
    assert.equal(r.code, 2, `must block: ${c}`);
    assert.match(r.stderr, /^G5 BLOCKED/);
  }
});

// A command carries data as well as arguments. Prose that merely mentions `.env` is not
// a secret read, and blocking it stopped a real commit (DECISIONS.md D-050/D-051).
test('G5 ignores .env inside heredoc bodies and quoted prose', () => {
  const dir = H.makeRepo('g5-prose');
  for (const c of [
    "cat >> DECISIONS.md <<'EOF'\nreuseExistingServer: !process.env.CI was always true\nEOF",
    'git commit -m "fix process.env.CI handling"',
    'echo "run cat .env to see it"',
    'sed -i s/process.env.CI/1/ file.js',
    'node -e "console.log(process.env.CI)"',
    'grep -r "import.meta.env" src/',
    'cat notes.md',
  ]) {
    const r = hook(dir, 'pre', bash(c));
    assert.equal(r.code, 0, `must allow: ${c}\n${r.stderr}`);
  }
});

// The quoted-token rule must not become a bypass: quoting a path still reads the file.
test('G5 still blocks a quoted secret path', () => {
  const dir = H.makeRepo('g5-quoted');
  assert.equal(hook(dir, 'pre', bash("grep TOKEN 'apps/api/.env'")).code, 2);
  assert.equal(hook(dir, 'pre', bash('grep TOKEN "apps/api/.env"')).code, 2);
});

// ---------------- post ----------------

test('post reports lint violations on the edited file with exit 2', () => {
  const dir = H.makeRepo('post');
  H.write(dir, 'apps/api/internal/otp/repository_mysql.go',
    'package otp\n\nfunc (r *Repo) List() {\n\t_, _ = r.db.Query("SELECT u.id FROM users u JOIN profiles p ON p.user_id = u.id")\n}\n');
  const r = hook(dir, 'post', write('apps/api/internal/otp/repository_mysql.go'));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /DB-01/);
  assert.match(r.stderr, /\.jarvis\/standards\//, 'must point Claude at the rule definition');
});

test('post stays quiet on a clean file', () => {
  const dir = H.makeRepo('post-clean');
  H.write(dir, 'apps/api/internal/otp/service.go',
    'package otp\n\n// Complexity: O(n)\nfunc Sum(xs []int) int {\n\ttotal := 0\n\tfor _, x := range xs {\n\t\ttotal += x\n\t}\n\treturn total\n}\n');
  assert.equal(hook(dir, 'post', write('apps/api/internal/otp/service.go')).code, 0);
});

test('guard fails open on malformed input', () => {
  const dir = H.makeRepo('failopen');
  const r = hook(dir, 'pre', {});
  assert.equal(r.code, 0);
});
