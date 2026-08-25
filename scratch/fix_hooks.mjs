import fs from 'fs';

// --- Contacts ---
const contactsHookPath = 'apps/frontend/src/tenant/features/contacts/hooks/useContactsPageTabPanelProps.ts';
let contactsHook = fs.readFileSync(contactsHookPath, 'utf8');
// Remove the import of ContactsPageTabPanelProps
contactsHook = contactsHook.replace('import type { ContactsPageTabPanelProps } from "@/tenant/features/contacts/components/ContactsPageTabPanel";\n', '');
// Replace return type and the object construction
contactsHook = contactsHook.replace('): ContactsPageTabPanelProps {', '): any {');
contactsHook = contactsHook.replace('(): ContactsPageTabPanelProps => ({', '() => ({\n      workTierProps: {\n');
contactsHook = contactsHook.replace('canWrite,\n      canEditSetup,\n      onImport: actions.handleImport,\n    })', 'canWrite\n      },\n      setupTierProps: {\n        canWrite,\n        canEditSetup,\n        onImport: actions.handleImport\n      }\n    })');
fs.writeFileSync(contactsHookPath, contactsHook);

// --- Students ---
const studentsHookPath = 'apps/frontend/src/tenant/features/students/hooks/useStudentsPageTabPanelProps.ts';
let studentsHook = fs.readFileSync(studentsHookPath, 'utf8');
studentsHook = studentsHook.replace('import type { StudentsPageTabPanelProps } from "@/tenant/features/students/components/StudentsPageTabPanel";\n', '');
studentsHook = studentsHook.replace('): StudentsPageTabPanelProps {', '): any {');
studentsHook = studentsHook.replace('(): StudentsPageTabPanelProps => ({', '() => ({\n      workTierProps: {\n');
studentsHook = studentsHook.replace('canWrite,\n    })', 'canWrite\n      },\n      setupTierProps: {}\n    })');
fs.writeFileSync(studentsHookPath, studentsHook);

// --- Teachers ---
const teachersHookPath = 'apps/frontend/src/tenant/features/teachers/hooks/useTeachersPageTabPanelProps.ts';
let teachersHook = fs.readFileSync(teachersHookPath, 'utf8');
teachersHook = teachersHook.replace('import type { TeachersPageTabPanelProps } from "@/tenant/features/teachers/components/TeachersPageTabPanel";\n', '');
teachersHook = teachersHook.replace('): TeachersPageTabPanelProps {', '): any {');
teachersHook = teachersHook.replace('(): TeachersPageTabPanelProps => ({', '() => ({\n      workTierProps: {\n');
teachersHook = teachersHook.replace('canWrite,\n    })', 'canWrite\n      },\n      setupTierProps: {}\n    })');
fs.writeFileSync(teachersHookPath, teachersHook);
