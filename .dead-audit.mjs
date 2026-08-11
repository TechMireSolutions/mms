import fs from 'node:fs';
import path from 'node:path';

const repo = '/Users/syedaalin/Documents/mms';

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'coverage', '.next', 'build'].includes(ent.name)) continue;
      walk(p, out);
    } else if (/\.(ts|tsx|mts|cts)$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

const rel = (p) => path.relative(repo, p);

const scope = new Set();
const addDir = (d) => walk(d).forEach((f) => scope.add(f));
addDir(path.join(repo, 'apps/frontend/src/tenant/features/teachers'));
scope.add(path.join(repo, 'apps/frontend/src/tenant/hooks/collections/teachers.ts'));
addDir(path.join(repo, 'apps/frontend/src/lib/teachers'));
addDir(path.join(repo, 'apps/backend/src/teachers'));
addDir(path.join(repo, 'apps/backend/src/routes/tenant/teachers'));
scope.add(path.join(repo, 'apps/backend/src/routes/tenant/teachers.ts'));
scope.add(path.join(repo, 'apps/backend/src/validation/teacherSchemas.ts'));
for (const f of walk(path.join(repo, 'apps/backend/src/db/repositories'))) {
  if (path.basename(f).startsWith('teacher')) scope.add(f);
}
for (const f of walk(path.join(repo, 'apps/backend/src/services'))) {
  const b = path.basename(f);
  if (b.startsWith('teacher') || b.startsWith('teachers')) scope.add(f);
}
for (const f of walk(path.join(repo, 'packages/shared/src'))) {
  const b = path.basename(f);
  if ((b.startsWith('teacher') || b.startsWith('teachers')) && !/\.test\./.test(b)) scope.add(f);
}

const corpus = [];
for (const d of ['apps/backend/src', 'apps/frontend/src', 'packages/shared/src']) {
  corpus.push(...walk(path.join(repo, d)));
}

const cache = new Map();
function content(p) {
  if (!cache.has(p)) cache.set(p, fs.readFileSync(p, 'utf8'));
  return cache.get(p);
}

const isTest = (p) => /\.(test|spec)\.(ts|tsx|mts|cts)$/.test(p);

const exportPatterns = [
  { re: /^export\s+async\s+function\s+([A-Za-z_$][\w$]*)/gm },
  { re: /^export\s+function\s+([A-Za-z_$][\w$]*)/gm },
  { re: /^export\s+class\s+([A-Za-z_$][\w$]*)/gm },
  { re: /^export\s+interface\s+([A-Za-z_$][\w$]*)/gm },
  { re: /^export\s+type\s+([A-Za-z_$][\w$]*)\b/gm },
  { re: /^export\s+enum\s+([A-Za-z_$][\w$]*)/gm },
  { re: /^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm },
];
const reExportList = /^export\s+(?:type\s+)?\{([^}]*)\}\s*(?:from\s*['"][^'"]+['"])?/gm;
const reExportStar = /^export\s*\*\s*from\s+['"]([^'"]+)['"]/gm;
const reDefault = /^\s*export\s+default\b/gm;

const results = [];
for (const file of [...scope].sort()) {
  const text = content(file);
  const exports = [];
  const seen = new Set();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    for (const { re } of exportPatterns) {
      let m;
      while ((m = re.exec(ln)) !== null) {
        const key = 'decl|' + m[1];
        if (!seen.has(key)) { seen.add(key); exports.push({ name: m[1], kind: 'decl', line: i + 1 }); }
      }
    }
  }
  let rm;
  reExportList.lastIndex = 0;
  while ((rm = reExportList.exec(text)) !== null) {
    const line = text.slice(0, rm.index).split('\n').length;
    for (const raw of rm[1].split(',')) {
      const s = raw.trim();
      if (!s) continue;
      const orig = s.split(/\s+as\s+/)[0].trim();
      const alias = s.includes(' as ') ? s.split(/\s+as\s+/)[1].trim() : orig;
      if (!seen.has('reexport|' + alias)) {
        seen.add('reexport|' + alias);
        exports.push({ name: alias, kind: 'reexport', line });
      }
    }
  }
  let sm;
  reExportStar.lastIndex = 0;
  while ((sm = reExportStar.exec(text)) !== null) {
    exports.push({ name: '*:' + sm[1], kind: 'star', line: text.slice(0, sm.index).split('\n').length });
  }
  if (reDefault.test(text)) exports.push({ name: '<default>', kind: 'default', line: -1 });
  results.push({ file, exports });
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const importRegexFor = (name) =>
  new RegExp(`from\\s*['"][^'"\\n]*[\\\\/]${esc(name)}(?:\\.(?:js|ts|tsx))?['"]|require\\(\\s*['"][^'"\\n]*[\\\\/]${esc(name)}(?:\\.(?:js|ts|tsx))?['"]`, 'g');

