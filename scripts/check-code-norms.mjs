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
  anyAnnotations: 83,
  hexColourFiles: 31,
  filesOverHardLimit: 78,
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

/**
 * `@theme` tokens live in CSS, which the main `.ts/.tsx` walk deliberately skips
 * (adding CSS to it would also drag `index.css` into the 300-line ratchet). So the
 * inert-token check does its own scan. It must not be folded into `walk()` above —
 * an earlier version filtered `files` for `.css` and therefore inspected nothing
 * while reporting a clean zero.
 */
function walkCss(dir, out = []) {
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
    if (entry.isDirectory()) walkCss(full, out);
    else if (entry.name.endsWith('.css')) out.push(rel);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const cssFiles = SCAN_DIRS.flatMap((dir) => walkCss(path.join(ROOT, dir)));

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

/**
 * Inert `@theme` tokens: a token declared under a Tailwind v3 config name that
 * v4 does not consume. Tailwind accepts such a token silently, emits no utility
 * for it, and reports nothing — so every `text-2xs` in the codebase renders at
 * whatever size it inherited.
 *
 * That is not hypothetical: the sub-xs type scale was declared as
 * `--font-size-2xs/-3xs/-4xs`, so `text-2xs`, `text-3xs` and `text-4xs` generated
 * no CSS at all across **217** call sites. It survived because nothing fails — a
 * class that emits nothing looks exactly like a class that works.
 *
 * The pairs below were verified empirically against Tailwind 4.3.3 by compiling a
 * probe stylesheet per namespace and checking whether the utility was emitted:
 * the left-hand name produced nothing while the v4 equivalent on the right did.
 * Only pairs with an unambiguous intended utility are listed, so there are no
 * false positives — `--font-weight-*` and `--container-*` are valid in v4 and are
 * deliberately NOT here.
 */
const INERT_THEME_NAMESPACES = [
  { prefix: '--font-size-', use: '--text-' },
  { prefix: '--line-height-', use: '--leading-' },
  { prefix: '--letter-spacing-', use: '--tracking-' },
  { prefix: '--box-shadow-', use: '--shadow-' },
  { prefix: '--border-radius-', use: '--radius-' },
];

const inertThemeTokens = [];
for (const rel of cssFiles) {
  const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  content.split('\n').forEach((line, index) => {
    const declaration = /^\s*(--[a-z0-9-]+)\s*:/.exec(line);
    if (!declaration) return;
    for (const { prefix, use } of INERT_THEME_NAMESPACES) {
      if (declaration[1].startsWith(prefix)) {
        inertThemeTokens.push(
          `${rel}:${index + 1}  ${declaration[1]} declares no utility — use ${use}* instead`,
        );
      }
    }
  });
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
  {
    // Not a ratchet: an inert token is a bug, never accepted debt, so the baseline
    // is zero and stays zero.
    name: 'Inert @theme tokens (v3 namespace Tailwind v4 does not consume)',
    norm: 'mms-ui-ux-design.md §2',
    count: inertThemeTokens.length,
    baseline: 0,
    sample: inertThemeTokens.slice(0, 5),
  },
];

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ total: files.length, results }, null, 2));
  process.exit(0);
}

const isRatchetMode = process.argv.includes('--ratchet');
const isUpdateBaselines = process.argv.includes('--update-baselines');

if (isUpdateBaselines) {
  let updated = false;
  const newBaseline = { ...BASELINE };
  if (anyCount < BASELINE.anyAnnotations) {
    newBaseline.anyAnnotations = anyCount;
    updated = true;
  }
  if (hexFiles.length < BASELINE.hexColourFiles) {
    newBaseline.hexColourFiles = hexFiles.length;
    updated = true;
  }
  if (oversized.length < BASELINE.filesOverHardLimit) {
    newBaseline.filesOverHardLimit = oversized.length;
    updated = true;
  }

  if (updated) {
    const scriptPath = path.join(ROOT, 'scripts/check-code-norms.mjs');
    const content = fs.readFileSync(scriptPath, 'utf8');
    const replaced = content.replace(
      /const BASELINE = \{[\s\S]*?\};/,
      `const BASELINE = {\n  anyAnnotations: ${newBaseline.anyAnnotations},\n  hexColourFiles: ${newBaseline.hexColourFiles},\n  filesOverHardLimit: ${newBaseline.filesOverHardLimit},\n};`
    );
    fs.writeFileSync(scriptPath, replaced, 'utf8');
    console.log(`✅ Baselines successfully ratcheted down:`, newBaseline);
  } else {
    console.log(`ℹ️ No baseline improvements to update (counts are at or above current baselines).`);
  }
  process.exit(0);
}

let regressions = 0;
let improvements = 0;
for (const result of results) {
  const delta = result.count - result.baseline;
  const mark = delta > 0 ? '✗' : '✓';
  if (delta > 0) regressions++;
  if (delta < 0 && result.baseline > 0) improvements++;
  console.log(`${mark} ${result.name}: ${result.count} (baseline ${result.baseline})  [${result.norm}]`);
  if (delta < 0 && result.baseline > 0) {
    console.log(`   🎉 Improved by ${Math.abs(delta)}! Run with --update-baselines to ratchet down.`);
  }
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
if (isRatchetMode && improvements > 0) {
  console.error(
    `⚠️ ${improvements} baseline(s) improved! Run 'node scripts/check-code-norms.mjs --update-baselines' to lock in improvements.`,
  );
  process.exit(1);
}
console.log(`✅ All code-norm ratchets held (scanned ${files.length} files).`);
