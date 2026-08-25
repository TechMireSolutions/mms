import fs from 'fs';
import path from 'path';

const basePath = 'apps/frontend/src/tenant/features/students/components';

const renames = [
  ['studentsListDesktopTableCells.tsx', 'StudentsListDesktopTableCells.tsx'],
  ['studentsListDesktopTableRow.tsx', 'StudentsListDesktopTableRow.tsx'],
  ['studentsListDesktopTableSimpleCells.tsx', 'StudentsListDesktopTableSimpleCells.tsx']
];

for (const [oldName, newName] of renames) {
  const oldPath = path.join(basePath, oldName);
  const newPath = path.join(basePath, newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${oldPath} -> ${newPath}`);
  }
}
