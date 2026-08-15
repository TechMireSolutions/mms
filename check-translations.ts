import fs from 'fs';
import path from 'path';

// Just simple regex to extract keys and values
function extractTranslations(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};
  
  // Very rough parsing for simple cases, since it's just to check matching values
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*"([^"]+)":\s*"(.*)",?$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

const en = extractTranslations('/Users/syedaalin/Documents/mms/packages/shared/src/appTranslationsEn.ts');
const ar = extractTranslations('/Users/syedaalin/Documents/mms/packages/shared/src/appTranslationsAr.ts');
const ur = extractTranslations('/Users/syedaalin/Documents/mms/packages/shared/src/appTranslationsUr.ts');
const fa = extractTranslations('/Users/syedaalin/Documents/mms/packages/shared/src/appTranslationsFa.ts');

let arMissing = 0;
let urMissing = 0;
let faMissing = 0;

for (const [key, enValue] of Object.entries(en)) {
  if (ar[key] === enValue) arMissing++;
  if (ur[key] === enValue) urMissing++;
  if (fa[key] === enValue || !fa[key]) faMissing++;
}

console.log(`Total Keys: ${Object.keys(en).length}`);
console.log(`Arabic identical to EN: ${arMissing}`);
console.log(`Urdu identical to EN: ${urMissing}`);
console.log(`Farsi identical to EN (or missing): ${faMissing}`);
