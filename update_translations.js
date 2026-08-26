const fs = require('fs');
const path = require('path');

const files = [
  'appTranslationsEn.ts',
  'appTranslationsAr.ts',
  'appTranslationsFa.ts',
  'appTranslationsUr.ts',
];

const basePath = '/Users/syedaalin/Documents/mms/packages/shared/src';

for (const file of files) {
  const filePath = path.join(basePath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert "messaging.pagination.page": "Page {page}",
  // Insert "messaging.pagination.showingRecords": "Showing {count} of {total} records",
  // After "messaging.pagination.pageOf"
  
  if (!content.includes('messaging.pagination.page":')) {
    content = content.replace(
      /"messaging.pagination.pageOf": "(.*?)",/g,
      `"messaging.pagination.pageOf": "$1",
  "messaging.pagination.page": "Page {page}",
  "messaging.pagination.showingRecords": "Showing {count} of {total} records",`
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
