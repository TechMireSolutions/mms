import { eq } from 'drizzle-orm';
import {
  formatDeterministicEmployeeId,
  DEFAULT_FACULTY_SETTINGS,
} from '@mms/shared';
import { facultySetupConfig } from '../../db/schema/faculty.js';
import { withTenantRead } from '../../db/tenant-context.js';

export interface NextEmployeeIdResult {
  employeeId: string;
  sequence: number;
  year: number;
}

export interface EmployeeIdPreviewResult {
  nextEmployeeId: string;
  config: {
    prefix: string;
    yearFormat: 'YYYY' | 'YY' | 'NONE';
    sequenceDigits: number;
    delimiter: string;
    currentSequence: number;
    lastYear: number;
  };
}

/**
 * Previews the next employee ID without incrementing the sequence in the database.
 */
export async function previewNextFacultyEmployeeId(tenant: string): Promise<EmployeeIdPreviewResult> {
  const subdomain = tenant.trim().toLowerCase();
  return await withTenantRead(subdomain, async (tx) => {
    const currentYear = new Date().getFullYear();
    if (!tx || typeof tx.select !== 'function') {
      const config = {
        prefix: DEFAULT_FACULTY_SETTINGS.employeeIdPrefix ?? 'FAC',
        yearFormat: (DEFAULT_FACULTY_SETTINGS.employeeIdYearFormat ?? 'YYYY') as 'YYYY' | 'YY' | 'NONE',
        sequenceDigits: DEFAULT_FACULTY_SETTINGS.employeeIdSequenceDigits ?? 4,
        delimiter: DEFAULT_FACULTY_SETTINGS.employeeIdDelimiter ?? '',
        currentSequence: DEFAULT_FACULTY_SETTINGS.employeeIdCurrentSequence ?? 0,
        lastYear: currentYear,
      };
      const nextEmployeeId = formatDeterministicEmployeeId(
        1,
        {
          prefix: config.prefix,
          yearFormat: config.yearFormat === 'YY' ? 'YY' : 'YYYY',
          sequenceDigits: config.sequenceDigits,
          delimiter: config.delimiter,
        },
        new Date(currentYear, 0, 1),
      );
      return {
        nextEmployeeId,
        config,
      };
    }

    const [row] = await tx
      .select({
        prefix: facultySetupConfig.prefix,
        yearFormat: facultySetupConfig.yearFormat,
        sequenceDigits: facultySetupConfig.sequenceDigits,
        delimiter: facultySetupConfig.delimiter,
        currentSequence: facultySetupConfig.currentSequence,
        lastYear: facultySetupConfig.lastYear,
      })
      .from(facultySetupConfig)
      .where(eq(facultySetupConfig.workspaceSubdomain, subdomain));

    const config = {
      prefix: row?.prefix ?? DEFAULT_FACULTY_SETTINGS.employeeIdPrefix,
      yearFormat: (row?.yearFormat ?? DEFAULT_FACULTY_SETTINGS.employeeIdYearFormat) as 'YYYY' | 'YY' | 'NONE',
      sequenceDigits: row?.sequenceDigits ?? DEFAULT_FACULTY_SETTINGS.employeeIdSequenceDigits,
      delimiter: row?.delimiter ?? DEFAULT_FACULTY_SETTINGS.employeeIdDelimiter,
      currentSequence: row?.currentSequence ?? DEFAULT_FACULTY_SETTINGS.employeeIdCurrentSequence,
      lastYear: row?.lastYear ?? currentYear,
    };

    const nextSeq = config.lastYear !== currentYear ? 1 : config.currentSequence + 1;
    const yearToUse = config.lastYear !== currentYear ? currentYear : config.lastYear;

    const nextEmployeeId = formatDeterministicEmployeeId(
      nextSeq,
      {
        prefix: config.prefix,
        yearFormat: config.yearFormat === 'YY' ? 'YY' : 'YYYY',
        sequenceDigits: config.sequenceDigits,
        delimiter: config.delimiter,
      },
      new Date(yearToUse, 0, 1),
    );

    return {
      nextEmployeeId,
      config,
    };
  });
}

export const previewNextEmployeeId = previewNextFacultyEmployeeId;
