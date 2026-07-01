import type { Contact } from '@mms/shared';
import { normalizeToE164, parsePhoneNumber } from '@mms/shared';
import { loadContactRuntimeDefaults, loadContacts, type ContactRuntimeDefaults } from './contactService.js';
import { fetchObject, persistObject } from './dbSyncService.js';

const CONTACT_GOOGLE_SYNC_BY_USER_OBJECT_KEY = 'contact_google_sync_by_user';
const GOOGLE_PEOPLE_FIELDS =
  'names,emailAddresses,phoneNumbers,organizations,birthdays,addresses,biographies';

export interface ContactGoogleSyncConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  updatedAt?: string;
}

export interface ContactGoogleSyncConfigClient {
  clientId?: string;
  updatedAt?: string;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  isConnected: boolean;
}

type UserGoogleSyncMap = Record<string, ContactGoogleSyncConfig>;

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

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

export interface GoogleContactsSyncRunResult {
  contacts: Contact[];
  total: number;
  imported: number;
  skipped: number;
}

async function loadContactGoogleSyncConfigMap(): Promise<UserGoogleSyncMap> {
  const raw = await fetchObject(CONTACT_GOOGLE_SYNC_BY_USER_OBJECT_KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserGoogleSyncMap;
  }
  return {};
}

async function saveContactGoogleSyncConfigMap(map: UserGoogleSyncMap): Promise<void> {
  await persistObject(CONTACT_GOOGLE_SYNC_BY_USER_OBJECT_KEY, map);
}

export async function getContactGoogleSyncConfig(userId: string): Promise<ContactGoogleSyncConfig> {
  const map = await loadContactGoogleSyncConfigMap();
  return map[userId] ?? {};
}

export async function setContactGoogleSyncConfig(
  userId: string,
  config: ContactGoogleSyncConfig,
): Promise<ContactGoogleSyncConfig> {
  const map = await loadContactGoogleSyncConfigMap();
  const next: ContactGoogleSyncConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  map[userId] = next;
  await saveContactGoogleSyncConfigMap(map);
  return next;
}

export async function clearContactGoogleSyncConfig(userId: string): Promise<void> {
  const map = await loadContactGoogleSyncConfigMap();
  delete map[userId];
  await saveContactGoogleSyncConfigMap(map);
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

function isAllowedOAuthRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    return url.pathname === '/contacts' || url.pathname.endsWith('/contacts');
  } catch {
    return false;
  }
}

async function requestGoogleToken(params: URLSearchParams): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: params });
  return (await res.json()) as GoogleTokenResponse;
}

async function refreshGoogleAccessToken(userId: string): Promise<string> {
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
    emergencyContacts: [],
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

  const res = await fetch(url.toString(), {
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

  const existing = await loadContacts();
  const existingNames = new Set(
    existing.map((contact) => contact.name?.toLowerCase().trim()).filter(Boolean),
  );
  const fresh = mapped.filter(
    (contact) => !existingNames.has(contact.name?.toLowerCase().trim() || ''),
  );

  return {
    contacts: fresh,
    total: mapped.length,
    imported: fresh.length,
    skipped: mapped.length - fresh.length,
  };
}
