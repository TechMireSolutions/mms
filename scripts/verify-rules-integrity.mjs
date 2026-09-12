#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const cursorRulesDir = path.join(ROOT, '.cursor/rules');
const skillsDir = path.join(ROOT, '.agent/skills');
const manifestPath = path.join(ROOT, '.agent/skills-manifest.json');
const claudeMdPath = path.join(ROOT, 'CLAUDE.md');
const agentsMdPath = path.join(ROOT, 'AGENTS.md');

let errors = 0;

function fail(msg) {
  console.error(`❌ [RULE INTEGRITY ERROR] ${msg}`);
  errors++;
}

function pass(msg) {
  console.log(`✅ ${msg}`);
}

// 1. Check skill counts and parity
const diskSkills = fs.readdirSync(skillsDir).filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory());
if (diskSkills.length !== 30) {
  fail(`Expected 30 skills on disk, found ${diskSkills.length}`);
} else {
  pass(`Skill count on disk: ${diskSkills.length}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!manifest.skills || manifest.skills.length !== 30) {
  fail(`Expected 30 skills in skills-manifest.json, found ${manifest.skills?.length}`);
} else {
  pass(`Skill count in manifest: ${manifest.skills.length}`);
}

const claudeMd = fs.readFileSync(claudeMdPath, 'utf8');
if (!claudeMd.includes(`Skills (${diskSkills.length})`)) {
  fail(`CLAUDE.md skill count header does not match ${diskSkills.length}`);
} else {
  pass(`CLAUDE.md matches skill count (${diskSkills.length})`);
}

const agentsMd = fs.readFileSync(agentsMdPath, 'utf8');
if (!agentsMd.includes(`${diskSkills.length} capability modules`)) {
  fail(`AGENTS.md does not match ${diskSkills.length} capability modules`);
} else {
  pass(`AGENTS.md matches skill count (${diskSkills.length})`);
}

// 2. Check always_on rules parity
const alwaysOnExpected = [
  'rules/antigravity-global.md',
  'rules/mms-core.md',
  'rules/mms-migration-status.md',
  'rules/mms-completion-review.md',
  'rules/mms-performance.md'
];

const manifestAlwaysOn = manifest.rules?.always_on || [];
for (const rule of alwaysOnExpected) {
  if (!manifestAlwaysOn.includes(rule)) {
    fail(`Missing always_on rule in skills-manifest.json: ${rule}`);
  }
}
pass(`All 5 always-on rules present in skills-manifest.json`);

// 3. Check rule cross-references and sections
const ruleFiles = fs.readdirSync(cursorRulesDir).filter(f => f.endsWith('.mdc'));
const ruleHeadings = new Map();

for (const file of ruleFiles) {
  const content = fs.readFileSync(path.join(cursorRulesDir, file), 'utf8');
  const headings = content.split('\n')
    .filter(line => line.startsWith('#'))
    .map(line => line.trim());
  ruleHeadings.set(file, headings);
}

for (const file of ruleFiles) {
  const content = fs.readFileSync(path.join(cursorRulesDir, file), 'utf8');
  
  // Check section references like mms-foo.mdc §X
  const sectionMatches = content.matchAll(/([a-zA-Z0-9_-]+\.mdc)[`\]\s]*?(§\s*(\d+))/gi);
  for (const match of sectionMatches) {
    const targetFile = match[1];
    const sectionNum = match[3];
    const headings = ruleHeadings.get(targetFile);
    if (!headings) {
      fail(`In ${file}: references unknown rule ${targetFile}`);
      continue;
    }
    const hasSection = headings.some(h => {
      const secRegex = new RegExp(`(^#+\\s*${sectionNum}\\.|§\\s*${sectionNum}\\b)`, 'i');
      return secRegex.test(h);
    });
    if (!hasSection) {
      fail(`In ${file}: referenced section §${sectionNum} does not exist in ${targetFile}`);
    }
  }

  // Check file paths mentioned in backticks
  const pathMatches = content.matchAll(/`((apps|packages|scripts|docs|\.agent|\.cursor|\.github)\/[^`]+)`/g);
  for (const m of pathMatches) {
    let p = m[1].split('#')[0].split('?')[0];
    if (p.includes('*') || p.includes('...') || p.includes('{') || p.includes('[')) continue;
    if (!fs.existsSync(path.join(ROOT, p))) {
      fail(`In ${file}: referenced path does not exist on disk: ${p}`);
    }
  }
}

if (errors === 0) {
  pass(`All rule cross-references and section citations are valid!`);
  console.log('\n✨ All rules integrity checks passed successfully.\n');
  process.exit(0);
} else {
  console.error(`\n💥 Rule integrity check failed with ${errors} error(s).\n`);
  process.exit(1);
}
