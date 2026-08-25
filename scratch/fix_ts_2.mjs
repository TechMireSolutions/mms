import fs from 'fs';

let pagePath = 'apps/frontend/src/tenant/features/hasanat/HasanatCardsPage.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  /onRestore=\{c\.restoreDistribution\.mutateAsync\}/,
  `onRestore={(id) => c.handleRestoreDistribution(id)}`
);

fs.writeFileSync(pagePath, page);

let detailPath = 'apps/frontend/src/tenant/features/hasanat/components/DistributionDetail.tsx';
let detail = fs.readFileSync(detailPath, 'utf8');

detail = detail.replace(
  /const \{ t, formatDate \} = useTranslation\(\);/,
  `const { t } = useTranslation();`
);

detail = detail.replace(
  /value=\{formatDate\(distribution\.issuedDate\)\}/,
  `value={distribution.issuedDate}`
);

fs.writeFileSync(detailPath, detail);
