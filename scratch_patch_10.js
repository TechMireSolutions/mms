const fs = require('fs');

const f1 = '/Users/syedaalin/Documents/mms/apps/backend/src/services/hasanatConfigService.ts';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/return composeHasanatSettings\(raw, prefs\);/, "return composeHasanatSettings((raw as unknown) as HasanatSettings, prefs);");
fs.writeFileSync(f1, c1);
