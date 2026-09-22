import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const roots = ['apps/backend/src', 'apps/frontend/src', 'packages/shared/src'];
const forbidden = [
  ['/api/teachers', 'legacy Teacher API route'],
  ['CREATE VIEW "teachers"', 'legacy Teacher compatibility view'],
  ['hydrateFacultySetupFromLegacyBackup', 'legacy Faculty backup hydrator'],
  ['hydrateTeachersSetupFromLegacyObjects', 'legacy Teacher backup hydrator'],
];
const violations = [];
const requiredSchemaNeedles = [
  'facultyDesignations',
  'facultyDesignationRoles',
  'facultyDesignationAssignments',
];

for (const root of roots) {
  for await (const file of glob(`${root}/**/*.{ts,tsx,js,mjs,sql}`)) {
    if (file.includes('/migrations_drizzle/')) continue;
    const source = await readFile(file, 'utf8');
    for (const [needle, label] of forbidden) {
      if (source.includes(needle)) violations.push(`${file}: ${label}`);
    }
  }
}

const facultySchema = await readFile('apps/backend/src/db/schema/faculty.ts', 'utf8');
for (const needle of requiredSchemaNeedles) {
  if (!facultySchema.includes(needle)) violations.push(`apps/backend/src/db/schema/faculty.ts: missing ${needle}`);
}

const temporalMigration = await readFile('apps/backend/src/db/migrations_drizzle/0123_faculty_temporal_designations.sql', 'utf8');
if (!temporalMigration.includes('faculty_designation_assignments_no_overlap_excl')) {
  violations.push('0123 migration: missing non-overlapping Faculty designation period constraint');
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Faculty domain legacy-surface check passed.');
}
