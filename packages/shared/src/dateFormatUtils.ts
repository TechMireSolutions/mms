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
