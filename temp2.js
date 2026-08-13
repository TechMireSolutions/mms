const fs = require('fs');
const path = '/Users/syedaalin/Documents/mms/apps/frontend/src/hooks/useStandardModuleConfig.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /setPreferencesMemory: setSessionPreferencesMemory,/g,
  'setPreferencesMemory: setSessionPreferencesMemory as unknown as (prefs: unknown) => void,'
);

content = content.replace(
  /tabs as string\[\],/g,
  'tabs as any,'
);

content = content.replace(
  /setPreferencesMemory: setAttendancePreferencesMemory,/g,
  'setPreferencesMemory: setAttendancePreferencesMemory as unknown as (prefs: unknown) => void,'
);

fs.writeFileSync(path, content, 'utf8');
