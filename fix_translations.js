const fs = require('fs');

const files = [
  'packages/shared/src/appTranslationsAr.ts',
  'packages/shared/src/appTranslationsUr.ts',
  'packages/shared/src/appTranslationsFa.ts'
];

const newKeys = {
  "contacts.bulkTags.placeholder": "VIP, Donor, Sponsor...",
  "questionBank.source.placeholder": "Select...",
  "examinations.marks.searchPlaceholder": "Search students..."
};

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  const startIdx = content.indexOf('export const APP_TRANSLATIONS');
  if (startIdx === -1) {
    console.log("Could not find start for", file);
    continue;
  }
  
  const objStart = content.indexOf('{', startIdx);
  const objEnd = content.lastIndexOf('}');
  
  let lines = content.substring(objStart + 1, objEnd).split('\n');
  let validLines = lines.filter(l => l.trim().startsWith('"') || l.trim().startsWith("'"));
  
  const existingKeys = new Set();
  validLines.forEach(line => {
    const match = line.match(/^\s*["']([^"']+)["']\s*:/);
    if (match) {
      existingKeys.add(match[1]);
    }
  });
  
  for (const [k, v] of Object.entries(newKeys)) {
    if (!existingKeys.has(k)) {
      validLines.push(`  "${k}": "${v.replace(/"/g, '\\"')}",`);
    }
  }
  
  validLines.sort((a, b) => {
    const matchA = a.match(/^\s*["']([^"']+)["']\s*:/);
    const matchB = b.match(/^\s*["']([^"']+)["']\s*:/);
    if (!matchA || !matchB) return 0;
    return matchA[1].localeCompare(matchB[1]);
  });
  
  const newObjContent = '{\n' + validLines.join('\n') + '\n}';
  const newContent = content.substring(0, objStart) + newObjContent + content.substring(objEnd + 1);
  
  fs.writeFileSync(file, newContent, 'utf8');
  console.log(`Updated ${file}`);
}
