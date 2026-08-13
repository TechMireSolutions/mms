const fs = require('fs');

const f1 = '/Users/syedaalin/Documents/mms/apps/backend/src/services/hasanatConfigService.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/hasanatFieldConfig\.save\(config as HasanatSettings\);/, "hasanatFieldConfig.save(config as Partial<HasanatSettings> as any);");
fs.writeFileSync(f1, c1);

const f2 = '/Users/syedaalin/Documents/mms/apps/backend/src/db/migrations/060_migrate_hasanat_setup_config.ts';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/workspaceSubdomain: obj\.workspaceSubdomain,/g, "workspaceSubdomain: obj.workspaceSubdomain as never,");
c2 = c2.replace(/userId: obj\.userId,/g, "userId: obj.userId as never,");
fs.writeFileSync(f2, c2);

