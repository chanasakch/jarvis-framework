'use strict';
// Regex lint rules from .jarvis/standards/lint-rules.yaml (spec §12, §16.1).
// Suppression: `jarvis-ignore <RULE-ID> <ADR-ID>` on the line or the line above,
// valid only when docs/adr/<ADR-ID>-*.md exists with status `accepted`.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const YAML = require('yaml');
const S = require('./state');

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', 'coverage', '.next']);

function loadRules(root) {
  const f = path.join(S.P.standards(root), 'lint-rules.yaml');
  if (!fs.existsSync(f)) return [];
  return YAML.parse(fs.readFileSync(f, 'utf8')).rules || [];
}

// Glob -> RegExp. Supports **, *, ?, {a,b}. Paths are repo-relative with forward slashes.
function globToRegex(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // **/ consumes any number of directories, including none
        if (glob[i + 2] === '/') { out += '(?:[^/]+/)*'; i += 2; } else { out += '.*'; i += 1; }
      } else {
        out += '[^/]*';
      }
    } else if (c === '?') out += '[^/]';
    else if (c === '{') {
      const end = glob.indexOf('}', i);
      const alts = glob.slice(i + 1, end).split(',').map((a) => a.replace(/[.+^${}()|[\]\\]/g, '\\$&'));
      out += `(?:${alts.join('|')})`;
      i = end;
    } else if ('.+^$()|[]\\'.includes(c)) out += '\\' + c;
    else out += c;
  }
  return new RegExp('^' + out + '$');
}

function matchAny(file, globs) {
  return (globs || []).some((g) => globToRegex(g).test(file));
}

function compile(pattern) {
  let flags = '';
  let src = pattern;
  const m = src.match(/^\(\?([a-z]+)\)/);
  if (m) { flags = m[1].replace(/[^imsu]/g, ''); src = src.slice(m[0].length); }
  return new RegExp(src, flags);
}

function walk(root, dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(root, full, acc);
    else acc.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return acc;
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function changedFiles(root) {
  let base = 'HEAD';
  try {
    git(root, ['rev-parse', '--verify', 'origin/main']);
    base = git(root, ['merge-base', 'origin/main', 'HEAD']);
  } catch {
    try { git(root, ['rev-parse', '--verify', 'HEAD']); } catch { return walk(root, root, []); }
  }
  const out = new Set();
  try { git(root, ['diff', '--name-only', base]).split('\n').filter(Boolean).forEach((f) => out.add(f)); } catch {}
  try { git(root, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean).forEach((f) => out.add(f)); } catch {}
  return [...out].filter((f) => fs.existsSync(path.join(root, f)));
}

// An ADR suppresses a rule only when the file exists and its status is `accepted`.
function adrAccepted(root, adrId) {
  const dir = path.join(root, S.loadConfig(root).project.paths.adr);
  if (!fs.existsSync(dir)) return false;
  const hit = fs.readdirSync(dir).find((f) => f.toUpperCase().startsWith(adrId.toUpperCase()) && f.endsWith('.md'));
  if (!hit) return false;
  const text = fs.readFileSync(path.join(dir, hit), 'utf8');
  return /(^|\n)\s*(status|Status)\s*[:=]\s*accepted\b/i.test(text) || /##\s*Status\s*\n+\s*accepted\b/i.test(text);
}

const IGNORE_RE = /jarvis-ignore\s+([A-Z]+-\d+)(?:\s+(ADR-\d+))?/;

function suppression(lines, idx, ruleId) {
  for (const cand of [lines[idx], idx > 0 ? lines[idx - 1] : '']) {
    const m = (cand || '').match(IGNORE_RE);
    if (m && m[1] === ruleId) return { adr: m[2] || null };
  }
  return null;
}

function run(root, opts = {}) {
  const rules = loadRules(root).map((r) => ({ ...r, re: compile(r.pattern) }));
  let files = opts.changed ? changedFiles(root) : walk(root, root, []);
  if (opts.pathGlob) files = files.filter((f) => matchAny(f, [opts.pathGlob]));

  const findings = [];
  for (const rule of rules) {
    const targets = files.filter((f) => matchAny(f, rule.paths) && !matchAny(f, rule.exclude));
    for (const file of targets) {
      let text;
      try { text = fs.readFileSync(path.join(root, file), 'utf8'); } catch { continue; }
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        rule.re.lastIndex = 0;
        if (!rule.re.test(lines[i])) continue;
        if (IGNORE_RE.test(lines[i]) && !lines[i].replace(IGNORE_RE, '').match(rule.re)) continue;
        const sup = suppression(lines, i, rule.id);
        if (sup) {
          if (sup.adr && adrAccepted(root, sup.adr)) continue;
          findings.push({
            rule: rule.id, severity: rule.severity, file, line: i + 1,
            desc: sup.adr ? `suppression references ${sup.adr}, which does not exist or is not accepted` : 'suppression is missing an ADR ID',
            text: lines[i].trim().slice(0, 160),
          });
          continue;
        }
        findings.push({ rule: rule.id, severity: rule.severity, file, line: i + 1, desc: rule.desc, text: lines[i].trim().slice(0, 160) });
      }
    }
  }
  const blockOn = new Set(S.loadConfig(root).review.block_on || ['critical', 'major']);
  const blocking = findings.filter((f) => blockOn.has(f.severity));
  return { pass: blocking.length === 0, scanned: files.length, findings, blocking: blocking.length };
}

module.exports = { run, globToRegex, matchAny, compile, changedFiles, adrAccepted, loadRules };