function symbolRefs(name, skipFile) {
  const re = new RegExp('\\b' + esc(name) + '\\b', 'g');
  const importers = [];
  const testOnly = [];
  for (const f of corpus) {
    if (f === skipFile) continue;
    if (re.test(content(f))) {
      (isTest(f) ? testOnly : importers).push(rel(f));
    }
  }
  return { importers, testOnly };
}

function fileImporters(file) {
  const name = path.basename(file).replace(/\.(ts|tsx|mts|cts)$/, '');
  const re = importRegexFor(name);
  const importers = [];
  const testOnly = [];
  for (const f of corpus) {
    if (f === file) continue;
    re.lastIndex = 0;
    if (re.test(content(f))) {
      (isTest(f) ? testOnly : importers).push(rel(f));
    }
  }
  return { importers, testOnly };
}

const out = [];
out.push('=== SCOPE FILES: ' + scope.size + ' | CORPUS FILES: ' + corpus.length + ' ===');
out.push('');

for (const r of results) {
  const fileRel = rel(r.file);
  const deadExports = [];
  const testOnlyExports = [];
  for (const ex of r.exports) {
    if (ex.kind === 'star' || ex.kind === 'default') continue;
    const { importers, testOnly } = symbolRefs(ex.name, r.file);
    if (importers.length === 0 && testOnly.length === 0) {
      deadExports.push({ ...ex, refs: testOnly });
    } else if (importers.length === 0 && testOnly.length > 0) {
      testOnlyExports.push({ ...ex, refs: testOnly });
    }
  }
  const { importers: fImp, testOnly: fTest } = fileImporters(r.file);
  const fileDead = fImp.length === 0 && fTest.length === 0;

  const prefix = fileDead ? 'DEAD-FILE' : 'file';
  out.push(`--- [${prefix}] ${fileRel}`);
  out.push(`    exports: ${r.exports.length} (decl=${r.exports.filter(e => e.kind === 'decl').length}, reexport=${r.exports.filter(e => e.kind === 'reexport').length}, star=${r.exports.filter(e => e.kind === 'star').length}, default=${r.exports.filter(e => e.kind === 'default').length})`);
  out.push(`    file-importers: ${fImp.length} non-test | ${fTest.length} test`);
  if (fImp.length > 0) out.push(`      non-test: ${[...new Set(fImp)].join(', ')}`);
  if (fTest.length > 0) out.push(`      test: ${[...new Set(fTest)].join(', ')}`);
  for (const d of deadExports) {
    out.push(`    DEAD-EXPORT ${d.kind} ${d.name} @ line ${d.line} — 0 refs outside file`);
  }
  for (const t of testOnlyExports) {
    out.push(`    TEST-ONLY ${t.kind} ${t.name} @ line ${t.line} — refs: ${t.refs.map(rel2 => rel2 || '').join(', ')}`);
  }
  if (r.exports.some((e) => e.kind === 'star')) {
    for (const s of r.exports.filter((e) => e.kind === 'star')) out.push(`    STAR-BARREL: export * from '${s.name.slice(2)}'`);
  }
  if (r.exports.some((e) => e.kind === 'default')) out.push(`    DEFAULT-EXPORT present`);
}

const output = out.join('\n');
fs.writeFileSync(path.join(repo, '.dead-audit-report.txt'), output);
console.log(output);
