const fs = require('fs');

const f = '/Users/syedaalin/Documents/mms/apps/frontend/src/hooks/useStandardModuleConfig.ts';
let code = fs.readFileSync(f, 'utf8');
code = code.replace(/import type \{ HasanatSettings \} from '@mms\/shared';\n/, "");
fs.writeFileSync(f, code);

