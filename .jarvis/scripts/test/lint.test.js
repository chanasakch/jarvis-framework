'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const H = require('./helper');

const GO_JOIN = `package otp

import "context"

func (r *Repo) List(ctx context.Context) error {
	const q = "SELECT u.id, p.name FROM users u JOIN profiles p ON p.user_id = u.id"
	_, err := r.db.QueryContext(ctx, q)
	return err
}
`;

function withGo(name, body) {
  const dir = H.makeRepo(name);
  H.write(dir, 'apps/api/internal/otp/repository_mysql.go', body);
  return dir;
}

test('lint flags a SQL JOIN as DB-01', () => {
  const dir = withGo('lint-join', GO_JOIN);
  const r = H.cliJson(dir, ['lint']);
  assert.equal(r.code, 1);
  const f = r.json.findings.find((x) => x.rule === 'DB-01');
  assert.ok(f, JSON.stringify(r.json.findings));
  assert.equal(f.severity, 'major');
  assert.equal(f.file, 'apps/api/internal/otp/repository_mysql.go');
  assert.equal(f.line, 6);
});

test('lint flags SELECT * as DB-02 and a raw error response as ERR-01', () => {
  const dir = withGo('lint-more', `package otp

func (r *Repo) All() { _, _ = r.db.Query("select * from users") }

func handle(w http.ResponseWriter, err error) {
	json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
}
`);
  const r = H.cliJson(dir, ['lint']);
  const rules = r.json.findings.map((f) => f.rule);
  assert.ok(rules.includes('DB-02'));
  const errFinding = r.json.findings.find((f) => f.rule === 'ERR-01');
  assert.ok(errFinding);
  assert.equal(errFinding.severity, 'critical');
});

test('lint flags $lookup as DB-10 and fmt.Print as LOG-01', () => {
  const dir = withGo('lint-mongo', `package otp

func (r *Repo) Agg() {
	pipeline := bson.A{bson.M{"$lookup": bson.M{"from": "profiles"}}}
	fmt.Println(pipeline)
}
`);
  const r = H.cliJson(dir, ['lint']);
  const rules = r.json.findings.map((f) => f.rule);
  assert.ok(rules.includes('DB-10'));
  assert.ok(rules.includes('LOG-01'));
});

test('lint flags `any` in TypeScript as RX-01', () => {
  const dir = H.makeRepo('lint-ts');
  H.write(dir, 'apps/web/src/features/otp/api.ts', `export function parse(input: any) {\n  return input as any;\n}\n`);
  const r = H.cliJson(dir, ['lint']);
  assert.ok(r.json.findings.some((f) => f.rule === 'RX-01'));
});

test('a suppression with an accepted ADR silences the rule', () => {
  const dir = withGo('lint-adr-ok', GO_JOIN.replace('	const q =', '	// jarvis-ignore DB-01 ADR-0007\n	const q ='));
  H.write(dir, 'docs/adr/ADR-0007-legacy-reporting-join.md', `---\nid: ADR-0007\nartifact: adr\nversion: 1\nstatus: final\nrefs: []\n---\n\n# ADR-0007 — Allow one reporting JOIN\n\n## Status\naccepted\n\n## Decision\nThe legacy reporting query keeps its JOIN until the read model lands.\n`);
  const r = H.cliJson(dir, ['lint']);
  assert.equal(r.json.findings.filter((f) => f.rule === 'DB-01').length, 0, JSON.stringify(r.json.findings));
  assert.equal(r.code, 0);
});

test('a suppression whose ADR does not exist is itself a violation', () => {
  const dir = withGo('lint-adr-missing', GO_JOIN.replace('	const q =', '	// jarvis-ignore DB-01 ADR-0099\n	const q ='));
  const r = H.cliJson(dir, ['lint']);
  const f = r.json.findings.find((x) => x.rule === 'DB-01');
  assert.ok(f);
  assert.match(f.desc, /ADR-0099/);
  assert.equal(r.code, 1);
});

test('a suppression whose ADR is only proposed is a violation', () => {
  const dir = withGo('lint-adr-proposed', GO_JOIN.replace('	const q =', '	// jarvis-ignore DB-01 ADR-0008\n	const q ='));
  H.write(dir, 'docs/adr/ADR-0008-maybe.md', `# ADR-0008\n\n## Status\nproposed\n`);
  const r = H.cliJson(dir, ['lint']);
  assert.ok(r.json.findings.some((x) => x.rule === 'DB-01' && /not accepted|does not exist/.test(x.desc)));
});

test('a suppression without an ADR ID is a violation', () => {
  const dir = withGo('lint-adr-none', GO_JOIN.replace('	const q =', '	// jarvis-ignore DB-01\n	const q ='));
  const r = H.cliJson(dir, ['lint']);
  assert.ok(r.json.findings.some((x) => x.rule === 'DB-01' && /missing an ADR/.test(x.desc)));
});

test('exclude globs keep test files and cmd out of LOG-01', () => {
  const dir = H.makeRepo('lint-exclude');
  H.write(dir, 'apps/api/internal/otp/service_test.go', `package otp\n\nfunc TestX(t *testing.T) { fmt.Println("debug") }\n`);
  H.write(dir, 'apps/api/cmd/api/main.go', `package main\n\nfunc main() { fmt.Println("starting") }\n`);
  const r = H.cliJson(dir, ['lint']);
  assert.equal(r.json.findings.filter((f) => f.rule === 'LOG-01').length, 0);
});

test('--path narrows the scan', () => {
  const dir = withGo('lint-path', GO_JOIN);
  H.write(dir, 'apps/web/src/x.ts', 'export const a: any = 1;\n');
  const r = H.cliJson(dir, ['lint', '--path', 'apps/web/**']);
  const rules = new Set(r.json.findings.map((f) => f.rule));
  assert.ok(rules.has('RX-01'));
  assert.ok(!rules.has('DB-01'));
});
