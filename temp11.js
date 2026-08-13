const fs = require('fs');
const path = '/Users/syedaalin/Documents/mms/apps/frontend/src/tenant/hooks/useModuleSettingsEditor.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export interface ModuleSettingsShape {[\s\S]*?\[key: string\]: any;\n}/,
  `export type ModuleSettingsShape = {
  fields?: Record<string, any>;
  customFields?: any[];
  fieldOrder?: string[];
  formTabs?: any[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  [key: string]: any;
};`
);

fs.writeFileSync(path, content, 'utf8');
