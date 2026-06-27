const fs = require('fs');
const path = require('path');

// Load defaults
const defaults = JSON.parse(fs.readFileSync('defaults_list.json', 'utf8'));

// Create a mapping from absolute file path to export name
const defaultsMap = new Map();
for (const item of defaults) {
  const absPath = path.resolve(__dirname, item.file);
  defaultsMap.set(absPath, item.exportName);
}

const basePath = path.join(__dirname, 'apps/frontend/src');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = walk(basePath);

function resolveImportPath(importingFile, importPath) {
  let resolved = null;
  if (importPath.startsWith('@/')) {
    resolved = path.resolve(__dirname, 'apps/frontend/src', importPath.slice(2));
  } else if (importPath.startsWith('.')) {
    resolved = path.resolve(path.dirname(importingFile), importPath);
  } else {
    return null;
  }
  
  const extensions = ['.tsx', '.ts', '/index.tsx', '/index.ts', ''];
  for (const ext of extensions) {
    const fullPath = resolved + ext;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
  }
  return null;
}

let refactorCount = 0;
let fileCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let modified = false;

  // 1. If this file is one of the component files, refactor its default export to named export
  if (defaultsMap.has(file)) {
    const exportName = defaultsMap.get(file);
    
    // Check for "export default function Name"
    const pattern1 = new RegExp(`export default function\\s+${exportName}\\b`);
    if (pattern1.test(content)) {
      content = content.replace(pattern1, `export function ${exportName}`);
      modified = true;
    } else {
      // Check for "export default Name"
      const pattern2 = new RegExp(`export default\\s+${exportName}\\b`);
      if (pattern2.test(content)) {
        content = content.replace(pattern2, `export { ${exportName} }`);
        modified = true;
      }
    }
  }

  // 2. Refactor standard imports
  // Matches: import ... from "..."
  const importClausePattern = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  content = content.replace(importClausePattern, (match, clause, pathStr) => {
    const resolved = resolveImportPath(file, pathStr);
    if (resolved && defaultsMap.has(resolved)) {
      const exportName = defaultsMap.get(resolved);
      let isType = false;
      let cleanClause = clause.trim().replace(/\s+/g, ' ');
      
      if (cleanClause.startsWith('type ')) {
        isType = true;
        cleanClause = cleanClause.slice(5).trim();
      }

      // Check if it's namespace import: import * as X from "path"
      if (cleanClause.startsWith('*')) {
        return match; // Leave as is
      }

      // Check if it's default import: import X from "path" or import type X from "path"
      if (!cleanClause.includes(',') && !cleanClause.includes('{')) {
        const importedName = cleanClause;
        const prefix = isType ? 'import type ' : 'import ';
        if (importedName === exportName) {
          modified = true;
          return `${prefix}{ ${exportName} } from "${pathStr}"`;
        } else {
          modified = true;
          return `${prefix}{ ${exportName} as ${importedName} } from "${pathStr}"`;
        }
      }

      // Check if it's default import with named: import X, { Y } from "path"
      if (cleanClause.includes(',') && cleanClause.includes('{')) {
        const commaIdx = cleanClause.indexOf(',');
        const defaultPart = cleanClause.slice(0, commaIdx).trim();
        const namedPart = cleanClause.slice(commaIdx + 1).trim(); // e.g. { Y }
        
        const importedName = defaultPart;
        const innerNamed = namedPart.slice(1, -1).trim(); // strip { and }
        
        const prefix = isType ? 'import type ' : 'import ';
        if (importedName === exportName) {
          modified = true;
          return `${prefix}{ ${exportName}, ${innerNamed} } from "${pathStr}"`;
        } else {
          modified = true;
          return `${prefix}{ ${exportName} as ${importedName}, ${innerNamed} } from "${pathStr}"`;
        }
      }

      // Check if it's named import importing default as alias: import { default as X } from "path"
      if (cleanClause.startsWith('{') && cleanClause.endsWith('}')) {
        const inner = cleanClause.slice(1, -1).trim();
        const defaultAsMatch = inner.match(/default\s+as\s+([A-Za-z0-9_]+)/);
        if (defaultAsMatch) {
          const importedName = defaultAsMatch[1];
          const prefix = isType ? 'import type ' : 'import ';
          const replacedInner = inner.replace(/default\s+as\s+[A-Za-z0-9_]+/, importedName === exportName ? exportName : `${exportName} as ${importedName}`);
          modified = true;
          return `${prefix}{ ${replacedInner} } from "${pathStr}"`;
        }
      }
    }
    return match;
  });

  // 3. Refactor lazy imports
  // Matches: import("path") or import('path') where it is not followed by .then
  const lazyImportPattern = /import\s*\(\s*['"]([^'"]+)['"]\s*\)(?!\.then)/g;
  content = content.replace(lazyImportPattern, (match, pathStr) => {
    const resolved = resolveImportPath(file, pathStr);
    if (resolved && defaultsMap.has(resolved)) {
      const exportName = defaultsMap.get(resolved);
      modified = true;
      return `import("${pathStr}").then((module) => ({ default: module.${exportName} }))`;
    }
    return match;
  });

  if (modified) {
    refactorCount++;
    console.log(`[PLANNED] ${path.relative(__dirname, file)}`);
    // Print the diff of import statements or changed lines
    const origLines = originalContent.split('\n');
    const newLines = content.split('\n');
    for (let i = 0; i < origLines.length; i++) {
      if (origLines[i] !== newLines[i]) {
        console.log(`  Line ${i+1}:`);
        console.log(`    - ${origLines[i]}`);
        console.log(`    + ${newLines[i]}`);
      }
    }
  }
}

console.log(`Planned updates in ${refactorCount} files.`);
