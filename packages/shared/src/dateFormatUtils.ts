import type { AppTranslationKey } from './appTranslations.js';
import { getIntlLocaleForLanguage, normalizeAppLanguage } from './languageUtils.js';

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
export function normalizeDateFormat(value: string | undefined, fallback: DateFormatId = 'DD/MM/YYYY'): DateFormatId {
  const trimmed = value?.trim();
  if (trimmed && PRESET_SET.has(trimmed)) return trimmed as DateFormatId;
  return fallback;
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
 * Converts an ISO storage date (`YYYY-MM-DD`) to the active display pattern.
 */
export function formatIsoDateToDisplay(iso: string, formatId: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return iso;
  return formatDateParts(day, month, year, formatId);
}

/**
 * Parses a display-pattern date string into ISO storage form (`YYYY-MM-DD`).
 */
export function parseDisplayDateToIso(display: string, formatId: string): string {
  if (!display.trim()) return '';
  const id = normalizeDateFormat(formatId);
  const cleaned = display.trim().replace(/\//g, '-').replace(/\./g, '-');
  const segments = cleaned.split('-').map((s) => s.trim());
  if (segments.length !== 3) return '';

  let year = 0;
  let month = 0;
  let day = 0;

  if (id === 'MM/DD/YYYY') {
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

  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    return '';
  }

  const normalizedYear = year < 100 ? 2000 + year : year;
  const probe = new Date(normalizedYear, month - 1, day);
  if (probe.getFullYear() !== normalizedYear || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return '';
  }

  return `${String(normalizedYear).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Infers the closest preset for a UI language using `Intl` regional conventions.
 */
export function detectLocaleDateFormat(language: string): DateFormatId {
  const locale = getIntlLocaleForLanguage(language);
  const parts = new Intl.DateTimeFormat(locale, {
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
  const intlParts = new Intl.DateTimeFormat(locale, {
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
 * Parses a `YYYY-MM-DD` storage string into a local Date at midnight.
 * Returns `undefined` when the string is missing or not a valid calendar day.
 */
export function parseIsoDate(isoStr?: string): Date | undefined {
  if (!isoStr) return undefined;
  const [year, month, day] = isoStr.split('-').map(Number);
  if (year == null || month == null || day == null || isNaN(year) || isNaN(month) || isNaN(day)) {
    return undefined;
  }
  return new Date(year, month - 1, day);
}

/** Returns the year portion of a `YYYY-MM-DD` string, or `undefined` if invalid. */
export function parseIsoYear(isoStr?: string): number | undefined {
  if (!isoStr) return undefined;
  const [year] = isoStr.split('-').map(Number);
  return year == null || isNaN(year) ? undefined : year;
}

/** Default DayPicker caption year window when `min` / `max` are unset. */
export const DATE_PICKER_YEAR_PAST = 100;
export const DATE_PICKER_YEAR_FUTURE = 10;

/**
 * True when `date` is on/after optional ISO `min` and on/before optional ISO `max`
 * (local-calendar midnight comparisons via {@link parseIsoDate}).
 */
export function isDateWithinIsoBounds(date: Date, minIso?: string, maxIso?: string): boolean {
  const minDate = parseIsoDate(minIso);
  if (minDate && date < minDate) return false;
  const maxDate = parseIsoDate(maxIso);
  if (maxDate && date > maxDate) return false;
  return true;
}

/**
 * Start/end months for DayPicker `captionLayout="dropdown"` from optional ISO bounds.
 */
export function resolveDatePickerMonthBounds(
  minIso?: string,
  maxIso?: string,
): { startMonth: Date; endMonth: Date } {
  const nowYear = new Date().getFullYear();
  const minYear = parseIsoYear(minIso);
  const maxYear = parseIsoYear(maxIso);
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
 * Parses `HH:mm` or `HH:mm:ss` into hours/minutes.
 * Returns `null` when the string is missing or not a valid clock time.
 */
export function parseTimeHHmm(value: string): TimeHHmmParts | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
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
 * Accepts `HH:mm` and `HH:mm:ss`.
 */
export function normalizeTimeHHmm(value: string): string {
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
export function splitIsoDateTime(iso: string): IsoDateTimeParts | null {
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
export function combineIsoDateAndTime(date: string, time: string): string | null {
  const datePart = date.trim();
  if (!datePart) return null;
  const localDate = parseIsoDate(datePart);
  if (!localDate) return null;
  const timeParts = parseTimeHHmm(time.trim() || '00:00') ?? { hours: 0, minutes: 0 };
  localDate.setHours(timeParts.hours, timeParts.minutes, 0, 0);
  return localDate.toISOString();
}
