import type { Contact, GoogleContactsSyncRunResult } from '@mms/shared';
import { mergeContacts } from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { fetchWithTimeout } from '../../lib/outboundUrl.js';
import { runInTransaction } from '../../db/database.js';
import { broadcastCollection } from '../../services/websocketService.js';
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
import { invalidateDuplicateScanCache } from './contactDuplicateScanUseCases.js';
import { getContactGoogleSyncConfig, GoogleSyncError } from './contactGoogleSyncConfig.js';
import { refreshGoogleAccessToken } from './contactGoogleSyncOAuth.js';
import {
  type GoogleConnection,
  mapGoogleConnectionToContact,
  extractPhoneKeys,
  extractEmails,
  hasMeaningfulChanges,
  PeerContactIndex,
} from './contactGoogleSyncMapping.js';

export type { GoogleContactsSyncRunResult };

const GOOGLE_PEOPLE_FIELDS =
  'names,emailAddresses,phoneNumbers,organizations,birthdays,addresses,biographies';

interface GooglePeopleResponse {
  connections?: GoogleConnection[];
  nextPageToken?: string;
  error?: { message?: string };
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

  const existingNames = peerContacts.length === 0 && candidateNames.length > 0
    ? await loadExistingNormalizedContactNames(candidateNames)
    : new Set<string>();

  const acceptedInserts: Contact[] = [];
  const acceptedUpdates: Contact[] = [];
  let skippedName = 0;
  let skippedUnique = 0;
  const peerIndex = new PeerContactIndex(peerContacts);

  await runInTransaction(async () => {
    for (const candidate of mapped) {
      const match = peerIndex.findMatch(candidate);
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
            peerIndex.update(match, prepared);
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
          peerIndex.add(prepared);
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
