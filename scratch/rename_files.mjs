import fs from 'fs';
import path from 'path';

const basePath = 'apps/frontend/src/tenant/features';

const renames = [
  // Hasanat
  ['hasanat/components/DistributionManager.tsx', 'hasanat/components/DistributionsList.tsx'],
  ['hasanat/components/DistributionManagerList.tsx', 'hasanat/components/DistributionsListContent.tsx'],
  ['hasanat/components/DistributionManagerListCards.tsx', 'hasanat/components/DistributionsListCards.tsx'],
  ['hasanat/components/DistributionManagerListDesktopTable.tsx', 'hasanat/components/DistributionsListDesktopTable.tsx'],
  ['hasanat/components/DistributionManagerListFilters.tsx', 'hasanat/components/DistributionsListFilters.tsx'],
  ['hasanat/components/DistributionRowActions.tsx', 'hasanat/components/DistributionsRowActions.tsx'],
  ['hasanat/components/distributionManagerListShared.ts', 'hasanat/components/distributionsListShared.ts'],
  ['hasanat/hooks/useDistributionManagerState.ts', 'hasanat/hooks/useDistributionsList.ts'],
  
  // Finance (Payments)
  ['finance/components/PaymentTracker.tsx', 'finance/components/PaymentsList.tsx'],
  ['finance/components/PaymentTrackerList.tsx', 'finance/components/PaymentsListContent.tsx'],
  ['finance/components/PaymentTrackerListMobile.tsx', 'finance/components/PaymentsListCards.tsx'],
  
  // Finance (Invoices)
  ['finance/components/InvoiceList.tsx', 'finance/components/InvoicesList.tsx'],
  ['finance/components/InvoiceListCards.tsx', 'finance/components/InvoicesListCards.tsx'],
  ['finance/components/InvoiceListContent.tsx', 'finance/components/InvoicesListContent.tsx'],
  ['finance/components/InvoiceListRowActions.tsx', 'finance/components/InvoicesRowActions.tsx'],
  ['finance/components/invoiceListContentShared.ts', 'finance/components/invoicesListShared.ts'],
  
  // Examinations
  ['examinations/components/ExamsList.tsx', 'examinations/components/ExaminationsList.tsx'],
  
  // Question Bank
  ['question-bank/components/QuestionBankList.tsx', 'question-bank/components/QuestionsList.tsx'],
  ['question-bank/components/QuestionBankListCards.tsx', 'question-bank/components/QuestionsListCards.tsx'],
  ['question-bank/components/QuestionBankListDesktopTable.tsx', 'question-bank/components/QuestionsListDesktopTable.tsx'],
  ['question-bank/components/QuestionBankListFilters.tsx', 'question-bank/components/QuestionsListFilters.tsx'],
  ['question-bank/components/QuestionBankRowActions.tsx', 'question-bank/components/QuestionsRowActions.tsx'],
  ['question-bank/components/questionBankListShared.tsx', 'question-bank/components/questionsListShared.tsx']
];

for (const [oldName, newName] of renames) {
  const oldPath = path.join(basePath, oldName);
  const newPath = path.join(basePath, newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${oldPath} -> ${newPath}`);
  } else {
    console.log(`Not found: ${oldPath}`);
  }
}
