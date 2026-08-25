import fs from 'fs';
import path from 'path';

const dir = 'src/tenant/features/obligations/components';

// Rename files
const renames = [
  ['ObligationsListDesktopTable.tsx', 'ObligationCollectionsListDesktopTable.tsx'],
  ['ObligationsListFilters.tsx', 'ObligationCollectionsListFilters.tsx']
];

for (const [oldName, newName] of renames) {
  const oldPath = path.join(dir, oldName);
  const newPath = path.join(dir, newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${oldName} to ${newName}`);
  }
}

// Update imports in ObligationCollectionsListContent.tsx
const contentPath = path.join(dir, 'ObligationCollectionsListContent.tsx');
if (fs.existsSync(contentPath)) {
  let content = fs.readFileSync(contentPath, 'utf8');
  content = content.replace(/ObligationsListDesktopTable/g, 'ObligationCollectionsListDesktopTable');
  fs.writeFileSync(contentPath, content);
  console.log('Updated ObligationCollectionsListContent.tsx');
}

// Update imports in ObligationCollectionsList.tsx
const listPath = path.join(dir, 'ObligationCollectionsList.tsx');
if (fs.existsSync(listPath)) {
  let content = fs.readFileSync(listPath, 'utf8');
  content = content.replace(/ObligationsListFilters/g, 'ObligationCollectionsListFilters');
  fs.writeFileSync(listPath, content);
  console.log('Updated ObligationCollectionsList.tsx');
}

// Update exports in renamed files
const newTablePath = path.join(dir, 'ObligationCollectionsListDesktopTable.tsx');
if (fs.existsSync(newTablePath)) {
  let content = fs.readFileSync(newTablePath, 'utf8');
  content = content.replace(/ObligationsListDesktopTableProps/g, 'ObligationCollectionsListDesktopTableProps');
  content = content.replace(/ObligationsListDesktopTable/g, 'ObligationCollectionsListDesktopTable');
  fs.writeFileSync(newTablePath, content);
}

const newFiltersPath = path.join(dir, 'ObligationCollectionsListFilters.tsx');
if (fs.existsSync(newFiltersPath)) {
  let content = fs.readFileSync(newFiltersPath, 'utf8');
  content = content.replace(/ObligationsListFiltersProps/g, 'ObligationCollectionsListFiltersProps');
  content = content.replace(/ObligationsListFilters/g, 'ObligationCollectionsListFilters');
  fs.writeFileSync(newFiltersPath, content);
}

