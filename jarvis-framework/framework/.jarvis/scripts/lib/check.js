'use strict';
// Deterministic checks: run the commands configured in jarvis.config.yaml (spec §16.1).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const S = require('./state');

// `cd apps/api && ...` is only runnable when apps/api exists; otherwise the check is
// reported as `skipped`, not `fail`, so the framework works before the app exists.
function requiredDir(cmd) {
  const m = cmd.match(/^cd\s+([^\s&|;]+)/);
  if (m) return m[1];
  const w = cmd.match(/-w\s+([^\s]+)/);
  return w ? w[1] : null;
}

function runOne(root, key, cmd, timeoutMs) {
  const dir = requiredDir(cmd);
  if (dir && !fs.existsSync(path.join(root, dir))) {
    return { key, command: cmd, status: 'skipped', reason: `${dir} does not exist`, exit: null, output: '' };
  }
  const started = Date.now();
  try {
    const out = execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: timeoutMs || 600000 });
    return { key, command: cmd, status: 'pass', exit: 0, ms: Date.now() - started, output: tail(out) };
  } catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}` || String(e.message);
    if (/not found|ENOENT|command not found/i.test(out) && !/\n/.test(out.trim())) {
      return { key, command: cmd, status: 'skipped', reason: 'tool not installed', exit: e.status ?? null, output: tail(out) };
    }
    return { key, command: cmd, status: 'fail', exit: e.status ?? 1, ms: Date.now() - started, output: tail(out) };
  }
}

function tail(s, n = 40) {
  const lines = String(s).trim().split('\n');
  return lines.slice(-n).join('\n');
}

function commandsFor(cfg, layer) {
  const out = [];
  const add = (group) => {
    for (const [name, cmd] of Object.entries(cfg.commands[group] || {})) out.push([`${group}.${name}`, cmd]);
  };
  if (layer === 'backend' || layer === 'all') add('backend');
  if (layer === 'frontend' || layer === 'all') add('frontend');
  if (layer === 'all' && cfg.commands.jarvis_lint) out.push(['jarvis_lint', cfg.commands.jarvis_lint]);
  return out;
}

// Run one or more configured commands. `keys` selects specific entries such as
// ['backend.lint','frontend.test'] (used by a phase's deterministic_checks).
function run(root, { layer, keys, only }) {
  const cfg = S.loadConfig(root);
  let pairs;
  if (keys && keys.length) {
    pairs = keys.map((k) => {
      const [g, n] = k.split('.');
      const cmd = n ? (cfg.commands[g] || {})[n] : cfg.commands[g];
      return cmd ? [k, cmd] : null;
    }).filter(Boolean);
  } else {
    pairs = commandsFor(cfg, layer || 'all');
  }
  if (only && only.length) pairs = pairs.filter(([k]) => only.includes(k.split('.').pop()));

  const results = pairs.map(([k, cmd]) => runOne(root, k, cmd));
  const failed = results.filter((r) => r.status === 'fail');
  return {
    pass: failed.length === 0,
    layer: layer || null,
    results,
    failed: failed.map((r) => r.key),
    skipped: results.filter((r) => r.status === 'skipped').map((r) => r.key),
  };
}

module.exports = { run, runOne, commandsFor, requiredDir };
