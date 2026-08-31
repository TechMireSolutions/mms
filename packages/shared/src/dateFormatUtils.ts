import type { AppTranslationKey } from './appTranslations.js';
import { getIntlLocaleForLanguage } from './languageUtils.js';

/** Supported global date display format identifiers. */
export const DATE_FORMAT_PRESET_IDS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'DD.MM.YYYY',
  'YYYY/MM/DD',
] as const;

export type DateFormatId = (typeof DATE_FORMAT_PRESET_IDS)[number];

export interface DateFormatPreset {
  id: DateFormatId;
  hintKey: AppTranslationKey;
}

export interface DateFormatOption {
  value: DateFormatId;
  pattern: DateFormatId;
  sample: string;
  hintKey: AppTranslationKey;
}

const PRESETS: readonly DateFormatPreset[] = [
  { id: 'DD/MM/YYYY', hintKey: 'global.dateFormatDayFirst' },
  { id: 'MM/DD/YYYY', hintKey: 'global.dateFormatMonthFirst' },
  { id: 'YYYY-MM-DD', hintKey: 'global.dateFormatIso' },
  { id: 'DD-MM-YYYY', hintKey: 'global.dateFormatDayFirst' },
  { id: 'DD.MM.YYYY', hintKey: 'global.dateFormatDayFirst' },
  { id: 'YYYY/MM/DD', hintKey: 'global.dateFormatYearFirst' },
] as const;

const PRESET_SET = new Set<string>(DATE_FORMAT_PRESET_IDS);

/** Reference date for locale detection: 2 Jan 2000 (unambiguous ordering). */
const LOCALE_PROBE_DATE = new Date(Date.UTC(2000, 0, 2));

/**
 * Coerces a stored value to a supported date format id.
 */
export function normalizeDateFormat(value: string | null | undefined, fallback: DateFormatId = 'DD/MM/YYYY'): DateFormatId {
  const trimmed = value?.trim();
  if (trimmed && PRESET_SET.has(trimmed)) return trimmed as DateFormatId;
  return fallback;
}

/**
 * Normalizes 2-digit years using a sliding pivot:
 * > 50 -> 1900s, <= 50 -> 2000s.
 */
function normalizeTwoDigitYear(year: number): number {
  if (year >= 100) return year;
  return year > 50 ? 1900 + year : 2000 + year;
}

/**
 * Formats numeric day/month/year parts using a preset pattern.
 */
export function formatDateParts(
  day: number,
  month: number,
  year: number,
  formatId: string,
): string {
  const id = normalizeDateFormat(formatId);
  const paddedDay = String(day).padStart(2, '0');
  const paddedMonth = String(month).padStart(2, '0');
  const fullYear = String(year);

  switch (id) {
    case 'MM/DD/YYYY':
      return `${paddedMonth}/${paddedDay}/${fullYear}`;
    case 'YYYY-MM-DD':
      return `${fullYear}-${paddedMonth}-${paddedDay}`;
    case 'DD-MM-YYYY':
      return `${paddedDay}-${paddedMonth}-${fullYear}`;
    case 'DD.MM.YYYY':
      return `${paddedDay}.${paddedMonth}.${fullYear}`;
    case 'YYYY/MM/DD':
      return `${fullYear}/${paddedMonth}/${paddedDay}`;
    case 'DD/MM/YYYY':
    default:
      return `${paddedDay}/${paddedMonth}/${fullYear}`;
  }
}

/**
 * Formats with a short month name according to preset ordering.
 */
