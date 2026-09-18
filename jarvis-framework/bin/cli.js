#!/usr/bin/env node
'use strict';
// Jarvis installer (spec §18).
//   init --name <name> [--dir <path>]   install into a repo; never overwrites project-owned files
//   upgrade [--dir <path>]              replace framework-owned files only, print a diff summary
//
// Ownership:
//   framework/          -> framework-owned. Replaced wholesale on upgrade.
//   project-templates/  -> project-owned. Written only when the file does not already exist.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PKG = path.resolve(__dirname, '..');
const FRAMEWORK = path.join(PKG, 'framework');
const PROJECT = path.join(PKG, 'project-templates');
const VERSION = fs.readFileSync(path.join(PKG, 'VERSION'), 'utf8').trim();

function parseArgs(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      flags[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    } else rest.push(argv[i]);
  }
  return { flags, rest };
}

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

const TEXT = /\.(md|ya?ml|json|js|txt|gitignore)$|(^|\/)CODEOWNERS$/;
const render = (text, name) => text.split('{{name}}').join(name);
const renderPath = (p, name) => p.split('{{name}}').join(name);
const hash = (buf) => crypto.createHash('sha1').update(buf).digest('hex');

function copyFile(srcAbs, dstAbs, name) {
  fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
  if (TEXT.test(srcAbs)) fs.writeFileSync(dstAbs, render(fs.readFileSync(srcAbs, 'utf8'), name));
  else fs.copyFileSync(srcAbs, dstAbs);
}

function readName(target) {
  const cfg = path.join(target, 'jarvis.config.yaml');
  if (fs.existsSync(cfg)) {
    const m = fs.readFileSync(cfg, 'utf8').match(/^\s{2}name:\s*(\S+)/m);
    if (m) return m[1];
  }
  return 'jarvis';
}

function addNpmScript(target, name) {
  const f = path.join(target, 'package.json');
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, JSON.stringify({ name: path.basename(target), private: true, scripts: { [name]: 'node .jarvis/scripts/jarvis.js' } }, null, 2) + '\n');
    return `created package.json with the "${name}" script`;
  }
  const pkg = JSON.parse(fs.readFileSync(f, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  if (pkg.scripts[name]) return `package.json already has a "${name}" script — left untouched`;
  pkg.scripts[name] = 'node .jarvis/scripts/jarvis.js';
  fs.writeFileSync(f, JSON.stringify(pkg, null, 2) + '\n');
  return `added the "${name}" script to package.json`;
}

function ensureGitignore(target) {
  const f = path.join(target, '.gitignore');
  const line = '.claude/settings.local.json';
  const cur = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  if (cur.includes(line)) return 'gitignore already covers .claude/settings.local.json';
  fs.writeFileSync(f, (cur && !cur.endsWith('\n') ? cur + '\n' : cur) + line + '\n');
  return 'added .claude/settings.local.json to .gitignore';
}

function init({ flags }) {
  const name = typeof flags.name === 'string' ? flags.name : 'jarvis';
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error(`--name must be lowercase letters, digits and hyphens (got "${name}")`);
    process.exit(2);
  }
  const target = path.resolve(typeof flags.dir === 'string' ? flags.dir : process.cwd());
  const report = { framework: [], project: [], skipped: [], notes: [] };

  for (const rel of walk(FRAMEWORK)) {
    const dst = path.join(target, renderPath(rel, name));
    copyFile(path.join(FRAMEWORK, rel), dst, name);
    report.framework.push(renderPath(rel, name));
  }
  for (const rel of walk(PROJECT)) {
    const out = renderPath(rel, name);
    const dst = path.join(target, out);
    if (fs.existsSync(dst)) { report.skipped.push(out); continue; }
    copyFile(path.join(PROJECT, rel), dst, name);
    report.project.push(out);
  }

  fs.mkdirSync(path.join(target, '.jarvis', 'state'), { recursive: true });
  fs.mkdirSync(path.join(target, 'docs', 'work'), { recursive: true });
  fs.mkdirSync(path.join(target, 'docs', 'adr'), { recursive: true });
  fs.writeFileSync(path.join(target, '.jarvis', 'VERSION'), VERSION + '\n');
  report.notes.push(addNpmScript(target, name), ensureGitignore(target));

  console.log(`Jarvis ${VERSION} installed into ${target} as "${name}".\n`);
  console.log(`framework files written : ${report.framework.length}`);
  console.log(`project files created   : ${report.project.length}`);
  console.log(`project files kept      : ${report.skipped.length}${report.skipped.length ? ' (' + report.skipped.slice(0, 5).join(', ') + (report.skipped.length > 5 ? ', …' : '') + ')' : ''}`);
  report.notes.forEach((n) => console.log(`- ${n}`));
  console.log(`
Next:
  1. cd .jarvis && npm install        # installs the single dependency, yaml
  2. node .jarvis/scripts/jarvis.js doctor
  3. Restart Claude Code so it loads the hooks, agents and commands
  4. Run /${name}-init to scan this repo and write .jarvis/project/context.md
`);
}

