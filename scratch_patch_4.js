const fs = require('fs');
const file = '/Users/syedaalin/Documents/mms/apps/backend/src/services/hasanatConfigService.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /export async function updateHasanatFieldConfigService\(\n  config: HasanatSettings \| Record<string, unknown>,\n\): Promise<HasanatSettings> \{\n  return hasanatFieldConfig.save\(config as HasanatSettings\);\n\}/,
  `export async function updateHasanatFieldConfigService(
  config: HasanatSettings | Record<string, unknown>,
): Promise<HasanatSettings> {
  return hasanatFieldConfig.save(config as HasanatSettings);
}`
);

fs.writeFileSync(file, code);
