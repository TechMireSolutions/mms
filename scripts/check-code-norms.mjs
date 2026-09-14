#!/usr/bin/env node
/**
 * MMS code-norm ratchets.
 *
 * Three norms are declared in the rules but were previously unenforceable, so
 * they silently drifted: `any` in frontend source, raw hex colours instead of
 * design tokens, and the file-size bands. This script holds the CURRENT count as
 * a baseline and fails when a change makes any of them worse.
 *
 * Ratchets, not cleanups: the existing sites are grandfathered on purpose, and
 * lowering a baseline as code improves is always welcome.
 *
 *   node scripts/check-code-norms.mjs
 *   node scripts/check-code-norms.mjs --json
 *
 * Norms: mms-dry.md §4 (no `any`), mms-ui-ux-design.md §2 (semantic tokens only),
 * mms-structure-naming.md §3 (~300 hard / ~220 soft line bands).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

/** Baselines measured when the ratchet landed; only lower them. */
const BASELINE = {
  anyAnnotations: 55,
  hexColourFiles: 37,
  filesOverHardLimit: 77,
};

const SCAN_DIRS = ['apps/frontend/src', 'apps/backend/src', 'packages/shared/src'];
const IGNORED = /(^|\/)(node_modules|dist|coverage|\.turbo)\//;
const SOURCE_EXT = /\.(ts|tsx)$/;
const TEST_FILE = /\.(test|spec)\.(ts|tsx)$/;
/** The hard ceiling from mms-structure-naming.md §3. */
const HARD_LIMIT = 300;
/** 6-digit hex literals; design tokens live in index.css `@theme`. */
const HEX_COLOUR = /#[0-9a-fA-F]{6}\b/;
/** `any` annotations, but not the words "any" in prose. */
const ANY_ANNOTATION = /:\s*any\b|<any>|\bas\s+any\b/;

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (IGNORED.test(`${rel}/`)) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXT.test(entry.name)) out.push(rel);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));

let anyCount = 0;
const anySites = [];
const hexFiles = [];
const oversized = [];

for (const rel of files) {
  const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const lines = content.split('\n');

  if (!TEST_FILE.test(rel)) {
    lines.forEach((line, index) => {
      if (ANY_ANNOTATION.test(line) && !line.trimStart().startsWith('//') && !line.trimStart().startsWith('*')) {
        anyCount++;
        if (anySites.length < 5) anySites.push(`${rel}:${index + 1}`);
      }
    });
    if (!rel.endsWith('.css') && HEX_COLOUR.test(content)) hexFiles.push(rel);
  }

  if (lines.length > HARD_LIMIT && !TEST_FILE.test(rel)) {
    oversized.push(`${lines.length}  ${rel}`);
  }
}

const results = [
  {
    name: 'Explicit `any` in source',
    norm: 'mms-dry.md §4',
    count: anyCount,
    baseline: BASELINE.anyAnnotations,
    sample: anySites,
  },
  {
    name: 'Raw hex colours outside @theme',
    norm: 'mms-ui-ux-design.md §2',
    count: hexFiles.length,
    baseline: BASELINE.hexColourFiles,
    sample: hexFiles.slice(0, 5),
  },
  {
    name: `Files over the ${HARD_LIMIT}-line hard ceiling`,
    norm: 'mms-structure-naming.md §3',
    count: oversized.length,
    baseline: BASELINE.filesOverHardLimit,
    sample: oversized.slice(0, 5),
  },
];

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ total: files.length, results }, null, 2));
  process.exit(0);
}

let regressions = 0;
for (const result of results) {
  const delta = result.count - result.baseline;
  const mark = delta > 0 ? '✗' : '✓';
  if (delta > 0) regressions++;
  console.log(`${mark} ${result.name}: ${result.count} (baseline ${result.baseline})  [${result.norm}]`);
  if (delta > 0) {
    for (const site of result.sample) console.log(`      ${site}`);
  }
}

console.log('');
if (regressions > 0) {
  console.error(
    `💥 ${regressions} code-norm ratchet(s) regressed. Fix the new sites, or — only with a reviewed reason — lower the BASELINE in scripts/check-code-norms.mjs.`,
  );
  process.exit(1);
}
console.log(`✅ All code-norm ratchets held (scanned ${files.length} files).`);
