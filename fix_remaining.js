const fs = require('fs');

function replaceInFile(file, regexList) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  for (const [reg, rep] of regexList) {
    content = content.replace(reg, rep);
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}

// 1. useContactsToolbarModel.ts
replaceInFile('apps/frontend/src/tenant/features/contacts/hooks/useContactsToolbarModel.ts', [
  [/searchPlaceholder: t\('contacts\.searchColumnsPlaceholder'\),\n?/g, ''],
  [/labels: \{\n[\s\S]*?\},\n/g, '']
]);

// 2. useContactsToolbarModel.test.tsx
replaceInFile('apps/frontend/src/tenant/features/contacts/hooks/useContactsToolbarModel.test.tsx', [
  [/'contacts\.searchColumnsPlaceholder': '.*',\n?/g, ''],
  [/"contacts\.searchColumnsPlaceholder": '.*',\n?/g, '']
]);

// 3. hooks missing translationPrefix
const hooksMissingPrefix = [
  'apps/frontend/src/tenant/features/examinations/hooks/useExaminationExamColumnLayout.ts',
  'apps/frontend/src/tenant/features/examinations/hooks/useExaminationResultsColumnLayout.ts',
  'apps/frontend/src/tenant/features/hasanat/hooks/useHasanatDistributionColumnLayout.ts',
  'apps/frontend/src/tenant/features/hasanat/hooks/useHasanatRedemptionColumnLayout.ts',
  'apps/frontend/src/tenant/features/messaging/hooks/useMessagingColumnLayouts.ts',
  'apps/frontend/src/tenant/features/obligations/hooks/useObligationColumnLayout.ts',
  'apps/frontend/src/tenant/features/question-bank/hooks/useQuestionBankColumnLayout.ts',
  'apps/frontend/src/tenant/features/users/hooks/useUserActivityColumnLayout.ts'
];
for (const hook of hooksMissingPrefix) {
  replaceInFile(hook, [
    [/translationPrefix: '.*',\n?/g, '']
  ]);
}

// 4. FinancePage missing labels
replaceInFile('apps/frontend/src/tenant/features/finance/FinancePage.tsx', [
  [/labels=\{paymentsColumnCustomizerLabels\}\n?/g, ''],
  [/labels=\{invoicesColumnCustomizerLabels\}\n?/g, ''],
  [/const paymentsColumnCustomizerLabels = [\s\S]*?\};\n/g, ''],
  [/const invoicesColumnCustomizerLabels = [\s\S]*?\};\n/g, '']
]);

// 5. PaymentsListFilters
replaceInFile('apps/frontend/src/tenant/features/finance/components/PaymentsListFilters.tsx', [
  [/labels=\{paymentsColumnCustomizerLabels\}\n?/g, ''],
  [/const paymentsColumnCustomizerLabels = [\s\S]*?\};\n/g, '']
]);

// 6. MessagingWorkTierDirectory
replaceInFile('apps/frontend/src/tenant/features/messaging/components/MessagingWorkTierDirectory.tsx', [
  [/customizerLabels=\{.*\}\n?/g, ''],
  [/customizerLabels,\n?/g, '']
]);

// 7. SessionsPage and SessionsWorkFilters
replaceInFile('apps/frontend/src/tenant/features/sessions/SessionsPage.tsx', [
  [/customizerLabels=\{.*\}\n?/g, ''],
  [/customizerLabels: sessionsColumnCustomizerLabels,\n?/g, '']
]);
replaceInFile('apps/frontend/src/tenant/features/sessions/components/SessionsWorkFilters.tsx', [
  [/labels=\{labels\}\n?/g, ''],
  [/labels: ModuleColumnCustomizerLabels;\n?/g, '']
]);

// 8. students and teachers
replaceInFile('apps/frontend/src/tenant/features/students/hooks/useStudentColumnLayout.ts', [
  [/customizerLabels: \{\n[\s\S]*?\},\n/g, ''],
  [/searchPlaceholder: t\('students\.searchColumnsPlaceholder'\),\n/g, '']
]);

replaceInFile('apps/frontend/src/tenant/features/teachers/hooks/useTeacherColumnLayout.ts', [
  [/customizerLabels: \{\n[\s\S]*?\},\n/g, ''],
  [/searchPlaceholder: t\('teachers\.searchColumnsPlaceholder'\),\n/g, '']
]);

replaceInFile('apps/frontend/src/tenant/features/teachers/hooks/useTeachersPageController.ts', [
  [/customizerLabels=\{.*\}\n?/g, ''],
  [/customizerLabels,\n?/g, '']
]);

