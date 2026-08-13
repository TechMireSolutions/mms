const fs = require('fs');

const f = '/Users/syedaalin/Documents/mms/apps/backend/src/db/migrations/060_migrate_hasanat_setup_config.ts';
let code = fs.readFileSync(f, 'utf8');
code = code.replace(/import \{\n  setHasanatFieldConfig,\n\} from '\.\.\/repositories\/hasanatFieldConfigRepository\.js';\n/, "");
code = code.replace(/import \{\n  setHasanatModulePreferences,\n\} from '\.\.\/repositories\/hasanatModulePreferencesRepository\.js';\n/, "");
fs.writeFileSync(f, code);

