/** Report segment → Work directory drill-down (globle1 §4.3). */
export interface ContactsWorkDrillDown {
  lifecycleStage?: string;
  gender?: string;
  search?: string;
}

/** Per-user Work directory column layout (globle1 §3.4). */
export interface ContactColumnPref {
  key: string;
  enabled: boolean;
  order: number;
}

/** Saved report definition — logic only, re-run against live data (§4.4). */
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

export type ContactUserColumnPrefsMap = Record<string, ContactColumnPref[]>;
