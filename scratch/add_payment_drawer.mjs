import fs from 'fs';

let ctrlPath = 'apps/frontend/src/tenant/features/finance/hooks/useFinancePageController.ts';
let ctrl = fs.readFileSync(ctrlPath, 'utf8');

ctrl = ctrl.replace(
  /const \[paymentFormState, setPaymentFormState\] = useState<\n    \{ open: false; invoiceId\?: string \} \| \{ open: true; invoiceId: string \}\n  >\(\{ open: false \}\);/,
  `const [paymentFormState, setPaymentFormState] = useState<\n    { open: false; invoiceId?: string } | { open: true; invoiceId: string }\n  >({ open: false });\n  const [activePayment, setActivePayment] = useState<any>(null);`
);

ctrl = ctrl.replace(
  /return \{/,
  `return {
    activePayment,
    setActivePayment,`
);

fs.writeFileSync(ctrlPath, ctrl);

let pagePath = 'apps/frontend/src/tenant/features/finance/FinancePage.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

page = page.replace(
  /import \{ PaymentTracker \} from "@\/tenant\/features\/finance\/components\/PaymentTracker";/,
  `import { PaymentTracker } from "@/tenant/features/finance/components/PaymentTracker";\nimport { PaymentDetail } from "@/tenant/features/finance/components/PaymentDetail";`
);

page = page.replace(
  /updateUserColumnLayout: c\.paymentColumnLayout\.updateUserColumnLayout,\n                    labels: c\.paymentColumnLayout\.customizerLabels,\n                  \}\}/,
  `updateUserColumnLayout: c.paymentColumnLayout.updateUserColumnLayout,\n                    labels: c.paymentColumnLayout.customizerLabels,\n                  }}\n                  onRowClick={(id) => {\n                    const p = c.payments.find((x: any) => x.id === id);\n                    if (p) c.setActivePayment(p);\n                  }}`
);

page = page.replace(
  /<\/ModulePageShell>/,
  `</ModulePageShell>

      <AnimatePresence>
        {c.activePayment && (
          <PaymentDetail
            payment={c.activePayment}
            onClose={() => c.setActivePayment(null)}
            canDelete={c.canDelete}
            onRestore={c.restorePayment.mutateAsync}
          />
        )}
      </AnimatePresence>`
);

fs.writeFileSync(pagePath, page);

// Update PaymentTracker.tsx
let ptPath = 'apps/frontend/src/tenant/features/finance/components/PaymentTracker.tsx';
let pt = fs.readFileSync(ptPath, 'utf8');

pt = pt.replace(
  /export interface PaymentTrackerProps \{/,
  `export interface PaymentTrackerProps {\n  onRowClick?: (id: string) => void;`
);

pt = pt.replace(
  /columnCustomizer,\n\}: PaymentTrackerProps\) \{/,
  `columnCustomizer,\n  onRowClick,\n}: PaymentTrackerProps) {`
);

pt = pt.replace(
  /onColumnResize=\{onColumnResize\}\n        \/>/,
  `onColumnResize={onColumnResize}\n          onRowClick={onRowClick}\n        />`
);

fs.writeFileSync(ptPath, pt);

// Update PaymentTrackerList.tsx
let ptlPath = 'apps/frontend/src/tenant/features/finance/components/PaymentTrackerList.tsx';
let ptl = fs.readFileSync(ptlPath, 'utf8');

ptl = ptl.replace(
  /onColumnResize\?: \(key: string, width: number\) => void;/,
  `onColumnResize?: (key: string, width: number) => void;\n  onRowClick?: (id: string) => void;`
);

fs.writeFileSync(ptlPath, ptl);

// Update PaymentsListDesktopTable.tsx
let dtPath = 'apps/frontend/src/tenant/features/finance/components/PaymentsListDesktopTable.tsx';
let dt = fs.readFileSync(dtPath, 'utf8');

dt = dt.replace(
  /onColumnResize,\n\}: PaymentsListDesktopTableProps\) \{/,
  `onColumnResize,\n  onRowClick,\n}: PaymentsListDesktopTableProps) {`
);

dt = dt.replace(
  /const handleRowClick = \(id: string\) => \{/,
  `const handleRowClick = (id: string) => {\n    onRowClick?.(id);`
);

fs.writeFileSync(dtPath, dt);
