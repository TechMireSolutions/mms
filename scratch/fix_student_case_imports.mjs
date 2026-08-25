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
  [/studentsListDesktopTableCells/g, 'StudentsListDesktopTableCells'],
  [/studentsListDesktopTableRow/g, 'StudentsListDesktopTableRow'],
  [/studentsListDesktopTableSimpleCells/g, 'StudentsListDesktopTableSimpleCells']
];

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Fixed case in: ${file}`);
  }
}
