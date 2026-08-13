const fs = require('fs');

const f1 = '/Users/syedaalin/Documents/mms/apps/backend/src/services/hasanatConfigService.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/return composeHasanatSettings\(\(raw as unknown\) as HasanatSettings, prefs\);/, "return composeHasanatSettings((raw as unknown) as HasanatSettings, (prefs || {}) as any);");
fs.writeFileSync(f1, c1);

const f2 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/migrations/060_migrate_hasanat_setup_config.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/workspaceSubdomain: obj\.workspaceSubdomain as never,/g, "workspaceSubdomain: obj.workspaceSubdomain,");
c2 = c2.replace(/userId: obj\.userId as never,/g, "userId: obj.userId,");
c2 = c2.replace(/await tx\.insert\(hasanatDistributionUserColumnPrefs\)\.values\(distPrefsToInsert\);/, "await tx.insert(hasanatDistributionUserColumnPrefs).values(distPrefsToInsert as never[]);");
c2 = c2.replace(/await tx\.insert\(hasanatRedemptionUserColumnPrefs\)\.values\(redempPrefsToInsert\);/, "await tx.insert(hasanatRedemptionUserColumnPrefs).values(redempPrefsToInsert as never[]);");
fs.writeFileSync(f2, c2);

