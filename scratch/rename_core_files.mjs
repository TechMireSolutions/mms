import fs from 'fs';
import path from 'path';

const basePath = 'apps/frontend/src/tenant/features';

const renames = [
  // Students
  ['students/components/StudentsWorkListBody.tsx', 'students/components/StudentsList.tsx'],
  ['students/components/StudentList.tsx', 'students/components/StudentsListContent.tsx'],
  ['students/components/StudentListContent.tsx', 'students/components/StudentsListViews.tsx'],
  ['students/components/StudentListCards.tsx', 'students/components/StudentsListCards.tsx'],
  ['students/components/StudentListActionsMenu.tsx', 'students/components/StudentsRowActions.tsx'],
  ['students/components/StudentListContentTypes.ts', 'students/components/studentsListTypes.ts'],
  ['students/components/StudentListDesktopTableCells.tsx', 'students/components/studentsListDesktopTableCells.tsx'],
  ['students/components/StudentListDesktopTableRow.tsx', 'students/components/studentsListDesktopTableRow.tsx'],
  ['students/components/studentListVisibleColumns.ts', 'students/components/studentsListVisibleColumns.ts'],
  ['students/components/studentListCustomColumns.ts', 'students/components/studentsListCustomColumns.ts'],
  ['students/components/studentListCustomColumns.test.ts', 'students/components/studentsListCustomColumns.test.ts'],
  ['students/components/studentListDesktopTableSimpleCells.tsx', 'students/components/studentsListDesktopTableSimpleCells.tsx'],

  // Contacts
  ['contacts/components/ContactsWorkListBody.tsx', 'contacts/components/ContactsList.tsx'],
  ['contacts/components/ContactCards.tsx', 'contacts/components/ContactsListCards.tsx'],
  ['contacts/components/ContactActionMenu.tsx', 'contacts/components/ContactsRowActions.tsx'],

  // Users
  ['users/components/UsersListRowActions.tsx', 'users/components/UsersRowActions.tsx'],

  // Messaging
  ['messaging/components/MessagingWorkCards.tsx', 'messaging/components/MessagingListCards.tsx']
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
