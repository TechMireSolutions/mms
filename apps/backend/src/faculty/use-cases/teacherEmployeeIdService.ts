import { eq } from 'drizzle-orm';
import {
  formatDeterministicEmployeeId,
  DEFAULT_TEACHERS_SETTINGS,
  type TeacherEmployeeIdSettings,
} from '@mms/shared';
import { teacherSetupConfig, type TeacherSetupConfigRow } from '../../db/schema/faculty.js';
import { withTenant, withTenantRead } from '../../db/tenant-context.js';

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
 * Retrieves the current employee ID setup config for a tenant, falling back to defaults if not found.
 */
export async function getTeacherSetupConfig(tenant: string): Promise<TeacherSetupConfigRow> {
  const subdomain = tenant.trim().toLowerCase();
  return await withTenantRead(subdomain, async (tx) => {
    const currentYear = new Date().getFullYear();
    const fallbackRow: TeacherSetupConfigRow = {
      workspaceSubdomain: subdomain,
      prefix: DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix ?? 'FAC',
      yearFormat: DEFAULT_TEACHERS_SETTINGS.employeeIdYearFormat ?? 'YYYY',
      sequenceDigits: DEFAULT_TEACHERS_SETTINGS.employeeIdSequenceDigits ?? 4,
      delimiter: DEFAULT_TEACHERS_SETTINGS.employeeIdDelimiter ?? '',
      currentSequence: DEFAULT_TEACHERS_SETTINGS.employeeIdCurrentSequence ?? 0,
      lastYear: DEFAULT_TEACHERS_SETTINGS.employeeIdLastYear ?? currentYear,
      updatedAt: new Date(),
    };

    if (!tx || typeof tx.select !== 'function') {
      return fallbackRow;
    }

    const [row] = await tx
      .select()
      .from(teacherSetupConfig)
      .where(eq(teacherSetupConfig.workspaceSubdomain, subdomain));

    return row ?? fallbackRow;
  });
}

/**
 * Updates or creates the employee ID setup config for a tenant.
 */
export async function updateTeacherSetupConfig(
  tenant: string,
  patch: Partial<TeacherEmployeeIdSettings>,
): Promise<TeacherSetupConfigRow> {
  const subdomain = tenant.trim().toLowerCase();
  return await withTenant(subdomain, async (tx) => {
    const currentYear = new Date().getFullYear();
    if (!tx || typeof tx.select !== 'function') {
      return {
        workspaceSubdomain: subdomain,
        prefix: patch.employeeIdPrefix ?? DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix ?? 'FAC',
        yearFormat: patch.employeeIdYearFormat ?? DEFAULT_TEACHERS_SETTINGS.employeeIdYearFormat ?? 'YYYY',
        sequenceDigits: patch.employeeIdSequenceDigits ?? DEFAULT_TEACHERS_SETTINGS.employeeIdSequenceDigits ?? 4,
        delimiter: patch.employeeIdDelimiter ?? DEFAULT_TEACHERS_SETTINGS.employeeIdDelimiter ?? '',
        currentSequence: patch.employeeIdCurrentSequence ?? DEFAULT_TEACHERS_SETTINGS.employeeIdCurrentSequence ?? 0,
        lastYear: patch.employeeIdLastYear ?? currentYear,
        updatedAt: new Date(),
      };
    }

    const [existing] = await tx
      .select()
      .from(teacherSetupConfig)
      .where(eq(teacherSetupConfig.workspaceSubdomain, subdomain))
      .for('update');

    const prefix = patch.employeeIdPrefix !== undefined
      ? patch.employeeIdPrefix.trim()
      : (existing?.prefix ?? DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix);

    const yearFormat = patch.employeeIdYearFormat !== undefined
      ? patch.employeeIdYearFormat
      : (existing?.yearFormat ?? DEFAULT_TEACHERS_SETTINGS.employeeIdYearFormat);

    const sequenceDigits = patch.employeeIdSequenceDigits !== undefined
      ? Number(patch.employeeIdSequenceDigits)
      : (existing?.sequenceDigits ?? DEFAULT_TEACHERS_SETTINGS.employeeIdSequenceDigits);

    const delimiter = patch.employeeIdDelimiter !== undefined
      ? patch.employeeIdDelimiter
      : (existing?.delimiter ?? DEFAULT_TEACHERS_SETTINGS.employeeIdDelimiter);

    const currentSequence = patch.employeeIdCurrentSequence !== undefined
      ? Number(patch.employeeIdCurrentSequence)
      : (existing?.currentSequence ?? DEFAULT_TEACHERS_SETTINGS.employeeIdCurrentSequence);

    const lastYear = patch.employeeIdLastYear !== undefined
      ? Number(patch.employeeIdLastYear)
      : (existing?.lastYear ?? currentYear);

    const values = {
      workspaceSubdomain: subdomain,
      prefix,
      yearFormat,
      sequenceDigits,
      delimiter,
      currentSequence,
      lastYear,
      updatedAt: new Date(),
    };

    const [saved] = await tx
      .insert(teacherSetupConfig)
      .values(values)
      .onConflictDoUpdate({
        target: teacherSetupConfig.workspaceSubdomain,
        set: {
          prefix: values.prefix,
          yearFormat: values.yearFormat,
          sequenceDigits: values.sequenceDigits,
          delimiter: values.delimiter,
          currentSequence: values.currentSequence,
          lastYear: values.lastYear,
          updatedAt: values.updatedAt,
        },
      })
      .returning();

    return saved;
  });
}

