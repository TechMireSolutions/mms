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
  // Students
  [/StudentsWorkListBody/g, 'StudentsList'],
  [/StudentListDesktopTableCells/g, 'studentsListDesktopTableCells'],
  [/StudentListDesktopTableRow/g, 'studentsListDesktopTableRow'],
  [/StudentListContentTypes/g, 'studentsListTypes'],
  [/StudentListActionsMenu/g, 'StudentsRowActions'],
  [/StudentListCards/g, 'StudentsListCards'],
  [/StudentListContent/g, 'StudentsListViews'],
  [/StudentList/g, 'StudentsListContent'], // Watch out for collisions, we already did some
  [/studentListVisibleColumns/g, 'studentsListVisibleColumns'],
  [/studentListCustomColumns/g, 'studentsListCustomColumns'],
  [/studentListDesktopTableSimpleCells/g, 'studentsListDesktopTableSimpleCells'],

  // Contacts
  [/ContactsWorkListBody/g, 'ContactsList'],
  [/ContactCards/g, 'ContactsListCards'],
  [/ContactActionMenu/g, 'ContactsRowActions'],

  // Users
  [/UsersListRowActions/g, 'UsersRowActions'],

  // Messaging
  [/MessagingWorkCards/g, 'MessagingListCards']
];

let changedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }

  // Double check the StudentList logic because StudentList => StudentsListContent but StudentsListContent shouldn't be mapped again
  // Actually regex for StudentList matches StudentsList since Student is inside Students. 
  // Wait, /StudentList/g matches "StudentList", "StudentsList" doesn't match if it's exact but it matches "StudentList" inside "StudentsList"? No, "Student" is not "Students".
  
  if (content !== originalContent) {
    // If we mistakenly changed `useStudentListController` to `useStudentsListContentController`
    content = content.replace(/useStudentsListContentController/g, 'useStudentListController');
    // If we mistakenly changed `StudentsListContent` to `StudentssListContentContent`
    // Let's rely on typecheck for any weirdness.
    fs.writeFileSync(file, content);
    console.log(`Updated imports in: ${file}`);
    changedCount++;
  }
}
console.log(`Updated ${changedCount} files.`);
