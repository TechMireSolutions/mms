import fs from 'fs';
import path from 'path';

const basePath = 'apps/frontend/src/tenant/features';

const renames = [
  // Students
  ['students/components/StudentsSettingsPanel.tsx', 'students/components/StudentsSetupTier.tsx'],
  
  // Contacts
  ['contacts/components/ContactsSettingsPanel.tsx', 'contacts/components/ContactsSetupTier.tsx'],
  
  // Messaging
  ['messaging/components/MessagingWorkPanel.tsx', 'messaging/components/MessagingWorkTier.tsx'],
  ['messaging/components/MessagingReportsPanel.tsx', 'messaging/components/MessagingReportsTier.tsx'],
  ['messaging/components/MessagingSetupPanel.tsx', 'messaging/components/MessagingSetupTier.tsx']
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
