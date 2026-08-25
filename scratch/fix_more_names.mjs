import fs from 'fs';
import path from 'path';

// 1. useStudentsPageView.ts -> useStudentsPageController.ts
const studentsViewPath = 'apps/frontend/src/tenant/features/students/hooks/useStudentsPageView.ts';
const studentsCtrlPath = 'apps/frontend/src/tenant/features/students/hooks/useStudentsPageController.ts';
if (fs.existsSync(studentsViewPath)) {
  fs.renameSync(studentsViewPath, studentsCtrlPath);
}

// 2. useTeachersPageView.ts -> useTeachersPageController.ts
const teachersViewPath = 'apps/frontend/src/tenant/features/teachers/hooks/useTeachersPageView.ts';
const teachersCtrlPath = 'apps/frontend/src/tenant/features/teachers/hooks/useTeachersPageController.ts';
if (fs.existsSync(teachersViewPath)) {
  fs.renameSync(teachersViewPath, teachersCtrlPath);
}

// 3. Rename hook useStudentsPageWorkTierProps -> studentsPageWorkTierProps
const studentsPropsOld = 'apps/frontend/src/tenant/features/students/hooks/useStudentsPageWorkTierProps.ts';
const studentsPropsNew = 'apps/frontend/src/tenant/features/students/hooks/studentsPageWorkTierProps.ts';
if (fs.existsSync(studentsPropsOld)) {
  fs.renameSync(studentsPropsOld, studentsPropsNew);
}

// 4. Rename hook useTeachersPageWorkTierProps -> teachersPageWorkTierProps
const teachersPropsOld = 'apps/frontend/src/tenant/features/teachers/hooks/useTeachersPageWorkTierProps.ts';
const teachersPropsNew = 'apps/frontend/src/tenant/features/teachers/hooks/teachersPageWorkTierProps.ts';
if (fs.existsSync(teachersPropsOld)) {
  fs.renameSync(teachersPropsOld, teachersPropsNew);
}

// 5. Update useContactsPageController.ts export name
const contactsCtrl = 'apps/frontend/src/tenant/features/contacts/hooks/useContactsPageController.ts';
if (fs.existsSync(contactsCtrl)) {
  let content = fs.readFileSync(contactsCtrl, 'utf8');
  content = content.replace(/export function useContactsPageView\(/g, 'export function useContactsPageController(');
  fs.writeFileSync(contactsCtrl, content);
}

// 6. Update UsersPage.tsx export name
const usersPage = 'apps/frontend/src/tenant/features/users/UsersPage.tsx';
if (fs.existsSync(usersPage)) {
  let content = fs.readFileSync(usersPage, 'utf8');
  content = content.replace(/export default function Users\(/g, 'export default function UsersPage(');
  fs.writeFileSync(usersPage, content);
}

// 7. Update TeachersPage.tsx export name
const teachersPage = 'apps/frontend/src/tenant/features/teachers/TeachersPage.tsx';
if (fs.existsSync(teachersPage)) {
  let content = fs.readFileSync(teachersPage, 'utf8');
  content = content.replace(/export default function Teachers\(/g, 'export default function TeachersPage(');
  fs.writeFileSync(teachersPage, content);
}

console.log("Renames done.");
