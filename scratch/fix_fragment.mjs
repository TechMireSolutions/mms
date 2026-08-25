import fs from 'fs';

let pagePath = 'apps/frontend/src/tenant/features/hasanat/HasanatCardsPage.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  /export default function HasanatCards\(\) \{/,
  `import { DistributionDetail } from '@/tenant/features/hasanat/components/DistributionDetail';\n\nexport default function HasanatCards() {`
);

page = page.replace(
  /<ModulePageShell/,
  `<>\n    <ModulePageShell`
);

page = page.replace(
  /onDelete=\{c\.handleDeleteDistribution\}/,
  `onDelete={c.handleDeleteDistribution}\n                onRowClick={(id) => { const d = c.distributions.find((x: any) => x.id === id); if (d) c.setActiveDistribution(d); }}`
);

page = page.replace(
  /<\/ModulePageShell>\n  \);\n\}/,
  `</ModulePageShell>\n\n      <AnimatePresence>\n        {c.activeDistribution && (\n          <DistributionDetail\n            distribution={c.activeDistribution}\n            onClose={() => c.setActiveDistribution(null)}\n            canDelete={c.canDelete}\n            onRestore={c.restoreDistribution.mutateAsync}\n          />\n        )}\n      </AnimatePresence>\n    </>\n  );\n}`
);

fs.writeFileSync(pagePath, page);
