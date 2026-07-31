/** Google Contacts sync client contracts. */

/** Client configuration model for Google Contacts OAuth and synchronization. */
export interface ContactGoogleSyncConfigClient {
  clientId?: string;
  clientSecret?: string;
  clearTokens?: boolean;
  updatedAt?: string;
  hasClientSecret?: boolean;
  hasRefreshToken?: boolean;
  isConnected?: boolean;
}

/** Result snapshot returned when running a Google Contacts sync operation. */
export interface GoogleContactsSyncRunResult {
  total: number;
  imported: number;
  skipped: number;
}
