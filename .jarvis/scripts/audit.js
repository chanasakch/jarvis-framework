#!/usr/bin/env node
'use strict';
// Framework consistency audit (JARVIS_BUILD_PROMPTS step 15).
// Run from the repo root: node .jarvis/scripts/audit.js
// Exit 0 when every check passes, 1 otherwise. Re-run after editing anything in
// .jarvis/core, .jarvis/standards or .claude — an upgrade should leave this green.
const fs=require('fs'), path=require('path');
const YAML=require('yaml');
const R=process.cwd();
const ex=p=>fs.existsSync(path.join(R,p));
const read=p=>fs.readFileSync(path.join(R,p),'utf8');
const walk=(d,a=[])=>{for(const e of fs.readdirSync(path.join(R,d),{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=d+'/'+e.name;e.isDirectory()?walk(p,a):a.push(p.replace(/^\.\//,''));}return a;};
const results=[];
const check=(name,problems,fix)=>results.push({name,ok:problems.length===0,problems,fix:fix||''});

// framework files to scan
const FW=[...walk('.jarvis/core'),...walk('.jarvis/standards'),...walk('.claude'),...walk('.jarvis/scripts').filter(f=>!f.includes('/test/'))]
  .filter(f=>/\.(md|ya?ml|js)$/.test(f));

// 1. every referenced path exists
{
  const bad=[];
  const RE=/(?:^|[\s`'"(\[])((?:\.jarvis|\.claude|docs|packages|apps)\/[A-Za-z0-9._\/*-]+\.(?:md|yaml|yml|json|jsx?|tsx?|go|sql))/g;
  // Generated files legitimately do not exist until their codegen step runs.
  const GENERATED=/\.gen\.(go|ts)$/;
  for(const f of FW){
    const t=read(f);
    for(const m of t.matchAll(RE)){
      const p=m[1];
      if(p.includes('*')||p.includes('<')) continue;
      if(p.startsWith('apps/')||p.startsWith('docs/work/')||p.startsWith('docs/adr/ADR-')) continue; // example paths
      if(GENERATED.test(p)||/FEAT-\d+|BUG-\d+|CHR-\d+/.test(p)) continue; // codegen output and example IDs
      if(!ex(p)) bad.push(`${f} → ${p}`);
    }
  }
  check('1. Referenced framework paths exist',[...new Set(bad)]);
}

// 2. workflow agents exist + tools match spec
{
  const bad=[];
  const agents=new Set(fs.readdirSync(path.join(R,'.claude/agents')).map(f=>f.replace('.md','')));
  for(const w of fs.readdirSync(path.join(R,'.jarvis/core/workflows')).filter(f=>f.endsWith('.yaml'))){
    const y=YAML.parse(read('.jarvis/core/workflows/'+w));
    for(const p of y.phases){
      const list=[p.agent, ...(Array.isArray(p.agents)?p.agents:Object.values(p.agents||{}))].filter(Boolean);
      for(const a of list) if(!agents.has(a)) bad.push(`${w}:${p.id} → ${a}`);
    }
  }
  const SPEC_TOOLS={
    'jarvis-gatekeeper':'Read, Grep, Glob','jarvis-analyst':'Read, Write, Glob, Grep','jarvis-po':'Read, Write, Glob, Grep',
    'jarvis-ba':'Read, Write, Glob, Grep','jarvis-ux':'Read, Write, Glob, Grep','jarvis-investigator':'Read, Write, Glob, Grep, Bash',
    'jarvis-architect':'Read, Write, Glob, Grep','jarvis-planner':'Read, Write, Glob, Grep',
    'jarvis-dev-backend':'Read, Write, Edit, Glob, Grep, Bash','jarvis-dev-frontend':'Read, Write, Edit, Glob, Grep, Bash',
    'jarvis-tester':'Read, Write, Edit, Glob, Grep, Bash','jarvis-review-standards':'Read, Grep, Glob, Bash',
    'jarvis-review-performance':'Read, Grep, Glob, Bash','jarvis-review-security':'Read, Grep, Glob, Bash',
    'jarvis-review-database':'Read, Grep, Glob, Bash','jarvis-qa':'Read, Write, Glob, Grep, Bash','jarvis-release':'Read, Write, Glob, Grep, Bash',
    'jarvis-devops':'Read, Write, Glob, Grep','jarvis-review-devops':'Read, Grep, Glob, Bash','jarvis-staff':'Read, Write, Glob, Grep, Bash'};
  const MODELS={'jarvis-gatekeeper':'opus','jarvis-architect':'opus','jarvis-review-security':'opus','jarvis-release':'haiku','jarvis-staff':'opus'};
  for(const [a,tools] of Object.entries(SPEC_TOOLS)){
    if(!agents.has(a)){bad.push('missing agent file '+a);continue;}
    const t=read('.claude/agents/'+a+'.md');
    const got=(t.match(/^tools:\s*(.*)$/m)||[])[1];
    if(got!==tools) bad.push(`${a} tools "${got}" ≠ spec "${tools}"`);
    const m=(t.match(/^model:\s*(.*)$/m)||[])[1];
    const want=MODELS[a]||'inherit';
    if(m!==want) bad.push(`${a} model "${m}" ≠ config "${want}"`);
  }
  check('2. Workflow agents exist; tools and models match spec+config',bad);
}

// 3. templates referenced exist and have required markers
{
  const bad=[];
  for(const w of fs.readdirSync(path.join(R,'.jarvis/core/workflows')).filter(f=>f.endsWith('.yaml'))){
    const y=YAML.parse(read('.jarvis/core/workflows/'+w));
    for(const p of y.phases) for(const t of (p.template||[])){
      const tp='.jarvis/core/templates/'+t;
      if(!ex(tp)){bad.push(`${w}:${p.id} → ${t} missing`);continue;}
      if(!/<!--\s*required\s*-->/.test(read(tp))) bad.push(`${t} has no <!-- required --> marker`);
    }
  }
  for(const t of fs.readdirSync(path.join(R,'.jarvis/core/templates'))){
    const txt=read('.jarvis/core/templates/'+t);
    if(!/^---\n/.test(txt)) bad.push(`${t} has no front matter block`);
    const marks=[...txt.matchAll(/^#{1,6}\s+.+<!--.*?-->\s*$/gm)];
    for(const m of marks) if(!/<!-- required -->$/.test(m[0])) bad.push(`${t}: non-standard marker "${m[0].trim()}"`);
  }
  check('3. Templates exist, have front matter and required markers',bad);
}

// 4. checklist IDs unique; every referenced checklist exists
{
  const bad=[], seen=new Map();
  for(const c of fs.readdirSync(path.join(R,'.jarvis/core/checklists'))){
    for(const m of read('.jarvis/core/checklists/'+c).matchAll(/^- \[ \] ([A-Z]{2,3}-\d{2})/gm)){
      if(seen.has(m[1])) bad.push(`${m[1]} in both ${seen.get(m[1])} and ${c}`);
      seen.set(m[1],c);
    }
  }
  for(const w of fs.readdirSync(path.join(R,'.jarvis/core/workflows')).filter(f=>f.endsWith('.yaml'))){
    const y=YAML.parse(read('.jarvis/core/workflows/'+w));
    for(const p of y.phases) if(p.checklist && !ex('.jarvis/core/checklists/'+p.checklist)) bad.push(`${w}:${p.id} → ${p.checklist} missing`);
  }
  check(`4. Checklist item IDs unique (${seen.size} items); referenced checklists exist`,bad);
}

// 5. every rule ID cited in agents/checklists/commands exists in standards
{
  const defined=new Set();
  for(const s of fs.readdirSync(path.join(R,'.jarvis/standards')).filter(f=>f.endsWith('.md')))
    for(const m of read('.jarvis/standards/'+s).matchAll(/^###\s+([A-Z]+-\d{2})\s/gm)) defined.add(m[1]);
  const PREFIX=/^(STR|GO|RX|API|DB|CACHE|PERF|SEC|ERR|LOG|TEST|DOC|GIT|OPS)$/;
  const bad=[];
  for(const f of [...walk('.claude'),...walk('.jarvis/core/checklists')].filter(x=>x.endsWith('.md'))){
    for(const m of read(f).matchAll(/\[([A-Z]+)-(\d{2})\]/g)){
      if(!PREFIX.test(m[1])) continue;
      const id=`${m[1]}-${m[2]}`;
      if(!defined.has(id)) bad.push(`${f} cites ${id}, not defined in .jarvis/standards/`);
    }
  }
  check(`5. Cited rule IDs exist (${defined.size} rules defined)`,[...new Set(bad)]);
}

// 6. severity defined only in conventions.md
{
  const bad=[];
  const DEF=/^-\s+\*\*(critical|major|minor|info)\*\*\s+—/m;
  for(const f of FW.filter(x=>x.endsWith('.md'))){
    if(f==='.jarvis/core/rules/conventions.md') continue;
    if(DEF.test(read(f))) bad.push(`${f} redefines severity instead of referencing conventions.md §4`);
  }
  if(!DEF.test(read('.jarvis/core/rules/conventions.md'))) bad.push('conventions.md does not define severity');
  check('6. Severity defined once, in conventions.md',bad);
}

// 7. config keys used by scripts exist in jarvis.config.yaml
{
  const cfg=YAML.parse(read('jarvis.config.yaml'));
  const get=(o,p)=>p.split('.').reduce((a,k)=>a&&a[k],o);
  const used=new Set();
  for(const f of walk('.jarvis/scripts').filter(x=>x.endsWith('.js')&&!x.includes('/test/'))){
    const t=read(f);
    for(const m of t.matchAll(/cfg\.([a-z_]+)\.([a-z_]+)(?:\.([a-z_]+))?/g)) used.add([m[1],m[2],m[3]].filter(Boolean).join('.'));
    for(const m of t.matchAll(/loadConfig\(root\)\.([a-z_]+)\.([a-z_]+)/g)) used.add(`${m[1]}.${m[2]}`);
  }
  const bad=[...used].filter(k=>get(cfg,k)===undefined).map(k=>`scripts read cfg.${k}, absent from jarvis.config.yaml`);
  check(`7. Config keys used by scripts exist (${used.size} keys read)`,bad);
}

// 8. tests
{
  const {execSync}=require('child_process');
  let out='';
  try{ out=execSync('node --test ".jarvis/scripts/test/*.test.js" 2>&1',{encoding:'utf8'}); }
  catch(e){ out=(e.stdout||'')+(e.stderr||''); }
  const pass=(out.match(/^ℹ pass (\d+)$/m)||[])[1];
  const fail=(out.match(/^ℹ fail (\d+)$/m)||[])[1];
  check(`8. Script tests (${pass} pass, ${fail} fail)`, fail==='0'?[]:[`${fail} failing tests`]);
}

// 9. always-loaded context size
{
  const claude=read('CLAUDE.md'), conv=read('.jarvis/core/rules/conventions.md'), ctx=read('.jarvis/project/context.md');
  const chars=claude.length+conv.length+ctx.length;
  const tokens=Math.round(chars/4);
  check(`9. Always-loaded context ≈ ${tokens} tokens (CLAUDE.md ${Math.round(claude.length/4)} + conventions ${Math.round(conv.length/4)} + context ${Math.round(ctx.length/4)})`,
    tokens>3000?[`${tokens} tokens exceeds the 3k budget`]:[]);
}

// print
console.log('| check | result | problems |');
console.log('|---|---|---|');
for(const r of results) console.log(`| ${r.name} | ${r.ok?'✅ pass':'❌ '+r.problems.length} | ${r.ok?'—':r.problems.slice(0,4).join('; ')+(r.problems.length>4?` … +${r.problems.length-4}`:'')} |`);
const total=results.filter(r=>!r.ok).length;
console.log('\nFAILING CHECKS:',total);
for(const r of results.filter(x=>!x.ok)) { console.log('\n## '+r.name); r.problems.forEach(p=>console.log('  - '+p)); }
process.exit(total===0?0:1);
