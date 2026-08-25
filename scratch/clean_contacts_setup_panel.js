const fs = require('fs');
let content = fs.readFileSync('apps/frontend/src/tenant/features/contacts/components/ContactsSetupPanel.tsx', 'utf8');

// remove FieldConfig import and props
content = content.replace(/import { FieldConfig } from "@mms\/shared";\n/g, '');
content = content.replace(/  config: FieldConfig;\n/g, '');
content = content.replace(/  onConfigChange: \(config: FieldConfig\) => void;\n/g, '');
content = content.replace(/  onConfigChangeAsync\?: \(config: FieldConfig\) => Promise<void>;\n/g, '');

content = content.replace(/  config,\n/g, '');
content = content.replace(/  onConfigChange,\n/g, '');
content = content.replace(/  onConfigChangeAsync,\n/g, '');

fs.writeFileSync('apps/frontend/src/tenant/features/contacts/components/ContactsSetupPanel.tsx', content, 'utf8');

let settingsPanel = fs.readFileSync('apps/frontend/src/tenant/features/contacts/components/ContactsSettingsPanel.tsx', 'utf8');
settingsPanel = settingsPanel.replace(/              config=\{\{\}\}\n/g, '');
settingsPanel = settingsPanel.replace(/              onConfigChange=\{\(\) => \{\}\}\n/g, '');
settingsPanel = settingsPanel.replace(/              onConfigChangeAsync=\{async \(\) => \{\}\}\n/g, '');
fs.writeFileSync('apps/frontend/src/tenant/features/contacts/components/ContactsSettingsPanel.tsx', settingsPanel, 'utf8');
