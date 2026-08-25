import fs from 'fs';

let listPath = 'apps/frontend/src/tenant/features/hasanat/components/DistributionsList.tsx';
let list = fs.readFileSync(listPath, 'utf8');

list = list.replace(
  /import \{ useDistributionsListState \} from "\.\/useDistributionsListState";/,
  `import { useDistributionsList } from "../hooks/useDistributionsList";`
);

list = list.replace(
  /useDistributionsListState\(\{/,
  `useDistributionsList({`
);

fs.writeFileSync(listPath, list);

let hookPath = 'apps/frontend/src/tenant/features/hasanat/hooks/useDistributionsList.ts';
let hook = fs.readFileSync(hookPath, 'utf8');

hook = hook.replace(
  /export function useDistributionsListState\(\{/,
  `export function useDistributionsList({`
);

fs.writeFileSync(hookPath, hook);
