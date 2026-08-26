const fs = require('fs');

const files = [
  'packages/shared/src/appTranslationsAr.ts',
  'packages/shared/src/appTranslationsUr.ts',
  'packages/shared/src/appTranslationsFa.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/["']([^"']+)["']\s*:\s*(["']([^"']+)["'])\s*(?=\n\s*["'])/g, '"$1": $2,');
  fs.writeFileSync(file, newContent, 'utf8');
}
