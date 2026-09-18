'use strict';
// Script gate (spec §8 step 2, §16.2): structure, front matter, IDs, traceability,
// deterministic checks. Returns { pass, issues: [{rule, file, line?, message}] }.

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const S = require('./state');
const W = require('./workflow');
const lint = require('./lint');
const check = require('./check');

const ID_PATTERNS = {
  FR: /^FR-\d{3}$/, NFR: /^NFR-\d{3}$/, US: /^US-\d{3}$/, AC: /^AC-\d{3}-\d{2}$/,
  BR: /^BR-\d{3}$/, UX: /^UX-\d{3}$/, T: /^T-\d{3}$/, TC: /^TC-\d{3}$/,
  D: /^D-\d{3}$/, R: /^R-\d{3}$/, Q: /^Q-\d{3}$/, ADR: /^ADR-\d{4}$/,
};
const ID_SCAN = /\b(NFR|FR|US|AC|BR|UX|TC|ADR|T|D|R|Q)-[0-9][A-Za-z0-9-]*/g;
// Which artifact is allowed to introduce which ID kind; anything else must exist upstream.
const OWNS = {
  'intake.md': ['Q'],
  'brief.md': ['Q'],
  'prd.md': ['FR', 'NFR', 'R', 'Q'],
  'stories.md': ['US', 'AC', 'Q'],
  'business-flow.md': ['BR', 'Q'],
  'ux-spec.md': ['UX', 'Q'],
  'investigation.md': ['Q', 'R', 'D'],
  'spike-report.md': ['Q', 'ADR'],
  'tech-spec.md': ['R', 'Q', 'ADR', 'NFR'],
  'migration-plan.md': ['R', 'Q'],
  'plan.md': ['T', 'Q'],
  'impl-log.md': ['T', 'Q'],
  'test-plan.md': ['TC', 'Q'],
  'test-report.md': ['TC', 'D', 'Q'],
  'review-report.md': ['Q'],
  'qa-report.md': ['D', 'Q'],
  'release-notes.md': ['Q'],
  'runbook.md': ['Q'],
  'postmortem.md': ['Q', 'R'],
};
const TEMPLATE_FOR = { 'stories.md': 'user-story.md' };
const BANNED = /\b(TBD|TODO|\?\?\?)\b/;

// ---------- markdown helpers ----------

function stripCode(md) {
  return md.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' '));
}

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { ok: false, error: 'missing front matter block' };
  let data;
  try { data = YAML.parse(m[1]); } catch (e) { return { ok: false, error: `front matter is not valid YAML: ${e.message}` }; }
  if (!data || typeof data !== 'object') return { ok: false, error: 'front matter is empty' };
  const missing = ['id', 'artifact', 'version', 'status'].filter((k) => data[k] === undefined || data[k] === null || data[k] === '');
  if (missing.length) return { ok: false, error: `front matter missing: ${missing.join(', ')}`, data };
  return { ok: true, data };
}

function headings(md) {
  return [...md.matchAll(/^(#{1,6})\s+(.+?)\s*$/gm)].map((m) => ({ level: m[1].length, text: m[2].replace(/\s*<!--.*?-->\s*$/, '').trim() }));
}

function requiredHeadings(templateText) {
  return [...templateText.matchAll(/^#{1,6}\s+(.+?)\s*<!--\s*required\s*-->\s*$/gm)].map((m) => m[1].trim());
}

function sectionText(md, heading) {
  const lines = md.split('\n');
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  let start = -1, level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (m && norm(m[2].replace(/<!--.*?-->/, '')) === norm(heading)) { start = i + 1; level = m[1].length; break; }
  }
  if (start < 0) return null;
  for (let i = start; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+/);
    if (m && m[1].length <= level) return lines.slice(start, i).join('\n');
  }
  return lines.slice(start).join('\n');
}

function tables(md) {
  const out = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) continue;
    const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    const header = cells(lines[i]);
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && /^\s*\|/.test(lines[j]); j++) {
      const r = cells(lines[j]);
      const obj = {};
      header.forEach((h, k) => { obj[h.toLowerCase()] = r[k] === undefined ? '' : r[k]; });
      obj.__cells = r;
      rows.push(obj);
    }
    out.push({ header, rows });
    i = j - 1;
  }
  return out;
}

