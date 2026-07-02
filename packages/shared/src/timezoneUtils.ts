/** Select option for IANA timezone pickers. */
export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
  offsetMinutes: number;
  /** Lowercase search tokens (id, city, region). */
  keywords: string;
}

const REGION_ORDER = [
  'UTC',
  'Africa',
  'America',
  'Antarctica',
  'Arctic',
  'Asia',
  'Atlantic',
  'Australia',
  'Europe',
  'Indian',
  'Pacific',
] as const;

/** Curated fallback when `Intl.supportedValuesOf` is unavailable. */
const IANA_TIMEZONE_FALLBACK: readonly string[] = [
  'UTC',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'America/Toronto',
  'Asia/Baghdad',
  'Asia/Dubai',
  'Asia/Dhaka',
  'Asia/Jakarta',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Kuala_Lumpur',
  'Asia/Riyadh',
  'Asia/Singapore',
  'Asia/Tehran',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Paris',
  'Pacific/Auckland',
];

const optionCache = new Map<string, readonly TimezoneOption[]>();

/**
 * Returns all IANA timezone identifiers from the runtime (ICU), with a curated fallback.
 */
export function getIanaTimeZoneIds(): readonly string[] {
  if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
    try {
      const zones = Intl.supportedValuesOf('timeZone');
      if (zones.length > 0) return zones;
    } catch {
      /* use fallback */
    }
  }
  return IANA_TIMEZONE_FALLBACK;
}

/**
 * Detects the device/browser IANA timezone.
 */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function getTimezoneRegion(id: string): string {
  if (id === 'UTC') return 'UTC';
  const slash = id.indexOf('/');
  return slash === -1 ? 'Other' : id.slice(0, slash);
}

function formatCityName(id: string): string {
  if (id === 'UTC') return 'UTC';
  const segment = id.includes('/') ? id.slice(id.lastIndexOf('/') + 1) : id;
  return segment.replace(/_/g, ' ');
}

/**
 * UTC offset in minutes for sorting (e.g. Asia/Karachi → 300).
 */
export function getTimezoneOffsetMinutes(id: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: id,
      timeZoneName: 'shortOffset',
    });
    const token = formatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? '';
    const match = token.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/i);
    if (!match) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    const hours = Number.parseInt(match[2], 10);
    const minutes = Number.parseInt(match[3] ?? '0', 10);
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}

function formatOffsetLabel(id: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: id,
      timeZoneName: 'shortOffset',
    });
    return formatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  } catch {
    return 'GMT';
  }
}

/**
 * Human-readable label: `GMT+5 · Karachi`.
 */
export function formatTimezoneLabel(id: string, _locale = 'en', date: Date = new Date()): string {
  const offset = formatOffsetLabel(id, date);
  const city = formatCityName(id);
  return id === 'UTC' ? 'UTC' : `${offset} · ${city}`;
}

function buildSearchKeywords(id: string, region: string): string {
  return [id, region, formatCityName(id)].join(' ').toLowerCase();
}

/**
 * Builds sorted timezone options grouped by region (cached per locale).
 */
export function getTimezoneOptions(locale = 'en'): readonly TimezoneOption[] {
  const cached = optionCache.get(locale);
  if (cached) return cached;

  const now = new Date();
  const timezoneIds = getIanaTimeZoneIds();
  const options: TimezoneOption[] = timezoneIds.map((timezoneId) => {
    const region = getTimezoneRegion(timezoneId);
    return {
      value: timezoneId,
      label: formatTimezoneLabel(timezoneId, locale, now),
      region,
      offsetMinutes: getTimezoneOffsetMinutes(timezoneId, now),
      keywords: buildSearchKeywords(timezoneId, region),
    };
  });

  const regionRank = (region: string): number => {
    const regionIndex = REGION_ORDER.indexOf(region as (typeof REGION_ORDER)[number]);
    return regionIndex === -1 ? REGION_ORDER.length : regionIndex;
  };

  options.sort((leftOption, rightOption) => {
    const regionDelta = regionRank(leftOption.region) - regionRank(rightOption.region);
    if (regionDelta !== 0) return regionDelta;
    if (leftOption.offsetMinutes !== rightOption.offsetMinutes) return leftOption.offsetMinutes - rightOption.offsetMinutes;
    return leftOption.label.localeCompare(rightOption.label, locale);
  });

  optionCache.set(locale, options);
  return options;
}

/**
 * Returns true when `id` is a known IANA timezone in this runtime.
 */
export function isValidIanaTimezone(id: string): boolean {
  if (!id.trim()) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: id });
    return true;
  } catch {
    return false;
  }
}

/**
 * Coerces an arbitrary stored value to a valid IANA id (falls back to default).
 */
export function normalizeTimezone(value: string | undefined, fallback = 'UTC'): string {
  const trimmed = value?.trim();
  if (trimmed && isValidIanaTimezone(trimmed)) return trimmed;
  if (isValidIanaTimezone(fallback)) return fallback;
  return 'UTC';
}

/**
 * Groups options by region for optgroup / command list rendering.
 */
export function groupTimezoneOptions(
  options: readonly TimezoneOption[],
): { region: string; options: TimezoneOption[] }[] {
  const optionsByRegion = new Map<string, TimezoneOption[]>();
  for (const option of options) {
    const regionOptions = optionsByRegion.get(option.region) ?? [];
    regionOptions.push(option);
    optionsByRegion.set(option.region, regionOptions);
  }

  const regions = [...optionsByRegion.keys()].sort((leftRegion, rightRegion) => {
    const rank = (region: string) => {
      const regionIndex = REGION_ORDER.indexOf(region as (typeof REGION_ORDER)[number]);
      return regionIndex === -1 ? REGION_ORDER.length : regionIndex;
    };
    return rank(leftRegion) - rank(rightRegion);
  });

  return regions.map((region) => ({ region, options: optionsByRegion.get(region)! }));
}
