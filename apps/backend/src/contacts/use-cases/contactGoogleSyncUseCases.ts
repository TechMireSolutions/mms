import { getRequestTenant } from '../../lib/tenantContext.js';
import {
  deleteContactGoogleSyncCredentials,
  findContactGoogleSyncCredentials,
  upsertContactGoogleSyncCredentials,
  type ContactGoogleSyncCredentialRecord,
} from '../../db/repositories/contactGoogleSyncRepository.js';
import { isOriginAllowedForAppDomain, isTrustedWorkspaceOrigin } from '@mms/shared';
import { fetchWithTimeout } from '../../lib/outboundUrl.js';
import type { Address, Contact, EmailAddress, GoogleContactsSyncRunResult, PhoneNumber } from '@mms/shared';
import { mergeContacts, normalizeToE164, parsePhoneNumber } from '@mms/shared';

import {
  loadContactRuntimeDefaults,
  loadExistingNormalizedContactNames,
  findContactsMatchingUniqueValues,
} from './contactLoadUseCases.js';
import { bulkSaveContacts } from './contactWriteUseCases.js';
import {
  prepareContactRecord,
  assertContactUniqueFields,
  ContactUniqueFieldError,
} from './contactValidationUseCases.js';
import type { ContactRuntimeDefaults } from './contactUseCases.js';
import { invalidateDuplicateScanCache } from './contactDuplicateScanUseCases.js';
import { broadcastCollection } from '../../services/websocketService.js';
import { runInTransaction } from '../../db/database.js';

// ==========================================
// CONFIG
// ==========================================
export type ContactGoogleSyncConfig = ContactGoogleSyncCredentialRecord;

export interface ContactGoogleSyncConfigClient {
  clientId?: string;
  updatedAt?: string;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  isConnected: boolean;
}

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant;
}

export async function getContactGoogleSyncConfig(userId: string): Promise<ContactGoogleSyncConfig> {
  return findContactGoogleSyncCredentials(requireTenant(), userId);
}

export async function setContactGoogleSyncConfig(
  userId: string,
  config: ContactGoogleSyncConfig,
): Promise<ContactGoogleSyncConfig> {
  return upsertContactGoogleSyncCredentials(requireTenant(), userId, {
    ...config,
    updatedAt: new Date().toISOString(),
  });
}

export async function clearContactGoogleSyncConfig(userId: string): Promise<void> {
  await deleteContactGoogleSyncCredentials(requireTenant(), userId);
}

export async function clearGoogleSyncTokens(userId: string): Promise<ContactGoogleSyncConfigClient> {
  const existing = await getContactGoogleSyncConfig(userId);
  const saved = await setContactGoogleSyncConfig(userId, {
    ...existing,
    accessToken: undefined,
    refreshToken: undefined,
  });
  return redactGoogleSyncConfigForClient(saved);
}

export function redactGoogleSyncConfigForClient(
  config: ContactGoogleSyncConfig,
): ContactGoogleSyncConfigClient {
  return {
    clientId: config.clientId,
    updatedAt: config.updatedAt,
    hasClientSecret: Boolean(config.clientSecret),
    hasRefreshToken: Boolean(config.refreshToken),
    isConnected: Boolean(config.accessToken),
  };
}

// ==========================================
// OAUTH
// ==========================================
interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

export class GoogleOAuthExchangeError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'GoogleOAuthExchangeError';
    this.code = code;
  }
}

export class GoogleSyncError extends Error {
  readonly code: 'not_connected' | 'session_expired' | 'api_error';

  constructor(message: string, code: 'not_connected' | 'session_expired' | 'api_error') {
    super(message);
    this.name = 'GoogleSyncError';
    this.code = code;
  }
}

/** Path must be Contacts Work; host must match apex/tenant allowlist (not path-only). */
function isAllowedOAuthRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    const pathOk = url.pathname === '/contacts' || url.pathname.endsWith('/contacts');
    if (!pathOk) return false;

    const origin = url.origin;
    const appDomain = process.env.MMS_APP_DOMAIN?.trim();
    if (appDomain) {
      return isOriginAllowedForAppDomain(origin, appDomain);
    }
    return isTrustedWorkspaceOrigin(origin);
  } catch {
    return false;
  }
}