function col(row, ...names) {
  for (const n of names) {
    for (const k of Object.keys(row)) {
      if (k === '__cells') continue;
      if (k.replace(/[^a-z0-9]/g, '').includes(n.replace(/[^a-z0-9]/g, ''))) return row[k];
    }
  }
  return '';
}

function idsIn(text, kind) {
  const out = new Set();
  for (const m of stripCode(text).matchAll(ID_SCAN)) {
    if (m[1] === kind) out.add(m[0]);
  }
  return out;
}

function allIds(text) {
  const out = [];
  for (const m of stripCode(text).matchAll(ID_SCAN)) out.push({ kind: m[1], id: m[0] });
  return out;
}

// ---------- validation ----------

function validate(root, id, phase, opts = {}) {
  const issues = [];
  const add = (rule, file, message, line) => issues.push({ rule, file, message, ...(line ? { line } : {}) });

  const state = S.readState(root, id);
  if (!state) return { pass: false, issues: [{ rule: 'STATE', file: null, message: `unknown work item: ${id}` }] };
  const wf = W.load(root, state.type);
  const ph = W.getPhase(wf, phase);
  if (!ph) return { pass: false, issues: [{ rule: 'WORKFLOW', file: null, message: `phase ${phase} is not part of the ${state.type} workflow` }] };

  const folder = S.workFolder(root, state);
  const rel = S.relWorkFolder(root, state);
  const readArtifact = (name) => {
    const f = path.join(folder, name);
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
  };
  const upstream = (name) => readArtifact(name);

  const expected = W.expectedOutputs(ph, state.flags);

  // --- generic checks on every declared output -------------------------------
  for (const out of expected) {
    const file = `${rel}/${out}`;
    const text = readArtifact(out);
    if (text === null) { add('VAL-01', file, 'required artifact is missing'); continue; }
    if (!text.trim()) { add('VAL-01', file, 'artifact is empty'); continue; }

    if (out.endsWith('.md')) {
      const fm = frontMatter(text);
      if (!fm.ok) add('VAL-02', file, fm.error);
      else {
        if (fm.data.id !== state.id) add('VAL-02', file, `front matter id is "${fm.data.id}", expected "${state.id}"`);
        const base = out.replace(/\.md$/, '').split('/').pop();
        if (String(fm.data.artifact) !== base) add('VAL-02', file, `front matter artifact is "${fm.data.artifact}", expected "${base}"`);
        if (!['draft', 'final'].includes(String(fm.data.status))) add('VAL-02', file, `front matter status must be draft or final, found "${fm.data.status}"`);
        if (!Number.isInteger(fm.data.version)) add('VAL-02', file, 'front matter version must be an integer');
      }

      const tplName = TEMPLATE_FOR[out] || out.split('/').pop();
      const tplPath = path.join(S.P.templates(root), tplName);
      if (fs.existsSync(tplPath)) {
        const req = requiredHeadings(fs.readFileSync(tplPath, 'utf8'));
        const present = headings(text).map((h) => h.text.toLowerCase().replace(/[^a-z0-9]+/g, ''));
        for (const r of req) {
          if (!present.includes(r.toLowerCase().replace(/[^a-z0-9]+/g, ''))) add('VAL-03', file, `required heading missing: "${r}"`);
        }
        for (const r of req) {
          const body = sectionText(text, r);
          if (body !== null && !body.split('\n').some((l) => l.trim() && !l.trim().startsWith('<!--'))) {
            add('VAL-06', file, `section "${r}" has no content`);
          }
        }
      }

      const clean = stripCode(text);
      clean.split('\n').forEach((l, i) => {
        if (BANNED.test(l) && !l.trim().startsWith('<!--')) add('VAL-04', file, `forbidden placeholder in a final artifact: ${l.trim().slice(0, 80)}`, i + 1);
      });

      const owned = OWNS[out.split('/').pop()] || [];
      const seen = new Set();
      for (const { kind, id: tok } of allIds(text)) {
        if (seen.has(tok)) continue;
        seen.add(tok);
        if (!ID_PATTERNS[kind].test(tok)) add('VAL-05', file, `malformed ID "${tok}" — see .jarvis/core/rules/conventions.md §1`);
      }
      // IDs this artifact does not own must exist in an upstream artifact.
      const universe = upstreamIds(folder, out);
      for (const { kind, id: tok } of allIds(text)) {
        if (owned.includes(kind) || kind === 'ADR' || kind === 'Q') continue;
        if (!ID_PATTERNS[kind].test(tok)) continue;
        if (universe.size && !universe.has(tok)) add('VAL-07', file, `references ${tok}, which does not exist in any upstream artifact`);
      }
    }
  }

  // --- phase-specific traceability ------------------------------------------
  const phaseChecks = {
    requirements: () => {
      const prd = upstream('prd.md'), stories = upstream('stories.md');
      if (!prd || !stories) return;
      const frSec = sectionText(prd, 'Functional Requirements') || prd;
      const frRows = tables(frSec).flatMap((t) => t.rows).filter((r) => /^FR-\d{3}$/.test(col(r, 'id')));
      if (!frRows.length) add('REQ-02', `${rel}/prd.md`, 'no FR rows found in the Functional Requirements table');
      const must = [];
      for (const r of frRows) {
        const p = col(r, 'priority');
        if (!p) add('REQ-02', `${rel}/prd.md`, `${col(r, 'id')} has no MoSCoW priority`);
        if (/must/i.test(p)) must.push(col(r, 'id'));
      }
      // Coverage is a claim about the stories; the proof is a story's own FR refs.
      const coverage = sectionText(stories, 'Coverage');
      const storyText = stripCode(coverage ? stories.replace(coverage, '') : stories);
      for (const fr of must) {
        if (!storyText.includes(fr)) add('REQ-03', `${rel}/stories.md`, `Must requirement ${fr} is not referenced by any user story`);
      }
      if (coverage) {
        for (const r of tables(coverage).flatMap((t) => t.rows)) {
          const fr = col(r, 'fr');
          if (/^FR-\d{3}$/.test(fr) && !/US-\d{3}/.test(col(r, 'stories', 'story'))) {
            add('REQ-03', `${rel}/stories.md`, `Coverage table claims ${fr} is covered but names no story`);
          }
        }
      }
      const blocks = stories.split(/^###\s+/m).slice(1);
      for (const b of blocks) {
        const usId = (b.match(/^(US-\d{3})/) || [])[1];
        if (!usId) continue;
        if (!new RegExp(`AC-${usId.slice(3)}-\\d{2}`).test(b)) add('REQ-04', `${rel}/stories.md`, `${usId} has no acceptance criterion`);
      }
      const nfrSec = sectionText(prd, 'Non-Functional Requirements') || '';
      for (const cat of ['performance', 'security', 'log', 'retention', 'availability']) {
        if (!new RegExp(cat, 'i').test(nfrSec)) add('REQ-07', `${rel}/prd.md`, `Non-Functional Requirements is missing the ${cat} category`);
      }
    },
    'business-flow': () => {
      const stories = upstream('stories.md'), bf = upstream('business-flow.md');
      if (!stories || !bf) return;
      const text = stripCode(bf) + bf;
      for (const us of idsIn(stories, 'US')) {
        if (!text.includes(us)) add('BF-02', `${rel}/business-flow.md`, `${us} does not appear in any flow or sequence diagram`);
      }
      if (!/```mermaid/.test(bf)) add('BF-05', `${rel}/business-flow.md`, 'no mermaid diagram found');
    },
    ux: () => {
      const ux = upstream('ux-spec.md');
      if (!ux) return;
      const val = sectionText(ux, 'Field Validation') || '';
      for (const r of tables(val).flatMap((t) => t.rows)) {
        if (!/AC-\d{3}-\d{2}/.test(col(r, 'ac refs', 'acrefs', 'ac'))) {
          add('UX-03', `${rel}/ux-spec.md`, `field "${col(r, 'field')}" has no AC reference`);
        }
      }
    },
    architecture: () => {
      const spec = upstream('tech-spec.md');
      if (!spec) return;
      const prd = upstream('prd.md');
      const mapSec = sectionText(spec, 'FR → Component Mapping') || sectionText(spec, 'FR -> Component Mapping') || '';
      if (prd) {
        for (const fr of idsIn(sectionText(prd, 'Functional Requirements') || prd, 'FR')) {
          if (!mapSec.includes(fr)) add('ARC-02', `${rel}/tech-spec.md`, `${fr} is not mapped to a component`);
        }
      }
      const qim = sectionText(spec, 'Query-Index Matrix') || '';
      const rows = tables(qim).flatMap((t) => t.rows);
      if (!rows.length) add('ARC-04', `${rel}/tech-spec.md`, 'Query-Index Matrix has no rows');
      for (const r of rows) {
        if (!col(r, 'index')) add('ARC-04', `${rel}/tech-spec.md`, `Query-Index Matrix row "${col(r, 'path', 'endpoint')}" names no index`);
        if (!col(r, 'evidence')) add('ARC-04', `${rel}/tech-spec.md`, `Query-Index Matrix row "${col(r, 'path', 'endpoint')}" has no EXPLAIN evidence`);
      }
      const design = stripCode(spec);
      if (/\bJOIN\b/i.test(design) && !/ADR-\d{4}/.test(design)) add('ARC-03', `${rel}/tech-spec.md`, 'design mentions JOIN without referencing an ADR [DB-01]');
      if (/\$lookup/.test(design) && !/ADR-\d{4}/.test(design)) add('ARC-03', `${rel}/tech-spec.md`, 'design mentions $lookup without referencing an ADR [DB-10]');
      const api = path.join(folder, 'api-contract.yaml');
      if (expected.includes('api-contract.yaml') && fs.existsSync(api)) {
        try { YAML.parse(fs.readFileSync(api, 'utf8')); } catch (e) { add('ARC-11', `${rel}/api-contract.yaml`, `not valid YAML: ${e.message}`); }
      }
    },
    plan: () => {
      const plan = upstream('plan.md'), stories = upstream('stories.md');
      if (!plan) return;
      const taskRows = tables(sectionText(plan, 'Tasks') || plan).flatMap((t) => t.rows).filter((r) => /^T-\d{3}$/.test(col(r, 'id')));
      if (!taskRows.length) add('PLN-04', `${rel}/plan.md`, 'no tasks found in the Tasks table');
      for (const r of taskRows) {
        const t = col(r, 'id');
        if (!['backend', 'frontend', 'shared'].includes(col(r, 'layer').toLowerCase())) {
          add('PLN-02', `${rel}/plan.md`, `${t} layer must be backend, frontend or shared`);
        }
        if (!col(r, 'done criteria', 'donecriteria')) add('PLN-04', `${rel}/plan.md`, `${t} has no done criteria`);
        if (!col(r, 'test expectations', 'testexpectations')) add('PLN-04', `${rel}/plan.md`, `${t} has no test expectations`);
      }
      const cycle = findCycle(taskRows.map((r) => [col(r, 'id'), col(r, 'depends_on', 'dependson').split(/[\s,]+/).filter((x) => /^T-\d{3}$/.test(x))]));
      if (cycle) add('PLN-03', `${rel}/plan.md`, `task dependencies contain a cycle: ${cycle.join(' → ')}`);
      if (stories) {
        const cov = sectionText(plan, 'Coverage') || plan;
        for (const us of idsIn(stories, 'US')) {
          if (!cov.includes(us)) add('PLN-01', `${rel}/plan.md`, `${us} is not covered by any task`);
        }
      }
    },
    implement: () => {
      const plan = upstream('plan.md');
      if (plan) {
        const taskIds = [...idsIn(sectionText(plan, 'Tasks') || plan, 'T')];
        for (const t of taskIds) {
          if ((state.tasks || {})[t] !== 'done') add('IMP-04', `${rel}/plan.md`, `${t} is not marked done (jarvis.js task ${id} ${t} done)`);
        }
        const log = upstream('impl-log.md') || '';
        for (const t of taskIds) {
          if (!log.includes(t)) add('IMP-05', `${rel}/impl-log.md`, `no impl-log entry for ${t}`);
        }
      }
      if (!opts.skipCommands) {
        const layers = touchedLayers(root, state, plan);
        const res = check.run(root, { keys: (ph.deterministic_checks || []).filter((k) => layers.some((l) => k.startsWith(l)) || k === 'jarvis_lint') });
        for (const r of res.results.filter((x) => x.status === 'fail')) {
          add('IMP-01', null, `check ${r.key} failed (exit ${r.exit}): ${(r.output || '').split('\n').slice(-3).join(' ')}`);
        }
        const l = lint.run(root, { changed: true });
        for (const f of l.findings.filter((x) => ['critical', 'major'].includes(x.severity))) {
          add('IMP-03', f.file, `[${f.rule}][${f.severity}] ${f.desc}`, f.line);
        }
      }
    },
    test: () => {
      const stories = upstream('stories.md'), plan = upstream('test-plan.md'), report = upstream('test-report.md');
      if (stories && plan) {
        const tcText = plan;
        for (const ac of idsIn(stories, 'AC')) {
          if (!tcText.includes(ac)) add('TST-01', `${rel}/test-plan.md`, `${ac} has no test case`);
        }
      }
      if (report) {
        const rows = tables(sectionText(report, 'Results') || report).flatMap((t) => t.rows).filter((r) => /^TC-\d{3}$/.test(col(r, 'tc', 'id')));
        for (const r of rows) {
          if (/fail/i.test(col(r, 'result'))) add('TST-03', `${rel}/test-report.md`, `${col(r, 'tc', 'id')} is failing`);
        }
        const cov = tables(sectionText(report, 'Coverage') || '').flatMap((t) => t.rows);
        const min = S.loadConfig(root).quality.coverage_min || {};
        for (const r of cov) {
          const layer = col(r, 'layer').toLowerCase();
          const got = parseFloat(String(col(r, 'coverage')).replace('%', ''));
          if (min[layer] !== undefined && !Number.isNaN(got) && got < min[layer]) {
            add('TST-04', `${rel}/test-report.md`, `${layer} coverage ${got}% is below the configured minimum ${min[layer]}%`);
          }
        }
      }
    },
    review: () => {
      const cfg = S.loadConfig(root);
      for (const r of cfg.review.reviewers) {
        const f = path.join(folder, 'review', `${r}.md`);
        if (!fs.existsSync(f)) { add('REV-01', `${rel}/review/${r}.md`, `reviewer ${r} produced no report`); continue; }
        const text = fs.readFileSync(f, 'utf8');
        const block = text.match(/```json\s*([\s\S]*?)```/);
        if (!block) { add('REV-02', `${rel}/review/${r}.md`, 'no machine-readable JSON block found'); continue; }
        let data;
        try { data = JSON.parse(block[1]); } catch (e) { add('REV-02', `${rel}/review/${r}.md`, `JSON block does not parse: ${e.message}`); continue; }
        for (const find of data.findings || []) {
          if (!find.rule) add('REV-04', `${rel}/review/${r}.md`, `${find.id || 'finding'} cites no rule ID`);
          if (!find.file || find.line === undefined) add('REV-04', `${rel}/review/${r}.md`, `${find.id || 'finding'} has no file:line`);
          if (!['critical', 'major', 'minor', 'info'].includes(find.severity)) {
            add('REV-05', `${rel}/review/${r}.md`, `${find.id || 'finding'} has severity "${find.severity}" — see conventions.md §4`);
          }
        }
      }
      const report = upstream('review-report.md');
      if (!report) add('REV-06', `${rel}/review-report.md`, 'review-report.md missing — run jarvis.js merge-review');
      else {
        const verdict = V_SECTION(report);
        if (verdict && /\bfail\b/i.test(verdict)) add('REV-03', `${rel}/review-report.md`, 'merged verdict is fail — blocking findings are open');
      }
    },
    qa: () => {
      const qa = upstream('qa-report.md'), stories = upstream('stories.md');
      if (!qa) return;
      const matrix = sectionText(qa, 'Traceability Matrix') || '';
      if (stories) {
        for (const ac of idsIn(stories, 'AC')) {
          if (!matrix.includes(ac)) add('QA-01', `${rel}/qa-report.md`, `${ac} has no row in the traceability matrix`);
        }
      }
      for (const r of tables(matrix).flatMap((t) => t.rows)) {
        if (/^AC-\d{3}-\d{2}$/.test(col(r, 'ac')) && !/pass/i.test(col(r, 'result'))) {
          add('QA-03', `${rel}/qa-report.md`, `${col(r, 'ac')} does not have a passing test case`);
        }
      }
      const forced = S.forcedGates(state);
      const fg = sectionText(qa, 'Forced Gates') || '';
      for (const f of forced) {
        if (!fg.includes(f.phase)) add('QA-07', `${rel}/qa-report.md`, `forced gate "${f.phase}" is not listed under Forced Gates`);
      }
      if (!/go\s*\/?\s*no-?go|go:|no-go/i.test(sectionText(qa, 'Go/No-Go') || '')) {
        add('QA-06', `${rel}/qa-report.md`, 'Go/No-Go decision is not stated');
      }
    },
    release: () => {
      const notes = upstream('release-notes.md');
      if (!notes) return;
      const forced = S.forcedGates(state);
      const fg = sectionText(notes, 'Forced Gates') || '';
      for (const f of forced) {
        if (!fg.includes(f.phase)) add('REL-05', `${rel}/release-notes.md`, `forced gate "${f.phase}" is not listed under Forced Gates`);
      }
      if (state.flags.has_db_change && !fs.existsSync(path.join(folder, 'runbook.md'))) {
        add('REL-08', `${rel}/runbook.md`, 'item has a DB change but no runbook');
      }
    },
    intake: () => {
      const intake = upstream('intake.md');
      if (!intake) return;
      const flagSec = sectionText(intake, 'Flags') || '';
      for (const f of S.FLAGS) {
        if (!flagSec.includes(f)) add('INT-04', `${rel}/intake.md`, `flag ${f} is not set in the Flags table`);
        if (state.flags[f] === undefined) add('INT-04', null, `flag ${f} is not recorded in state (jarvis.js flags ${id} ${f}=true|false)`);
      }
      if (String(state.title).trim().split(/\s+/).length > 8) add('INT-05', null, `title is longer than 8 words: "${state.title}"`);
    },
  };

  if (phaseChecks[phase]) phaseChecks[phase]();

  return { pass: issues.length === 0, id, phase, issues };
}

const V_SECTION = (report) => sectionText(report, 'Verdict');

function upstreamIds(folder, exclude) {
  const set = new Set();
  if (!fs.existsSync(folder)) return set;
  for (const f of fs.readdirSync(folder)) {
    if (!f.endsWith('.md') || f === exclude) continue;
    for (const m of stripCode(fs.readFileSync(path.join(folder, f), 'utf8')).matchAll(ID_SCAN)) set.add(m[0]);
  }
  return set;
}

function touchedLayers(root, state, planText) {
  const layers = new Set();
  if (planText) {
    for (const r of tables(planText).flatMap((t) => t.rows)) {
      const l = col(r, 'layer').toLowerCase();
      if (l === 'backend' || l === 'frontend') layers.add(l);
      if (l === 'shared') { layers.add('backend'); layers.add('frontend'); }
    }
  }
  return layers.size ? [...layers] : ['backend', 'frontend'];
}

function findCycle(pairs) {
  const graph = new Map(pairs);
  const state = new Map();
  let cycle = null;
  const visit = (n, stack) => {
    if (cycle) return;
    if (state.get(n) === 'done') return;
    if (state.get(n) === 'open') { cycle = [...stack.slice(stack.indexOf(n)), n]; return; }
    state.set(n, 'open');
    for (const d of graph.get(n) || []) visit(d, [...stack, n]);
    state.set(n, 'done');
  };
  for (const [n] of pairs) visit(n, []);
  return cycle;
}

module.exports = {
  validate, frontMatter, headings, requiredHeadings, sectionText, tables, col,
  idsIn, allIds, stripCode, findCycle, ID_PATTERNS,
};
