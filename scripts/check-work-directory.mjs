#!/usr/bin/env node
/**
 * MMS Work Directory convergence ratchets.
 *
 * Enforces the unified Work Directory architecture:
 * 1. Zero imports of the retired ModuleStandardBulkActionBar adapter.
 * 2. Zero imports of retired useWorkDirectoryController / ModuleWorkDirectoryShell.
 * 3. Zero CSS dual-rendering (e.g. md:hidden / md:block) in directory *List.tsx files.
 * 4. Zero selectedCount: 0 shortcut stubs in converged tenant page controllers.
 *
 * Spec: docs/superpowers/specs/2026-09-24-work-directory-convergence-design.md §5
 * Norms: mms-module-architecture.mdc §3/§7, mms-dry.mdc §1.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FE_SRC = path.join(ROOT, 'apps/frontend/src');

const IGNORED = /(^|\/)(node_modules|dist|coverage|\.turbo)\//;
const SOURCE_EXT = /\.(ts|tsx)$/;
const TEST_FILE = /\.(test|spec)\.(ts|tsx)$/;

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

const files = walk(FE_SRC);

const retiredBulkBarImports = [];
const retiredShellImports = [];
const cssDualRenderSites = [];
const stubShortcutSites = [];

const CONVERGED_MODULES = new Set([
  'contacts',
  'students',
  'faculty',
  'sessions',
  'enrollments',
  'finance',
  'hasanat',
  'obligations',
  'question-bank',
]);

for (const rel of files) {
  const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');

  if (!TEST_FILE.test(rel)) {
    if (/ModuleStandardBulkActionBar/.test(content)) {
      retiredBulkBarImports.push(rel);
    }
    if (/ModuleWorkDirectoryShell|useWorkDirectoryController/.test(content)) {
      retiredShellImports.push(rel);
    }

    const isController = /(PageController|PageState)\.ts$/.test(rel);
    if (isController) {
      const match = rel.match(/tenant\/features\/([^/]+)\//);
      if (match && CONVERGED_MODULES.has(match[1])) {
        if (/selectedCount:\s*0\b/.test(content)) {
          stubShortcutSites.push(rel);
        }
      }
    }
  }

  // Check tenant feature directory *List.tsx for CSS dual-rendering (table/cards rendered simultaneously via CSS)
  if (rel.startsWith('apps/frontend/src/tenant/features/') && rel.endsWith('List.tsx') && !TEST_FILE.test(rel)) {
    if (/\bmd:hidden\b/.test(content) && (/\bmd:block\b/.test(content) || /\bmd:flex\b/.test(content) || /\bhidden\s+md:/.test(content))) {
      cssDualRenderSites.push(rel);
    }
  }
}

const checks = [
  {
    name: 'Retired ModuleStandardBulkActionBar imports',
    count: retiredBulkBarImports.length,
    violators: retiredBulkBarImports,
    norm: 'mms-dry.mdc §1',
  },
  {
    name: 'Retired ModuleWorkDirectoryShell / useWorkDirectoryController imports',
    count: retiredShellImports.length,
    violators: retiredShellImports,
    norm: 'mms-module-architecture.mdc §3',
  },
  {
    name: 'CSS dual-render in directory *List.tsx',
    count: cssDualRenderSites.length,
    violators: cssDualRenderSites,
    norm: 'mms-module-architecture.mdc §3 (viewMode SSOT)',
  },
  {
    name: 'selectedCount: 0 shortcut stubs in converged controllers',
    count: stubShortcutSites.length,
    violators: stubShortcutSites,
    norm: 'mms-module-architecture.mdc §7',
  },
];

let failures = 0;
for (const check of checks) {
  const mark = check.count === 0 ? '✓' : '✗';
  console.log(`${mark} ${check.name}: ${check.count}  [${check.norm}]`);
  if (check.count > 0) {
    failures++;
    for (const site of check.violators) {
      console.log(`      ${site}`);
    }
  }
}

console.log('');
if (failures > 0) {
  console.error(`💥 ${failures} Work Directory convergence check(s) failed.`);
  process.exit(1);
}

console.log(`✅ All Work Directory convergence checks passed (scanned ${files.length} frontend files).`);
