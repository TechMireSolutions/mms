const fs = require('fs');
let content = fs.readFileSync('apps/frontend/src/tenant/features/contacts/hooks/contactFormDraftUtils.ts', 'utf8');
content = content.replace(/  fields: Record<string, FieldDefinition\[\]>;\n/g, '');
fs.writeFileSync('apps/frontend/src/tenant/features/contacts/hooks/contactFormDraftUtils.ts', content, 'utf8');
