import type { TeachersSettings } from './settingsTypes.js';
import { DEFAULT_TEACHERS_SETTINGS } from './facultyModuleSettings.js';

export type TeacherEmployeeIdSettings = Pick<
  TeachersSettings,
  | 'idPrefix'
  | 'idTemplate'
  | 'idDigits'
  | 'idStartSeq'
  | 'idRestartAnnually'
  | 'employeeIdPrefix'
  | 'employeeIdYearFormat'
  | 'employeeIdSequenceDigits'
  | 'employeeIdDelimiter'
  | 'employeeIdLastYear'
  | 'employeeIdCurrentSequence'
>;

/** Format deterministic employee ID matching {PREFIX}{DELIMITER}{YEAR}{DELIMITER}{SEQUENCE}. */
export function formatDeterministicEmployeeId(
  seq: number,
  options: {
    prefix?: string;
    yearFormat?: 'YYYY' | 'YY';
    sequenceDigits?: number;
    delimiter?: string;
  } = {},
  dateInput?: Date | string,
): string {
  const prefix = options.prefix?.trim() || 'FAC';
  const yearFormat = options.yearFormat === 'YY' ? 'YY' : 'YYYY';
  const digits = Math.max(2, Math.min(8, Number(options.sequenceDigits) || 4));
  const delimiter = options.delimiter !== undefined ? options.delimiter : '';
  const parsedDate = dateInput
    ? dateInput instanceof Date
      ? dateInput
      : new Date(dateInput)
    : new Date();
  const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const fullYear = validDate.getFullYear();
  const yearStr = yearFormat === 'YY' ? String(fullYear).slice(-2) : String(fullYear);
  const seqStr = String(Math.max(1, Math.floor(seq))).padStart(digits, '0');
  return `${prefix}${delimiter}${yearStr}${delimiter}${seqStr}`;
}

/** Format employee ID using tokenized template ({PREFIX}, {YYYY}, {YY}, {MM}, {SEQ}) or deterministic config. */
export function formatTeacherEmployeeId(
  seq: number,
  settings: Partial<TeacherEmployeeIdSettings> = {},
  dateInput?: Date | string,
): string {
  const prefix =
    settings.employeeIdPrefix?.trim() ||
    settings.idPrefix?.trim() ||
    DEFAULT_TEACHERS_SETTINGS.idPrefix;
  let template =
    settings.idTemplate?.trim() ||
    DEFAULT_TEACHERS_SETTINGS.idTemplate ||
    '{PREFIX}-{SEQ}';
  const digits = Math.max(
    1,
    Math.min(8, Number(settings.employeeIdSequenceDigits ?? settings.idDigits) || 4),
  );
  const safeSeq = Math.max(1, Math.floor(seq));

  // If template doesn't contain a sequence placeholder, safely append -{SEQ}
  if (!/\{seq\}/i.test(template)) {
    template = `${template}-{SEQ}`;
  }

  const parsedDate = dateInput
    ? dateInput instanceof Date
      ? dateInput
      : new Date(dateInput)
    : new Date();
  const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const yyyy = String(validDate.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(validDate.getMonth() + 1).padStart(2, '0');
  const seqStr = String(safeSeq).padStart(digits, '0');

  return template
    .replace(/\{prefix\}/gi, prefix)
    .replace(/\{yyyy\}|\{year\}/gi, yyyy)
    .replace(/\{yy\}/gi, yy)
    .replace(/\{mm\}/gi, mm)
    .replace(/\{seq\}/gi, seqStr);
}

/** Next employee id from sequence count + tenant settings (shared FE/BE). */
export function computeNextTeacherEmployeeIdFromCount(
  count: number,
  settings: Partial<TeacherEmployeeIdSettings> = {},
  dateInput?: Date | string,
): string {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const startSeq =
    Number.isFinite(settings.idStartSeq) && Number(settings.idStartSeq) > 1
      ? Math.floor(Number(settings.idStartSeq))
      : 1;
  const nextSeq = Math.max(safeCount + 1, startSeq);
  return formatTeacherEmployeeId(nextSeq, settings, dateInput);
}

export type TeacherDuplicateCheckInput = {
  excludeId?: string;
  contactId?: string | number;
  employeeId?: string;
};

export type TeacherDuplicateReason = 'contact' | 'employeeId';

type TeacherRow = {
  id?: string | number;
  contactId?: string | number;
  employeeId?: string;
  deletedAt?: string;
};

/** Client-side duplicate guard before save (server authoritative on POST). */
export function findTeacherRegistrationConflict(
  teachers: TeacherRow[],
  input: TeacherDuplicateCheckInput,
): TeacherDuplicateReason | null {
  const excludeId = input.excludeId ? String(input.excludeId) : undefined;
  const employeeId = input.employeeId?.trim().toLowerCase();

  for (const row of teachers) {
    if (row.deletedAt) continue;
    if (excludeId && String(row.id) === excludeId) continue;

    if (
      input.contactId != null &&
      row.contactId != null &&
      String(input.contactId) === String(row.contactId)
    ) {
      return 'contact';
    }

    if (
      employeeId &&
      row.employeeId &&
      employeeId === String(row.employeeId).trim().toLowerCase()
    ) {
      return 'employeeId';
    }
  }

  return null;
}

export const formatFacultyEmployeeId = formatTeacherEmployeeId;
export const formatDeterministicFacultyEmployeeId = formatDeterministicEmployeeId;
export const computeNextFacultyEmployeeIdFromCount = computeNextTeacherEmployeeIdFromCount;
export const findFacultyRegistrationConflict = findTeacherRegistrationConflict;
export type FacultyEmployeeIdSettings = TeacherEmployeeIdSettings;
export type FacultyDuplicateCheckInput = TeacherDuplicateCheckInput;
export type FacultyDuplicateReason = TeacherDuplicateReason;
