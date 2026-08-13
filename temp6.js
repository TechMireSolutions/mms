const fs = require('fs');
const path = '/Users/syedaalin/Documents/mms/apps/frontend/src/tenant/hooks/useModuleSettingsEditor.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace the import
content = content.replace(
  /import { type StandardModuleConfigSettingsLike as ModuleSettingsShape } from "@\/hooks\/createStandardModuleConfigHook";/,
  `import { type ModuleCustomField, type TabDefinition } from "@mms/shared";

export interface ModuleSettingsShape {
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[] | any[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[] | any[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  [key: string]: any;
}`
);

fs.writeFileSync(path, content, 'utf8');
