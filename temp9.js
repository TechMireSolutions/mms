const fs = require('fs');
const path = '/Users/syedaalin/Documents/mms/apps/frontend/src/tenant/hooks/useModuleSettingsEditor.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export interface ModuleSettingsShape {[\s\S]*?}/,
  `export interface ModuleSettingsShape {
  fields?: Record<string, unknown>;
  customFields?: ModuleCustomField[] | unknown[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[] | unknown[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}`
);

fs.writeFileSync(path, content, 'utf8');
