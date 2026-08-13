const fs = require('fs');
const file = '/Users/syedaalin/Documents/mms/packages/shared/src/hasanatSetupConfigTypes.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace duplicate imports at the bottom
code = code.replace(
  /import type \{ FieldDefinition \} from '\.\/contactTypes\.js';\nimport \{ mergeFormTabsWithCustomTabs \} from '\.\/formTabsMergeUtils\.js';/,
  `import { mergeFormTabsWithCustomTabs } from './formTabsMergeUtils.js';\nimport { HASANAT_TAB_REGISTRY } from './moduleFieldSetupFinance.js';`
);

code = code.replace(
  /export function mergeHasanatFormTabsFromApi\(\n  documentFormTabs: TabDefinition\[\] \| undefined,\n  apiTabs: TabDefinition\[\],\n\): TabDefinition\[\] \{/,
  `export function mergeHasanatFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
): TabDefinition[] {`
);

code = code.replace(/\(seedTab\) =>/g, "(seedTab: TabDefinition) =>");

fs.writeFileSync(file, code);
