#!/usr/bin/env node
'use strict';
// Jarvis CLI (spec §16.1). Node 18+, single dependency: yaml.
// Exit codes: 0 ok · 1 fail · 2 usage error.
// Human-only commands (approve, force, skip, reopen, park, unpark) are blocked for Claude
// by .jarvis/scripts/guard.js; this file records the git user for them.

const fs = require('fs');
const path = require('path');
const S = require('./lib/state');
const W = require('./lib/workflow');
const V = require('./lib/validate');
const lint = require('./lib/lint');
const check = require('./lib/check');
const review = require('./lib/review');

const HUMAN_ONLY = ['approve', 'force', 'skip', 'reopen', 'park', 'unpark'];
// Reviewer name -> finding ID code, used to match gates.non_forceable entries such as
// `review.security.critical` against recorded issues like `[F-SEC-001][critical] ...`.
const REVIEWER_CODE = { security: 'f-sec-', performance: 'f-perf-', standards: 'f-std-', database: 'f-db-', devops: 'f-ops-' };

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 0) flags[a.slice(2, eq)] = a.slice(eq + 1);
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) flags[a.slice(2)] = argv[++i];
      else flags[a.slice(2)] = true;
    } else positional.push(a);
  }
  return { positional, flags };
}

let JSON_MODE = false;
function out(obj, human) {
  if (JSON_MODE) process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
  else process.stdout.write((typeof human === 'function' ? human(obj) : human ?? '') + '\n');
}
function fail(msg, code = 1) {
  if (JSON_MODE) process.stdout.write(JSON.stringify({ ok: false, error: msg }, null, 2) + '\n');
  else process.stderr.write(`jarvis: ${msg}\n`);
  process.exit(code);
}

function requireState(root, id) {
  const st = S.readState(root, id);
  if (!st) fail(`unknown work item: ${id}`);
  return st;
}

function statusLine(state) {
  const forced = S.forcedGates(state);
  const phases = Object.entries(state.phases).map(([k, v]) => `${k}:${v.status}`).join(' ');
  return `${state.id} ${state.title} (${state.type}) — ${state.current_phase}${forced.length ? ` ⚠️ ${forced.length} forced` : ''}\n  ${phases || 'no phases started'}`;
}

