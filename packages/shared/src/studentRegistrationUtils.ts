import type { StudentsSettings } from './settingsTypes.js';

export type StudentGrNumberSettings = Pick<
  StudentsSettings,
  'grNumberTemplate' | 'grNumberDigits' | 'grNumberRestartAnnually'
>;

export type StudentDuplicateCheckInput = {
  excludeId?: string;
  contactId?: string | number;
  email?: string;
  name?: string;
  dob?: string;
};

export type StudentDuplicateReason = 'contact' | 'email' | 'nameDob';

type StudentRow = {
  id?: string | number;
  contactId?: string | number;
  email?: string;
  name?: string;
  dob?: string;
  registeredDate?: string;
  grNumber?: string;
};

/** Next GR number from roster + tenant settings (shared FE/BE). */
export function computeNextGrNumber(
  students: StudentRow[],
  settings: StudentGrNumberSettings,
  regDate: string,
): string {
  const template = settings.grNumberTemplate || '{seq}-{year}';
  const digits = settings.grNumberDigits || 4;
  const restartAnnually = settings.grNumberRestartAnnually !== false;
  const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();

  let nextSeq = 1;
  if (restartAnnually) {
    const yearlyStudents = students.filter((s) => {
      const sDate = s.registeredDate || '';
      if (sDate.startsWith(String(year))) return true;
      if (s.grNumber && String(s.grNumber).includes(String(year))) return true;
      return false;
    });
    nextSeq = yearlyStudents.length + 1;
  } else {
    nextSeq = students.length + 1;
  }

  const seqStr = String(nextSeq).padStart(digits, '0');
  return template.replace('{seq}', seqStr).replace('{year}', String(year));
}

/** Client-side duplicate guard before save (server authoritative on POST). */
export function findStudentRegistrationConflict(
  students: StudentRow[],
  input: StudentDuplicateCheckInput,
): StudentDuplicateReason | null {
  const excludeId = input.excludeId ? String(input.excludeId) : undefined;
  const email = input.email?.trim().toLowerCase();
  const name = input.name?.trim().toLowerCase();
  const dob = input.dob?.trim();

  for (const row of students) {
    if (excludeId && String(row.id) === excludeId) continue;

    if (
      input.contactId != null &&
      row.contactId != null &&
      String(input.contactId) === String(row.contactId)
    ) {
      return 'contact';
    }

    if (email && row.email && email === row.email.trim().toLowerCase()) {
      return 'email';
    }

    if (name && dob && row.name && row.dob) {
      if (name === row.name.trim().toLowerCase() && dob === row.dob) {
        return 'nameDob';
      }
    }
  }

  return null;
}

export function collectStudentLinkedContactIds(
  students: StudentRow[],
  excludeStudentId?: string,
): Array<string | number> {
  const exclude = excludeStudentId ? String(excludeStudentId) : undefined;
  return students
    .filter((row) => !exclude || String(row.id) !== exclude)
    .map((row) => row.contactId)
    .filter((id): id is string | number => id != null && id !== '');
}
