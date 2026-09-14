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

const ruleFiles = fs.readdirSync(cursorRulesDir).filter(f => f.endsWith('.mdc'));

// 2. Check always_on rules parity.
//
// The canonical set is derived from .cursor/rules/*.mdc FRONTMATTER, because
// `alwaysApply: true` is what Cursor actually honours. Previously this section
// compared the manifest against a hardcoded array — a third source of truth that
// could itself drift — and never checked CLAUDE.md or AGENTS.md at all, so
// CLAUDE.md silently listed five always-on rules while only three carried
// `alwaysApply: true`.
const frontmatterAlwaysOn = ruleFiles
  .filter((file) => {
    const content = fs.readFileSync(path.join(cursorRulesDir, file), 'utf8');
    return /^alwaysApply:\s*true\s*$/m.test(content);
  })
  .map((file) => `rules/${file.replace(/\.mdc$/, '.md')}`)
  .sort();

const manifestAlwaysOn = [...(manifest.rules?.always_on || [])].sort();

const alwaysOnMismatch =
  frontmatterAlwaysOn.length !== manifestAlwaysOn.length ||
  frontmatterAlwaysOn.some((rule, index) => rule !== manifestAlwaysOn[index]);

if (alwaysOnMismatch) {
  fail(
    'Always-on rules disagree between .cursor/rules frontmatter and skills-manifest.json\n' +
      `     frontmatter (alwaysApply: true): ${frontmatterAlwaysOn.join(', ') || '(none)'}\n` +
      `     skills-manifest.json:            ${manifestAlwaysOn.join(', ') || '(none)'}`,
  );
} else {
  pass(`Always-on rules match frontmatter (${frontmatterAlwaysOn.length})`);
}

// CLAUDE.md must list exactly the same always-on rules.
// The list sits in the section introduced by the "Always-on rules" heading, so
// scope the search to that section rather than guessing at line offsets.
const claudeAlwaysOnSection =
  claudeMd.split(/^## /m).find((section) => /^Always-on rules/i.test(section)) ?? '';

// Only count backticked names that correspond to real rule files, so unrelated
// inline code (paths, commands) in the section cannot be misread as a rule.
const knownRuleNames = new Set(ruleFiles.map((file) => file.replace(/\.mdc$/, '')));
const claudeAlwaysOn = [
  ...new Set([...claudeAlwaysOnSection.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1])),
]
  .filter((name) => knownRuleNames.has(name))
  .map((name) => `rules/${name}.md`)
  .sort();

const claudeMismatch =
  claudeAlwaysOn.length !== frontmatterAlwaysOn.length ||
  claudeAlwaysOn.some((rule, index) => rule !== frontmatterAlwaysOn[index]);

if (claudeMismatch) {
  fail(
    'CLAUDE.md always-on list does not match frontmatter\n' +
      `     CLAUDE.md:   ${claudeAlwaysOn.join(', ') || '(not found)'}\n` +
      `     frontmatter: ${frontmatterAlwaysOn.join(', ')}`,
  );
} else {
  pass(`CLAUDE.md always-on list matches frontmatter (${claudeAlwaysOn.length})`);
}

