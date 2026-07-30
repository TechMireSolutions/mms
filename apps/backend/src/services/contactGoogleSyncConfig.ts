import { fetchObject, persistObject } from './dbSyncService.js';

const CONTACT_GOOGLE_SYNC_BY_USER_OBJECT_KEY = 'contact_google_sync_by_user';

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

async function loadContactGoogleSyncConfigMap(): Promise<UserGoogleSyncMap> {
  const raw = await fetchObject(CONTACT_GOOGLE_SYNC_BY_USER_OBJECT_KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserGoogleSyncMap;
  }
  return {};
}

async function saveContactGoogleSyncConfigMap(configByUser: UserGoogleSyncMap): Promise<void> {
  await persistObject(CONTACT_GOOGLE_SYNC_BY_USER_OBJECT_KEY, configByUser);
}

export async function getContactGoogleSyncConfig(userId: string): Promise<ContactGoogleSyncConfig> {
  const configByUser = await loadContactGoogleSyncConfigMap();
  return configByUser[userId] ?? {};
}

export async function setContactGoogleSyncConfig(
  userId: string,
  config: ContactGoogleSyncConfig,
): Promise<ContactGoogleSyncConfig> {
  const configByUser = await loadContactGoogleSyncConfigMap();
  const updatedConfig: ContactGoogleSyncConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  configByUser[userId] = updatedConfig;
  await saveContactGoogleSyncConfigMap(configByUser);
  return updatedConfig;
}

export async function clearContactGoogleSyncConfig(userId: string): Promise<void> {
  const configByUser = await loadContactGoogleSyncConfigMap();
  delete configByUser[userId];
  await saveContactGoogleSyncConfigMap(configByUser);
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
