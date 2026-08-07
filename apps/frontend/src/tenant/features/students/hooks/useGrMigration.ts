import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/lib/apiClient';
import { invalidateStudentsQueries } from '@/tenant/features/students/hooks/invalidateStudentsQueries';
import { STUDENTS_API } from '@/tenant/features/students/hooks/studentsQueryKeys';

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
 * Calls server migrate endpoint once for Setup writers on the Work tab (matches BE setupWrite).
 */
export function useGrMigration(activeTab: string, canEditSetup: boolean): void {
  const queryClient = useQueryClient();
  const [needsMigrationScan, setNeedsMigrationScan] = useState(() => !grMigrationAlreadyDone());
  const migrationAppliedRef = useRef(false);

  useEffect(() => {
    if (!canEditSetup || !needsMigrationScan || activeTab !== 'work') return;
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
        invalidateStudentsQueries(queryClient);
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
  }, [activeTab, canEditSetup, needsMigrationScan, queryClient]);
}
