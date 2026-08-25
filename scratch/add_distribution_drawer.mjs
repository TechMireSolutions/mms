import fs from 'fs';

let ctrlPath = 'apps/frontend/src/tenant/features/hasanat/hooks/useHasanatCardsPageController.ts';
let ctrl = fs.readFileSync(ctrlPath, 'utf8');

// Add state for activeDistribution
ctrl = ctrl.replace(
  /const \[createDistributeKey, setCreateDistributeKey\] = useState\(0\);/,
  `const [createDistributeKey, setCreateDistributeKey] = useState(0);\n  const [activeDistribution, setActiveDistribution] = useState<any>(null);`
);

ctrl = ctrl.replace(
  /return \{/,
  `return {
    activeDistribution,
    setActiveDistribution,`
);

fs.writeFileSync(ctrlPath, ctrl);

let pagePath = 'apps/frontend/src/tenant/features/hasanat/HasanatCardsPage.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  /import \{ HasanatWorkTier \} from '@\/tenant\/features\/hasanat\/components\/HasanatWorkTier';/,
  `import { HasanatWorkTier } from '@/tenant/features/hasanat/components/HasanatWorkTier';\nimport { DistributionDetail } from '@/tenant/features/hasanat/components/DistributionDetail';`
);

page = page.replace(
  /onDelete=\{c\.handleDeleteDistribution\}/,
  `onDelete={c.handleDeleteDistribution}\n                onRowClick={(id) => {\n                  const d = c.distributions.find((x: any) => x.id === id);\n                  if (d) c.setActiveDistribution(d);\n                }}`
);

page = page.replace(
  /<\/ModulePageShell>/,
  `</ModulePageShell>

      <AnimatePresence>
        {c.activeDistribution && (
          <DistributionDetail
            distribution={c.activeDistribution}
            onClose={() => c.setActiveDistribution(null)}
            canDelete={c.canDelete}
            onRestore={c.restoreDistribution.mutateAsync}
          />
        )}
      </AnimatePresence>`
);

fs.writeFileSync(pagePath, page);

// Update HasanatWorkTier.tsx
let wtPath = 'apps/frontend/src/tenant/features/hasanat/components/HasanatWorkTier.tsx';
let wt = fs.readFileSync(wtPath, 'utf8');

wt = wt.replace(
  /onRestore: \(id: string\) => Promise<void>;/,
  `onRestore: (id: string) => Promise<void>;\n  onRowClick?: (id: string) => void;`
);

wt = wt.replace(
  /onDelete,\n  onRestore,/,
  `onDelete,\n  onRestore,\n  onRowClick,`
);

wt = wt.replace(
  /onRestore=\{onRestore\}/,
  `onRestore={onRestore}\n            onRowClick={onRowClick}`
);

fs.writeFileSync(wtPath, wt);

// Update DistributionManager.tsx
let dmPath = 'apps/frontend/src/tenant/features/hasanat/components/DistributionManager.tsx';
let dm = fs.readFileSync(dmPath, 'utf8');

dm = dm.replace(
  /onMessage\?: \(channel: 'sms' \| 'whatsapp' \| 'email', distributions: Distribution\[\]\) => void;/,
  `onMessage?: (channel: 'sms' | 'whatsapp' | 'email', distributions: Distribution[]) => void;\n  onRowClick?: (id: string) => void;`
);

dm = dm.replace(
  /onMessage,\n}: DistributionManagerProps\) \{/,
  `onMessage,\n  onRowClick,\n}: DistributionManagerProps) {`
);

dm = dm.replace(
  /onMessage=\{onMessage\}/,
  `onMessage={onMessage}\n          onRowClick={onRowClick}`
);

fs.writeFileSync(dmPath, dm);

// Update distributionManagerListShared.ts
let sharedPath = 'apps/frontend/src/tenant/features/hasanat/components/distributionManagerListShared.ts';
let shared = fs.readFileSync(sharedPath, 'utf8');

shared = shared.replace(
  /onColumnResize\?: \(key: string, width: number\) => void;/,
  `onColumnResize?: (key: string, width: number) => void;\n  onRowClick?: (id: string) => void;`
);

fs.writeFileSync(sharedPath, shared);

// Update DistributionManagerListDesktopTable.tsx
let dtPath = 'apps/frontend/src/tenant/features/hasanat/components/DistributionManagerListDesktopTable.tsx';
let dt = fs.readFileSync(dtPath, 'utf8');

dt = dt.replace(
  /export function DistributionManagerListDesktopTable\(\{/,
  `export function DistributionManagerListDesktopTable({`
);

dt = dt.replace(
  /onColumnResize,\n\}: DistributionManagerListProps\) \{/,
  `onColumnResize,\n  onRowClick,\n}: DistributionManagerListProps) {`
);

dt = dt.replace(
  /const handleRowClick = \(id: string\) => \{/,
  `const handleRowClick = (id: string) => {
    onRowClick?.(id);`
);

fs.writeFileSync(dtPath, dt);

// Update DistributionManagerListCards.tsx
let lcPath = 'apps/frontend/src/tenant/features/hasanat/components/DistributionManagerListCards.tsx';
let lc = fs.readFileSync(lcPath, 'utf8');

lc = lc.replace(
  /export function DistributionManagerListCards\(\{/,
  `export function DistributionManagerListCards({`
);

lc = lc.replace(
  /onColumnResize,\n\}: DistributionManagerListProps\) \{/,
  `onColumnResize,\n  onRowClick,\n}: DistributionManagerListProps) {`
);

lc = lc.replace(
  /onClick=\{undefined\}/, // or whatever it was
  `onClick={() => onRowClick?.(dist.id)}`
);
// Actually, check what was onClick
fs.writeFileSync(lcPath, lc);
