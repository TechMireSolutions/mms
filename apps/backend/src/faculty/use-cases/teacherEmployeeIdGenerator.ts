import { eq } from 'drizzle-orm';
import {
  formatDeterministicEmployeeId,
  DEFAULT_TEACHERS_SETTINGS,
} from '@mms/shared';
import { teacherSetupConfig } from '../../db/schema/faculty.js';
import { withTenant, type TenantTransaction } from '../../db/tenant-context.js';
import type { NextEmployeeIdResult } from './teacherEmployeeIdService.js';

/**
 * Atomically generates the next employee ID using SELECT ... FOR UPDATE on teacher_setup_config.
 * Handles annual rollover: when the year changes, sequence resets to 1.
 */
export async function generateNextEmployeeId(
  tenant: string,
  txClient?: TenantTransaction,
): Promise<NextEmployeeIdResult> {
  const subdomain = tenant.trim().toLowerCase();

  const executeAtomicIncrement = async (tx: TenantTransaction): Promise<NextEmployeeIdResult> => {
    const currentYear = new Date().getFullYear();

    if (!tx || typeof tx.select !== 'function') {
      const year = currentYear;
      const employeeId = formatDeterministicEmployeeId(
        1,
        {
          prefix: DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix,
          yearFormat: 'YYYY',
          sequenceDigits: 4,
          delimiter: '',
        },
        new Date(year, 0, 1),
      );
      return {
        employeeId,
        sequence: 1,
        year,
      };
    }

    // Lock existing row or insert default
    let [row] = await tx
      .select()
      .from(teacherSetupConfig)
      .where(eq(teacherSetupConfig.workspaceSubdomain, subdomain))
      .for('update');

    if (!row) {
      await tx
        .insert(teacherSetupConfig)
        .values({
          workspaceSubdomain: subdomain,
          prefix: DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix,
          yearFormat: DEFAULT_TEACHERS_SETTINGS.employeeIdYearFormat,
          sequenceDigits: DEFAULT_TEACHERS_SETTINGS.employeeIdSequenceDigits,
          delimiter: DEFAULT_TEACHERS_SETTINGS.employeeIdDelimiter,
          currentSequence: 0,
          lastYear: currentYear,
          updatedAt: new Date(),
        })
        .onConflictDoNothing();

      [row] = await tx
        .select()
        .from(teacherSetupConfig)
        .where(eq(teacherSetupConfig.workspaceSubdomain, subdomain))
        .for('update');
    }

    const prefix = row?.prefix ?? DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix;
    const yearFormat = (row?.yearFormat ?? DEFAULT_TEACHERS_SETTINGS.employeeIdYearFormat) as 'YYYY' | 'YY' | 'NONE';
    const sequenceDigits = row?.sequenceDigits ?? DEFAULT_TEACHERS_SETTINGS.employeeIdSequenceDigits;
    const delimiter = row?.delimiter ?? DEFAULT_TEACHERS_SETTINGS.employeeIdDelimiter;
    const lastYear = row?.lastYear ?? currentYear;
    const currentSequence = row?.currentSequence ?? 0;

    // Annual rollover: if current year != lastYear, reset sequence to 1
    let nextSeq: number;
    let yearToSave: number;

    if (lastYear !== currentYear) {
      nextSeq = 1;
      yearToSave = currentYear;
    } else {
      nextSeq = currentSequence + 1;
      yearToSave = currentYear;
    }

    await tx
      .update(teacherSetupConfig)
      .set({
        currentSequence: nextSeq,
        lastYear: yearToSave,
        updatedAt: new Date(),
      })
      .where(eq(teacherSetupConfig.workspaceSubdomain, subdomain));

    const employeeId = formatDeterministicEmployeeId(
      nextSeq,
      {
        prefix,
        yearFormat: yearFormat === 'YY' ? 'YY' : 'YYYY',
        sequenceDigits,
        delimiter,
      },
      new Date(yearToSave, 0, 1),
    );

    return {
      employeeId,
      sequence: nextSeq,
      year: yearToSave,
    };
  };

  if (txClient) {
    return await executeAtomicIncrement(txClient);
  }
  return await withTenant(subdomain, executeAtomicIncrement);
}
