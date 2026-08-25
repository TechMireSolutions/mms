import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles('apps/frontend/src', []);

const replacements = [
  // Hasanat
  [/DistributionManagerListDesktopTable/g, 'DistributionsListDesktopTable'],
  [/DistributionManagerListCards/g, 'DistributionsListCards'],
  [/DistributionManagerListFilters/g, 'DistributionsListFilters'],
  [/DistributionManagerList/g, 'DistributionsListContent'],
  [/DistributionManager/g, 'DistributionsList'],
  [/DistributionRowActions/g, 'DistributionsRowActions'],
  [/distributionManagerListShared/g, 'distributionsListShared'],
  [/useDistributionManagerState/g, 'useDistributionsList'],
  [/components\/useDistributionsList/g, 'hooks/useDistributionsList'],
  
  // Finance - Payments
  [/PaymentTrackerListMobile/g, 'PaymentsListCards'],
  [/PaymentTrackerList/g, 'PaymentsListContent'],
  [/PaymentTracker/g, 'PaymentsList'],

  // Finance - Invoices
  [/InvoiceListCards/g, 'InvoicesListCards'],
  [/InvoiceListContent/g, 'InvoicesListContent'],
  [/InvoiceListRowActions/g, 'InvoicesRowActions'],
  [/InvoiceList/g, 'InvoicesList'],
  [/invoiceListContentShared/g, 'invoicesListShared'],
  
  // Examinations
  [/ExamsList/g, 'ExaminationsList'],
  
  // Question Bank
  [/QuestionBankListDesktopTable/g, 'QuestionsListDesktopTable'],
  [/QuestionBankListCards/g, 'QuestionsListCards'],
  [/QuestionBankListFilters/g, 'QuestionsListFilters'],
  [/QuestionBankList/g, 'QuestionsList'],
  [/QuestionBankRowActions/g, 'QuestionsRowActions'],
  [/questionBankListShared/g, 'questionsListShared']
];

let changedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated imports in: ${file}`);
    changedCount++;
  }
}
console.log(`Updated ${changedCount} files.`);