export function formatDatePartsWithMonthName(
  day: number,
  monthLabel: string,
  monthNum: number,
  year: number,
  formatId: string,
): string {
  const id = normalizeDateFormat(formatId);
  const paddedMonth = String(monthNum).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');

  if (id === 'MM/DD/YYYY') {
    return `${monthLabel} ${day}, ${year}`;
  }
  if (id === 'YYYY-MM-DD' || id === 'YYYY/MM/DD') {
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  return `${day} ${monthLabel} ${year}`;
}

/**
 * Formats numeric month/year parts using a preset pattern.
 */
export function formatMonthYearParts(
  month: number,
  year: number,
  formatId: string,
): string {
  const id = normalizeDateFormat(formatId);
  const paddedMonth = String(month).padStart(2, '0');
  const fullYear = String(year);

  switch (id) {
    case 'YYYY-MM-DD':
      return `${fullYear}-${paddedMonth}`;
    case 'YYYY/MM/DD':
      return `${fullYear}/${paddedMonth}`;
    case 'DD.MM.YYYY':
      return `${paddedMonth}.${fullYear}`;
    case 'DD-MM-YYYY':
      return `${paddedMonth}-${fullYear}`;
    case 'MM/DD/YYYY':
    case 'DD/MM/YYYY':
    default:
      return `${paddedMonth}/${fullYear}`;
  }
}

/**
 * Converts an ISO storage date (`YYYY`, `YYYY-MM`, or `YYYY-MM-DD`) to the active display pattern.
 */
export function formatIsoDateToDisplay(iso: string | null | undefined, formatId: string): string {
  if (!iso) return '';
  const dateOnly = iso.trim().split(/[T\s]/)[0];
  if (!dateOnly) return '';
  const parts = dateOnly.split('-');

  // Year only: "2024"
  if (parts.length === 1 && /^\d{4}$/.test(parts[0]!)) {
    return parts[0]!;
  }

  // Month and Year: "2024-05"
  if (parts.length === 2 && /^\d{4}$/.test(parts[0]!) && /^\d{1,2}$/.test(parts[1]!)) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (year >= 1000 && year <= 9999 && month >= 1 && month <= 12) {
      return formatMonthYearParts(month, year, formatId);
    }
  }

  // Complete Date: "2024-05-21"
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (year && month && day) {
      return formatDateParts(day, month, year, formatId);
    }
  }

  return iso;
}

/**
 * Converts an ISO storage date (`YYYY`, `YYYY-MM`, or `YYYY-MM-DD`) to a human-readable display string
 * using the provided month label.
 */
export function formatIsoDateToDisplayWithMonthName(
  iso: string | null | undefined,
  formatId: string,
  monthLabel: string,
): string {
  if (!iso) return '';
  const dateOnly = iso.trim().split(/[T\s]/)[0];
  if (!dateOnly) return '';
  const parts = dateOnly.split('-');

  if (parts.length === 1 && /^\d{4}$/.test(parts[0]!)) {
    return parts[0]!;
  }

  if (parts.length === 2 && /^\d{4}$/.test(parts[0]!) && /^\d{1,2}$/.test(parts[1]!)) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (year >= 1000 && year <= 9999 && month >= 1 && month <= 12) {
      const id = normalizeDateFormat(formatId);
      if (id.startsWith('YYYY')) {
        return `${year} ${monthLabel}`;
      }
      return `${monthLabel} ${year}`;
    }
  }

  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (year && month && day) {
      return formatDatePartsWithMonthName(day, monthLabel, month, year, formatId);
    }
  }

  return iso;
}

/**
 * Parses a display-pattern date string into ISO storage form (`YYYY`, `YYYY-MM`, or `YYYY-MM-DD`).
 * Supports:
 * - Year only: "2024" -> "2024"
 * - Month and Year: "05/2024", "05-2024", "2024-05" -> "2024-05"
 * - Complete Date: "21/05/2024", "2024-05-21" -> "2024-05-21"
 * Also supports compact strings without separators (e.g. `2024`, `052024`, `202405`, `21072026`).
 */
