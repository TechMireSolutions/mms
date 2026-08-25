import fs from 'fs';

// Contacts
let contacts = fs.readFileSync('apps/frontend/src/tenant/features/contacts/components/ContactsPageView.tsx', 'utf8');
contacts = contacts.replace(/settingsPanelProps/g, 'setupTierProps');
fs.writeFileSync('apps/frontend/src/tenant/features/contacts/components/ContactsPageView.tsx', contacts);

// Students
let students = fs.readFileSync('apps/frontend/src/tenant/features/students/components/StudentsPageView.tsx', 'utf8');
students = students.replace(/settingsPanelProps/g, 'setupTierProps');
fs.writeFileSync('apps/frontend/src/tenant/features/students/components/StudentsPageView.tsx', students);

// Teachers
let teachers = fs.readFileSync('apps/frontend/src/tenant/features/teachers/components/TeachersPageView.tsx', 'utf8');
teachers = teachers.replace(/settingsPanelProps/g, 'setupTierProps');
fs.writeFileSync('apps/frontend/src/tenant/features/teachers/components/TeachersPageView.tsx', teachers);
