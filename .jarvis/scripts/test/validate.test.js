'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const H = require('./helper');

function seed(name, mutate) {
  const dir = H.makeRepo(name);
  H.cliJson(dir, ['new', 'feature', 'OTP login', '--flags', 'has_ui=false']);
  const folder = 'docs/work/FEAT-001-otp-login';
  const { prd, stories } = H.goodRequirements('FEAT-001');
  H.write(dir, `${folder}/prd.md`, prd);
  H.write(dir, `${folder}/stories.md`, stories);
  if (mutate) mutate(dir, folder, { prd, stories });
  return { dir, folder };
}

const rules = (r) => r.json.issues.map((i) => i.rule);

test('a complete requirements pair passes the script gate', () => {
  const { dir } = seed('val-ok');
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'requirements']);
  assert.equal(r.json.pass, true, JSON.stringify(r.json.issues, null, 2));
  assert.equal(r.code, 0);
});

test('a missing artifact fails with VAL-01', () => {
  const { dir } = seed('val-missing', (d, f) => require('fs').rmSync(`${d}/${f}/stories.md`));
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 1);
  assert.ok(rules(r).includes('VAL-01'));
});

test('a missing required heading fails with VAL-03', () => {
  const { dir } = seed('val-heading', (d, f, { prd }) => {
    H.write(d, `${f}/prd.md`, prd.replace('## Out of Scope\nSocial login, passwordless email links.\n', ''));
  });
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 1);
  const issue = r.json.issues.find((i) => i.rule === 'VAL-03');
  assert.ok(issue, JSON.stringify(rules(r)));
  assert.match(issue.message, /Out of Scope/);
});

test('TBD in a final artifact fails with VAL-04', () => {
  const { dir } = seed('val-tbd', (d, f, { prd }) => {
    H.write(d, `${f}/prd.md`, prd.replace('Social login, passwordless email links.', 'TBD'));
  });
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 1);
  assert.ok(rules(r).includes('VAL-04'));
});

test('a malformed ID fails with VAL-05', () => {
  const { dir } = seed('val-id', (d, f, { prd }) => {
    H.write(d, `${f}/prd.md`, prd.replace('| FR-002 |', '| FR-2 |'));
  });
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 1);
  const issue = r.json.issues.find((i) => i.rule === 'VAL-05');
  assert.ok(issue);
  assert.match(issue.message, /FR-2/);
});

test('a Must FR with no user story fails with REQ-03', () => {
  const { dir } = seed('val-cover', (d, f, { stories }) => {
    H.write(d, `${f}/stories.md`, stories
      .replace('FR refs: [FR-001] [FR-002]', 'FR refs: [FR-001]')
      .replace('| FR-002 | US-001 |', '| FR-002 | - |'));
  });
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 1);
  const issue = r.json.issues.find((i) => i.rule === 'REQ-03');
  assert.ok(issue, JSON.stringify(rules(r)));
  assert.match(issue.message, /FR-002/);
});

test('a user story with no acceptance criteria fails with REQ-04', () => {
  const { dir } = seed('val-ac', (d, f, { stories }) => {
    H.write(d, `${f}/stories.md`, stories.replace(/\| AC-001-0\d \|[^\n]*\n/g, ''));
  });
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 1);
  assert.ok(rules(r).includes('REQ-04'));
});

test('an FR without a priority fails with REQ-02', () => {
  const { dir } = seed('val-prio', (d, f, { prd }) => {
    H.write(d, `${f}/prd.md`, prd.replace('| FR-001 | Request an OTP for a registered phone number | Must | US-001 |',
      '| FR-001 | Request an OTP for a registered phone number |  | US-001 |'));
  });
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 1);
  assert.ok(rules(r).includes('REQ-02'));
});

test('an ID that exists in no upstream artifact fails with VAL-07', () => {
  const { dir } = seed('val-upstream', (d, f, { stories }) => {
    H.write(d, `${f}/stories.md`, stories.replace('FR refs: [FR-001] [FR-002]', 'FR refs: [FR-001] [FR-099]'));
  });
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'requirements']);
  assert.equal(r.code, 1);
  const issue = r.json.issues.find((i) => i.rule === 'VAL-07');
  assert.ok(issue, JSON.stringify(rules(r)));
  assert.match(issue.message, /FR-099/);
});

