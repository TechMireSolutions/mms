const fs = require('fs');
const file = '/Users/syedaalin/Documents/mms/apps/backend/src/routes/tenant/hasanatSetupConfigRoutes.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /import \{\n  HASANAT_MODULE_MANIFEST,/,
  `import type { HasanatSettings } from '@mms/shared';\nimport {\n  HASANAT_MODULE_MANIFEST,`
);

code = code.replace(
  /saveFieldConfig: updateHasanatFieldConfigService,/,
  `saveFieldConfig: (body) => updateHasanatFieldConfigService(body as HasanatSettings),`
);

code = code.replace(
  /savePreferences: updateHasanatPreferencesService,/,
  `savePreferences: (normalized) => updateHasanatPreferencesService(normalized as never),`
);

fs.writeFileSync(file, code);
