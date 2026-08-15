const fs = require('fs');

function extractTranslations(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = {};
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
const ur = extractTranslations('/Users/syedaalin/Documents/mms/packages/shared/src/appTranslationsUr.ts');

const missingKeys = [];
for (const [key, enValue] of Object.entries(en)) {
  if (ur[key] === enValue) {
    missingKeys.push({ key, enValue });
  }
}

console.log(JSON.stringify(missingKeys, null, 2));
