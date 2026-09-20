'use strict';
// Workflow resolution: which phase runs next, with what inputs (spec §4, §9 step 3).

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const S = require('./state');

function load(root, type) {
  const f = path.join(S.P.workflows(root), `${type}.yaml`);
  if (!fs.existsSync(f)) throw new Error(`no workflow for type: ${type}`);
  return YAML.parse(fs.readFileSync(f, 'utf8'));
}

function phaseOrder(wf) {
  return wf.phases.map((p) => p.id);
}

function getPhase(wf, id) {
  return wf.phases.find((p) => p.id === id);
}

// Effective approval for a phase: the workflow overrides gates.human_approval.
function approvalRequired(cfg, phase) {
  if (phase.approval !== undefined && phase.approval !== null) return phase.approval === 'human';
  return (cfg.gates.human_approval || []).includes(phase.id);
}

// Agents that run for a phase. `conditional_agents: { <flag>: [agent, ...] }` appends an
// agent only when that intake flag is true, so a flag-gated reviewer (devops) is absent
// from the run entirely rather than running and reporting "nothing to review".
function agentsFor(phase, flags) {
  const base = phase.agent ? [phase.agent]
    : Array.isArray(phase.agents) ? phase.agents.slice()
      : phase.agents && typeof phase.agents === 'object' ? Object.values(phase.agents)
        : [];
  for (const [flag, list] of Object.entries(phase.conditional_agents || {})) {
    if (!flags || flags[flag] !== true) continue;
    for (const a of list) if (!base.includes(a)) base.push(a);
  }
  return base;
}

// Reviewer short names for a review phase, flag-aware: `{{name}}-review-security` -> `security`.
// This is what must have produced a report, not the static jarvis.config.yaml list.
function reviewersFor(phase, flags) {
  return agentsFor(phase, flags)
    .filter((a) => a.includes('-review-'))
    .map((a) => a.replace(/^.*-review-/, ''));
}

function expectedOutputs(phase, flags) {
  const out = (phase.outputs || []).slice();
  for (const [flag, files] of Object.entries(phase.conditional_outputs || {})) {
    if (flags && flags[flag]) out.push(...files);
  }
  return out;
}

function toRel(root, state, files) {
  const base = S.relWorkFolder(root, state);
  return files.map((f) => (f.includes('/') && !f.startsWith('review/') ? f : `${base}/${f}`));
}

function inputPaths(root, state, phase) {
  const base = S.relWorkFolder(root, state);
  const list = (phase.inputs || []).map((f) => `${base}/${f}`);
  list.push('.jarvis/project/context.md');
  // Only list inputs that exist; an optional upstream phase may have been skipped.
  return list.filter((f) => fs.existsSync(path.join(root, f)));
}

function standardPaths(phase) {
  return (phase.standards || []).map((f) => `.jarvis/standards/${f}`);
}

function pendingTasks(state) {
  return Object.entries(state.tasks || {})
    .filter(([, st]) => st !== 'done')
    .map(([id, st]) => ({ id, status: st }));
}

// Resolve the next action for a work item (spec §9 step 3).
function next(root, id) {
  const state = S.readState(root, id);
  if (!state) return { action: 'error', message: `unknown work item: ${id}` };
  const cfg = S.loadConfig(root);
  const wf = load(root, state.type);
  const warnings = warningLines(state);

  if (state.parked) {
    return { action: 'blocked', id, reason: 'parked', detail: state.parked, warnings };
  }

  for (const phase of wf.phases) {
    const st = S.phaseStatus(state, phase.id);
    const needsApproval = approvalRequired(cfg, phase);

    // Optional phase whose flag is false: auto-skip once, then move on.
    if (phase.optional_if_false && state.flags[phase.optional_if_false] !== true) {
      if (st !== 'skipped') {
        S.setPhase(root, state, phase.id, 'skipped', { reason: `flag ${phase.optional_if_false} is not true` }, 'system');
      }
      continue;
    }

    if (S.isUnlocked(st, needsApproval)) continue;

    if (st === 'passed' && needsApproval) {
      return {
        action: 'awaiting_approval',
        id,
        phase: phase.id,
        command: `! npm run -s {{name}} -- approve ${id} ${phase.id}`,
        warnings,
      };
    }

    const missing = (phase.requires || []).filter((r) => {
      const rp = getPhase(wf, r);
      if (!rp) return true;
      return !S.isUnlocked(S.phaseStatus(state, r), approvalRequired(cfg, rp));
    });
    if (missing.length) {
      return { action: 'blocked', id, phase: phase.id, reason: 'requires not met', missing, warnings };
    }

    const attempts = (state.phases[phase.id] && state.phases[phase.id].attempts) || 0;
    if (attempts >= cfg.gates.max_retries) {
      return {
        action: 'gate_failure_menu',
        id,
        phase: phase.id,
        attempts,
        max_retries: cfg.gates.max_retries,
        issues: (state.phases[phase.id] && state.phases[phase.id].issues) || [],
        non_forceable: cfg.gates.non_forceable || [],
        warnings,
      };
    }

    return {
      action: 'run_phase',
      id,
      type: state.type,
      title: state.title,
      phase: phase.id,
      owner: phase.owner || null,
      agent: phase.agent || null,
      agents: phase.agents || null,
      conditional_agents: phase.conditional_agents || null,
      // Flag-resolved: what the orchestrator actually delegates to this phase.
      agents_resolved: agentsFor(phase, state.flags),
      mode: phase.mode || null,
      loop: phase.loop || null,
      parallel: !!phase.parallel,
      blocking_reviewers: phase.blocking_reviewers || null,
      on_fail: phase.on_fail || null,
      requires: phase.requires || [],
      flags: state.flags,
      inputs: inputPaths(root, state, phase),
      outputs: toRel(root, state, expectedOutputs(phase, state.flags)),
      templates: (phase.template || []).map((t) => `.jarvis/core/templates/${t}`),
      checklist: phase.checklist ? `.jarvis/core/checklists/${phase.checklist}` : null,
      standards: standardPaths(phase),
      reviewer_standards: phase.reviewer_standards || null,
      deterministic_checks: phase.deterministic_checks || [],
      approval: needsApproval ? 'human' : 'none',
      attempts,
      work_folder: S.relWorkFolder(root, state),
      tasks: phase.loop === 'per_task' ? pendingTasks(state) : undefined,
      previous_gate_issues: (state.phases[phase.id] && state.phases[phase.id].issues) || [],
      warnings,
    };
  }

  return { action: 'done', id, phase: null, warnings, summary: summarize(state) };
}

function warningLines(state) {
  const out = state.warnings ? state.warnings.slice() : [];
  const forced = S.forcedGates(state);
  if (forced.length) {
    out.unshift(`${state.id} has ${forced.length} forced gate(s): ${forced.map((f) => f.phase).join(', ')}`);
  }
  if ((state.depends_on || []).length) {
    out.push(`${state.id} depends on: ${state.depends_on.join(', ')} — see jarvis.js portfolio`);
  }
  return out;
}

function summarize(state) {
  return Object.fromEntries(Object.entries(state.phases).map(([k, v]) => [k, v.status]));
}

module.exports = {
  load, phaseOrder, getPhase, approvalRequired, agentsFor, reviewersFor, expectedOutputs,
  inputPaths, standardPaths, next, warningLines, summarize, toRel, pendingTasks,
};
