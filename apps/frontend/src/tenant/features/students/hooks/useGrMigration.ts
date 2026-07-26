import { useState, useEffect, useRef } from 'react';
import { type StudentsSettings, todayISO } from '@mms/shared';
import { fetchAllStudentsForQuery, type StudentRecord, useStudentMutations } from './useStudents';

const STUDENTS_GR_MIGRATION_KEY = 'mms_students_gr_migration_v1';

function grMigrationAlreadyDone(): boolean {
  try {
    return localStorage.getItem(STUDENTS_GR_MIGRATION_KEY) === '1';
  } catch {
    return false;
  }
}

function applyGrNumberMigration(
  rawStudents: StudentRecord[],
  settings: StudentsSettings,
): { students: StudentRecord[]; didMigrate: boolean } {
  const template = settings.grNumberTemplate || '{seq}-{year}';
  const digits = settings.grNumberDigits || 4;
  const restartAnnually = settings.grNumberRestartAnnually !== false;

  let didMigrate = false;
  const migratedStudents = rawStudents.map((studentRecord, studentIndex) => {
    if (!studentRecord.grNumber) {
      didMigrate = true;
      const registeredDate = (studentRecord.registeredDate as string | undefined) || todayISO();
      const year = registeredDate ? new Date(registeredDate).getFullYear() : new Date().getFullYear();

      let nextSeq = 1;
      if (restartAnnually) {
        const yearlyStudents = rawStudents.slice(0, studentIndex).filter((prev) => {
          const prevDate = (prev.registeredDate as string | undefined) || '';
          if (prevDate.startsWith(String(year))) return true;
          if (prev.grNumber && String(prev.grNumber).includes(String(year))) return true;
          return false;
        });
        nextSeq = yearlyStudents.length + 1;
      } else {
        nextSeq = studentIndex + 1;
      }

      const seqStr = String(nextSeq).padStart(digits, '0');
      const autoGr = template.replace('{seq}', seqStr).replace('{year}', String(year));
      return { ...studentRecord, grNumber: autoGr };
    }
    return studentRecord;
  });

  return { students: migratedStudents, didMigrate };
}

/**
 * Runs a one-time GR number back-fill migration on the Work tab.
 * Records completion in localStorage so it only runs once per device.
 */
export function useGrMigration(
  settings: StudentsSettings,
  updateStudent: ReturnType<typeof useStudentMutations>['updateStudent'],
  activeTab: string,
): void {
  const [needsMigrationScan, setNeedsMigrationScan] = useState(() => !grMigrationAlreadyDone());
  const migrationAppliedRef = useRef(false);

  useEffect(() => {
    if (!needsMigrationScan || activeTab !== 'work') return;
    let cancelled = false;

    void (async () => {
      try {
        const rawForMigration = await fetchAllStudentsForQuery({});
        if (cancelled) return;
        const { students: migratedForGr, didMigrate } = applyGrNumberMigration(rawForMigration, settings);
        if (didMigrate && !migrationAppliedRef.current) {
          migrationAppliedRef.current = true;
          await Promise.all(
            migratedForGr.map((student) =>
              updateStudent.mutateAsync({ id: String(student.id), student }),
            ),
          );
        }
      } finally {
        if (!cancelled) {
          try {
            localStorage.setItem(STUDENTS_GR_MIGRATION_KEY, '1');
          } catch {
            /* ignore */
          }
          setNeedsMigrationScan(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsMigrationScan, activeTab, settings, updateStudent]);
}
