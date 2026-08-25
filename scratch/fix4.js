const fs = require('fs');

const f = 'apps/frontend/src/tenant/features/contacts/hooks/contactFormDraftUtils.test.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/  const fields: Record<string, FieldDefinition\[\]> = \{[\s\S]*?  \};\n\n/g, '');
c = c.replace(/      fields,\n/g, '');
c = c.replace(/import type \{ Contact, FieldDefinition \} from "@mms\/shared";/g, 'import type { Contact } from "@mms/shared";');
fs.writeFileSync(f, c);

const f2 = 'apps/frontend/src/tenant/features/contacts/hooks/useContactFormDraft.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/isTabFieldEnabled: \(\) => true,\n    isTabFieldRequired: \(\) => false,\n    isTabFieldEnabled: \(\) => true,\n    isTabFieldRequired: \(\) => false,/g, 'isTabFieldEnabled: () => true,\n    isTabFieldRequired: () => false,');
fs.writeFileSync(f2, c2);

console.log("Fixed");
