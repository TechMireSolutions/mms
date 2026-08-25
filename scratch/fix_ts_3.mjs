import fs from 'fs';

let ptPath = 'apps/frontend/src/tenant/features/finance/components/PaymentTracker.tsx';
let pt = fs.readFileSync(ptPath, 'utf8');

pt = pt.replace(
  /export interface PaymentTrackerProps \{/,
  `export interface PaymentTrackerProps {\n  onRowClick?: (id: string) => void;`
);

fs.writeFileSync(ptPath, pt);

let pdPath = 'apps/frontend/src/tenant/features/finance/components/PaymentDetail.tsx';
let pd = fs.readFileSync(pdPath, 'utf8');

pd = pd.replace(
  /const \{ t, formatMoney \} = useTranslation\(\);/,
  `const { t } = useTranslation();`
);

pd = pd.replace(
  /value=\{formatMoney \? formatMoney\(payment\.amount\) : payment\.amount\.toString\(\)\}/,
  `value={payment.amount.toString()}`
);

fs.writeFileSync(pdPath, pd);

let fpPath = 'apps/frontend/src/tenant/features/finance/FinancePage.tsx';
let fp = fs.readFileSync(fpPath, 'utf8');

fp = fp.replace(
  /onRowClick=\{\(id\) => \{/,
  `onRowClick={(id: string) => {`
);

fs.writeFileSync(fpPath, fp);
