const fs = require('fs');

let content = fs.readFileSync('apps/frontend/src/lib/contacts/useContactConfigProviderValue.ts', 'utf8');

content = content.replace(/    settings: fieldConfig,\n/g, '');
content = content.replace(/    formTabsReady,\n/g, '');
content = content.replace(/    enabledTabIds,\n/g, '');
content = content.replace(/    requiredTabIds,\n/g, '');
content = content.replace(/    fields,\n/g, '');
content = content.replace(/    isTabFieldEnabled,\n/g, '');
content = content.replace(/    isTabFieldRequired,\n/g, '');
content = content.replace(/      fieldConfig,\n/g, '');
content = content.replace(/      formTabsReady,\n/g, '');
content = content.replace(/      enabledTabIds,\n/g, '');
content = content.replace(/      requiredTabIds,\n/g, '');
content = content.replace(/      fields,\n/g, '');
content = content.replace(/      isTabFieldEnabled,\n/g, '');
content = content.replace(/      isTabFieldRequired,\n/g, '');

content = content.replace(/import type { ContactsConfigResult } from "@\\/lib\\/contacts\\/useContactStandardConfig";\n/, 'import type { ContactPreferences } from "@mms/shared";\n');

content = content.replace(/export function useContactConfigProviderValue\\(\\n  config: ContactsConfigResult,\\n\\): ContactConfigContextType {/g, `export function useContactConfigProviderValue(
  config: any,
): ContactConfigContextType {`);

fs.writeFileSync('apps/frontend/src/lib/contacts/useContactConfigProviderValue.ts', content, 'utf8');
console.log('Cleaned useContactConfigProviderValue.ts');

