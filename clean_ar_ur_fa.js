const fs = require('fs');
const files = [
  'packages/shared/src/appTranslationsAr.ts',
  'packages/shared/src/appTranslationsUr.ts',
  'packages/shared/src/appTranslationsFa.ts'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/.*"contacts\.searchColumnsPlaceholder".*\n/g, '');
  content = content.replace(/.*"students\.searchColumnsPlaceholder".*\n/g, '');
  content = content.replace(/.*"teachers\.searchColumnsPlaceholder".*\n/g, '');
  fs.writeFileSync(file, content);
  console.log('Cleaned', file);
}
