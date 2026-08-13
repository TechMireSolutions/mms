const fs = require('fs');
const file = '/Users/syedaalin/Documents/mms/packages/shared/src/hasanatSetupConfigTypes.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `import type { TabDefinition } from './contactTypes.js';
import { HASANAT_TAB_REGISTRY } from './moduleFieldSetupHasanat.js';

export function mergeHasanatFormTabsFromApi(
  documentFormTabs: TabDefinition[] | undefined,
  apiTabs: TabDefinition[],
): TabDefinition[] {
  const documentOrDefault =
    documentFormTabs && documentFormTabs.length > 0 ? documentFormTabs : [...HASANAT_TAB_REGISTRY];
  const merged =
    apiTabs.length === 0
      ? documentOrDefault
      : [
          ...apiTabs,
          ...HASANAT_TAB_REGISTRY.filter(
            (seedTab) => !apiTabs.some((apiTab) => apiTab.key === seedTab.key),
          ),
        ];
  const seenKeys = new Set<string>();
  return merged.filter((tab) => {
    if (!tab?.key || seenKeys.has(tab.key)) return false;
    seenKeys.add(tab.key);
    return true;
  });
}`;

code = code.replace(/import type \{ FieldDefinition \}[\s\S]*\}\)/, replacement);

fs.writeFileSync(file, code);
