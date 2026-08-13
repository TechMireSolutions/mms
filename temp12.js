const fs = require('fs');
const path = '/Users/syedaalin/Documents/mms/apps/frontend/src/tenant/hooks/useModuleSettingsEditor.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export type ModuleSettingsShape = {[\s\S]*?};/,
  `export interface ModuleSettingsShape {
  fields?: Record<string, any>;
  customFields?: any[];
  fieldOrder?: string[];
  formTabs?: any[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}`
);

fs.writeFileSync(path, content, 'utf8');
