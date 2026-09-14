#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

const BANNED_PATTERNS = [
  { regex: /\bpl-\d+\b/g, replacement: 'ps-*' },
  { regex: /\bpr-\d+\b/g, replacement: 'pe-*' },
  { regex: /\bml-\d+\b/g, replacement: 'ms-*' },
  { regex: /\bmr-\d+\b/g, replacement: 'me-*' },
  { regex: /\btext-left\b/g, replacement: 'text-start' },
  { regex: /\btext-right\b/g, replacement: 'text-end' },
  { regex: /\bborder-l(-\d+)?\b/g, replacement: 'border-s-*' },
  { regex: /\bborder-r(-\d+)?\b/g, replacement: 'border-e-*' },
  { regex: /\brounded-l(-\w+)?\b/g, replacement: 'rounded-s-*' },
  { regex: /\brounded-r(-\w+)?\b/g, replacement: 'rounded-e-*' },
];

function scanPath(targetPath, fileList = []) {
  const stat = statSync(targetPath);
  if (!stat.isDirectory()) {
    if (['.tsx', '.jsx', '.html'].includes(extname(targetPath))) {
      fileList.push(targetPath);
    }
    return fileList;
  }
  const entries = readdirSync(targetPath);
  for (const entry of entries) {
    const fullPath = join(targetPath, entry);
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const s = statSync(fullPath);
    if (s.isDirectory()) {
      scanPath(fullPath, fileList);
    } else if (['.tsx', '.jsx', '.html'].includes(extname(entry))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const targetPath = resolve(process.argv[2] || 'apps/frontend/src/components');
console.log(`Scanning for banned physical directional classes in: ${targetPath}`);

const files = scanPath(targetPath);
let violationCount = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    for (const { regex, replacement } of BANNED_PATTERNS) {
      const matches = line.match(regex);
      if (matches) {
        console.warn(`[BIDI VIOLATION] ${file}:${idx + 1}`);
        console.warn(`  Found: ${matches.join(', ')} -> Use BiDi logical property: ${replacement}`);
        console.warn(`  Line: ${line.trim()}`);
        violationCount += matches.length;
      }
    }
  });
}

if (violationCount > 0) {
  console.error(`\n❌ Found ${violationCount} BiDi physical layout violations.`);
  process.exit(1);
} else {
  console.log('✅ All checked files adhere to BiDi logical layout classes.');
  process.exit(0);
}
