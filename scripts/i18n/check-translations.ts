import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sharedSrc = path.resolve(__dirname, '../../packages/shared/src');

function extractTranslations(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^\s*"([^"]+)":\s*"(.*)",?$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}

const en = extractTranslations(path.join(sharedSrc, 'appTranslationsEn.ts'));
const ar = extractTranslations(path.join(sharedSrc, 'appTranslationsAr.ts'));
const ur = extractTranslations(path.join(sharedSrc, 'appTranslationsUr.ts'));
const fa = extractTranslations(path.join(sharedSrc, 'appTranslationsFa.ts'));

let arMissing = 0;
let urMissing = 0;
let faMissing = 0;

for (const [key, enValue] of Object.entries(en)) {
  if (ar[key] === enValue || !ar[key]) arMissing++;
  if (ur[key] === enValue || !ur[key]) urMissing++;
  if (fa[key] === enValue || !fa[key]) faMissing++;
}

console.log('=== MMS Translation Completeness Report ===');
console.log(`Total Keys: ${Object.keys(en).length}`);
console.log(`Arabic (ar) fallback to EN / missing: ${arMissing}`);
console.log(`Urdu (ur) fallback to EN / missing: ${urMissing}`);
console.log(`Farsi (fa) fallback to EN / missing: ${faMissing}`);
