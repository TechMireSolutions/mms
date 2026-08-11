import type { Contact, GoogleContactsSyncRunResult } from '@mms/shared';
import { normalizeToE164, parsePhoneNumber } from '@mms/shared';
import {
  loadContactRuntimeDefaults,
  loadExistingNormalizedContactNames,
  bulkSaveContacts,
  prepareContactRecord,
  type ContactRuntimeDefaults,
} from './contactService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { runInTransaction } from '../db/database.js';
import { fetchWithTimeout } from '../lib/outboundUrl.js';
import { getContactGoogleSyncConfig } from './contactGoogleSyncConfig.js';
import { GoogleSyncError, refreshGoogleAccessToken } from './contactGoogleSyncOAuth.js';
import { invalidateDuplicateScanCache } from './contactDuplicateScanService.js';
import {
  assertContactUniqueFields,
  ContactUniqueFieldError,
} from './contactUniqueValidationService.js';
import { broadcastCollection } from './websocketService.js';

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

  const phone = person.phoneNumbers?.[0]?.value || '';
  const parsedRaw = parsePhoneNumber(phone, defaults.defaultPhoneCountryCode);
  const e164 = normalizeToE164(parsedRaw.countryCode, parsedRaw.number);
  const parsed = parsePhoneNumber(e164, parsedRaw.countryCode);
  const email = person.emailAddresses?.[0]?.value || '';
  const org = person.organizations?.[0]?.name || '';
  const title = person.organizations?.[0]?.title || '';
  const bday = person.birthdays?.[0]?.date;
  const note = person.biographies?.[0]?.value || '';
  const addr = person.addresses?.[0];

  const contact: Contact = {
    id: crypto.randomUUID(),
    name,
    firstName: nameObj?.givenName || name.split(' ')[0],
    lastName: nameObj?.familyName || name.split(' ').slice(1).join(' '),
    phones: phone
      ? [{ label: defaults.phoneLabel, countryCode: parsed.countryCode, number: parsed.number }]
      : [],
    emails: email ? [{ label: defaults.emailLabel, address: email }] : [],
    employer: org,
    designation: title,
    notes: note,
    addresses: addr
      ? [
          {
            line1: addr.streetAddress || '',
            city: addr.city || '',
            state: addr.region || '',
            country: addr.country || '',
          },
        ]
      : [],
    socials: [],
    relationshipContacts: [],
    createdAt: new Date().toISOString().slice(0, 10),
  };

  if (bday?.year && bday?.month && bday?.day) {
    contact.dob = `${bday.year}-${String(bday.month).padStart(2, '0')}-${String(bday.day).padStart(2, '0')}`;
  }

  return contact;
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

/** Fetch Google Contacts server-side; returns new contacts not already in the directory. */
export async function runGoogleContactsSync(userId: string): Promise<GoogleContactsSyncRunResult> {
  const connections = await fetchGoogleConnectionsWithRefresh(userId);
  const defaults = await loadContactRuntimeDefaults();
  const mapped = connections
    .map((connection) => mapGoogleConnectionToContact(connection, defaults))
    .filter((contact): contact is Contact => contact != null);

  const tenant = getRequestTenant();
  const candidateNames = mapped.map((contact) => contact.name?.toLowerCase().trim() || '');
  const existingNames = tenant
    ? await loadExistingNormalizedContactNames(candidateNames)
    : new Set<string>();
  const fresh = mapped.filter(
    (contact) => !existingNames.has(contact.name?.toLowerCase().trim() || ''),
  );

  const skippedName = mapped.length - fresh.length;
  let skippedUnique = 0;
  let imported = 0;

  if (tenant && fresh.length > 0) {
    const prepared = await Promise.all(
      fresh.map((contact) => prepareContactRecord(contact, contact.id)),
    );
    const accepted: Contact[] = [];

    await runInTransaction(async () => {
      for (const candidate of prepared) {
        try {
          await assertContactUniqueFields(tenant, candidate, {
            language: 'en',
            additionalPeers: accepted,
          });
          accepted.push(candidate);
        } catch (error) {
          if (error instanceof ContactUniqueFieldError) {
            skippedUnique += 1;
            continue;
          }
          throw error;
        }
      }
      if (accepted.length > 0) {
        await bulkSaveContacts(accepted);
        await invalidateDuplicateScanCache();
      }
      imported = accepted.length;
    });
    if (imported > 0) await broadcastCollection('contacts');
  }

  return {
    total: mapped.length,
    imported,
    skippedName,
    skippedUnique,
    skipped: skippedName + skippedUnique,
  };
}