/**
 * Previews the next employee ID without incrementing the sequence in the database.
 */
export async function previewNextEmployeeId(tenant: string): Promise<EmployeeIdPreviewResult> {
  const subdomain = tenant.trim().toLowerCase();
  return await withTenantRead(subdomain, async (tx) => {
    const currentYear = new Date().getFullYear();
    if (!tx || typeof tx.select !== 'function') {
      const config = {
        prefix: DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix ?? 'FAC',
        yearFormat: (DEFAULT_TEACHERS_SETTINGS.employeeIdYearFormat ?? 'YYYY') as 'YYYY' | 'YY' | 'NONE',
        sequenceDigits: DEFAULT_TEACHERS_SETTINGS.employeeIdSequenceDigits ?? 4,
        delimiter: DEFAULT_TEACHERS_SETTINGS.employeeIdDelimiter ?? '',
        currentSequence: DEFAULT_TEACHERS_SETTINGS.employeeIdCurrentSequence ?? 0,
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
      .select()
      .from(teacherSetupConfig)
      .where(eq(teacherSetupConfig.workspaceSubdomain, subdomain));

    const config = {
      prefix: row?.prefix ?? DEFAULT_TEACHERS_SETTINGS.employeeIdPrefix,
      yearFormat: (row?.yearFormat ?? DEFAULT_TEACHERS_SETTINGS.employeeIdYearFormat) as 'YYYY' | 'YY' | 'NONE',
      sequenceDigits: row?.sequenceDigits ?? DEFAULT_TEACHERS_SETTINGS.employeeIdSequenceDigits,
      delimiter: row?.delimiter ?? DEFAULT_TEACHERS_SETTINGS.employeeIdDelimiter,
      currentSequence: row?.currentSequence ?? DEFAULT_TEACHERS_SETTINGS.employeeIdCurrentSequence,
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

export { generateNextEmployeeId } from './teacherEmployeeIdGenerator.js';

export const getFacultySetupConfig = getTeacherSetupConfig;
export const updateFacultySetupConfig = updateTeacherSetupConfig;
export const previewNextFacultyEmployeeId = previewNextEmployeeId;
export { generateNextEmployeeId as generateNextFacultyEmployeeId } from './teacherEmployeeIdGenerator.js';
