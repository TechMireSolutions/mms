const fs = require('fs');

// Fix hasanatFieldConfigRepository.ts
const repo1 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatFieldConfigRepository.ts';
let code1 = fs.readFileSync(repo1, 'utf8');
code1 = code1.replace(/'\.\/factories\/createModuleFieldConfigRepo\.js'/, "'./factories/moduleFieldConfigRepoFactory.js'");
fs.writeFileSync(repo1, code1);

// Fix hasanatModulePreferencesRepository.ts
const repo2 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatModulePreferencesRepository.ts';
let code2 = fs.readFileSync(repo2, 'utf8');
code2 = code2.replace(/'\.\/factories\/createModulePreferencesRepo\.js'/, "'./factories/modulePreferencesRepoFactory.js'");
fs.writeFileSync(repo2, code2);

// Fix hasanatDistributionUserColumnPrefsRepository.ts
const repo3 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatDistributionUserColumnPrefsRepository.ts';
let code3 = fs.readFileSync(repo3, 'utf8');
code3 = code3.replace(/'\.\/factories\/createUserColumnPrefsRepo\.js'/, "'./factories/userColumnPrefsRepoFactory.js'");
fs.writeFileSync(repo3, code3);

// Fix hasanatRedemptionUserColumnPrefsRepository.ts
const repo4 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatRedemptionUserColumnPrefsRepository.ts';
let code4 = fs.readFileSync(repo4, 'utf8');
code4 = code4.replace(/'\.\/factories\/createUserColumnPrefsRepo\.js'/, "'./factories/userColumnPrefsRepoFactory.js'");
fs.writeFileSync(repo4, code4);

