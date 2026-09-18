#!/usr/bin/env node
'use strict';
// Rebuild jarvis-framework/ (the distributable package) from this repo (spec §18).
// Run from the repo root after changing any framework-owned file:
//   node .jarvis/scripts/pack.js
//
// Framework-owned files go to framework/ and are replaced on every `upgrade`.
// Project-owned files go to project-templates/ and are only written when absent on `init`.
//
// {{name}} placeholders replace the USER-FACING prefix only: slash commands, agent names and
// the npm script. Internal paths (.jarvis/, jarvis.config.yaml, jarvis.js) keep their names,
// because jarvis.config.yaml documents `name` as "prefix for commands/agents".

const fs = require('fs');
const path = require('path');

const R = process.cwd();
const PKG = path.join(R, 'jarvis-framework');

const ROLES = [
  'gatekeeper', 'analyst', 'po', 'ba', 'ux', 'investigator', 'architect', 'planner',
  'dev-backend', 'dev-frontend', 'tester',
  'review-standards', 'review-performance', 'review-security', 'review-database',
  'qa', 'release',
];

// Slash command suffixes. Bare /{{name}} is handled separately, with a guard so that
// `/jarvis-ignore` and `scripts/jarvis.js` are left alone.
const COMMANDS = ['-explain', '-status', '-review', '-init', '-help', '-gate', '-new', '-run'];

const FRAMEWORK = [
  '.claude/agents', '.claude/commands',
  '.jarvis/core', '.jarvis/scripts', '.jarvis/package.json',
];
const PROJECT = [
  'jarvis.config.yaml', 'CLAUDE.md',
  '.jarvis/standards', '.jarvis/project/context.md',
  'packages/errors/registry.yaml', 'docs/architecture/query-index-matrix.md',
];
// Written by hand inside the package, never copied back from this repo.
const PACKAGE_OWNED = new Set(['framework/.claude/settings.json']);

function walk(rel, out = []) {
  const abs = path.join(R, rel);
  if (!fs.existsSync(abs)) return out;
  if (fs.statSync(abs).isFile()) { out.push(rel); return out; }
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.DS_Store') continue;
    walk(rel + '/' + e.name, out);
  }
  return out;
}

function templatize(text, rel) {
  let t = text;
  // jarvis.config.yaml documents `name` as the command/agent prefix; the installer sets it.
  if (rel === 'jarvis.config.yaml') t = t.replace(/^(\s{2}name:\s*)jarvis\b/m, '$1{{name}}');
  for (const role of ROLES) t = t.split(`jarvis-${role}`).join(`{{name}}-${role}`);
  // Slash commands, by exact name first, then bare /{{name}} with a terminator guard.
  // An open-ended /{{name}} rule would also rewrite `/jarvis-ignore` inside a regex
  // literal and `scripts/jarvis.js` inside a path.
  for (const c of COMMANDS) t = t.split(`/{{name}}${c}`).join(`/{{name}}${c}`);
  t = t.replace(/\/{{name}}(?![\w.-])/g, '/{{name}}');
  t = t.replace(/npm run (-s )?jarvis --/g, (m, s) => `npm run ${s || ''}{{name}} --`);
  return t;
}

function outPath(rel) {
  // .claude/agents/{{name}}-po.md -> .claude/agents/{{name}}-po.md
  return rel.replace(/(\.claude\/(?:agents|commands)\/)jarvis/, '$1{{name}}');
}

function copy(rel, destRoot, stats) {
  const src = path.join(R, rel);
  const dst = path.join(destRoot, outPath(rel));
  if (PACKAGE_OWNED.has(path.relative(PKG, dst).split(path.sep).join('/'))) { stats.kept++; return; }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (/\.(md|ya?ml|json|js|txt)$/.test(rel)) fs.writeFileSync(dst, templatize(fs.readFileSync(src, 'utf8'), rel));
  else fs.copyFileSync(src, dst);
  stats.written++;
}

function main() {
  if (!fs.existsSync(path.join(R, 'jarvis.config.yaml'))) {
    console.error('run pack.js from the repo root');
    process.exit(2);
  }
  const stats = { written: 0, kept: 0 };
  // Clear only the generated trees; hand-written package files stay.
  for (const d of ['framework/.claude/agents', 'framework/.claude/commands', 'framework/.jarvis', 'project-templates/.jarvis', 'project-templates/packages', 'project-templates/docs']) {
    fs.rmSync(path.join(PKG, d), { recursive: true, force: true });
  }
  for (const rel of FRAMEWORK.flatMap((p) => walk(p))) copy(rel, path.join(PKG, 'framework'), stats);
  for (const rel of PROJECT.flatMap((p) => walk(p))) copy(rel, path.join(PKG, 'project-templates'), stats);

  const version = fs.readFileSync(path.join(R, '.jarvis', 'VERSION'), 'utf8').trim();
  fs.writeFileSync(path.join(PKG, 'VERSION'), version + '\n');

  const count = (d) => (fs.existsSync(path.join(PKG, d)) ? walk(path.relative(R, path.join(PKG, d)).split(path.sep).join('/')).length : 0);
  console.log(`packed jarvis-framework ${version}`);
  console.log(`  framework/          ${count('framework')} files (replaced on upgrade)`);
  console.log(`  project-templates/  ${count('project-templates')} files (written only when absent)`);
  console.log(`  files written       ${stats.written}, package-owned kept ${stats.kept}`);
}

main();
