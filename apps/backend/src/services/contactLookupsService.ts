import {
  CONTACT_LOOKUP_KINDS,
  COUNTRY_CODES,
  DEFAULT_ADDRESS_LABELS,
  DEFAULT_EMAIL_LABELS,
  DEFAULT_PHONE_LABELS,
  GENDERS,
  SOCIAL_PLATFORMS,
  curatedContactCountryCodes,
  isContactLookupCountryKind,
  needsContactCountryCodesCurate,
  type ContactLookupCountryCode,
  type ContactLookupKind,
  type ContactLookupsMap,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listContactLookupsByKind,
  listContactLookupsByWorkspace,
  replaceContactLookupsForKind,
} from '../db/repositories/contactLookupsRepository.js';

function slugifyLabel(label: string, index: number): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'item'}-${index}`;
}

function defaultStringItems(kind: Exclude<ContactLookupKind, 'countryCodes'>): string[] {
  switch (kind) {
    case 'genders':
      return [...GENDERS];
    case 'socialPlatforms':
      return [...SOCIAL_PLATFORMS];
    case 'relationships':
      return [];
    case 'phoneLabels':
      return [...DEFAULT_PHONE_LABELS];
    case 'emailLabels':
      return [...DEFAULT_EMAIL_LABELS];
    case 'addressLabels':
      return [...DEFAULT_ADDRESS_LABELS];
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function defaultCountryItems(): ContactLookupCountryCode[] {
  return COUNTRY_CODES.map((entry) => ({ ...entry }));
}

function rowsToStringItems(
  rows: Array<{ label: string }>,
): string[] {
  return rows.map((row) => row.label).filter(Boolean);
}

function rowsToCountryItems(
  rows: Array<{ label: string; meta: Record<string, unknown> | null }>,
): ContactLookupCountryCode[] {
  const items: ContactLookupCountryCode[] = [];
  for (const row of rows) {
    const code =
      row.meta && typeof row.meta.code === 'string' ? row.meta.code.trim() : '';
    if (row.label && code) items.push({ country: row.label, code });
  }
  return items;
}

export async function loadContactLookupsMap(
  tenant = getRequestTenant(),
): Promise<ContactLookupsMap> {
  const empty: ContactLookupsMap = {
    genders: defaultStringItems('genders'),
    socialPlatforms: defaultStringItems('socialPlatforms'),
    relationships: defaultStringItems('relationships'),
    phoneLabels: defaultStringItems('phoneLabels'),
    emailLabels: defaultStringItems('emailLabels'),
    addressLabels: defaultStringItems('addressLabels'),
    countryCodes: defaultCountryItems(),
  };
  if (!tenant) return empty;

  const rows = await listContactLookupsByWorkspace(tenant);
  const byKind = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byKind.get(row.kind) ?? [];
    list.push(row);
    byKind.set(row.kind, list);
  }

  const result = { ...empty };
  for (const kind of CONTACT_LOOKUP_KINDS) {
    const kindRows = byKind.get(kind) ?? [];
    if (kindRows.length === 0) continue;
    if (kind === 'countryCodes') {
      const countries = rowsToCountryItems(kindRows);
      result.countryCodes = needsContactCountryCodesCurate(countries)
        ? curatedContactCountryCodes()
        : countries;
    } else {
      result[kind] = rowsToStringItems(kindRows);
    }
  }
  return result;
}

export async function loadContactLookupKind(
  kind: ContactLookupKind,
  tenant = getRequestTenant(),
): Promise<string[] | ContactLookupCountryCode[]> {
  if (!tenant) {
    return kind === 'countryCodes' ? defaultCountryItems() : defaultStringItems(kind);
  }
  const rows = await listContactLookupsByKind(tenant, kind);
  if (rows.length === 0) {
    return kind === 'countryCodes' ? defaultCountryItems() : defaultStringItems(kind);
  }
  if (kind === 'countryCodes') {
    const countries = rowsToCountryItems(rows);
    return needsContactCountryCodesCurate(countries)
      ? curatedContactCountryCodes()
      : countries;
  }
  return rowsToStringItems(rows);
}

export async function replaceContactLookupKind(
  kind: ContactLookupKind,
  items: string[] | ContactLookupCountryCode[],
  tenant = getRequestTenant(),
): Promise<string[] | ContactLookupCountryCode[]> {
  if (!tenant) throw new Error('Tenant context required');

  if (isContactLookupCountryKind(kind)) {
    const countries = (items as ContactLookupCountryCode[]).map((entry) => ({
      country: entry.country.trim(),
      code: entry.code.trim(),
    })).filter((entry) => entry.country && entry.code);
    const curated = needsContactCountryCodesCurate(countries)
      ? curatedContactCountryCodes()
      : countries;
    await replaceContactLookupsForKind(
      tenant,
      kind,
      curated.map((entry, index) => ({
        id: `${tenant}:${kind}:${slugifyLabel(entry.country, index)}`,
        kind,
        label: entry.country,
        meta: { code: entry.code },
        sortOrder: index,
      })),
    );
    return curated;
  }

  const labels = (items as string[]).map((label) => label.trim()).filter(Boolean);
  await replaceContactLookupsForKind(
    tenant,
    kind,
    labels.map((label, index) => ({
      id: `${tenant}:${kind}:${slugifyLabel(label, index)}`,
      kind,
      label,
      meta: null,
      sortOrder: index,
    })),
  );
  return labels;
}
