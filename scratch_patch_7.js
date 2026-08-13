const fs = require('fs');
const files = [
  '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatFieldConfigRepository.ts',
  '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatModulePreferencesRepository.ts',
  '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatDistributionUserColumnPrefsRepository.ts',
  '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatRedemptionUserColumnPrefsRepository.ts'
];

for (const f of files) {
  let code = fs.readFileSync(f, 'utf8');
  // hasanatFieldConfigRepository
  code = code.replace(/import \{ createModuleFieldConfigRepo \} from '\.\/factories\/moduleFieldConfigRepoFactory\.js';/, "import { createWorkspaceSingletonJsonRepo } from './moduleSetupRepoFactories.js';");
  code = code.replace(/createModuleFieldConfigRepo\(/, "createWorkspaceSingletonJsonRepo({\n  table: hasanatFieldConfigs,\n  jsonColumn: 'config',\n}); // ");
  
  // hasanatModulePreferencesRepository
  code = code.replace(/import \{ createModulePreferencesRepo \} from '\.\/factories\/modulePreferencesRepoFactory\.js';/, "import { createWorkspaceSingletonJsonRepo } from './moduleSetupRepoFactories.js';");
  code = code.replace(/createModulePreferencesRepo\(/, "createWorkspaceSingletonJsonRepo({\n  table: hasanatModulePreferences,\n  jsonColumn: 'preferences',\n}); // ");

  // columnPrefs
  code = code.replace(/import \{ createUserColumnPrefsRepo \} from '\.\/factories\/userColumnPrefsRepoFactory\.js';/, "import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';");
  if(f.includes('hasanatDistribution')) {
    code = code.replace(/createUserColumnPrefsRepo\(hasanatDistributionUserColumnPrefs\);/, "createUserColumnPrefsRepo({\n  table: hasanatDistributionUserColumnPrefs as never,\n});");
  }
  if(f.includes('hasanatRedemption')) {
    code = code.replace(/createUserColumnPrefsRepo\(hasanatRedemptionUserColumnPrefs\);/, "createUserColumnPrefsRepo({\n  table: hasanatRedemptionUserColumnPrefs as never,\n});");
  }
  
  fs.writeFileSync(f, code);
}