async function requestGoogleToken(params: URLSearchParams): Promise<GoogleTokenResponse> {
  const res = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: params,
  });
  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshGoogleAccessToken(userId: string): Promise<string> {
  const config = await getContactGoogleSyncConfig(userId);
  if (!config.refreshToken || !config.clientId || !config.clientSecret) {
    await clearGoogleSyncTokens(userId);
    throw new GoogleSyncError('Google session expired', 'session_expired');
  }

  const params = new URLSearchParams({
    refresh_token: config.refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
  });

  const tokenResponse = await requestGoogleToken(params);
  if (tokenResponse.error || !tokenResponse.access_token) {
    await clearGoogleSyncTokens(userId);
    throw new GoogleSyncError(
      tokenResponse.error_description || tokenResponse.error || 'Google session expired',
      'session_expired',
    );
  }

  await setContactGoogleSyncConfig(userId, {
    ...config,
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? config.refreshToken,
  });

  return tokenResponse.access_token;
}

/** Exchange authorization code server-side so client secret never leaves the backend. */
export async function exchangeGoogleContactsOAuthCode(
  userId: string,
  code: string,
  redirectUri: string,
): Promise<ContactGoogleSyncConfigClient> {
  if (!isAllowedOAuthRedirectUri(redirectUri)) {
    throw new GoogleOAuthExchangeError('Invalid redirect URI');
  }

  const existing = await getContactGoogleSyncConfig(userId);
  if (!existing.clientId || !existing.clientSecret) {
    throw new GoogleOAuthExchangeError('Google OAuth credentials are not configured');
  }

  const params = new URLSearchParams({
    code,
    client_id: existing.clientId,
    client_secret: existing.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenResponse = await requestGoogleToken(params);

  if (tokenResponse.error) {
    throw new GoogleOAuthExchangeError(tokenResponse.error_description || tokenResponse.error, tokenResponse.error);
  }
  if (!tokenResponse.access_token) {
    throw new GoogleOAuthExchangeError('No access token returned from Google');
  }

  const saved = await setContactGoogleSyncConfig(userId, {
    ...existing,
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? existing.refreshToken,
  });

  return redactGoogleSyncConfigForClient(saved);
}


// ==========================================
// SYNC RUN
// ==========================================

const GOOGLE_PEOPLE_FIELDS =
  'names,emailAddresses,phoneNumbers,organizations,birthdays,addresses,biographies';

interface GoogleConnection {
  names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  birthdays?: Array<{ date?: { year?: number; month?: number; day?: number } }>;
  biographies?: Array<{ value?: string }>;
  addresses?: Array<{ streetAddress?: string; city?: string; region?: string; country?: string }>;
}

interface GooglePeopleResponse {
  connections?: GoogleConnection[];
  nextPageToken?: string;
  error?: { message?: string };
}

export type { GoogleContactsSyncRunResult };

function mapGoogleConnectionToContact(person: GoogleConnection, defaults: ContactRuntimeDefaults): Contact | null {
  const nameObj = person.names?.[0];
  const name = nameObj?.displayName || '';
  if (!name) return null;

  const phones: PhoneNumber[] = [];
  const seenPhoneDigits = new Set<string>();
  for (const phoneItem of person.phoneNumbers || []) {
    const raw = (phoneItem.value || '').trim();
    if (!raw) continue;
    const parsedRaw = parsePhoneNumber(raw, defaults.defaultPhoneCountryCode);
    const e164 = normalizeToE164(parsedRaw.countryCode, parsedRaw.number);
    const parsed = parsePhoneNumber(e164, parsedRaw.countryCode);
    const digits = `${parsed.countryCode}${parsed.number}`.replace(/\D/g, '');
    if (digits && !seenPhoneDigits.has(digits)) {
      seenPhoneDigits.add(digits);
      phones.push({
        label: defaults.phoneLabel,
        countryCode: parsed.countryCode,
        number: parsed.number,
      });
    }
  }

  const emails: EmailAddress[] = [];
  const seenEmails = new Set<string>();
  for (const emailItem of person.emailAddresses || []) {
    const raw = (emailItem.value || '').trim();
    if (!raw) continue;
    const lower = raw.toLowerCase();
    if (!seenEmails.has(lower)) {
      seenEmails.add(lower);
      emails.push({
        label: defaults.emailLabel,
        address: raw,
      });
    }
  }

  const addresses: Address[] = [];
  for (const addr of person.addresses || []) {
    if (addr.streetAddress || addr.city || addr.region || addr.country) {
      addresses.push({
        line1: addr.streetAddress || '',
        city: addr.city || '',
        state: addr.region || '',
        country: addr.country || '',
      });
    }
  }

  const org = person.organizations?.[0]?.name || '';
  const title = person.organizations?.[0]?.title || '';
  const bday = person.birthdays?.[0]?.date;
  const note = (person.biographies || [])
    .map((b) => b.value?.trim())
    .filter(Boolean)
    .join('\n\n');

  const contact: Contact = {
    id: crypto.randomUUID(),
    name,
    firstName: nameObj?.givenName || name.split(' ')[0],
    lastName: nameObj?.familyName || name.split(' ').slice(1).join(' '),
    phones,
    emails,
    employer: org,
    designation: title,
    notes: note,
    addresses,
    socials: [],
    relationshipContacts: [],
    createdAt: new Date().toISOString().slice(0, 10),
  };

  if (bday?.year && bday?.month && bday?.day) {
    contact.dob = `${bday.year}-${String(bday.month).padStart(2, '0')}-${String(bday.day).padStart(2, '0')}`;
  }

  return contact;
}

function extractPhoneKeys(contact: Contact): string[] {
  const keys = new Set<string>();
  for (const phone of contact.phones ?? []) {
    const raw = String(phone.number || '').trim();
    if (!raw) continue;
    const digits = raw.replace(/\D/g, '');
    const cc = String(phone.countryCode || '').replace(/\D/g, '');
    const withCountry = `${cc}${digits}`;
    if (digits) keys.add(digits);
    if (withCountry) keys.add(withCountry);
    if (digits.length >= 10) keys.add(digits.slice(-10));
    if (withCountry.length >= 10) keys.add(withCountry.slice(-10));
  }
  return [...keys];
}

function extractEmails(contact: Contact): string[] {
  const emails = new Set<string>();
  for (const email of contact.emails ?? []) {
    const raw = String(email.address || '').trim().toLowerCase();
    if (raw) emails.add(raw);
  }
  return [...emails];
}

function findMatchingPeer(candidate: Contact, peers: Contact[]): Contact | undefined {
  const candidatePhones = new Set(extractPhoneKeys(candidate));
  const candidateEmails = new Set(extractEmails(candidate));
  const candidateName = candidate.name.trim().toLowerCase();

  for (const peer of peers) {
    for (const key of extractPhoneKeys(peer)) {
      if (candidatePhones.has(key)) return peer;
    }
    for (const email of extractEmails(peer)) {
      if (candidateEmails.has(email)) return peer;
    }
    if (candidateName && peer.name.trim().toLowerCase() === candidateName) {
      return peer;
    }
  }
  return undefined;
}

function hasMeaningfulChanges(original: Contact, merged: Contact): boolean {
  const phonesChanged = (merged.phones?.length ?? 0) !== (original.phones?.length ?? 0);
  const emailsChanged = (merged.emails?.length ?? 0) !== (original.emails?.length ?? 0);
  const addressesChanged = (merged.addresses?.length ?? 0) !== (original.addresses?.length ?? 0);
  const notesChanged = (merged.notes || '') !== (original.notes || '');
  const employerChanged = (merged.employer || '') !== (original.employer || '');
  const designationChanged = (merged.designation || '') !== (original.designation || '');
  const dobChanged = (merged.dob || '') !== (original.dob || '');

  return (
    phonesChanged ||
    emailsChanged ||
    addressesChanged ||
    notesChanged ||
    employerChanged ||
    designationChanged ||
    dobChanged
  );
}

async function fetchGoogleConnectionsPage(
  accessToken: string,
  pageToken?: string,
): Promise<GooglePeopleResponse> {
  const url = new URL('https://people.googleapis.com/v1/people/me/connections');
  url.searchParams.set('personFields', GOOGLE_PEOPLE_FIELDS);
  url.searchParams.set('pageSize', '1000');
  if (pageToken) url.searchParams.set('pageToken', pageToken);

  const res = await fetchWithTimeout(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    throw new GoogleSyncError('Google access token expired', 'session_expired');
  }

  const peopleResponse = (await res.json()) as GooglePeopleResponse;
  if (peopleResponse.error?.message) {
    throw new GoogleSyncError(peopleResponse.error.message, 'api_error');
  }

  return peopleResponse;
}

async function fetchAllGoogleConnections(accessToken: string): Promise<GoogleConnection[]> {
  const all: GoogleConnection[] = [];
  let pageToken = '';

  do {
    const connectionsPage = await fetchGoogleConnectionsPage(accessToken, pageToken || undefined);
    all.push(...(connectionsPage.connections || []));
    pageToken = connectionsPage.nextPageToken || '';
  } while (pageToken);

  return all;
}

async function fetchGoogleConnectionsWithRefresh(userId: string): Promise<GoogleConnection[]> {
  const config = await getContactGoogleSyncConfig(userId);
  if (!config.accessToken) {
    throw new GoogleSyncError('Google account not connected', 'not_connected');
  }

  try {
    return await fetchAllGoogleConnections(config.accessToken);
  } catch (error) {
    if (!(error instanceof GoogleSyncError) || error.code !== 'session_expired') {
      throw error;
    }
    const refreshed = await refreshGoogleAccessToken(userId);
    return fetchAllGoogleConnections(refreshed);
  }
}

/** Fetch Google Contacts server-side; enriches existing contacts or creates new contacts. */
export async function runGoogleContactsSync(userId: string): Promise<GoogleContactsSyncRunResult> {
  const connections = await fetchGoogleConnectionsWithRefresh(userId);
  const defaults = await loadContactRuntimeDefaults();
  const mapped = connections
    .map((connection) => mapGoogleConnectionToContact(connection, defaults))
    .filter((contact): contact is Contact => contact != null);

  const tenant = getRequestTenant();
  if (!tenant || mapped.length === 0) {
    return {
      total: mapped.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      skippedName: 0,
      skippedUnique: 0,
    };
  }

  const allPhoneDigits = [...new Set(mapped.flatMap(extractPhoneKeys))];
  const allEmails = [...new Set(mapped.flatMap(extractEmails))];
  const candidateNames = mapped.map((contact) => contact.name?.toLowerCase().trim() || '').filter(Boolean);

  const peerContacts = await findContactsMatchingUniqueValues({
    phoneDigits: allPhoneDigits,
    emails: allEmails,
    scalars: candidateNames.map((name) => ({ fieldKey: 'name', normalized: name })),
  }).catch(() => []);

  // Also check legacy name index if peers array is empty
  const existingNames = peerContacts.length === 0 && candidateNames.length > 0
    ? await loadExistingNormalizedContactNames(candidateNames)
    : new Set<string>();

  const acceptedInserts: Contact[] = [];
  const acceptedUpdates: Contact[] = [];
  let skippedName = 0;
  let skippedUnique = 0;
  const currentPeers = [...peerContacts];

  await runInTransaction(async () => {
    for (const candidate of mapped) {
      const match = findMatchingPeer(candidate, currentPeers);
      const isExistingNameOnly = !match && existingNames.has(candidate.name.trim().toLowerCase());

      if (match) {
        const merged = mergeContacts(match, candidate);
        if (hasMeaningfulChanges(match, merged)) {
          try {
            const prepared = await prepareContactRecord(merged, match.id);
            await assertContactUniqueFields(tenant, prepared, {
              language: 'en',
              excludeContactIds: [match.id],
            });
            acceptedUpdates.push(prepared);
            // Update local peer cache
            const idx = currentPeers.findIndex((p) => p.id === match.id);
            if (idx !== -1) currentPeers[idx] = prepared;
          } catch (error) {
            if (error instanceof ContactUniqueFieldError) {
              skippedUnique += 1;
              continue;
            }
            throw error;
          }
        } else {
          skippedName += 1;
        }
      } else if (isExistingNameOnly) {
        skippedName += 1;
      } else {
        try {
          const prepared = await prepareContactRecord(candidate, candidate.id);
          await assertContactUniqueFields(tenant, prepared, {
            language: 'en',
            additionalPeers: acceptedInserts,
          });
          acceptedInserts.push(prepared);
          currentPeers.push(prepared);
        } catch (error) {
          if (error instanceof ContactUniqueFieldError) {
            skippedUnique += 1;
            continue;
          }
          throw error;
        }
      }
    }

    if (acceptedInserts.length > 0) {
      await bulkSaveContacts(acceptedInserts);
    }
    if (acceptedUpdates.length > 0) {
      await bulkSaveContacts(acceptedUpdates);
    }
    if (acceptedInserts.length > 0 || acceptedUpdates.length > 0) {
      await invalidateDuplicateScanCache();
    }
  });

  const imported = acceptedInserts.length;
  const updated = acceptedUpdates.length;
  if (imported > 0 || updated > 0) {
    await broadcastCollection('contacts');
  }

  return {
    total: mapped.length,
    imported,
    updated,
    skippedName,
    skippedUnique,
    skipped: skippedName + skippedUnique,
  };
}
