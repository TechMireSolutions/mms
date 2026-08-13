const fs = require('fs');

const files = [
  { path: 'apps/frontend/src/tenant/features/attendance/components/AttendanceSettings.tsx', type: 'AttendanceSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/accounting/components/AccountingSettings.tsx', type: 'AccountingSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/hasanat/components/HasanatSettings.tsx', type: 'HasanatSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/enrollments/components/EnrollmentsSettings.tsx', type: 'EnrollmentsSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/contacts/hooks/useContactsSetupPanelState.ts', type: 'ContactsSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/teachers/components/TeachersSettings.tsx', type: 'TeachersSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/sessions/components/SessionsSettings.tsx', type: 'SessionsSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/users/hooks/useUsersSetupPanelState.ts', type: 'UsersSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/question-bank/components/QuestionBankSettings.tsx', type: 'QuestionBankSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/examinations/components/ExaminationsSettings.tsx', type: 'ExaminationsSettings', module: '@mms/shared' },
  { path: 'apps/frontend/src/tenant/features/finance/components/FinanceSettings.tsx', type: 'FinanceSettings', module: '@mms/shared' }
];

for (const { path, type } of files) {
  const fullPath = '/Users/syedaalin/Documents/mms/' + path;
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Add explicit generic
  content = content.replace(/useModuleSettingsEditor\(\{/, `useModuleSettingsEditor<${type}>({`);
  
  // Ensure the type is imported from @mms/shared
  if (!content.includes(type) || !content.match(new RegExp(`import.*${type}.*@mms/shared`))) {
    // try to add it
    if (content.match(/import.*@mms\/shared["'];/)) {
      content = content.replace(/(import\s*{[^}]*)(}\s*from\s*['"]@mms\/shared['"];)/, `$1, type ${type} $2`);
    } else {
      content = `import { type ${type} } from "@mms/shared";\n` + content;
    }
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
}
