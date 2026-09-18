'use strict';
// Builds a throwaway repo that reuses the real framework files, so tests exercise the
// actual workflows, templates, checklists and lint rules.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execFileSync: run } = require('child_process');

const REAL = path.resolve(__dirname, '..', '..', '..');

function makeRepo(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `jarvis-${name}-`));
  fs.mkdirSync(path.join(dir, '.jarvis'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.jarvis', 'state'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs', 'work'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs', 'adr'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'packages', 'errors'), { recursive: true });
  fs.copyFileSync(path.join(REAL, 'jarvis.config.yaml'), path.join(dir, 'jarvis.config.yaml'));
  fs.copyFileSync(path.join(REAL, 'packages', 'errors', 'registry.yaml'), path.join(dir, 'packages', 'errors', 'registry.yaml'));
  fs.symlinkSync(path.join(REAL, '.jarvis', 'core'), path.join(dir, '.jarvis', 'core'), 'dir');
  fs.symlinkSync(path.join(REAL, '.jarvis', 'standards'), path.join(dir, '.jarvis', 'standards'), 'dir');
  fs.symlinkSync(path.join(REAL, '.jarvis', 'scripts'), path.join(dir, '.jarvis', 'scripts'), 'dir');
  try {
    run('git', ['init', '-q'], { cwd: dir });
    run('git', ['config', 'user.name', 'test-user'], { cwd: dir });
    run('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  } catch {}
  return dir;
}

// Run the CLI the way a user or Claude would.
function cli(dir, args, opts = {}) {
  const bin = path.join(REAL, '.jarvis', 'scripts', 'jarvis.js');
  try {
    const stdout = execFileSync('node', [bin, ...args], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, JARVIS_ROOT: dir, ...(opts.env || {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status ?? 1, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
}

function cliJson(dir, args, opts) {
  const r = cli(dir, [...args, '--json'], opts);
  try { r.json = JSON.parse(r.stdout); } catch { r.json = null; }
  return r;
}

function write(dir, rel, text) {
  const f = path.join(dir, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
  return f;
}

function fm(id, artifact, refs = []) {
  return `---\nid: ${id}\nartifact: ${artifact}\nversion: 1\nstatus: final\nrefs: [${refs.join(', ')}]\n---\n`;
}

// A prd.md + stories.md pair that passes the requirements gate.
function goodRequirements(id) {
  const prd = fm(id, 'prd', ['brief.md']) + `
# PRD — OTP login

## Overview
Users sign in with a one-time password sent by SMS.

## Goals & Success Metrics
| goal | metric | baseline | target |
|---|---|---|---|
| Reduce password resets | resets per week | 120 | 40 |

## Personas
| persona | need |
|---|---|
| Returning customer | Sign in without remembering a password |

## Functional Requirements
| ID | description | priority | refs |
|---|---|---|---|
| FR-001 | Request an OTP for a registered phone number | Must | US-001 |
| FR-002 | Verify an OTP and issue a session | Must | US-001 |

## Non-Functional Requirements
| ID | category | requirement | measurable target |
|---|---|---|---|
| NFR-001 | performance | OTP verify latency | p95 < 200 ms at 50 rps |
| NFR-002 | security | OTP rate limited per phone | 5 requests per hour |
| NFR-003 | logging | Every verify attempt logged with request_id | 100% of attempts |
| NFR-004 | retention | OTP records deleted after use | within 10 minutes |
| NFR-005 | availability | Login endpoint uptime | 99.9% monthly |

## Out of Scope
Social login, passwordless email links.

## Dependencies
| dependency | owner | needed by |
|---|---|---|
| SMS gateway | platform | implement |

## Risks
| ID | risk | likelihood | impact | mitigation |
|---|---|---|---|---|
| R-001 | SMS gateway outage | medium | high | Fall back to email OTP |

## Open Questions
| ID | question | owner |
|---|---|---|
| Q-001 | Which SMS provider is contracted? | platform |
`;
  const stories = fm(id, 'user-story', ['prd.md']).replace('artifact: user-story', 'artifact: stories') + `
# Stories — OTP login

## Stories

### US-001 — Sign in with an OTP
As a returning customer
I want to receive a one-time password
So that I can sign in without a password

FR refs: [FR-001] [FR-002]
Priority: Must
Size: M

#### Acceptance Criteria
| ID | type | Given | When | Then |
|---|---|---|---|---|
| AC-001-01 | happy | a registered phone number | the customer requests an OTP | an OTP is sent within 10 seconds |
| AC-001-02 | validation | a phone number with 8 digits | the customer requests an OTP | the response is bmsg_validation_error |
| AC-001-03 | negative | 5 OTP requests in one hour | a sixth request arrives | the response is bmsg_rate_limited |
| AC-001-04 | error | an expired OTP | the customer submits it | the response is bmsg_otp_invalid |

Notes: OTP length is 6 digits.

## Coverage
| FR | stories |
|---|---|
| FR-001 | US-001 |
| FR-002 | US-001 |
`;
  return { prd, stories };
}

module.exports = { REAL, makeRepo, cli, cliJson, write, fm, goodRequirements };