export function parseDisplayDateToIso(display: string | null | undefined, formatId: string): string {
  if (!display || typeof display !== 'string' || !display.trim()) return '';
  const id = normalizeDateFormat(formatId);
  const trimmed = display.trim();

  // 1. Year only: 4 digits (e.g. "2024")
  if (/^\d{4}$/.test(trimmed)) {
    const y = Number(trimmed);
    if (y >= 1000 && y <= 9999) {
      return String(y);
    }
    return '';
  }

  // 2. Handle compact 6- or 8-digit strings without separators
  if (/^\d{6}$|^\d{8}$/.test(trimmed)) {
    if (trimmed.length === 6) {
      // Check for YYYYMM (e.g. "202405")
      if (id.startsWith('YYYY') && Number(trimmed.slice(0, 4)) >= 1000) {
        const year = Number(trimmed.slice(0, 4));
        const month = Number(trimmed.slice(4, 6));
        if (month >= 1 && month <= 12) {
          return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
        }
      }
      // Check for MMYYYY (e.g. "052024")
      const monthCandidate = Number(trimmed.slice(0, 2));
      const yearCandidate = Number(trimmed.slice(2, 6));
      if (yearCandidate >= 1000 && yearCandidate <= 9999 && monthCandidate >= 1 && monthCandidate <= 12) {
        return `${String(yearCandidate).padStart(4, '0')}-${String(monthCandidate).padStart(2, '0')}`;
      }

      // Compact 6-digit with 2-digit year (e.g. "210795")
      let year: number;
      let month: number;
      let day: number;
      if (id.startsWith('YYYY')) {
        year = Number(trimmed.slice(0, 2));
        month = Number(trimmed.slice(2, 4));
        day = Number(trimmed.slice(4, 6));
      } else if (id === 'MM/DD/YYYY') {
        month = Number(trimmed.slice(0, 2));
        day = Number(trimmed.slice(2, 4));
        year = Number(trimmed.slice(4, 6));
      } else {
        day = Number(trimmed.slice(0, 2));
        month = Number(trimmed.slice(2, 4));
        year = Number(trimmed.slice(4, 6));
      }
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const normalizedYear = normalizeTwoDigitYear(year);
        const probe = new Date(normalizedYear, month - 1, day);
        if (probe.getFullYear() === normalizedYear && probe.getMonth() === month - 1 && probe.getDate() === day) {
          return `${String(normalizedYear).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    } else if (trimmed.length === 8) {
      let year: number;
      let month: number;
      let day: number;
      if (id.startsWith('YYYY')) {
        year = Number(trimmed.slice(0, 4));
        month = Number(trimmed.slice(4, 6));
        day = Number(trimmed.slice(6, 8));
      } else if (id === 'MM/DD/YYYY') {
        month = Number(trimmed.slice(0, 2));
        day = Number(trimmed.slice(2, 4));
        year = Number(trimmed.slice(4, 8));
      } else {
        day = Number(trimmed.slice(0, 2));
        month = Number(trimmed.slice(2, 4));
        year = Number(trimmed.slice(4, 8));
      }
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const normalizedYear = normalizeTwoDigitYear(year);
        const probe = new Date(normalizedYear, month - 1, day);
        if (probe.getFullYear() === normalizedYear && probe.getMonth() === month - 1 && probe.getDate() === day) {
          return `${String(normalizedYear).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }
  }

  // 3. Separated strings
  const cleaned = trimmed.replace(/\//g, '-').replace(/\./g, '-');
  const segments = cleaned.split('-').map((s) => s.trim()).filter(Boolean);

  if (segments.length === 1) {
    if (/^\d{4}$/.test(segments[0]!)) {
      const y = Number(segments[0]);
      if (y >= 1000 && y <= 9999) return String(y);
    }
    return '';
  }

  // 2 segments: Month and Year (e.g. "05/2024", "2024-05")
  if (segments.length === 2) {
    let year: number;
    let month: number;

    if (segments[0]!.length === 4) {
      year = Number(segments[0]);
      month = Number(segments[1]);
    } else if (segments[1]!.length === 4) {
      month = Number(segments[0]);
      year = Number(segments[1]);
    } else if (id.startsWith('YYYY')) {
      year = normalizeTwoDigitYear(Number(segments[0]));
      month = Number(segments[1]);
    } else {
      month = Number(segments[0]);
      year = normalizeTwoDigitYear(Number(segments[1]));
    }

    if (Number.isFinite(year) && Number.isFinite(month) && year >= 1000 && year <= 9999 && month >= 1 && month <= 12) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    }
    return '';
  }

  // 3 segments: Complete Date (Day, Month, Year)
  if (segments.length === 3) {
    let year: number;
    let month: number;
    let day: number;

    if (segments[0]!.length === 4) {
      year = Number(segments[0]);
      month = Number(segments[1]);
      day = Number(segments[2]);
    } else if (id === 'MM/DD/YYYY') {
      month = Number(segments[0]);
      day = Number(segments[1]);
      year = Number(segments[2]);
    } else if (id === 'YYYY-MM-DD' || id === 'YYYY/MM/DD') {
      year = Number(segments[0]);
      month = Number(segments[1]);
      day = Number(segments[2]);
    } else {
      day = Number(segments[0]);
      month = Number(segments[1]);
      year = Number(segments[2]);
    }

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      return '';
    }

    const normalizedYear = normalizeTwoDigitYear(year);
    const probe = new Date(normalizedYear, month - 1, day);
    if (probe.getFullYear() !== normalizedYear || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
      return '';
    }

    return `${String(normalizedYear).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return '';
}

/**
 * Auto-formats a date input string as the user types, automatically inserting
 * separators ('/' or preset separator) between numbers.
 *
 * @param input - The raw text from the input field
 * @param formatId - The target DateFormatId (e.g. 'DD/MM/YYYY', 'YYYY-MM-DD', etc.)
 * @param previousValue - The previous input string (used to detect backspacing)
 */
export function formatDateInputAsYouType(
  input: string | null | undefined,
  formatId: string,
  previousValue = '',
): string {
  if (!input || !input.trim()) return '';

  const id = normalizeDateFormat(formatId);
  const sep = id.includes('/') ? '/' : id.includes('.') ? '.' : '-';
  const isYearFirst = id.startsWith('YYYY');
  const maxLens = isYearFirst ? [4, 2, 2] : [2, 2, 4];
  const maxDigits = maxLens[0] + maxLens[1] + maxLens[2];

  const isDeleting = previousValue.length > input.length;

  // Normalize all separators to the target preset separator
  const normalized = input.replace(/[/\-.]/g, sep);

  // If user is deleting and the deleted character was a trailing separator,
  // do not re-add the separator.
  if (isDeleting && previousValue.endsWith(sep) && normalized === previousValue.slice(0, -1)) {
    return normalized;
  }

  // If the input already contains separators
  if (normalized.includes(sep)) {
    const rawSegments = normalized.split(sep);
    const cleanedSegments: string[] = [];

    const effectiveMaxLens = rawSegments.length === 2 && !isYearFirst ? [2, 4] : maxLens;

    for (let i = 0; i < Math.min(rawSegments.length, 3); i++) {
      const maxLen = effectiveMaxLens[i]!;
      const digits = (rawSegments[i] || '').replace(/\D/g, '').slice(0, maxLen);
      cleanedSegments.push(digits);
    }

    if (cleanedSegments.length === 1) {
      const seg0 = cleanedSegments[0]!;
      if (!isDeleting && seg0.length === maxLens[0]) {
        return `${seg0}${sep}`;
      }
      return seg0;
    }

    if (cleanedSegments.length === 2) {
      const [seg0, seg1] = cleanedSegments as [string, string];
      if (!isDeleting && seg1.length === maxLens[1]) {
        return `${seg0}${sep}${seg1}${sep}`;
      }
      if (normalized.endsWith(sep) && !seg1) {
        return `${seg0}${sep}`;
      }
      return `${seg0}${sep}${seg1}`;
    }

    if (cleanedSegments.length >= 3) {
      const [seg0, seg1, seg2] = cleanedSegments as [string, string, string];
      if (normalized.endsWith(sep) && !seg2) {
        return `${seg0}${sep}${seg1}${sep}`;
      }
      return `${seg0}${sep}${seg1}${sep}${seg2}`;
    }
  }

  // Input does NOT contain separators: format purely by digits
  const digits = input.replace(/\D/g, '').slice(0, maxDigits);
  if (!digits) return '';

  if (isYearFirst) {
    if (digits.length < 4) {
      return digits;
    }
    if (digits.length === 4) {
      return isDeleting ? digits : `${digits}${sep}`;
    }
    if (digits.length < 6) {
      return `${digits.slice(0, 4)}${sep}${digits.slice(4)}`;
    }
    if (digits.length === 6) {
      return isDeleting
        ? `${digits.slice(0, 4)}${sep}${digits.slice(4)}`
        : `${digits.slice(0, 4)}${sep}${digits.slice(4)}${sep}`;
    }
    return `${digits.slice(0, 4)}${sep}${digits.slice(4, 6)}${sep}${digits.slice(6, 8)}`;
  }

  if (digits.length < 2) {
    return digits;
  }
  if (digits.length === 2) {
    return isDeleting ? digits : `${digits}${sep}`;
  }
  if (digits.length < 4) {
    return `${digits.slice(0, 2)}${sep}${digits.slice(2)}`;
  }
  if (digits.length === 4) {
    // If the 4 digits form a 4-digit year (1900-2099), keep as 4 digits
    const num = Number(digits);
    if (num >= 1900 && num <= 2099) {
      return digits;
    }
    return isDeleting
      ? `${digits.slice(0, 2)}${sep}${digits.slice(2)}`
      : `${digits.slice(0, 2)}${sep}${digits.slice(2)}${sep}`;
  }
  return `${digits.slice(0, 2)}${sep}${digits.slice(2, 4)}${sep}${digits.slice(4, 8)}`;
}

const INTL_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getCachedIntlFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = INTL_FORMATTER_CACHE.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    INTL_FORMATTER_CACHE.set(key, formatter);
  }
  return formatter;
}

/**
 * Infers the closest preset for a UI language using `Intl` regional conventions.
 */
export function detectLocaleDateFormat(language: string): DateFormatId {
  const locale = getIntlLocaleForLanguage(language);
  const parts = getCachedIntlFormatter(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(LOCALE_PROBE_DATE);

  const order = parts
    .filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year')
    .map((p) => p.type);
  const separator =
    parts.find((p) => p.type === 'literal' && /[/\-.]/.test(p.value))?.value ?? '/';

  if (order[0] === 'year') {
    return separator === '-' ? 'YYYY-MM-DD' : 'YYYY/MM/DD';
  }
  if (order[0] === 'month') {
    return 'MM/DD/YYYY';
  }
  if (separator === '.') return 'DD.MM.YYYY';
  if (separator === '-') return 'DD-MM-YYYY';
  return 'DD/MM/YYYY';
}

/**
 * Builds select options with a live sample for each preset.
 */
export function getDateFormatOptions(
  language: string,
  sample: Date = new Date(),
): readonly DateFormatOption[] {
  const locale = getIntlLocaleForLanguage(language);
  const intlParts = getCachedIntlFormatter(locale, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(sample);
  const day = Number(intlParts.find((p) => p.type === 'day')?.value ?? sample.getUTCDate());
  const month = Number(intlParts.find((p) => p.type === 'month')?.value ?? sample.getUTCMonth() + 1);
  const year = Number(intlParts.find((p) => p.type === 'year')?.value ?? sample.getUTCFullYear());

  return PRESETS.map((preset) => ({
    value: preset.id,
    pattern: preset.id,
    sample: formatDateParts(day, month, year, preset.id),
    hintKey: preset.hintKey,
  }));
}

/** All preset definitions (for documentation / settings registries). */
export function getDateFormatPresets(): readonly DateFormatPreset[] {
  return PRESETS;
}

/** Formats a local Date object as a `YYYY-MM-DD` storage string. */
export function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns today's date as a local-calendar `YYYY-MM-DD` storage string. */
export function todayISO(): string {
  return formatDateToIso(new Date());
}

/**
 * Parses a `YYYY-MM-DD` (or ISO datetime) storage string into a local Date at midnight.
 * Returns `undefined` when the string is missing or not a valid calendar day.
 */
export function parseIsoDate(isoStr?: string | null): Date | undefined {
  if (!isoStr || typeof isoStr !== 'string') return undefined;
  const dateOnly = isoStr.trim().split(/[T\s]/)[0];
  if (!dateOnly) return undefined;
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (year == null || month == null || day == null || isNaN(year) || isNaN(month) || isNaN(day)) {
    return undefined;
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date;
}

/**
 * Parses a flexible ISO string (`YYYY`, `YYYY-MM`, or `YYYY-MM-DD`) into a local Date object.
 * Returns `undefined` when missing or not a valid date/month/year.
 */
export function parseFlexibleIsoDate(isoStr?: string | null): Date | undefined {
  if (!isoStr || typeof isoStr !== 'string') return undefined;
  const dateOnly = isoStr.trim().split(/[T\s]/)[0];
  if (!dateOnly) return undefined;
  const parts = dateOnly.split('-').map(Number);
  if (parts.length === 1) {
    const year = parts[0];
    if (year != null && !isNaN(year) && year >= 1000 && year <= 9999) {
      return new Date(year, 0, 1);
    }
  } else if (parts.length === 2) {
    const [year, month] = parts;
    if (year != null && month != null && !isNaN(year) && !isNaN(month) && year >= 1000 && year <= 9999 && month >= 1 && month <= 12) {
      return new Date(year, month - 1, 1);
    }
  } else if (parts.length === 3) {
    return parseIsoDate(isoStr);
  }
  return undefined;
}

/** Returns the year portion of a `YYYY-MM-DD` (or ISO datetime) string, or `undefined` if invalid. */
export function parseIsoYear(isoStr?: string | null): number | undefined {
  if (!isoStr || typeof isoStr !== 'string') return undefined;
  const dateOnly = isoStr.trim().split(/[T\s]/)[0];
  if (!dateOnly) return undefined;
  const [year] = dateOnly.split('-').map(Number);
  return year == null || isNaN(year) ? undefined : year;
}

/**
 * Parses a year representation (string "2026", "2026-07-21", number 2026, or Date)
 * into a 4-digit number. Returns `undefined` when missing or invalid.
 */
export function parseYearValue(value?: string | number | Date | null): number | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1000 && value <= 9999 ? value : undefined;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    const y = value.getFullYear();
    return Number.isInteger(y) && y >= 1000 && y <= 9999 ? y : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}$/.test(trimmed)) {
      const parsed = Number(trimmed);
      return parsed >= 1000 && parsed <= 9999 ? parsed : undefined;
    }
    const isoYear = parseIsoYear(trimmed);
    if (isoYear != null && isoYear >= 1000 && isoYear <= 9999) {
      return isoYear;
    }
  }
  return undefined;
}

/**
 * True when `year` is within optional `minYear` and `maxYear` bounds.
 */
export function isYearWithinBounds(
  year: number,
  minYear?: number | null,
  maxYear?: number | null,
): boolean {
  if (!Number.isFinite(year)) return false;
  if (minYear != null && Number.isFinite(minYear) && year < minYear) return false;
  if (maxYear != null && Number.isFinite(maxYear) && year > maxYear) return false;
  return true;
}

/** Default DayPicker caption year window when `min` / `max` are unset. */
export const DATE_PICKER_YEAR_PAST = 100;
export const DATE_PICKER_YEAR_FUTURE = 10;

/**
 * Resolves normalized minYear and maxYear bounds from mixed inputs (numbers, ISO strings, or explicit year bounds).
 */
export function resolveYearPickerBounds(
  min?: string | number | null,
  max?: string | number | null,
  minYear?: number | null,
  maxYear?: number | null,
): { minYear: number; maxYear: number } {
  const currentYear = new Date().getFullYear();
  const parsedMin = minYear ?? (min != null ? parseYearValue(min) : undefined);
  const parsedMax = maxYear ?? (max != null ? parseYearValue(max) : undefined);

  const resolvedMin = parsedMin ?? currentYear - DATE_PICKER_YEAR_PAST;
  const resolvedMax = parsedMax ?? currentYear + DATE_PICKER_YEAR_FUTURE;

  return {
    minYear: resolvedMin,
    maxYear: resolvedMax,
  };
}

/**
 * True when `date` is on/after optional ISO `min` and on/before optional ISO `max`
 * (normalized local-calendar day comparisons via {@link parseFlexibleIsoDate}).
 */
export function isDateWithinIsoBounds(date: Date, minIso?: string | null, maxIso?: string | null): boolean {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const minDate = parseFlexibleIsoDate(minIso);
  if (minDate && target < minDate) return false;
  const maxDate = parseFlexibleIsoDate(maxIso);
  if (maxDate && target > maxDate) return false;
  return true;
}

/**
 * Start/end months for DayPicker `captionLayout="dropdown"` from optional ISO bounds.
 */
export function resolveDatePickerMonthBounds(
  minIso?: string | null,
  maxIso?: string | null,
): { startMonth: Date; endMonth: Date } {
  const nowYear = new Date().getFullYear();
  const minYear = parseYearValue(minIso);
  const maxYear = parseYearValue(maxIso);
  return {
    startMonth: new Date(minYear ?? nowYear - DATE_PICKER_YEAR_PAST, 0),
    endMonth: new Date(maxYear ?? nowYear + DATE_PICKER_YEAR_FUTURE, 11),
  };
}

export interface TimeHHmmParts {
  hours: number;
  minutes: number;
}

/**
 * Parses `HH:mm` or `HH:mm:ss` (including single-digit minutes) into hours/minutes.
 * Returns `null` when the string is missing or not a valid clock time.
 */
export function parseTimeHHmm(value?: string | null): TimeHHmmParts | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return { hours, minutes };
}

/** Formats hours/minutes as a zero-padded `HH:mm` storage string. */
export function formatTimeHHmm(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Normalizes a browser time value to `HH:mm`, or `""` when empty/invalid.
 * Accepts `HH:mm`, `H:m`, and `HH:mm:ss`.
 */
export function normalizeTimeHHmm(value?: string | null): string {
  const parsed = parseTimeHHmm(value);
  if (!parsed) return '';
  return formatTimeHHmm(parsed.hours, parsed.minutes);
}

export interface IsoDateTimeParts {
  date: string;
  time: string;
}

/**
 * Splits an ISO datetime into local-calendar `YYYY-MM-DD` + `HH:mm` for picker UI.
 * Returns `null` when the value cannot be parsed as a valid Date.
 */
export function splitIsoDateTime(iso?: string | null): IsoDateTimeParts | null {
  if (!iso || typeof iso !== 'string') return null;
  const trimmed = iso.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    date: formatDateToIso(parsed),
    time: formatTimeHHmm(parsed.getHours(), parsed.getMinutes()),
  };
}

/**
 * Combines local-calendar `YYYY-MM-DD` + `HH:mm` into an ISO-8601 string.
 * Empty date returns `null`. Missing/invalid time defaults to `00:00`.
 */
export function combineIsoDateAndTime(date?: string | null, time?: string | null): string | null {
  if (!date || typeof date !== 'string') return null;
  const datePart = date.trim();
  if (!datePart) return null;
  const localDate = parseIsoDate(datePart);
  if (!localDate) return null;
  const timeStr = typeof time === 'string' && time.trim() ? time.trim() : '00:00';
  const timeParts = parseTimeHHmm(timeStr) ?? { hours: 0, minutes: 0 };
  localDate.setHours(timeParts.hours, timeParts.minutes, 0, 0);
  return localDate.toISOString();
}
