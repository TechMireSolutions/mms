import { useState, useEffect, useRef } from 'react';
import { apiJson } from '@/lib/apiClient';
import { STUDENTS_API } from '@/tenant/features/students/hooks/studentsQueryShared';

const STUDENTS_GR_MIGRATION_KEY = 'mms_students_gr_migration_v1';

function grMigrationAlreadyDone(): boolean {
  try {
    return localStorage.getItem(STUDENTS_GR_MIGRATION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * One-shot GR number backfill for legacy students missing `grNumber`.
 * Calls server migrate endpoint once for writers on the Work tab.
 */
export function useGrMigration(activeTab: string, canWrite: boolean): void {
  const [needsMigrationScan, setNeedsMigrationScan] = useState(() => !grMigrationAlreadyDone());
  const migrationAppliedRef = useRef(false);

  useEffect(() => {
    if (!canWrite || !needsMigrationScan || activeTab !== 'work') return;
    let cancelled = false;

    void (async () => {
      if (migrationAppliedRef.current) return;
      migrationAppliedRef.current = true;
      try {
        await apiJson<{ success: boolean; updated: number }>(`${STUDENTS_API}/migrate-gr-numbers`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        if (cancelled) return;
        try {
          localStorage.setItem(STUDENTS_GR_MIGRATION_KEY, '1');
        } catch (err: unknown) {
          console.warn('[Students] Failed to record GR migration status in localStorage:', err);
        }
        setNeedsMigrationScan(false);
      } catch (err: unknown) {
        console.warn('[Students] GR migration request failed:', err);
        migrationAppliedRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, canWrite, needsMigrationScan]);
}