test('plan validation catches an uncovered story, a bad layer and a dependency cycle', () => {
  const { dir, folder } = seed('val-plan');
  H.write(dir, `${folder}/plan.md`, H.fm('FEAT-001', 'plan', ['tech-spec.md']) + `
# Plan — OTP login

## Tasks
| ID | layer | title | story refs | files/areas | depends_on | size | done criteria | test expectations |
|---|---|---|---|---|---|---|---|---|
| T-001 | database | add otp table | US-001 | migrations | T-002 | S | migration applies |  |
| T-002 | backend | otp repository | US-001 | internal/otp | T-001 | M | repository compiles | table-driven tests |

## Dependency Order
1. T-001
2. T-002

## Coverage
| US | tasks |
|---|---|
| US-002 | T-001 |
`);
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'plan']);
  assert.equal(r.code, 1);
  const rs = rules(r);
  assert.ok(rs.includes('PLN-02'), 'bad layer');
  assert.ok(rs.includes('PLN-03'), 'dependency cycle');
  assert.ok(rs.includes('PLN-04'), 'missing test expectations');
  assert.ok(rs.includes('PLN-01'), 'US-001 not covered');
});

test('architecture validation catches an unmapped FR and an index-less query', () => {
  const { dir, folder } = seed('val-arch');
  H.write(dir, `${folder}/tech-spec.md`, H.fm('FEAT-001', 'tech-spec', ['prd.md']) + `
# Tech Spec — OTP login

## Context
Adds OTP login to the existing auth domain.

## Architecture Diagrams
\`\`\`mermaid
graph TB
  web --> api
\`\`\`

## FR → Component Mapping
| FR | component | file/package | notes |
|---|---|---|---|
| FR-001 | otp service | internal/otp | sends the code |

## Layering
Follows .jarvis/standards/structure.md.

## API Changes
| method | path | auth | request | response | timeout | rate limit |
|---|---|---|---|---|---|---|
| POST | /v1/otp | none | phone | 202 | 2000 ms | 5/hour |

## Data Design
| read path | source | strategy | why |
|---|---|---|---|
| verify | mysql | denormalized phone column | avoids a second fetch |

## Query-Index Matrix
| path/endpoint | db | query shape | sort | index | evidence |
|---|---|---|---|---|---|
| POST /v1/otp/verify | mysql | WHERE phone = ? |  |  | pending |

## Cache Design
| key | value | ttl | jitter | invalidated by | stampede protection |
|---|---|---|---|---|---|
| auth:otp:phone:v1 | attempt count | 600s | 10% | verify success | singleflight |

## Validation Rules
| field | type | length | format | range | enum | sanitization |
|---|---|---|---|---|---|---|
| phone | string | 10 | E.164 | - | - | strip spaces |

## Error Codes
| internal code | public key | http | level | when |
|---|---|---|---|---|
| OTP_INVALID | bmsg_otp_invalid | 400 | info | code mismatch |

## Logging Plan
| event | level | component | fields |
|---|---|---|---|
| otp.verify.failed | info | otp | request_id, error_code |

## Complexity Notes
| function | complexity | input bound | note |
|---|---|---|---|
| VerifyOTP | O(1) | single row | indexed lookup |

## Security
| endpoint | authn | authz rule | sensitive data | rate limit |
|---|---|---|---|---|
| POST /v1/otp | none | public | phone number | 5/hour |

## Performance Budget
| path | budget | source | how measured |
|---|---|---|---|
| POST /v1/otp/verify | p95 < 200 ms | jarvis.config.yaml | k6 |

## Risks
| ID | risk | mitigation |
|---|---|---|
| R-001 | SMS delay | retry with backoff |

## Alternatives
| option | rejected because |
|---|---|
| email magic link | slower for mobile users |

## ADRs
| ADR | decision | rule exception |
|---|---|---|
| ADR-0001 | store OTP hashes only | none |
`);
  const r = H.cliJson(dir, ['validate', 'FEAT-001', 'architecture']);
  assert.equal(r.code, 1);
  const msgs = r.json.issues.map((i) => `${i.rule} ${i.message}`).join('\n');
  assert.match(msgs, /ARC-02 .*FR-002/, 'FR-002 is not mapped');
  assert.match(msgs, /ARC-04 .*names no index/);
});
