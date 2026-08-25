import fs from 'fs';

let pagePath = 'apps/frontend/src/tenant/features/finance/FinancePage.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  /export default function Finance\(\) \{/,
  `export default function Finance() {`
);

page = page.replace(
  /<ModulePageShell/,
  `<>\n    <ModulePageShell`
);

page = page.replace(
  /<\/ModulePageShell>\n\n      <AnimatePresence>/,
  `</ModulePageShell>\n\n      <AnimatePresence>`
);

page = page.replace(
  /<\/AnimatePresence>\n  \);\n\}/,
  `</AnimatePresence>\n    </>\n  );\n}`
);

fs.writeFileSync(pagePath, page);
