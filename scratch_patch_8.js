const fs = require('fs');

const f1 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatFieldConfigRepository.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/getHasanatFieldConfig = repo.getModuleFieldConfig/, 'getHasanatFieldConfig = repo.getByWorkspace');
c1 = c1.replace(/setHasanatFieldConfig = repo.setModuleFieldConfig/, 'setHasanatFieldConfig = repo.upsert');
c1 = c1.replace(/replaceHasanatFieldConfigsForWorkspace = repo.replaceModuleFieldConfigsForWorkspace/, 'replaceHasanatFieldConfigsForWorkspace = repo.replaceForWorkspace');
c1 = c1.replace(/listAllHasanatFieldConfigsByWorkspace = repo.listAllModuleFieldConfigsByWorkspace/, 'listAllHasanatFieldConfigsByWorkspace = repo.listAllByWorkspace');
fs.writeFileSync(f1, c1);

const f2 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatModulePreferencesRepository.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/getHasanatModulePreferences = repo.getModulePreferences/, 'getHasanatModulePreferences = repo.getByWorkspace');
c2 = c2.replace(/setHasanatModulePreferences = repo.setModulePreferences/, 'setHasanatModulePreferences = repo.upsert');
c2 = c2.replace(/replaceHasanatModulePreferencesForWorkspace = repo.replaceModulePreferencesForWorkspace/, 'replaceHasanatModulePreferencesForWorkspace = repo.replaceForWorkspace');
c2 = c2.replace(/listAllHasanatModulePreferencesByWorkspace = repo.listAllModulePreferencesByWorkspace/, 'listAllHasanatModulePreferencesByWorkspace = repo.listAllByWorkspace');
fs.writeFileSync(f2, c2);

const f3 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatDistributionUserColumnPrefsRepository.ts';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/getHasanatDistributionUserColumnPrefs = repo.getUserColumnPrefs/, 'getHasanatDistributionUserColumnPrefs = repo.get');
c3 = c3.replace(/setHasanatDistributionUserColumnPrefs = repo.setUserColumnPrefs/, 'setHasanatDistributionUserColumnPrefs = repo.set');
c3 = c3.replace(/replaceHasanatDistributionUserColumnPrefsForWorkspace = repo.replaceUserColumnPrefsForWorkspace/, 'replaceHasanatDistributionUserColumnPrefsForWorkspace = repo.replaceForWorkspace');
c3 = c3.replace(/listAllHasanatDistributionUserColumnPrefsByWorkspace = repo.listAllUserColumnPrefsByWorkspace/, 'listAllHasanatDistributionUserColumnPrefsByWorkspace = repo.listAllByWorkspace');
fs.writeFileSync(f3, c3);

const f4 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/repositories/hasanatRedemptionUserColumnPrefsRepository.ts';
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace(/getHasanatRedemptionUserColumnPrefs = repo.getUserColumnPrefs/, 'getHasanatRedemptionUserColumnPrefs = repo.get');
c4 = c4.replace(/setHasanatRedemptionUserColumnPrefs = repo.setUserColumnPrefs/, 'setHasanatRedemptionUserColumnPrefs = repo.set');
c4 = c4.replace(/replaceHasanatRedemptionUserColumnPrefsForWorkspace = repo.replaceUserColumnPrefsForWorkspace/, 'replaceHasanatRedemptionUserColumnPrefsForWorkspace = repo.replaceForWorkspace');
c4 = c4.replace(/listAllHasanatRedemptionUserColumnPrefsByWorkspace = repo.listAllUserColumnPrefsByWorkspace/, 'listAllHasanatRedemptionUserColumnPrefsByWorkspace = repo.listAllByWorkspace');
fs.writeFileSync(f4, c4);