function upgrade({ flags }) {
  const target = path.resolve(typeof flags.dir === 'string' ? flags.dir : process.cwd());
  if (!fs.existsSync(path.join(target, '.jarvis'))) {
    console.error(`no .jarvis directory in ${target} — run "init" first`);
    process.exit(2);
  }
  const name = readName(target);
  const from = fs.existsSync(path.join(target, '.jarvis', 'VERSION'))
    ? fs.readFileSync(path.join(target, '.jarvis', 'VERSION'), 'utf8').trim() : 'unknown';

  const added = [], updated = [], unchanged = [];
  const shipped = new Set();
  for (const rel of walk(FRAMEWORK)) {
    const out = renderPath(rel, name);
    shipped.add(out);
    const dst = path.join(target, out);
    const src = path.join(FRAMEWORK, rel);
    const next = TEXT.test(src) ? Buffer.from(render(fs.readFileSync(src, 'utf8'), name)) : fs.readFileSync(src);
    if (!fs.existsSync(dst)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, next); added.push(out); continue; }
    if (hash(fs.readFileSync(dst)) === hash(next)) { unchanged.push(out); continue; }
    fs.writeFileSync(dst, next);
    updated.push(out);
  }

  // Framework-owned files this version no longer ships are reported, never deleted:
  // a team may have added its own agent or command alongside ours.
  const orphans = [];
  for (const dir of ['.claude/agents', '.claude/commands', '.jarvis/core']) {
    const abs = path.join(target, dir);
    if (!fs.existsSync(abs)) continue;
    for (const rel of walk(abs, target)) if (!shipped.has(rel)) orphans.push(rel);
  }

  fs.writeFileSync(path.join(target, '.jarvis', 'VERSION'), VERSION + '\n');

  console.log(`Jarvis ${from} → ${VERSION} in ${target} (prefix "${name}")\n`);
  console.log(`updated   ${String(updated.length).padStart(3)}`);
  updated.forEach((f) => console.log(`  ~ ${f}`));
  console.log(`added     ${String(added.length).padStart(3)}`);
  added.forEach((f) => console.log(`  + ${f}`));
  console.log(`unchanged ${String(unchanged.length).padStart(3)}`);
  if (orphans.length) {
    console.log(`\nnot shipped by this version (left in place — delete them yourself if they are stale):`);
    orphans.forEach((f) => console.log(`  ? ${f}`));
  }
  console.log(`
Project-owned files were not touched: jarvis.config.yaml, CLAUDE.md,
.jarvis/standards/**, .jarvis/project/**, packages/errors/registry.yaml.

Next:
  node .jarvis/scripts/audit.js     # confirms the upgrade left the framework consistent
  node --test ".jarvis/scripts/test/*.test.js"
  Restart Claude Code.
`);
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (cmd === 'init') return init(args);
  if (cmd === 'upgrade') return upgrade(args);
  console.log(`jarvis-framework ${VERSION}

  init --name <name> [--dir <path>]   install into a repo (project-owned files are never overwritten)
  upgrade [--dir <path>]              replace framework-owned files only, print a diff summary

<name> is the prefix for slash commands and agents: --name ops gives /ops, /ops-init and ops-architect.`);
  process.exit(cmd ? 2 : 0);
}

main();