const commands = {

  new(root, { positional, flags }) {
    const [type, ...rest] = positional;
    const title = (flags.title || rest.join(' ')).trim();
    if (!type || !title) fail('usage: jarvis new <type> "<title>" [--flags k=v,...]', 2);
    const state = S.newItem(root, { type, title, flags: S.parseFlags(flags.flags), actor: S.gitUser(root) });
    out({ ok: true, id: state.id, slug: state.slug, branch: state.branch, folder: S.relWorkFolder(root, state), flags: state.flags },
      (o) => `created ${o.id} → ${o.folder}\nbranch: ${o.branch}`);
  },

  flags(root, { positional }) {
    const [id, ...pairs] = positional;
    if (!id || !pairs.length) fail('usage: jarvis flags <ID> k=v [k=v ...]', 2);
    const state = requireState(root, id);
    const before = { ...state.flags };
    Object.assign(state.flags, S.parseFlags(pairs.join(',')));
    S.writeState(root, state);
    S.audit(root, id, { actor: S.gitUser(root), action: 'flags', phase: state.current_phase, from: before, to: state.flags, detail: null });
    out({ ok: true, id, flags: state.flags }, (o) => `flags: ${Object.entries(o.flags).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  },

  next(root, { positional }) {
    const [id] = positional;
    if (!id) fail('usage: jarvis next <ID>', 2);
    const res = W.next(root, id);
    if (res.action === 'error') fail(res.message);
    out(res, (o) => {
      if (o.action === 'awaiting_approval') return `awaiting human approval for ${o.phase}\n  ${o.command}`;
      if (o.action === 'done') return `${o.id}: all phases complete`;
      if (o.action === 'blocked') return `${o.id} blocked: ${o.reason}${o.missing ? ' → ' + o.missing.join(', ') : ''}`;
      if (o.action === 'gate_failure_menu') return `${o.id} / ${o.phase}: gate failed ${o.attempts}/${o.max_retries} — print the Gate Failure Menu`;
      const who = o.owner || o.agent || (o.agents ? JSON.stringify(o.agents) : 'unassigned');
      return `run ${o.phase}${o.mode ? ` (mode: ${o.mode})` : ''} → ${who}`;
    });
  },

  status(root, { positional, flags }) {
    const [id] = positional;
    if (id) {
      const state = requireState(root, id);
      const payload = {
        id: state.id, type: state.type, title: state.title, slug: state.slug, branch: state.branch,
        current_phase: state.current_phase, flags: state.flags, phases: state.phases, tasks: state.tasks,
        warnings: W.warningLines(state), forced_gates: S.forcedGates(state), parked: state.parked || null,
        folder: S.relWorkFolder(root, state),
      };
      return out(payload, () => statusLine(state));
    }
    const items = S.listIds(root).map((i) => S.readState(root, i)).filter(Boolean);
    const active = items.filter((s) => !s.parked);
    if (flags.brief) {
      const lines = active.map((s) => {
        const f = S.forcedGates(s);
        return `${s.id} ${s.title} · ${s.current_phase}:${S.phaseStatus(s, s.current_phase)}${f.length ? ` ⚠️ ${f.length} forced` : ''}`;
      });
      // Codebase health is repo-wide, so it is reported here rather than per item.
      const h = healthState(root);
      if (h.stale && h.newest) lines.push(`⚠️ codebase health report is ${h.newest.age_days} days old — /{{name}}-health`);
      return out({ items: lines.length, lines, health: h }, () => (lines.length ? `── JARVIS ──\n${lines.join('\n')}` : '── JARVIS ── no active work items'));
    }
    out({
      items: items.map((s) => ({
        id: s.id, title: s.title, type: s.type, current_phase: s.current_phase,
        status: S.phaseStatus(s, s.current_phase), parked: !!s.parked,
        warnings: W.warningLines(s), forced_gates: S.forcedGates(s),
      })),
    }, () => (items.length ? items.map(statusLine).join('\n') : 'no work items'));
  },

  // Cross-work-item dependency edge. The PM view is built from these plus state.
  link(root, { positional, flags }) {
    const [id] = positional;
    const dep = typeof flags['depends-on'] === 'string' ? flags['depends-on'] : null;
    if (!id || !dep) fail('usage: jarvis link <ID> --depends-on <ID> [--remove]', 2);
    if (id === dep) fail('a work item cannot depend on itself', 2);
    const state = requireState(root, id);
    requireState(root, dep);
    const before = (state.depends_on || []).slice();
    const set = new Set(before);
    if (flags.remove) set.delete(dep); else set.add(dep);
    state.depends_on = [...set].sort();

    const cycle = dependencyCycle(root, state);
    if (cycle) {
      fail(`that link creates a dependency cycle: ${cycle.join(' → ')}`, 2);
    }
    S.writeState(root, state);
    S.audit(root, id, { actor: S.gitUser(root), action: 'link', phase: state.current_phase, from: before, to: state.depends_on, detail: { dep, removed: !!flags.remove } });
    out({ ok: true, id, depends_on: state.depends_on },
      (o) => `${o.id} depends on: ${o.depends_on.join(', ') || 'nothing'}`);
  },

  // Codebase-health reports (the Lead/Staff view). Reports live outside any work item,
  // so this command only locates them and reports staleness; {{name}}-staff writes them.
  health(root, { flags }) {
    const res = healthState(root);
    out(res, (o) => o.message);
    if (flags.strict && res.stale) process.exit(1);
  },

  // Portfolio / roadmap view across every active work item (the PM view).
  // Every number here is read from .jarvis/state and the work folders — nothing is inferred.
  portfolio(root, { flags }) {
    const cfg = S.loadConfig(root);
    const all = S.listIds(root).map((i) => S.readState(root, i)).filter(Boolean);
    const now = Date.now();
    const byId = new Map(all.map((s) => [s.id, s]));

    const items = all.map((state) => {
      const wf = (() => { try { return W.load(root, state.type); } catch { return null; } })();
      const phase = state.current_phase;
      const status = S.phaseStatus(state, phase);
      const done = wf ? wf.phases.every((p) => S.isUnlocked(S.phaseStatus(state, p.id), W.approvalRequired(cfg, p))) : false;
      const folder = S.workFolder(root, state);
      const blockedBy = (state.depends_on || []).filter((d) => {
        const dep = byId.get(d);
        if (!dep) return true;
        const dwf = (() => { try { return W.load(root, dep.type); } catch { return null; } })();
        return !dwf || !dwf.phases.every((p) => S.isUnlocked(S.phaseStatus(dep, p.id), W.approvalRequired(cfg, p)));
      });
      return {
        id: state.id,
        title: state.title,
        type: state.type,
        phase,
        status,
        done,
        parked: state.parked ? state.parked.reason : null,
        age_days: Math.floor((now - new Date(state.created_at).getTime()) / 86400000),
        idle_days: idleDays(root, state, now),
        forced_gates: S.forcedGates(state).map((f) => f.phase),
        open_questions: scanIds(folder, /\bQ-\d{3}\b/g),
        risks: scanIds(folder, /\bR-\d{3}\b/g),
        depends_on: state.depends_on || [],
        blocked_by: blockedBy,
        files: planFiles(folder),
      };
    });

    const active = items.filter((i) => !i.done && !i.parked);
    const overlaps = fileOverlaps(active);
    const attention = [];
    for (const i of active) {
      if (i.blocked_by.length) attention.push(`${i.id} is waiting on ${i.blocked_by.join(', ')}`);
      if (i.forced_gates.length) attention.push(`${i.id} has ${i.forced_gates.length} forced gate(s): ${i.forced_gates.join(', ')}`);
      if (i.status === 'blocked') attention.push(`${i.id} is blocked at ${i.phase}`);
      if (i.idle_days >= 14) attention.push(`${i.id} has not moved in ${i.idle_days} days`);
    }
    for (const o of overlaps) attention.push(`${o.items.join(' and ')} both plan to change ${o.file}`);

    const res = {
      generated_at: new Date().toISOString(),
      counts: {
        total: items.length,
        active: active.length,
        parked: items.filter((i) => i.parked).length,
        done: items.filter((i) => i.done).length,
      },
      items, overlaps, attention,
    };
    out(res, () => renderPortfolio(res));
  },

  set(root, { positional }) {
    const [id, phase, status] = positional;
    if (!id || !phase || !status) fail('usage: jarvis set <ID> <phase> <in_progress|passed|gate_failed|blocked>', 2);
    if (!S.SETTABLE.has(status)) {
      fail(`set cannot assign "${status}". Allowed: ${[...S.SETTABLE].join(', ')}. approved/forced/skipped are human-only commands.`, 2);
    }
    const state = requireState(root, id);
    const wf = W.load(root, state.type);
    if (!W.getPhase(wf, phase)) fail(`phase ${phase} is not part of the ${state.type} workflow`, 2);
    const p = S.setPhase(root, state, phase, status, null, 'claude');
    out({ ok: true, id, phase, status, attempts: p.attempts || 0 }, (o) => `${o.id} ${o.phase} → ${o.status}`);
  },

  task(root, { positional }) {
    const [id, task, status] = positional;
    if (!id || !task || !status) fail('usage: jarvis task <ID> <T-xxx> <pending|in_progress|done>', 2);
    const state = requireState(root, id);
    const from = (state.tasks || {})[task] || 'pending';
    state.tasks = state.tasks || {};
    state.tasks[task] = status;
    S.writeState(root, state);
    S.audit(root, id, { actor: 'claude', action: 'task', phase: 'implement', from, to: status, detail: { task } });
    out({ ok: true, id, task, status }, (o) => `${o.task} → ${o.status}`);
  },

  validate(root, { positional, flags }) {
    const [id, phase] = positional;
    if (!id || !phase) fail('usage: jarvis validate <ID> <phase>', 2);
    const res = V.validate(root, id, phase, { skipCommands: !!flags['skip-commands'] });
    out(res, (o) => (o.pass ? `validate ${o.id}/${o.phase}: PASS` :
      `validate ${o.id}/${o.phase}: FAIL\n` + o.issues.map((i) => `  [${i.rule}] ${i.file || ''}${i.line ? ':' + i.line : ''} ${i.message}`).join('\n')));
    if (!res.pass) process.exit(1);
  },

  'merge-review'(root, { positional }) {
    const [id] = positional;
    if (!id) fail('usage: jarvis merge-review <ID>', 2);
    const state = requireState(root, id);
    const res = review.merge(root, id);
    if (res.verdict === 'fail') {
      const wf = W.load(root, state.type);
      const ph = W.getPhase(wf, 'review');
      const target = ph.on_fail || 'implement';
      S.setPhase(root, state, 'review', 'gate_failed', { issues: res.blocking.map((f) => `[${f.id}][${f.severity}] ${f.issue}`) }, 'claude');
      const fresh = S.readState(root, id);
      fresh.tasks = fresh.tasks || {};
      for (const t of res.fix_tasks) fresh.tasks[t.task] = 'pending';
      delete fresh.phases[target];
      fresh.current_phase = target;
      S.writeState(root, fresh);
      S.audit(root, id, { actor: 'claude', action: 'review_loop_back', phase: 'review', from: 'in_progress', to: target, detail: { fix_tasks: res.fix_tasks.map((t) => t.task) } });
    }
    out(res, (o) => `verdict: ${o.verdict} → ${o.report}` + (o.fix_tasks.length ? `\nfix tasks: ${o.fix_tasks.map((t) => t.task).join(', ')}` : ''));
    if (res.verdict === 'fail') process.exit(1);
  },

  lint(root, { flags }) {
    const res = lint.run(root, { changed: !!flags.changed, pathGlob: typeof flags.path === 'string' ? flags.path : null });
    out(res, (o) => (o.pass ? `lint: PASS (${o.scanned} files, ${o.findings.length} non-blocking finding(s))` :
      `lint: FAIL (${o.blocking} blocking)\n` + o.findings.map((f) => `  [${f.rule}][${f.severity}] ${f.file}:${f.line} ${f.desc}`).join('\n')));
    if (!res.pass) process.exit(1);
  },

  check(root, { positional }) {
    const layer = positional[0] || 'all';
    if (!['backend', 'frontend', 'all'].includes(layer)) fail('usage: jarvis check <backend|frontend|all>', 2);
    const res = check.run(root, { layer });
    out(res, (o) => o.results.map((r) => `  ${r.status.padEnd(7)} ${r.key}${r.reason ? ' (' + r.reason + ')' : ''}`).join('\n') + `\ncheck ${o.layer}: ${o.pass ? 'PASS' : 'FAIL'}`);
    if (!res.pass) process.exit(1);
  },

  doctor(root) {
    const cfg = S.loadConfig(root);
    const { execSync } = require('child_process');
    const tool = (name, cmd, hint) => {
      try { execSync(cmd, { stdio: 'ignore' }); return { name, ok: true }; }
      catch { return { name, ok: false, hint }; }
    };
    const tools = [
      tool('node', 'node -v'),
      tool('git', 'git --version'),
      tool('go', 'go version', 'https://go.dev/dl/'),
      tool('golangci-lint', 'golangci-lint --version', 'brew install golangci-lint'),
      tool('govulncheck', 'govulncheck -version', 'go install golang.org/x/vuln/cmd/govulncheck@latest'),
      tool('docker', 'docker info', 'needed for testcontainers integration tests'),
    ];
    const paths = Object.entries(cfg.project.paths).map(([k, p]) => ({ key: k, path: p, exists: fs.existsSync(path.join(root, p)) }));
    const framework = [
      '.jarvis/core/rules/conventions.md', '.jarvis/core/rules/orchestration.md',
      '.jarvis/standards/lint-rules.yaml', '.jarvis/core/workflows/feature.yaml',
    ].map((p) => ({ path: p, exists: fs.existsSync(path.join(root, p)) }));
    let registry = { path: cfg.project.paths.error_registry, exists: false, codes: 0, duplicates: [] };
    const regPath = path.join(root, cfg.project.paths.error_registry);
    if (fs.existsSync(regPath)) {
      const YAML = require('yaml');
      const entries = YAML.parse(fs.readFileSync(regPath, 'utf8')) || [];
      const seen = new Set(), dup = [];
      for (const e of entries) { if (seen.has(e.code)) dup.push(e.code); seen.add(e.code); }
      registry = { path: cfg.project.paths.error_registry, exists: true, codes: entries.length, duplicates: dup };
    }
    const problems = [...framework.filter((f) => !f.exists).map((f) => `missing ${f.path}`), ...registry.duplicates.map((c) => `duplicate error code ${c}`)];
    const res = { ok: problems.length === 0, tools, paths, framework, registry, problems };
    out(res, (o) => [
      'tools:    ' + o.tools.map((t) => `${t.ok ? '✅' : '❌'} ${t.name}`).join('  '),
      'paths:    ' + o.paths.map((p) => `${p.exists ? '✅' : '·'} ${p.key}`).join('  '),
      `registry: ${o.registry.exists ? `✅ ${o.registry.codes} codes` : '❌ missing'}`,
      o.problems.length ? 'problems:\n  ' + o.problems.join('\n  ') : 'no problems',
      ...o.tools.filter((t) => !t.ok && t.hint).map((t) => `hint: ${t.name} → ${t.hint}`),
    ].join('\n'));
    if (!res.ok) process.exit(1);
  },

  // ---------------- human-only ----------------

  approve(root, { positional }) {
    const [id, phase] = positional;
    if (!id || !phase) fail('usage: jarvis approve <ID> <phase>', 2);
    const state = requireState(root, id);
    const st = S.phaseStatus(state, phase);
    if (st !== 'passed') fail(`cannot approve ${phase}: status is "${st}", expected "passed"`);
    const actor = S.gitUser(root);
    S.setPhase(root, state, phase, 'approved', { approved_by: actor, approved_at: new Date().toISOString() }, actor);
    out({ ok: true, id, phase, approved_by: actor }, (o) => `approved ${o.id} ${o.phase} (${o.approved_by})`);
  },

  force(root, { positional, flags }) {
    const [id, phase] = positional;
    if (!id || !phase) fail('usage: jarvis force <ID> <phase> --reason "<why>" [--accept-risk]', 2);
    const cfg = S.loadConfig(root);
    if (!cfg.gates.allow_force) fail('gates.allow_force is false in jarvis.config.yaml');
    const reason = typeof flags.reason === 'string' ? flags.reason.trim() : '';
    if (cfg.gates.force_requires_reason && !reason) fail('--reason "<why>" is mandatory when forcing a gate', 2);
    const state = requireState(root, id);

    const issues = (state.phases[phase] && state.phases[phase].issues) || [];
    const hitsNonForceable = (cfg.gates.non_forceable || [])
      .filter((k) => k.split('.')[0] === phase)
      .filter((key) => {
        const parts = key.split('.');
        // phase.condition (e.g. qa.acceptance_failed): the whole phase is non-forceable.
        if (parts.length < 3) return true;
        const [, reviewer, severity] = parts;
        // phase.reviewer.severity (e.g. review.security.critical): only that class of
        // finding is non-forceable. With no recorded issues the gate cannot be proven
        // safe, so it is treated as a hit.
        if (!issues.length) return true;
        return issues.some((i) => {
          const s = String(i).toLowerCase();
          return s.includes(`[${severity}]`) && s.includes(REVIEWER_CODE[reviewer] || reviewer);
        });
      });
    if (hitsNonForceable.length && !flags['accept-risk']) {
      fail(`${phase} hits gates.non_forceable (${hitsNonForceable.join(', ')}). Re-run with --accept-risk in addition to --reason.`, 1);
    }

    const actor = S.gitUser(root);
    const unresolved = issues.map((i) => {
      const m = String(i).match(/\[(F-[A-Z]+-\d+|[A-Z]+-\d+)\]/);
      return m ? m[1] : String(i).slice(0, 60);
    });

    // Follow-up chore item carrying the unresolved issues.
    const follow = S.newItem(root, {
      type: 'chore',
      title: `Follow-up for forced ${phase} on ${id}`,
      flags: {},
      actor,
    });
    fs.writeFileSync(path.join(S.workFolder(root, follow), 'intake.md'), followUpIntake(follow, state, phase, reason, unresolved));

    S.setPhase(root, state, phase, 'forced', {
      forced_by: actor, forced_at: new Date().toISOString(), reason,
      accepted_risk: !!flags['accept-risk'], unresolved, follow_up: follow.id,
    }, actor);
    const fresh = S.readState(root, id);
    S.addWarning(root, fresh, `${phase} gate forced by ${actor}: ${reason}`);
    S.audit(root, id, { actor, action: 'force', phase, from: 'gate_failed', to: 'forced', detail: { reason, unresolved, follow_up: follow.id, accept_risk: !!flags['accept-risk'] } });

    out({ ok: true, id, phase, forced_by: actor, reason, unresolved, follow_up: follow.id, hits_non_forceable: hitsNonForceable },
      (o) => `⚠️  forced ${o.id} ${o.phase} (${o.forced_by})\nreason: ${o.reason}\nunresolved: ${o.unresolved.join(', ') || 'none'}\nfollow-up: ${o.follow_up}`);
  },

  skip(root, { positional, flags }) {
    const [id, phase] = positional;
    if (!id || !phase) fail('usage: jarvis skip <ID> <phase> --reason "<why>"', 2);
    const reason = typeof flags.reason === 'string' ? flags.reason.trim() : '';
    if (!reason) fail('--reason "<why>" is mandatory', 2);
    const state = requireState(root, id);
    const ph = W.getPhase(W.load(root, state.type), phase);
    if (!ph) fail(`phase ${phase} is not part of the ${state.type} workflow`, 2);
    if (!ph.optional_if_false) fail(`${phase} is not an optional phase and cannot be skipped`);
    const actor = S.gitUser(root);
    S.setPhase(root, state, phase, 'skipped', { reason, skipped_by: actor }, actor);
    out({ ok: true, id, phase, reason }, (o) => `skipped ${o.id} ${o.phase}`);
  },

  reopen(root, { positional, flags }) {
    const [id, phase] = positional;
    if (!id || !phase) fail('usage: jarvis reopen <ID> <phase>', 2);
    const state = requireState(root, id);
    const order = W.phaseOrder(W.load(root, state.type));
    if (!order.includes(phase)) fail(`phase ${phase} is not part of the ${state.type} workflow`, 2);
    const actor = S.gitUser(root);
    const reset = S.reopenFrom(root, state, phase, order, actor, typeof flags.reason === 'string' ? flags.reason : null);
    out({ ok: true, id, phase, reset }, (o) => `reopened ${o.id} from ${o.phase} (reset: ${o.reset.join(', ') || 'none'})`);
  },

  park(root, { positional, flags }) {
    const [id] = positional;
    if (!id) fail('usage: jarvis park <ID> --reason "<why>"', 2);
    const reason = typeof flags.reason === 'string' ? flags.reason.trim() : '';
    if (!reason) fail('--reason "<why>" is mandatory', 2);
    const state = requireState(root, id);
    const actor = S.gitUser(root);
    state.parked = { by: actor, at: new Date().toISOString(), reason };
    S.writeState(root, state);
    S.addWarning(root, state, `parked: ${reason}`);
    S.audit(root, id, { actor, action: 'park', phase: state.current_phase, from: 'active', to: 'parked', detail: { reason } });
    out({ ok: true, id, parked: state.parked }, (o) => `parked ${o.id}`);
  },

  unpark(root, { positional }) {
    const [id] = positional;
    if (!id) fail('usage: jarvis unpark <ID>', 2);
    const state = requireState(root, id);
    const actor = S.gitUser(root);
    delete state.parked;
    state.warnings = (state.warnings || []).filter((w) => !w.startsWith('parked:'));
    S.writeState(root, state);
    S.audit(root, id, { actor, action: 'unpark', phase: state.current_phase, from: 'parked', to: 'active', detail: null });
    out({ ok: true, id }, (o) => `unparked ${o.id}`);
  },

  // ---------------- CI (spec §18) ----------------

  ci(root, { flags }) {
    const base = typeof flags.base === 'string' ? flags.base : 'origin/main';
    const problems = [];
    const lintRes = lint.run(root, { changed: true });
    for (const f of lintRes.findings.filter((x) => ['critical', 'major'].includes(x.severity))) {
      problems.push(`lint [${f.rule}] ${f.file}:${f.line} ${f.desc}`);
    }
    const cfg = S.loadConfig(root);
    const regPath = path.join(root, cfg.project.paths.error_registry);
    if (fs.existsSync(regPath)) {
      const YAML = require('yaml');
      let entries = [];
      try { entries = YAML.parse(fs.readFileSync(regPath, 'utf8')) || []; }
      catch (e) { problems.push(`error registry is not valid YAML: ${e.message}`); }
      const seen = new Set();
      for (const e of entries) {
        for (const k of ['code', 'public', 'http', 'level', 'description']) {
          if (e[k] === undefined) problems.push(`registry entry ${e.code || '?'} is missing "${k}"`);
        }
        if (seen.has(e.code)) problems.push(`duplicate error code ${e.code}`);
        seen.add(e.code);
      }
    }
    const branch = currentBranch(root);
    const m = branch && branch.match(/([A-Z]+-\d{3})/);
    const items = m ? [m[1]] : [];
    const itemReports = [];
    for (const id of items) {
      const state = S.readState(root, id);
      if (!state) { problems.push(`branch names ${id} but .jarvis/state/${id}.json does not exist`); continue; }
      const wf = W.load(root, state.type);
      const open = [];
      for (const ph of wf.phases) {
        const st = S.phaseStatus(state, ph.id);
        if (!['approved', 'passed', 'forced', 'skipped'].includes(st)) open.push(`${ph.id}:${st}`);
      }
      if (open.length) problems.push(`${id} has phases not approved/passed/forced/skipped: ${open.join(', ')}`);
      itemReports.push({ id, open, forced_gates: S.forcedGates(state) });
    }
    const res = { ok: problems.length === 0, base, branch, items: itemReports, lint: { findings: lintRes.findings.length, blocking: lintRes.blocking }, problems };
    out(res, (o) => (o.ok ? `ci: PASS (base ${o.base})` : `ci: FAIL\n  ${o.problems.join('\n  ')}`));
    if (!res.ok) process.exit(1);
  },

  help(root, a) { commands.__help(root, a); },

  __help(root) {
    const text = [
      'jarvis <command> [args] [--json]',
      '',
      'Claude + human:',
      '  new <type> "<title>" [--flags k=v,...]   create a work item',
      '  flags <ID> k=v ...                       set intake flags',
      '  next <ID>                                resolve the next action',
      '  status [ID] [--brief]                    status, warnings, forced gates',
      '  portfolio                                every active item: phase, age, deps, risks, overlaps',
      '  link <ID> --depends-on <ID> [--remove]   record a cross-item dependency',
      '  health [--strict]                        codebase health report age (see /{{name}}-health)',
      '  set <ID> <phase> <status>                in_progress | passed | gate_failed | blocked',
      '  task <ID> <T-xxx> <status>               update a task',
      '  validate <ID> <phase>                    script gate',
      '  merge-review <ID>                        merge reviewer reports into review-report.md',
      '  lint [--changed] [--path <glob>]         standards lint rules',
      '  check <backend|frontend|all>             configured check commands',
      '  doctor                                   tools, paths, registry',
      '  ci [--base <ref>]                        PR gate',
      '',
      'Human only (Claude is blocked by guard.js — ask the user to run these):',
      '  approve <ID> <phase>',
      '  force <ID> <phase> --reason "<why>" [--accept-risk]',
      '  skip <ID> <phase> --reason "<why>"',
      '  reopen <ID> <phase>',
      '  park <ID> --reason "<why>" | unpark <ID>',
    ].join('\n');
    out({ commands: Object.keys(commands).filter((c) => !c.startsWith('__')), human_only: HUMAN_ONLY, usage: text }, text);
  },
};

// ---------------- codebase health ----------------

// Locates the dated reports {{name}}-staff writes and decides whether the newest is stale.
// A repo that has never run one is reported, but not warned about on every status.
function healthState(root) {
  const cfg = S.loadConfig(root);
  const maxAge = (cfg.staff_review && cfg.staff_review.max_age_days) || 30;
  const dir = path.join(root, 'docs', 'architecture', 'health');
  const reports = (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .reverse()
    .map((f) => {
      const date = f.replace(/\.md$/, '');
      return {
        date,
        path: `docs/architecture/health/${f}`,
        age_days: Math.floor((Date.now() - new Date(`${date}T00:00:00Z`).getTime()) / 86400000),
      };
    });
  const newest = reports[0] || null;
  const stale = !newest || newest.age_days > maxAge;
  return {
    ok: !stale,
    stale,
    max_age_days: maxAge,
    newest,
    reports,
    register: fs.existsSync(path.join(root, 'docs/architecture/tech-debt.md')) ? 'docs/architecture/tech-debt.md' : null,
    message: !newest ? 'no codebase health report yet — run /{{name}}-health'
      : stale ? `newest health report is ${newest.age_days} days old (max ${maxAge}) — run /{{name}}-health`
        : `health report ${newest.date} is ${newest.age_days} days old`,
  };
}

// ---------------- portfolio helpers ----------------

// Depth-first walk over depends_on, returning the cycle if the proposed state creates one.
function dependencyCycle(root, proposed) {
  const load = (id) => (id === proposed.id ? proposed : S.readState(root, id));
  const seen = new Map();
  let cycle = null;
  const visit = (id, stack) => {
    if (cycle) return;
    if (seen.get(id) === 'done') return;
    if (seen.get(id) === 'open') { cycle = [...stack.slice(stack.indexOf(id)), id]; return; }
    seen.set(id, 'open');
    const st = load(id);
    for (const d of (st && st.depends_on) || []) visit(d, [...stack, id]);
    seen.set(id, 'done');
  };
  visit(proposed.id, []);
  return cycle;
}

// Days since the most recent phase transition; falls back to creation.
function idleDays(root, state, now) {
  let last = new Date(state.created_at).getTime();
  for (const p of Object.values(state.phases || {})) {
    for (const k of ['approved_at', 'forced_at', 'at', 'updated_at']) {
      const t = p[k] ? new Date(p[k]).getTime() : NaN;
      if (!Number.isNaN(t) && t > last) last = t;
    }
  }
  try {
    const f = S.P.auditFile(root, state.id);
    const lines = fs.readFileSync(f, 'utf8').trim().split('\n');
    const t = new Date(JSON.parse(lines[lines.length - 1]).ts).getTime();
    if (!Number.isNaN(t) && t > last) last = t;
  } catch { /* no audit log yet */ }
  return Math.floor((now - last) / 86400000);
}

// Distinct IDs of a kind across a work folder's artifacts.
function scanIds(folder, re) {
  const out = new Set();
  if (!fs.existsSync(folder)) return [];
  for (const f of fs.readdirSync(folder)) {
    if (!f.endsWith('.md')) continue;
    for (const m of fs.readFileSync(path.join(folder, f), 'utf8').matchAll(re)) out.add(m[0]);
  }
  return [...out].sort();
}

// Source files a work item's plan.md says it will touch, for overlap warnings.
function planFiles(folder) {
  const f = path.join(folder, 'plan.md');
  if (!fs.existsSync(f)) return [];
  const out = new Set();
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/\b((?:apps|packages|internal|cmd|src|infra|deploy)\/[A-Za-z0-9._\/-]+\.[A-Za-z]{1,5})\b/g)) out.add(m[1]);
  return [...out].sort();
}

function fileOverlaps(items) {
  const owners = new Map();
  for (const i of items) for (const f of i.files) {
    if (!owners.has(f)) owners.set(f, []);
    owners.get(f).push(i.id);
  }
  return [...owners.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([file, ids]) => ({ file, items: ids.sort() }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

function renderPortfolio(res) {
  const pad = (s, n) => String(s).padEnd(n);
  const lines = ['── PORTFOLIO ──────────────────────────────────────────────'];
  const active = res.items.filter((i) => !i.done && !i.parked);
  if (!active.length) lines.push('no active work items');
  else {
    lines.push(`${pad('ID', 10)} ${pad('type', 12)} ${pad('phase', 15)} ${pad('status', 12)} ${pad('age', 5)} waiting on`);
    for (const i of active) {
      lines.push(`${pad(i.id, 10)} ${pad(i.type, 12)} ${pad(i.phase, 15)} ${pad(i.status, 12)} ${pad(i.age_days + 'd', 5)} ${i.blocked_by.join(', ') || '—'}`);
    }
  }
  const parked = res.items.filter((i) => i.parked);
  if (parked.length) {
    lines.push('', 'Parked:');
    for (const i of parked) lines.push(`  ${i.id} — ${i.parked}`);
  }
  lines.push('', `Totals: ${res.counts.active} active · ${res.counts.parked} parked · ${res.counts.done} done`);
  lines.push('', res.attention.length ? 'Needs attention:' : 'Needs attention: none');
  for (const a of res.attention) lines.push(`  ⚠️  ${a}`);
  lines.push('───────────────────────────────────────────────────────────');
  return lines.join('\n');
}

function currentBranch(root) {
  try {
    return require('child_process').execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch { return null; }
}

function followUpIntake(follow, origin, phase, reason, unresolved) {
  return [
    '---', `id: ${follow.id}`, 'artifact: intake', 'version: 1', 'status: final', `refs: [${origin.id}]`, '---', '',
    `# Intake — ${follow.title}`, '',
    '## Request',
    `Resolve the issues left open when the ${phase} gate of ${origin.id} was forced.`, '',
    '## Work Type',
    'chore — follow-up created automatically by `jarvis force`; no new behavior.', '',
    '## Flags',
    '| flag | value | source |', '|---|---|---|',
    ...S.FLAGS.map((f) => `| ${f} | ${origin.flags[f] === true} | inherited from ${origin.id} |`), '',
    '## Initial Scope',
    `In scope: ${unresolved.length ? unresolved.join(', ') : 'the forced gate issues'}.`,
    `Out of scope: any change not required to close those issues.`,
    `Force reason recorded on ${origin.id}: ${reason}`, '',
    '## Open Questions',
    '| ID | question | owner |', '|---|---|---|',
    '| Q-001 | Is the forced risk still acceptable, or should this be prioritised now? | product |', '',
  ].join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const rest = parseArgs(argv.slice(1));
  JSON_MODE = !!rest.flags.json;
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { commands.__help(); return; }
  const root = S.repoRoot(rest.flags.root || process.cwd());
  const fn = commands[cmd];
  if (!fn) fail(`unknown command: ${cmd}\nRun "jarvis help" for the command list.`, 2);
  try {
    fn(root, rest);
  } catch (e) {
    fail(e.message, 1);
  }
}

if (require.main === module) main();
module.exports = { parseArgs, commands };
