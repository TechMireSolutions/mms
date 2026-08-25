import fs from 'fs';
let wPath = '/Users/syedaalin/.gemini/antigravity-ide/brain/83e4716b-8416-47f4-9ea0-f6b7fda2926b/walkthrough.md';

let content = fs.readFileSync(wPath, 'utf8');
content += `
## List File Naming Standardization
Standardized the naming of all List-related components across the four modules to adhere strictly to the \`{EntityPlural}List*\` convention set by \`mms-structure-naming.md\`.

### Hasanat
- \`DistributionManager.tsx\` → \`DistributionsList.tsx\`
- \`DistributionManagerList.tsx\` → \`DistributionsListContent.tsx\`
- All related \`DistributionManager*\` files were pluralized and aligned to \`DistributionsList*\`.
- Moved and renamed \`useDistributionManagerState.ts\` from \`components/\` to \`hooks/useDistributionsList.ts\`.

### Finance
- \`PaymentTracker.tsx\` → \`PaymentsList.tsx\`
- \`PaymentTrackerList.tsx\` → \`PaymentsListContent.tsx\`
- \`PaymentTrackerListMobile.tsx\` → \`PaymentsListCards.tsx\`
- \`InvoiceList*\` components pluralized to \`InvoicesList*\`.

### Examinations & Question Bank
- \`ExamsList.tsx\` → \`ExaminationsList.tsx\`
- \`QuestionBankList*\` components renamed to \`QuestionsList*\` to match the data entity ("Questions").

### Verification
- Automatically scanned the \`apps/frontend\` package and updated 29 import paths.
- Execution of \`pnpm typecheck\` on the \`apps/frontend\` workspace passed without errors, verifying that all cross-file exports and imports match the new standard perfectly.
`;

fs.writeFileSync(wPath, content);
