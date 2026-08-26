const fs = require('fs');
const enFile = 'packages/shared/src/appTranslationsEn.ts';

const newKeys = {
  "contacts.bulkTags.placeholder": "VIP, Donor, Sponsor...",
  "questionBank.source.placeholder": "Select...",
  "examinations.marks.searchPlaceholder": "Search students..."
};

let content = fs.readFileSync(enFile, 'utf8');
const startIdx = content.indexOf('export const appTranslations');
const objStart = content.indexOf('{', startIdx);
const objEnd = content.lastIndexOf('}');

let lines = content.substring(objStart + 1, objEnd).split('\n');
let validLines = lines.filter(l => l.trim().startsWith('"') || l.trim().startsWith("'"));

for (const [k, v] of Object.entries(newKeys)) {
  validLines.push(`  "${k}": "${v.replace(/"/g, '\\"')}",`);
}

validLines.sort((a, b) => {
  const matchA = a.match(/^\s*["']([^"']+)["']\s*:/);
  const matchB = b.match(/^\s*["']([^"']+)["']\s*:/);
  if (!matchA || !matchB) return 0;
  return matchA[1].localeCompare(matchB[1]);
});

const newObjContent = '{\n' + validLines.join('\n') + '\n}';
const newContent = content.substring(0, objStart) + newObjContent + content.substring(objEnd + 1);

fs.writeFileSync(enFile, newContent, 'utf8');
console.log(`Updated ${enFile}`);
