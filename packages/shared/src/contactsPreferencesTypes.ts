/** Report segment → Work directory drill-down (globle1 §4.3). */
export interface ContactsWorkDrillDown {
  gender?: string;
  search?: string;
}

export interface ContactColumnPreference {
  key: string;
  enabled: boolean;
  order: number;
}

export type ContactColumnPref = ContactColumnPreference;

/** Saved report definition — logic only, re-run against live data. */
export interface ContactsSavedReport {
  id: string;
  name: string;
  drillDown: ContactsWorkDrillDown;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  lastRunAt?: string;
  /** Defaults to private when omitted (legacy presets). */
  shareScope?: 'private' | 'roles' | 'users' | 'global';
  sharedWithRoles?: string[];
  sharedWithUserIds?: string[];
}

export type ContactUserColumnPreferencesMap = Record<string, ContactColumnPreference[]>;