// AGENTS.md must mention every always-on rule in its always-on section.
const agentsAlwaysOnSection = agentsMd.split(/^## /m).find((section) => /^Always-on rules/i.test(section)) ?? '';
const missingFromAgents = frontmatterAlwaysOn.filter(
  (rule) => !agentsAlwaysOnSection.includes(rule),
);
if (missingFromAgents.length > 0) {
  fail(
    `AGENTS.md always-on section omits: ${missingFromAgents.join(', ')}`,
  );
} else {
  pass('AGENTS.md always-on section lists every always-on rule');
}

// 3. Check rule cross-references and sections
const ruleHeadings = new Map();

for (const file of ruleFiles) {
  const content = fs.readFileSync(path.join(cursorRulesDir, file), 'utf8');
  const headings = content.split('\n')
    .filter(line => line.startsWith('#'))
    .map(line => line.trim());
  ruleHeadings.set(file, headings);
  ruleHeadings.set(file.replace(/\.mdc$/, '.md'), headings);
  ruleHeadings.set(file.replace(/\.mdc$/, ''), headings);
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
}

// 4. Check skills integrity (frontmatter, citations, and file paths)
const docsDir = path.join(ROOT, 'docs');
const docsFiles = fs.existsSync(docsDir) ? fs.readdirSync(docsDir).filter(f => f.endsWith('.md')) : [];
for (const file of docsFiles) {
  const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
  const headings = content.split('\n').filter(l => l.startsWith('#')).map(l => l.trim());
  ruleHeadings.set(file, headings);
  ruleHeadings.set(`docs/${file}`, headings);
}

for (const skill of diskSkills) {
  const skillFile = path.join(skillsDir, skill, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    fail(`Missing SKILL.md in ${skill}`);
    continue;
  }
  const content = fs.readFileSync(skillFile, 'utf8');

  // Validate YAML frontmatter
  const hasFrontmatter = content.startsWith('---\n');
  const nameMatch = content.match(/^name:\s*([^\n]+)/m);
  const descMatch = content.match(/^description:\s*([^\n]+)/m);

  if (!hasFrontmatter || !nameMatch || !descMatch) {
    fail(`Invalid or missing frontmatter in ${skill}/SKILL.md`);
  } else if (nameMatch[1].trim() !== skill) {
    fail(`Skill name mismatch: directory '${skill}' vs frontmatter '${nameMatch[1].trim()}'`);
  }

  // Validate 3-sentence formula with negative routing bounds
  const desc = descMatch ? descMatch[1].trim() : '';
  if (!desc.includes('Do not') && !desc.includes('Do NOT')) {
    fail(`Skill ${skill}: description lacks explicit negative routing boundary ("Do NOT use for...")`);
  }

  // Validate SSOT rule header
  if (!content.includes('**Rule (norms SSOT):**') && !content.includes('**Rules (norms SSOT):**')) {
    fail(`Skill ${skill}: missing '**Rule (norms SSOT):**' header`);
  }

  // Validate executable scripts in scripts/ directory
  const skillScriptsDir = path.join(skillsDir, skill, 'scripts');
  if (fs.existsSync(skillScriptsDir) && fs.statSync(skillScriptsDir).isDirectory()) {
    for (const scriptFile of fs.readdirSync(skillScriptsDir)) {
      const scriptPath = path.join(skillScriptsDir, scriptFile);
      const stat = fs.statSync(scriptPath);
      if ((stat.mode & 0o111) === 0) {
        fail(`Skill ${skill}: script '${scriptFile}' is not executable (mode: ${stat.mode.toString(8)})`);
      }
    }
  }

  // Check section references
  const sectionMatches = content.matchAll(/(?:`|\[)?((?:docs\/)?[a-zA-Z0-9_-]+\.mdc?)(?:`|\])?[\s]*?(§\s*([\d.]+))/gi);
  for (const match of sectionMatches) {
    const rawTarget = match[1];
    const targetKey = rawTarget.replace(/\.mdc?$/, '');
    const secNum = match[3];
    const headings = ruleHeadings.get(rawTarget) || ruleHeadings.get(targetKey) || ruleHeadings.get(path.basename(rawTarget));
    if (!headings) {
      fail(`In skill ${skill}: references unknown rule or doc ${rawTarget}`);
      continue;
    }
    const secBase = secNum.split('.')[0];
    const hasSection = headings.some(h => {
      const secRegex = new RegExp(`(^#+\\s*${secBase}\\.|§\\s*${secBase}\\b)`, 'i');
      return secRegex.test(h);
    });
    if (!hasSection) {
      fail(`In skill ${skill}: referenced section §${secNum} does not exist in ${rawTarget}`);
    }
  }

  // Check file paths mentioned in backticks
  const pathMatches = content.matchAll(/`((apps|packages|scripts|docs|\.agent|\.cursor|\.github)\/[^`]+)`/g);
  for (const m of pathMatches) {
    let p = m[1].split('#')[0].split('?')[0];
    if (p.includes('*') || p.includes('...') || p.includes('{') || p.includes('[')) continue;
    if (!fs.existsSync(path.join(ROOT, p))) {
      fail(`In skill ${skill}: referenced path does not exist on disk: ${p}`);
    }
  }
}

if (errors === 0) {
  pass(`All 30 skills verified: frontmatter, citations, and paths valid!`);
  console.log('\n✨ All rules and skills integrity checks passed successfully.\n');
  process.exit(0);
} else {
  console.error(`\n💥 Integrity check failed with ${errors} error(s).\n`);
  process.exit(1);
}
