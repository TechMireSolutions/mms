import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (!file.endsWith('.d.ts') && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx')) {
          arrayOfFiles.push(path.join(dirPath, "/", file));
        }
      }
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles('apps/frontend/src', []);
const warnings = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const basename = path.basename(file, path.extname(file));
  
  if (basename === 'index' || basename === 'main' || basename === 'vite-env' || basename === 'App') continue;

  const exportRegex = /export\s+(?:default\s+)?(?:const|function|class|type|interface|let|var)\s+([a-zA-Z0-9_]+)/g;
  let match;
  const exports = [];
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // also check for export { X, Y }
  const blockExportRegex = /export\s+{([^}]+)}/g;
  while ((match = blockExportRegex.exec(content)) !== null) {
    const block = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
    exports.push(...block);
  }

  if (exports.length > 0) {
    // Check if any export matches the basename exactly
    const exactMatch = exports.includes(basename);
    const caseInsensitiveMatch = exports.some(e => e.toLowerCase() === basename.toLowerCase());
    
    if (!exactMatch) {
      warnings.push({
        file,
        basename,
        exports,
        caseInsensitiveMatch
      });
    }
  }
}

// Filter out some expected util files
const filtered = warnings.filter(w => {
  // Common utilities that might export multiple small things
  if (w.exports.length > 5) return false; 
  if (w.file.includes('utils') || w.file.includes('helpers')) return false;
  return true;
});

filtered.forEach(w => {
  console.log(`\nFile: ${w.file}`);
  console.log(`Basename: ${w.basename}`);
  console.log(`Exports: ${w.exports.join(', ')}`);
  if (w.caseInsensitiveMatch) {
    console.log(`  -> Has case-insensitive match!`);
  }
});
