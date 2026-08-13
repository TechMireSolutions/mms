const fs = require('fs');
const path = '/Users/syedaalin/Documents/mms/apps/frontend/src/tenant/hooks/useModuleSettingsEditor.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export interface ModuleSettingsShape {[\s\S]*?\[key: string\]: unknown;\n}/,
  `export interface ModuleSettingsShape {
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[] | any[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[] | any[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}`
);

fs.writeFileSync(path, content, 'utf8');
